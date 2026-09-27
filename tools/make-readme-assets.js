// Инфографика README в стиле сайта: та же палитра, те же значки (js/icons.js),
// числа — из js/facts.js, казахские названия опытов — из словаря сайта.
// Запуск: node tools/make-readme-assets.js  → docs/readme/*-ru.svg, *-kk.svg
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'docs', 'readme');
fs.mkdirSync(OUT, { recursive: true });

const noop = () => {};
const ctx = {
  window: {}, localStorage: { getItem: () => null }, navigator: { language: 'ru' },
  document: { documentElement: { setAttribute: noop }, addEventListener: noop, readyState: 'complete', querySelectorAll: () => [] }
};
vm.createContext(ctx);
for (const f of ['js/i18n.js', 'js/i18n-labs.js', 'js/facts.js', 'js/icons.js']) {
  try { vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), ctx); } catch (e) { /* значкам DOM не нужен */ }
}
const A = ctx.window.A;
const F = A.facts, P = F.pilot, ICON = A.iconPaths;
const KK = A.i18n.dict;

/* ---------- стиль сайта ---------- */
const C = {
  bg: '#F7F6F0', card: '#FFFFFF', line: '#DDE2D7', ink: '#182B24', mute: '#5F6B63', faint: '#8A958C',
  acc: '#426D4F', accInk: '#2F5539', soft: '#E2ECDD', lime: '#E7EBC5', dark1: '#2C4A36', dark2: '#1C3024',
  phys: '#3E6FA8', bio: '#3F8A55', cog: '#7A5BB0'
};
const SANS = "'Segoe UI', Manrope, 'Helvetica Neue', Arial, sans-serif";
const SERIF = "Georgia, 'Times New Roman', serif";
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const pc = n => F.fmt(F.pct(n), F.pct(n) % 1 ? 1 : 0) + '%';
const L = (lang, ru, kk) => (lang === 'kk' ? kk : ru);

function wrap(text, max) {
  const out = []; let cur = '';
  for (const w of String(text).split(' ')) {
    if ((cur + ' ' + w).trim().length > max && cur) { out.push(cur.trim()); cur = w; } else cur += ' ' + w;
  }
  if (cur.trim()) out.push(cur.trim());
  return out;
}
function t(x, y, s, o = {}) {
  const size = o.size || 15, lh = o.lh || Math.round(size * 1.35);
  const ls = o.max ? wrap(s, o.max) : [s];
  return ls.map((l, i) => `<text x="${x}" y="${y + i * lh}" font-size="${size}" fill="${o.fill || C.ink}" font-weight="${o.w || 400}" font-family="${o.serif ? SERIF : SANS}"${o.anchor ? ` text-anchor="${o.anchor}"` : ''}${o.ls ? ` letter-spacing="${o.ls}"` : ''}>${esc(l)}</text>`).join('');
}
function icon(name, x, y, size, color) {
  const k = size / 24;
  return `<g transform="translate(${x} ${y}) scale(${k})" fill="none" stroke="${color}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${ICON[name] || ''}</g>`;
}
const defs = `<defs>
  <linearGradient id="dk" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${C.dark1}"/><stop offset="1" stop-color="${C.dark2}"/></linearGradient>
  <linearGradient id="mk" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#5A8A63"/><stop offset="1" stop-color="#2F5539"/></linearGradient>
  <pattern id="grid" width="24" height="24" patternUnits="userSpaceOnUse"><path d="M24 0H0V24" fill="none" stroke="#FFFFFF" stroke-opacity=".06"/></pattern>
  <marker id="ar" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L10 5L0 10z" fill="${C.faint}"/></marker>
</defs>`;
function svg(w, h, body, title) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(title)}"><title>${esc(title)}</title>${defs}<rect width="${w}" height="${h}" rx="22" fill="${C.bg}"/>${body}</svg>\n`;
}
function head(lang, kicker, title, sub) {
  return t(40, 52, kicker.toUpperCase(), { size: 12, fill: C.accInk, w: 700, ls: 1.6 }) +
    t(40, 90, title, { size: 30, serif: true }) + (sub ? t(40, 120, sub, { size: 15, fill: C.mute, max: 110 }) : '');
}
// знак QaltaLab — колба с волной
function mark(x, y, s) {
  const k = s / 32;
  return `<g transform="translate(${x} ${y}) scale(${k})"><rect width="32" height="32" rx="9" fill="url(#mk)"/>
  <clipPath id="fl${x}"><path d="M13 6.5 H19 V12.5 L24.8 22.6 A2.6 2.6 0 0 1 22.5 26.5 H9.5 A2.6 2.6 0 0 1 7.2 22.6 L13 12.5 Z"/></clipPath>
  <path d="M6 19.2 Q9.5 16.4 13 19.2 T20 19.2 T27 19.2 V28 H6 Z" fill="#fff" clip-path="url(#fl${x})"/>
  <path d="M13 6.5 H19 V12.5 L24.8 22.6 A2.6 2.6 0 0 1 22.5 26.5 H9.5 A2.6 2.6 0 0 1 7.2 22.6 L13 12.5 Z" fill="none" stroke="#fff" stroke-width="2" stroke-linejoin="round"/>
  <path d="M11.8 6.5 H20.2" stroke="#fff" stroke-width="2" stroke-linecap="round"/></g>`;
}
// маленький график «точки + кривая»
function miniGraph(x, y, w, h, stroke, dot) {
  const pts = [[.1, .82], [.3, .55], [.5, .38], [.72, .26], [.93, .18]];
  return `<path d="M${x} ${y}V${y + h}H${x + w}" fill="none" stroke="${stroke}" stroke-opacity=".45" stroke-width="1.5"/>` +
    `<path d="M${x + 2} ${y + h - 2} C${x + w * .25} ${y + h * .45}, ${x + w * .5} ${y + h * .28}, ${x + w * .97} ${y + h * .14}" fill="none" stroke="${stroke}" stroke-width="2.5" stroke-linecap="round"/>` +
    pts.map(p => `<circle cx="${x + p[0] * w}" cy="${y + p[1] * h}" r="3.6" fill="${dot}"/>`).join('');
}

/* ---------- 1. баннер ---------- */
function banner(lang) {
  const W = 960, H = 300;
  let b = `<rect width="${W}" height="${H}" rx="22" fill="url(#dk)"/><rect width="${W}" height="${H}" rx="22" fill="url(#grid)"/>`;
  b += mark(48, 48, 44) + t(106, 80, 'QaltaLab', { size: 26, fill: '#FFFFFF', w: 700 });
  b += t(48, 158, L(lang, 'Лаборатория', 'Зертхана'), { size: 54, fill: '#FFFFFF', w: 700 });
  b += t(48, 214, L(lang, 'в кармане', 'қалтаңда'), { size: 50, fill: C.lime, serif: true });
  b += t(48, 262, L(lang, 'Телефон становится прибором: свой опыт, свои данные, свой закон.', 'Телефон құралға айналады: өз тәжірибең, өз деректерің, өз заңың.'), { size: 16, fill: '#C8D8C0' });
  // телефон с графиком
  b += `<rect x="680" y="34" width="210" height="236" rx="30" fill="#0F1813" stroke="#FFFFFF" stroke-opacity=".14"/>
  <rect x="692" y="50" width="186" height="206" rx="20" fill="#FBFAF4"/><rect x="752" y="40" width="66" height="8" rx="4" fill="#0A110D"/>`;
  b += t(708, 76, L(lang, 'ТВОИ ДАННЫЕ', 'СЕНІҢ ДЕРЕКТЕРІҢ'), { size: 10.5, fill: C.accInk, w: 700, ls: 1 });
  b += miniGraph(712, 92, 150, 110, C.acc, C.ink);
  b += t(708, 236, 'R² 98%', { size: 13, fill: C.accInk, w: 700 });
  return svg(W, H, b, 'QaltaLab');
}

/* ---------- 2. проблема в цифрах ---------- */
function problem(lang) {
  const W = 960, H = 330;
  const S = F.schools, K = F.cabinets;
  let b = head(lang, L(lang, 'Проблема', 'Мәселе'), L(lang, 'Практический STEM не должен зависеть от кабинета', 'Практикалық STEM кабинетке тәуелді болмауы керек'));
  const tiles = [
    [F.fmt(S.count), L(lang, 'общеобразовательных школ в Казахстане', 'Қазақстандағы жалпы білім беретін мектеп')],
    [F.fmt(K.cabinets), L(lang, 'предметных кабинетов закуплено по итогам 2024 года', '2024 жылы сатып алынған пән кабинеті')],
    [F.fmt(K.schools), L(lang, 'школ получили эти кабинеты', 'мектеп осы кабинеттерді алды')],
    [F.fmt(K.rural), L(lang, 'из них — сельские школы', 'оның ішінде — ауыл мектебі')]
  ];
  tiles.forEach((tl, i) => {
    const x = 40 + i * 222, dark = i === 0;
    b += `<rect x="${x}" y="146" width="206" height="128" rx="16" fill="${dark ? 'url(#dk)' : C.card}" stroke="${dark ? 'none' : C.line}"/>`;
    b += t(x + 18, 196, tl[0].replace(/ /g, ' '), { size: 34, w: 700, fill: dark ? C.lime : C.accInk });
    b += t(x + 18, 226, tl[1], { size: 13, fill: dark ? '#C8D8C0' : C.mute, max: 28, lh: 18 });
  });
  b += t(40, 306, L(lang, `Источники: Бюро национальной статистики (${S.date}); Министерство просвещения РК (${K.year}).`, `Дереккөздер: Ұлттық статистика бюросы (${S.date}); ҚР Оқу-ағарту министрлігі (${K.year}).`), { size: 12.5, fill: C.faint });
  return svg(W, H, b, L(lang, 'Проблема', 'Мәселе'));
}

/* ---------- 3. научный метод ---------- */
function method(lang) {
  const W = 960, H = 300;
  const st = lang === 'kk'
    ? [['quest', 'Сұрақ', 'параграфтың орнына'], ['spark', 'Болжам', 'тәжірибеге дейін'], ['mic', 'Өлшеу', 'телефон шын өлшейді'], ['chart', 'Деректер + модель', 'R² бірден'], ['flask', 'Жаңалық', 'заң және «неге»']]
    : [['quest', 'Вопрос', 'вместо параграфа'], ['spark', 'Гипотеза', 'до опыта'], ['mic', 'Измерение', 'телефон меряет'], ['chart', 'Данные + модель', 'R² сразу'], ['flask', 'Открытие', 'закон и «почему»']];
  let b = head(lang, L(lang, 'Как это работает', 'Қалай жұмыс істейді'), L(lang, 'Пять шагов научного метода в каждом опыте', 'Әр тәжірибеде ғылыми әдістің бес қадамы'));
  st.forEach((s, i) => {
    const x = 40 + i * 180, key = i === 3;
    b += `<rect x="${x}" y="130" width="160" height="138" rx="18" fill="${key ? 'url(#dk)' : C.card}" stroke="${key ? 'none' : C.line}"/>`;
    b += `<rect x="${x + 16}" y="146" width="40" height="40" rx="12" fill="${key ? '#FFFFFF' : C.soft}" fill-opacity="${key ? .14 : 1}"/>` + icon(s[0], x + 24, 154, 24, key ? '#FFFFFF' : C.accInk);
    b += `<circle cx="${x + 138}" cy="152" r="12" fill="${key ? '#FFFFFF' : C.soft}" fill-opacity="${key ? .2 : 1}"/>` + t(x + 138, 157, String(i + 1), { size: 12, w: 700, fill: key ? '#FFFFFF' : C.accInk, anchor: 'middle' });
    b += t(x + 16, 212, s[1], { size: 15, w: 700, fill: key ? '#FFFFFF' : C.ink, max: 15, lh: 18 });
    b += t(x + 16, wrap(s[1], 15).length > 1 ? 250 : 238, s[2], { size: 12.5, fill: key ? '#C8D8C0' : C.mute });
    if (i < 4) b += `<path d="M${x + 162} 194H${x + 178}" stroke="${C.faint}" stroke-width="1.5" marker-end="url(#ar)"/>`;
  });
  return svg(W, H, b, L(lang, 'Пять шагов научного метода', 'Ғылыми әдістің бес қадамы'));
}

/* ---------- 4. девять опытов ---------- */
const LABS = [
  ['pitch', 'wave', 'phys', 'Бутылочный оркестр', 'частота звука', 'дыбыс жиілігі', 'mic', 'микрофон', 'микрофон'],
  ['pendulum', 'pendulum', 'phys', 'Маятник', 'период колебаний → g', 'тербеліс периоды → g', 'touch', 'касания', 'жанасу'],
  ['hearing', 'hearing', 'phys', 'Твой слух', 'граница слышимых частот', 'естілетін жиілік шегі', 'speaker', 'динамик', 'динамик'],
  ['timing', 'clock', 'bio', 'Чувство времени', 'точность внутренних часов', 'ішкі сағат дәлдігі', 'touch', 'касания', 'жанасу'],
  ['hick', 'bolt', 'cog', 'Скорость мысли', 'время выбора, закон Хика', 'таңдау уақыты, Хик заңы', 'touch', 'касания', 'жанасу'],
  ['fitts', 'target', 'cog', 'Закон Фиттса', 'время попадания в цель', 'нысанаға тию уақыты', 'touch', 'касания', 'жанасу'],
  ['practice', 'spark', 'cog', 'Как быстро ты учишься', 'степенной закон практики', 'жаттығудың дәрежелік заңы', 'touch', 'касания', 'жанасу'],
  ['memory', 'brain', 'bio', 'Магическое число семь', 'объём кратковременной памяти', 'қысқа мерзімді жад көлемі', 'touch', 'касания', 'жанасу'],
  ['pulse', 'heart', 'bio', 'Пульс камерой', 'восстановление пульса', 'тамыр соғысының қалпына келуі', 'camera', 'камера', 'камера']
];
function labs(lang) {
  const W = 960, H = 600;
  let b = head(lang, L(lang, 'Эксперименты', 'Тәжірибелер'), L(lang, 'Девять опытов с настоящими измерениями', 'Нақты өлшеулері бар тоғыз тәжірибе'));
  LABS.forEach((l, i) => {
    const col = i % 3, row = Math.floor(i / 3), x = 40 + col * 296, y = 128 + row * 136, clr = C[l[2]];
    b += `<rect x="${x}" y="${y}" width="280" height="120" rx="16" fill="${C.card}" stroke="${C.line}"/>`;
    b += `<rect x="${x}" y="${y + 20}" width="4" height="80" rx="2" fill="${clr}"/>`;
    b += `<rect x="${x + 18}" y="${y + 18}" width="44" height="44" rx="13" fill="${clr}" fill-opacity=".12"/>` + icon(l[1], x + 28, y + 28, 24, clr);
    b += t(x + 76, y + 38, lang === 'kk' ? (KK[l[3]] || l[3]) : l[3], { size: 15.5, w: 700, max: 21, lh: 18 });
    b += t(x + 76, y + (wrap(lang === 'kk' ? (KK[l[3]] || l[3]) : l[3], 21).length > 1 ? 78 : 60), lang === 'kk' ? l[5] : l[4], { size: 12.5, fill: C.mute, max: 30, lh: 16 });
    b += icon(l[6], x + 18, y + 84, 16, C.faint) + t(x + 40, y + 97, lang === 'kk' ? l[8] : l[7], { size: 12, fill: C.faint });
  });
  const lg = [['phys', L(lang, 'физика', 'физика')], ['bio', L(lang, 'биология', 'биология')], ['cog', L(lang, 'мышление и данные', 'ойлау және деректер')]];
  lg.forEach((g, i) => { b += `<circle cx="${48 + i * 170}" cy="${H - 34}" r="6" fill="${C[g[0]]}"/>` + t(60 + i * 170, H - 29, g[1], { size: 13, fill: C.mute }); });
  return svg(W, H, b, L(lang, 'Девять опытов', 'Тоғыз тәжірибе'));
}

/* ---------- 5. телефон как прибор (схема) ---------- */
function phone(lang) {
  const W = 960, H = 420;
  const it = lang === 'kk'
    ? [['mic', 'Микрофон', 'дыбыс жиілігі'], ['speaker', 'Динамик', 'таза дыбыс'], ['touch', 'Жанасу', 'реакция уақыты'], ['camera', 'Камера', 'тамыр соғысы (оптика)'], ['timer', 'Таймер', 'период пен уақыт'], ['code', 'JavaScript', 'сәйкестендіру және R²']]
    : [['mic', 'Микрофон', 'частота звука'], ['speaker', 'Динамик', 'чистый тон'], ['touch', 'Касание', 'время реакции'], ['camera', 'Камера', 'пульс по свету'], ['timer', 'Таймер', 'период и время'], ['code', 'JavaScript', 'подгонка и R²']];
  let b = head(lang, L(lang, 'Технологии', 'Технологиялар'), L(lang, 'Телефон — это лаборатория', 'Телефон — бұл зертхана'));
  const cx = 480, cy = 270;
  b += `<rect x="${cx - 70}" y="${cy - 118}" width="140" height="236" rx="28" fill="#0F1813"/><rect x="${cx - 60}" y="${cy - 104}" width="120" height="208" rx="18" fill="${C.bg}"/>`;
  b += miniGraph(cx - 46, cy - 60, 92, 80, C.acc, C.ink) + t(cx, cy + 58, L(lang, 'твои данные', 'сенің деректерің'), { size: 11, fill: C.accInk, w: 700, anchor: 'middle' });
  it.forEach((s, i) => {
    const left = i < 3, j = i % 3, x = left ? 40 : 640, y = 142 + j * 88;
    b += `<rect x="${x}" y="${y}" width="280" height="68" rx="16" fill="${C.card}" stroke="${C.line}"/>`;
    b += `<rect x="${x + 14}" y="${y + 14}" width="40" height="40" rx="12" fill="${C.soft}"/>` + icon(s[0], x + 22, y + 22, 24, C.accInk);
    b += t(x + 68, y + 32, s[1], { size: 15.5, w: 700 }) + t(x + 68, y + 52, s[2], { size: 13, fill: C.mute });
    const ex = left ? x + 280 : x, tx = left ? cx - 72 : cx + 72;
    b += `<path d="M${ex} ${y + 34}H${tx}" stroke="${C.line}" stroke-width="1.5" stroke-dasharray="4 4"/><circle cx="${tx}" cy="${y + 34}" r="3" fill="${C.acc}"/>`;
  });
  return svg(W, H, b, L(lang, 'Телефон как прибор', 'Телефон — құрал'));
}

/* ---------- 6. пилотный тест ---------- */
function pilot(lang) {
  const W = 960, H = 330 + P.liked.length * 40 + 20 + 104 + 56;
  let b = head(lang, L(lang, 'Пилотное тестирование · n = ' + P.n, 'Пилоттық тестілеу · n = ' + P.n), L(lang, 'Что сказали первые пользователи', 'Алғашқы пайдаланушылар не айтты'));
  const kpi = [
    [F.fmt(P.mobile.avg, 2) + ' / 5', L(lang, 'удобство с телефона', 'телефоннан қолдану ыңғайлылығы')],
    [F.fmt(P.overall.avg, 2) + ' / 5', L(lang, 'общая оценка', 'жалпы баға')],
    [pc(P.format.yes + P.format.rather), L(lang, '«да» или «скорее да»: формат помогает понимать STEM', '«иә» не «иә болар»: формат STEM-ді түсінуге көмектеседі')],
    [pc(P.liked[0][1]), L(lang, 'отметили интерактивные опыты', 'интерактивті тәжірибелерді атап өтті')]
  ];
  kpi.forEach((k, i) => {
    const x = 40 + i * 222, dark = i === 0;
    b += `<rect x="${x}" y="128" width="206" height="124" rx="16" fill="${dark ? 'url(#dk)' : C.card}" stroke="${dark ? 'none' : C.line}"/>`;
    b += t(x + 18, 176, k[0], { size: 30, w: 700, fill: dark ? C.lime : C.accInk });
    b += t(x + 18, 204, k[1], { size: 12.5, fill: dark ? '#C8D8C0' : C.mute, max: 28, lh: 17 });
  });
  // что понравилось
  b += `<rect x="40" y="270" width="880" height="${60 + P.liked.length * 40}" rx="16" fill="${C.card}" stroke="${C.line}"/>`;
  b += t(60, 300, L(lang, 'ЧТО ПОНРАВИЛОСЬ · МОЖНО БЫЛО ВЫБРАТЬ НЕСКОЛЬКО', 'НЕ ҰНАДЫ · БІРНЕШЕУІН ТАҢДАУҒА БОЛАТЫН'), { size: 11.5, fill: C.faint, w: 700, ls: 1.2 });
  P.liked.forEach((l, i) => {
    const y = 322 + i * 40, w = Math.round(430 * l[1] / P.n);
    b += t(60, y + 12, lang === 'kk' ? (KK[l[0]] || l[0]) : l[0], { size: 14.5, w: 600 });
    b += `<rect x="360" y="${y}" width="430" height="14" rx="7" fill="${C.soft}"/><rect x="360" y="${y}" width="${w}" height="14" rx="7" fill="${C.acc}"/>`;
    b += t(900, y + 12, `${pc(l[1])} · ${l[1]}/${P.n}`, { size: 13, fill: C.mute, anchor: 'end' });
  });
  // доли ответов
  const segY = 330 + P.liked.length * 40 + 20;
  const seg = (x, title, parts) => {
    let s = `<rect x="${x}" y="${segY}" width="432" height="104" rx="16" fill="${C.card}" stroke="${C.line}"/>` + t(x + 18, segY + 30, title, { size: 13.5, w: 700, max: 56 });
    let off = 0; const cols = [C.acc, '#A9C9A6', '#D9A2A2'];
    parts.forEach((p, i) => { const w = Math.round(396 * p[0] / P.n); if (w) s += `<rect x="${x + 18 + off}" y="${segY + 48}" width="${w}" height="14" fill="${cols[i]}"${i === 0 ? ' rx="4"' : ''}/>`; off += w; });
    parts.forEach((p, i) => { s += `<circle cx="${x + 24 + i * 138}" cy="${segY + 84}" r="5" fill="${cols[i]}"/>` + t(x + 34 + i * 138, segY + 89, `${pc(p[0])} ${p[1]}`, { size: 12.5, fill: C.mute }); });
    return s;
  };
  b += seg(40, L(lang, 'Хотели бы использовать на уроках или дома', 'Сабақта не үйде қолданғысы келеді'), [[P.wouldUse.yes, L(lang, 'точно', 'міндетті')], [P.wouldUse.maybe, L(lang, 'возможно', 'мүмкін')], [P.wouldUse.no, L(lang, 'нет', 'жоқ')]]);
  b += seg(488, L(lang, 'Поняли, что такое QaltaLab, с первого раза', 'QaltaLab-ты бірден түсінді'), [[P.understood.yes, L(lang, 'да', 'иә')], [P.understood.partial, L(lang, 'частично', 'ішінара')], [P.understood.no, L(lang, 'нет', 'жоқ')]]);
  b += t(40, H - 22, L(lang, `Пилотное тестирование, n = ${P.n}. Самооценка участников, а не исследование успеваемости.`, `Пилоттық тестілеу, n = ${P.n}. Бұл — үлгерімді зерттеу емес, қатысушылардың өз бағасы.`), { size: 12.5, fill: C.faint });
  return svg(W, H, b, L(lang, 'Пилотное тестирование', 'Пилоттық тестілеу'));
}

/* ---------- 7. архитектура ---------- */
function arch(lang) {
  const W = 960, H = 340;
  const st = lang === 'kk'
    ? [['phone', 'Телефон және браузер'], ['mic', 'Құрылғы API'], ['flask', 'Тәжірибе қозғалтқышы'], ['code', 'Құрылғыдағы талдау'], ['chart', 'График және нәтиже']]
    : [['phone', 'Телефон и браузер'], ['mic', 'API устройства'], ['flask', 'Движок опыта'], ['code', 'Анализ на устройстве'], ['chart', 'График и результат']];
  let b = head(lang, L(lang, 'Архитектура', 'Архитектура'), L(lang, 'Всё считается в браузере — сервер нужен только Zerde', 'Бәрі браузерде есептеледі — сервер тек Zerde-ге керек'));
  st.forEach((s, i) => {
    const x = 40 + i * 180;
    b += `<rect x="${x}" y="126" width="160" height="104" rx="16" fill="${C.card}" stroke="${C.line}"/>` + `<rect x="${x + 16}" y="142" width="36" height="36" rx="11" fill="${C.soft}"/>` + icon(s[0], x + 22, y0(148), 24, C.accInk);
    b += t(x + 16, 198, s[1], { size: 13.5, w: 700, max: 15, lh: 16 });
    if (i < 4) b += `<path d="M${x + 162} 172H${x + 178}" stroke="${C.faint}" stroke-width="1.5" marker-end="url(#ar)"/>`;
  });
  // ветка Zerde
  b += `<path d="M840 230V270H700" fill="none" stroke="${C.acc}" stroke-width="1.5" stroke-dasharray="5 5" marker-end="url(#ar)"/>`;
  b += `<rect x="360" y="256" width="336" height="56" rx="14" fill="url(#dk)"/>` + icon('spark', 376, 272, 24, C.lime);
  b += t(410, 280, L(lang, 'Zerde AI · по кнопке', 'Zerde AI · батырма бойынша'), { size: 14, w: 700, fill: '#FFFFFF' });
  b += t(410, 300, L(lang, '/api/zerde → Groq → разбор результата', '/api/zerde → Groq → нәтижені талдау'), { size: 12, fill: '#C8D8C0' });
  b += t(40, 292, L(lang, 'Ключ Groq — только на сервере.', 'Groq кілті — тек серверде.'), { size: 12.5, fill: C.faint });
  b += t(40, 312, L(lang, 'Без Zerde данные не покидают устройство.', 'Zerde-сіз деректер құрылғыдан шықпайды.'), { size: 12.5, fill: C.faint });
  return svg(W, H, b, L(lang, 'Архитектура', 'Архитектура'));
  function y0(v) { return v; }
}

/* ---------- 8. масштаб ---------- */
function scale(lang) {
  const W = 960, H = 300;
  const st = lang === 'kk'
    ? [['1 оқушы', '1 сілтеме'], ['1 сынып', 'сыныпқа сілтеме'], ['1 мұғалім', 'сабақ парақтары'], ['1 мектеп', '9 тәжірибелік кітапхана']]
    : [['1 ученик', '1 ссылка'], ['1 класс', 'ссылка для класса'], ['1 учитель', 'листы для урока'], ['1 школа', 'библиотека из 9 опытов']];
  let b = head(lang, L(lang, 'Масштаб', 'Ауқым'), L(lang, 'Почему это масштабируется', 'Неге бұл кеңейе алады'));
  st.forEach((s, i) => {
    const x = 40 + i * 226, dark = i === 3;
    b += `<rect x="${x}" y="130" width="200" height="92" rx="16" fill="${dark ? 'url(#dk)' : C.card}" stroke="${dark ? 'none' : C.line}"/>`;
    b += t(x + 18, 170, s[0], { size: 22, w: 700, fill: dark ? C.lime : C.accInk }) + t(x + 18, 198, s[1], { size: 13.5, fill: dark ? '#C8D8C0' : C.mute });
    if (i < 3) b += `<path d="M${x + 204} 176H${x + 222}" stroke="${C.faint}" stroke-width="1.5" marker-end="url(#ar)"/>`;
  });
  const pills = lang === 'kk' ? ['жабдықсыз', 'орнатусыз', 'аккаунтсыз', 'кез келген телефон', 'ортақ қозғалтқыш'] : ['без оборудования', 'без установки', 'без аккаунта', 'обычный телефон', 'общий движок опытов'];
  let px = 40;
  pills.forEach(p => { const w = p.length * 7.6 + 28; b += `<rect x="${px}" y="246" width="${w}" height="30" rx="15" fill="${C.soft}"/>` + t(px + w / 2, 266, p, { size: 12.5, fill: C.accInk, w: 600, anchor: 'middle' }); px += w + 8; });
  return svg(W, H, b, L(lang, 'Масштаб', 'Ауқым'));
}

/* ---------- 9. дорожная карта ---------- */
function roadmap(lang) {
  const W = 960, H = 330;
  const cols = lang === 'kk'
    ? [['Қазір', ['9 тәжірибе', 'RU / KZ', 'сыныпқа сілтемелер', 'пилот n = 29', 'Zerde AI'], true], ['Келесі', ['көбірек тәжірибе', 'мұғалімге ыңғайлы жинақтар', 'кеңірек пилот']], ['Кейін', ['сыныпқа арналған құралдар', 'химия және инженерия', 'мектеп кітапханасы']]]
    : [['Сейчас', ['9 опытов', 'RU / KZ', 'ссылки для класса', 'пилот n = 29', 'Zerde AI'], true], ['Дальше', ['больше опытов', 'наборы уроков для учителя', 'пилот шире']], ['Потом', ['инструменты для класса', 'химия и инженерия', 'библиотека для школ']]];
  let b = head(lang, L(lang, 'Развитие', 'Даму'), L(lang, 'От девяти опытов к STEM-платформе', 'Тоғыз тәжірибеден STEM-платформаға'));
  cols.forEach((c, i) => {
    const x = 40 + i * 296, now = c[2];
    b += `<rect x="${x}" y="126" width="280" height="${now ? 180 : 150}" rx="16" fill="${now ? C.soft : C.card}" stroke="${now ? 'none' : C.line}"${now ? '' : ' stroke-dasharray="6 5"'}/>`;
    b += t(x + 20, 156, c[0].toUpperCase(), { size: 12, w: 700, fill: C.accInk, ls: 1.4 });
    c[1].forEach((it, j) => {
      const y = 186 + j * 24;
      b += now ? icon('check', x + 18, y - 13, 16, C.accInk) : `<circle cx="${x + 26}" cy="${y - 5}" r="3.5" fill="none" stroke="${C.faint}" stroke-width="1.5"/>`;
      b += t(x + 42, y, it, { size: 14, fill: now ? C.ink : C.mute, w: now ? 600 : 400 });
    });
    if (i < 2) b += `<path d="M${x + 282} 200H${x + 294}" stroke="${C.faint}" stroke-width="1.5" marker-end="url(#ar)"/>`;
  });
  return svg(W, H, b, L(lang, 'Дорожная карта', 'Даму жоспары'));
}

const make = { banner, problem, method, labs, phone, pilot, arch, scale, roadmap };
// старые файлы прошлой версии README больше не нужны
['how-ru.svg', 'how-kk.svg'].forEach(f => { try { fs.unlinkSync(path.join(OUT, f)); } catch (e) {} });
for (const [name, fn] of Object.entries(make)) {
  for (const lang of ['ru', 'kk']) {
    fs.writeFileSync(path.join(OUT, `${name}-${lang}.svg`), fn(lang));
    console.log(`docs/readme/${name}-${lang}.svg`);
  }
}
