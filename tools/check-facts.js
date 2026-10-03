// Сверяет цифры в README с единым источником js/facts.js.
// Каждая языковая версия README должна содержать все значения, и в ней не
// должно быть процентов, которых нельзя получить из ответов опроса.
// Запуск: node tools/check-facts.js  (код выхода 1 — есть расхождения)
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
const ctx = { window: {} };
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(ROOT, 'js/facts.js'), 'utf8'), ctx);
const F = ctx.window.A.facts, P = F.pilot;

const norm = s => s.replace(/ /g, ' ');
const pc = n => norm(F.fmt(F.pct(n), F.pct(n) % 1 ? 1 : 0)) + '%';
const frac = n => n + '/' + P.n;

const expected = [
  norm(F.fmt(F.schools.count)), F.schools.date,
  norm(F.fmt(F.cabinets.cabinets)), String(F.cabinets.schools), String(F.cabinets.rural), String(F.cabinets.urban), String(F.cabinets.year),
  'n = ' + P.n,
  norm(F.fmt(P.mobile.avg, 2)) + ' / 5', norm(F.fmt(P.overall.avg, 2)) + ' / 5',
  frac(P.mobile.five), pc(P.mobile.five), frac(P.mobile.fourPlus),
  frac(P.overall.five), pc(P.overall.five),
  frac(P.format.yes), pc(P.format.yes), frac(P.format.rather), pc(P.format.rather), pc(P.format.yes + P.format.rather),
  frac(P.wouldUse.yes), pc(P.wouldUse.yes), frac(P.wouldUse.maybe), pc(P.wouldUse.maybe),
  frac(P.understood.yes), frac(P.understood.partial), pc(P.understood.partial),
  frac(P.liked[0][1]), pc(P.liked[0][1]),
  F.schools.url, F.cabinets.url,
  F.pisa.kz + '%', F.pisa.oecd + '%', F.pisa.url,
  F.classTest.date, F.classTest.n + ' ', F.classTest.points + ' ', F.classTest.r2 + '%',
  norm(F.fmt(F.classTest.kMin, 2)), norm(F.fmt(F.classTest.kMax, 2)), norm(F.fmt(F.classTest.outlierK, 2)), F.classTest.url
];

// Все проценты, которые вообще можно получить из ответов.
const allowed = new Set();
for (let k = 0; k <= P.n; k++) allowed.add(pc(k));
allowed.add(F.pisa.kz + '%'); allowed.add(F.pisa.oecd + '%');
allowed.add(F.classTest.r2 + '%');

const readme = norm(fs.readFileSync(path.join(ROOT, 'README.md'), 'utf8'));
const kkAt = readme.indexOf('<a id="қазақша"></a>');
const parts = { 'Русский': readme.slice(readme.indexOf('<a id="русский"></a>'), kkAt), 'Қазақша': readme.slice(kkAt) };

let bad = 0;
for (const [name, text] of Object.entries(parts)) {
  const missing = expected.filter(v => !text.includes(v));
  const stray = (text.match(/\d+(?:,\d+)?%/g) || []).filter(p => !allowed.has(p));
  console.log(`${name}: ${expected.length - missing.length}/${expected.length} значений на месте` + (stray.length ? `, лишние проценты: ${stray.join(', ')}` : ''));
  missing.forEach(v => console.log('  нет: ' + v));
  bad += missing.length + stray.length;
}
process.exit(bad ? 1 : 0);
