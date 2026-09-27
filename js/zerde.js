/* Zerde AI — разбор результата на экране открытия.
   Встроен в сам опыт, а не в отдельный чат: появляется только когда у
   ученика есть свои точки, и отправляет на сервер только их — после нажатия
   кнопки. Опыт от Zerde не зависит: при любой ошибке остаётся обычный разбор. */

window.A = window.A || {};

(function (A) {
  'use strict';

  var h = A.h;
  var COOLDOWN = 4000;
  var TIMEOUT = 25000;
  var FOLLOW = [
    ['diff', 'Почему мой результат отличается от теории?'],
    ['precise', 'Как сделать эксперимент точнее?'],
    ['change', 'Что попробовать изменить?']
  ];
  var SECTIONS = [
    ['discovery', 'Что ты обнаружил?'],
    ['explanation', 'Почему так произошло?'],
    ['dataInsight', 'Что говорят твои данные?'],
    ['nextExperiment', 'Попробуй дальше']
  ];

  function hash(s) {
    var x = 5381;
    for (var i = 0; i < s.length; i++) x = ((x << 5) + x + s.charCodeAt(i)) | 0;
    return (x >>> 0).toString(36);
  }

  function round(v) { return Math.round(v * 1000) / 1000; }

  // Только числа этого опыта: без имени, истории и других опытов.
  function payload(c, question) {
    var params = {};
    Object.keys(c.params || {}).forEach(function (k) { params[k] = round(c.params[k]); });
    return {
      experimentId: c.lab.id,
      language: A.i18n.lang,
      measurements: c.points.map(function (p) {
        var m = { x: round(p.x), y: round(p.y) };
        if (typeof p.heard === 'boolean') m.heard = p.heard;
        return m;
      }),
      fit: { r2: Math.round(c.match) / 100, params: params, model: c.model ? c.model.id : null },
      hypothesis: c.verdict ? { confirmed: !!c.verdict.ok, inconclusive: !!c.verdict.inconclusive } : {},
      previous: c.previous ? c.previous.map(function (p) { return { x: round(p.x), y: round(p.y) }; }) : null,
      question: question || null
    };
  }

  function cacheGet(k) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : null; } catch (e) { return null; } }
  function cacheSet(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }

  function request(body) {
    var ctrl = window.AbortController ? new AbortController() : null;
    var timer = setTimeout(function () { if (ctrl) ctrl.abort(); }, TIMEOUT);
    return fetch('/api/zerde', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: ctrl ? ctrl.signal : undefined
    }).then(function (r) { return r.json(); }).then(function (j) {
      clearTimeout(timer);
      var a = j && j.success && j.analysis;
      if (!a || !a.discovery || !a.explanation || !a.dataInsight || !a.nextExperiment) throw new Error('bad');
      return a;
    }, function (e) { clearTimeout(timer); throw e; });
  }

  function card(c) {
    if (!c.points || !c.points.length) return null;

    var body = h('div.zerde__body');
    var main = h('button.btn.btn--primary', { type: 'button', onclick: function () { run(null); } }, ['Разобрать мой результат']);
    var intro = h('p.zerde__intro', ['Хочешь понять, почему получился именно такой результат? Zerde разберёт твои измерения и предложит, что проверить дальше.']);
    var priv = h('p.zerde__priv', ['Для AI-разбора отправляются только данные этого эксперимента. Имя и аккаунт не требуются.']);
    var box = h('section.zerde', { 'aria-live': 'polite' }, [
      h('div.zerde__head', [
        h('span.zerde__ic', [A.icon('spark')]),
        h('div', [h('b.zerde__name', [A.raw('Zerde AI')]), h('div.zerde__sub', ['Твой STEM-наставник'])])
      ]),
      intro, h('div.zerde__actions', [main]), priv, body
    ]);
    var busy = false;

    function key(q) { return 'zerde.v1.' + hash(JSON.stringify(payload(c, q))); }

    function show(a, q) {
      A.u.clear(body);
      intro.hidden = true;
      main.hidden = true;
      if (q) {
        FOLLOW.forEach(function (f) { if (f[0] === q) body.appendChild(h('div.zerde__q', [f[1]])); });
      }
      SECTIONS.forEach(function (s) {
        body.appendChild(h('div.zerde__sec', [h('b', [s[1]]), h('p', [A.raw(a[s[0]])])]));
      });
      var row = h('div.zerde__follow');
      FOLLOW.forEach(function (f) {
        if (f[0] === q) return;
        row.appendChild(h('button.whatif__b', { type: 'button', onclick: function () { run(f[0]); } }, [f[1]]));
      });
      body.appendChild(row);
      body.appendChild(h('p.zerde__note', ['Zerde опирается на твои измерения, но может ошибаться. Проверяй его выводы опытом.']));
    }

    function fail() {
      A.u.clear(body);
      body.appendChild(h('div.zerde__fail', ['Zerde сейчас недоступен. Твой эксперимент и результаты сохранены — попробуй AI-разбор позже.']));
      main.hidden = false;
      main.disabled = true;
      setTimeout(function () { main.disabled = false; }, COOLDOWN);
    }

    function run(q) {
      if (busy) return;
      var k = key(q);
      var cached = cacheGet(k);
      if (cached) { show(cached, q); return; }
      busy = true;
      main.disabled = true;
      var buttons = box.querySelectorAll('.zerde__follow button');
      for (var i = 0; i < buttons.length; i++) buttons[i].disabled = true;
      A.u.clear(body);
      body.appendChild(h('div.zerde__load', [h('span.zerde__dots', [h('i'), h('i'), h('i')]), h('span', ['Zerde изучает твой эксперимент…'])]));
      request(payload(c, q)).then(function (a) {
        busy = false;
        cacheSet(k, a);
        if (box.isConnected) show(a, q);
      }, function () {
        busy = false;
        if (box.isConnected) fail();
      });
    }

    // Уже полученный разбор для этих же точек показываем сразу, без запроса.
    var ready = cacheGet(key(null));
    if (ready) show(ready, null);
    return box;
  }

  A.zerde = { card: card };
})(window.A);
