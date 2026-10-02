/* Подгонка кривой под точки школьника.
   Главная механика продукта: формулу мы не показываем — ученик сам крутит
   ползунки, а мы честно считаем, насколько его кривая описывает его же данные. */

window.A = window.A || {};

(function (A) {
  'use strict';

  // Коэффициент детерминации R^2: доля разброса данных, которую объясняет кривая.
  // Берём именно его, а не «на глаз»: число должно быть настоящим, иначе весь
  // смысл «ты открыл закон» рассыпается.
  function r2(points, fn) {
    if (!points || points.length < 2) return 0;
    var n = points.length, i, mean = 0;
    for (i = 0; i < n; i++) mean += points[i].y;
    mean /= n;

    var ssRes = 0, ssTot = 0;
    for (i = 0; i < n; i++) {
      var pred = fn(points[i].x);
      if (!isFinite(pred)) return 0;
      var d = points[i].y - pred;
      ssRes += d * d;
      var t = points[i].y - mean;
      ssTot += t * t;
    }
    if (ssTot === 0) return ssRes === 0 ? 1 : 0;
    // R² can be negative when a model is worse than the horizontal mean.
    // Preserve that result instead of presenting it as a measured 0%.
    return 1 - ssRes / ssTot;
  }

  function percent(points, fn) { return Math.round(r2(points, fn) * 100); }


  // Лучшие параметры модели по точкам — для общего графика класса, где
  // ползунков нет. Поиск по образцу: шагаем каждым параметром в обе стороны,
  // пока R² растёт, потом уменьшаем шаг. Границы и шаги — как у ползунков.
  function best(model, points) {
    var p = {};
    model.params.forEach(function (q) {
      var v = typeof q.init === 'function' ? q.init(points) : q.init;
      p[q.key] = Math.min(q.max, Math.max(q.min, v));
    });
    var score = function (pp) { var r = r2(points, function (x) { return model.fn(pp, x); }); return isFinite(r) ? r : -Infinity; };
    var cur = score(p);
    var delta = model.params.map(function (q) { return (q.max - q.min) / 8; });
    for (var it = 0; it < 400; it++) {
      var moved = false;
      model.params.forEach(function (q, i) {
        [1, -1].forEach(function (sgn) {
          var t = Object.assign({}, p);
          t[q.key] = Math.min(q.max, Math.max(q.min, p[q.key] + sgn * delta[i]));
          var s = score(t);
          if (s > cur + 1e-12) { p = t; cur = s; moved = true; }
        });
      });
      if (!moved) {
        var small = true;
        delta = delta.map(function (d, i) { var nd = d / 2; if (nd > model.params[i].step / 4) small = false; return nd; });
        if (small) break;
      }
    }
    return { params: p, r2: cur };
  }

  A.fit = { r2: r2, percent: percent, best: best };
})(window.A);
