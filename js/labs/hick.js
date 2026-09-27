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
    var disposed = false;
    var hintMode = 'idle';

    function schedule(fn, delay) {
      clearTimeout(timer);
      timer = setTimeout(function () {
        timer = 0;
        if (!disposed) fn();
      }, delay);
    }

    var readout = h('div.readout', ['—']);
    var hint = h('div.pad__hint');
    var targets = h('div.targets');
    var stage = h('div.pad', [h('div', { style: { width: '100%' } }, [readout, hint, targets])]);
    var bar = h('i');
    var progress = h('div.match__bar', { style: { marginTop: '18px' } }, [bar]);

    var startBtn = h('button.btn.btn--primary.btn--wide', { type: 'button', onclick: begin }, ['Начать опыт']);

    var headline = h('h2.lab-h', ['Скорость мысли']);
    var description = h('p.lab-q', ['Как только одна из клеток загорится зелёным — жми именно по ней. Сначала клетка будет одна, потом две, четыре и восемь.']);
    host.appendChild(headline);
    host.appendChild(description);
    host.appendChild(stage);
    host.appendChild(progress);
    host.appendChild(h('div.btn-row', [startBtn]));

    paintHint();

    function paintHint() {
      if (hintMode === 'wait') {
        hint.textContent = A.i18n.t('Жди зелёную клетку') +
          ' · ' + A.i18n.t('серия') + ' ' + (setIdx + 1) + '/' + SETS.length +
          ' · ' + (tryIdx + 1) + '/' + TRIES;
      } else {
        hint.textContent = A.i18n.t(
          hintMode === 'early' ? 'Клетка ещё не загорелась. Эта попытка не считается.'
            : hintMode === 'done' ? 'Серия пройдена' : 'Нажми «Начать опыт»'
        );
      }
    }

    function translate() {
      headline.textContent = A.i18n.t('Скорость мысли');
      description.textContent = A.i18n.t('Как только одна из клеток загорится зелёным — жми именно по ней. Сначала клетка будет одна, потом две, четыре и восемь.');
      startBtn.textContent = A.i18n.t('Начать опыт');
      if (phase === 'early') readout.textContent = A.i18n.t('Рано');
      for (var i = 0; i < targets.children.length; i++) {
        targets.children[i].setAttribute('aria-label', A.i18n.t('Клетка ') + (i + 1));
      }
      paintHint();
    }

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
            type: 'button', 'data-k': k, 'aria-label': A.i18n.t('Клетка ') + (k + 1),
            onclick: function () { hit(k); }
          }, []));
        })(i);
      }
    }

    function round() {
      if (disposed) return;
      phase = 'wait';
      hintMode = 'wait';
      target = -1;
      paint();
      readout.textContent = '—';
      paintHint();
      stage.className = 'pad pad--wait';
      schedule(function () {
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
        timer = 0;
        phase = 'early';
        hintMode = 'early';
        stage.className = 'pad pad--early';
        readout.textContent = A.i18n.t('Рано');
        paintHint();
        schedule(round, 1100);
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
        hintMode = 'done';
        paintHint();
        schedule(nextSet, 900);
      } else {
        schedule(round, 700);
      }
    }

    function finish() {
      if (disposed) return;
      phase = 'idle';
      api.setPoints(points);
      api.done();
    }

    function cleanup() { disposed = true; clearTimeout(timer); timer = 0; phase = 'idle'; }
    cleanup.translate = translate;
    return cleanup;
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
      var supported = c.model.id === 'log' && c.match >= 60 && last > base;

      return {
        kicker: A.i18n.t(supported ? 'Твои данные поддерживают модель' : 'Что говорит исследование'),
        name: A.i18n.t('Закон Хика'),
        formula: 'T = a + b · log₂(n + 1)',
        who: A.i18n.t('<b>Уильям Хик, 1952 год.</b> Год спустя результат независимо подтвердил Рэй Хайман. В контролируемых опытах среднее время выбора часто растёт примерно логарифмически с числом вариантов. В коротком домашнем опыте результат может отличаться из-за случайности и движения пальца.'),
        you: supported
          ? A.i18n.fmt('<b>Твои числа:</b> при одной кнопке — {a} мс, при восьми — {b} мс. Время выросло в {k} раза; логарифмическая модель описала точки с R² = {r}%.', { a: base, b: last, k: A.u.num(grow, 1), r: c.match })
          : A.i18n.fmt('<b>Твои числа:</b> при одной кнопке — {a} мс, при восьми — {b} мс. Эти измерения пока не подтверждают логарифмическую зависимость. Попробуй повторить опыт в одинаковых условиях.', { a: base || '—', b: last || '—' })
      };
    },

    verdict: function (c) {
      var base = c.points.length ? c.points[0].y : 0;
      var last = c.points.length ? c.points[c.points.length - 1].y : 0;
      var grow = base ? last / base : 1;
      var k = A.u.num(grow, 1);
      if (c.model.id !== 'log' || c.match < 60 || last <= base) {
        return { inconclusive: true, ok: false, text: A.i18n.t('По этим данным нельзя уверенно сказать, как время зависит от числа кнопок. Повтори серии в одинаковых условиях и сравни графики.') };
      }
      if (c.hyp === 'log') {
        return { ok: true, text: A.i18n.fmt('В твоём опыте время выросло примерно в {k} раза, а не в восемь. Эти данные согласуются с логарифмической моделью.', { k: k }) };
      }
      if (c.hyp === 'x8') {
        return { ok: false, text: A.i18n.fmt('Кнопок стало в 8 раз больше, а время в этом опыте выросло в {k} раза. Прямой пропорциональности здесь нет.', { k: k }) };
      }
      return { ok: false, text: A.i18n.fmt('С одной кнопки до восьми время выросло в {k} раза. На этих точках разница видна, хотя она меньше восьмикратной.', { k: k }) };
    },

    measure: measure
  });
})(window.A);
