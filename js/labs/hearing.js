/* Опыт «Твой слух».
   Телефон играет чистый тон и медленно поднимает громкость, ученик отмечает
   момент, когда услышал. Получается его личная кривая порога слышимости.

   Почему этот опыт первый: он не запрашивает никаких разрешений — нужен только
   динамик. Значит на чужом устройстве ломаться нечему. */

(function (A) {
  'use strict';

  var h = A.h;

  // От низких к высоким. Верхние точки — те, ради которых всё затевается:
  // подросток слышит 17-19 кГц, взрослый уже нет.
  var FREQS = [500, 1000, 2000, 4000, 8000, 12000, 15000, 17000, 19000];

  var RAMP = 6000;      // за столько миллисекунд громкость идёт от нуля до максимума
  var MAX_GAIN = 0.08;  // ограничиваем уровень; громкость устройства должна быть низкой

  // Уровень 0..100 -> реальная громкость. Шкала логарифмическая, потому что
  // ухо воспринимает громкость именно так.
  function gainOf(level) {
    return MAX_GAIN * Math.pow(10, (level - 100) / 40);
  }

  // Учебная кривая с настраиваемой границей слышимых тонов. Уровни Web Audio
  // не калиброваны в dB SPL, поэтому по ним нельзя оценивать возраст или слух.
  function reference(limitHz, f) {
    var k = f / limitHz;
    if (k < 0) k = 0;
    if (k > 1) k = 1;
    return 20 + 80 * Math.pow(k, 6);
  }

  function measure(host, api) {
    var idx = 0;
    var points = [];
    var ctx = null, osc = null, gain = null;
    var t0 = 0, raf = 0, timer = 0;
    var level = 0;
    var running = false;

    var readout = h('div.readout');
    var sub = h('div.pad__hint', { style: { marginTop: '10px' } });
    var bar = h('i');
    var progress = h('div.match__bar', { style: { marginTop: '18px' } }, [bar]);

    var hearBtn = h('button.btn.btn--primary.btn--wide', {
      type: 'button', onclick: function () { answer(level); }
    }, ['Слышу']);
    var skipBtn = h('button.btn.btn--wide', {
      type: 'button', onclick: function () { answer(100); }
    }, ['Не слышу']);

    var stage = h('div.pad', [h('div', [readout, sub])]);
    var controls = h('div.btn-row', [hearBtn, skipBtn]);
    controls.style.display = 'none';

    var startBtn = h('button.btn.btn--primary.btn--wide', {
      type: 'button', onclick: start
    }, ['Начать опыт']);

    host.appendChild(h('h2.lab-h', ['Твой слух']));
    host.appendChild(h('p.lab-q', ['Сейчас телефон будет играть звук и медленно делать его громче. Как только услышишь — нажимай «Слышу». Если так и не услышал — «Не слышу».']));
    host.appendChild(h('p.note', ['Поставь низкую комфортную громкость. Не повышай её, чтобы «услышать» высокий тон. Лучше пользоваться динамиком, а не наушниками.']));
    host.appendChild(stage);
    host.appendChild(progress);
    host.appendChild(controls);
    host.appendChild(h('div.btn-row', [startBtn]));

    setIdle();

    function setIdle() {
      readout.textContent = '—';
      sub.textContent = A.i18n.t('Нажми «Начать опыт»');
    }

    function start() {
      if (running) return;
      try {
        ctx = new (window.AudioContext || window.webkitAudioContext)();
      } catch (e) {
        sub.textContent = A.i18n.t('Браузер не дал доступ к звуку. Попробуй другой браузер.');
        return;
      }
      if (ctx.state === 'suspended' && ctx.resume) ctx.resume();
      running = true;
      startBtn.style.display = 'none';
      controls.style.display = '';
      playNext();
    }

    function playNext() {
      stopTone();
      if (idx >= FREQS.length) { finish(); return; }
      var f = FREQS[idx];

      osc = ctx.createOscillator();
      gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = f;
      gain.gain.value = 0;
      osc.connect(gain).connect(ctx.destination);
      osc.start();

      t0 = performance.now();
      level = 0;
      tick();

      // если не услышал за всё время нарастания — считаем порог недостижимым
      timer = setTimeout(function () { answer(100); }, RAMP + 400);
    }

    function tick() {
      var dt = performance.now() - t0;
      level = A.u.clamp(dt / RAMP * 100, 0, 100);
      if (gain) gain.gain.value = gainOf(level);
      readout.textContent = A.u.hz(FREQS[idx]);
      sub.textContent = A.i18n.t('Громкость') + ': ' + Math.round(level) + '%';
      bar.style.width = ((idx + level / 100) / FREQS.length * 100) + '%';
      raf = requestAnimationFrame(tick);
    }

    function answer(lv) {
      if (!running) return;
      points.push({ x: FREQS[idx], y: Math.round(lv) });
      idx++;
      playNext();
    }

    function stopTone() {
      if (timer) { clearTimeout(timer); timer = 0; }
      if (raf) { cancelAnimationFrame(raf); raf = 0; }
      if (osc) {
        try { osc.stop(); } catch (e) {}
        try { osc.disconnect(); gain.disconnect(); } catch (e) {}
        osc = null; gain = null;
      }
    }

    function finish() {
      running = false;
      stopTone();
      if (ctx && ctx.close) { try { ctx.close(); } catch (e) {} }
      api.setPoints(points);
      api.done();
    }

    return function () {
      running = false;
      stopTone();
      if (ctx && ctx.close) { try { ctx.close(); } catch (e) {} }
    };
  }

  A.labs.push({
    id: 'hearing',
    icon: '🎧',
    title: 'Твой слух',
    subject: 'Физика звука · Биология',
    gear: 'Нужен только динамик',
    safe: true,

    question: 'Какие высокие тоны ты услышишь на этом телефоне?',
    intro: 'Человек слышит не все частоты. Проверь, какие тоны воспроизводит твой телефон и какие из них ты слышишь в этой комнате. Это учебный опыт, а не проверка слуха.',
    howto: [
      'Убери шум вокруг и поставь низкую комфортную громкость. Не повышай её ради результата.',
      'Телефон сыграет девять звуков — от низкого к очень высокому.',
      'Каждый раз громкость растёт с нуля. Жми «Слышу» в тот момент, когда звук появился.',
      'Если звука так и не было — жми «Не слышу», это нормальный результат.'
    ],
    warn: 'Опыт не определяет возраст или здоровье слуха: громкость и высокие частоты зависят от динамика, настроек и помещения.',

    hypotheses: [
      { id: 'all', text: 'Я услышу все девять звуков, даже самый высокий' },
      { id: 'stop', text: 'На высоких звуках я перестану слышать' },
      { id: 'quiet', text: 'Высокие услышу, но они будут заметно тише' }
    ],

    chart: {
      logX: true,
      yMin: 0, yMax: 100,
      xTicks: [500, 2000, 8000, 19000],
      xFmt: function (v) { return A.u.hz(v); },
      yFmt: function (v) { return Math.round(v) + '%'; }
    },

    models: [{
      id: 'limit',
      label: 'граница на этом устройстве',
      params: [{
        key: 'limit', label: 'Граница частот, Гц', min: 5000, max: 22000, step: 250, init: 16000,
        fmt: function (v) { return A.u.hz(v); }
      }],
      fn: function (p, f) { return reference(p.limit, f); }
    }],

    reveal: function (c) {
      var top = 0;
      c.points.forEach(function (p) { if (p.y < 100 && p.x > top) top = p.x; });

      return {
        kicker: 'Твой результат',
        name: A.i18n.t('Какие тоны ты услышал'),
        formula: '',
        who: A.i18n.t('Слышимость здесь зависит сразу от двух вещей: твоего восприятия и того, как телефон воспроизводит звук. Без калиброванного оборудования нельзя определить порог слуха или «слуховой возраст». Сравни результат на другом устройстве и в более тихой комнате.'),
        you: A.i18n.fmt('<b>Самый высокий отмеченный тон: {top}.</b><br>Твоя учебная кривая описала точки с R² = {r}%. Если совпадение слабое, обсуди, что могло повлиять на измерение.', {
          top: top ? A.u.hz(top) : '—', r: c.match
        })
      };
    },

    verdict: function (c) {
      var heardTop = false;
      c.points.forEach(function (p) { if (p.x >= 19000 && p.y < 100) heardTop = true; });
      var T = A.i18n.t;
      if (c.hyp === 'stop') {
        return {
          ok: !heardTop,
          text: heardTop
            ? T('Ты отметил даже тон 19 кГц. Результат стоит перепроверить: некоторые динамики создают слышимые побочные звуки.')
            : T('На этом устройстве один или несколько высоких тонов не были услышаны. Это может зависеть и от динамика, и от условий опыта.')
        };
      }
      if (c.hyp === 'all') {
        return {
          ok: heardTop,
          text: heardTop
            ? T('Ты отметил все девять тонов на этом устройстве. Попробуй повторить опыт в другой комнате.')
            : T('Один или несколько высоких тонов ты не отметил. По телефону нельзя понять, причина в динамике, комнате или восприятии.')
        };
      }
      return {
        inconclusive: true,
        ok: false,
        text: T('Посмотри на свою кривую: стали ли высокие тоны труднее заметить? Уровни здесь относительные, а не калиброванные децибелы.')
      };
    },

    measure: measure
  });
})(window.A);
