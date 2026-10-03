// Мини-обвязка Chrome DevTools Protocol без зависимостей.
import { spawn } from 'node:child_process';
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

// Скриншоты, профили Chrome и звуки для тестов — в tools/qa/.out (не в git).
export const DIR = join(import.meta.dirname, '.out');
mkdirSync(DIR, { recursive: true });
export const sleep = ms => new Promise(r => setTimeout(r, ms));

export async function launch(port = 9333) {
  const chrome = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', [
    '--headless=new', '--remote-debugging-port=' + port, '--no-first-run', '--no-default-browser-check',
    '--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream', '--autoplay-policy=no-user-gesture-required',
    '--user-data-dir=' + join(DIR, 'prof-' + port), 'about:blank'
  ]);
  let ws;
  for (let i = 0; i < 60 && !ws; i++) {
    try {
      const list = await (await fetch('http://127.0.0.1:' + port + '/json')).json();
      const page = list.find(t => t.type === 'page');
      if (page) ws = new WebSocket(page.webSocketDebuggerUrl);
    } catch {}
    if (!ws) await sleep(250);
  }
  await new Promise(r => ws.onopen = r);
  let id = 0; const pend = new Map(); const errors = [];
  ws.onmessage = e => {
    const m = JSON.parse(e.data);
    if (m.id && pend.has(m.id)) { pend.get(m.id)(m); pend.delete(m.id); }
    if (m.method === 'Runtime.exceptionThrown') errors.push('EXC ' + (m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text).slice(0, 300));
    if (m.method === 'Runtime.consoleAPICalled' && (m.params.type === 'error' || m.params.type === 'warning'))
      errors.push(m.params.type + ' ' + m.params.args.map(a => a.value ?? a.description).join(' ').slice(0, 300));
    if (m.method === 'Log.entryAdded' && m.params.entry.level === 'error') errors.push('LOG ' + m.params.entry.text.slice(0, 200) + ' ' + (m.params.entry.url || ''));
  };
  const send = (method, params = {}) => new Promise(r => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
  await send('Runtime.enable'); await send('Log.enable'); await send('Page.enable');
  const P = {
    errors, send,
    ev: async expr => {
      const r = await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true });
      if (r.result?.exceptionDetails) throw new Error('eval: ' + (r.result.exceptionDetails.exception?.description || r.result.exceptionDetails.text));
      return r.result?.result?.value;
    },
    view: async (w, h, mobile) => {
      await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile });
      await send('Emulation.setTouchEmulationEnabled', { enabled: mobile });
    },
    go: async (url, wait = 1500) => { await send('Page.navigate', { url }); await sleep(wait); },
    shot: async (name, full) => {
      mkdirSync(join(DIR, 'shots'), { recursive: true });
      const r = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: !!full });
      writeFileSync(join(DIR, 'shots', name + '.png'), Buffer.from(r.result.data, 'base64'));
    },
    // Клик по кнопке с текстом (точное совпадение после trim), внутри #view или везде.
    click: async (text, sel = 'button') => {
      const ok = await P.ev(`(() => { const b = [...document.querySelectorAll(${JSON.stringify(sel)})].find(b => b.innerText.trim() === ${JSON.stringify(text)} && !b.disabled && b.offsetParent); if (!b) return false; b.click(); return true; })()`);
      if (!ok) throw new Error('no button: ' + text);
      await sleep(250);
    },
    mouse: async (type, x, y) => send('Input.dispatchMouseEvent', { type, x, y, button: 'left', buttons: type === 'mouseReleased' ? 0 : 1, clickCount: 1, pointerType: 'mouse' }),
    // Провести линию мышью по точкам [x, y] в координатах окна.
    stroke: async pts => {
      await P.mouse('mousePressed', pts[0][0], pts[0][1]);
      for (const [x, y] of pts.slice(1)) { await P.mouse('mouseMoved', x, y); await sleep(8); }
      await P.mouse('mouseReleased', pts[pts.length - 1][0], pts[pts.length - 1][1]);
    },
    overflow: () => P.ev('document.documentElement.scrollWidth - document.documentElement.clientWidth'),
    close: () => chrome.kill()
  };
  return P;
}
