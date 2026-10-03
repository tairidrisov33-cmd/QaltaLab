// Полный аудит: 10 опытов от вопроса до сравнения серий, листы урока,
// пример, класс, ссылки, оба языка, обе темы, телефон и компьютер.
// Измерение в тесте подменяется реалистичными точками (сам сайт не меняется).
import { launch, sleep } from './cdp.mjs';

const BASE = process.env.BASE || 'http://localhost:8766/';
const ONLY = process.env.ONLY ? process.env.ONLY.split(',') : null;
const DATA = {
  dombra: [[70, 148], [60, 170], [52.5, 199], [46.5, 219], [35, 290], [26, 401]],
  pitch: [[4, 452], [8, 316], [12, 262], [16, 222], [20, 203]],
  pendulum: [[20, 0.93], [40, 1.22], [60, 1.59], [80, 1.74], [100, 2.04]],
  hearing: [[500, 22], [1000, 15], [2000, 14], [4000, 18], [8000, 28], [12000, 44], [15000, 70], [17000, 100, false], [19000, 100, false]],
  timing: [[2, 2.3], [4, 4.5], [8, 9.4], [16, 18.1]],
  hick: [[1, 320], [2, 420], [4, 515], [8, 610]],
  fitts: [[1.58, 310], [2.63, 405], [2.74, 415], [3.78, 515]],
  practice: [[1, 2400], [2, 1900], [3, 1680], [4, 1520], [5, 1420], [6, 1330]],
  memory: [[3, 100], [4, 100], [5, 95], [6, 80], [7, 45], [8, 20]],
  pulse: [[0, 132], [30, 112], [60, 99], [90, 91]]
};
const LABS = Object.keys(DATA).filter(id => !ONLY || ONLY.includes(id));
const P = await launch(9350);
const issues = [];
const bad = (where, what) => issues.push(where + ': ' + what);
let q = 0;
const fresh = (hash, wait = 1300) => P.go(BASE + '?f=' + (++q) + hash, wait);
const clickText = async (re, sel = '#view button') => {
  const ok = await P.ev(`(() => { const b = [...document.querySelectorAll(${JSON.stringify(sel)})].find(b => ${re}.test(b.innerText.trim()) && !b.disabled && b.offsetParent); if (!b) return false; b.click(); return true; })()`);
  await sleep(350);
  return ok;
};
// Непереведённые строки на экране в казахском: текст, который есть ключом словаря.
const untranslated = () => P.ev(`(() => {
  if (A.i18n.lang !== 'kk') return [];
  const d = A.i18n.dict, out = new Set();
  const w = document.createTreeWalker(document.getElementById('view'), NodeFilter.SHOW_TEXT);
  let n; while ((n = w.nextNode())) { const t = n.nodeValue.trim(); if (t.length > 2 && d[t] !== undefined && d[t] !== t) out.add(t.slice(0, 60)); }
  return [...out].slice(0, 5);
})()`);

for (const [lang, w, h, mob, theme] of [['ru', 1280, 900, false, 'light'], ['kk', 390, 844, true, 'dark']]) {
  await P.view(w, h, mob);
  await fresh('#/');
  await P.ev(`localStorage.setItem('spl.lang','${lang}'); localStorage.setItem('spl.theme','${theme}'); true`);
  for (const id of LABS) {
    const tag = `${lang}/${w}/${id}`;
    await fresh('#/lab/' + id, 1200);
    const pts = JSON.stringify(DATA[id].map(p => p.length > 2 ? { x: p[0], y: p[1], heard: p[2] } : { x: p[0], y: p[1] }));
    // подмена измерения: сразу отдаём точки и переходим к графику
    await P.ev(`(() => { const lab = A.lab.byId('${id}'); lab.__m = lab.__m || lab.measure; lab.measure = function (host, api) { api.setPoints(${pts}); setTimeout(api.done, 50); }; return true; })()`);
    const t0 = await P.ev(`document.querySelector('.lab-h') && document.querySelector('.lab-h').innerText`);
    if (!t0) bad(tag, 'нет заголовка опыта');
    const lesson = await P.ev(`!!document.querySelector('.lesson-link')`);
    if (!lesson) bad(tag, 'нет ссылки на лист урока');
    await P.ev(`document.querySelector('#view .btn--primary').click(); true`); await sleep(350);
    // гипотеза + рисунок
    const nh = await P.ev(`document.querySelectorAll('.hyp button').length`);
    if (nh < 2) bad(tag, 'мало гипотез: ' + nh);
    await P.ev(`document.querySelector('.hyp button').click(); true`);
    await P.ev(`(() => { const c = document.querySelector('.predict__cv'); if (c) c.scrollIntoView({block:'center'}); return true; })()`); await sleep(500);
    const b = await P.ev(`(() => { const c = document.querySelector('.predict__cv'); if (!c) return null; const r = c.getBoundingClientRect(); return {x:r.left,y:r.top,w:r.width,h:r.height}; })()`);
    if (!b) bad(tag, 'нет поля предсказания');
    else { const pts2 = []; for (let t = 0; t <= 1; t += 0.1) pts2.push([b.x + 50 + t * (b.w - 70), b.y + b.h - 50 - t * (b.h - 80) * 0.7]); await P.stroke(pts2); }
    await P.ev(`[...document.querySelectorAll('#view .btn--primary')].pop().click(); true`); await sleep(900);
    // график
    const fit = await P.ev(`({ chart: !!document.querySelector('canvas.chart'), sliders: document.querySelectorAll('#view input[type=range]').length, r2: (document.querySelector('.match__n') || {}).innerText, legend: (document.querySelector('.legend') || {}).innerText })`);
    if (!fit.chart) bad(tag, 'нет графика на шаге подгонки');
    if (!fit.sliders) bad(tag, 'нет ползунков');
    if (!/твоё|болжау/i.test(fit.legend || '')) bad(tag, 'в легенде нет предсказания');
    // подвигать первый ползунок и проверить, что R² меняется
    const r2b = await P.ev(`(() => { const s = document.querySelector('#view input[type=range]'); const was = document.querySelector('.match__n').innerText; s.value = (+s.min + +s.max) / 2; s.dispatchEvent(new Event('input')); return was + ' → ' + document.querySelector('.match__n').innerText; })()`);
    // другая модель, если есть, потом обратно
    const models = await P.ev(`document.querySelectorAll('.models button').length`);
    if (models > 1) { await P.ev(`document.querySelectorAll('.models button')[1].click(); true`); await sleep(300); await P.ev(`document.querySelectorAll('.models button')[0].click(); true`); await sleep(300); }
    await clickText('/Сбросить|Қалпына/');
    if (lang === 'ru' && id === 'dombra') await P.shot(`full-${lang}-${id}-fit`, true);
    const fitR2 = await P.ev(`document.querySelector('.match__n').innerText`);
    await P.ev(`[...document.querySelectorAll('#view .btn--primary')].pop().click(); true`); await sleep(1000);
    // результат
    const res = await P.ev(`({
      found: (document.querySelector('.found__you') || {}).innerText || '',
      verdict: (document.querySelector('.verdict b') || {}).innerText || '',
      pvr: !!document.querySelector('.pvr'),
      under: !!document.querySelector('details.under'),
      explain: !!document.querySelector('.law-what'),
      law: (document.querySelector('.law__name') || {}).innerText || '',
      zerde: !!document.querySelector('.zerde'),
      whatif: document.querySelectorAll('.whatif__b').length,
      csv: [...document.querySelectorAll('#view button')].some(b => /CSV/.test(b.innerText)),
      chart: !!document.querySelector('.law-data canvas'),
      nan: /NaN|undefined|null|Infinity/.test(document.getElementById('view').innerText)
    })`);
    if (!res.found) bad(tag, 'пустой блок «что обнаружил»');
    if (!res.verdict) bad(tag, 'нет вердикта гипотезы');
    if (!res.pvr) bad(tag, 'нет карточки «предсказание и реальность»');
    if (!res.under) bad(tag, 'нет «под капотом» на результате');
    if (!res.law) bad(tag, 'нет закона');
    if (!res.zerde) bad(tag, 'нет Zerde');
    if (!res.csv) bad(tag, 'нет кнопки CSV');
    if (!res.chart) bad(tag, 'нет графика на результате');
    if (res.nan) bad(tag, 'на экране NaN/undefined/null');
    if (res.whatif < 2) bad(tag, 'мало вариантов «попробуй иначе»');
    const un = await untranslated();
    if (un.length) bad(tag, 'не переведено: ' + un.join(' | '));
    // CSV — проверим, что функция отрабатывает без ошибок
    await clickText('/CSV/');
    if (w === 390) await P.shot(`full-${lang}-${id}-law`, true);
    // вариант: новая серия, снова подмена, сравнение
    await P.ev(`document.querySelector('.whatif__b').click(); true`); await sleep(800);
    await P.ev(`[...document.querySelectorAll('#view .btn--primary')].pop().click(); true`); await sleep(1000);
    const cmp = await P.ev(`(document.querySelector('.compare') || {}).innerText || ''`);
    if (!cmp) bad(tag, 'нет сравнения серий после «попробуй иначе»');
    if (/NaN/.test(cmp)) bad(tag, 'NaN в сравнении');
    const ov = await P.overflow();
    if (ov > 0) bad(tag, 'шире экрана на ' + ov);
    console.log(tag, '| R² подгонка', fitR2, '| ползунок', r2b, '|', res.verdict.replace(/\n/g, ' '), '|', res.law);
  }
  // листы для урока
  for (const id of LABS) {
    await fresh('#/lesson/' + id, 900);
    const L = await P.ev(`({ t: (document.querySelector('.lesson__t') || {}).innerText, rows: document.querySelectorAll('.lesson__table tbody tr').length, q: document.querySelectorAll('.lesson__qs li').length, print: [...document.querySelectorAll('button')].some(b => /Печат|Басып/.test(b.innerText)) })`);
    if (!L.t || L.rows < 4 || L.q < 2) bad(`${lang}/lesson/${id}`, JSON.stringify(L));
    const un = await untranslated();
    if (un.length) bad(`${lang}/lesson/${id}`, 'не переведено: ' + un.join(' | '));
    if ((await P.overflow()) > 0) bad(`${lang}/lesson/${id}`, 'шире экрана');
  }
  // пример результата, пример класса, неверный класс
  for (const hash of ['#/demo/pendulum', '#/class/demo', '#/c/ZZZZZ', '#/lab/nope']) {
    await fresh(hash, 2200);
    const txt = await P.ev(`document.getElementById('view').innerText.slice(0, 120).replace(/\\n/g, ' ')`);
    const un = await untranslated();
    if (un.length) bad(`${lang}${hash}`, 'не переведено: ' + un.join(' | '));
    if ((await P.overflow()) > 0) bad(`${lang}${hash}`, 'шире экрана');
    console.log(lang, hash, '→', txt);
  }
  // главная: непереведённое
  await fresh('#/', 1800);
  const unh = await untranslated();
  if (unh.length) bad(`${lang}/home`, 'не переведено: ' + unh.join(' | '));
}
// внешние ссылки главной
await P.view(1280, 900, false);
await P.ev(`localStorage.setItem('spl.lang','ru'); true`);
await fresh('#/', 1800);
const links = await P.ev(`[...new Set([...document.querySelectorAll('a[href^="http"]')].map(a => a.href))]`);
console.log('LINKS', JSON.stringify(links));
console.log('ISSUES', JSON.stringify(issues, null, 1));
console.log('CONSOLE', JSON.stringify(P.errors));
P.close(); process.exit(0);
