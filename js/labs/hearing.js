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
  var MAX_GAIN = 0.28;  // выше не поднимаем: это уже больно в наушниках

  // Уровень 0..100 -> реальная громкость. Шкала логарифмическая, потому что
  // ухо воспринимает громкость именно так.
  function gainOf(level) {
    return MAX_GAIN * Math.pow(10, (level - 100) / 40);
  }

  // Эталонный порог слышимости для возраста: до какой-то частоты слышно легко,
  // а у верхней границы порог резко взлетает. Граница падает с возрастом.
  function fmaxKHz(age) { return 21.5 - 0.17 * age; }

  function reference(age, f) {
    var k = (f / 1000) / fmaxKHz(age);
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
    host.appendChild(h('p.note', ['Сделай тише вокруг и поставь громкость устройства примерно на две трети. В наушниках точнее, но и без них работает.']));
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
      readout.appendChild || 0;
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

    question: 'До какой высоты звука доходит твой слух — и почему у взрослых она ниже?',
    intro: 'Человек слышит не всё подряд. С возрастом верхняя граница слуха опускается, и это можно измерить прямо сейчас, без всякой аппаратуры.',
    howto: [
      'Убери шум вокруг и поставь громкость примерно на две трети.',
      'Телефон сыграет девять звуков — от низкого к очень высокому.',
      'Каждый раз громкость растёт с нуля. Жми «Слышу» в тот момент, когда звук появился.',
      'Если звука так и не было — жми «Не слышу», это нормальный результат.'
    ],
    warn: 'Опыт учебный, а не медицинский: громкость зависит от устройства и наушников.',

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
      id: 'age',
      label: 'порог(возраст)',
      params: [{
        key: 'age', label: 'Возраст слуха', min: 10, max: 70, step: 1, init: 16,
        fmt: function (v) { return Math.round(v) + A.i18n.t(' лет'); }
      }],
      fn: function (p, f) { return reference(p.age, f); }
    }],

    reveal: function (c) {
      var age = Math.round(c.params.age);
      var top = 0;
      c.points.forEach(function (p) { if (p.y < 100 && p.x > top) top = p.x; });
      var limit = fmaxKHz(age);

      return {
        kicker: 'Твой результат',
        name: A.i18n.fmt('Слуховой возраст: {age}', { age: age }),
        formula: A.i18n.t('граница ≈ 21,5 − 0,17 · возраст  (кГц)'),
        who: A.i18n.t('Порог слышимости почти не меняется на низких частотах, но у верхней границы взлетает резко. С возрастом волосковые клетки внутреннего уха изнашиваются, и граница опускается примерно на 1 кГц каждые 6 лет.'),
        you: A.i18n.fmt('<b>Самый высокий звук, который ты услышал: {top}.</b><br>По твоей кривой граница слуха около <b>{limit} кГц</b>. У человека сорока лет она примерно {adult} кГц — то есть звук, который ты сейчас слышал, твой учитель, скорее всего, уже не услышит.', {
          top: top ? A.u.hz(top) : '—',
          limit: A.u.num(limit, 1),
          adult: A.u.num(fmaxKHz(40), 1)
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
            ? T('Ты ожидал, что перестанешь слышать, — но услышал даже 19 кГц. Такой слух встречается у подростков и почти не встречается после тридцати.')
            : T('Так и вышло: на высоких частотах порог взлетел, и звук пропал. Именно эта граница и опускается с возрастом.')
        };
      }
      if (c.hyp === 'all') {
        return {
          ok: heardTop,
          text: heardTop
            ? T('Редкий случай: ты услышал весь диапазон до 19 кГц.')
            : T('Оказалось иначе: где-то на высоких частотах звук пропал совсем. Это не проблема со слухом — так устроено ухо у всех, вопрос только в том, где проходит граница.')
        };
      }
      return {
        ok: false,
        text: T('Высокие звуки не просто тише — выше определённой частоты они перестают слышаться вовсе. Порог растёт не плавно, а обрывом.')
      };
    },

    measure: measure
  });
})(window.A);
