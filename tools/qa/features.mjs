// Проверка новых функций: тур, значки, «Мои классы», QR на листе урока.
import { launch, sleep } from './cdp.mjs';
const BASE = process.env.BASE || 'http://localhost:8766/';
const P = await launch(9356);
const out = {};
let q = 0;
const go = (h, w = 1500) => P.go(BASE + '?t=' + (++q) + h, w);
for (const [w, hgt, mob, lang] of [[1280, 860, false, 'ru'], [390, 844, true, 'kk']]) {
  const tag = w + lang;
  await P.view(w, hgt, mob);
  await go('#/');
  await P.ev(`localStorage.clear(); localStorage.setItem('spl.lang','${lang}'); true`);
  // тур
  await go('#/tour', 1500);
  out[tag + ' tour 1'] = await P.ev(`document.querySelector('.tour__t').innerText`);
  await P.shot(`feat-${tag}-tour1`);
  await P.ev(`document.dispatchEvent(new KeyboardEvent('keydown', {key: 'ArrowRight'})); true`); await sleep(400);
  await P.ev(`document.dispatchEvent(new KeyboardEvent('keydown', {key: 'ArrowRight'})); true`); await sleep(400);
  out[tag + ' tour 3'] = await P.ev(`document.querySelector('.tour__k').innerText + ' | ' + document.querySelector('.tour__t').innerText`);
  await P.shot(`feat-${tag}-tour3`);
  for (let i = 0; i < 4; i++) { await P.ev(`[...document.querySelectorAll('.tour__nav .btn--primary')].forEach(b => !b.hidden && b.click()); true`); await sleep(300); }
  out[tag + ' tour last'] = await P.ev(`document.querySelector('.tour__k').innerText + ' | ' + [...document.querySelectorAll('.tour__cta .btn')].map(b => b.innerText).join(' / ')`);
  await P.shot(`feat-${tag}-tour6`);
  // значки: пройти опыт с подменой измерения
  await go('#/lab/timing', 1200);
  await P.ev(`(() => { const lab = A.lab.byId('timing'); lab.measure = function (h, api) { api.setPoints([{x:2,y:2.3},{x:4,y:4.5},{x:8,y:9.4},{x:16,y:18.1}]); setTimeout(api.done, 50); }; document.querySelector('#view .btn--primary').click(); return true; })()`); await sleep(300);
  await P.ev(`document.querySelector('.hyp button').click(); [...document.querySelectorAll('#view .btn--primary')].pop().click(); true`); await sleep(800);
  await P.ev(`[...document.querySelectorAll('#view .btn--primary')].pop().click(); true`); await sleep(900);
  out[tag + ' badge'] = await P.ev(`(document.querySelector('.newbadge') || {}).innerText`);
  await P.ev(`document.querySelector('.newbadge').scrollIntoView({block:'center'}); true`); await sleep(500);
  await P.shot(`feat-${tag}-badge`);
  await P.ev(`document.querySelector('.newbadge .linkbtn').click(); true`); await sleep(1600);
  out[tag + ' shelf'] = await P.ev(`(document.querySelector('.shelf__n') || {}).innerText + ' on=' + document.querySelectorAll('.shelf__item.is-on').length`);
  await P.shot(`feat-${tag}-shelf`);
  // «Мои классы»: создание класса подменено, база не трогается
  await P.ev(`(() => { const f = window.fetch; window.fetch = (u, o) => (String(u).includes('/api/class') && o && o.method === 'POST') ? Promise.resolve(new Response(JSON.stringify({success:true, code:'K7M2Q', lab:'timing'}))) : f(u, o); return true; })()`);
  await P.ev(`document.querySelector('.teach__class .btn--primary').click(); true`); await sleep(1500);
  await go('#/', 1800);
  out[tag + ' myclasses'] = await P.ev(`(document.querySelector('.myclasses') || {}).innerText`);
  await P.ev(`document.querySelector('.teach__class').scrollIntoView({block:'center'}); true`); await sleep(600);
  await P.shot(`feat-${tag}-myclasses`);
  // QR на листе урока
  await go('#/lesson/dombra', 1200);
  out[tag + ' lesson qr'] = await P.ev(`!!document.querySelector('.lesson__qr svg')`);
  await P.ev(`document.querySelector('.lesson__link').scrollIntoView({block:'center'}); true`); await sleep(400);
  await P.shot(`feat-${tag}-lessonqr`);
  out[tag + ' overflow'] = await P.overflow();
}
out.errors = P.errors;
console.log(JSON.stringify(out, null, 1));
P.close(); process.exit(0);
