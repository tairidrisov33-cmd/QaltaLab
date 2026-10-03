// Сквозной тест: главная (домбра, темы, фильтры), учитель создаёт класс,
// ученик входит по /c/КОД, проходит «Физику домбры» на звуке щипков
// (pluck.wav вместо микрофона), точки появляются на экране класса.
import { spawn } from 'node:child_process';
import { join } from 'node:path';
import { writeFileSync, mkdirSync } from 'node:fs';
import { sleep } from './cdp.mjs';

const DIR = join(import.meta.dirname, '.out');
const BASE = process.env.BASE || 'http://localhost:8766/';
mkdirSync(join(DIR, 'shots'), { recursive: true });
const chrome = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', ['--headless=new', '--remote-debugging-port=9341', '--no-first-run',
  '--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream', '--use-file-for-fake-audio-capture=' + join(DIR, 'pluck.wav'),
  '--autoplay-policy=no-user-gesture-required', '--user-data-dir=' + join(DIR, 'prof-9341'), 'about:blank']);
let ws; for (let i = 0; i < 60 && !ws; i++) { try { const l = await (await fetch('http://127.0.0.1:9341/json')).json(); const p = l.find(t => t.type === 'page'); if (p) ws = new WebSocket(p.webSocketDebuggerUrl); } catch {} if (!ws) await sleep(250); }
await new Promise(r => ws.onopen = r);
let id = 0; const pend = new Map(); const errs = [];
ws.onmessage = e => {
  const m = JSON.parse(e.data);
  if (m.id && pend.has(m.id)) { pend.get(m.id)(m); pend.delete(m.id); }
  if (m.method === 'Runtime.exceptionThrown') errs.push('EXC ' + (m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text).slice(0, 200));
  if (m.method === 'Runtime.consoleAPICalled' && (m.params.type === 'error' || m.params.type === 'warning')) errs.push(m.params.type + ' ' + m.params.args.map(a => a.value ?? a.description).join(' ').slice(0, 200));
  if (m.method === 'Log.entryAdded' && m.params.entry.level === 'error') errs.push('LOG ' + m.params.entry.text.slice(0, 160));
};
const send = (method, params = {}) => new Promise(r => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
const ev = async e => { const r = await send('Runtime.evaluate', { expression: e, returnByValue: true, awaitPromise: true }); if (r.result?.exceptionDetails) throw new Error('eval: ' + e.slice(0, 80) + ' :: ' + (r.result.exceptionDetails.exception?.description || '')); return r.result?.result?.value; };
const shot = async (name, full) => { const r = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: !!full }); writeFileSync(join(DIR, 'shots', name + '.png'), Buffer.from(r.result.data, 'base64')); };
const nav = async (url, wait = 1500) => { await send('Page.navigate', { url }); await sleep(wait); };
const view = (w, h, mob) => send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile: mob });
await send('Runtime.enable'); await send('Page.enable'); await send('Log.enable');

const out = {};
let q = 0;
for (const [w, h, mob] of [[1280, 900, false], [390, 844, true]]) {
  await view(w, h, mob);
  await nav(BASE + '?a=' + (++q) + '#/');
  await ev(`localStorage.setItem('spl.lang','ru'); localStorage.setItem('spl.theme','light'); true`);
  await nav(BASE + '?b=' + (++q) + '#/');
  await ev(`window.scrollTo({top: document.querySelector('.sig').getBoundingClientRect().top + scrollY - 90, behavior: 'instant'}); true`); await sleep(900);
  await shot(`e2e-${w}-sig`);
  await ev(`window.scrollTo({top: document.querySelector('.labfilter').getBoundingClientRect().top + scrollY - 90, behavior: 'instant'}); true`); await sleep(900);
  await shot(`e2e-${w}-tracks`);
  const vis = () => ev(`[...document.querySelectorAll('.tracks .labcard')].filter(c => !c.hidden && c.offsetParent).map(c => c.querySelector('.labcard__t').innerText).join(', ')`);
  for (const f of ['Со звуком', 'С камерой', 'Только экран', 'До 3 минут', 'Все опыты']) {
    await ev(`[...document.querySelectorAll('.labfilter button')].find(b => b.innerText === ${JSON.stringify(f)}).click(); true`); await sleep(150);
    out[`${w} filter ${f}`] = await vis();
  }
  out[`${w} overflow`] = await ev(`document.documentElement.scrollWidth - document.documentElement.clientWidth`);
}

// учитель создаёт класс из опыта
await view(1280, 900, false);
await nav(BASE + '?c=' + (++q) + '#/lab/dombra');
await ev(`[...document.querySelectorAll('button')].find(b => b.innerText.startsWith('Провести с классом')).click(); true`);
await sleep(2500);
const code = await ev(`(document.querySelector('.board__code') || {}).innerText`);
out.code = code;
await shot('e2e-board-empty');

// ученик (телефон) входит по короткой ссылке
await view(390, 844, true);
await nav(BASE.replace(/\/$/, '') + '/c/' + code, 2500);
out.joinedHash = await ev('location.hash');
out.classbar = await ev(`(document.querySelector('.classbar') || {}).innerText`);
await ev(`document.querySelector('#view .btn--primary').click(); true`); await sleep(300);
await ev(`document.querySelector('.hyp button').click(); [...document.querySelectorAll('#view .btn--primary')].pop().click(); true`); await sleep(500);
await ev(`[...document.querySelectorAll('#view .btn--primary')][0].click(); true`); await sleep(1500);
const rec = [];
for (const L of [70, 52.5, 39, 35]) {
  await ev(`(() => { const s = document.querySelector('input[type=range]'); s.value = ${L}; s.dispatchEvent(new Event('input')); return true; })()`);
  let ok = false;
  for (let t = 0; t < 40 && !ok; t++) { await sleep(150); ok = await ev(`!document.querySelector('#view .btn-row .btn:not(.btn--primary)').disabled`); }
  rec.push(await ev(`document.querySelector('.readout').innerText.replace(/\\s+/g,' ')`));
  if (ok) await ev(`document.querySelector('#view .btn-row .btn:not(.btn--primary)').click(); true`);
  if (L === 52.5) { await ev(`document.querySelector('.pad').scrollIntoView({block:'start'}); window.scrollBy(0,-80); true`); await sleep(200); await shot('e2e-dombra-measure'); }
}
out.readouts = rec;
out.table = await ev(`[...document.querySelectorAll('table.points tbody tr')].map(r => r.innerText.replace(/\\s+/g,' ').replace('убрать','').trim())`);
await ev(`[...document.querySelectorAll('#view .btn--primary')].find(b => b.innerText.startsWith('Готово')).click(); true`); await sleep(800);
await ev(`[...document.querySelectorAll('#view .btn--primary')].find(b => b.innerText.startsWith('Разобрать')).click(); true`); await sleep(3000);
out.classres = await ev(`(document.querySelector('.classres') || {}).innerText`);
await shot('e2e-dombra-result', true);

// экран класса
await view(1280, 900, false);
await nav(BASE + '?d=' + (++q) + '#/class/' + code, 3500);
out.board = await ev(`[...document.querySelectorAll('.board__stats > div')].map(d => d.innerText.replace(/\\s+/g,' ')).join(' | ')`);
out.boardParams = await ev(`document.querySelector('.board__params').innerText.replace(/\\s+/g,' ')`);
await shot('e2e-board-1');
await nav(BASE + '?e=' + (++q) + '#/class/demo', 1500);
out.demo = await ev(`[...document.querySelectorAll('.board__stats > div')].map(d => d.innerText.replace(/\\s+/g,' ')).join(' | ') + ' || ' + document.querySelector('.board__params').innerText.replace(/\\s+/g,' ')`);
await shot('e2e-board-demo');
await view(390, 844, true);
await nav(BASE + '?f=' + (++q) + '#/class/demo', 1500);
await shot('e2e-board-demo-390', true);
out.overflowBoard390 = await ev(`document.documentElement.scrollWidth - document.documentElement.clientWidth`);
out.errors = errs;
console.log(JSON.stringify(out, null, 1));
chrome.kill(); process.exit(0);
