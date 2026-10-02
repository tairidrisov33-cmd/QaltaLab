/* Опыт «Физика домбры».
   Домбра — готовый физический прибор: высоту звука задаёт длина звучащей
   части струны. Ученик зажимает струну на разных ладах, линейкой меряет
   длину от лада до подставки, а телефон слушает щипок и находит основной
   тон. Точки ложатся на гиперболу f = a / L: вдвое короче — вдвое выше,
   то есть на октаву. Это закон струны (Мерсенн, 1636), а отношения длин
   для ладов описывал ещё Аль-Фараби в «Большой книге о музыке».

   Отличие от бутылки: у щипка второй обертон бывает громче основного тона,
   поэтому тон ищется по гармоникам (A.sound.fundamental), а звук быстро
   затихает — последняя устойчивая частота держится на экране несколько
   секунд, чтобы её успели записать. Подойдёт и гитара, и натянутая резинка. */

(function (A) {
  'use strict';

  var h = A.h;
  var MIN_HZ = 70, MAX_HZ = 1200;
  var NEED = 4;        // меньше четырёх длин — зависимость не видна
  var HOLD = 5000;     // сколько миллисекунд держим тон после того, как струна затихла

  function measure(host, api) {
    var ctx = null, stream = null, analyser = null, raf = 0;
    var buf = null, hist = [];
    var listening = false, pending = false, disposed = false, requestId = 0;
    var retry = false, granted = false;
    var hintKey = 'Нажми «Разрешить микрофон», потом щипни струну', hintExtra = '';
    var held = null;                 // {f, t} — последний устойчивый тон
    var len = 70;                    // длина звучащей части струны, см
    var points = api.points.slice();

    var readout = h('div.readout', ['—']);
    var hint = h('div.pad__hint');
    var spec = h('canvas.spectrum', { 'aria-hidden': 'true' });
    var specCap = h('div.spectrum__cap', ['Спектр щипка: пунктир — основной тон струны']);
    var stage = h('div.pad', [h('div', { style: { width: '100%' } }, [readout, hint, spec, specCap])]);
    spec.style.display = specCap.style.display = 'none';   // появится вместе с микрофоном

    var lenVal = h('span.slider__val');
    var lenLabel = h('span', { text: 'Длина звучащей части струны' });
    var lenInput = h('input', {
      type: 'range', min: 10, max: 90, step: 0.5, value: len, 'aria-label': 'Длина звучащей части струны',
      oninput: function () {
        len = parseFloat(lenInput.value);
        // Тон, услышанный при прежней длине, к новой длине не относится.
        held = null; hist.length = 0;
        readout.textContent = '—';
        addBtn.disabled = true;
        paintLen();
        if (listening) setHint('Щипни струну на этой длине');
      }
    });
    var lenBox = h('div.slider', [h('div.slider__top', [lenLabel, lenVal]), lenInput]);
    var octave = h('p.note.dombra__oct', ['Проверка октавы: зажми струну ровно посередине. Звук должен стать выше ровно вдвое.']);

    var table = h('div');
    var listenBtn = h('button.btn.btn--primary', { type: 'button', onclick: toggle }, ['Разрешить микрофон']);
    var addBtn = h('button.btn', { type: 'button', disabled: true, onclick: addPoint }, ['Записать точку']);
    var doneBtn = h('button.btn.btn--primary.btn--wide', {
      type: 'button', disabled: distinctCount() < NEED, onclick: function () { stop(); api.done(); }
    }, ['Готово, строим график']);

    var headline = h('h2.lab-h', ['Физика домбры']);
    var description = h('p.lab-q', ['Зажми струну на ладу, поставь ползунок на длину звучащей части — от лада до подставки — и щипни. Телефон найдёт основной тон. Потом перейди на другой лад и повтори.']);
    var note = h('p.note', ['Щипай одинаково и не глуши вторую струну рукой — пусть звучит только та, которую меряешь. Телефон держи у корпуса инструмента.']);
    var permNote = A.perm.note('mic');
    var permErr = A.perm.errorBox();
    var liveMic = A.perm.live('mic');
    host.appendChild(headline);
    host.appendChild(description);
    host.appendChild(permNote);
    host.appendChild(liveMic.el);
    host.appendChild(stage);
    host.appendChild(lenBox);
    host.appendChild(h('div.btn-row', [listenBtn, addBtn]));
    host.appendChild(permErr.el);
    host.appendChild(table);
    host.appendChild(octave);
    host.appendChild(h('div.btn-row', [doneBtn]));
    host.appendChild(note);

    paintLen();
    paintTable();
    paintHint();

    function paintHint() { hint.textContent = A.i18n.t(hintKey) + hintExtra; }
    function setHint(key, extra) { hintKey = key; hintExtra = extra || ''; paintHint(); }
    function paintLen() { lenVal.textContent = A.u.num(len, 1) + ' ' + A.i18n.t('см'); }

    function translate() {
      lenLabel.textContent = A.i18n.t('Длина звучащей части струны');
      listenBtn.textContent = A.i18n.t(listening ? 'Стоп' : retry ? 'Попробовать ещё раз' : granted ? 'Слушать' : 'Разрешить микрофон');
      paintLen(); paintTable(); paintHint();
      var oldNote = permNote; permNote = A.perm.note('mic'); oldNote.parentNode.replaceChild(permNote, oldNote);
      permErr.translate();
    }

    function paintTable() {
      A.u.clear(table);
      if (!points.length) return;
      var t = h('table.points');
      t.appendChild(h('thead', [h('tr', [h('th', ['Длина струны, см']), h('th', ['Частота, Гц']), h('th', [''])])]));
      var body = h('tbody');
      points.forEach(function (p, i) {
        body.appendChild(h('tr', [
          h('td', [A.raw(A.u.num(p.x, 1))]),
          h('td', [A.raw(String(Math.round(p.y)))]),
          h('td', { style: { textAlign: 'right' } }, [
            h('button.linkbtn', { type: 'button', onclick: function () { points.splice(i, 1); sync(); } }, ['убрать'])
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
      if (!held) return;
      if (points.some(function (p) { return p.x === len; })) {
        setHint('Эта длина уже измерена. Перейди на другой лад и поменяй длину.');
        return;
      }
      points.push({ x: len, y: Math.round(held.f) });
      points.sort(function (a, b) { return a.x - b.x; });
      held = null;
      addBtn.disabled = true;
      sync();
      setHint('Точка записана. Перейди на другой лад и повтори.', ' ' + distinctCount() + '/' + NEED);
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
        if (disposed || token !== requestId) { s.getTracks().forEach(function (t) { t.stop(); }); return; }
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
        analyser.smoothingTimeConstant = 0.3;   // щипок короткий — сглаживаем меньше, чем у бутылки
        buf = new Float32Array(analyser.frequencyBinCount);
        ctx.createMediaStreamSource(stream).connect(analyser);
        listening = true;
        spec.style.display = specCap.style.display = '';
        liveMic.on(true);
        listenBtn.textContent = A.i18n.t('Стоп');
        setHint('Щипни струну');
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

    function show(f, sub) {
      readout.textContent = Math.round(f) + ' ';
      readout.appendChild(h('small', ['Гц']));
      if (sub) readout.appendChild(h('small.readout__held', [sub]));
    }

    function loop() {
      if (!listening) return;
      analyser.getFloatFrequencyData(buf);
      var rate = ctx.sampleRate, n = analyser.fftSize;
      var f = A.sound.fundamental(buf, rate, n, MIN_HZ, MAX_HZ);
      var now = performance.now();
      // Картинка спектра — только пояснение: её сбой не должен мешать замеру.
      try { A.sound.draw(spec, buf, rate, n, MIN_HZ, MAX_HZ, f || (held ? held.f : 0), [100, 200, 500, 1000]); } catch (e) {}

      if (!f) {
        hist.length = 0;
        if (held && now - held.t < HOLD) {
          // Струна затихла, но устойчивый тон ещё можно записать.
          show(held.f, 'записать?');
          addBtn.disabled = false;
          setHint('Тон пойман — запиши точку или щипни ещё раз');
        } else {
          held = null;
          readout.textContent = '—';
          addBtn.disabled = true;
          setHint('Тихо. Щипни струну');
        }
        raf = requestAnimationFrame(loop);
        return;
      }

      hist.push(f);
      if (hist.length > 7) hist.shift();
      var med = A.u.median(hist);
      var spread = Math.max.apply(null, hist) - Math.min.apply(null, hist);
      var stable = hist.length >= 5 && spread <= Math.max(6, med * 0.04);
      if (stable) held = { f: med, t: now };

      show(med);
      addBtn.disabled = !held;
      setHint(stable ? 'Тон устойчив — можно записывать точку' : 'Слушаю…');
      raf = requestAnimationFrame(loop);
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
      held = null;
      hist.length = 0;
    }

    function cleanup() { disposed = true; stop(); }
    cleanup.translate = translate;
    return cleanup;
  }

  A.labs.push({
    id: 'dombra',
    icon: '🪕',
    title: 'Физика домбры',
    subject: 'Физика звука · Музыка',
    gear: 'Домбра или гитара, линейка, микрофон',
    time: '≈6 мин',
    sensor: 'Микрофон',

    question: 'Почему звук домбры становится выше, когда зажимаешь струну ближе к подставке?',
    intro: 'Домбра — готовый физический прибор. Лады на грифе стоят не случайно: высоту звука задаёт длина звучащей части струны. Ещё Аль-Фараби в «Большой книге о музыке» описывал лады как отношения длин струны. Проверим этот закон телефоном.',
    howto: [
      'Возьми домбру (подойдёт и гитара) и линейку или рулетку.',
      'Нажми «Разрешить микрофон» и положи телефон рядом с корпусом инструмента.',
      'Зажми струну на ладу и измерь длину звучащей части — от лада до подставки. Поставь это число ползунком.',
      'Щипни струну. Когда тон станет устойчивым — «Записать точку».',
      'Повтори на других ладах. Нужно минимум четыре разные длины; открытая струна — тоже точка.'
    ],
    warn: 'Звук разбирается прямо в телефоне и никуда не отправляется. Нет домбры — возьми гитару или натянутую резинку.',

    hypotheses: [
      { id: 'inv', text: 'Чем короче звучащая часть струны, тем выше звук: вдвое короче — вдвое выше' },
      { id: 'lin', text: 'Звук растёт равномерно: укоротил на сантиметр — прибавил столько же герц' },
      { id: 'force', text: 'Высота звука зависит от силы щипка, а не от длины струны' }
    ],

    // Под капотом: путь от датчика до точки на графике.
    pipeline: [
      'Микрофон слышит щипок струны',
      'Быстрое преобразование Фурье (БПФ) раскладывает звук на частоты',
      'Основной тон ищется по гармоникам f, 2f и 3f вместе — громкий обертон не путается с основным тоном',
      'Точка на графике: длина струны → частота'
    ],

    // Рамка для рисунка-предсказания: те же оси, что будут у графика опыта.
    predict: { xMin: 10, xMax: 80, yMin: 0, yMax: 1000, xLabel: 'Длина звучащей части струны', yLabel: 'Частота, Гц', unit: ' Гц' },

    chart: {
      xMin: 0, yMin: 0,
      xFmt: function (v) { return A.u.num(v, 0) + A.i18n.t(' см'); },
      yFmt: function (v) { return Math.round(v) + ''; }
    },

    models: [
      {
        id: 'inv',
        label: 'f = a / L',
        params: [{
          key: 'a', label: 'Коэффициент a (Гц · см)', min: 1000, max: 40000, step: 50,
          init: function (p) {
            if (!p.length) return 10000;
            var s = 0;
            p.forEach(function (q) { s += q.y * q.x; });
            return Math.max(1000, Math.min(40000, Math.round(s / p.length / 50) * 50));
          },
          fmt: function (v) { return Math.round(v) + ''; }
        }],
        fn: function (p, L) { return L > 0 ? p.a / L : NaN; }
      },
      {
        id: 'lin',
        label: 'f = a − b·L',
        params: [
          { key: 'a', label: 'Начальная частота, Гц', min: 100, max: 2000, step: 10, init: 600,
            fmt: function (v) { return Math.round(v) + A.i18n.t(' Гц'); } },
          { key: 'b', label: 'Спад на сантиметр, Гц', min: 0, max: 60, step: 0.5, init: 6,
            fmt: function (v) { return A.u.num(v, 1) + A.i18n.t(' Гц'); } }
        ],
        fn: function (p, L) { return p.a - p.b * L; }
      }
    ],

    reveal: function (c) {
      var good = c.model.id === 'inv' && c.match >= 60;
      return {
        kicker: A.i18n.t(good ? 'Твои данные поддерживают модель' : 'Что говорит физика'),
        name: A.i18n.t('Закон струны'),
        formula: 'f = (1 / 2L) · √(T / μ)',
        who: A.i18n.t('<b>Марен Мерсенн, 1636 год.</b> Частота струны обратно пропорциональна её длине L и растёт с натяжением T. Задолго до него Аль-Фараби в «Большой книге о музыке» описывал лады как отношения длин струны — например 9/8 и 4/3. Половина струны звучит ровно на октаву выше.'),
        you: good
          ? A.i18n.fmt('Твоя кривая f = a / L описала точки с R² = {r}%. Произведение частоты на длину почти постоянно: около {a} Гц·см. Значит, струна вдвое короче звучит вдвое выше — на октаву.', { r: c.match, a: Math.round(c.params.a) })
          : A.i18n.t('Точки пока не легли на обратную зависимость. Проверь, что длину меряешь от лада до подставки, щипай одинаково и не давай звучать второй струне.')
      };
    },

    verdict: function (c) {
      if (c.match < 60 || c.model.id !== 'inv') {
        return { inconclusive: true, ok: false, text: A.i18n.t('Данные пока не позволяют уверенно проверить гипотезу. Добавь точки на разных ладах и проверь длины линейкой.') };
      }
      if (c.hyp === 'inv') {
        return { ok: true, text: A.i18n.t('Верно: частота обратно пропорциональна длине струны. Вдвое короче — вдвое выше, это и есть октава.') };
      }
      if (c.hyp === 'lin') {
        return { ok: false, text: A.i18n.t('Рост не равномерный: на коротких длинах один сантиметр меняет звук гораздо сильнее, чем на длинных. Поэтому лады у подставки стоят теснее.') };
      }
      return { ok: false, text: A.i18n.t('Сила щипка меняет громкость, а не высоту. Высоту задают длина, натяжение и толщина струны.') };
    },

    next: 'Что будет, если зажать струну ровно посередине?',
    explain: 'Короткая часть струны колеблется быстрее: вдвое короче — вдвое чаще, и звук становится на октаву выше. Поэтому лады на грифе домбры к подставке сходятся всё теснее: каждый следующий шаг по звуку требует всё меньшего шага по длине.',

    variants: ['на второй струне', 'на гитаре или резинке', 'с ослабленной струной'],
    measure: measure
  });
})(window.A);
