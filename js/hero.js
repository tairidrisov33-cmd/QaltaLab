/* Мини-опыт в шапке главной.
   Главная механика продукта в одном окне: двигаешь ползунок — кривая сразу
   меняется, а совпадение R² честно пересчитывается по точкам. Точки явно
   подписаны как пример данных, а не результат посетителя: свои он получит в
   настоящем опыте с маятником, куда ведёт кнопка под графиком. */

window.A = window.A || {};

(function (A) {
  'use strict';

  var h = A.h;

  // Период маятника (с) для нитей 20–100 см — такой ряд даёт аккуратное
  // ручное измерение: T = 2π√(L/g) с разбросом в несколько сотых секунды.
  // Лучшая кривая даёт R² ≈ 99% и g ≈ 9,8 м/с², а не подозрительные 100%.
  var DATA = [
    { x: 20, y: 0.93 },
    { x: 40, y: 1.22 },
    { x: 60, y: 1.59 },
    { x: 80, y: 1.74 },
    { x: 100, y: 2.04 }
  ];
  // Старт рядом с точками, но не на них (R² ≈ 60%): видно, что двигать,
  // и первый экран не открывается словами «R² ниже нуля».
  var K0 = 0.17;

  function create(host, onOpen) {
    var k = K0;
    var chartHost = h('div');
    var val = h('span.slider__val');
    var r2 = h('b.viz__r2');
    var hint = h('span.viz__hint');
    var input = h('input', {
      type: 'range', min: 0.10, max: 0.30, step: 0.002, value: K0,
      'aria-label': A.i18n.t('Коэффициент k, с/√см'),
      oninput: function () { k = parseFloat(input.value); refresh(); }
    });
    var reset = h('button.viz__reset', {
      type: 'button', onclick: function () { input.value = K0; k = K0; refresh(); }
    }, ['Сбросить']);

    host.appendChild(chartHost);
    host.appendChild(h('div.slider.slider--mini', [
      h('div.slider__top', [h('span', ['Коэффициент k, с/√см']), val]),
      input
    ]));
    host.appendChild(h('div.viz__foot', [r2, hint, reset]));
    var go = h('button.viz__go', { type: 'button', onclick: onOpen }, ['Проверить на своей нитке']);
    go.appendChild(A.icon('arrow'));
    host.appendChild(go);

    var chart = new A.Chart(chartHost, {
      xMin: 0, yMin: 0, minH: 140, maxH: 170, xTicks: [20, 60, 100],
      xFmt: function (v) { return Math.round(v) + A.i18n.t(' см'); },
      yFmt: function (v) { return A.u.num(v, 1) + A.i18n.t(' с'); }
    });

    function curve(x) { return x > 0 ? k * Math.sqrt(x) : NaN; }

    function refresh() {
      var pct = A.fit.percent(DATA, curve);
      val.textContent = A.u.num(k, 3);
      r2.textContent = pct < 0 ? A.i18n.t('R² ниже нуля') : 'R² ' + pct + '%';
      r2.className = 'viz__r2' + (pct >= 95 ? ' is-ok' : '');
      hint.textContent = A.i18n.t(pct >= 95 ? 'Легла на точки' : 'Двигай ползунок');
      chart.set(DATA, curve);
    }
    refresh();

    return function () { chart.destroy(); };
  }

  A.hero = { create: create };
})(window.A);
