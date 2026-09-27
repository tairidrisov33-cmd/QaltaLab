import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const root = path.resolve(import.meta.dirname, '..');
const data = new Map();
const sandbox = {
  window: { A: { i18n: { t: s => s, fmt: (s, vars) => s.replace(/\{(\w+)\}/g, (_, k) => vars[k]) }, labs: [] } },
  localStorage: { getItem: k => data.get(k) ?? null, setItem: (k, v) => data.set(k, v) }
};
vm.createContext(sandbox);
for (const name of ['utils.js', 'fit.js', 'store.js', 'labs/hearing.js', 'labs/hick.js', 'labs/pitch.js']) {
  vm.runInContext(fs.readFileSync(path.join(root, 'js', name), 'utf8'), sandbox, { filename: name });
}
const A = sandbox.window.A;
const lab = id => A.labs.find(item => item.id === id);

function fakeH(sel, props, kids) {
  if (Array.isArray(props)) { kids = props; props = {}; }
  const node = {
    sel, style: {}, children: [], className: sel,
    classList: { toggle() {}, add() {}, remove() {} },
    appendChild(child) { this.children.push(child); return child; },
    get firstChild() { return this.children[0] ?? null; },
    removeChild(child) { this.children.splice(this.children.indexOf(child), 1); }
  };
  Object.assign(node, props ?? {});
  for (const child of kids ?? []) if (typeof child === 'object' && child) node.appendChild(child);
  return node;
}

function find(node, predicate) {
  if (predicate(node)) return node;
  for (const child of node.children ?? []) {
    const match = find(child, predicate);
    if (match) return match;
  }
  return null;
}

test('whole numbers keep their zeros while fractional zeros are trimmed', () => {
  assert.equal(A.u.num(1000, 0), '1000');
  assert.equal(A.u.num(120, 2), '120');
  assert.equal(A.u.num(12.50, 2), '12.5');
  assert.equal(A.u.hz(19000), '19 кГц');
});

test('R² stays negative when the curve fits worse than the mean', () => {
  assert.equal(A.fit.r2([{ x: 1, y: 1 }, { x: 2, y: 3 }], () => 5), -9);
});

test('hearing verdict counts every tone and distinguishes a skipped tone from one heard', () => {
  const hearing = lab('hearing');
  const freqs = [500, 1000, 2000, 4000, 8000, 12000, 15000, 17000, 19000];
  const points = freqs.map(x => ({ x, y: 50, heard: true }));
  assert.equal(hearing.verdict({ hyp: 'all', points }).ok, true);
  points[5] = { x: 12000, y: 100, heard: false };
  assert.equal(hearing.verdict({ hyp: 'all', points }).ok, false);
  assert.equal(hearing.verdict({ hyp: 'stop', points }).ok, true);
  assert.equal(hearing.reveal({ points, match: 80 }).you.includes('19 кГц'), true);
});

test('weak Hick data produce an inconclusive result', () => {
  const hick = lab('hick');
  const points = [{ x: 1, y: 300 }, { x: 8, y: 250 }];
  const result = hick.verdict({ hyp: 'log', points, model: hick.models[0], match: -10 });
  assert.equal(result.inconclusive, true);
});

test('reset removes a completed experiment from progress', () => {
  A.store.finish('hick', { params: {}, match: 80, model: 'log' });
  assert.equal(A.store.openedCount(), 1);
  A.store.reset('hick');
  assert.equal(A.store.openedCount(), 0);
});

test('reaction timers stop on exit and an early double tap schedules only one retry', () => {
  const timers = new Map();
  let serial = 0;
  const env = {
    window: { A: { h: fakeH, labs: [], i18n: { t: s => s }, u: { clear: el => { el.children = []; }, median: A.u.median } } },
    setTimeout: fn => { const id = ++serial; timers.set(id, fn); return id; },
    clearTimeout: id => timers.delete(id),
    performance: { now: () => 1000 }
  };
  vm.createContext(env);
  vm.runInContext(fs.readFileSync(path.join(root, 'js/labs/hick.js'), 'utf8'), env);
  const host = fakeH('div');
  const cleanup = env.window.A.labs[0].measure(host, { setPoints() {}, done() {} });
  find(host, n => n.sel === 'button.btn.btn--primary.btn--wide').onclick();
  assert.equal(timers.size, 1);
  const target = find(host, n => n.sel === 'button' && n['data-k'] === 0);
  target.onclick();
  target.onclick();
  assert.equal(timers.size, 1);
  cleanup();
  assert.equal(timers.size, 0);
});

test('late microphone permission cannot leave a stream running after exit', async () => {
  let grant;
  let stopped = false;
  const env = {
    window: { A: {
      h: fakeH, labs: [], i18n: { t: s => s }, u: { clear: el => { el.children = []; }, num: A.u.num, median: A.u.median },
      // пояснение и ошибка разрешения рисуются отдельным модулем; здесь проверяем только поток микрофона
      perm: { note: () => fakeH('div'), caveat: () => fakeH('div'), errorBox: () => ({ el: fakeH('div'), show() {}, hide() {}, translate() {} }) }
    } },
    navigator:{ mediaDevices: { getUserMedia: () => new Promise(resolve => { grant = resolve; }) } }
  };
  vm.createContext(env);
  vm.runInContext(fs.readFileSync(path.join(root, 'js/labs/pitch.js'), 'utf8'), env);
  const host = fakeH('div');
  const cleanup = env.window.A.labs[0].measure(host, { points: [], setPoints() {}, done() {} });
  find(host, n => n.sel === 'button.btn.btn--primary').onclick();
  cleanup();
  grant({ getTracks: () => [{ stop: () => { stopped = true; } }] });
  await Promise.resolve();
  assert.equal(stopped, true);
});
