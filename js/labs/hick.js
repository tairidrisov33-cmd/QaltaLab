/* Опыт «Скорость мысли».
   Замеряем время реакции при разном числе вариантов выбора: 1, 2, 4 и 8 кнопок.
   Из точек выходит закон Хика — время растёт не пропорционально числу кнопок,
   а как логарифм. Опыт нарочно не требует ни микрофона, ни камеры: это наша
   страховка, он работает на любом устройстве и без разрешений. */

(function (A) {
  'use strict';

  var h = A.h;
  var SETS = [1, 2, 4, 8];   // сколько кнопок в серии
  var TRIES = 5;             // попыток в серии; берём медиану, чтобы промах не портил точку

  function measure(host, api) {
    var setIdx = 0, tryIdx = 0;
    var times = [];
    var points = [];
    var target = -1;
    var t0 = 0, timer = 0;
    var phase = 'idle';   // idle | wait | go

    var readout = h('div.readout', ['—']);
    var hint = h('div.pad__hint');
    var targets = h('div.targets');
    var stage = h('div.pad', [h('div', { style: { width: '100%' } }, [readout, hint, targets])]);
    var bar = h('i');
    var progress = h('div.match__bar', { style: { marginTop: '18px' } }, [bar]);

    var startBtn = h('button.btn.btn--primary.btn--wide', { type: 'button', onclick: begin }, ['Начать опыт']);

    host.appendChild(h('h2.lab-h', ['Скорость мысли']));
    host.appendChild(h('p.lab-q', ['Как только одна из клеток загорится зелёным — жми именно по ней. Сначала клетка будет одна, потом две, четыре и восемь.']));
    host.appendChild(stage);
    host.appendChild(progress);
    host.appendChild(h('div.btn-row', [startBtn]));

    hint.textContent = A.i18n.t('Нажми «Начать опыт»');

    function begin() {
      startBtn.style.display = 'none';
      setIdx = 0; tryIdx = 0; times = []; points = [];
      nextSet();
    }

    function nextSet() {
      if (setIdx >= SETS.length) { finish(); return; }
      tryIdx = 0; times = [];
      buildTargets(SETS[setIdx]);
      round();
    }

    function buildTargets(n) {
      A.u.clear(targets);
      targets.style.gridTemplateColumns = 'repeat(' + Math.min(n, 4) + ', 1fr)';
      for (var i = 0; i < n; i++) {
        (function (k) {
          targets.appendChild(h('button', {
            type: 'button', 'data-k': k,
            onclick: function () { hit(k); }
          }, []));
        })(i);
      }
    }

    function round() {
      phase = 'wait';
      target = -1;
      paint();
      readout.textContent = '—';
      hint.textContent = A.i18n.t('Жди зелёную клетку') +
        ' · ' + A.i18n.t('серия') + ' ' + (setIdx + 1) + '/' + SETS.length +
        ' · ' + (tryIdx + 1) + '/' + TRIES;
      stage.className = 'pad pad--wait';
      timer = setTimeout(function () {
        target = Math.floor(Math.random() * SETS[setIdx]);
        phase = 'go';
        t0 = performance.now();
        stage.className = 'pad pad--go';
        paint();
      }, 900 + Math.random() * 2200);
    }

    function paint() {
      var kids = targets.children;
      for (var i = 0; i < kids.length; i++) {
        kids[i].classList.toggle('is-target', i === target);
        kids[i].textContent = i === target ? '●' : '';
      }
    }

    function hit(k) {
      if (phase === 'wait') {
        clearTimeout(timer);
        stage.className = 'pad pad--early';
        readout.textContent = A.i18n.t('Рано');
        hint.textContent = A.i18n.t('Клетка ещё не загорелась. Эта попытка не считается.');
        setTimeout(round, 1100);
        return;
      }
      if (phase !== 'go' || k !== target) return;

      var ms = Math.round(performance.now() - t0);
      times.push(ms);
      phase = 'idle';
      target = -1;
      paint();
      stage.className = 'pad';
      readout.textContent = ms + ' ';
      readout.appendChild(h('small', ['мс']));
      bar.style.width = ((setIdx * TRIES + times.length) / (SETS.length * TRIES) * 100) + '%';

      tryIdx++;
      if (tryIdx >= TRIES) {
        points.push({ x: SETS[setIdx], y: Math.round(A.u.median(times)) });
        setIdx++;
        hint.textContent = A.i18n.t('Серия пройдена');
        setTimeout(nextSet, 900);
      } else {
        setTimeout(round, 700);
      }
    }

    function finish() {
      api.setPoints(points);
      api.done();
    }

    return function () { clearTimeout(timer); phase = 'idle'; };
  }

  A.labs.push({
    id: 'hick',
    icon: '⚡',
    title: 'Скорость мысли',
    subject: 'Информатика · Статистика',
    gear: 'Нужен только экран',
    safe: true,

    question: 'Если вариантов выбора станет в восемь раз больше — ты будешь думать в восемь раз дольше?',
    intro: 'Время реакции — это время, за которое мозг успевает увидеть сигнал, выбрать ответ и отдать команду руке. Сейчас измерим, как оно зависит от числа вариантов.',
    howto: [
      'Держи телефон удобно, палец над экраном.',
      'Будет четыре серии: 1, 2, 4 и 8 клеток, по пять попыток в каждой.',
      'Жми по клетке сразу, как она загорится зелёным.',
      'Если нажать раньше времени — попытка не засчитается, ничего страшного.'
    ],

    hypotheses: [
      { id: 'x8', text: 'Восемь кнопок — значит примерно в восемь раз дольше' },
      { id: 'log', text: 'Дольше, но совсем не в восемь раз' },
      { id: 'same', text: 'Разницы не будет, реакция есть реакция' }
    ],

    chart: {
      xMin: 1, xMax: 8, yMin: 0,
      xTicks: [1, 2, 4, 8],
      xFmt: function (v) { return String(Math.round(v)); },
      yFmt: function (v) { return Math.round(v) + ''; }
    },

    models: [
      {
        id: 'log',
        label: 'a + b·log₂(n+1)',
        params: [
          { key: 'a', label: 'Постоянная задержка, мс', min: 100, max: 500, step: 5,
            init: function (p) { return p.length ? Math.round(p[0].y / 5) * 5 : 250; },
            fmt: function (v) { return Math.round(v) + A.i18n.t(' мс'); } },
          { key: 'b', label: 'Цена одного бита выбора, мс', min: 0, max: 200, step: 2,
            init: 60, fmt: function (v) { return Math.round(v) + A.i18n.t(' мс'); } }
        ],
        fn: function (p, n) { return p.a + p.b * (Math.log(n + 1) / Math.LN2); }
      },
      {
        id: 'lin',
        label: 'a + b·n',
        params: [
          { key: 'a', label: 'Постоянная задержка, мс', min: 100, max: 500, step: 5, init: 250,
            fmt: function (v) { return Math.round(v) + A.i18n.t(' мс'); } },
          { key: 'b', label: 'Прибавка за кнопку, мс', min: 0, max: 120, step: 2, init: 30,
            fmt: function (v) { return Math.round(v) + A.i18n.t(' мс'); } }
        ],
        fn: function (p, n) { return p.a + p.b * n; }
      }
    ],

    reveal: function (c) {
      var base = c.points.length ? c.points[0].y : 0;
      var last = c.points.length ? c.points[c.points.length - 1].y : 0;
      var grow = base ? (last / base) : 1;

      return {
        kicker: 'Ты открыл',
        name: A.i18n.t('Закон Хика'),
        formula: 'T = a + b · log₂(n + 1)',
        who: A.i18n.t('<b>Уильям Хик, 1952 год.</b> Год спустя результат независимо подтвердил Рэй Хайман, поэтому закон часто называют законом Хика — Хаймана. Смысл такой: мозг не перебирает варианты по одному, а делит их пополам, потом ещё пополам. Поэтому время растёт как логарифм, а не как само число вариантов.'),
        you: A.i18n.fmt('<b>Твои числа:</b> при одной кнопке — {a} мс, при восьми — {b} мс. Кнопок стало в 8 раз больше, а время выросло всего в {k} раза.<br>Именно по этой причине в хорошем интерфейсе меню делают деревом, а не списком из сорока пунктов.', {
          a: base || '—', b: last || '—', k: A.u.num(grow, 1)
        })
      };
    },

    verdict: function (c) {
      var base = c.points.length ? c.points[0].y : 0;
      var last = c.points.length ? c.points[c.points.length - 1].y : 0;
      var grow = base ? last / base : 1;
      var k = A.u.num(grow, 1);
      if (c.hyp === 'log') {
        return { ok: true, text: A.i18n.fmt('Так и есть: время выросло примерно в {k} раза, а не в восемь. Мозг делит варианты пополам, а не перебирает подряд.', { k: k }) };
      }
      if (c.hyp === 'x8') {
        return { ok: false, text: A.i18n.fmt('Кнопок стало в 8 раз больше, а время — только в {k} раза. Прямой пропорциональности нет: каждое удвоение числа вариантов добавляет одинаковый кусочек времени, а не удваивает его.', { k: k }) };
      }
      return { ok: false, text: A.i18n.fmt('Разница всё-таки есть: с одной кнопки до восьми время выросло в {k} раза. Она небольшая именно потому, что рост логарифмический — но она устойчиво видна на твоих же точках.', { k: k }) };
    },

    measure: measure
  });
})(window.A);
