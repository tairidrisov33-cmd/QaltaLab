/* «Нарисуй предсказание». До измерения ученик пальцем рисует, какой, по его
   мнению, выйдет график, — в тех же осях, что будут у опыта. После опыта
   рисунок ложится пунктиром поверх настоящих точек, и видно, где интуиция
   совпала с реальностью, а где нет. Это шаг «предскажи» из метода
   Predict–Observe–Explain (White & Gunstone, 1992), только не словами,
   а формой кривой.

   Рисунок хранится как ряд точек {x, y} в единицах опыта: по одной на каждую
   из N полос по горизонтали. Повторный штрих перезаписывает полосы, поэтому
   поправить кусок кривой можно, не стирая всё. */

window.A = window.A || {};

(function (A) {
  'use strict';

  var h = A.h;
  var N = 64;                        // полос по горизонтали
  var L = 46, R = 16, T = 14, B = 40; // поля, как у графика опыта, плюс место под подписи

  function palette() {
    var s = getComputedStyle(document.documentElement);
    var v = function (name, fallback) { return (s.getPropertyValue(name) || '').trim() || fallback; };
    return { grid: v('--line', '#DADFD5'), axis: v('--text-3', '#66766C'), pred: v('--warn', '#A96C08'), text: v('--text-3', '#66766C') };
  }

  // Перевод доли ширины 0..1 в x опыта и обратно — с учётом логарифмической оси.
  function xOf(f, t) {
    return f.logX ? Math.exp(Math.log(f.xMin) + t * (Math.log(f.xMax) - Math.log(f.xMin))) : f.xMin + t * (f.xMax - f.xMin);
  }
  function tOf(f, x) {
    return f.logX ? (Math.log(x) - Math.log(f.xMin)) / (Math.log(f.xMax) - Math.log(f.xMin)) : (x - f.xMin) / (f.xMax - f.xMin);
  }

  function frame(lab) {
    var p = lab.predict;
    return { xMin: p.xMin, xMax: p.xMax, yMin: p.yMin, yMax: p.yMax, logX: !!(lab.chart && lab.chart.logX) };
  }

  /* Холст для рисования. initial — уже нарисованное (при возврате на шаг),
     onChange(samples|null) зовётся после каждого штриха и после «Стереть». */
  function pad(lab, initial, onChange) {
    var f = frame(lab), cfg = lab.predict, ch = lab.chart || {};
    var buckets = new Array(N);
    for (var i = 0; i < N; i++) buckets[i] = null;
    (initial || []).forEach(function (s) {
      var k = Math.round(tOf(f, s.x) * (N - 1));
      if (k >= 0 && k < N) buckets[k] = s.y;
    });

    var canvas = h('canvas.predict__cv', { 'aria-label': 'Поле для рисования предсказания' });
    var hint = h('div.predict__hint', ['Проведи пальцем слева направо']);
    var clear = h('button.linkbtn', { type: 'button', onclick: function () { reset(); } }, ['Стереть']);
    var state = h('span.predict__state');
    var box = h('div.predict', [
      h('div.predict__top', [
        h('b.predict__h', ['Нарисуй, каким будет график']),
        h('span.predict__opt', ['по желанию'])
      ]),
      h('p.predict__d', ['Это твоё предсказание. После опыта настоящие точки лягут поверх рисунка — и станет видно, где интуиция не подвела.']),
      h('div.predict__stage', [canvas, hint]),
      h('div.predict__axes', [
        h('span', [A.raw('↑ ' + A.i18n.t(cfg.yLabel))]),
        h('span', [A.raw(A.i18n.t(cfg.xLabel) + ' →')])
      ]),
      h('div.predict__foot', [state, clear])
    ]);

    var ctx = canvas.getContext('2d');
    var W = 0, H = 0, drawing = false, last = -1;

    function size() {
      W = canvas.clientWidth || 320;
      H = Math.round(Math.min(Math.max(W * 0.56, 190), 250));
      var dpr = Math.min(window.devicePixelRatio || 1, 3);
      canvas.style.height = H + 'px';
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      paint();
    }

    var px = function (t) { return L + t * (W - L - R); };
    var py = function (y) { return H - B - (y - f.yMin) / (f.yMax - f.yMin) * (H - T - B); };

    function paint() {
      if (!W) return;
      var C = palette();
      ctx.clearRect(0, 0, W, H);
      ctx.font = '11px system-ui, sans-serif';
      ctx.fillStyle = C.text;
      ctx.strokeStyle = C.grid;
      ctx.lineWidth = 1;
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      for (var g = 0; g <= 4; g++) {
        var yv = f.yMin + (f.yMax - f.yMin) * g / 4;
        var y = Math.round(py(yv)) + 0.5;
        ctx.beginPath(); ctx.moveTo(L, y); ctx.lineTo(W - R, y); ctx.stroke();
        ctx.fillText(ch.yFmt ? ch.yFmt(yv) : A.u.num(yv, 0), L - 8, y);
      }
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      (ch.xTicks || [f.xMin, xOf(f, 0.5), f.xMax]).forEach(function (xv) {
        if (xv < f.xMin || xv > f.xMax) return;
        ctx.fillText(ch.xFmt ? ch.xFmt(xv) : A.u.num(xv, 0), px(tOf(f, xv)), H - B + 8);
      });
      ctx.strokeStyle = C.axis;
      ctx.beginPath(); ctx.moveTo(L, T); ctx.lineTo(L, H - B); ctx.lineTo(W - R, H - B); ctx.stroke();

      // сам рисунок — сплошной линией того же цвета, что потом пунктир
      ctx.strokeStyle = C.pred;
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      var open = false;
      for (var k = 0; k < N; k++) {
        if (buckets[k] === null) { open = false; continue; }
        var X = px(k / (N - 1)), Y = py(buckets[k]);
        if (!open) { ctx.moveTo(X, Y); open = true; } else ctx.lineTo(X, Y);
      }
      ctx.stroke();
      var any = buckets.some(function (b) { return b !== null; });
      hint.hidden = any;
      state.textContent = any ? A.i18n.t('Предсказание нарисовано') : '';
      clear.hidden = !any;
    }

    function at(e) {
      var r = canvas.getBoundingClientRect();
      var t = A.u.clamp((e.clientX - r.left - L) / (W - L - R), 0, 1);
      var y = f.yMin + (H - B - (e.clientY - r.top)) / (H - T - B) * (f.yMax - f.yMin);
      return { k: Math.round(t * (N - 1)), y: A.u.clamp(y, f.yMin, f.yMax) };
    }

    // Быстрый штрих пропускает полосы — заполняем их по прямой, без дыр.
    function put(p) {
      if (last >= 0 && last !== p.k && buckets[last] !== null) {
        var a = last, b = p.k, ya = buckets[last];
        var step = a < b ? 1 : -1;
        for (var k = a + step; k !== b; k += step) buckets[k] = ya + (p.y - ya) * (k - a) / (b - a);
      }
      buckets[p.k] = p.y;
      last = p.k;
      paint();
    }

    canvas.addEventListener('pointerdown', function (e) {
      drawing = true; last = -1;
      try { canvas.setPointerCapture(e.pointerId); } catch (err) {}
      put(at(e));
      e.preventDefault();
    });
    canvas.addEventListener('pointermove', function (e) { if (drawing) { put(at(e)); e.preventDefault(); } });
    var end = function () { if (!drawing) return; drawing = false; last = -1; onChange(samples()); };
    canvas.addEventListener('pointerup', end);
    canvas.addEventListener('pointercancel', end);

    function samples() {
      var out = [];
      for (var k = 0; k < N; k++) if (buckets[k] !== null) out.push({ x: xOf(f, k / (N - 1)), y: buckets[k] });
      return out.length >= 2 ? out : null;
    }

    function reset() {
      for (var k = 0; k < N; k++) buckets[k] = null;
      paint();
      onChange(null);
    }

    window.addEventListener('resize', size);
    setTimeout(size, 0);
    box.destroy = function () { window.removeEventListener('resize', size); };
    return box;
  }

  // Значение рисунка в точке x — по соседним полосам; вне нарисованного — null.
  function valueAt(lab, pred, x) {
    if (!pred || !pred.length) return null;
    var f = frame(lab);
    var t = tOf(f, x), half = 0.5 / (N - 1);
    var ts = pred.map(function (s) { return tOf(f, s.x); });
    if (t < ts[0] - half || t > ts[ts.length - 1] + half) return null;
    for (var i = 0; i < pred.length - 1; i++) {
      if (t <= ts[i + 1]) {
        if (ts[i + 1] - ts[i] > 3 / (N - 1)) return null;   // разрыв в рисунке
        var u = A.u.clamp((t - ts[i]) / (ts[i + 1] - ts[i]), 0, 1);
        return pred[i].y + (pred[i + 1].y - pred[i].y) * u;
      }
    }
    return pred[pred.length - 1].y;
  }

  /* Насколько рисунок разошёлся с измерениями: средний промах в единицах
     опыта, его доля от высоты поля и точка, где промах больше всего. */
  function compare(lab, pred, points) {
    var f = frame(lab), n = 0, sum = 0, worst = null;
    points.forEach(function (p) {
      var v = valueAt(lab, pred, p.x);
      if (v === null) return;
      var d = Math.abs(v - p.y);
      n++; sum += d;
      if (!worst || d > worst.d) worst = { x: p.x, p: v, m: p.y, d: d };
    });
    if (!n) return null;
    var mae = sum / n;
    // Промах меряем относительно размаха самих измерений: для маятника
    // 0,3 с — это много, хотя на всём поле рисования выглядит мелочью.
    var ys = points.map(function (p) { return p.y; });
    var span = Math.max(Math.max.apply(null, ys) - Math.min.apply(null, ys), (f.yMax - f.yMin) * 0.1);
    return { n: n, mae: mae, share: mae / span, worst: worst };
  }

  // Карточка «Предсказание и реальность» на экране результата.
  function card(lab, pred, points, demo) {
    var c = compare(lab, pred, points);
    if (!c) return null;
    var cfg = lab.predict, ch = lab.chart || {};
    var dig = cfg.digits || 0;
    var val = function (v) { return A.u.num(v, dig) + A.i18n.t(cfg.unit || ''); };
    var xs = function (v) { return ch.xFmt ? ch.xFmt(v) : A.u.num(v, 0); };
    var grade = c.share <= 0.1 ? 'close' : c.share <= 0.25 ? 'part' : 'far';
    var text = {
      close: 'Интуиция не подвела: рисунок почти совпал с измерениями.',
      part: 'Форму ты угадал частично. Посмотри на график: где пунктир уходит от точек?',
      far: 'Реальность оказалась другой — и это самое интересное. Разница между рисунком и точками и есть открытие.'
    }[grade];
    return h('div.pvr.pvr--' + grade, [
      h('div.pvr__h', [demo ? 'Пример: предсказание и реальность' : 'Предсказание и реальность']),
      h('div.pvr__row', [
        h('div.pvr__n', [A.raw(val(c.mae))]),
        h('div.pvr__t', [demo ? 'в среднем отличался нарисованный пример от точек' : 'в среднем твой рисунок отличался от измерений'])
      ]),
      h('p.pvr__d', [A.raw(A.i18n.fmt(demo ? 'Сильнее всего — при {x}: на рисунке {p}, а измерено {m}.' : 'Сильнее всего — при {x}: ты ожидал {p}, а измерено {m}.', { x: xs(c.worst.x), p: val(c.worst.p), m: val(c.worst.m) }))]),
      h('p.pvr__d', [text])
    ]);
  }

  A.predict = { pad: pad, compare: compare, card: card, valueAt: valueAt };
})(window.A);
