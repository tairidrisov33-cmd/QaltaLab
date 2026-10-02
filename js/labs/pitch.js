/* Опыт «Бутылочный оркестр».
   Ученик наливает в бутылку разное количество воды и дует в горлышко.
   Телефон слушает микрофоном, раскладывает звук по частотам (БПФ) и находит
   основной тон. Бутылка, в которую дуют поперёк горлышка, приближённо
   ведёт себя как резонатор Гельмгольца: f пропорциональна 1/sqrt(V).
   Для бутылки с почти постоянным сечением высота воздуха служит
   приблизительной заменой объёма V, но не даёт скорость звука.

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
    var pending = false, disposed = false, requestId = 0;
    var retry = false, hintKey = 'Нажми «Разрешить микрофон», потом подуй в бутылку', hintExtra = '';
    var freq = 0;
    var len = 12;                     // высота воздушного столба, см
    var points = api.points.slice();

    var readout = h('div.readout', ['—']);
    var hint = h('div.pad__hint');
    // Живой спектр: что именно «слышит» БПФ и какой пик выбран как частота.
    var spec = h('canvas.spectrum', { 'aria-hidden': 'true' });
    var specCap = h('div.spectrum__cap', ['Спектр звука с микрофона: пик — основной тон бутылки']);
    var stage = h('div.pad', [h('div', { style: { width: '100%' } }, [readout, hint, spec, specCap])]);
    spec.style.display = specCap.style.display = 'none';   // появится вместе с микрофоном

    var lenVal = h('span.slider__val');
    var lenInput = h('input', {
      type: 'range', min: 2, max: 26, step: 0.5, value: len, 'aria-label': 'Высота воздуха над водой',
      oninput: function () {
        len = parseFloat(lenInput.value);
        // A tone measured for the previous water level is not a new sample.
        hist.length = 0;
        freq = 0;
        readout.textContent = '—';
        addBtn.disabled = true;
        paintLen();
        if (listening) setHint('Дуй вдоль края горлышка');
      }
    });
    var lenLabel = h('span', { text: 'Высота воздуха над водой' });
    var lenBox = h('div.slider', [
      h('div.slider__top', [lenLabel, lenVal]),
      lenInput
    ]);

    var table = h('div');

    var granted = false;   // до первого разрешения кнопка прямо говорит, что попросит микрофон
    var listenBtn = h('button.btn.btn--primary', { type: 'button', onclick: toggle }, ['Разрешить микрофон']);
    var addBtn = h('button.btn', { type: 'button', disabled: true, onclick: addPoint }, ['Записать точку']);
    var doneBtn = h('button.btn.btn--primary.btn--wide', {
      type: 'button', disabled: distinctCount() < NEED, onclick: function () { stop(); api.done(); }
    }, ['Готово, строим график']);

    var headline = h('h2.lab-h', ['Бутылочный оркестр']);
    var description = h('p.lab-q', ['Налей в бутылку воды, подуй в горлышко — телефон услышит и покажет частоту в герцах. Поставь ползунок на высоту воздуха над водой и запиши точку. Потом долей воды и повтори.']);
    var note = h('p.note', ['Дуй не в бутылку, а вдоль края горлышка, как в флейту. Если частота скачет — подуй ровнее и потише.']);
    host.appendChild(headline);
    host.appendChild(description);
    var permNote = A.perm.note('mic');
    var permErr = A.perm.errorBox();
    var liveMic = A.perm.live('mic');
    host.appendChild(permNote);
    host.appendChild(liveMic.el);
    host.appendChild(stage);
    host.appendChild(lenBox);
    host.appendChild(h('div.btn-row', [listenBtn, addBtn]));
    host.appendChild(permErr.el);
    host.appendChild(table);
    host.appendChild(h('div.btn-row', [doneBtn]));
    host.appendChild(note);

    paintLen();
    paintTable();
    paintHint();

    function paintHint() { hint.textContent = A.i18n.t(hintKey) + hintExtra; }
    function setHint(key, extra) { hintKey = key; hintExtra = extra || ''; paintHint(); }
    function translate() {
      headline.textContent = A.i18n.t('Бутылочный оркестр');
      description.textContent = A.i18n.t('Налей в бутылку воды, подуй в горлышко — телефон услышит и покажет частоту в герцах. Поставь ползунок на высоту воздуха над водой и запиши точку. Потом долей воды и повтори.');
      note.textContent = A.i18n.t('Дуй не в бутылку, а вдоль края горлышка, как в флейту. Если частота скачет — подуй ровнее и потише.');
      lenLabel.textContent = A.i18n.t('Высота воздуха над водой');
      specCap.textContent = A.i18n.t('Спектр звука с микрофона: пик — основной тон бутылки');
      listenBtn.textContent = A.i18n.t(listening ? 'Стоп' : retry ? 'Попробовать ещё раз' : granted ? 'Слушать' : 'Разрешить микрофон');
      addBtn.textContent = A.i18n.t('Записать точку');
      doneBtn.textContent = A.i18n.t('Готово, строим график');
      paintLen(); paintTable(); paintHint();
      var oldNote = permNote; permNote = A.perm.note('mic'); oldNote.parentNode.replaceChild(permNote, oldNote);
      permErr.translate();
    }

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
      doneBtn.disabled = distinctCount() < NEED;
      paintTable();
    }

    function distinctCount() {
      return points.filter(function (p, i) {
        return points.findIndex(function (q) { return q.x === p.x; }) === i;
      }).length;
    }

    function addPoint() {
      if (!freq || !listening) return;
      if (points.some(function (p) { return p.x === len; })) {
        setHint('Измени уровень воды перед новой точкой.');
        return;
      }
      points.push({ x: len, y: Math.round(freq) });
      points.sort(function (a, b) { return a.x - b.x; });
      sync();
      setHint('Точка записана. Долей воды и повтори.', ' ' + distinctCount() + '/' + NEED);
    }

    function toggle() { if (listening) stop(); else if (!pending) startMic(); }

    function startMic() {
      if (disposed || pending) return;
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        fail('Этот браузер не умеет слушать микрофон. Попробуй Chrome или Safari.');
        permErr.show('mic', { name: 'Unsupported' }, startMic);
        return;
      }
      pending = true;
      retry = false;
      listenBtn.disabled = true;
      var token = ++requestId;
      setHint('Ждём разрешения на микрофон…');
      navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false }
      }).then(function (s) {
        if (disposed || token !== requestId) {
          s.getTracks().forEach(function (t) { t.stop(); });
          return;
        }
        pending = false;
        listenBtn.disabled = false;
        permErr.hide();
        granted = true;
        stream = s;
        if (!window.AudioContext && !window.webkitAudioContext) {
          stop();
          fail('Этот браузер не умеет обрабатывать звук. Попробуй Chrome или Safari.');
          return;
        }
        ctx = new (window.AudioContext || window.webkitAudioContext)();
        if (ctx.state === 'suspended' && ctx.resume) ctx.resume();
        analyser = ctx.createAnalyser();
        analyser.fftSize = 8192;
        analyser.smoothingTimeConstant = 0.5;
        buf = new Float32Array(analyser.frequencyBinCount);
        ctx.createMediaStreamSource(stream).connect(analyser);
        listening = true;
        spec.style.display = specCap.style.display = '';
        liveMic.on(true);
        listenBtn.textContent = A.i18n.t('Стоп');
        setHint('Дуй вдоль края горлышка');
        loop();
      }).catch(function (err) {
        if (disposed || token !== requestId) return;
        permErr.show('mic', err, startMic);
        pending = false;
        listenBtn.disabled = false;
        stop();
        fail('Браузер не дал доступ к микрофону. Разреши его в настройках сайта — или пройди опыты, которым микрофон не нужен.');
      });
    }

    function fail(msg) {
      listening = false;
      retry = true;
      readout.textContent = '—';
      setHint(msg);
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

      var quiet = bi < 1 || best < -72;
      // Картинка спектра — только пояснение: её сбой не должен мешать замеру.
      try { drawSpectrum(rate, n, lo, hi, quiet ? -1 : bi); } catch (e) {}

      // Слишком тихо — это тишина, а не звук. Показываем честно, а не шум.
      if (quiet) {
        hist.length = 0;
        readout.textContent = '—';
        freq = 0;
        addBtn.disabled = true;
        setHint('Тихо. Подуй в бутылку');
        raf = requestAnimationFrame(loop);
        return;
      }

      // Уточняем положение пика параболой по трём точкам: без этого частота
      // прыгает ступеньками по 5 Гц и график выходит рваным.
      var a = buf[bi - 1], b = buf[bi], c = buf[bi + 1] !== undefined ? buf[bi + 1] : a;
      var d = (a - 2 * b + c);
      var delta = d ? A.u.clamp(0.5 * (a - c) / d, -1, 1) : 0;
      var f = (bi + delta) * rate / n;

      hist.push(f);
      if (hist.length > 9) hist.shift();
      freq = A.u.median(hist);
      var spread = Math.max.apply(null, hist) - Math.min.apply(null, hist);
      var stable = hist.length >= 6 && spread <= Math.max(20, freq * 0.08);

      readout.textContent = Math.round(freq) + ' ';
      readout.appendChild(h('small', ['Гц']));
      addBtn.disabled = !stable;
      setHint(!stable ? 'Держи звук ровно…' : 'Звук устойчив — можно записывать точку');

      raf = requestAnimationFrame(loop);
    }

    // Спектр от MIN_HZ до MAX_HZ по логарифмической оси (так видны и низкие
    // тоны), громкость в децибелах от −100 до −20. Пик отмечен линией.
    function drawSpectrum(rate, n, lo, hi, peak) {
      var w = spec.clientWidth || 280, H = 78;
      var dpr = Math.min(window.devicePixelRatio || 1, 3);
      if (spec.width !== Math.round(w * dpr)) {
        spec.width = Math.round(w * dpr); spec.height = Math.round(H * dpr);
        spec.style.height = H + 'px';
      }
      var c = spec.getContext('2d');
      c.setTransform(dpr, 0, 0, dpr, 0, 0);
      c.clearRect(0, 0, w, H);
      var css = getComputedStyle(document.documentElement);
      var accent = css.getPropertyValue('--accent').trim() || '#426D4F';
      var warn = css.getPropertyValue('--warn').trim() || '#A96C08';
      var muted = css.getPropertyValue('--text-3').trim() || '#66766C';
      var lmin = Math.log(MIN_HZ), lmax = Math.log(MAX_HZ);
      var X = function (i) { return (Math.log(Math.max(i * rate / n, MIN_HZ)) - lmin) / (lmax - lmin) * w; };
      var Y = function (db) { return H - 14 - A.u.clamp((db + 100) / 80, 0, 1) * (H - 20); };
      c.beginPath();
      c.moveTo(0, H - 14);
      for (var i = lo; i <= hi && i < buf.length; i++) c.lineTo(X(i), Y(buf[i]));
      c.lineTo(w, H - 14);
      c.closePath();
      c.fillStyle = accent; c.globalAlpha = 0.28; c.fill();
      c.globalAlpha = 1; c.strokeStyle = accent; c.lineWidth = 1.5; c.stroke();
      c.fillStyle = muted; c.font = '10px system-ui, sans-serif'; c.textBaseline = 'alphabetic';
      [100, 300, 1000, 2000].forEach(function (f, i, all) {
        var x = (Math.log(f) - lmin) / (lmax - lmin) * w;
        // крайняя правая подпись прижимается к краю, а не обрезается
        c.textAlign = i === all.length - 1 ? 'right' : 'center';
        c.fillText(A.u.hz(f), i === all.length - 1 ? w - 4 : A.u.clamp(x, 16, w - 16), H - 3);
      });
      if (peak > 0) {
        var px = X(peak);
        c.strokeStyle = warn; c.lineWidth = 2; c.setLineDash([4, 3]);
        c.beginPath(); c.moveTo(px, 2); c.lineTo(px, H - 14); c.stroke();
        c.setLineDash([]);
      }
    }

    function stop() {
      requestId++;
      pending = false;
      liveMic.on(false);
      listening = false;
      if (raf) { cancelAnimationFrame(raf); raf = 0; }
      if (stream) { stream.getTracks().forEach(function (t) { t.stop(); }); stream = null; }
      if (ctx && ctx.close) { try { ctx.close(); } catch (e) {} ctx = null; }
      listenBtn.textContent = A.i18n.t('Слушать');
      listenBtn.disabled = false;
      addBtn.disabled = true;
      freq = 0;
      hist.length = 0;
    }

    function cleanup() { disposed = true; stop(); }
    cleanup.translate = translate;
    return cleanup;
  }

  A.labs.push({
    id: 'pitch',
    icon: '🎵',
    title: 'Бутылочный оркестр',
    subject: 'Физика звука · Волны',
    gear: 'Бутылка, вода, микрофон',
    time: '≈5 мин',
    sensor: 'Микрофон',

    question: 'Почему пустая бутылка гудит низко, а почти полная — высоко?',
    intro: 'Когда дуешь поперёк горлышка, воздух в бутылке резонирует. Чем меньше его объём, тем выше тон. Измерим частоту и проверим приближённую зависимость.',
    howto: [
      'Возьми бутылку и налей немного воды.',
      'Возьми бутылку с примерно ровными стенками. Измерь или оцени высоту воздуха над водой и поставь ползунок.',
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

    // Под капотом: путь от датчика до точки на графике.
    pipeline: [
      'Микрофон записывает звук',
      'Быстрое преобразование Фурье (БПФ, 8192 отсчёта) раскладывает звук на частоты',
      'Самый сильный пик уточняется по трём точкам и сглаживается медианой',
      'Точка на графике: высота воздуха → частота'
    ],

    // Рамка для рисунка-предсказания: те же оси, что будут у графика опыта.
    predict: { xMin: 2, xMax: 26, yMin: 0, yMax: 1000, xLabel: 'Высота воздуха над водой', yLabel: 'Частота, Гц', unit: ' Гц' },

    chart: {
      yMin: 0,
      xFmt: function (v) { return A.u.num(v, 0) + A.i18n.t(' см'); },
      yFmt: function (v) { return Math.round(v) + ''; }
    },

    models: [
      {
        id: 'inv',
        label: 'f = a / √L',
        params: [{
          key: 'a', label: 'Коэффициент a (Гц · √см)', min: 100, max: 4000, step: 10,
          init: function (p) {
            if (!p.length) return 800;
            var s = 0;
            p.forEach(function (q) { s += q.y * Math.sqrt(q.x); });
            return Math.max(100, Math.min(4000, Math.round(s / p.length / 10) * 10));
          },
          fmt: function (v) { return Math.round(v) + ''; }
        }],
        fn: function (p, L) { return L > 0 ? p.a / Math.sqrt(L) : NaN; }
      },
      {
        id: 'lin',
        label: 'f = a − b·L',
        params: [
          { key: 'a', label: 'Начальная частота, Гц', min: 100, max: 1600, step: 10, init: 800,
            fmt: function (v) { return Math.round(v) + A.i18n.t(' Гц'); } },
          { key: 'b', label: 'Спад на сантиметр, Гц', min: 0, max: 120, step: 1, init: 30,
            fmt: function (v) { return Math.round(v) + A.i18n.t(' Гц'); } }
        ],
        fn: function (p, L) { return p.a - p.b * L; }
      }
    ],

    reveal: function (c) {
      return {
        kicker: A.i18n.t(c.match >= 60 && c.model.id === 'inv' ? 'Твои данные поддерживают модель' : 'Что говорит физика'),
        name: A.i18n.t('Резонанс Гельмгольца'),
        formula: 'f ∝ 1 / √V',
        who: A.i18n.t('<b>Бутылка с узким горлышком работает как резонатор.</b> Частота примерно обратно пропорциональна квадратному корню объёма воздуха V. Для бутылки с ровными стенками высота воздуха служит лишь приближением объёма. Из одной высоты нельзя надёжно вычислить скорость звука.'),
        you: c.match >= 60 && c.model.id === 'inv'
          ? A.i18n.fmt('Твоя кривая f = a / √L описала точки с R² = {r}%. Проверь ещё одну бутылку: её форма может изменить результат.', { r: c.match })
          : A.i18n.t('Твои точки не дали уверенного совпадения с этой моделью. Попробуй измерить уровни точнее, убрать фоновый шум и повторить опыт — отсутствие совпадения тоже полезный результат.')
      };
    },

    verdict: function (c) {
      if (c.match < 60 || c.model.id !== 'inv') {
        return { inconclusive: true, ok: false, text: A.i18n.t('Данные пока не позволяют уверенно проверить гипотезу. Посмотри на разброс точек и попробуй повторить измерение.') };
      }
      if (c.hyp === 'inv') {
        return { ok: true, text: A.i18n.t('На твоих точках частота растёт при уменьшении объёма воздуха. Приближённая модель для бутылки: f пропорциональна 1 / √V.') };
      }
      if (c.hyp === 'lin') {
        return { ok: false, text: A.i18n.t('На твоих точках рост не выглядит равномерным. Для бутылки лучше работает зависимость от квадратного корня объёма воздуха.') };
      }
      return { ok: false, text: A.i18n.t('Звук создаёт колебание воздуха в бутылке. Вода меняет его объём и тем самым частоту резонанса.') };
    },

    next: 'Что изменится, если взять бутылку в два раза больше?',
    explain: 'Чем больше воды в бутылке, тем меньше в ней воздуха — и тем выше звук. Воздух в горлышке колеблется как грузик на пружине: чем меньше объём воздуха под ним, тем жёстче пружина и выше частота.',

    variants: ['другой бутылкой', 'с водой погорячее', 'стуча по стеклу, а не дуя'],
    measure: measure
  });
})(window.A);
