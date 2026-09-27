/* Опыт «Маятник».
   Нитка, ластик и телефон. Ученик отсчитывает качания касанием экрана,
   приложение считает период, а из зависимости периода от длины выходит
   ускорение свободного падения.

   Период меряем не по одному качанию, а по десяти: ошибка нажатия пальцем
   делится на число периодов и перестаёт мешать. Это и есть настоящий приём
   школьной лабораторной, только секундомер встроен. */

(function (A) {
  'use strict';

  var h = A.h;
  var SWINGS = 10;   // столько полных качаний отсчитываем в одной серии
  var NEED = 4;      // меньше четырёх длин — зависимость не видна

  // T = k · √L, где L в сантиметрах. Отсюда g = (2π / k)² / 100.
  function gFromK(k) { return Math.pow(2 * Math.PI / k, 2) / 100; }

  function measure(host, api) {
    var len = 30;              // длина нити, см
    var times = [];
    var points = api.points.slice();

    var readout = h('div.readout', ['0']);
    var hint = h('div.pad__hint');
    var stage = h('div.pad', [h('div', { style: { width: '100%' } }, [readout, hint])]);

    var lenVal = h('span.slider__val');
    var lenInput = h('input', {
      type: 'range', min: 5, max: 100, step: 1, value: len,
      oninput: function () { len = parseFloat(lenInput.value); paintLen(); }
    });

    var tapBtn = h('button.btn.btn--primary.btn--wide', { type: 'button', onclick: tap }, ['Отсчитать качание']);
    var resetBtn = h('button.btn', { type: 'button', onclick: resetSeries }, ['Сбросить счёт']);
    var addBtn = h('button.btn', { type: 'button', disabled: true, onclick: addPoint }, ['Записать точку']);
    var table = h('div');
    var doneBtn = h('button.btn.btn--primary.btn--wide', {
      type: 'button', disabled: points.length < NEED, onclick: function () { api.done(); }
    }, ['Готово, строим график']);

    host.appendChild(h('h2.lab-h', ['Маятник']));
    host.appendChild(h('p.lab-q', ['Привяжи к нитке ластик или ключи. Отведи маятник на небольшой угол и отпусти. Каждый раз, когда груз возвращается в ту же сторону, нажимай кнопку — это одно полное качание.']));
    host.appendChild(stage);
    host.appendChild(h('div.slider', [
      h('div.slider__top', [h('span', { text: 'Длина нити' }), lenVal]),
      lenInput
    ]));
    host.appendChild(h('div.btn-row', [tapBtn]));
    host.appendChild(h('div.btn-row', [addBtn, resetBtn]));
    host.appendChild(table);
    host.appendChild(h('div.btn-row', [doneBtn]));
    host.appendChild(h('p.note', ['Отклоняй маятник не больше чем на ладонь: формула верна только для малых качаний. Первое нажатие — это старт отсчёта, а не первое качание.']));

    paintLen();
    paintTable();
    paintCount();

    function paintLen() { lenVal.textContent = Math.round(len) + A.i18n.t(' см'); }

    function period() {
      if (times.length < 2) return 0;
      return (times[times.length - 1] - times[0]) / (times.length - 1) / 1000;
    }

    function paintCount() {
      var n = Math.max(0, times.length - 1);
      readout.textContent = n + ' ';
      readout.appendChild(h('small', ['/ ' + SWINGS]));
      var T = period();
      hint.textContent = times.length === 0
        ? A.i18n.t('Нажми в тот момент, когда отпускаешь маятник')
        : n >= SWINGS
          ? A.i18n.fmt('Готово: период {t} с. Можно записывать точку.', { t: A.u.num(T, 2) })
          : T
            ? A.i18n.fmt('Период пока {t} с', { t: A.u.num(T, 2) })
            : A.i18n.t('Отсчёт пошёл. Жми на каждом возврате груза.');
      addBtn.disabled = n < SWINGS;
    }

    function tap() {
      times.push(performance.now());
      if (times.length > SWINGS + 1) times.length = SWINGS + 1;
      paintCount();
    }

    function resetSeries() { times = []; paintCount(); }

    function addPoint() {
      var T = period();
      if (!T) return;
      points.push({ x: len, y: Math.round(T * 1000) / 1000 });
      points.sort(function (a, b) { return a.x - b.x; });
      times = [];
      sync();
      paintCount();
    }

    function sync() {
      api.setPoints(points);
      doneBtn.disabled = points.length < NEED;
      paintTable();
    }

    function paintTable() {
      A.u.clear(table);
      if (!points.length) return;
      var t = h('table.points');
      t.appendChild(h('thead', [h('tr', [
        h('th', ['Длина, см']), h('th', ['Период, с']), h('th', [''])
      ])]));
      var body = h('tbody');
      points.forEach(function (p, i) {
        body.appendChild(h('tr', [
          h('td', [A.raw(String(Math.round(p.x)))]),
          h('td', [A.raw(A.u.num(p.y, 2))]),
          h('td', { style: { textAlign: 'right' } }, [
            h('button.linkbtn', { type: 'button', onclick: function () { points.splice(i, 1); sync(); } }, ['убрать'])
          ])
        ]));
      });
      t.appendChild(body);
      table.appendChild(t);
    }

    return function () { times = []; };
  }

  A.labs.push({
    id: 'pendulum',
    icon: 'pendulum',
    title: 'Маятник',
    subject: 'Механика · Колебания',
    gear: 'Нитка и ластик',
    time: '≈5 мин',
    sensor: 'Касания экрана',

    question: 'От чего зависит период качания маятника — от длины нити, от груза или от размаха?',
    intro: 'Это самый старый способ измерить силу тяжести. Гюйгенс вывел формулу маятника в 1656 году, имея нитку, груз и терпение. У тебя есть то же самое плюс секундомер в телефоне.',
    howto: [
      'Привяжи к нитке ластик, ключи или гайку.',
      'Измерь длину от точки подвеса до груза и поставь ползунок.',
      'Отведи груз на небольшой угол и отпусти. Нажми кнопку в момент отпускания — это старт.',
      'Дальше нажимай каждый раз, когда груз возвращается в ту же сторону. Нужно десять качаний.',
      'Запиши точку, поменяй длину нити и повтори. Нужно минимум четыре длины.'
    ],
    warn: 'Считаем сразу десять качаний: так ошибка нажатия делится на десять и почти не влияет на результат.',

    hypotheses: [
      { id: 'len', text: 'Период зависит от длины: чем длиннее нить, тем медленнее качание' },
      { id: 'mass', text: 'Период зависит от груза: тяжёлый качается медленнее' },
      { id: 'amp', text: 'Период зависит от размаха: чем сильнее отвёл, тем дольше идёт качание' }
    ],

    chart: {
      xMin: 0, yMin: 0,
      xFmt: function (v) { return Math.round(v) + A.i18n.t(' см'); },
      yFmt: function (v) { return A.u.num(v, 1); }
    },

    models: [
      {
        id: 'sqrt',
        label: 'T = k · √L',
        params: [{
          key: 'k', label: 'Коэффициент k, с/√см', min: 0.10, max: 0.40, step: 0.002,
          init: function (p) {
            if (!p.length) return 0.20;
            var s = 0;
            p.forEach(function (q) { s += q.y / Math.sqrt(q.x); });
            return Math.max(0.10, Math.min(0.40, s / p.length));
          },
          fmt: function (v) { return A.u.num(v, 3) + '  (g ≈ ' + A.u.num(gFromK(v), 1) + ')'; }
        }],
        fn: function (p, L) { return L > 0 ? p.k * Math.sqrt(L) : NaN; }
      },
      {
        id: 'lin',
        label: 'T = a + b·L',
        params: [
          { key: 'a', label: 'Начальный период, с', min: 0, max: 2, step: 0.02, init: 0.4, fmt: function (v) { return A.u.num(v, 2); } },
          { key: 'b', label: 'Прибавка на сантиметр, с', min: 0, max: 0.08, step: 0.001, init: 0.02, fmt: function (v) { return A.u.num(v, 3); } }
        ],
        fn: function (p, L) { return p.a + p.b * L; }
      }
    ],

    reveal: function (c) {
      var good = c.model.id === 'sqrt' && c.match >= 60;
      var g = c.model.id === 'sqrt' ? gFromK(c.params.k) : null;
      var off = g ? Math.abs(g - 9.81) / 9.81 * 100 : null;

      return {
        kicker: A.i18n.t(good ? 'Твои данные поддерживают модель' : 'Что говорит физика'),
        name: A.i18n.t('Формула маятника'),
        formula: 'T = 2π · √(L / g)',
        who: A.i18n.t('<b>Христиан Гюйгенс, 1656 год.</b> Период маятника не зависит ни от массы груза, ни от размаха — при малых углах он определяется только длиной нити и силой тяжести. Именно поэтому маятниковые часы три столетия были самыми точными приборами на Земле.'),
        you: good
          ? A.i18n.fmt('Твоя кривая описала точки с R² = {r}%. Из коэффициента k = {k} следует ускорение свободного падения <b>g ≈ {g} м/с²</b>. Табличное значение — 9,81 м/с², твоё отличается на {off}%.', {
              r: c.match, k: A.u.num(c.params.k, 3), g: A.u.num(g, 2), off: A.u.num(off, 1)
            })
          : A.i18n.t('Точки пока не легли на корневую зависимость. Чаще всего виноваты большой размах, слишком короткая нить или сбитый счёт качаний. Повтори серию аккуратнее — отрицательный результат тоже результат.')
      };
    },

    verdict: function (c) {
      if (c.model.id !== 'sqrt' || c.match < 60) {
        return { inconclusive: true, ok: false, text: A.i18n.t('По этим точкам нельзя уверенно судить о зависимости. Повтори измерения при малых отклонениях и одинаковом счёте качаний.') };
      }
      if (c.hyp === 'len') {
        return { ok: true, text: A.i18n.t('Верно, и зависимость именно корневая: чтобы период вырос вдвое, нить нужно удлинить вчетверо.') };
      }
      if (c.hyp === 'mass') {
        return { ok: false, text: A.i18n.t('Масса в формулу не входит вовсе. Проверить просто: повесь вместо ластика связку ключей той же длины — период не изменится. Тяжёлый груз сильнее тянет вниз, но его и труднее разогнать, и эти два эффекта сокращаются.') };
      }
      return { ok: false, text: A.i18n.t('При малых углах размах на период почти не влияет — это называется изохронностью, и её заметил ещё Галилей по качанию люстры в соборе. При больших углах зависимость появляется, но слабая.') };
    },

    next: 'Что произойдёт, если увеличить длину маятника в два раза?',
    explain: 'Длинная нить качается медленнее, но не пропорционально: чтобы период вырос вдвое, длину нужно увеличить вчетверо. Масса груза роли не играет, а из наклона кривой можно вычислить ускорение свободного падения g.',

    variants: ['с тяжёлым грузом', 'с большим размахом', 'на коротких нитях'],
    measure: measure
  });
})(window.A);
