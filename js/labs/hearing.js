/* Опыт «Твой слух».
   Телефон играет чистый тон и медленно поднимает громкость, ученик отмечает
   момент, когда услышал. Получается учебная кривая для этого устройства,
   а не медицинская оценка порога слуха. Разрешений не требуется. */

(function (A) {
  'use strict';

  var h = A.h;

  // От низких к высоким. Верхние тоны могут не воспроизводиться динамиком.
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
    var starting = false;
    var audioError = false;
    var disposed = false;

    var readout = h('div.readout');
    var sub = h('div.pad__hint', { style: { marginTop: '10px' } });
    var bar = h('i');
    var progress = h('div.match__bar', { style: { marginTop: '18px' } }, [bar]);

    var hearBtn = h('button.btn.btn--primary.btn--wide', {
      type: 'button', onclick: function () { answer(level, true); }
    }, ['Слышу']);
    var skipBtn = h('button.btn.btn--wide', {
      type: 'button', onclick: function () { answer(100, false); }
    }, ['Не слышу']);

    var stage = h('div.pad', [h('div', [readout, sub])]);
    var controls = h('div.btn-row', [hearBtn, skipBtn]);
    controls.style.display = 'none';

    var startBtn = h('button.btn.btn--primary.btn--wide', {
      type: 'button', onclick: start
    }, ['Начать опыт']);

    var headline = h('h2.lab-h', ['Твой слух']);
    var description = h('p.lab-q', ['Сейчас телефон будет играть звук и медленно делать его громче. Как только услышишь — нажимай «Слышу». Если так и не услышал — «Не слышу».']);
    var note = h('p.note', ['Поставь низкую комфортную громкость. Не повышай её, чтобы «услышать» высокий тон. Лучше пользоваться динамиком, а не наушниками.']);
    host.appendChild(headline);
    host.appendChild(description);
    host.appendChild(note);
    host.appendChild(A.perm.caveat('Это образовательный опыт, а не медицинский тест. Верхняя частота зависит не только от слуха, но и от динамика устройства и громкости.'));
    host.appendChild(stage);
    host.appendChild(progress);
    host.appendChild(controls);
    host.appendChild(h('div.btn-row', [startBtn]));

    setIdle();

    function setIdle() {
      readout.textContent = '—';
      sub.textContent = A.i18n.t('Нажми «Начать опыт»');
    }

    function translate() {
      headline.textContent = A.i18n.t('Твой слух');
      description.textContent = A.i18n.t('Сейчас телефон будет играть звук и медленно делать его громче. Как только услышишь — нажимай «Слышу». Если так и не услышал — «Не слышу».');
      note.textContent = A.i18n.t('Поставь низкую комфортную громкость. Не повышай её, чтобы «услышать» высокий тон. Лучше пользоваться динамиком, а не наушниками.');
      startBtn.textContent = A.i18n.t('Начать опыт');
      hearBtn.textContent = A.i18n.t('Слышу');
      skipBtn.textContent = A.i18n.t('Не слышу');
      sub.textContent = audioError
        ? A.i18n.t('Браузер не дал доступ к звуку. Попробуй другой браузер.')
        : running ? A.i18n.t('Громкость') + ': ' + Math.round(level) + '%'
          : A.i18n.t('Нажми «Начать опыт»');
      if (running) readout.textContent = A.u.hz(FREQS[idx]);
    }

    function start() {
      if (running || starting || disposed) return;
      try {
        ctx = new (window.AudioContext || window.webkitAudioContext)();
      } catch (e) {
        audioError = true;
        sub.textContent = A.i18n.t('Браузер не дал доступ к звуку. Попробуй другой браузер.');
        return;
      }
      audioError = false;
      starting = true;
      var ready;
      try { ready = ctx.state === 'suspended' && ctx.resume ? ctx.resume() : null; }
      catch (e) { audioFailed(); return; }
      Promise.resolve(ready).then(function () {
        starting = false;
        if (disposed) { if (ctx && ctx.close) { try { Promise.resolve(ctx.close()).catch(function () {}); } catch (e) {} } return; }
        if (ctx.state === 'suspended') { audioFailed(); return; }
        running = true;
        startBtn.style.display = 'none';
        controls.style.display = '';
        playNext();
      }, audioFailed);
    }

    function audioFailed() {
      starting = false;
      if (disposed) return;
      audioError = true;
      sub.textContent = A.i18n.t('Браузер не дал доступ к звуку. Попробуй другой браузер.');
      if (ctx && ctx.close) { try { Promise.resolve(ctx.close()).catch(function () {}); } catch (e) {} }
      ctx = null;
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
      timer = setTimeout(function () { answer(100, false); }, RAMP + 400);
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

    function answer(lv, heard) {
      if (!running) return;
      points.push({ x: FREQS[idx], y: Math.round(lv), heard: heard });
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

    function cleanup() {
      disposed = true;
      starting = false;
      running = false;
      stopTone();
      if (ctx && ctx.close) { try { ctx.close(); } catch (e) {} }
    }
    cleanup.translate = translate;
    return cleanup;
  }

  A.labs.push({
    id: 'hearing',
    icon: '🎧',
    title: 'Твой слух',
    subject: 'Физика звука · Биология',
    gear: 'Нужен только динамик',
    time: '≈2 мин',
    sensor: 'Динамик',
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
      c.points.forEach(function (p) {
        if ((p.heard === true || (p.heard === undefined && p.y < 100)) && p.x > top) top = p.x;
      });

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
      var heard = function (p) { return p.heard === true || (p.heard === undefined && p.y < 100); };
      var heardAll = c.points.length === FREQS.length && c.points.every(heard);
      var missedHigh = c.points.some(function (p) { return p.x >= 12000 && !heard(p); });
      var T = A.i18n.t;
      if (c.hyp === 'stop') {
        return {
          ok: missedHigh,
          text: !missedHigh
            ? T('Ты отметил все высокие тоны на этом устройстве. Результат стоит перепроверить: некоторые динамики создают слышимые побочные звуки.')
            : T('На этом устройстве один или несколько высоких тонов не были услышаны. Это может зависеть и от динамика, и от условий опыта.')
        };
      }
      if (c.hyp === 'all') {
        return {
          ok: heardAll,
          text: heardAll
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

    next: 'Изменится ли граница, если слушать через наушники, а не через динамик?',
    explain: 'Выше какой-то частоты звук для тебя пропал. Эту границу задают и ухо, и динамик телефона, поэтому число — результат на этом устройстве, а не медицинская оценка.',

    variants: ['в наушниках', 'в шумной комнате', 'через полметра от уха'],
    measure: measure
  });
})(window.A);
