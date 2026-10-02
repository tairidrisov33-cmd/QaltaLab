/* Движок опыта. Все опыты идут по одним и тем же пяти шагам:
   вопрос -> гипотеза -> измерение -> подгонка -> открытие.
   Сам опыт описывает только своё измерение и свои модели, всё остальное
   общее — поэтому новый опыт стоит один файл, а не переписывание экрана. */

window.A = window.A || {};
window.A.labs = window.A.labs || [];

(function (A) {
  'use strict';

  var h = A.h;
  var STEPS = ['Вопрос', 'Гипотеза', 'Опыт', 'График', 'Открытие'];

  var cur = null;     // текущий опыт
  var step = 0;
  var points = [];
  var hyp = null;
  var model = null;   // выбранная модель
  var params = null;  // значения ползунков
  var chart = null;
  var chartTimer = 0;
  var teardown = null;
  var runs = [];        // завершённые серии: {points, params, model, match, label}
  var runLabel = null;  // условие текущей серии («другой рукой» и т.п.)
  var demo = false;     // экран результата по примеру данных, а не по измерениям посетителя
  var pred = null;      // нарисованное до опыта предсказание: [{x, y}] в единицах опыта
  var padEl = null;     // поле для рисования на шаге гипотезы

  // Пример данных для показа результата без датчиков: тот же ряд, что в
  // мини-опыте на главной. Везде подписан как пример, чтобы не выдать его
  // за измерения посетителя.
  var DEMO = {
    pendulum: [{ x: 20, y: 0.93 }, { x: 40, y: 1.22 }, { x: 60, y: 1.59 }, { x: 80, y: 1.74 }, { x: 100, y: 2.04 }]
  };

  // Пример предсказания к примеру данных — самая частая догадка школьника:
  // «вдвое длиннее нить — вдвое дольше качание», то есть прямая линия.
  var DEMO_PRED = {
    pendulum: (function () {
      var out = [];
      for (var L = 5; L <= 100; L += 2.5) out.push({ x: L, y: 0.02 * L });
      return out;
    })()
  };

  function byId(id) {
    for (var i = 0; i < A.labs.length; i++) if (A.labs[i].id === id) return A.labs[i];
    return null;
  }

  function open(id) {
    var lab = byId(id);
    if (!lab) { A.app.go('home'); return; }
    cleanup();
    cur = lab;
    step = 0;
    points = [];
    runs = [];
    runLabel = null;
    hyp = null;
    model = null;
    params = null;
    demo = false;
    pred = null;
    render();
  }

  // Готовый экран результата по примеру данных — для жюри и учителя, когда
  // под рукой нет нитки или датчиков. Гипотезы нет, поэтому нет и её разбора.
  function openDemo(id) {
    var lab = byId(id);
    if (!lab || !DEMO[id]) { open(id); return; }
    cleanup();
    cur = lab;
    points = DEMO[id].slice();
    runs = []; runLabel = null; hyp = null;
    pred = DEMO_PRED[id] || null;
    model = lab.models[0];
    params = {};
    model.params.forEach(function (p) {
      var v = typeof p.init === 'function' ? p.init(points) : p.init;
      params[p.key] = A.u.clamp(v, p.min, p.max);
    });
    demo = true;
    step = 4;
    render();
  }

  function cleanup() {
    if (teardown) { try { teardown(); } catch (e) {} teardown = null; }
    clearChart();
    cur = null;
  }

  function clearChart() {
    if (chartTimer) { clearTimeout(chartTimer); chartTimer = 0; }
    if (chart) { chart.destroy(); chart = null; }
  }

  function go(n) {
    if (n !== 2 && teardown) { try { teardown(); } catch (e) {} teardown = null; }
    step = n;
    render();
  }

  // Прогресс опыта: пройденные шаги с галочкой, текущий — акцентом.
  function steps() {
    var row = h('ol.steps2', { 'aria-label': 'Шаги опыта' });
    for (var i = 0; i < STEPS.length; i++) {
      var li = h('li', { className: i === step ? 'is-on' : (i < step ? 'is-done' : '') }, [
        h('span.steps2__n', [i < step ? A.icon('check') : A.raw(String(i + 1))]),
        h('span.steps2__t', [STEPS[i]])
      ]);
      if (i === step) li.setAttribute('aria-current', 'step');
      row.appendChild(li);
    }
    return row;
  }

  function head() {
    var box = h('div', [
      h('div.labtop', [
        h('button.back', { type: 'button', onclick: function () { A.app.go('home'); } }, ['← Назад']),
        h('button.sharebtn', { type: 'button', onclick: function () { shareLab(cur.id); } }, ['Поделиться опытом'])
      ]),
      steps(),
      h('div.steps__name', [A.raw(A.i18n.fmt('Шаг {n} из {m}', { n: step + 1, m: STEPS.length }) + ' · ' + A.i18n.t(STEPS[step]))])
    ]);
    // Ученик пришёл по ссылке класса — его точки уйдут в общий график.
    if (A.cls && !demo) { var cb = A.cls.bar(cur.id); if (cb) box.appendChild(cb); }
    // Если идёт повтор в других условиях — это должно быть видно всё время,
    // иначе легко забыть, что именно сейчас проверяешь.
    if (runLabel) {
      box.appendChild(h('div.runlabel', [
        h('span.runlabel__t', ['Условие']),
        h('b', [A.raw(A.i18n.t(runLabel))])
      ]));
    }
    return box;
  }

  /* ---------- шаг 1: вопрос ---------- */

  function viewIntro() {
    var kids = [
      head(),
      h('h2.lab-h', { text: cur.title }),
      h('p.lab-q', { text: cur.question })
    ];
    if (cur.intro) kids.push(h('p.lab-q', { text: cur.intro }));

    if (cur.howto && cur.howto.length) {
      var box = h('div.card');
      box.appendChild(h('div.section-title', { text: 'Что делать', style: { margin: '0 0 10px' } }));
      var ol = h('ol', { style: { margin: '0', paddingLeft: '20px', lineHeight: '1.6', color: 'var(--text-2)', fontSize: '14.5px' } });
      cur.howto.forEach(function (s) { ol.appendChild(h('li', { text: s })); });
      box.appendChild(ol);
      kids.push(box);
    }

    if (cur.warn) kids.push(h('p.note', { text: cur.warn }));
    var sheet = h('button.linkbtn.lesson-link', { type: 'button', onclick: function () { A.app.go('lesson:' + cur.id); } }, ['Для учителя: лист для урока']);
    var together = A.cls ? h('button.linkbtn.lesson-link', { type: 'button', onclick: function (e) { A.cls.create(cur.id, e.target); } }, ['Провести с классом: общий график']) : null;
    kids.push(h('p.lesson-link__row', [sheet, together]));

    kids.push(h('div.btn-row', [
      h('button.btn.btn--primary.btn--wide', {
        type: 'button', onclick: function () { go(1); }
      }, ['Дальше'])
    ]));
    return kids;
  }

  /* ---------- шаг 2: гипотеза ---------- */

  function viewHyp() {
    var list = h('div.hyp');
    var buttons = [];
    cur.hypotheses.forEach(function (op, i) {
      var b = h('button', {
        type: 'button',
        onclick: function () {
          hyp = op.id;
          buttons.forEach(function (x) { x.classList.remove('is-on'); });
          b.classList.add('is-on');
          next.disabled = false;
          saved.hidden = false;
        }
      }, [op.text]);
      if (hyp === op.id) b.classList.add('is-on');
      b.style.setProperty('--i', i);
      buttons.push(b);
      list.appendChild(b);
    });

    var saved = h('p.hyp__saved', { role: 'status' }, [A.icon('check'), h('span', ['Гипотеза записана — проверим её опытом'])]);
    saved.hidden = hyp === null;
    var next = h('button.btn.btn--primary.btn--wide', {
      type: 'button',
      disabled: hyp === null,
      onclick: function () {
        A.store.setHypothesis(cur.id, hyp);
        go(2);
      }
    }, ['Записать гипотезу']);

    // Вторая половина гипотезы — рисунок. Не обязателен: выбор ответа уже
    // гипотеза, а рисунок делает её точной и проверяемой на графике.
    padEl = cur.predict && A.predict ? A.predict.pad(cur, pred, function (s) { pred = s; }) : null;

    return [
      head(),
      h('h2.lab-h', ['Что ты думаешь до опыта?']),
      h('p.lab-q', ['Выбери ответ. Мы его запомним и вернёмся к нему в конце — ошибиться здесь не стыдно, так и работает наука.']),
      list,
      saved,
      padEl,
      h('div.btn-row', [next])
    ];
  }

  /* ---------- шаг 3: измерение ---------- */

  function viewMeasure() {
    var host = h('div');
    var api = {
      point: function (x, y) { points.push({ x: x, y: y }); },
      setPoints: function (arr) { points = arr.slice(); },
      get points() { return points; },
      done: function () {
        A.store.setPoints(cur.id, points);
        go(3);
      },
      restart: function () { points = []; go(2); }
    };
    teardown = cur.measure(host, api) || null;
    return [head(), host, under()];
  }

  // «Под капотом»: как телефон превращает действие или сигнал в точку графика.
  // Свёрнуто, чтобы не мешать опыту, но всегда под рукой — для учителя и жюри.
  function under() {
    if (!cur.pipeline || !cur.pipeline.length) return null;
    var ol = h('ol.under__steps');
    cur.pipeline.forEach(function (s, i) { ol.appendChild(stagger(h('li', [h('span', { text: s })]), i)); });
    return h('details.under', [
      h('summary', [A.icon('code'), h('span', ['Под капотом: как телефон это измеряет'])]),
      ol,
      h('p.under__note', ['Всё считается в браузере на устройстве. Без сервера, без установки.'])
    ]);
  }

  function stagger(node, i) { node.style.setProperty('--i', i); return node; }

  // Подпись к графику: что здесь точки, что кривая, что пунктир.
  function legend(fit) {
    return h('div.legend', [
      h('span.legend__pt', [demo ? 'точки примера' : 'твои измерения']),
      fit ? h('span.legend__fit', ['кривая модели']) : null,
      pred ? h('span.legend__pred', [demo ? 'пример предсказания' : 'твоё предсказание']) : null,
      runs.length ? h('span.legend__ghost', ['прошлая серия']) : null
    ]);
  }

  /* ---------- шаг 4: подгонка ---------- */

  function viewFit() {
    var wrap = h('div');
    var chartHost = h('div');
    var matchN = h('div.match__n');
    var matchBar = h('i');
    var matchText = h('div.match__t');

    if (!model) {
      model = cur.models[0];
      params = null;
    }
    if (!params) {
      params = {};
      model.params.forEach(function (p) {
        var initial = (typeof p.init === 'function') ? p.init(points) : p.init;
        params[p.key] = A.u.clamp(initial, p.min, p.max);
      });
    }

    function curve(x) { return model.fn(params, x); }

    function refresh() {
      var pct = A.fit.percent(points, curve);
      // A very poor curve can have a very large negative R². Keep the
      // inconclusive result without making the score look like an error code.
      // Отрицательный R² — кривая хуже простого среднего. Пишем это словами.
      matchN.textContent = pct < 0 ? A.i18n.t('ниже 0') : pct + '%';
      matchN.style.color = pct >= 90 ? 'var(--ok)' : pct >= 70 ? 'var(--warn)' : 'var(--bad)';
      matchBar.style.width = Math.max(0, Math.min(100, pct)) + '%';
      matchText.textContent = A.i18n.t(
        pct >= 90 ? 'Отлично легло. Можно принимать.'
          : pct >= 70 ? 'Уже близко. Подвигай ещё.'
          : 'Зависимость пока выражена слабо. Попробуй другую кривую или сделай больше измерений.'
      );
      // An experiment with noisy or contradictory measurements must still
      // reach its conclusion; a high fit is not a condition for learning.
      if (chart) chart.set(points, curve, runs.length ? runs[runs.length - 1].points : null, pred);
    }

    // выбор формы кривой
    var models = h('div.models');
    cur.models.forEach(function (m) {
      var b = h('button', {
        type: 'button',
        onclick: function () {
          model = m;
          params = null;
          go(3);
        }
      }, [A.raw(A.i18n.t(m.label))]);
      if (m.id === model.id) b.classList.add('is-on');
      models.appendChild(b);
    });

    var sliders = h('div');
    model.params.forEach(function (p) {
      var val = h('span.slider__val');
      var input = h('input', {
        type: 'range', 'aria-label': p.label,
        min: p.min, max: p.max, step: p.step,
        value: params[p.key],
        oninput: function () {
          params[p.key] = parseFloat(input.value);
          val.textContent = p.fmt ? p.fmt(params[p.key]) : A.u.num(params[p.key], 2);
          refresh();
        }
      });
      val.textContent = p.fmt ? p.fmt(params[p.key]) : A.u.num(params[p.key], 2);
      sliders.appendChild(h('div.slider', [
        h('div.slider__top', [h('span', { text: p.label }), val]),
        input
      ]));
    });

    var accept = h('button.btn.btn--primary.btn--wide', {
      type: 'button',
      onclick: function () {
        A.store.finish(cur.id, { params: params, match: A.fit.percent(points, curve), model: model.id });
        go(4);
      }
    }, ['Разобрать результат']);

    wrap.appendChild(h('h2.lab-h', ['Подбери кривую']));
    wrap.appendChild(h('p.lab-q', ['Двигай ползунок, пока линия не ляжет на твои точки.']));
    wrap.appendChild(chartHost);
    wrap.appendChild(legend(true));
    if (cur.models.length > 1) wrap.appendChild(models);
    wrap.appendChild(sliders);
    wrap.appendChild(h('div.match', [matchN, h('div.match__bar', [matchBar])]));
    wrap.appendChild(h('p.r2-help', ['R² показывает, насколько модель соответствует твоим измерениям: 100% — кривая проходит через все точки, около нуля и ниже — не описывает их.']));
    wrap.appendChild(matchText);
    wrap.appendChild(h('div.btn-row', [
      accept,
      // Сбросить — вернуть ползунки к началу, не теряя измерений;
      // Заново — перемерить точки.
      h('button.btn', { type: 'button', onclick: function () { params = null; go(3); } }, ['Сбросить']),
      h('button.btn', { type: 'button', onclick: function () { points = []; go(2); } }, ['Перемерить'])
    ]));

    // график создаём после вставки в DOM — ему нужна ширина
    chartTimer = setTimeout(function () {
      chartTimer = 0;
      if (step !== 3 || !chartHost.isConnected) return;
      chart = new A.Chart(chartHost, cur.chart || {});
      refresh();
    }, 0);

    return [head(), wrap];
  }

  /* ---------- шаг 5: открытие ---------- */

  // Порядок экрана — как у открытия: сначала твой результат, потом почему
  // так вышло, потом имя закона, и в конце — новый вопрос.
  function viewLaw() {
    var match = A.fit.percent(points, function (x) { return model.fn(params, x); });
    var info = cur.reveal({ points: points, params: params, model: model, match: match });
    var kids = [head()];
    var v = null;
    if (demo) {
      kids.push(h('div.demo-note', { role: 'note' }, [
        h('b', ['Пример данных']),
        h('span', ['Это не твои измерения: так выглядит результат опыта с маятником. Пройди опыт сам — и график построится по твоим точкам.']),
        h('button.btn.btn--primary', { type: 'button', onclick: function () { A.app.go('lab:' + cur.id); } }, ['Пройти опыт самому'])
      ]));
    }

    kids.push(h('h2.lab-h', [demo ? 'Что показывает пример?' : 'Что ты обнаружил?']));
    var found = h('div.found');
    if (demo) {
      found.appendChild(h('div.found__you', [A.i18n.fmt('В примере точкам соответствует модель с R² = {r}%. Это демонстрационные числа: проведи опыт, чтобы получить собственный график и вывод.', { r: match })]));
    } else if (info.you) found.appendChild(h('div.found__you', { html: info.you }));

    if (hyp !== null && cur.verdict) {
      v = cur.verdict({ hyp: hyp, points: points, params: params, model: model, match: match });
      var chosen = null;
      cur.hypotheses.forEach(function (o) { if (o.id === hyp) chosen = o; });
      found.appendChild(h('div.verdict' + (v.ok ? '.verdict--hit' : '.verdict--miss'), [
        h('b', { text: v.inconclusive ? 'Нужна повторная проверка' : v.ok ? 'Гипотеза подтвердилась' : 'Гипотеза не подтвердилась' }),
        h('div', { style: { color: 'var(--text-2)', marginBottom: '8px' } },
          [A.raw(A.i18n.t('Твоя гипотеза') + ': « ' + A.i18n.t(chosen ? chosen.text : '') + ' »')]),
        h('div', { html: v.text })
      ]));
      if (!v.ok && !v.inconclusive) found.appendChild(h('p.note', ['Это и есть наука: гипотеза проверяется опытом, а не наоборот.']));
    }
    kids.push(found);

    // В классе — точки этой серии уходят в общий график, ученик это видит.
    if (A.cls && !demo) kids.push(A.cls.resultCard(cur, points));

    // Что показывают данные: те же точки и выбранная кривая, что на шаге 4.
    var lawChart = h('div');
    kids.push(h('div.law-data', [h('h3.law-data__h', ['Что показывают данные?']), lawChart, legend(true),
      h('p.law-data__n', [A.raw(A.i18n.t(demo ? 'Пример данных' : 'Твои данные') + ' · ' + (match < 0 ? A.i18n.t('R² ниже нуля: кривая пока не описывает точки') : 'R² = ' + match + '%'))])]));
    chartTimer = setTimeout(function () {
      chartTimer = 0;
      if (step !== 4 || !lawChart.isConnected) return;
      chart = new A.Chart(lawChart, cur.chart || {});
      chart.set(points, function (x) { return model.fn(params, x); }, runs.length ? runs[runs.length - 1].points : null, pred);
    }, 0);

    // Предсказание против реальности: сколько и где разошёлся рисунок с точками.
    if (pred && cur.predict && A.predict) {
      var pvr = A.predict.card(cur, pred, points, demo);
      if (pvr) kids.push(pvr);
    }

    kids.push(under());

    if (cur.explain) {
      kids.push(h('div.law-what', [
        h('div.law-what__h', ['Почему так произошло?']),
        h('div.law-what__d', [A.raw(A.i18n.t(cur.explain))])
      ]));
    }

    kids.push(h('div.law', [
      h('div.law__kicker', { text: demo ? 'Закон, который стоит за примером' : (info.kicker || 'Ты открыл') }),
      h('div.law__name', [A.raw(info.name)]),
      info.formula ? h('div.law__f', [A.raw(A.i18n.t(info.formula))]) : null,
      h('div.law__who', { html: info.who })
    ]));

    // Zerde AI — только поверх настоящих точек ученика и только по кнопке.
    if (A.zerde && !demo) {
      kids.push(A.zerde.card({
        lab: cur, points: points, params: params, model: model, match: match, verdict: v, pred: pred,
        previous: runs.length ? runs[runs.length - 1].points : null
      }));
    }

    // Сравнение с предыдущей серией: ради этого и затевается «а если иначе».
    if (runs.length) {
      var prev = runs[runs.length - 1];
      var avg = function (arr) {
        var s = 0; arr.forEach(function (p) { s += p.y; }); return arr.length ? s / arr.length : 0;
      };
      var now = avg(points), was = avg(prev.points);
      var diff = was ? Math.round((now - was) / was * 100) : 0;
      kids.push(h('div.compare', [
        h('div.compare__h', ['Сравнение условий']),
        h('div.compare__row', [
          h('span', [A.raw(A.i18n.t(prev.label || 'Первая серия'))]),
          h('b', [A.raw(A.u.num(was, 0))])
        ]),
        h('div.compare__row.compare__row--now', [
          h('span', [A.raw(A.i18n.t(runLabel || 'Вторая серия'))]),
          h('b', [A.raw(A.u.num(now, 0))])
        ]),
        h('div.compare__d', [A.raw(
          diff === 0
            ? A.i18n.t('Среднее значение не изменилось.')
            : A.i18n.fmt(diff > 0 ? 'В новых условиях в среднем на {d}% больше.' : 'В новых условиях в среднем на {d}% меньше.', { d: Math.abs(diff) })
        )]),
        h('div.compare__d', ['Бледные кружки на графике — прошлая серия. Разница в условиях видна прямо на точках.'])
      ]));
    }

    // Новый вопрос замыкает цикл: гипотеза → измерение → вывод → вопрос.
    if (cur.variants && cur.variants.length) {
      var box = h('div.whatif', [
        h('div.whatif__h', ['Попробуй изменить…']),
        cur.next ? h('p.whatif__q', [cur.next]) : null,
        h('p.whatif__d', ['Повтори опыт в других условиях. Новые точки лягут поверх старых, и разницу будет видно сразу — а если её нет, это тоже открытие.'])
      ]);
      var row = h('div.whatif__row');
      cur.variants.forEach(function (v, i) {
        var b = h('button.whatif__b', {
          type: 'button', onclick: function () { startVariant(v); }
        }, [v]);
        b.style.setProperty('--i', i);
        row.appendChild(b);
      });
      box.appendChild(row);
      kids.push(box);
    }

    var saveBtn = h('button.btn.btn--primary', { type: 'button', onclick: function () { saveResult(info, match, false); } }, ['Сохранить результат']);
    saveBtn.appendChild(A.icon('arrow')).classList.add('ico');
    var shareRes = h('button.btn', { type: 'button', onclick: function () { saveResult(info, match, true); } }, ['Поделиться']);
    var table = h('button.btn', { type: 'button', onclick: function () { exportCsv(); } }, ['Скачать данные (CSV)']);
    kids.push(h('div.btn-row.btn-row--save', [saveBtn, shareRes, table]));

    kids.push(h('div.btn-row', [
      h('button.btn', { type: 'button', onclick: function () { A.app.go('home'); } }, ['К опытам']),
      h('button.btn', { type: 'button', onclick: function () { points = []; open(cur.id); } }, ['Попробовать ещё раз'])
    ]));
    return kids;
  }

  /* ---------- карточка результата ---------- */

  function plain(html) {
    var d = document.createElement('div');
    d.innerHTML = html || '';
    return d.textContent;
  }

  function wrap(c, text, x, y, maxW, lh, maxLines) {
    var words = text.split(/\s+/), line = '', n = 0;
    for (var i = 0; i < words.length; i++) {
      var test = line ? line + ' ' + words[i] : words[i];
      if (c.measureText(test).width > maxW && line) {
        c.fillText(line, x, y); y += lh; line = words[i];
        if (++n >= maxLines - 1) { line = words.slice(i).join(' '); break; }
      } else line = test;
    }
    if (line) {
      while (c.measureText(line + '…').width > maxW && line.length > 3 && n >= maxLines - 1) line = line.slice(0, -2);
      c.fillText(n >= maxLines - 1 && i < words.length ? line + '…' : line, x, y);
    }
    return y + lh;
  }

  // Картинка без сервера и библиотек: рисуем на canvas, график берём из того
  // же движка, что и в опыте. Её можно сохранить или отправить учителю.
  function saveResult(info, match, share) {
    var W = 1080, H = 1350, P = 72;
    var cv = document.createElement('canvas');
    cv.width = W; cv.height = H;
    var c = cv.getContext('2d');
    var accent = '#426D4F';
    var font = 'Manrope, system-ui, sans-serif';

    c.fillStyle = '#FBFAF4'; c.fillRect(0, 0, W, H);
    c.fillStyle = accent; c.fillRect(0, 0, W, 14);

    c.fillStyle = accent;
    c.font = '800 34px ' + font;
    c.fillText('QaltaLab', P, 104);
    c.fillStyle = '#6B7A70';
    c.font = '500 26px ' + font;
    c.textAlign = 'right';
    c.fillText(new Date().toLocaleDateString(A.i18n.lang === 'kk' ? 'kk-KZ' : 'ru-RU'), W - P, 104);
    c.textAlign = 'left';

    c.fillStyle = '#182B24';
    c.font = '800 58px ' + font;
    var y = wrap(c, A.i18n.t(cur.title), P, 210, W - 2 * P, 66, 2);
    c.fillStyle = '#506158';
    c.font = '500 28px ' + font;
    y = wrap(c, A.i18n.t(cur.question), P, y + 4, W - 2 * P, 38, 3);

    // график — тем же кодом, что и в опыте, но в светлых цветах карточки
    var host = document.createElement('div');
    host.style.cssText = 'position:fixed;left:-9999px;top:0;width:936px';
    document.body.appendChild(host);
    var saved = document.documentElement.getAttribute('data-theme');
    document.documentElement.setAttribute('data-theme', 'light');
    var ch = new A.Chart(host, Object.assign({}, cur.chart || {}, { minH: 460, maxH: 460 }));
    ch.set(points, function (x) { return model.fn(params, x); }, runs.length ? runs[runs.length - 1].points : null, pred);
    c.fillStyle = '#FFFFFF';
    c.fillRect(P - 12, y + 10, W - 2 * P + 24, 500);
    c.drawImage(ch.canvas, P, y + 30, W - 2 * P, 460);
    ch.destroy();
    document.body.removeChild(host);
    document.documentElement.setAttribute('data-theme', saved || 'light');
    y += 560;

    c.fillStyle = accent;
    c.font = '700 30px ' + font;
    c.fillText(plain(info.name) + (info.formula ? '   ' + plain(A.i18n.t(info.formula)) : ''), P, y);
    c.fillStyle = '#182B24';
    c.font = '500 27px ' + font;
    y = wrap(c, plain(info.you), P, y + 50, W - 2 * P, 38, 5);

    c.fillStyle = '#6B7A70';
    c.font = '500 24px ' + font;
    c.fillText((match < 0 ? A.i18n.t('R² ниже нуля') : 'R² = ' + match + '%') + '   ·   qaltalab.site/#/lab/' + cur.id, P, H - 60);

    var name = 'qaltalab-' + cur.id + '.png';
    cv.toBlob(function (blob) {
      if (!blob) return;
      var file = null;
      try { file = new File([blob], name, { type: 'image/png' }); } catch (e) {}
      if (share && file && navigator.canShare && navigator.canShare({ files: [file] })) {
        navigator.share({ files: [file], title: 'QaltaLab — ' + A.i18n.t(cur.title) }).catch(function () {});
        return;
      }
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = name;
      document.body.appendChild(a);
      a.click();
      setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
      toast(share ? 'Картинка сохранена — её можно отправить учителю' : 'Результат сохранён');
    }, 'image/png');
  }

  // Свои данные — в таблицу: измерения, значение кривой и отклонение от неё.
  // Открывается в Excel или Google Таблицах, можно сдать учителю.
  function exportCsv() {
    var L = A.lessons && A.lessons[cur.id];
    var cols = L ? L.cols : ['x', 'y'];
    var rows = points.map(function (p, i) {
      var m = model.fn(params, p.x);
      return [i + 1, p.x, p.y, isFinite(m) ? m : '', isFinite(m) ? p.y - m : ''];
    });
    A.u.csv('qaltalab-' + cur.id + '.csv',
      ['№', A.i18n.t(cols[0]), A.i18n.t(cols[1]), A.i18n.t('Кривая') + ' ' + model.label.replace(/<[^>]+>/g, ''), A.i18n.t('Отклонение')], rows);
  }

  /* ---------- ссылка на опыт ---------- */

  function linkTo(id) { return location.origin + location.pathname + '#/lab/' + id; }

  function toast(text) {
    var old = document.querySelector('.toast');
    if (old) old.remove();
    var t = h('div.toast', { role: 'status' }, [A.raw('✓ '), text]);
    document.body.appendChild(t);
    setTimeout(function () { t.classList.add('is-out'); }, 2200);
    setTimeout(function () { t.remove(); }, 2700);
  }

  function copyLink(id) {
    var url = linkTo(id);
    var done = function () { toast('Ссылка скопирована'); };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(done, function () { window.prompt(A.i18n.t('Скопируй ссылку'), url); });
    } else window.prompt(A.i18n.t('Скопируй ссылку'), url);
  }

  function shareLab(id) {
    var lab = byId(id);
    if (navigator.share) {
      navigator.share({ title: 'QaltaLab — ' + A.i18n.t(lab.title), text: A.i18n.t(lab.question), url: linkTo(id) })
        .catch(function () {});
    } else copyLink(id);
  }

  // Откладываем законченную серию и начинаем новую в других условиях.
  function startVariant(label) {
    runs.push({
      points: points.slice(),
      params: params,
      model: model,
      label: runLabel
    });
    runLabel = label;
    points = [];
    model = null;
    params = null;
    go(2);
  }

  /* ---------- сборка ---------- */

  function render() {
    var view = document.getElementById('view');
    clearChart();
    if (padEl && padEl.destroy) padEl.destroy();
    padEl = null;
    A.u.clear(view);
    var kids;
    if (step === 0) kids = viewIntro();
    else if (step === 1) kids = viewHyp();
    else if (step === 2) kids = viewMeasure();
    else if (step === 3) kids = viewFit();
    else kids = viewLaw();
    kids.forEach(function (k) { if (k) view.appendChild(k); });
    if (A.zchat) A.zchat.refresh();
    window.scrollTo(0, 0);
  }

  function languageChanged() {
    // Rebuilding a running measurement would erase its unfinished trials.
    if (step === 2) {
      A.i18n.retranslate(document.getElementById('view'));
      if (teardown && teardown.translate) teardown.translate();
      var back = document.querySelector('#view button.back');
      if (back) back.textContent = A.i18n.t('← Назад');
      
      var name = document.querySelector('#view .steps__name');
      if (name) name.textContent = A.i18n.fmt('Шаг {n} из {m}', { n: step + 1, m: STEPS.length }) + ' · ' + A.i18n.t(STEPS[step]);
    } else render();
  }

  A.lab = {
    open: open, render: render, cleanup: cleanup, byId: byId,
    currentId: function () { return cur && cur.id; },
    languageChanged: languageChanged,
    copyLink: copyLink, shareLab: shareLab, linkTo: linkTo, openDemo: openDemo,
    // Для Zerde-чата: какой опыт открыт, на каком шаге и какие есть точки.
    context: function () {
      if (!cur) return null;
      var m = null;
      if (model && params && points.length) m = A.fit.percent(points, function (x) { return model.fn(params, x); });
      return { id: cur.id, step: step, points: points.slice(), params: params || {}, match: step >= 3 ? m : null, demo: demo };
    },
    refreshTheme: function () { if (chart) chart.draw(); }
  };
})(window.A);
