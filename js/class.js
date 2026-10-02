/* «Данные класса»: один опыт — общий график всего класса.

   Учитель нажимает «Провести с классом» и получает код и короткую ссылку
   qaltalab.site/c/КОД. Ученик открывает ссылку, проходит опыт как обычно,
   а на экране результата его точки уходят в общий график. Экран класса
   (#/class/КОД) для проектора каждые несколько секунд забирает все серии и
   сам подбирает кривую по точкам всех учеников: закон проявляется из данных
   класса, даже если у каждого по отдельности есть разброс.

   Имён нет: на сервер уходят только код класса, id опыта и числа точек.
   Пример экрана (#/class/demo) работает без сервера на сгенерированных
   данных и везде подписан как пример. */

window.A = window.A || {};

(function (A) {
  'use strict';

  var h = A.h;
  var KEY = 'ql.class';
  var POLL = 4000;
  var CODE = /^[A-HJ-NP-Z2-9]{5}$/;
  var stopBoard = null;

  function linkOf(code) { return location.origin + '/c/' + code; }
  function shortLink(code) { return location.host + '/c/' + code; }

  function call(method, body, query) {
    var opts = { method: method, headers: { 'Content-Type': 'application/json' } };
    if (body) opts.body = JSON.stringify(body);
    return fetch('/api/class' + (query || ''), opts)
      .then(function (r) { return r.json(); })
      .catch(function () { return { success: false, reason: 'network' }; });
  }

  /* ---------- класс, в котором сейчас ученик ---------- */

  function active(labId) {
    var s = null;
    try { s = JSON.parse(sessionStorage.getItem(KEY) || 'null'); } catch (e) {}
    return s && s.code && (!labId || s.lab === labId) ? s : null;
  }
  function leave() { try { sessionStorage.removeItem(KEY); } catch (e) {} }

  // Учитель: новый класс для опыта и сразу экран класса.
  function create(labId, btn) {
    if (btn) btn.disabled = true;
    return call('POST', { action: 'create', lab: labId }).then(function (r) {
      if (btn) btn.disabled = false;
      if (r && r.success) A.app.go('class:' + r.code);
      else toast('Не удалось создать класс. Проверь интернет и попробуй ещё раз.');
    });
  }

  // Ученик: открыл ссылку класса — запоминаем класс и открываем его опыт.
  function join(code) {
    var view = document.getElementById('view');
    A.u.clear(view);
    view.appendChild(h('div.board__wait', [h('span.zerde__dots', [h('i'), h('i'), h('i')]), h('span', ['Подключаемся к классу…'])]));
    call('GET', null, '?code=' + encodeURIComponent(code)).then(function (r) {
      if (r && r.success && A.lab.byId(r.lab)) {
        try { sessionStorage.setItem(KEY, JSON.stringify({ code: code, lab: r.lab })); } catch (e) {}
        A.app.go('lab:' + r.lab);
      } else {
        A.u.clear(view);
        view.appendChild(h('div.board__missing', [
          h('h2.lab-h', ['Класс не найден']),
          h('p.lab-q', [A.raw(A.i18n.fmt('Проверь код {c}: возможно, в нём опечатка или класс уже закрыт. Опыты можно пройти и без класса.', { c: code }))]),
          h('button.btn.btn--primary', { type: 'button', onclick: function () { A.app.go('home'); } }, ['К опытам'])
        ]));
      }
    });
  }

  // Полоска в шапке опыта: ученик видит, что он в классе.
  function bar(labId) {
    var s = active(labId);
    if (!s) return null;
    return h('div.classbar', [
      h('span.classbar__ic', [A.icon('chart')]),
      h('span', [A.raw(A.i18n.fmt('Класс {c}: твои точки попадут на общий график', { c: s.code }))]),
      h('button.linkbtn', { type: 'button', onclick: function (e) { leave(); e.target.closest('.classbar').remove(); } }, ['выйти'])
    ]);
  }

  // Экран результата: отправляем точки один раз на серию и говорим об этом.
  var sent = {}, sending = {};
  function resultCard(lab, points) {
    var s = active(lab.id);
    if (!s || !points.length) return null;
    var key = s.code + ':' + JSON.stringify(points);
    var status = h('span.classres__t');
    var open = h('button.btn', { type: 'button', onclick: function () { A.app.go('class:' + s.code); } }, ['Открыть график класса']);
    var card = h('div.classres', [h('span.classres__ic', [A.icon('chart')]), status, open]);
    var paint = function (state) {
      card.className = 'classres classres--' + state;
      status.textContent = A.i18n.fmt({
        busy: 'Отправляем точки в класс {c}…',
        ok: 'Твои точки добавлены на график класса {c}',
        fail: 'Не удалось отправить точки в класс {c}. Проверь интернет.'
      }[state], { c: s.code });
    };
    if (sent[key] === 'ok') { paint('ok'); return card; }
    paint('busy');
    // Один запрос на серию: перерисовка экрана (смена языка) не шлёт точки повторно.
    if (!sending[key] || sent[key] === 'fail') {
      sending[key] = call('POST', { action: 'add', code: s.code, lab: lab.id, points: points.map(function (p) { return { x: p.x, y: p.y }; }) })
        .then(function (r) { sent[key] = r && r.success ? 'ok' : 'fail'; });
    }
    sending[key].then(function () { paint(sent[key]); });
    return card;
  }

  /* ---------- экран класса ---------- */

  // Пример для презентации и для случая без интернета: 8 «учеников» с
  // разбросом длины (±1,5 см) и тона (±5 %) вокруг закона f = 10 300 / L —
  // так выглядят настоящие школьные измерения, а не идеальная кривая.
  function demoRuns() {
    var seed = 7, rnd = function () { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    var runs = [];
    for (var s = 0; s < 8; s++) {
      var run = [];
      [70, 55, 46, 35, 28, 23].forEach(function (L, i) {
        if (i > 3 + (s % 3)) return;
        var len = Math.round((L + (rnd() - 0.5) * 3) * 2) / 2;
        run.push({ x: len, y: Math.round(10300 / L * (1 + (rnd() - 0.5) * 0.1)) });
      });
      runs.push(run);
    }
    return runs;
  }

  function board(code) {
    if (stopBoard) stopBoard();
    var demo = code === 'demo';
    var view = document.getElementById('view');
    A.u.clear(view);
    var lab = null, chart = null, timer = 0, alive = true;

    var nPeople = h('b.board__n', [A.raw('0')]);
    var nPoints = h('b.board__n', [A.raw('0')]);
    var nR2 = h('b.board__n', [A.raw('—')]);
    var params = h('div.board__params');
    var chartHost = h('div.board__chart');
    var empty = h('div.board__empty', [A.icon('chart'), h('span', ['Пока никто не прислал точки. Как только первый ученик дойдёт до результата, его точки появятся здесь.'])]);
    var state = h('p.board__state');
    var title = h('h1.board__t');
    var question = h('p.board__q');
    var discuss = h('ol.board__qs');
    var openLab = h('button.btn', { type: 'button' }, ['Пройти опыт самому']);
    var sheet = h('button.btn', { type: 'button' }, ['Лист для урока']);

    var copy = h('button.btn.btn--primary', { type: 'button', onclick: function () {
      var url = linkOf(code);
      var ok = function () { toast('Ссылка скопирована'); };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(url).then(ok, function () { window.prompt(A.i18n.t('Скопируй ссылку'), url); });
      else window.prompt(A.i18n.t('Скопируй ссылку'), url);
    } }, ['Скопировать ссылку']);

    var join = demo
      ? h('div.board__join.board__join--demo', [
          h('span.board__kick', ['Пример класса']),
          h('p', ['Это сгенерированные данные восьми учеников — так выглядит экран класса на уроке. Создай свой класс, чтобы собрать настоящие точки.']),
          h('button.btn.btn--primary', { type: 'button', onclick: function (e) { create('dombra', e.target); } }, ['Создать класс'])
        ])
      : h('div.board__join', [
          h('span.board__kick', ['Код класса']),
          h('div.board__code', [A.raw(code)]),
          h('div.board__link', [A.raw(shortLink(code))]),
          h('ol.board__how', [
            h('li', ['Ученики открывают ссылку на своих телефонах']),
            h('li', ['Каждый проходит опыт и доходит до результата']),
            h('li', ['Точки сами появляются на общем графике'])
          ]),
          copy
        ]);

    view.appendChild(h('section.board', [
      h('div.labtop', [
        h('button.back', { type: 'button', onclick: function () { A.app.go('home'); } }, ['← Назад']),
        h('span.board__live', [h('i'), demo ? 'Пример' : 'Данные класса'])
      ]),
      h('div.board__grid', [
        h('div.board__main', [
          title, question,
          h('div.board__stats', [
            h('div', [nPeople, h('span', ['участники'])]),
            h('div', [nPoints, h('span', ['точки на графике'])]),
            h('div', [nR2, h('span', ['R² кривой класса'])])
          ]),
          h('div.board__card', [chartHost, empty, h('div.legend', [
            h('span.legend__pt', ['последний ученик']),
            h('span.legend__ghost', ['остальные ученики']),
            h('span.legend__fit', ['кривая по всем точкам'])
          ]), params]),
          state
        ]),
        h('aside.board__side', [join, h('div.board__disc', [h('b', ['Обсудите с классом']), discuss]), h('div.btn-row', [openLab, sheet])])
      ])
    ]));

    function draw(runs) {
      var all = [];
      runs.forEach(function (r) { r.forEach(function (p) { all.push(p); }); });
      nPeople.textContent = String(runs.length);
      nPoints.textContent = String(all.length);
      empty.hidden = all.length > 0;
      chartHost.hidden = !all.length;
      A.u.clear(params);
      if (!all.length) { nR2.textContent = '—'; return; }
      var model = lab.models[0];
      var fit = all.length >= 2 ? A.fit.best(model, all) : null;
      if (!chart) chart = new A.Chart(chartHost, Object.assign({}, lab.chart || {}, { minH: 260, maxH: 420 }));
      var last = runs[runs.length - 1], before = all.slice(0, all.length - last.length);
      chart.set(last, fit ? function (x) { return model.fn(fit.params, x); } : null, before.length ? before : null);
      var pct = fit ? Math.round(fit.r2 * 100) : null;
      nR2.textContent = pct === null ? '—' : pct < 0 ? A.i18n.t('ниже 0') : pct + '%';
      if (fit) {
        params.appendChild(h('span.board__model', [A.raw(model.label)]));
        model.params.forEach(function (q) {
          params.appendChild(h('span', [A.raw(A.i18n.t(q.label) + ': ' + (q.fmt ? q.fmt(fit.params[q.key]) : A.u.num(fit.params[q.key], 2)))]));
        });
      }
    }

    function tick() {
      if (!alive) return;
      call('GET', null, '?code=' + encodeURIComponent(code)).then(function (r) {
        if (!alive) return;
        if (r && r.success) {
          if (!lab) setLab(r.lab);
          draw(r.runs || []);
          state.textContent = A.i18n.fmt('Обновляется каждые 4 секунды · {t}', { t: new Date().toLocaleTimeString(A.i18n.lang === 'kk' ? 'kk-KZ' : 'ru-RU') });
          state.className = 'board__state';
        } else if (r && r.reason === 'missing') {
          state.textContent = A.i18n.t('Класс не найден. Проверь код.');
          state.className = 'board__state is-bad';
          return;
        } else {
          state.textContent = A.i18n.t('Нет связи с сервером — повторим через несколько секунд.');
          state.className = 'board__state is-bad';
        }
        timer = setTimeout(tick, POLL);
      });
    }

    function setLab(id) {
      lab = A.lab.byId(id);
      if (!lab) return;
      title.textContent = A.i18n.t(lab.title);
      question.textContent = A.i18n.t(lab.question);
      openLab.onclick = function () { A.app.go('lab:' + lab.id); };
      sheet.onclick = function () { A.app.go('lesson:' + lab.id); };
      A.u.clear(discuss);
      var qs = ['Почему точки разных учеников разбросаны вокруг одной кривой?'];
      var L = A.lessons && A.lessons[lab.id];
      if (L) qs = qs.concat(L.q);
      qs.forEach(function (q) { discuss.appendChild(h('li', { text: q })); });
    }

    if (demo) { setLab('dombra'); draw(demoRuns()); state.textContent = A.i18n.t('Сгенерированные данные для примера: так выглядит экран класса на уроке.'); }
    else tick();

    stopBoard = function () { alive = false; if (timer) clearTimeout(timer); if (chart) chart.destroy(); stopBoard = null; };
    window.scrollTo(0, 0);
  }

  function stop() { if (stopBoard) stopBoard(); }

  function toast(text) {
    var old = document.querySelector('.toast');
    if (old) old.remove();
    var t = h('div.toast', { role: 'status' }, [text]);
    document.body.appendChild(t);
    setTimeout(function () { t.classList.add('is-out'); }, 2600);
    setTimeout(function () { t.remove(); }, 3100);
  }

  A.cls = {
    create: create, join: join, board: board, stop: stop, bar: bar, resultCard: resultCard,
    active: active, leave: leave, valid: function (c) { return c === 'demo' || CODE.test(c); }, demoRuns: demoRuns
  };
})(window.A);
