/* Опыт «Бутылочный оркестр».
   Ученик наливает в бутылку разное количество воды и дует в горлышко.
   Телефон слушает микрофоном, раскладывает звук по частотам (БПФ) и находит
   основной тон. Из точек выходит зависимость f ~ 1/L — та же, что у любой
   духовой трубы.

   Единственный опыт, которому нужно разрешение. Поэтому отказ обрабатывается
   отдельным экраном с объяснением, а не пустой страницей. */

(function (A) {
  'use strict';

  var h = A.h;
  var MIN_HZ = 70, MAX_HZ = 2200;
  var NEED = 4;   // меньше четырёх точек — зависимость не видна

  function measure(host, api) {
    var ctx = null, stream = null, analyser = null, raf = 0;
    var buf = null, hist = [];
    var listening = false;
    var freq = 0;
    var len = 12;                     // высота воздушного столба, см
    var points = api.points.slice();

    var readout = h('div.readout', ['—']);
    var hint = h('div.pad__hint');
    var stage = h('div.pad', [h('div', { style: { width: '100%' } }, [readout, hint])]);

    var lenVal = h('span.slider__val');
    var lenInput = h('input', {
      type: 'range', min: 2, max: 26, step: 0.5, value: len,
      oninput: function () { len = parseFloat(lenInput.value); paintLen(); }
    });
    var lenBox = h('div.slider', [
      h('div.slider__top', [h('span', { text: 'Высота воздуха над водой' }), lenVal]),
      lenInput
    ]);

    var table = h('div');

    var listenBtn = h('button.btn.btn--primary', { type: 'button', onclick: toggle }, ['Слушать']);
    var addBtn = h('button.btn', { type: 'button', disabled: true, onclick: addPoint }, ['Записать точку']);
    var doneBtn = h('button.btn.btn--primary.btn--wide', {
      type: 'button', disabled: points.length < NEED, onclick: function () { stop(); api.done(); }
    }, ['Готово, строим график']);

    host.appendChild(h('h2.lab-h', ['Бутылочный оркестр']));
    host.appendChild(h('p.lab-q', ['Налей в бутылку воды, подуй в горлышко — телефон услышит и покажет частоту в герцах. Поставь ползунок на высоту воздуха над водой и запиши точку. Потом долей воды и повтори.']));
    host.appendChild(stage);
    host.appendChild(lenBox);
    host.appendChild(h('div.btn-row', [listenBtn, addBtn]));
    host.appendChild(table);
    host.appendChild(h('div.btn-row', [doneBtn]));
    host.appendChild(h('p.note', ['Дуй не в бутылку, а вдоль края горлышка, как в флейту. Если частота скачет — подуй ровнее и потише.']));

    paintLen();
    paintTable();
    hint.textContent = A.i18n.t('Нажми «Слушать» и подуй в бутылку');

    function paintLen() { lenVal.textContent = A.u.num(len, 1) + ' ' + A.i18n.t('см'); }

    function paintTable() {
      A.u.clear(table);
      if (!points.length) return;
      var t = h('table.points');
      t.appendChild(h('thead', [h('tr', [
        h('th', ['Высота, см']), h('th', ['Частота, Гц']), h('th', [''])
      ])]));
      var body = h('tbody');
      points.forEach(function (p, i) {
        body.appendChild(h('tr', [
          h('td', [A.raw(A.u.num(p.x, 1))]),
          h('td', [A.raw(String(Math.round(p.y)))]),
          h('td', { style: { textAlign: 'right' } }, [
            h('button.linkbtn', {
              type: 'button', onclick: function () { points.splice(i, 1); sync(); }
            }, ['убрать'])
          ])
        ]));
      });
      t.appendChild(body);
      table.appendChild(t);
    }

    function sync() {
      api.setPoints(points);
      doneBtn.disabled = points.length < NEED;
      paintTable();
    }

    function addPoint() {
      if (!freq) return;
      points.push({ x: len, y: Math.round(freq) });
      points.sort(function (a, b) { return a.x - b.x; });
      sync();
      hint.textContent = A.i18n.t('Точка записана. Долей воды и повтори.') +
        ' ' + points.length + '/' + NEED;
    }

    function toggle() { if (listening) stop(); else startMic(); }

    function startMic() {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        fail('Этот браузер не умеет слушать микрофон. Попробуй Chrome или Safari.');
        return;
      }
      navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false }
      }).then(function (s) {
        stream = s;
        ctx = new (window.AudioContext || window.webkitAudioContext)();
        if (ctx.state === 'suspended' && ctx.resume) ctx.resume();
        analyser = ctx.createAnalyser();
        analyser.fftSize = 8192;
        analyser.smoothingTimeConstant = 0.5;
        buf = new Float32Array(analyser.frequencyBinCount);
        ctx.createMediaStreamSource(stream).connect(analyser);
        listening = true;
        listenBtn.textContent = A.i18n.t('Стоп');
        hint.textContent = A.i18n.t('Дуй вдоль края горлышка');
        loop();
      }).catch(function () {
        fail('Браузер не дал доступ к микрофону. Разреши его в настройках сайта — или пройди опыты, которым микрофон не нужен.');
      });
    }

    function fail(msg) {
      listening = false;
      readout.textContent = '—';
      hint.textContent = A.i18n.t(msg);
      listenBtn.textContent = A.i18n.t('Попробовать ещё раз');
    }

    function loop() {
      if (!listening) return;
      analyser.getFloatFrequencyData(buf);

      var rate = ctx.sampleRate, n = analyser.fftSize;
      var lo = Math.floor(MIN_HZ * n / rate), hi = Math.ceil(MAX_HZ * n / rate);
      var best = -Infinity, bi = -1;
      for (var i = lo; i <= hi && i < buf.length; i++) {
        if (buf[i] > best) { best = buf[i]; bi = i; }
      }

      // Слишком тихо — это тишина, а не звук. Показываем честно, а не шум.
      if (bi < 1 || best < -72) {
        hist.length = 0;
        readout.textContent = '—';
        freq = 0;
        addBtn.disabled = true;
        hint.textContent = A.i18n.t('Тихо. Подуй в бутылку');
        raf = requestAnimationFrame(loop);
        return;
      }

      // Уточняем положение пика параболой по трём точкам: без этого частота
      // прыгает ступеньками по 5 Гц и график выходит рваным.
      var a = buf[bi - 1], b = buf[bi], c = buf[bi + 1] !== undefined ? buf[bi + 1] : a;
      var d = (a - 2 * b + c);
      var delta = d ? 0.5 * (a - c) / d : 0;
      var f = (bi + delta) * rate / n;

      hist.push(f);
      if (hist.length > 9) hist.shift();
      freq = A.u.median(hist);

      readout.textContent = Math.round(freq) + ' ';
      readout.appendChild(h('small', ['Гц']));
      addBtn.disabled = hist.length < 5;
      hint.textContent = hist.length < 5
        ? A.i18n.t('Держи звук ровно…')
        : A.i18n.t('Звук устойчив — можно записывать точку');

      raf = requestAnimationFrame(loop);
    }

    function stop() {
      listening = false;
      if (raf) { cancelAnimationFrame(raf); raf = 0; }
      if (stream) { stream.getTracks().forEach(function (t) { t.stop(); }); stream = null; }
      if (ctx && ctx.close) { try { ctx.close(); } catch (e) {} ctx = null; }
      listenBtn.textContent = A.i18n.t('Слушать');
      addBtn.disabled = true;
      hist.length = 0;
    }

    return stop;
  }

  A.labs.push({
    id: 'pitch',
    icon: '🎵',
    title: 'Бутылочный оркестр',
    subject: 'Физика звука · Волны',
    gear: 'Бутылка, вода, микрофон',

    question: 'Почему пустая бутылка гудит низко, а почти полная — высоко?',
    intro: 'Звук в бутылке рождает не вода, а столб воздуха над ней. Чем этот столб короче, тем выше тон. Сейчас измерим это в герцах и найдём точную зависимость.',
    howto: [
      'Возьми бутылку и налей немного воды.',
      'Линейкой или на глаз прикинь высоту воздуха над водой и поставь ползунок.',
      'Нажми «Слушать» и подуй вдоль края горлышка, как в флейту.',
      'Когда частота перестанет прыгать — жми «Записать точку».',
      'Долей воды и повтори. Нужно минимум четыре разных уровня.'
    ],
    warn: 'Первый раз браузер спросит разрешение на микрофон. Звук никуда не отправляется: весь разбор идёт прямо в телефоне.',

    hypotheses: [
      { id: 'inv', text: 'Чем меньше воздуха, тем выше звук — и растёт он всё быстрее' },
      { id: 'lin', text: 'Звук поднимается равномерно: убрал сантиметр — прибавил столько же герц' },
      { id: 'water', text: 'Дело в воде: чем её больше, тем выше звук' }
    ],

    chart: {
      yMin: 0,
      xFmt: function (v) { return A.u.num(v, 0) + ' см'; },
      yFmt: function (v) { return Math.round(v) + ''; }
    },

    models: [
      {
        id: 'inv',
        label: 'f = a / L',
        params: [{
          key: 'a', label: 'Коэффициент a (см · Гц)', min: 1000, max: 16000, step: 50,
          init: function (p) {
            if (!p.length) return 8500;
            var s = 0;
            p.forEach(function (q) { s += q.y * q.x; });
            return Math.round(s / p.length / 50) * 50;
          },
          fmt: function (v) { return Math.round(v) + ''; }
        }],
        fn: function (p, L) { return L > 0 ? p.a / L : NaN; }
      },
      {
        id: 'lin',
        label: 'f = a − b·L',
        params: [
          { key: 'a', label: 'Начальная частота, Гц', min: 100, max: 1600, step: 10, init: 800,
            fmt: function (v) { return Math.round(v) + ' Гц'; } },
          { key: 'b', label: 'Спад на сантиметр, Гц', min: 0, max: 120, step: 1, init: 30,
            fmt: function (v) { return Math.round(v) + ' Гц'; } }
        ],
        fn: function (p, L) { return p.a - p.b * L; }
      }
    ],

    reveal: function (c) {
      var a = c.params.a;
      // f = v / (4L) для трубы, закрытой с одного конца. Значит v = 4a,
      // где a в см·Гц; переводим в метры в секунду.
      var v = c.model && c.model.id === 'inv' ? (4 * a / 100) : null;

      return {
        kicker: 'Ты открыл',
        name: 'Закон звучащей трубы',
        formula: 'f = v / (4 · L)',
        who: '<b>Столб воздуха — это волна, зажатая между дном и горлышком.</b> Чем он короче, тем чаще волна успевает пробежать туда-обратно, и тем выше тон. ' +
          'Та же формула объясняет, почему у флейты закрываешь отверстия — и звук ниже, и почему у органа самые низкие трубы самые длинные.',
        you: v
          ? '<b>Твой коэффициент a = ' + Math.round(a) + ' см·Гц.</b><br>' +
            'Из него получается скорость звука <b>' + A.u.num(v, 0) + ' м/с</b>. ' +
            'Настоящая скорость звука в воздухе при комнатной температуре — 343 м/с. ' +
            'Ты только что измерил её бутылкой и телефоном.'
          : '<b>Прямая линия легла хуже, чем гипербола.</b> Это и есть ответ: частота зависит от длины столба не линейно, а обратно пропорционально.'
      };
    },

    verdict: function (c) {
      if (c.hyp === 'inv') {
        return { ok: true, text: 'Именно так. Зависимость обратная: частота равна коэффициенту, делённому на длину столба. Поэтому последние сантиметры поднимают тон куда сильнее первых.' };
      }
      if (c.hyp === 'lin') {
        return { ok: false, text: 'Равномерного роста не вышло: на твоём графике точки ложатся на гиперболу, а не на прямую. Убрать сантиметр у короткого столба — совсем не то же самое, что у длинного.' };
      }
      return { ok: false, text: 'Вода звук не издаёт — она только укорачивает столб воздуха. Проверить легко: та же бутылка, засыпанная песком до того же уровня, зазвучит так же.' };
    },

    measure: measure
  });
})(window.A);
