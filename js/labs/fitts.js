/* Опыт «Закон Фиттса».
   Ученик по очереди бьёт пальцем по двум кружкам. Мы меняем их размер и
   расстояние между ними и меряем, сколько времени уходит на попадание.

   Это тот самый закон, по которому проектируют интерфейсы: время попадания
   растёт как логарифм отношения расстояния к размеру цели. Нужен только экран,
   поэтому опыт работает на любом устройстве и без разрешений. */

(function (A) {
  'use strict';

  var h = A.h;

  // Наборы «расстояние — диаметр» в долях ширины сцены: так одинаково
  // работает и на телефоне, и на широком экране.
  var SETS = [
    { d: 0.62, w: 0.20 },
    { d: 0.62, w: 0.09 },
    { d: 0.30, w: 0.09 },
    { d: 0.30, w: 0.20 }
  ];
  var HITS = 9;   // первое касание — только старт, дальше 8 замеров

  function idOf(D, W) { return Math.log(2 * D / W) / Math.LN2; }

  function measure(host, api) {
    var setIdx = 0, hits = 0, times = [], last = 0, active = 0;
    var points = [];
    var running = false;

    var readout = h('div.readout', ['—']);
    var hint = h('div.pad__hint');
    var field = h('div.fitts');
    var a = h('button.fitts__t', { type: 'button', 'aria-label': 'Цель слева', onclick: function () { hit(0); } });
    var b = h('button.fitts__t', { type: 'button', 'aria-label': 'Цель справа', onclick: function () { hit(1); } });
    field.appendChild(a); field.appendChild(b);

    var stage = h('div.pad.pad--tall', [h('div', { style: { width: '100%' } }, [readout, hint, field])]);
    var bar = h('i');
    var progress = h('div.match__bar', { style: { marginTop: '18px' } }, [bar]);
    var startBtn = h('button.btn.btn--primary.btn--wide', { type: 'button', onclick: begin }, ['Начать опыт']);

    host.appendChild(h('h2.lab-h', ['Закон Фиттса']));
    host.appendChild(h('p.lab-q', ['Бей пальцем по кружкам по очереди: левый, правый, левый… Старайся не промахиваться. Кружки будут менять размер и расстояние между собой.']));
    host.appendChild(stage);
    host.appendChild(progress);
    host.appendChild(h('div.btn-row', [startBtn]));
    host.appendChild(h('p.note', ['Промах не засчитывается: считаем только попадания по подсвеченной цели. Держи телефон в одной руке и бей одним и тем же пальцем — так сравнение честное.']));

    hint.textContent = A.i18n.t('Нажми «Начать опыт»');
    layout();

    function sizes() {
      var W = field.clientWidth || 300;
      var s = SETS[setIdx];
      var w = Math.max(26, Math.round(W * s.w));
      var d = Math.round(W * s.d);
      return { w: w, d: d, W: W };
    }

    function layout() {
      var s = sizes();
      [a, b].forEach(function (el, i) {
        el.style.width = s.w + 'px';
        el.style.height = s.w + 'px';
        el.style.left = Math.round(s.W / 2 + (i ? 1 : -1) * s.d / 2 - s.w / 2) + 'px';
      });
      a.classList.toggle('is-on', running && active === 0);
      b.classList.toggle('is-on', running && active === 1);
    }

    function begin() {
      running = true;
      setIdx = 0; hits = 0; times = []; last = 0; active = 0;
      points = [];
      startBtn.style.display = 'none';
      layout();
      paint();
    }

    function paint() {
      readout.textContent = hits + ' ';
      readout.appendChild(h('small', ['/ ' + (HITS - 1)]));
      hint.textContent = A.i18n.fmt('Набор {n} из {m}. Бей по подсвеченному кружку.', { n: setIdx + 1, m: SETS.length });
      bar.style.width = ((setIdx * (HITS - 1) + hits) / (SETS.length * (HITS - 1)) * 100) + '%';
      layout();
    }

    function hit(which) {
      if (!running || which !== active) return;
      var now = performance.now();
      if (last) { times.push(now - last); hits++; }
      last = now;
      active = which ? 0 : 1;

      if (hits >= HITS - 1) {
        var s = sizes();
        points.push({ x: Math.round(idOf(s.d, s.w) * 100) / 100, y: Math.round(A.u.median(times)) });
        setIdx++;
        hits = 0; times = []; last = 0;
        if (setIdx >= SETS.length) { finish(); return; }
      }
      paint();
    }

    function finish() {
      running = false;
      points.sort(function (x, y) { return x.x - y.x; });
      api.setPoints(points);
      api.done();
    }

    var onResize = function () { layout(); };
    window.addEventListener('resize', onResize);
    return function () { running = false; window.removeEventListener('resize', onResize); };
  }

  A.labs.push({
    id: 'fitts',
    icon: 'target',
    title: 'Закон Фиттса',
    subject: 'Информатика · Интерфейсы',
    gear: 'Нужен только экран',

    question: 'Что сильнее замедляет попадание пальцем — далёкая цель или маленькая?',
    intro: 'Этим законом пользуются все, кто проектирует кнопки: от клавиатуры телефона до приборной панели самолёта. Сейчас ты выведешь его сам, четырьмя наборами кружков.',
    howto: [
      'Держи телефон удобно и бей одним и тем же пальцем.',
      'Кружки загораются по очереди — бей только по подсвеченному.',
      'Каждый набор — восемь попаданий, всего наборов четыре.',
      'Кружки будут то мелкими и далёкими, то крупными и близкими.'
    ],
    warn: 'Не торопись любой ценой: если бить наугад, промахи собьют замер. Ровный темп даёт лучший результат.',

    hypotheses: [
      { id: 'log', text: 'Важно отношение расстояния к размеру, и время растёт медленно — как логарифм' },
      { id: 'dist', text: 'Главное — расстояние: вдвое дальше значит вдвое дольше' },
      { id: 'size', text: 'Главное — размер цели, расстояние почти не важно' }
    ],

    chart: {
      xMin: 1, yMin: 0,
      xFmt: function (v) { return A.u.num(v, 1); },
      yFmt: function (v) { return Math.round(v) + ''; }
    },

    models: [
      {
        id: 'fitts',
        label: 'T = a + b·ID',
        params: [
          { key: 'a', label: 'Постоянная часть, мс', min: 0, max: 400, step: 5, init: 120, fmt: function (v) { return Math.round(v) + A.i18n.t(' мс'); } },
          { key: 'b', label: 'Цена одного бита, мс', min: 10, max: 250, step: 5, init: 90, fmt: function (v) { return Math.round(v) + A.i18n.t(' мс'); } }
        ],
        fn: function (p, id) { return p.a + p.b * id; }
      },
      {
        id: 'pow',
        label: 'T = a · ID²',
        params: [
          { key: 'a', label: 'Коэффициент a, мс', min: 5, max: 120, step: 1, init: 30, fmt: function (v) { return Math.round(v) + ''; } }
        ],
        fn: function (p, id) { return p.a * id * id; }
      }
    ],

    reveal: function (c) {
      var good = c.model.id === 'fitts' && c.match >= 60;
      return {
        kicker: A.i18n.t(good ? 'Твои данные поддерживают модель' : 'Что говорит исследование'),
        name: A.i18n.t('Закон Фиттса'),
        formula: 'T = a + b · log₂(2D / W)',
        who: A.i18n.t('<b>Пол Фиттс, 1954 год.</b> Время попадания зависит не от расстояния и не от размера по отдельности, а от их отношения — и растёт логарифмически. Величину log₂(2D/W) называют индексом сложности и измеряют в битах: попасть в цель — это, по сути, передать информацию рукой.'),
        you: good
          ? A.i18n.fmt('Прямая описала твои точки с R² = {r}%. Каждый дополнительный бит сложности стоил тебе {b} мс.<br>Именно поэтому кнопку «Отправить» делают крупной и близкой, а «Удалить всё» — мелкой и далёкой: закон работает в обе стороны.', { r: c.match, b: Math.round(c.params.b) })
          : A.i18n.t('Точки пока легли неровно. Обычно мешает спешка и промахи. Повтори опыт в ровном темпе, одним и тем же пальцем.')
      };
    },

    verdict: function (c) {
      if (c.model.id !== 'fitts' || c.match < 60) {
        return { inconclusive: true, ok: false, text: A.i18n.t('По этим точкам нельзя уверенно судить о зависимости. Повтори опыт спокойно и одним пальцем.') };
      }
      if (c.hyp === 'log') {
        return { ok: true, text: A.i18n.t('Верно. Именно отношение расстояния к размеру определяет время, и растёт оно логарифмически — поэтому даже очень далёкая, но крупная цель даётся легко.') };
      }
      if (c.hyp === 'dist') {
        return { ok: false, text: A.i18n.t('Расстояние важно, но само по себе не решает: крупная далёкая цель даётся быстрее мелкой ближней. Работает именно отношение D к W.') };
      }
      return { ok: false, text: A.i18n.t('Размер важен, но не один: две цели одинакового размера на разном расстоянии дают разное время. В формулу входят оба, и именно их отношение.') };
    },

    explain: 'Далёкую и маленькую цель ты нажимал дольше: рука сначала летит быстро, а у цели замедляется и уточняет движение. Время растёт вместе с трудностью цели — логарифмом отношения расстояния к размеру.',

    variants: ['большим пальцем одной руки', 'левой рукой', 'указательным пальцем на весу'],
    measure: measure
  });
})(window.A);
