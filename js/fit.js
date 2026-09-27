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


  A.fit = { r2: r2, percent: percent };
})(window.A);
