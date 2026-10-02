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
  const W = 960, H = 470;
  const S = F.schools, K = F.cabinets, PI = F.pisa;
  let b = head(lang, L(lang, 'Проблема', 'Мәселе'), L(lang, 'Практический STEM не должен зависеть от кабинета', 'Практикалық STEM кабинетке тәуелді болмауы керек'));
  const tiles = [
    [F.fmt(S.count), L(lang, 'общеобразовательных школ в Казахстане', 'Қазақстандағы жалпы білім беретін мектеп')],
    [F.fmt(K.cabinets), L(lang, 'предметных кабинетов закуплено по итогам 2024 года', '2024 жылы сатып алынған пән кабинеті')],
    [F.fmt(K.schools), L(lang, 'школ получили эти кабинеты', 'мектеп осы кабинеттерді алды')],
    [F.fmt(K.rural), L(lang, 'из них — сельские школы', 'оның ішінде — ауыл мектебі')]
  ];
  tiles.forEach((tl, i) => {
    const x = 40 + i * 222, dark = i === 0;
    b += `<rect x="${x}" y="134" width="206" height="122" rx="16" fill="${dark ? 'url(#dk)' : C.card}" stroke="${dark ? 'none' : C.line}"/>`;
    b += t(x + 18, 182, tl[0].replace(/ /g, ' '), { size: 34, w: 700, fill: dark ? C.lime : C.accInk });
    b += t(x + 18, 210, tl[1], { size: 13, fill: dark ? '#C8D8C0' : C.mute, max: 28, lh: 18 });
  });
  // PISA: доля 15-летних, достигших базового уровня по естественным наукам
  b += `<rect x="40" y="272" width="880" height="146" rx="16" fill="${C.card}" stroke="${C.line}"/>`;
  b += t(60, 302, L(lang, `PISA ${PI.year}: базового уровня по естественным наукам достигают`, `PISA ${PI.year}: жаратылыстану бойынша базалық деңгейге жететіндер`), { size: 14.5, w: 700 });
  [[L(lang, 'Казахстан', 'Қазақстан'), PI.kz, WARN], [L(lang, 'В среднем по ОЭСР', 'ЭЫДҰ бойынша орта есеппен'), PI.oecd, '#8A958C']].forEach((r, i) => {
    const y = 322 + i * 36;
    b += t(60, y + 13, r[0], { size: 14, w: i ? 400 : 700, fill: i ? C.mute : C.ink });
    b += `<rect x="270" y="${y}" width="560" height="16" rx="8" fill="${C.soft}"/><rect x="270" y="${y}" width="${Math.round(560 * r[1] / 100)}" height="16" rx="8" fill="${r[2]}"/>`;
    b += t(900, y + 14, r[1] + '%', { size: 16, w: 700, anchor: 'end' });
  });
  b += t(60, 404, L(lang, 'Почти каждый второй 15-летний не достигает базового уровня: наука остаётся формулой на доске.', '15 жастағылардың әрбір екіншісі дерлік базалық деңгейге жетпейді: ғылым тақтадағы формула болып қалады.'), { size: 12.5, fill: C.mute });
  b += t(40, 446, L(lang, `Источники: Бюро национальной статистики (${S.date}); Министерство просвещения РК (${K.year}); ОЭСР, PISA ${PI.year}.`, `Дереккөздер: Ұлттық статистика бюросы (${S.date}); ҚР Оқу-ағарту министрлігі (${K.year}); ЭЫДҰ, PISA ${PI.year}.`), { size: 12.5, fill: C.faint });
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

/* ---------- 4. десять опытов ---------- */
const LABS = [
  ['dombra', 'dombra', 'phys', 'Физика домбры', 'длина струны → частота', 'ішек ұзындығы → жиілік', 'mic', 'микрофон', 'микрофон'],
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
  const W = 960, H = 736;
  let b = head(lang, L(lang, 'Эксперименты', 'Тәжірибелер'), L(lang, 'Десять опытов с настоящими измерениями', 'Нақты өлшеулері бар он тәжірибе'));
  LABS.forEach((l, i) => {
    const col = i % 3, row = Math.floor(i / 3), x = 40 + col * 296, y = 128 + row * 136, clr = C[l[2]];
    b += `<rect x="${x}" y="${y}" width="280" height="120" rx="16" fill="${C.card}" stroke="${C.line}"/>`;
    b += `<rect x="${x}" y="${y + 20}" width="4" height="80" rx="2" fill="${clr}"/>`;
    b += `<rect x="${x + 18}" y="${y + 18}" width="44" height="44" rx="13" fill="${clr}" fill-opacity=".12"/>` + icon(l[1], x + 28, y + 28, 24, clr);
    b += t(x + 76, y + 38, lang === 'kk' ? (KK[l[3]] || l[3]) : l[3], { size: 15.5, w: 700, max: 21, lh: 18 });
    b += t(x + 76, y + (wrap(lang === 'kk' ? (KK[l[3]] || l[3]) : l[3], 21).length > 1 ? 78 : 60), lang === 'kk' ? l[5] : l[4], { size: 12.5, fill: C.mute, max: 30, lh: 16 });
    b += icon(l[6], x + 18, y + 84, 16, C.faint) + t(x + 40, y + 97, lang === 'kk' ? l[8] : l[7], { size: 12, fill: C.faint });
  });
  // Свободные клетки последнего ряда — общий график класса, который работает с любым опытом.
  {
    const x = 40 + 296, y = 128 + 3 * 136, w = 576;
    b += `<rect x="${x}" y="${y}" width="${w}" height="120" rx="16" fill="${C.soft}" stroke="${C.acc}" stroke-dasharray="6 6"/>`;
    b += `<rect x="${x + 18}" y="${y + 18}" width="44" height="44" rx="13" fill="${C.card}"/>` + icon('chart', x + 28, y + 28, 24, C.accInk);
    b += t(x + 76, y + 38, L(lang, 'Общий график класса', 'Сыныптың ортақ графигі'), { size: 15.5, w: 700 });
    b += t(x + 76, y + 60, L(lang, 'с любым опытом: точки всех учеников на одном графике', 'кез келген тәжірибемен: барлық оқушының нүктелері бір графикте'), { size: 12.5, fill: C.mute });
    b += t(x + 76, y + 97, L(lang, 'учитель открывает класс → ученики по ссылке qaltalab.site/c/КОД', 'мұғалім сыныпты ашады → оқушылар qaltalab.site/c/КОД сілтемесімен'), { size: 12, fill: C.accInk });
  }
  const lg = [['phys', L(lang, 'физика', 'физика')], ['bio', L(lang, 'биология', 'биология')], ['cog', L(lang, 'мышление и данные', 'ойлау және деректер')]];
  lg.forEach((g, i) => { b += `<circle cx="${48 + i * 170}" cy="${H - 34}" r="6" fill="${C[g[0]]}"/>` + t(60 + i * 170, H - 29, g[1], { size: 13, fill: C.mute }); });
  return svg(W, H, b, L(lang, 'Десять опытов', 'Он тәжірибе'));
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
  const W = 960, H = 400;
  const st = lang === 'kk'
    ? [['phone', 'Телефон және браузер'], ['mic', 'Құрылғы API'], ['flask', 'Тәжірибе қозғалтқышы'], ['code', 'Құрылғыдағы талдау'], ['chart', 'График және нәтиже']]
    : [['phone', 'Телефон и браузер'], ['mic', 'API устройства'], ['flask', 'Движок опыта'], ['code', 'Анализ на устройстве'], ['chart', 'График и результат']];
  let b = head(lang, L(lang, 'Архитектура', 'Архитектура'), L(lang, 'Измерения считаются в браузере — сервер только по кнопке', 'Өлшеулер браузерде есептеледі — сервер тек батырма бойынша'));
  st.forEach((s2, i) => {
    const x = 40 + i * 180;
    b += `<rect x="${x}" y="126" width="160" height="104" rx="16" fill="${C.card}" stroke="${C.line}"/>` + `<rect x="${x + 16}" y="142" width="36" height="36" rx="11" fill="${C.soft}"/>` + icon(s2[0], x + 22, 148, 24, C.accInk);
    b += t(x + 16, 198, s2[1], { size: 13.5, w: 700, max: 15, lh: 16 });
    if (i < 4) b += `<path d="M${x + 162} 172H${x + 178}" stroke="${C.faint}" stroke-width="1.5" marker-end="url(#ar)"/>`;
  });
  const branch = (x, w, ic, title, sub, from) => `<path d="M${from} 230V262" fill="none" stroke="${C.acc}" stroke-width="1.5" stroke-dasharray="5 5" marker-end="url(#ar)"/>` +
    `<rect x="${x}" y="266" width="${w}" height="64" rx="14" fill="url(#dk)"/>` + icon(ic, x + 16, 286, 24, C.lime) +
    t(x + 52, 292, title, { size: 14, w: 700, fill: '#FFFFFF' }) + t(x + 52, 314, sub, { size: 12, fill: '#C8D8C0' });
  b += branch(220, 330, 'chart', L(lang, 'Общий график класса', 'Сыныптың ортақ графигі'), L(lang, '/api/class → Supabase (таблицы закрыты)', '/api/class → Supabase (кестелер жабық)'), 480);
  b += branch(570, 350, 'spark', L(lang, 'Zerde AI · по кнопке', 'Zerde AI · батырма бойынша'), L(lang, '/api/zerde → Groq → разбор результата', '/api/zerde → Groq → нәтижені талдау'), 840);
  b += t(40, 362, L(lang, 'На сервер уходят только числа опыта — без имён и аккаунтов. Ключи хранятся на сервере.', 'Серверге тек тәжірибе сандары жіберіледі — аты-жөнсіз, аккаунтсыз. Кілттер серверде сақталады.'), { size: 12.5, fill: C.faint });
  b += t(40, 382, L(lang, 'Без класса и без Zerde данные не покидают устройство.', 'Сыныпсыз және Zerde-сіз деректер құрылғыдан шықпайды.'), { size: 12.5, fill: C.faint });
  return svg(W, H, b, L(lang, 'Архитектура', 'Архитектура'));
}

/* ---------- 8. масштаб ---------- */
function scale(lang) {
  const W = 960, H = 300;
  const st = lang === 'kk'
    ? [['1 оқушы', '1 сілтеме'], ['1 сынып', 'сыныпқа сілтеме'], ['1 мұғалім', 'сабақ парақтары'], ['1 мектеп', '10 тәжірибелік кітапхана']]
    : [['1 ученик', '1 ссылка'], ['1 класс', 'ссылка для класса'], ['1 учитель', 'листы для урока'], ['1 школа', 'библиотека из 10 опытов']];
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
    ? [['Қазір', ['10 тәжірибе', 'RU / KZ', 'сыныптың ортақ графигі', 'пилот n = 29', 'Zerde AI'], true], ['Келесі', ['көбірек тәжірибе', 'мұғалімге ыңғайлы жинақтар', 'кеңірек пилот']], ['Кейін', ['мұғалімге арналған сынып журналы', 'химия және инженерия', 'мектеп кітапханасы']]]
    : [['Сейчас', ['10 опытов', 'RU / KZ', 'общий график класса', 'пилот n = 29', 'Zerde AI'], true], ['Дальше', ['больше опытов', 'наборы уроков для учителя', 'пилот шире']], ['Потом', ['журнал класса для учителя', 'химия и инженерия', 'библиотека для школ']]];
  let b = head(lang, L(lang, 'Развитие', 'Даму'), L(lang, 'От десяти опытов к STEM-платформе', 'Он тәжірибеден STEM-платформаға'));
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

/* ---------- 0. кратко: проблема → решение → результат ---------- */
const WARN = '#A96C08';
function summary(lang) {
  const W = 960, H = 330;
  let b = head(lang, L(lang, 'Кратко', 'Қысқаша'), L(lang, 'Проблема → решение → результат', 'Мәселе → шешім → нәтиже'));
  const cards = [
    [L(lang, 'ПРОБЛЕМА', 'МӘСЕЛЕ'), F.pisa.kz + '%', L(lang, `пятнадцатилетних в Казахстане достигают базового уровня по естественным наукам (ОЭСР — ${F.pisa.oecd}%), PISA ${F.pisa.year}`, `Қазақстанда 15 жастағылардың жаратылыстану бойынша базалық деңгейге жететіні (ЭЫДҰ — ${F.pisa.oecd}%), PISA ${F.pisa.year}`), true],
    [L(lang, 'РЕШЕНИЕ', 'ШЕШІМ'), L(lang, '10 опытов', '10 тәжірибе'), L(lang, 'телефон становится прибором: микрофон, камера, касание — свои данные и свой закон', 'телефон құралға айналады: микрофон, камера, жанасу — өз деректерің және өз заңың')],
    [L(lang, 'РЕЗУЛЬТАТ', 'НӘТИЖЕ'), F.fmt(P.mobile.avg, 2) + ' / 5', L(lang, `удобство с телефона в пилотном тесте, n = ${P.n}; ${pc(P.liked[0][1])} отметили интерактивные опыты`, `пилоттық тесттегі телефоннан қолдану ыңғайлылығы, n = ${P.n}; ${pc(P.liked[0][1])} интерактивті тәжірибелерді атап өтті`)]
  ];
  cards.forEach((c, i) => {
    const x = 40 + i * 300, dark = c[3];
    b += `<rect x="${x}" y="134" width="280" height="138" rx="18" fill="${dark ? 'url(#dk)' : C.card}" stroke="${dark ? 'none' : C.line}"/>`;
    b += t(x + 20, 162, c[0], { size: 11.5, w: 700, fill: dark ? C.lime : C.accInk, ls: 1.4 });
    b += t(x + 20, 202, c[1], { size: 32, w: 700, fill: dark ? '#FFFFFF' : C.accInk });
    b += t(x + 20, 228, c[2], { size: 12.5, fill: dark ? '#C8D8C0' : C.mute, max: 40, lh: 17 });
    if (i < 2) b += `<path d="M${x + 284} 203H${x + 296}" stroke="${C.faint}" stroke-width="1.5" marker-end="url(#ar)"/>`;
  });
  const pills = lang === 'kk'
    ? ['жабдықсыз', 'орнатусыз', 'RU / KZ', 'домбыра физикасы', 'сыныптың ортақ графигі', 'Zerde AI']
    : ['без оборудования', 'без установки', 'RU / KZ', 'физика домбры', 'общий график класса', 'Zerde AI'];
  let px = 40;
  pills.forEach(p => { const w = p.length * 7.4 + 28; b += `<rect x="${px}" y="288" width="${w}" height="28" rx="14" fill="${C.soft}"/>` + t(px + w / 2, 307, p, { size: 12.5, fill: C.accInk, w: 600, anchor: 'middle' }); px += w + 8; });
  return svg(W, H, b, L(lang, 'Кратко', 'Қысқаша'));
}

/* ---------- новизна: нарисуй предсказание — проверь реальностью ---------- */
function predict(lang) {
  const W = 960, H = 380;
  let b = head(lang, L(lang, 'Новизна', 'Жаңалық'), L(lang, 'Нарисуй предсказание — проверь реальностью', 'Болжауды сал — шындықпен тексер'),
    L(lang, 'До опыта ученик пальцем рисует ожидаемый график. После опыта рисунок ложится пунктиром поверх настоящих точек.', 'Тәжірибеге дейін оқушы күтілетін графикті саусағымен салады. Кейін сурет нақты нүктелердің үстіне үзік сызықпен түседі.'));
  // график маятника: точки примера, кривая k√L и наивная прямая 0,02·L
  const gx = 40, gy = 150, gw = 520, gh = 196;
  b += `<rect x="${gx}" y="${gy}" width="${gw}" height="${gh}" rx="16" fill="${C.card}" stroke="${C.line}"/>`;
  const X = L0 => gx + 46 + (L0 / 100) * (gw - 70), Y = T0 => gy + gh - 34 - (T0 / 2.2) * (gh - 56);
  b += `<path d="M${X(0)} ${gy + 16}V${Y(0)}H${X(100)}" fill="none" stroke="${C.faint}" stroke-width="1.2"/>`;
  [0.5, 1, 1.5, 2].forEach(v => { b += `<path d="M${X(0)} ${Y(v)}H${X(100)}" stroke="${C.line}"/>` + t(X(0) - 8, Y(v) + 4, F.fmt(v, 1), { size: 11, fill: C.faint, anchor: 'end' }); });
  [20, 60, 100].forEach(v => { b += t(X(v), Y(0) + 18, v + L(lang, ' см', ' см'), { size: 11, fill: C.faint, anchor: 'middle' }); });
  let curve = '', naive = '';
  for (let l = 2; l <= 100; l += 2) { curve += (curve ? 'L' : 'M') + X(l).toFixed(1) + ' ' + Y(0.2009 * Math.sqrt(l)).toFixed(1); }
  for (let l = 5; l <= 100; l += 5) { naive += (naive ? 'L' : 'M') + X(l).toFixed(1) + ' ' + Y(0.02 * l).toFixed(1); }
  b += `<path d="${naive}" fill="none" stroke="${WARN}" stroke-width="2.6" stroke-dasharray="7 6" stroke-linecap="round"/>`;
  b += `<path d="${curve}" fill="none" stroke="${C.acc}" stroke-width="2.8" stroke-linecap="round"/>`;
  [[20, 0.93], [40, 1.22], [60, 1.59], [80, 1.74], [100, 2.04]].forEach(p => { b += `<circle cx="${X(p[0])}" cy="${Y(p[1])}" r="5" fill="${C.ink}" stroke="#fff" stroke-width="2"/>`; });
  // легенда
  const lg = [[C.ink, L(lang, 'измерения', 'өлшеулер'), 'dot'], [C.acc, L(lang, 'закон T = 2π√(L/g)', 'заң T = 2π√(L/g)'), 'line'], [WARN, L(lang, 'рисунок до опыта', 'тәжірибеге дейінгі сурет'), 'dash']];
  let lx = gx + 54;
  lg.forEach(l => {
    b += l[2] === 'dot' ? `<circle cx="${lx}" cy="${gy + 22}" r="4.5" fill="${l[0]}"/>` : `<path d="M${lx - 8} ${gy + 22}H${lx + 10}" stroke="${l[0]}" stroke-width="3"${l[2] === 'dash' ? ' stroke-dasharray="5 4"' : ''}/>`;
    b += t(lx + 16, gy + 26, l[1], { size: 12, fill: C.mute });
    lx += l[1].length * 6.6 + 44;
  });
  // карточка сравнения
  b += `<rect x="584" y="${gy}" width="336" height="${gh}" rx="16" fill="#FDF4E4"/>`;
  b += t(604, gy + 32, L(lang, 'Предсказание и реальность', 'Болжау және шындық'), { size: 15, w: 700, fill: WARN });
  b += t(604, gy + 78, L(lang, '0,3 с', '0,3 с'), { size: 36, w: 700, fill: C.ink });
  b += t(604, gy + 102, L(lang, 'в среднем рисунок отличался от измерений', 'сурет өлшеулерден орта есеппен осыншаға ерекшеленді'), { size: 12.5, fill: C.mute, max: 46, lh: 16 });
  b += t(604, gy + 136, L(lang, 'Сильнее всего — при 20 см: на рисунке 0,4 с, а измерено 0,93 с.', 'Ең үлкен айырма — 20 см-де: суретте 0,4 с, өлшенгені 0,93 с.'), { size: 13, fill: C.ink, max: 44, lh: 17 });
  b += t(604, gy + 176, L(lang, 'Разница и есть открытие — её разбирает и Zerde.', 'Айырмашылық — нағыз жаңалық, оны Zerde те талдайды.'), { size: 12.5, fill: C.accInk, w: 600, max: 46, lh: 16 });
  return svg(W, H, b, L(lang, 'Нарисуй предсказание', 'Болжауды сал'));
}

/* ---------- физика домбры ---------- */
function dombraArt(x, y, s) {
  // та же сцена, что на карточке сайта: лады сходятся к подставке по закону струны
  const bridge = 62, L0 = 214; let frets = '';
  for (let k = 1; k <= 14; k++) { const fx = bridge + L0 * Math.pow(2, -k / 12); frets += `<path d="M${fx.toFixed(1)} 83V97" stroke="${k === 12 ? C.acc : C.faint}" stroke-width="${k === 12 ? 3 : 1.8}" stroke-linecap="round"/>`; }
  const half = bridge + L0 / 2;
  return `<g transform="translate(${x} ${y}) scale(${s})" fill="none" stroke-linecap="round" stroke-linejoin="round">
    <path d="M30 90C30 62 58 52 92 59c20 4 34 17 38 31-4 14-18 27-38 31-34 7-62-3-62-31z" fill="#FFFFFF" stroke="${C.ink}" stroke-width="2.4"/>
    <circle cx="80" cy="90" r="9" stroke="${C.ink}" stroke-width="2.2"/>
    <rect x="128" y="83" width="152" height="14" rx="4" fill="#FFFFFF" stroke="${C.ink}" stroke-width="2.2"/>
    <rect x="276" y="78" width="22" height="24" rx="5" fill="#FFFFFF" stroke="${C.ink}" stroke-width="2.2"/>${frets}
    <rect x="59" y="82" width="6" height="16" rx="2" fill="${C.acc}"/>
    <path d="M62 87.5H280M62 92.5Q171 97 280 92.5" stroke="${C.ink}" stroke-width="1.4"/>
    <text x="${half}" y="70" font-size="20" font-style="italic" font-family="${SERIF}" fill="${C.acc}" text-anchor="middle" stroke="none">½</text>
    <path d="M${half} 74V82" stroke="${C.faint}" stroke-width="2" stroke-dasharray="3 4"/></g>`;
}
function dombra(lang) {
  const W = 960, H = 410;
  let b = head(lang, L(lang, 'Сделано в Казахстане', 'Қазақстанда жасалған'), L(lang, 'Физика домбры: закон струны своими руками', 'Домбыра физикасы: ішек заңы өз қолыңмен'),
    L(lang, 'Зажимаешь струну на ладу, меряешь длину линейкой, телефон слышит щипок — точки ложатся на f = a / L.', 'Ішекті пернеге басасың, ұзындығын сызғышпен өлшейсің, телефон шертуді естиді — нүктелер f = a / L-ге түседі.'));
  b += `<rect x="40" y="150" width="440" height="190" rx="18" fill="${C.soft}"/>` + dombraArt(62, 108, 1.32);
  // график f(L)
  const gx = 500, gy = 150, gw = 420, gh = 190;
  b += `<rect x="${gx}" y="${gy}" width="${gw}" height="${gh}" rx="18" fill="${C.card}" stroke="${C.line}"/>`;
  const X = l => gx + 50 + ((l - 15) / 60) * (gw - 76), Y = f => gy + gh - 34 - (f / 480) * (gh - 56);
  b += `<path d="M${X(15)} ${gy + 16}V${Y(0)}H${X(75)}" fill="none" stroke="${C.faint}" stroke-width="1.2"/>`;
  [150, 300, 450].forEach(v => { b += `<path d="M${X(15)} ${Y(v)}H${X(75)}" stroke="${C.line}"/>` + t(X(15) - 8, Y(v) + 4, String(v), { size: 11, fill: C.faint, anchor: 'end' }); });
  [20, 35, 70].forEach(v => { b += t(X(v), Y(0) + 18, v + ' см', { size: 11, fill: C.faint, anchor: 'middle' }); });
  let c = ''; for (let l = 21.5; l <= 75; l += 1) c += (c ? 'L' : 'M') + X(l).toFixed(1) + ' ' + Y(10300 / l).toFixed(1);
  b += `<path d="${c}" fill="none" stroke="${C.acc}" stroke-width="2.8"/>`;
  [[70, 148], [60, 170], [52.5, 199], [46.5, 219], [35, 290], [26, 401]].forEach(p => { b += `<circle cx="${X(p[0])}" cy="${Y(p[1])}" r="5" fill="${C.ink}" stroke="#fff" stroke-width="2"/>`; });
  b += `<path d="M${X(35)} ${Y(294)}V${Y(0)}" stroke="${WARN}" stroke-width="1.6" stroke-dasharray="4 4"/>` + t(X(35) + 8, Y(0) - 10, L(lang, 'половина — октава', 'жартысы — октава'), { size: 11.5, fill: WARN, w: 700 });
  b += t(gx + gw - 18, gy + 28, L(lang, 'частота, Гц ↑ · длина, см →', 'жиілік, Гц ↑ · ұзындық, см →'), { size: 11.5, fill: C.mute, anchor: 'end' });
  const chips = lang === 'kk'
    ? ['f = (1/2L)·√(T/μ) — Мерсенн, 1636', 'Әл-Фараби: перне — ішек ұзындықтарының қатынасы (9/8, 4/3)', 'Тон f, 2f, 3f гармоникалары бойынша']
    : ['f = (1/2L)·√(T/μ) — Мерсенн, 1636', 'Аль-Фараби: лад — отношение длин струны (9/8, 4/3)', 'Тон ищется по гармоникам f, 2f, 3f'];
  let px = 40;
  chips.forEach(p => { const w = p.length * 6.2 + 26; b += `<rect x="${px}" y="358" width="${w}" height="30" rx="15" fill="${C.card}" stroke="${C.line}"/>` + t(px + w / 2, 378, p, { size: 12, fill: C.accInk, w: 600, anchor: 'middle' }); px += w + 8; });
  return svg(W, H, b, L(lang, 'Физика домбры', 'Домбыра физикасы'));
}

/* ---------- общий график класса ---------- */
function qrBlock(x, y, s) {
  // условный QR: три «глаза» и случайный узор — только знак, не настоящий код
  let q = `<rect x="${x}" y="${y}" width="${s}" height="${s}" rx="8" fill="#FFFFFF"/>`;
  const m = s / 25, eye = (ex, ey) => `<rect x="${x + ex * m}" y="${y + ey * m}" width="${7 * m}" height="${7 * m}" fill="#111"/><rect x="${x + (ex + 1) * m}" y="${y + (ey + 1) * m}" width="${5 * m}" height="${5 * m}" fill="#fff"/><rect x="${x + (ex + 2) * m}" y="${y + (ey + 2) * m}" width="${3 * m}" height="${3 * m}" fill="#111"/>`;
  q += eye(2, 2) + eye(16, 2) + eye(2, 16);
  let seed = 11; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (let r = 2; r < 23; r++) for (let c2 = 2; c2 < 23; c2++) {
    if ((r < 10 && c2 < 10) || (r < 10 && c2 > 14) || (r > 14 && c2 < 10)) continue;
    if (rnd() > .52) q += `<rect x="${x + c2 * m}" y="${y + r * m}" width="${m}" height="${m}" fill="#111"/>`;
  }
  return q;
}
function classboard(lang) {
  const W = 960, H = 400;
  let b = head(lang, L(lang, 'Для учителя', 'Мұғалімге'), L(lang, 'Общий график класса за одну минуту', 'Сыныптың ортақ графигі бір минутта'),
    L(lang, 'Учитель открывает класс, ученики заходят по QR-коду — точки всех ложатся на один график для проектора.', 'Мұғалім сыныпты ашады, оқушылар QR-код арқылы кіреді — бәрінің нүктелері проекторға арналған бір графикке түседі.'));
  // 1. учитель
  b += `<rect x="40" y="150" width="210" height="196" rx="18" fill="url(#dk)"/>` + qrBlock(62, 168, 86);
  b += t(160, 186, L(lang, 'КОД', 'КОД'), { size: 11, fill: '#C8D8C0', w: 700, ls: 1.4 }) + t(160, 214, '9M4Q5', { size: 21, fill: C.lime, w: 700 });
  b += t(62, 288, L(lang, '1. Учитель', '1. Мұғалім'), { size: 15, w: 700, fill: '#FFFFFF' }) + t(62, 310, L(lang, 'нажимает «Провести с классом»', '«Сыныппен өткізу» басады'), { size: 12, fill: '#C8D8C0', max: 30, lh: 15 });
  b += `<path d="M254 248H272" stroke="${C.faint}" stroke-width="1.5" marker-end="url(#ar)"/>`;
  // 2. ученики
  b += `<rect x="276" y="150" width="210" height="196" rx="18" fill="${C.card}" stroke="${C.line}"/>`;
  [[300, 176], [352, 166], [404, 176]].forEach(p => {
    b += `<rect x="${p[0]}" y="${p[1]}" width="42" height="78" rx="9" fill="${C.soft}" stroke="${C.accInk}" stroke-width="1.6"/>` + miniGraph(p[0] + 7, p[1] + 18, 28, 34, C.acc, C.ink).replace(/r="3.6"/g, 'r="2"');
  });
  b += t(298, 288, L(lang, '2. Ученики', '2. Оқушылар'), { size: 15, w: 700 }) + t(298, 310, L(lang, 'проходят опыт на своих телефонах', 'тәжірибені өз телефондарында өтеді'), { size: 12, fill: C.mute, max: 30, lh: 15 });
  b += `<path d="M490 248H508" stroke="${C.faint}" stroke-width="1.5" marker-end="url(#ar)"/>`;
  // 3. экран класса
  b += `<rect x="512" y="150" width="408" height="196" rx="18" fill="${C.card}" stroke="${C.line}"/>`;
  const X = v => 548 + v * 330, Y = v => 316 - v * 130;
  b += `<path d="M${X(0)} 172V${Y(0)}H${X(1)}" fill="none" stroke="${C.faint}" stroke-width="1.2"/>`;
  b += `<path d="M${X(0)} ${Y(0)}L${X(1)} ${Y(0.92)}" stroke="${C.acc}" stroke-width="2.8" stroke-linecap="round"/>`;
  let seed = 5; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  [0.12, 0.3, 0.5, 0.72, 0.95].forEach(xv => { for (let k = 0; k < 5; k++) { const yv = xv * 0.92 + (rnd() - 0.5) * 0.14; b += `<circle cx="${(X(xv) + (rnd() - 0.5) * 14).toFixed(1)}" cy="${Y(yv).toFixed(1)}" r="4.2" fill="none" stroke="${C.faint}" stroke-width="1.5"/>`; } });
  [[0.12, 0.13], [0.3, 0.27], [0.5, 0.47], [0.72, 0.67], [0.95, 0.88]].forEach(p => { b += `<circle cx="${X(p[0])}" cy="${Y(p[1])}" r="4.6" fill="${C.ink}"/>`; });
  b += `<circle cx="${X(0.3)}" cy="${Y(0.66)}" r="4.2" fill="none" stroke="${C.faint}" stroke-width="1.5"/><circle cx="${X(0.3)}" cy="${Y(0.66)}" r="10" fill="none" stroke="${WARN}" stroke-width="2.4"/>`;
  b += t(X(0.3) + 16, Y(0.66) + 4, L(lang, 'выброс — обсудить', 'шығыңқы нүкте — талқылау'), { size: 11.5, fill: WARN, w: 700 });
  b += t(536, 176, L(lang, '3. Экран класса: кривая по всем точкам, R² класса', '3. Сынып экраны: барлық нүкте бойынша қисық, сынып R²'), { size: 12.5, w: 700, fill: C.accInk });
  const pills = lang === 'kk' ? ['QR-код', 'проектор режимі', 'Excel-ге CSV', 'аты-жөнсіз', 'кез келген тәжірибе'] : ['QR-код', 'режим проектора', 'CSV для Excel', 'без имён', 'любой опыт'];
  let px = 40;
  pills.forEach(p => { const w = p.length * 7.4 + 28; b += `<rect x="${px}" y="360" width="${w}" height="28" rx="14" fill="${C.soft}"/>` + t(px + w / 2, 379, p, { size: 12.5, fill: C.accInk, w: 600, anchor: 'middle' }); px += w + 8; });
  return svg(W, H, b, L(lang, 'Общий график класса', 'Сыныптың ортақ графигі'));
}

/* ---------- технологии: от датчика до закона ---------- */
function pipeline(lang) {
  const W = 960, H = 430;
  let b = head(lang, L(lang, 'Технологии', 'Технологиялар'), L(lang, 'От датчика до закона — всё на телефоне', 'Датчиктен заңға дейін — бәрі телефонда'));
  const rows = lang === 'kk'
    ? [['mic', 'Микрофон', 'ЖФТ спектрі, 8192 есеп', 'f, 2f, 3f гармоникалары', 'Гц'], ['camera', 'Камера', 'қызыл арнаның жарықтығы', 'шыңдар, медиана', 'соғу/мин'], ['touch', 'Жанасу', 'performance.now()', 'әрекеттердің медианасы', 'мс']]
    : [['mic', 'Микрофон', 'спектр БПФ, 8192 отсчёта', 'тон по гармоникам f, 2f, 3f', 'Гц'], ['camera', 'Камера', 'яркость красного канала', 'пики, медиана интервалов', 'уд/мин'], ['touch', 'Касание', 'performance.now()', 'медиана нескольких попыток', 'мс']];
  rows.forEach((r, i) => {
    const y = 128 + i * 66;
    b += `<rect x="40" y="${y}" width="180" height="52" rx="14" fill="${C.card}" stroke="${C.line}"/>` + `<rect x="52" y="${y + 10}" width="32" height="32" rx="10" fill="${C.soft}"/>` + icon(r[0], 56, y + 14, 24, C.accInk) + t(94, y + 32, r[1], { size: 14.5, w: 700 });
    [[r[2], 236, 220], [r[3], 474, 220], [r[4], 712, 88]].forEach((c, j) => {
      b += `<path d="M${c[1] - 14} ${y + 26}H${c[1] - 2}" stroke="${C.faint}" stroke-width="1.5" marker-end="url(#ar)"/>`;
      b += `<rect x="${c[1]}" y="${y}" width="${c[2]}" height="52" rx="14" fill="${j === 2 ? C.soft : C.card}" stroke="${j === 2 ? 'none' : C.line}"/>` + t(c[1] + c[2] / 2, y + 31, c[0], { size: 13, fill: j === 2 ? C.accInk : C.ink, w: j === 2 ? 700 : 500, anchor: 'middle' });
    });
    b += `<path d="M804 ${y + 26}H838V${330}" fill="none" stroke="${C.faint}" stroke-width="1.5" stroke-dasharray="4 4"/>`;
  });
  b += `<rect x="40" y="334" width="880" height="72" rx="18" fill="url(#dk)"/>`;
  const steps = lang === 'kk' ? ['өз нүктелерің', 'модель қисығы', 'R² адал есеп', 'заң + Zerde талдауы'] : ['твои точки', 'кривая модели', 'честный R²', 'закон + разбор Zerde'];
  steps.forEach((s, i) => {
    const x = 70 + i * 220;
    b += t(x, 377, s, { size: 16, w: 700, fill: i === 3 ? C.lime : '#FFFFFF' });
    if (i < 3) b += `<path d="M${x + 168} 371H${x + 196}" stroke="#C8D8C0" stroke-width="1.5" marker-end="url(#ar)"/>`;
  });
  return svg(W, H, b, L(lang, 'От датчика до закона', 'Датчиктен заңға дейін'));
}

/* ---------- качество ---------- */
function quality(lang) {
  const W = 960, H = 330;
  let b = head(lang, L(lang, 'Качество', 'Сапа'), L(lang, 'Проверено, а не обещано', 'Уәде емес — тексерілген'));
  const rings = [[100, L(lang, 'Доступность', 'Қолжетімділік')], [100, L(lang, 'Лучшие практики', 'Үздік тәжірибе')], [100, 'SEO'], [92, L(lang, 'Скорость, компьютер', 'Жылдамдық, компьютер')]];
  rings.forEach((r, i) => {
    const cx = 100 + i * 140, cy = 200, R = 40, len = 2 * Math.PI * R;
    b += `<circle cx="${cx}" cy="${cy}" r="${R}" fill="none" stroke="${C.soft}" stroke-width="8"/>`;
    b += `<circle cx="${cx}" cy="${cy}" r="${R}" fill="none" stroke="${C.acc}" stroke-width="8" stroke-linecap="round" stroke-dasharray="${(len * r[0] / 100).toFixed(1)} ${len.toFixed(1)}" transform="rotate(-90 ${cx} ${cy})"/>`;
    b += t(cx, cy + 9, String(r[0]), { size: 26, w: 700, fill: C.accInk, anchor: 'middle' }) + t(cx, cy + 66, r[1], { size: 12, fill: C.mute, anchor: 'middle' });
  });
  b += t(40, 132, 'LIGHTHOUSE · QALTALAB.SITE', { size: 11.5, fill: C.faint, w: 700, ls: 1.2 });
  const tiles = lang === 'kk'
    ? [['16', 'автотест: логика, ЖФТ, QR'], ['10 × 2', 'тәжірибе × тіл: 0 қате'], ['≈160 КБ', 'бүкіл код, фреймворксіз']]
    : [['16', 'автотестов: логика, БПФ, QR'], ['10 × 2', 'опытов × языка: 0 ошибок'], ['≈160 КБ', 'весь код, без фреймворков']];
  tiles.forEach((tl, i) => {
    const y = 138 + i * 58;
    b += `<rect x="610" y="${y}" width="310" height="48" rx="14" fill="${i === 0 ? 'url(#dk)' : C.card}" stroke="${i === 0 ? 'none' : C.line}"/>`;
    b += t(628, y + 31, tl[0], { size: 20, w: 700, fill: i === 0 ? C.lime : C.accInk }) + t(628 + [38, 82, 104][i], y + 30, tl[1], { size: 12.5, fill: i === 0 ? '#C8D8C0' : C.mute });
  });
  b += t(40, H - 18, L(lang, 'Lighthouse, октябрь 2026. Скорость на телефоне — 76: страница собирается скриптом, это осознанный выбор ради простоты кода.', 'Lighthouse, 2026 жылғы қазан. Телефондағы жылдамдық — 76: бет скриптпен жиналады, бұл кодты қарапайым ұстау үшін саналы таңдау.'), { size: 12, fill: C.faint });
  return svg(W, H, b, L(lang, 'Качество', 'Сапа'));
}

/* ---------- критерии жюри → где в продукте ---------- */
function criteria(lang) {
  const rows = lang === 'kk'
    ? [['Мәселені түсіну', 15, `PISA ${F.pisa.year}: ${F.pisa.kz}% vs ${F.pisa.oecd}% · ${F.fmt(F.schools.count)} мектеп · 2024 жылғы кабинеттер`],
       ['Шешім сапасы', 20, '10 жұмыс істейтін тәжірибе · 16 автотест · қолжетімділік 100'],
       ['Жаңалық', 10, 'домбыра және Әл-Фараби · сурет-болжау · сыныптың ортақ графигі'],
       ['Пайдаланушы құндылығы', 15, 'сабақ парақтары · сыныпқа QR · CSV · RU/KZ · тегін'],
       ['Әсер және ауқым', 15, 'сыныпқа бір сілтеме · сатып алусыз · жаңа тәжірибе = бір файл'],
       ['Деректер / технологиялар', 10, 'ЖФТ · гармоникалар · R² · автосәйкестендіру · шығыңқы нүктелер · AI'],
       ['Презентация және демо', 10, 'нәтиже мысалы мен сынып мысалы датчиксіз жұмыс істейді'],
       ['Кейске сәйкестік', 5, 'жабдықсыз STEM: құрал қалтада бар']]
    : [['Понимание проблемы', 15, `PISA ${F.pisa.year}: ${F.pisa.kz}% против ${F.pisa.oecd}% · ${F.fmt(F.schools.count)} школ · кабинеты за 2024 год`],
       ['Качество решения', 20, '10 работающих опытов · 16 автотестов · доступность 100'],
       ['Новизна', 10, 'домбра и Аль-Фараби · рисунок-предсказание · общий график класса'],
       ['Пользовательская ценность', 15, 'листы для урока · QR для класса · CSV · RU/KZ · бесплатно'],
       ['Эффект и масштаб', 15, 'одна ссылка на класс · без закупок · новый опыт = один файл'],
       ['Данные и технологии', 10, 'БПФ · гармоники · R² · автоподгонка · выбросы · ИИ по числам ученика'],
       ['Презентация и демо', 10, 'пример результата и пример класса работают без датчиков'],
       ['Соответствие кейсу', 5, 'STEM без оборудования: прибор уже в кармане']];
  const W = 960, H = 140 + rows.length * 50 + 20;
  let b = head(lang, L(lang, 'Для жюри', 'Қазылар үшін'), L(lang, 'Критерии оценки → где это в продукте', 'Бағалау критерийлері → өнімде қай жерде'));
  rows.forEach((r, i) => {
    const y = 130 + i * 50;
    b += `<rect x="40" y="${y}" width="880" height="42" rx="12" fill="${i % 2 ? C.card : '#FBFAF4'}" stroke="${C.line}"/>`;
    b += `<rect x="52" y="${y + 9}" width="40" height="24" rx="12" fill="${C.soft}"/>` + t(72, y + 26, String(r[1]), { size: 12.5, w: 700, fill: C.accInk, anchor: 'middle' });
    b += t(106, y + 26, r[0], { size: 14, w: 700 });
    b += t(340, y + 26, r[2], { size: 13, fill: C.mute });
  });
  return svg(W, H, b, L(lang, 'Критерии жюри', 'Қазылар критерийлері'));
}

const make = { banner, summary, problem, method, predict, dombra, labs, classboard, phone, pipeline, pilot, quality, arch, scale, roadmap, criteria };
// старые файлы прошлой версии README больше не нужны
['how-ru.svg', 'how-kk.svg'].forEach(f => { try { fs.unlinkSync(path.join(OUT, f)); } catch (e) {} });
for (const [name, fn] of Object.entries(make)) {
  for (const lang of ['ru', 'kk']) {
    fs.writeFileSync(path.join(OUT, `${name}-${lang}.svg`), fn(lang));
    console.log(`docs/readme/${name}-${lang}.svg`);
  }
}
