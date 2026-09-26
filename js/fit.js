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
    var v = 1 - ssRes / ssTot;
    return v < 0 ? 0 : v > 1 ? 1 : v;
  }

  function percent(points, fn) { return Math.round(r2(points, fn) * 100); }

  // Обычная линейная регрессия — нужна, чтобы подсказать разумные начальные
  // значения ползунков: пустой график с нулями отпугивает.
  function linreg(points, tx) {
    var n = points.length, sx = 0, sy = 0, sxx = 0, sxy = 0;
    for (var i = 0; i < n; i++) {
      var x = tx ? tx(points[i].x) : points[i].x, y = points[i].y;
      sx += x; sy += y; sxx += x * x; sxy += x * y;
    }
    var d = n * sxx - sx * sx;
    if (!d) return { a: sy / n || 0, b: 0 };
    return { b: (n * sxy - sx * sy) / d, a: (sy * sxx - sx * sxy) / d };
  }

  A.fit = { r2: r2, percent: percent, linreg: linreg };
})(window.A);
