// Собирает SVG-инфографику для README из тех же данных, что и сайт:
// числа — из js/facts.js, казахские подписи — из словаря js/i18n.js.
// Запуск: node tools/make-readme-assets.js
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'docs', 'readme');
fs.mkdirSync(OUT, { recursive: true });

const ctx = { window: {}, localStorage: { getItem() { return null; } }, navigator: { language: 'ru' }, document: { documentElement: { setAttribute() {} } } };
vm.createContext(ctx);
for (const f of ['js/i18n.js', 'js/i18n-labs.js', 'js/facts.js']) vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), ctx);
const A = ctx.window.A;
const F = A.facts, P = F.pilot;
const KK = A.i18n.dict;
const tr = (s, lang) => (lang === 'kk' ? (KK[s] || s) : s);

const C = { bg: '#FBFAF4', card: '#FFFFFF', line: '#DADFD5', ink: '#182B24', mute: '#5F6B63', acc: '#426D4F', soft: '#E2ECDD' };
const FONT = "font-family=\"'Segoe UI', Manrope, Arial, sans-serif\"";
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const pc = n => F.fmt(F.pct(n), F.pct(n) % 1 ? 1 : 0) + '%';

// Простой перенос строк для SVG: по числу символов.
function lines(text, max) {
  const out = []; let cur = '';
  for (const w of text.split(' ')) {
    if ((cur + ' ' + w).trim().length > max) { out.push(cur.trim()); cur = w; } else cur += ' ' + w;
  }
  if (cur.trim()) out.push(cur.trim());
  return out;
}
function text(x, y, str, size, color, weight, max, lh) {
  const ls = max ? lines(str, max) : [str];
  return ls.map((l, i) => `<text x="${x}" y="${y + i * (lh || size * 1.3)}" font-size="${size}" fill="${color}" font-weight="${weight || 400}" ${FONT}>${esc(l)}</text>`).join('');
}
function svg(w, h, body, title) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(title)}"><title>${esc(title)}</title><rect width="${w}" height="${h}" rx="20" fill="${C.bg}"/>${body}</svg>\n`;
}

/* ---------- пилотное тестирование ---------- */
function pilot(lang) {
  const t = s => tr(s, lang);
  const W = 960, H = 640;
  let b = text(40, 58, t('Пилотное тестирование'), 30, C.ink, 700);
  b += text(40, 90, A.i18n.dict && lang === 'kk'
    ? `${P.n} қатысушы · пилоттық тестілеу`
    : `${P.n} участников · пилотное тестирование`, 17, C.mute);
  const kpi = [
    [F.fmt(P.mobile.avg, 2) + ' / 5', t('удобство с телефона')],
    [F.fmt(P.overall.avg, 2) + ' / 5', t('общая оценка QaltaLab')],
    [pc(P.format.yes + P.format.rather), lang === 'kk' ? '«Иә» не «Иә болар»: формат STEM-ді түсінуге көмектеседі' : '«Да» или «Скорее да»: формат помогает понимать STEM'],
    [pc(P.liked[0][1]), t('отметили интерактивные эксперименты')]
  ];
  kpi.forEach((k, i) => {
    const x = 40 + i * 222;
    b += `<rect x="${x}" y="116" width="206" height="150" rx="14" fill="${C.card}" stroke="${C.line}"/>`;
    b += text(x + 18, 166, k[0], 32, C.acc, 700);
    b += text(x + 18, 196, k[1], 14, C.mute, 400, 26, 19);
  });
  b += `<rect x="40" y="286" width="880" height="${54 + P.liked.length * 46}" rx="14" fill="${C.card}" stroke="${C.line}"/>`;
  b += text(60, 320, lang === 'kk' ? 'НЕ ҰНАДЫ (БІРНЕШЕУІН ТАҢДАУҒА БОЛАТЫН)' : 'ЧТО ПОНРАВИЛОСЬ (МОЖНО БЫЛО ВЫБРАТЬ НЕСКОЛЬКО)', 13, C.mute, 700);
  P.liked.forEach((l, i) => {
    const y = 350 + i * 46;
    const w = Math.round(400 * l[1] / P.n);
    b += text(60, y + 14, t(l[0]), 16, C.ink, 600);
    b += `<rect x="370" y="${y + 2}" width="400" height="14" rx="7" fill="${C.soft}"/><rect x="370" y="${y + 2}" width="${w}" height="14" rx="7" fill="${C.acc}"/>`;
    b += text(790, y + 14, `${pc(l[1])} · ${l[1]}/${P.n}`, 14, C.mute, 600);
  });
  const note = lang === 'kk'
    ? `${pc(P.wouldUse.yes)} QaltaLab-ты сабақта не үйде міндетті түрде қолданғысы келеді (${P.wouldUse.yes}/${P.n}), тағы ${pc(P.wouldUse.maybe)} — «мүмкін» (${P.wouldUse.maybe}/${P.n}).`
    : `${pc(P.wouldUse.yes)} точно хотели бы использовать QaltaLab на уроках или дома (${P.wouldUse.yes}/${P.n}), ещё ${pc(P.wouldUse.maybe)} — «возможно» (${P.wouldUse.maybe}/${P.n}).`;
  b += text(40, 594, note, 15, C.ink, 400, 110);
  b += text(40, 622, lang === 'kk' ? `Пилоттық тестілеу, n = ${P.n}.` : `Пилотное тестирование, n = ${P.n}.`, 13, C.mute);
  return svg(W, H, b, t('Пилотное тестирование'));
}

/* ---------- цепочки ---------- */
function chain(title, sub, steps, lang, key) {
  const W = 960, n = steps.length, gap = 14, bw = (880 - gap * (n - 1)) / n, H = 290;
  let b = text(40, 58, title, 28, C.ink, 700) + text(40, 90, sub, 17, C.mute);
  steps.forEach((s, i) => {
    const x = 40 + i * (bw + gap);
    const on = i === key;
    b += `<rect x="${x}" y="120" width="${bw}" height="136" rx="14" fill="${on ? C.acc : C.card}" stroke="${on ? C.acc : C.line}"/>`;
    b += text(x + 14, 146, String(i + 1).padStart(2, '0'), 12, on ? '#CFE0CF' : C.mute, 700);
    const tl = lines(s[0], Math.floor(bw / 9.5)).length;
    b += text(x + 14, 174, s[0], 16, on ? '#FFFFFF' : C.ink, 700, Math.floor(bw / 9.5), 20);
    if (s[1]) b += text(x + 14, 174 + tl * 20 + 4, s[1], 12, on ? '#E4EEE2' : C.mute, 400, Math.floor(bw / 7.2), 15);
    if (i < n - 1) b += `<text x="${x + bw + gap / 2}" y="193" text-anchor="middle" font-size="14" fill="${C.mute}" ${FONT}>→</text>`;
  });
  return svg(W, H, b, title);
}

const HOW = {
  ru: [['Вопрос'], ['Гипотеза', 'до опыта'], ['Измерение телефоном'], ['Свои данные', 'у каждого свои'], ['График и модель', 'R² сразу'], ['Открытие', 'закон и «почему»']],
  kk: [['Сұрақ'], ['Болжам', 'тәжірибеге дейін'], ['Телефонмен өлшеу'], ['Өз деректерің', 'әркімде өзінікі'], ['График және модель', 'R² бірден'], ['Жаңалық', 'заң және «неге»']]
};
const PHONE = {
  ru: [['Микрофон', 'частота звука · Бутылочный оркестр'], ['Динамик', 'чистые тона · Твой слух'], ['Камера', 'яркость пальца, пульс · Пульс камерой'], ['Касания и таймер', 'время реакции · 6 опытов'], ['JavaScript', 'подгонка кривой и R²'], ['Canvas', 'графики']],
  kk: [['Микрофон', 'дыбыс жиілігі · Бөтелке оркестрі'], ['Динамик', 'таза дыбыс · Сенің есту қабілетің'], ['Камера', 'саусақ жарықтығы, тамыр · Камерамен тамыр соғысы'], ['Жанасу және таймер', 'реакция уақыты · 6 тәжірибе'], ['JavaScript', 'қисықты сәйкестендіру және R²'], ['Canvas', 'графиктер']]
};

const files = {
  'pilot-ru.svg': pilot('ru'),
  'pilot-kk.svg': pilot('kk'),
  'how-ru.svg': chain('Как работает QaltaLab', 'Не симуляция — собственный эксперимент ученика.', HOW.ru, 'ru', 2),
  'how-kk.svg': chain('QaltaLab қалай жұмыс істейді', 'Симуляция емес — оқушының өз тәжірибесі.', HOW.kk, 'kk', 2),
  'phone-ru.svg': chain('Телефон — лабораторный прибор', 'Только те возможности, которые реально используют опыты.', PHONE.ru, 'ru', -1),
  'phone-kk.svg': chain('Телефон — зертхана құралы', 'Тәжірибелер шын пайдаланатын мүмкіндіктер ғана.', PHONE.kk, 'kk', -1)
};
for (const [name, content] of Object.entries(files)) {
  fs.writeFileSync(path.join(OUT, name), content);
  console.log('docs/readme/' + name);
}
