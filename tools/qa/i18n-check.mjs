// Ищет русские строковые литералы в js/** (кроме словарей), которых нет в словаре ru→kk.
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import vm from 'node:vm';

const ROOT = join(import.meta.dirname, '..', '..');
const files = ['js', 'js/labs'].flatMap(d => readdirSync(join(ROOT, d)).filter(f => f.endsWith('.js')).map(f => join(ROOT, d, f)));
// Загрузить словари так же, как в браузере.
const ctx = { window: {}, console };
ctx.window.A = {};
ctx.A = ctx.window.A;
vm.createContext(ctx);
for (const f of ['js/i18n.js', 'js/i18n-labs.js']) vm.runInContext(readFileSync(join(ROOT, f), 'utf8'), ctx);
const dict = ctx.window.A.i18n.dict;
const missing = new Map();
for (const f of files) {
  if (/i18n/.test(f)) continue;
  const src = readFileSync(f, 'utf8');
  // одинарные кавычки, без переносов
  const re = /'((?:[^'\\\n]|\\.)*)'/g;
  let m;
  while ((m = re.exec(src))) {
    const s = m[1].replace(/\\'/g, "'");
    if (!/[А-Яа-яЁё]/.test(s)) continue;
    // комментарии
    const lineStart = src.lastIndexOf('\n', m.index) + 1;
    const line = src.slice(lineStart, m.index);
    if (/\/\/|^\s*\*|\/\*/.test(line)) continue;
    if (dict[s] !== undefined) continue;
    if (!missing.has(s)) missing.set(s, f.replace(ROOT + '\\', '').replace(ROOT + '/', ''));
  }
}
for (const [s, f] of missing) console.log(f + ' | ' + s);
console.log('missing:', missing.size);
process.exit(missing.size ? 1 : 0);
