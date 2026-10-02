// «Данные класса»: общий график опыта для всего класса.
// Учитель создаёт класс и получает короткий код, ученики отправляют свои
// точки, экран класса раз в несколько секунд забирает все серии.
// Хранилище — Supabase: таблицы закрыты, работа только через функции
// class_create / class_add / class_get, которые сами проверяют ввод.
// Имён нет: только код класса, id опыта и числа.

const LABS = require('./_zerde-config');

const MAX_BODY = 6 * 1024;
const MAX_POINTS = 40;
const TIMEOUT_MS = 8000;
const CODE = /^[A-HJ-NP-Z2-9]{5}$/;

// Ограничение частоты по действиям: экран класса опрашивает часто, а
// создавать классы и отправлять серии нужно редко.
const LIMITS = { create: 10, add: 20, get: 90 };
const hits = new Map();
function limited(ip, action) {
  const key = action + ':' + ip, now = Date.now();
  const arr = (hits.get(key) || []).filter(t => now - t < 60000);
  arr.push(now);
  hits.set(key, arr);
  if (hits.size > 5000) hits.clear();
  return arr.length > LIMITS[action];
}

const num = v => typeof v === 'number' && isFinite(v) && Math.abs(v) < 1e7;

async function rpc(name, args) {
  const url = process.env.SUPABASE_URL, key = process.env.SUPABASE_KEY;
  if (!url || !key) throw new Error('config');
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const r = await fetch(url + '/rest/v1/rpc/' + name, {
      method: 'POST',
      headers: { apikey: key, Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' },
      body: JSON.stringify(args),
      signal: ctrl.signal
    });
    const data = await r.json().catch(() => null);
    if (!r.ok) throw new Error((data && data.message) || ('status ' + r.status));
    return data;
  } finally {
    clearTimeout(timer);
  }
}

// Отказы отдаём с кодом 200 и success:false: интерфейс сам покажет понятный
// текст, а браузер не засоряет консоль сетевыми ошибками.
module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown';
  const fail = reason => res.status(200).json({ success: false, reason });

  try {
    if (req.method === 'GET') {
      const code = String((req.query && req.query.code) || '').toUpperCase();
      if (!CODE.test(code)) return fail('code');
      if (limited(ip, 'get')) return fail('rate');
      const data = await rpc('class_get', { p_code: code });
      if (!data) return fail('missing');
      const runs = Array.isArray(data.runs) ? data.runs : [];
      return res.status(200).json({ success: true, code, lab: data.lab, runs });
    }

    if (req.method !== 'POST') { res.status(405).json({ success: false }); return; }
    const len = parseInt(req.headers['content-length'] || '0', 10);
    if (len > MAX_BODY) return fail('size');
    let body = req.body;
    if (typeof body === 'string') { try { body = JSON.parse(body); } catch (e) { body = null; } }
    if (!body || typeof body !== 'object') return fail('data');

    const lab = body.lab;
    if (typeof lab !== 'string' || !Object.prototype.hasOwnProperty.call(LABS, lab)) return fail('lab');

    if (body.action === 'create') {
      if (limited(ip, 'create')) return fail('rate');
      const code = await rpc('class_create', { p_lab: lab });
      if (typeof code !== 'string' || !CODE.test(code)) return fail('unavailable');
      return res.status(200).json({ success: true, code, lab });
    }

    if (body.action === 'add') {
      const code = String(body.code || '').toUpperCase();
      if (!CODE.test(code)) return fail('code');
      if (!Array.isArray(body.points) || !body.points.length || body.points.length > MAX_POINTS) return fail('data');
      const points = [];
      for (const p of body.points) {
        if (!p || !num(p.x) || !num(p.y)) return fail('data');
        points.push({ x: Math.round(p.x * 1000) / 1000, y: Math.round(p.y * 1000) / 1000 });
      }
      if (limited(ip, 'add')) return fail('rate');
      const n = await rpc('class_add', { p_code: code, p_lab: lab, p_points: points });
      return res.status(200).json({ success: true, n });
    }

    return fail('data');
  } catch (e) {
    // Подробности наружу не отдаём: «нет класса», «класс заполнен» и сбой сети
    // для ученика выглядят одинаково — «не удалось отправить».
    const m = String(e && e.message || '');
    console.error('class', m.slice(0, 60));
    return fail(/no class/.test(m) ? 'missing' : /class full/.test(m) ? 'full' : 'unavailable');
  }
};
