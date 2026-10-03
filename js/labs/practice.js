/* Опыт «Как быстро ты учишься».
   Одно и то же задание — найти нужный символ среди шестнадцати — повторяется
   блоками. Время падает не равномерно, а по степенному закону: первые повторы
   дают огромный выигрыш, последующие всё меньше.

   Это единственный опыт, где ученик наблюдает не природу, а собственный мозг:
   кривая обучения строится прямо во время опыта. Нужен только экран. */

(function (A) {
  'use strict';

  var h = A.h;
  var GLYPHS = 'АБВГДЕЖЗИКЛМНОПРСТУФХЦЧШЭЮЯ';
  var BLOCKS = 6;
  var TRIALS = 6;
  var CELLS = 16;

  function measure(host, api) {
    var block = 0, trial = 0, t0 = 0;
    var times = [], points = [];
    var target = '';
    var running = false;

    var readout = h('div.readout');
    var hint = h('div.pad__hint');
    var grid = h('div.grid16');
    var stage = h('div.pad.pad--tall', [h('div', { style: { width: '100%' } }, [readout, hint, grid])]);
    var bar = h('i');
    var progress = h('div.match__bar', { style: { marginTop: '18px' } }, [bar]);
    var startBtn = h('button.btn.btn--primary.btn--wide', { type: 'button', onclick: begin }, ['Начать опыт']);
    var table = h('div');

    host.appendChild(h('h2.lab-h', ['Как быстро ты учишься']));
    host.appendChild(h('p.lab-q', ['Сверху будет показана буква. Найди её среди шестнадцати и нажми. И так тридцать шесть раз — а приложение построит твою кривую обучения.']));
    host.appendChild(stage);
    host.appendChild(progress);
    host.appendChild(h('div.btn-row', [startBtn]));
    host.appendChild(table);
    host.appendChild(h('p.note', ['Ошибка просто не засчитывается — задание останется прежним. Не спеши в ущерб точности: важно ровное усилие, а не рекорд.']));

    readout.textContent = '—';
    hint.textContent = A.i18n.t('Нажми «Начать опыт»');

    function begin() {
      running = true;
      block = 0; trial = 0; times = []; points = [];
      startBtn.style.display = 'none';
      next();
    }

    function next() {
      target = GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
      var pool = GLYPHS.split('').filter(function (g) { return g !== target; });
      var cells = [];
      for (var i = 0; i < CELLS - 1; i++) cells.push(pool[Math.floor(Math.random() * pool.length)]);
      cells.splice(Math.floor(Math.random() * CELLS), 0, target);

      A.u.clear(grid);
      cells.forEach(function (g) {
        grid.appendChild(h('button.grid16__c', {
          type: 'button', onclick: function () { pick(g); }
        }, [A.raw(g)]));
      });

      readout.textContent = target;
      hint.textContent = A.i18n.fmt('Блок {b} из {n} · попытка {t} из {m}', {
        b: block + 1, n: BLOCKS, t: trial + 1, m: TRIALS
      });
      bar.style.width = ((block * TRIALS + trial) / (BLOCKS * TRIALS) * 100) + '%';
      t0 = performance.now();
    }

    function pick(g) {
      if (!running || g !== target) return;
      times.push(performance.now() - t0);
      trial++;
      if (trial >= TRIALS) {
        points.push({ x: block + 1, y: Math.round(A.u.median(times)) });
        paintTable();
        block++; trial = 0; times = [];
        if (block >= BLOCKS) { finish(); return; }
      }
      next();
    }

    function paintTable() {
      A.u.clear(table);
      if (!points.length) return;
      var t = h('table.points');
      t.appendChild(h('thead', [h('tr', [h('th', ['Блок']), h('th', ['Время, мс'])])]));
      var body = h('tbody');
      points.forEach(function (p) {
        body.appendChild(h('tr', [h('td', [A.raw(String(p.x))]), h('td', [A.raw(String(p.y))])]));
      });
      t.appendChild(body);
      table.appendChild(t);
    }

    function finish() {
      running = false;
      api.setPoints(points);
      api.done();
    }

    return function () { running = false; };
  }

  A.labs.push({
    id: 'practice',
    icon: 'spark',
    title: 'Как быстро ты учишься',
    subject: 'Информатика · Когнитивистика',
    gear: 'Нужен только экран',
    time: '≈4 мин',
    sensor: 'Касания экрана',

    question: 'Ты тренируешься — насколько быстрее становишься с каждым повтором?',
    intro: 'Обучение почти любому навыку — от поиска буквы до сборки кубика Рубика — подчиняется одной зависимости. Сейчас ты получишь её на собственных данных за пять минут.',
    howto: [
      'Сверху показывается буква, ниже — сетка из шестнадцати.',
      'Найди нужную и нажми. Промах не засчитывается.',
      'Всего шесть блоков по шесть попыток.',
      'Из каждого блока берётся медиана — так одна случайная задержка не портит точку.'
    ],
    warn: 'Опыт занимает около пяти минут. Постарайся не отвлекаться: пауза посреди блока испортит замер.',

    hypotheses: [
      { id: 'pow', text: 'Сначала я ускорюсь сильно, потом выигрыш станет всё меньше' },
      { id: 'lin', text: 'Буду ускоряться равномерно, на одинаковую долю за блок' },
      { id: 'none', text: 'За шесть блоков ничего заметно не изменится' }
    ],

    // Под капотом: путь от датчика до точки на графике.
    // Источник научного пояснения — показывается в карточке закона.
    source: { t: 'Heathcote A., Brown S., Mewhort D. J. K. The power law repealed. <i>Psychonomic Bulletin &amp; Review</i>, 2000', u: 'https://doi.org/10.3758/BF03212979' },
    pipeline: [
      'Поиск символа среди шестнадцати',
      'Время каждой попытки до миллисекунды',
      'Медиана каждого блока попыток',
      'Точка на графике: номер блока → время'
    ],

    // Рамка для рисунка-предсказания: те же оси, что будут у графика опыта.
    predict: { xMin: 1, xMax: 6, yMin: 0, yMax: 5000, xLabel: 'Номер блока', yLabel: 'Время поиска, мс', unit: ' мс' },

    chart: {
      xMin: 1, yMin: 0,
      xTicks: [1, 2, 3, 4, 5, 6],
      xFmt: function (v) { return String(Math.round(v)); },
      yFmt: function (v) { return Math.round(v) + ''; }
    },

    models: [
      {
        id: 'pow',
        label: 'T = a · n^(−b)',
        params: [
          { key: 'a', label: 'Время первого блока, мс', min: 400, max: 6000, step: 25,
            init: function (p) { return p.length ? Math.max(400, Math.min(6000, Math.round(p[0].y / 25) * 25)) : 2000; },
            fmt: function (v) { return Math.round(v) + A.i18n.t(' мс'); } },
          { key: 'b', label: 'Скорость обучения b', min: 0, max: 1, step: 0.01, init: 0.2,
            fmt: function (v) { return A.u.num(v, 2); } }
        ],
        fn: function (p, n) { return n > 0 ? p.a * Math.pow(n, -p.b) : NaN; }
      },
      {
        id: 'lin',
        label: 'T = a − b·n',
        params: [
          { key: 'a', label: 'Начальное время, мс', min: 400, max: 6000, step: 25, init: 2000, fmt: function (v) { return Math.round(v) + A.i18n.t(' мс'); } },
          { key: 'b', label: 'Ускорение за блок, мс', min: 0, max: 500, step: 5, init: 100, fmt: function (v) { return Math.round(v) + A.i18n.t(' мс'); } }
        ],
        fn: function (p, n) { return p.a - p.b * n; }
      }
    ],

    reveal: function (c) {
      var good = c.model.id === 'pow' && c.match >= 60;
      var first = c.points.length ? c.points[0].y : 0;
      var last = c.points.length ? c.points[c.points.length - 1].y : 0;
      var gain = first ? Math.round((1 - last / first) * 100) : 0;

      return {
        kicker: A.i18n.t(good ? 'Твои данные поддерживают модель' : 'Что говорит исследование'),
        name: A.i18n.t('Степенной закон практики'),
        formula: 'T(n) = a · n^(−b)',
        who: A.i18n.t('<b>Ньюэлл и Розенблум, 1981 год.</b> Они собрали данные по десяткам совершенно разных навыков — от печати на машинке до игры в карты и сборки сигар — и обнаружили одну и ту же форму кривой. Выигрыш от повтора всегда убывает: первые попытки дают огромный скачок, сотые — почти ничего. Поэтому новичок растёт быстро, а мастер годами отвоёвывает проценты.'),
        you: good
          ? A.i18n.fmt('Твоя кривая описала точки с R² = {r}%. За шесть блоков ты ускорился на {gain}%: с {a} мс до {b} мс. Показатель обучения b = {bb}.', {
              r: c.match, gain: gain, a: first, b: last, bb: A.u.num(c.params.b, 2)
            })
          : A.i18n.fmt('Кривая пока легла неровно — за шесть блоков разброс внимания часто перебивает эффект обучения. Между первым и последним блоком разница {gain}%. Повтори опыт в тишине и без пауз.', { gain: gain })
      };
    },

    verdict: function (c) {
      var first = c.points.length ? c.points[0].y : 0;
      var last = c.points.length ? c.points[c.points.length - 1].y : 0;
      var gain = first ? Math.round((1 - last / first) * 100) : 0;
      if (c.model.id !== 'pow' || c.match < 60) {
        return { inconclusive: true, ok: false, text: A.i18n.t('По этим шести точкам нельзя уверенно сказать, как шло обучение. Повтори опыт без пауз и отвлечений.') };
      }
      if (c.hyp === 'pow') {
        return { ok: true, text: A.i18n.fmt('Так и вышло: самый большой скачок дали первые блоки, дальше кривая выполаживается. Всего ты ускорился на {gain}%.', { gain: gain }) };
      }
      if (c.hyp === 'lin') {
        return { ok: false, text: A.i18n.t('Равномерного ускорения не получилось: прямая легла хуже степенной кривой. Если бы обучение шло равномерно, через сотню блоков время стало бы отрицательным — а так не бывает.') };
      }
      return { ok: false, text: A.i18n.fmt('Изменение есть, и заметное: {gain}% за шесть блоков. Просто оно неравномерное, поэтому на глаз его легко пропустить.', { gain: gain }) };
    },

    next: 'Сохранится ли твоя скорость, если повторить опыт завтра?',
    explain: 'С каждым блоком ты находил букву быстрее, но выигрыш становился всё меньше. Так выглядит обучение почти любому навыку: сначала быстрый рост, потом медленная шлифовка.',

    variants: ['с музыкой в ушах', 'на следующий день', 'левой рукой'],
    measure: measure
  });
})(window.A);
