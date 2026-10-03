/* Опыт «Пульс камерой».
   Палец на объективе: кровь при каждом ударе сердца чуть меняет прозрачность
   кожи, и камера видит это как колебание яркости. Метод называется
   фотоплетизмографией, им же работают фитнес-браслеты.

   Мерим не один пульс, а кривую восстановления после нагрузки: сразу после
   приседаний, через полминуты, минуту и полторы. Из неё выходит постоянная
   восстановления — настоящий показатель тренированности. */

(function (A) {
  'use strict';

  var h = A.h;
  var WINDOW = 14000;      // сколько миллисекунд копим сигнал на одно измерение
  var MIN_BEAT = 330;      // короче — это уже не удар сердца, а шум (макс ~180 уд/мин)
  var MAX_BEAT = 2000;     // длиннее — пропущенный удар (мин 30 уд/мин)
  var STAGES = [0, 30, 60, 90];   // секунды после нагрузки

  function measure(host, api) {
    var stream = null, video = null, canvas = null, ctx = null, raf = 0, timer = 0;
    var track = null;
    var buf = [];            // {t, v}
    var beats = [];          // интервалы между ударами, мс
    var lastBeat = 0, armed = false;
    var phase = 'idle';      // idle | rest | ready | wait | run | done
    var stageIdx = 0;
    var restBpm = 0;
    var points = [];
    var startedAt = 0;

    var readout = h('div.readout', ['—']);
    var hint = h('div.pad__hint');
    var wave = h('canvas.pulsewave');
    var stage = h('div.pad', [h('div', { style: { width: '100%' } }, [readout, hint, wave])]);
    var bar = h('i');
    var progress = h('div.match__bar', { style: { marginTop: '18px' } }, [bar]);

    var mainBtn = h('button.btn.btn--primary.btn--wide', { type: 'button', onclick: onMain }, ['Разрешить камеру']);
    var table = h('div');
    var doneBtn = h('button.btn.btn--primary.btn--wide', {
      type: 'button', disabled: true, onclick: function () { stop(); api.done(); }
    }, ['Готово, строим график']);

    host.appendChild(h('h2.lab-h', ['Пульс камерой']));
    host.appendChild(h('p.lab-q', ['Прижми подушечку пальца к объективу задней камеры и не двигай. Когда кадр станет ровно-красным, приложение начнёт считать удары.']));
    var permErr = A.perm.errorBox();
    var liveCam = A.perm.live('camera');
    host.appendChild(A.perm.note('camera'));
    host.appendChild(liveCam.el);
    host.appendChild(stage);
    host.appendChild(progress);
    host.appendChild(h('div.btn-row', [mainBtn]));
    host.appendChild(permErr.el);
    host.appendChild(table);
    host.appendChild(h('div.btn-row', [doneBtn]));
    host.appendChild(A.perm.caveat('Это учебный опыт, а не медицинский прибор: точность зависит от камеры, освещения и того, насколько ровно лежит палец. Нажимай на объектив мягко — сильное давление пережимает капилляры, и сигнал пропадает.'));

    hint.textContent = A.i18n.t('Нажми «Разрешить камеру» и прижми палец к объективу');
    paintTable();

    /* ---------- камера ---------- */

    function startCamera() {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        fail('Этот браузер не умеет работать с камерой. Попробуй Chrome или Safari.');
        permErr.show('camera', { name: 'Unsupported' }, startCamera);
        return;
      }
      navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 320 }, height: { ideal: 240 } }
      }).then(function (s) {
        // Пока ждали разрешение, человек мог уйти с экрана — тогда камеру
        // надо сразу погасить, иначе останется гореть индикатор записи.
        if (phase === 'off') { s.getTracks().forEach(function (t) { t.stop(); }); return; }
        permErr.hide();
        liveCam.on(true);
        stream = s;
        track = s.getVideoTracks()[0];
        // Фонарик есть не везде; без него нужен внешний свет, и об этом мы скажем.
        try {
          var caps = track.getCapabilities ? track.getCapabilities() : {};
          if (caps && caps.torch) track.applyConstraints({ advanced: [{ torch: true }] });
        } catch (e) {}

        video = document.createElement('video');
        video.setAttribute('playsinline', '');
        video.muted = true;
        video.srcObject = s;
        video.play().catch(function () {});

        canvas = document.createElement('canvas');
        canvas.width = 48; canvas.height = 36;
        ctx = canvas.getContext('2d', { willReadFrequently: true });

        beginRest();
      }).catch(function (err) {
        permErr.show('camera', err, function () { mainBtn.disabled = true; startCamera(); });
        fail('Браузер не дал доступ к камере. Разреши его в настройках сайта — или пройди опыты, которым камера не нужна.');
      });
    }

    function fail(msg) {
      phase = 'idle';
      readout.textContent = '—';
      hint.textContent = A.i18n.t(msg);
      mainBtn.textContent = A.i18n.t('Попробовать ещё раз');
      mainBtn.disabled = false;
    }

    /* ---------- разбор сигнала ---------- */

    function sample() {
      if (!video || video.readyState < 2) return;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      var d = ctx.getImageData(12, 9, 24, 18).data;
      var sum = 0, n = 0;
      for (var i = 0; i < d.length; i += 4) { sum += d[i]; n++; }   // красный канал
      var v = sum / n;
      var t = performance.now();
      buf.push({ t: t, v: v });
      while (buf.length && t - buf[0].t > 6000) buf.shift();

      detect(t, v);
      drawWave();
    }

    // Удар ищем по пересечению скользящего среднего снизу вверх: так порог
    // подстраивается сам, и медленный уход яркости (палец согревается) не мешает.
    function detect(t, v) {
      if (buf.length < 30) return;
      var from = t - 1500, s = 0, k = 0;
      for (var i = buf.length - 1; i >= 0 && buf[i].t >= from; i--) { s += buf[i].v; k++; }
      if (!k) return;
      var avg = s / k;

      if (v < avg - 0.15) armed = true;
      if (armed && v > avg + 0.15) {
        armed = false;
        if (lastBeat) {
          var dt = t - lastBeat;
          if (dt > MIN_BEAT && dt < MAX_BEAT) {
            beats.push(dt);
            if (beats.length > 20) beats.shift();
          }
        }
        lastBeat = t;
      }
    }

    function bpm() {
      if (beats.length < 4) return 0;
      return Math.round(60000 / A.u.median(beats));
    }

    function drawWave() {
      var w = wave.clientWidth || 260, hh = 54;
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      if (wave.width !== Math.round(w * dpr)) {
        wave.width = Math.round(w * dpr); wave.height = Math.round(hh * dpr);
        wave.style.height = hh + 'px';
      }
      var c = wave.getContext('2d');
      c.setTransform(dpr, 0, 0, dpr, 0, 0);
      c.clearRect(0, 0, w, hh);
      if (buf.length < 4) return;
      var lo = Infinity, hi = -Infinity;
      buf.forEach(function (p) { if (p.v < lo) lo = p.v; if (p.v > hi) hi = p.v; });
      if (hi - lo < 0.5) { lo -= 1; hi += 1; }
      var t0 = buf[0].t, t1 = buf[buf.length - 1].t || t0 + 1;
      c.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#2563EB';
      c.lineWidth = 2;
      c.beginPath();
      buf.forEach(function (p, i) {
        var x = (p.t - t0) / (t1 - t0) * w;
        var y = hh - (p.v - lo) / (hi - lo) * (hh - 6) - 3;
        if (!i) c.moveTo(x, y); else c.lineTo(x, y);
      });
      c.stroke();
    }

    /* ---------- сценарий ---------- */

    function loop() {
      if (phase === 'off') return;
      sample();
      var b = bpm();

      if (phase === 'rest' || phase === 'run') {
        var left = Math.max(0, WINDOW - (performance.now() - startedAt));
        bar.style.width = (100 - left / WINDOW * 100) + '%';
        readout.textContent = b ? b + ' ' : '…';
        if (b) readout.appendChild(h('small', ['уд/мин']));
        hint.textContent = b
          ? A.i18n.fmt('Идёт измерение, осталось {s} с', { s: Math.ceil(left / 1000) })
          : A.i18n.t('Сигнала пока нет. Прижми палец мягче и закрой им весь объектив.');
        if (left <= 0) finishWindow(b);
      }
      raf = requestAnimationFrame(loop);
    }

    function beginRest() {
      phase = 'rest';
      resetSignal();
      startedAt = performance.now();
      mainBtn.disabled = true;
      mainBtn.textContent = A.i18n.t('Идёт измерение…');
      raf = requestAnimationFrame(loop);
    }

    function resetSignal() { buf = []; beats = []; lastBeat = 0; armed = false; }

    function finishWindow(b) {
      cancelAnimationFrame(raf); raf = 0;
      if (!b) {
        hint.textContent = A.i18n.t('Удары не поймались. Проверь, что палец закрывает объектив и есть подсветка.');
        mainBtn.disabled = false;
        mainBtn.textContent = A.i18n.t('Измерить ещё раз');
        phase = phase === 'rest' ? 'idle' : 'ready';
        return;
      }
      if (phase === 'rest') {
        restBpm = b;
        phase = 'ready';
        readout.textContent = b + ' ';
        readout.appendChild(h('small', ['уд/мин']));
        hint.textContent = A.i18n.fmt('Пульс в покое: {b} уд/мин. Теперь сделай 20 приседаний и сразу возвращайся.', { b: b });
        mainBtn.disabled = false;
        mainBtn.textContent = A.i18n.t('Я сделал приседания');
        return;
      }
      // измерение после нагрузки
      points.push({ x: STAGES[stageIdx], y: b });
      stageIdx++;
      sync();
      if (stageIdx >= STAGES.length) {
        phase = 'done';
        hint.textContent = A.i18n.t('Все четыре замера сделаны.');
        mainBtn.disabled = true;
        mainBtn.textContent = A.i18n.t('Измерения закончены');
        stopCamera();
        return;
      }
      waitNext();
    }

    function waitNext() {
      phase = 'wait';
      var target = STAGES[stageIdx];
      var began = performance.now();
      mainBtn.disabled = true;
      var tick = function () {
        if (phase !== 'wait') return;
        var passed = (performance.now() - began) / 1000;
        var left = Math.max(0, (target - STAGES[stageIdx - 1]) - passed);
        readout.textContent = Math.ceil(left) + ' ';
        readout.appendChild(h('small', ['с']));
        hint.textContent = A.i18n.fmt('Отдыхай. Следующий замер — через {s} с после нагрузки.', { s: target });
        if (left <= 0) { beginRun(); return; }
        timer = setTimeout(tick, 250);
      };
      tick();
    }

    function beginRun() {
      phase = 'run';
      resetSignal();
      startedAt = performance.now();
      hint.textContent = A.i18n.t('Прижми палец к объективу');
      raf = requestAnimationFrame(loop);
    }

    function onMain() {
      if (phase === 'idle') { mainBtn.disabled = true; startCamera(); return; }
      if (phase === 'ready' && !points.length) { stageIdx = 0; beginRun(); return; }
      if (phase === 'ready') { beginRun(); return; }
    }

    function sync() {
      api.setPoints(points);
      doneBtn.disabled = points.length < 3;
      paintTable();
    }

    function paintTable() {
      A.u.clear(table);
      if (!points.length) return;
      var t = h('table.points');
      t.appendChild(h('thead', [h('tr', [h('th', ['Секунд после нагрузки']), h('th', ['Пульс, уд/мин'])])]));
      var body = h('tbody');
      points.forEach(function (p) {
        body.appendChild(h('tr', [h('td', [A.raw(String(p.x))]), h('td', [A.raw(String(p.y))])]));
      });
      t.appendChild(body);
      table.appendChild(t);
      if (restBpm) table.appendChild(h('p.note', [A.raw(A.i18n.fmt('Пульс в покое: {b} уд/мин', { b: restBpm }))]));
    }

    function stopCamera() {
      liveCam.on(false);
      if (track) { try { track.applyConstraints({ advanced: [{ torch: false }] }); } catch (e) {} track = null; }
      if (stream) { stream.getTracks().forEach(function (t) { t.stop(); }); stream = null; }
      if (video) { video.srcObject = null; video = null; }
    }

    function stop() {
      phase = 'off';
      if (raf) { cancelAnimationFrame(raf); raf = 0; }
      if (timer) { clearTimeout(timer); timer = 0; }
      stopCamera();
    }

    stop.translate = function () { permErr.translate(); };
    return stop;
  }

  A.labs.push({
    id: 'pulse',
    icon: 'heart',
    title: 'Пульс камерой',
    subject: 'Биология · Физиология',
    gear: 'Камера телефона',
    time: '≈3 мин',
    sensor: 'Камера',

    question: 'Как быстро твоё сердце успокаивается после нагрузки — и что это говорит о тренированности?',
    intro: 'Камера видит пульс: при каждом ударе кровь наполняет капилляры, и палец на объективе чуть темнеет. Этот метод называется фотоплетизмографией, так же работают фитнес-браслеты.',
    howto: [
      'Нажми «Разрешить камеру» и разреши доступ.',
      'Прижми подушечку пальца к задней камере, закрыв объектив целиком. Не дави сильно.',
      'Первое измерение — пульс в покое, оно займёт около пятнадцати секунд.',
      'Потом сделай 20 приседаний и сразу вернись к телефону.',
      'Приложение само попросит замерить пульс сразу, через 30, 60 и 90 секунд.'
    ],
    warn: 'Опыт учебный и не заменяет измерение пульса медицинским прибором. Если чувствуешь себя плохо — не делай нагрузку.',

    hypotheses: [
      { id: 'exp', text: 'Пульс спадает быстро сначала и медленно потом' },
      { id: 'lin', text: 'Пульс спадает равномерно, по столько-то ударов в минуту' },
      { id: 'slow', text: 'Пульс почти не изменится за полторы минуты' }
    ],

    // Под капотом: путь от датчика до точки на графике.
    // Источник научного пояснения — показывается в карточке закона.
    source: { t: 'Cole C. R. et al. Heart-rate recovery immediately after exercise. <i>New England Journal of Medicine</i>, 1999', u: 'https://doi.org/10.1056/NEJM199910283411804' },
    pipeline: [
      'Камера снимает палец на объективе',
      'Средняя яркость красного канала каждого кадра — фотоплетизмография',
      'Пики яркости — удары сердца; медиана интервалов → удары в минуту',
      'Точка на графике: время после нагрузки → пульс'
    ],

    // Рамка для рисунка-предсказания: те же оси, что будут у графика опыта.
    predict: { xMin: 0, xMax: 90, yMin: 40, yMax: 180, xLabel: 'Время после нагрузки', yLabel: 'Пульс, уд/мин', unit: ' уд/мин' },

    chart: {
      xMin: 0, yMin: 0,
      xFmt: function (v) { return Math.round(v) + ' с'; },
      yFmt: function (v) { return Math.round(v) + ''; }
    },

    models: [
      {
        id: 'exp',
        label: 'HR = rest + A·e^(−t/τ)',
        params: [
          { key: 'rest', label: 'Пульс покоя, уд/мин', min: 50, max: 110, step: 1,
            init: function (p) { return p.length ? Math.max(50, Math.min(110, Math.round(p[p.length - 1].y - 10))) : 75; },
            fmt: function (v) { return Math.round(v) + ''; } },
          { key: 'A', label: 'Подъём от нагрузки, уд/мин', min: 5, max: 90, step: 1,
            init: function (p) { return p.length ? Math.max(5, Math.min(90, Math.round(p[0].y - p[p.length - 1].y + 10))) : 40; },
            fmt: function (v) { return Math.round(v) + ''; } },
          { key: 'tau', label: 'Постоянная восстановления τ, с', min: 10, max: 200, step: 2, init: 60,
            fmt: function (v) { return Math.round(v) + ' с'; } }
        ],
        fn: function (p, t) { return p.rest + p.A * Math.exp(-t / p.tau); }
      },
      {
        id: 'lin',
        label: 'HR = a − b·t',
        params: [
          { key: 'a', label: 'Пульс сразу после нагрузки, уд/мин', min: 80, max: 200, step: 1, init: function (p) { return p.length ? Math.max(80, Math.min(200, p[0].y)) : 140; }, fmt: function (v) { return Math.round(v) + ''; } },
          { key: 'b', label: 'Спад в минуту, уд/мин', min: 0, max: 1.2, step: 0.02, init: 0.3, fmt: function (v) { return A.u.num(v, 2); } }
        ],
        fn: function (p, t) { return p.a - p.b * t; }
      }
    ],

    reveal: function (c) {
      var good = c.model.id === 'exp' && c.match >= 60;
      var tau = c.model.id === 'exp' ? Math.round(c.params.tau) : null;
      return {
        kicker: A.i18n.t(good ? 'Твои данные поддерживают модель' : 'Что говорит физиология'),
        name: A.i18n.t('Восстановление пульса'),
        formula: 'HR(t) = HR_покоя + A · e^(−t/τ)',
        who: A.i18n.t('<b>Сердце возвращается к покою не равномерно, а по затухающей.</b> Сразу после нагрузки спад самый быстрый — работает парасимпатическая нервная система, которая буквально тормозит сердце. Скорость этого спада врачи и тренеры используют как показатель состояния сердечно-сосудистой системы.'),
        you: good
          ? A.i18n.fmt('Твоя кривая описала точки с R² = {r}%. Постоянная восстановления τ = {tau} с: за это время подъём пульса спадает примерно в 2,7 раза. Чем меньше τ, тем быстрее сердце успокаивается.', { r: c.match, tau: tau })
          : A.i18n.t('Точки пока не сложились в затухающую кривую. Обычно мешают движение пальца, слабая подсветка или слишком лёгкая нагрузка. Повтори опыт, дав себе как следует разогнать пульс.')
      };
    },

    verdict: function (c) {
      if (c.model.id !== 'exp' || c.match < 60) {
        return { inconclusive: true, ok: false, text: A.i18n.t('По этим четырём точкам нельзя уверенно сказать, как спадал пульс. Повтори измерения, стараясь не шевелить пальцем во время замера.') };
      }
      if (c.hyp === 'exp') {
        return { ok: true, text: A.i18n.t('Именно так и вышло: первые тридцать секунд дают самый большой спад, дальше кривая выполаживается. Это признак затухающего процесса, а не равномерного.') };
      }
      if (c.hyp === 'lin') {
        return { ok: false, text: A.i18n.t('Равномерного спада не получилось: прямая легла хуже затухающей кривой. Если бы спад был равномерным, пульс рано или поздно ушёл бы ниже покоя, а этого не бывает.') };
      }
      return { ok: false, text: A.i18n.t('Изменение всё-таки есть, и заметное. Именно скорость этого спада тренеры используют как показатель тренированности.') };
    },

    next: 'Как быстро восстановится пульс, если сделать не 20, а 40 приседаний?',
    explain: 'После приседаний сердце разгоняется, а потом успокаивается — сначала быстро, затем всё медленнее. Такое затухание описывает экспонента, а время τ показывает, как быстро организм возвращается к покою.',

    variants: ['после бега на месте', 'после десяти глубоких вдохов', 'сидя и стоя'],
    measure: measure
  });
})(window.A);
