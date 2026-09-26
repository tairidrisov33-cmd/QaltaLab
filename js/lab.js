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
  var teardown = null;

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
    hyp = null;
    model = null;
    params = null;
    render();
  }

  function cleanup() {
    if (teardown) { try { teardown(); } catch (e) {} teardown = null; }
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
    return h('div', [
      h('button.back', { type: 'button', onclick: function () { A.app.go('home'); } }, ['← Назад']),
      steps()
    ]);
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
    cur.hypotheses.forEach(function (op) {
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
        params[p.key] = (typeof p.init === 'function') ? p.init(points) : p.init;
      });
    }

    function curve(x) { return model.fn(params, x); }

    function refresh() {
      var pct = A.fit.percent(points, curve);
      matchN.textContent = pct + '%';
      matchN.style.color = pct >= 90 ? 'var(--green)' : pct >= 70 ? 'var(--amber)' : 'var(--red)';
      matchBar.style.width = pct + '%';
      matchText.textContent = A.i18n.t(
        pct >= 90 ? 'Отлично легло. Можно принимать.'
          : pct >= 70 ? 'Уже близко. Подвигай ещё.'
            : 'Пока мимо. Попробуй другую форму кривой.'
      );
      accept.disabled = pct < 60;
      if (chart) chart.set(points, curve);
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
    }, ['Принять']);

    wrap.appendChild(h('h2.lab-h', ['Подбери кривую']));
    wrap.appendChild(h('p.lab-q', ['Двигай ползунок, пока линия не ляжет на твои точки.']));
    wrap.appendChild(chartHost);
    if (cur.models.length > 1) wrap.appendChild(models);
    wrap.appendChild(sliders);
    wrap.appendChild(h('div.match', [matchN, h('div.match__bar', [matchBar])]));
    wrap.appendChild(matchText);
    wrap.appendChild(h('div.btn-row', [
      accept,
      h('button.btn', { type: 'button', onclick: function () { points = []; go(2); } }, ['Заново'])
    ]));

    // график создаём после вставки в DOM — ему нужна ширина
    setTimeout(function () {
      chart = new A.Chart(chartHost, cur.chart || {});
      refresh();
    }, 0);

    return [head(), wrap];
  }

  /* ---------- шаг 5: открытие ---------- */

  function viewLaw() {
    var info = cur.reveal({ points: points, params: params, model: model });
    var card = h('div.law', [
      h('div.law__kicker', { text: info.kicker || 'Ты открыл' }),
      h('div.law__name', [A.raw(info.name)]),
      info.formula ? h('div.law__f', [A.raw(info.formula)]) : null,
      h('div.law__who', { html: info.who })
    ]);
    if (info.you) card.appendChild(h('div.law__you', { html: info.you }));

    var kids = [head(), card];

    if (hyp !== null && cur.verdict) {
      var v = cur.verdict({ hyp: hyp, points: points, params: params });
      var chosen = null;
      cur.hypotheses.forEach(function (o) { if (o.id === hyp) chosen = o; });
      kids.push(h('div.verdict' + (v.ok ? '.verdict--hit' : '.verdict--miss'), [
        h('b', { text: v.ok ? 'Ты угадал' : 'Гипотеза не подтвердилась' }),
        h('div', { style: { color: 'var(--text-2)', marginBottom: '8px' } },
          [A.raw(A.i18n.t('Твоя гипотеза') + ': « ' + A.i18n.t(chosen ? chosen.text : '') + ' »')]),
        h('div', { html: v.text })
      ]));
      if (!v.ok) kids.push(h('p.note', ['Это и есть наука: гипотеза проверяется опытом, а не наоборот.']));
    }

    kids.push(h('div.btn-row', [
      h('button.btn.btn--primary', { type: 'button', onclick: function () { A.app.go('home'); } }, ['К опытам']),
      h('button.btn', { type: 'button', onclick: function () { points = []; open(cur.id); } }, ['Заново'])
    ]));
    return kids;
  }

  /* ---------- сборка ---------- */

  function render() {
    var view = document.getElementById('view');
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

  A.lab = { open: open, render: render, cleanup: cleanup, byId: byId };
})(window.A);
