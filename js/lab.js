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

  function steps() {
    var row = h('div.steps');
    for (var i = 0; i < STEPS.length; i++) {
      row.appendChild(h('i', { className: i === step ? 'is-on' : (i < step ? 'is-done' : ''), title: STEPS[i] }));
    }
    return row;
  }

  function head() {
    var box = h('div', [
      h('button.back', { type: 'button', onclick: function () { A.app.go('home'); } }, ['← Назад']),
      steps(),
      h('div.steps__name', [A.raw(A.i18n.fmt('Шаг {n} из {m}', { n: step + 1, m: STEPS.length }) + ' · ' + A.i18n.t(STEPS[step]))])
    ]);
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
        }
      }, [op.text]);
      if (hyp === op.id) b.classList.add('is-on');
      b.style.setProperty('--i', i);
      buttons.push(b);
      list.appendChild(b);
    });

    var next = h('button.btn.btn--primary.btn--wide', {
      type: 'button',
      disabled: hyp === null,
      onclick: function () {
        A.store.setHypothesis(cur.id, hyp);
        go(2);
      }
    }, ['Записать гипотезу']);

    return [
      head(),
      h('h2.lab-h', ['Что ты думаешь до опыта?']),
      h('p.lab-q', ['Выбери ответ. Мы его запомним и вернёмся к нему в конце — ошибиться здесь не стыдно, так и работает наука.']),
      list,
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
    return [head(), host];
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
      matchN.textContent = pct < 0 ? '<0%' : pct + '%';
      matchN.style.color = pct >= 90 ? 'var(--green)' : pct >= 70 ? 'var(--amber)' : 'var(--red)';
      matchBar.style.width = Math.max(0, Math.min(100, pct)) + '%';
      matchText.textContent = A.i18n.t(
        pct >= 90 ? 'Отлично легло. Можно принимать.'
          : pct >= 70 ? 'Уже близко. Подвигай ещё.'
          : 'Совпадение слабое. Попробуй другую кривую или обсуди, почему опыт дал такой результат.'
      );
      // An experiment with noisy or contradictory measurements must still
      // reach its conclusion; a high fit is not a condition for learning.
      if (chart) chart.set(points, curve, runs.length ? runs[runs.length - 1].points : null);
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
      }, [A.raw(m.label)]);
      if (m.id === model.id) b.classList.add('is-on');
      models.appendChild(b);
    });

    var sliders = h('div');
    model.params.forEach(function (p) {
      var val = h('span.slider__val');
      var input = h('input', {
        type: 'range',
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
    if (cur.models.length > 1) wrap.appendChild(models);
    wrap.appendChild(sliders);
    wrap.appendChild(h('div.match', [matchN, h('div.match__bar', [matchBar])]));
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

  function viewLaw() {
    var match = A.fit.percent(points, function (x) { return model.fn(params, x); });
    var info = cur.reveal({ points: points, params: params, model: model, match: match });
    var card = h('div.law', [
      h('div.law__kicker', { text: info.kicker || 'Ты открыл' }),
      h('div.law__name', [A.raw(info.name)]),
      info.formula ? h('div.law__f', [A.raw(info.formula)]) : null,
      h('div.law__who', { html: info.who })
    ]);
    if (info.you) card.appendChild(h('div.law__you', { html: info.you }));

    var kids = [head(), card];

    // Объяснение простыми словами: число без смысла ничему не учит.
    if (cur.explain) {
      kids.push(h('div.law-what', [
        h('div.law-what__h', ['Что произошло?']),
        h('div.law-what__d', [A.raw(A.i18n.t(cur.explain))])
      ]));
    }

    if (hyp !== null && cur.verdict) {
      var v = cur.verdict({ hyp: hyp, points: points, params: params, model: model, match: match });
      var chosen = null;
      cur.hypotheses.forEach(function (o) { if (o.id === hyp) chosen = o; });
      kids.push(h('div.verdict' + (v.ok ? '.verdict--hit' : '.verdict--miss'), [
        h('b', { text: v.inconclusive ? 'Нужна повторная проверка' : v.ok ? 'Гипотеза подтвердилась' : 'Гипотеза не подтвердилась' }),
        h('div', { style: { color: 'var(--text-2)', marginBottom: '8px' } },
          [A.raw(A.i18n.t('Твоя гипотеза') + ': « ' + A.i18n.t(chosen ? chosen.text : '') + ' »')]),
        h('div', { html: v.text })
      ]));
      if (!v.ok && !v.inconclusive) kids.push(h('p.note', ['Это и есть наука: гипотеза проверяется опытом, а не наоборот.']));
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

    // «А если попробовать иначе» — тот самый шаг, ради которого опыт
    // перестаёт быть заданием и становится исследованием.
    if (cur.variants && cur.variants.length) {
      var box = h('div.whatif', [
        h('div.whatif__h', ['А если попробовать иначе?']),
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

    kids.push(h('div.btn-row', [
      h('button.btn.btn--primary', { type: 'button', onclick: function () { A.app.go('home'); } }, ['К опытам']),
      h('button.btn', { type: 'button', onclick: function () { points = []; open(cur.id); } }, ['Начать заново'])
    ]));
    return kids;
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
    A.u.clear(view);
    var kids;
    if (step === 0) kids = viewIntro();
    else if (step === 1) kids = viewHyp();
    else if (step === 2) kids = viewMeasure();
    else if (step === 3) kids = viewFit();
    else kids = viewLaw();
    kids.forEach(function (k) { if (k) view.appendChild(k); });
    window.scrollTo(0, 0);
  }

  function languageChanged() {
    // Rebuilding a running measurement would erase its unfinished trials.
    if (step === 2) {
      if (teardown && teardown.translate) teardown.translate();
      var back = document.querySelector('#view button.back');
      if (back) back.textContent = A.i18n.t('← Назад');
      var dots = document.querySelectorAll('#view .steps i');
      for (var i = 0; i < dots.length; i++) dots[i].title = A.i18n.t(STEPS[i]);
      var name = document.querySelector('#view .steps__name');
      if (name) name.textContent = A.i18n.fmt('Шаг {n} из {m}', { n: step + 1, m: STEPS.length }) + ' · ' + A.i18n.t(STEPS[step]);
    } else render();
  }

  A.lab = {
    open: open, render: render, cleanup: cleanup, byId: byId,
    currentId: function () { return cur && cur.id; },
    languageChanged: languageChanged,
    refreshTheme: function () { if (chart) chart.draw(); }
  };
})(window.A);
