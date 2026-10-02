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
      perm: { note: () => fakeH('div'), caveat: () => fakeH('div'), errorBox: () => ({ el: fakeH('div'), show() {}, hide() {}, translate() {} }), live: () => ({ el: fakeH('div'), on() {} }) }
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

test('changing bottle height invalidates the previous measured tone', async () => {
  const frames = [];
  const analyser = {
    fftSize: 8192,
    frequencyBinCount: 4096,
    getFloatFrequencyData(buf) { buf.fill(-100); buf[100] = -20; }
  };
  const env = {
    window: { A: {
      h: fakeH, labs: [], i18n: { t: s => s },
      u: { clear: el => { el.children = []; }, num: A.u.num, median: A.u.median, clamp: A.u.clamp },
      perm: { note: () => fakeH('div'), errorBox: () => ({ el: fakeH('div'), show() {}, hide() {}, translate() {} }), live: () => ({ el: fakeH('div'), on() {} }) }
    }, AudioContext: function () {
      return { state: 'running', sampleRate: 48000, createAnalyser: () => analyser,
        createMediaStreamSource: () => ({ connect() {} }), close() {} };
    } },
    navigator: { mediaDevices: { getUserMedia: async () => ({ getTracks: () => [{ stop() {} }] }) } },
    requestAnimationFrame: fn => { frames.push(fn); return frames.length; },
    cancelAnimationFrame() {}
  };
  vm.createContext(env);
  vm.runInContext(fs.readFileSync(path.join(root, 'js/labs/pitch.js'), 'utf8'), env);
  const host = fakeH('div');
  const cleanup = env.window.A.labs[0].measure(host, { points: [], setPoints() {}, done() {} });
  find(host, n => n.sel === 'button.btn.btn--primary').onclick();
  await Promise.resolve();
  for (let i = 0; i < 6; i++) frames.shift()();
  const add = find(host, n => n.sel === 'button.btn');
  assert.equal(add.disabled, false);
  const slider = find(host, n => n.sel === 'input' && n['aria-label'] === 'Высота воздуха над водой');
  slider.value = '10';
  slider.oninput();
  assert.equal(add.disabled, true);
  cleanup();
});

test('changing pendulum length discards the previous count and duplicate lengths are rejected', () => {
  let now = 0;
  let points = [];
  const env = {
    window: { A: {
      h: fakeH, raw: String, labs: [],
      i18n: { t: s => s, fmt: (s, vars) => s.replace(/\{(\w+)\}/g, (_, k) => vars[k]) },
      u: { clear: el => { el.children = []; }, num: A.u.num }
    } },
    performance: { now: () => now }
  };
  vm.createContext(env);
  vm.runInContext(fs.readFileSync(path.join(root, 'js/labs/pendulum.js'), 'utf8'), env);
  const host = fakeH('div');
  env.window.A.labs[0].measure(host, { points: [], setPoints: p => { points = p; }, done() {} });
  const slider = find(host, n => n.sel === 'input' && n.type === 'range');
  const tap = find(host, n => n.sel === 'button.btn.btn--primary.btn--wide');
  const add = find(host, n => n.sel === 'button.btn' && n.disabled === true);
  for (let i = 0; i <= 10; i++) { now = i * 1000; tap.onclick(); }
  assert.equal(add.disabled, false);
  slider.value = '40'; slider.oninput();
  assert.equal(add.disabled, true);
  for (let i = 0; i <= 10; i++) { now = 20000 + i * 1000; tap.onclick(); }
  add.onclick();
  assert.equal(points.length, 1);
  assert.equal(points[0].x, 40);
  for (let i = 0; i <= 10; i++) { now = 40000 + i * 1000; tap.onclick(); }
  add.onclick();
  assert.equal(points.length, 1);
});

test('blocked audio resume shows an error instead of starting an inaudible hearing trial', async () => {
  const env = {
    window: { A: {
      h: fakeH, labs: [], i18n: { t: s => s },
      perm: { caveat: s => fakeH('p', [s]) },
      u: { clamp: A.u.clamp, hz: A.u.hz }
    }, AudioContext: function () {
      return { state: 'suspended', resume: () => Promise.reject(new Error('blocked')), close: () => Promise.resolve() };
    } },
    performance: { now: () => 0 }
  };
  vm.createContext(env);
  vm.runInContext(fs.readFileSync(path.join(root, 'js/labs/hearing.js'), 'utf8'), env);
  const host = fakeH('div');
  env.window.A.labs[0].measure(host, { points: [], setPoints() {}, done() {} });
  host.children.at(-1).children[0].onclick();
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(find(host, n => n.sel === 'div.pad__hint').textContent.includes('Браузер не дал доступ к звуку'), true);
});

// «Нарисуй предсказание»: значение рисунка в точке опыта и подсчёт промаха.
function predictEnv() {
  const env = { window: { A: { u: A.u, i18n: A.i18n } } };
  vm.createContext(env);
  vm.runInContext(fs.readFileSync(path.join(root, 'js/predict.js'), 'utf8'), env);
  return env.window.A.predict;
}
const frameLab = { predict: { xMin: 0, xMax: 100, yMin: 0, yMax: 2.5 }, chart: {} };
const straight = Array.from({ length: 64 }, (_, k) => ({ x: k / 63 * 100, y: 0.02 * (k / 63 * 100) }));

test('a drawn prediction is read at the measured x and is absent outside the drawing', () => {
  const P = predictEnv();
  assert.ok(Math.abs(P.valueAt(frameLab, straight, 50) - 1) < 1e-9);
  const half = straight.filter(s => s.x <= 50);
  assert.equal(P.valueAt(frameLab, half, 90), null);
});

test('prediction error is measured against the spread of the student data', () => {
  const P = predictEnv();
  const points = [{ x: 20, y: 0.93 }, { x: 40, y: 1.22 }, { x: 60, y: 1.59 }, { x: 80, y: 1.74 }, { x: 100, y: 2.04 }];
  const c = P.compare(frameLab, straight, points);
  assert.equal(c.n, 5);
  assert.equal(c.worst.x, 20);
  assert.ok(Math.abs(c.mae - 0.306) < 0.01);
  assert.ok(c.share > 0.25);   // наивная прямая — «реальность оказалась другой»
  assert.equal(P.compare(frameLab, null, points), null);
});

// Звук струны: основной тон по гармоникам, даже если второй обертон громче.
function soundEnv() {
  const env = { window: { A: { u: A.u } } };
  vm.createContext(env);
  vm.runInContext(fs.readFileSync(path.join(root, 'js/sound.js'), 'utf8'), env);
  return env.window.A.sound;
}
function spectrum(peaks, rate = 48000, n = 8192) {
  const buf = new Float32Array(n / 2).fill(-110);
  for (const [f, db] of peaks) {
    const i = Math.round(f * n / rate);
    buf[i] = db; buf[i - 1] = db - 12; buf[i + 1] = db - 12;
  }
  return buf;
}

test('the string fundamental is found even when the second overtone is louder', () => {
  const S = soundEnv();
  const f = S.fundamental(spectrum([[147, -40], [294, -28], [441, -38]]), 48000, 8192, 70, 1200);
  assert.ok(Math.abs(f - 147) < 4, 'got ' + f);
  assert.equal(S.fundamental(spectrum([[147, -90]]), 48000, 8192, 70, 1200), 0);
});

test('the class curve is fitted automatically from all students points', () => {
  const model = { params: [{ key: 'a', min: 1000, max: 40000, step: 50, init: 10000 }], fn: (p, L) => p.a / L };
  const pts = [70, 55, 46, 35, 28].map(L => ({ x: L, y: 10300 / L }));
  const fit = A.fit.best(model, pts);
  assert.ok(Math.abs(fit.params.a - 10300) < 60, 'a = ' + fit.params.a);
  assert.ok(fit.r2 > 0.999);
});

// QR-код ссылки класса: версия 3 (29×29) и узоры-искатели в трёх углах.
test('the class link QR code has the right size and finder patterns', () => {
  const env = { window: { A: {} }, unescape, encodeURIComponent };
  vm.createContext(env);
  vm.runInContext(fs.readFileSync(path.join(root, 'js/qr.js'), 'utf8'), env);
  const m = env.window.A.qr.encode('https://qaltalab.site/c/UZSJ6');
  assert.equal(m.length, 29);
  for (const [x, y] of [[0, 0], [22, 0], [0, 22]]) {
    assert.equal(m[y][x] && m[y + 6][x + 6] && m[y + 3][x + 3], true);
    assert.equal(m[y + 1][x + 1], false);
  }
});

// Выбросы на графике класса: далёкая точка находится, обычный разброс — нет.
test('class outliers flag only points far from the shared curve', () => {
  const env = { window: { A: { u: A.u, h: () => ({}), i18n: { t: s => s } }, addEventListener() {} }, setTimeout: () => 0, localStorage: { getItem: () => null, setItem() {} }, sessionStorage: { getItem: () => null } };
  env.window.window = env.window;
  vm.createContext(env);
  vm.runInContext('var window = this.window; var setTimeout = this.setTimeout; var localStorage = this.localStorage; var sessionStorage = this.sessionStorage;' + fs.readFileSync(path.join(root, 'js/class.js'), 'utf8'), env);
  const f = L => 10300 / L;
  const pts = [70, 60, 55, 46, 40, 35, 30, 28, 23].map((L, i) => ({ x: L, y: f(L) * (1 + (i % 3 - 1) * 0.02) }));
  assert.equal(env.window.A.cls.outliers(pts, f).length, 0);
  pts.push({ x: 55, y: 262 });
  const bad = env.window.A.cls.outliers(pts, f);
  assert.equal(bad.length, 1);
  assert.equal(bad[0].y, 262);
});
