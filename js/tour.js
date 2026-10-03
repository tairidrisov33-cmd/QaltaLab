/* «QaltaLab за 60 секунд» (#/tour): шесть слайдов — проблема, решение,
   домбра, рисунок-предсказание, общий график класса, результат пилота.
   Слайды листаются сами (по 9 с), стрелками, свайпом или кнопками; любое
   действие ставит автопрокрутку на паузу. Все числа — из A.facts. */

window.A = window.A || {};

(function (A) {
  'use strict';

  var h = A.h;
  var NS = 'http://www.w3.org/2000/svg';
  var STEP_MS = 9000;
  var stopFn = null;

  function svg(w, hgt, inner, cls) {
    var s = document.createElementNS(NS, 'svg');
    s.setAttribute('viewBox', '0 0 ' + w + ' ' + hgt);
    s.setAttribute('class', 'tour__svg' + (cls ? ' ' + cls : ''));
    s.setAttribute('aria-hidden', 'true');
    s.innerHTML = inner;
    return s;
  }

  function bars() {
    var P = A.facts.pisa;
    var row = function (label, v, cls) {
      var fill = h('i.' + cls); fill.style.width = v + '%';
      return h('div.tour__bar', [h('span', { text: label }), h('span.tour__track', [fill]), h('b', [A.raw(v + '%')])]);
    };
    return h('div.tour__bars', [row('Казахстан', P.kz, 'is-kz'), row('В среднем по ОЭСР', P.oecd, 'is-oecd')]);
  }

  // Рисунок-предсказание: настоящие точки, закон и пунктир догадки.
  function predictArt() {
    var X = function (l) { return 30 + l * 3.2; }, Y = function (t) { return 190 - t * 75; };
    var c = '', n = '';
    for (var l = 2; l <= 100; l += 2) c += (c ? 'L' : 'M') + X(l).toFixed(1) + ' ' + Y(0.2009 * Math.sqrt(l)).toFixed(1);
    for (var k = 5; k <= 100; k += 5) n += (n ? 'L' : 'M') + X(k).toFixed(1) + ' ' + Y(0.02 * k).toFixed(1);
    var dots = [[20, 0.93], [40, 1.22], [60, 1.59], [80, 1.74], [100, 2.04]].map(function (p) {
      return '<circle cx="' + X(p[0]) + '" cy="' + Y(p[1]) + '" r="6" class="tour__dot"/>';
    }).join('');
    return svg(370, 210, '<path d="M30 20V190H360" class="tour__axis"/><path d="' + n + '" class="tour__pred"/><path d="' + c + '" class="tour__law"/>' + dots);
  }

  // Общий график класса: облако точек вокруг одной прямой и один выброс.
  function classArt() {
    var seed = 3, rnd = function () { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    var X = function (v) { return 30 + v * 320; }, Y = function (v) { return 190 - v * 160; };
    var pts = '';
    [0.12, 0.3, 0.5, 0.72, 0.95].forEach(function (x) {
      for (var i = 0; i < 6; i++) pts += '<circle cx="' + (X(x) + (rnd() - 0.5) * 16).toFixed(1) + '" cy="' + Y(x * 0.9 + (rnd() - 0.5) * 0.12).toFixed(1) + '" r="5" class="tour__ghost"/>';
    });
    return svg(370, 210, '<path d="M30 20V190H360" class="tour__axis"/><path d="M' + X(0) + ' ' + Y(0) + 'L' + X(1) + ' ' + Y(0.9) + '" class="tour__law"/>' + pts +
      '<circle cx="' + X(0.3) + '" cy="' + Y(0.68) + '" r="5" class="tour__ghost"/><circle cx="' + X(0.3) + '" cy="' + Y(0.68) + '" r="12" class="tour__odd"/>');
  }

  function slides(go) {
    var F = A.facts, P = F.pilot;
    return [
      { k: 'Проблема', t: 'Науку учат как формулу на доске', d: A.i18n.fmt('PISA {y}: базового уровня по естественным наукам достигает лишь часть 15-летних. Лабораторий не хватает, а опыт руками — редкость.', { y: F.pisa.year }), art: bars() },
      { k: 'Решение', t: 'Телефон становится прибором', d: 'Микрофон, камера и касания измеряют настоящий опыт. Ученик выдвигает гипотезу, собирает свои данные и сам выводит закон — в браузере, без установки.',
        art: h('div.tour__icons', [['mic', 'Микрофон'], ['camera', 'Камера'], ['touch', 'Касание'], ['chart', 'Твои данные']].map(function (c) { return h('span', [A.icon(c[0]), h('b', { text: c[1] })]); })) },
      { k: 'Сделано в Казахстане', t: 'Физика домбры', d: 'Зажимаешь струну на ладу — телефон слышит тон. Точки ложатся на закон струны: вдвое короче — на октаву выше. Лады как отношения длин описывал ещё Аль-Фараби.', art: h('div.tour__scene', [A.scene('dombra')]) },
      { k: 'Новизна', t: 'Сначала нарисуй, потом измерь', d: 'До опыта ученик пальцем рисует, каким ожидает график. После опыта рисунок ложится пунктиром на настоящие точки — разница между интуицией и данными и есть открытие.', art: predictArt() },
      { k: 'Для учителя', t: 'Весь класс — на одном графике', d: 'Учитель показывает QR-код, ученики проходят опыт на своих телефонах, и точки всех ложатся на общий график для проектора. Выбросы подсвечены — есть что обсудить.', art: classArt() },
      { k: 'Результат', t: A.i18n.fmt('Пилотный тест: {n} участников', { n: P.n }),
        d: A.i18n.fmt('Удобство с телефона — {a} из 5. Интерактивные опыты отметили {b}. Попробуй сам — первый опыт занимает минуту.', { a: F.fmt(P.mobile.avg, 2), b: F.fmt(F.pct(P.liked[0][1]), 1) + '%' }),
        art: h('div.tour__cta', [
          h('button.btn.btn--primary', { type: 'button', onclick: function () { go('lab:timing'); } }, ['Попробовать за 2 минуты']),
          h('button.btn', { type: 'button', onclick: function () { go('lab:dombra'); } }, ['Физика домбры']),
          h('button.btn', { type: 'button', onclick: function () { go('class:demo'); } }, ['Пример общего графика'])
        ]) }
    ];
  }

  function open(view, go) {
    if (stopFn) stopFn();
    var list = slides(go), idx = 0, timer = 0, playing = true;
    var stage = h('div.tour__stage');
    var dots = h('div.tour__dots');
    var prog = h('i');
    var playBtn = h('button.tour__play', { type: 'button', onclick: function () { playing = !playing; paintPlay(); schedule(); } });
    function paintPlay() { A.u.clear(playBtn); playBtn.appendChild(document.createTextNode(A.i18n.t(playing ? '❚❚ Пауза' : '▶ Дальше сам'))); }
    list.forEach(function (s, i) {
      dots.appendChild(h('button', { type: 'button', 'aria-label': A.i18n.fmt('Слайд {n}', { n: i + 1 }), onclick: function () { stopAuto(); show(i); } }));
    });
    var prev = h('button.btn', { type: 'button', onclick: function () { stopAuto(); show(idx - 1); } }, ['← Назад']);
    var next = h('button.btn.btn--primary', { type: 'button', onclick: function () { stopAuto(); show(idx + 1); } }, ['Дальше →']);

    view.appendChild(h('section.tour', [
      h('div.labtop', [
        h('button.back', { type: 'button', onclick: function () { go('home'); } }, ['← На главную']),
        h('span.tour__brand', [A.raw('QaltaLab · '), h('span', ['за 60 секунд'])])
      ]),
      h('div.tour__progress', [prog]),
      stage,
      h('div.tour__nav', [prev, dots, next]),
      h('div.tour__foot', [playBtn])
    ]));

    function show(i) {
      idx = Math.max(0, Math.min(list.length - 1, i));
      var s = list[idx];
      A.u.clear(stage);
      stage.appendChild(h('div.tour__slide', [
        h('div.tour__text', [
          h('span.tour__k', [A.raw((idx + 1) + ' / ' + list.length + ' · '), h('span', { text: s.k })]),
          h('h1.tour__t', { text: s.t }),
          h('p.tour__d', [A.raw(A.i18n.t(s.d))])
        ]),
        h('div.tour__art', [s.art])
      ]));
      var b = dots.querySelectorAll('button');
      for (var k = 0; k < b.length; k++) b[k].classList.toggle('is-on', k === idx);
      prev.disabled = idx === 0;
      next.hidden = idx === list.length - 1;
      prog.style.width = ((idx + 1) / list.length * 100) + '%';
      schedule();
    }
    function schedule() {
      if (timer) { clearTimeout(timer); timer = 0; }
      if (playing && idx < list.length - 1) timer = setTimeout(function () { show(idx + 1); }, STEP_MS);
    }
    function stopAuto() { playing = false; paintPlay(); }

    var onKey = function (e) {
      if (e.key === 'ArrowRight') { stopAuto(); show(idx + 1); }
      else if (e.key === 'ArrowLeft') { stopAuto(); show(idx - 1); }
    };
    var x0 = null;
    var onStart = function (e) { x0 = e.touches[0].clientX; };
    var onEnd = function (e) {
      if (x0 === null) return;
      var dx = e.changedTouches[0].clientX - x0; x0 = null;
      if (Math.abs(dx) > 50) { stopAuto(); show(idx + (dx < 0 ? 1 : -1)); }
    };
    document.addEventListener('keydown', onKey);
    stage.addEventListener('touchstart', onStart, { passive: true });
    stage.addEventListener('touchend', onEnd);
    paintPlay();
    show(0);

    stopFn = function () {
      if (timer) clearTimeout(timer);
      document.removeEventListener('keydown', onKey);
      stopFn = null;
    };
    window.scrollTo(0, 0);
  }

  A.tour = { open: open, stop: function () { if (stopFn) stopFn(); } };
})(window.A);
