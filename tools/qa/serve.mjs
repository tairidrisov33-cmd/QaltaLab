// Статический сервер для локальной проверки сайта. /api/class вызывает
// настоящую функцию (с базой Supabase), остальные /api/* — заглушка.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { join, extname, normalize } from 'node:path';
import { createRequire } from 'node:module';

const ROOT = join(import.meta.dirname, '..', '..');
// Для настоящего /api/class задайте SUPABASE_URL и SUPABASE_KEY в окружении;
// без них класс отвечает «недоступен», остальной сайт работает.
const classFn = createRequire(import.meta.url)(join(ROOT, 'api', 'class.js'));
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.ico': 'image/x-icon', '.webmanifest': 'application/manifest+json' };

createServer(async (req, res) => {
  const [path, qs] = req.url.split('?');
  const url = decodeURIComponent(path);
  if (url === '/api/class') {
    let raw = '';
    for await (const ch of req) raw += ch;
    const fakeReq = { method: req.method, headers: Object.assign({}, req.headers, { 'content-length': String(Buffer.byteLength(raw)) }), query: Object.fromEntries(new URLSearchParams(qs || '')), body: raw || null };
    const fakeRes = {
      code: 200, setHeader() {}, status(c) { this.code = c; return this; },
      json(o) { res.writeHead(this.code, { 'content-type': 'application/json' }); res.end(JSON.stringify(o)); }
    };
    await classFn(fakeReq, fakeRes);
    return;
  }
  if (url.startsWith('/api/')) { res.writeHead(200, { 'content-type': 'application/json' }); res.end('{"success":false,"reason":"local"}'); return; }
  const m = /^\/c\/([A-Za-z0-9]{5})$/.exec(url);
  if (m) { res.writeHead(307, { location: '/#/c/' + m[1] }); res.end(); return; }
  const file = normalize(join(ROOT, url === '/' ? 'index.html' : url));
  try {
    const body = await readFile(file);
    res.writeHead(200, { 'content-type': TYPES[extname(file)] || 'application/octet-stream', 'cache-control': 'no-store' });
    res.end(body);
  } catch { res.writeHead(404); res.end('nf'); }
}).listen(8766, () => console.log('http://localhost:8766'));
