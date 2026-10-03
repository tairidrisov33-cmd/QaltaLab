import { launch, sleep } from './cdp.mjs';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
const OUT = join(import.meta.dirname, '..', '..', 'docs', 'readme') + '/';
const P = await launch(9354);
await P.send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
await P.send('Emulation.setTouchEmulationEnabled', { enabled: true });
const B = 'https://qaltalab.site/';
let q = 0;
const go = async (h, w = 1800) => P.go(B + '?p=' + (++q) + h, w);
const shot = async name => { const r = await P.send('Page.captureScreenshot', { format: 'png' }); writeFileSync(OUT + name, Buffer.from(r.result.data, 'base64')); console.log(name); };
await go('#/'); await P.ev(`localStorage.clear(); localStorage.setItem('spl.lang','ru'); localStorage.setItem('spl.theme','light'); true`);
await go('#/', 2500);
await P.ev(`document.querySelector('.zc') && (document.querySelector('.zc').style.display='none'); true`);
await shot('phone-home.png');
// рисунок-предсказание
await go('#/lab/pendulum', 1500);
await P.ev(`document.querySelector('.zc') && (document.querySelector('.zc').style.display='none'); document.querySelector('#view .btn--primary').click(); true`); await sleep(400);
await P.ev(`document.querySelectorAll('.hyp button')[0].click(); document.querySelector('.predict').scrollIntoView({block:'center'}); true`); await sleep(700);
const b = await P.ev(`(() => { const r = document.querySelector('.predict__cv').getBoundingClientRect(); return {x:r.left,y:r.top,w:r.width,h:r.height}; })()`);
const pts = []; for (let t = 0; t <= 1.0001; t += 0.05) { const L = 0.05 + t * 0.95; pts.push([b.x + 46 + t * (b.w - 62), b.y + b.h - 40 - (0.02 * L * 100 / 2.5) * (b.h - 54)]); }
await P.stroke(pts); await sleep(300);
await shot('phone-predict.png');
// результат домбры с карточкой «предсказание и реальность»
await go('#/lab/dombra', 1500);
await P.ev(`(() => { document.querySelector('.zc') && (document.querySelector('.zc').style.display='none'); const lab = A.lab.byId('dombra'); lab.measure = function (h, api) { api.setPoints([{x:70,y:148},{x:60,y:170},{x:52.5,y:199},{x:46.5,y:219},{x:35,y:290},{x:26,y:401}]); setTimeout(api.done, 50); }; document.querySelector('#view .btn--primary').click(); return true; })()`); await sleep(400);
await P.ev(`document.querySelectorAll('.hyp button')[0].click(); document.querySelector('.predict').scrollIntoView({block:'center'}); true`); await sleep(700);
const c = await P.ev(`(() => { const r = document.querySelector('.predict__cv').getBoundingClientRect(); return {x:r.left,y:r.top,w:r.width,h:r.height}; })()`);
const p2 = []; for (let t = 0; t <= 1.0001; t += 0.05) { const L = 10 + t * 70, f = 600 - 6 * L; p2.push([c.x + 46 + t * (c.w - 62), c.y + c.h - 40 - (f / 1000) * (c.h - 54)]); }
await P.stroke(p2);
await P.ev(`[...document.querySelectorAll('#view .btn--primary')].pop().click(); true`); await sleep(900);
await P.ev(`[...document.querySelectorAll('#view .btn--primary')].pop().click(); true`); await sleep(1200);
await P.ev(`window.scrollTo({top: document.querySelector('.law-data').getBoundingClientRect().top + scrollY - 70, behavior: 'instant'}); true`); await sleep(600);
await shot('phone-result.png');
// экран класса (пример)
await go('#/class/demo', 2000);
await P.ev(`document.querySelector('.zc') && (document.querySelector('.zc').style.display='none'); window.scrollTo({top: document.querySelector('.board__stats').getBoundingClientRect().top + scrollY - 150, behavior: 'instant'}); true`); await sleep(600);
await shot('phone-class.png');
console.log('errors', P.errors);
P.close(); process.exit(0);
