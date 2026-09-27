/* Опыт «Магическое число семь».
   Показываем ряд цифр, потом просим повторить. Длина ряда растёт, и в
   какой-то момент память ломается. Точка перелома и есть объём кратковременной
   памяти — та самая «семёрка плюс-минус два» Джорджа Миллера.

   Нужен только экран. */

(function (A) {
  'use strict';

  var h = A.h;
  var LENGTHS = [3, 4, 5, 6, 7, 8];
  var TRIES = 3;          // попыток на каждую длину
  var SHOW_MS = 750;      // столько показываем одну цифру

  function measure(host, api) {
    var lenIdx = 0, tryIdx = 0, correct = 0;
    var seq = [], entered = [];
    var phase = 'idle';    // idle | show | input | pause
    var timer = 0;
    var points = [];

    var readout = h('div.readout', ['—']);
    var hint = h('div.pad__hint');
    var keys = h('div.keypad');
    var stage = h('div.pad.pad--tall', [h('div', { style: { width: '100%' } }, [readout, hint, keys])]);
    var bar = h('i');
    var progress = h('div.match__bar', { style: { marginTop: '18px' } }, [bar]);
    var startBtn = h('button.btn.btn--primary.btn--wide', { type: 'button', onclick: begin }, ['Начать опыт']);

    host.appendChild(h('h2.lab-h', ['Магическое число семь']));
    host.appendChild(h('p.lab-q', ['Запомни ряд цифр и повтори его в том же порядке. Ряды будут удлиняться от трёх цифр до восьми.']));
    host.appendChild(stage);
    host.appendChild(progress);
    host.appendChild(h('div.btn-row', [startBtn]));
    host.appendChild(h('p.note', ['Не проговаривай цифры вслух и не записывай — иначе измеришь не память, а смекалку. Ошибиться на длинных рядах нормально: именно там и проходит граница.']));

    hint.textContent = A.i18n.t('Нажми «Начать опыт»');
    buildKeys(false);

    function buildKeys(on) {
      A.u.clear(keys);
      for (var d = 1; d <= 9; d++) addKey(d);
      addKey(0);
      keys.classList.toggle('is-off', !on);
    }

    function addKey(d) {
      keys.appendChild(h('button.keypad__k', {
        type: 'button', 'aria-label': 'Цифра ' + d,
        onclick: function () { press(d); }
      }, [A.raw(String(d))]));
    }

    function begin() {
      lenIdx = 0; tryIdx = 0; correct = 0; points = [];
      startBtn.style.display = 'none';
      nextTrial();
    }

    function nextTrial() {
      phase = 'show';
      buildKeys(false);
      entered = [];
      var n = LENGTHS[lenIdx];
      seq = [];
      for (var i = 0; i < n; i++) seq.push(Math.floor(Math.random() * 10));
      hint.textContent = A.i18n.fmt('Ряд из {n} цифр · попытка {t} из {m}', { n: n, t: tryIdx + 1, m: TRIES });
      bar.style.width = ((lenIdx * TRIES + tryIdx) / (LENGTHS.length * TRIES) * 100) + '%';
      showAt(0);
    }

    function showAt(i) {
      if (i >= seq.length) {
        readout.textContent = '?';
        hint.textContent = A.i18n.t('Теперь повтори ряд');
        phase = 'input';
        buildKeys(true);
        return;
      }
      readout.textContent = String(seq[i]);
      timer = setTimeout(function () {
        readout.textContent = '·';
        timer = setTimeout(function () { showAt(i + 1); }, 160);
      }, SHOW_MS);
    }

    function press(d) {
      if (phase !== 'input') return;
      entered.push(d);
      readout.textContent = entered.join(' ');
      if (entered.length < seq.length) return;

      var ok = entered.every(function (v, i) { return v === seq[i]; });
      if (ok) correct++;
      phase = 'pause';
      buildKeys(false);
      readout.textContent = ok ? '✓' : '✕';
      hint.textContent = A.i18n.t(ok ? 'Верно' : 'Не сошлось — это нормально');
      stage.className = 'pad pad--tall ' + (ok ? 'pad--go' : 'pad--early');

      timer = setTimeout(function () {
        stage.className = 'pad pad--tall';
        tryIdx++;
        if (tryIdx >= TRIES) {
          points.push({ x: LENGTHS[lenIdx], y: Math.round(correct / TRIES * 100) });
          lenIdx++; tryIdx = 0; correct = 0;
          if (lenIdx >= LENGTHS.length) { finish(); return; }
        }
        nextTrial();
      }, 900);
    }

    function finish() {
      api.setPoints(points);
      api.done();
    }

    return function () { phase = 'idle'; clearTimeout(timer); };
  }

  A.labs.push({
    id: 'memory',
    icon: 'brain',
    title: 'Магическое число семь',
    subject: 'Биология · Когнитивистика',
    gear: 'Нужен только экран',
    time: '≈4 мин',
    sensor: 'Касания экрана',

    question: 'Сколько цифр ты удержишь в голове разом — и где именно память ломается?',
    intro: 'В 1956 году Джордж Миллер заметил, что человек удерживает в кратковременной памяти около семи элементов. Сейчас ты найдёшь своё число: не по книге, а по собственным ошибкам.',
    howto: [
      'На экране по очереди появятся цифры — запомни их порядок.',
      'Потом наберём тот же ряд на клавиатуре.',
      'Длина ряда растёт от трёх цифр до восьми, на каждую длину три попытки.',
      'Не проговаривай вслух и не записывай: измеряем память, а не хитрость.'
    ],
    warn: 'Опыт занимает около четырёх минут. Ошибки на длинных рядах — не провал, а именно то, что мы ищем.',

    hypotheses: [
      { id: 'sharp', text: 'До какой-то длины буду помнить почти всё, а потом резко начну ошибаться' },
      { id: 'slow', text: 'Точность будет падать плавно с каждой добавленной цифрой' },
      { id: 'all', text: 'Восемь цифр запомню так же легко, как три' }
    ],

    chart: {
      xMin: 2, xMax: 9, yMin: 0, yMax: 100,
      xTicks: [3, 4, 5, 6, 7, 8],
      xFmt: function (v) { return String(Math.round(v)); },
      yFmt: function (v) { return Math.round(v) + '%'; }
    },

    models: [
      {
        id: 'logistic',
        label: 'S-кривая',
        params: [
          { key: 'c', label: 'Объём памяти, цифр', min: 3, max: 9, step: 0.1, init: 6.5,
            fmt: function (v) { return A.u.num(v, 1); } },
          { key: 'w', label: 'Резкость перелома', min: 0.2, max: 2.5, step: 0.05, init: 0.8,
            fmt: function (v) { return A.u.num(v, 2); } }
        ],
        fn: function (p, n) { return 100 / (1 + Math.exp((n - p.c) / p.w)); }
      },
      {
        id: 'lin',
        label: 'прямая',
        params: [
          { key: 'a', label: 'Точность на трёх цифрах, %', min: 40, max: 100, step: 1, init: 100, fmt: function (v) { return Math.round(v) + '%'; } },
          { key: 'b', label: 'Потеря на цифру, %', min: 0, max: 40, step: 1, init: 12, fmt: function (v) { return Math.round(v) + '%'; } }
        ],
        fn: function (p, n) { return p.a - p.b * (n - 3); }
      }
    ],

    reveal: function (c) {
      var good = c.model.id === 'logistic' && c.match >= 60;
      var span = c.model.id === 'logistic' ? c.params.c : null;
      return {
        kicker: A.i18n.t(good ? 'Твои данные поддерживают модель' : 'Что говорит исследование'),
        name: A.i18n.t('Объём кратковременной памяти'),
        formula: '7 ± 2',
        who: A.i18n.t('<b>Джордж Миллер, 1956 год.</b> Его статья «Магическое число семь, плюс-минус два» — одна из самых цитируемых в психологии. Память держит не биты, а «куски»: 1-9-4-5 для тебя четыре цифры, а 1945 — один кусок. Именно поэтому телефонные номера записывают группами, а не сплошной лентой.'),
        you: good
          ? A.i18n.fmt('S-кривая описала твои точки с R² = {r}%. Перелом приходится на <b>{c} цифр</b> — это и есть твой объём памяти. Миллер называл диапазон от пяти до девяти, так что ты внутри нормы.', { r: c.match, c: A.u.num(span, 1) })
          : A.i18n.t('Кривая пока легла неровно. На коротком опыте сильно мешают отвлечения: хватит одного звука в комнате, чтобы ряд рассыпался. Повтори в тишине.')
      };
    },

    verdict: function (c) {
      if (c.model.id !== 'logistic' || c.match < 60) {
        return { inconclusive: true, ok: false, text: A.i18n.t('По этим точкам нельзя уверенно найти перелом. Повтори опыт в тишине и без пауз.') };
      }
      if (c.hyp === 'sharp') {
        return { ok: true, text: A.i18n.fmt('Так и вышло: до {c} цифр ты почти не ошибался, а дальше точность обвалилась. Память не растягивается плавно — у неё есть довольно резкая граница.', { c: A.u.num(c.params.c, 1) }) };
      }
      if (c.hyp === 'slow') {
        return { ok: false, text: A.i18n.t('Плавного спада не получилось: S-кривая легла лучше прямой. Короткие ряды даются почти без ошибок, а после перелома точность падает сразу.') };
      }
      return { ok: false, text: A.i18n.fmt('Разница есть, и большая: на длинных рядах точность заметно ниже. Перелом у тебя около {c} цифр.', { c: A.u.num(c.params.c, 1) }) };
    },

    next: 'Запомнишь ли ты больше, если группировать цифры по две?',
    explain: 'Короткие ряды ты помнил почти без ошибок, а после некоторой длины точность резко упала. Кратковременная память вмещает ограниченное число элементов — место перелома и есть твой объём.',

    variants: ['цифры парами', 'с музыкой в ушах', 'на следующий день'],

    measure: measure
  });
})(window.A);
