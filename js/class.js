/* «Данные класса»: один опыт — общий график всего класса.

   Учитель нажимает «Провести с классом» и получает код, короткую ссылку
   qaltalab.site/c/КОД и QR-код. Ученик открывает ссылку, проходит опыт как
   обычно, а на экране результата его точки уходят в общий график. Экран
   класса (#/class/КОД) для проектора каждые несколько секунд забирает все
   серии и сам подбирает кривую по точкам всех учеников: закон проявляется
   из данных класса, даже если у каждого по отдельности есть разброс.
   Точки, далёкие от общей кривой, выделяются — повод обсудить ошибки.

   Имён нет: на сервер уходят только код класса, id опыта и числа точек.
   Если связь моргнула, серия ждёт в очереди и уходит при следующей
   возможности. Пример экрана (#/class/demo) работает без сервера на
   сгенерированных данных и везде подписан как пример. */

window.A = window.A || {};

(function (A) {
  'use strict';

  var h = A.h;
  var KEY = 'ql.class';
  var QUEUE = 'ql.class.queue';
  var MINE = 'ql.class.mine';
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

  function load(k, def) { try { var v = JSON.parse(localStorage.getItem(k) || 'null'); return v === null ? def : v; } catch (e) { return def; } }
  function save(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }

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
      if (r && r.success) {
        // «Мои классы»: учитель вернётся к графику на следующем уроке.
        var mine = load(MINE, []).filter(function (c) { return c.code !== r.code; });
        mine.unshift({ code: r.code, lab: labId, at: Date.now() });
        save(MINE, mine.slice(0, 12));
        A.app.go('class:' + r.code);
      }
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

  /* ---------- отправка серии: один раз, с очередью на случай без связи ---------- */

  var sent = {}, sending = {};
  function keyOf(item) { return item.code + ':' + JSON.stringify(item.points); }

  function push(item) {
    var key = keyOf(item);
    if (sent[key] === 'ok') return Promise.resolve('ok');
    if (sending[key] && sent[key] !== 'fail') return sending[key];
    sending[key] = call('POST', { action: 'add', code: item.code, lab: item.lab, points: item.points }).then(function (r) {
      // «Нет класса» или «класс заполнен» — повторять бессмысленно; сбой сети — в очередь.
      sent[key] = r && r.success ? 'ok' : (r && (r.reason === 'missing' || r.reason === 'full' || r.reason === 'data')) ? 'lost' : 'fail';
      var q = load(QUEUE, []).filter(function (it) { return keyOf(it) !== key; });
      if (sent[key] === 'fail') q.push(item);
      save(QUEUE, q.slice(-10));
      return sent[key];
    });
    return sending[key];
  }

  // Серии, которые не ушли из-за связи, пробуем снова при загрузке и при появлении сети.
  function flush() { load(QUEUE, []).forEach(function (it) { push(it); }); }
  window.addEventListener('online', flush);
  setTimeout(flush, 1500);

  // Экран результата: точки этой серии уходят в класс, ученик видит статус.
  function resultCard(lab, points) {
    var s = active(lab.id);
    if (!s || !points.length) return null;
    var item = { code: s.code, lab: lab.id, points: points.map(function (p) { return { x: p.x, y: p.y }; }) };
    var status = h('span.classres__t');
    var retry = h('button.btn', { type: 'button', onclick: function () { paint('busy'); push(item).then(paint); } }, ['Отправить ещё раз']);
    var open = h('button.btn', { type: 'button', onclick: function () { A.app.go('class:' + s.code); } }, ['Открыть график класса']);
    var card = h('div.classres', [h('span.classres__ic', [A.icon('chart')]), status, retry, open]);
    function paint(state) {
      card.className = 'classres classres--' + state;
      retry.hidden = state !== 'fail';
      status.textContent = A.i18n.fmt({
        busy: 'Отправляем точки в класс {c}…',
        ok: 'Твои точки добавлены на график класса {c}',
        fail: 'Связь прервалась — точки сохранены и уйдут в класс {c}, как только появится интернет.',
        lost: 'Класс {c} закрыт или заполнен — точки не добавлены. Попроси у учителя новый код.'
      }[state], { c: s.code });
    }
    paint(sent[keyOf(item)] || 'busy');
    if (sent[keyOf(item)] !== 'ok') push(item).then(paint);
    return card;
  }

  /* ---------- экран класса ---------- */

  // Пример для презентации и для случая без интернета: 8 «учеников» с
  // разбросом длины (±1,5 см) и тона (±5 %) вокруг закона f = 10 300 / L —
  // так выглядят настоящие школьные измерения, а не идеальная кривая.
  // У одного ученика одна точка с ошибкой (зажал не тот лад) — её и
  // подсветит поиск выбросов.
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
    runs[5][1] = { x: 55, y: 262 };
    return runs;
  }

  // Выбросы: точки, у которых отклонение от общей кривой больше трёх
  // «устойчивых сигм» (медиана абсолютных отклонений · 1,4826). Медиана,
  // а не среднее — чтобы сами выбросы не раздували порог.
  function outliers(all, f) {
    if (all.length < 8) return [];
    var res = all.map(function (p) { return p.y - f(p.x); });
    var med = A.u.median(res);
    var mad = A.u.median(res.map(function (r) { return Math.abs(r - med); })) * 1.4826;
    if (!mad) return [];
    // И ещё дальше 20 % от кривой: разница между людьми (у кого-то часы
    // спешат) — это не ошибка, а то, что опыт и изучает.
    return all.filter(function (p, i) { var e = f(p.x); return Math.abs(res[i] - med) > 3 * mad && isFinite(e) && Math.abs(res[i]) > Math.abs(e) * 0.2; });
  }

  // Режим проектора: всё крупно, без шапки и плавающих кнопок, на весь экран.
  function projector(on) {
    document.documentElement.classList.toggle('is-projector', on);
    try {
      if (on && document.documentElement.requestFullscreen && !document.fullscreenElement) document.documentElement.requestFullscreen().catch(function () {});
      if (!on && document.fullscreenElement && document.exitFullscreen) document.exitFullscreen().catch(function () {});
    } catch (e) {}
  }

  function board(code) {
    if (stopBoard) stopBoard();
    var demo = code === 'demo';
    var view = document.getElementById('view');
    A.u.clear(view);
    var lab = null, chart = null, timer = 0, alive = true, lastRuns = [];

    var nPeople = h('b.board__n', [A.raw('0')]);
    var nPoints = h('b.board__n', [A.raw('0')]);
    var lPeople = h('span', ['участников']), lPoints = h('span', ['точек на графике']);
    // Подпись согласуется с числом: 1 участник, 3 участника, 8 участников.
    var plural = function (n, forms) {
      var m10 = n % 10, m100 = n % 100;
      return A.i18n.t(m10 === 1 && m100 !== 11 ? forms[0] : m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14) ? forms[1] : forms[2]);
    };
    var nR2 = h('b.board__n', [A.raw('—')]);
    var params = h('div.board__params');
    var odd = h('p.board__odd');
    var chartHost = h('div.board__chart');
    var empty = h('div.board__empty', [A.icon('chart'), h('span', ['Пока никто не прислал точки. Как только первый ученик дойдёт до результата, его точки появятся здесь.'])]);
    var state = h('p.board__state');
    var title = h('h1.board__t');
    var question = h('p.board__q');
    var discuss = h('ol.board__qs');
    var openLab = h('button.btn', { type: 'button' }, ['Пройти опыт самому']);
    var sheet = h('button.btn', { type: 'button' }, ['Лист для урока']);
    var download = h('button.btn', { type: 'button', onclick: exportCsv }, ['Скачать данные (CSV)']);
    var proj = h('button.btn.board__proj', { type: 'button', onclick: function () { projector(!document.documentElement.classList.contains('is-projector')); paintProj(); } });
    function paintProj() {
      var on = document.documentElement.classList.contains('is-projector');
      A.u.clear(proj);
      proj.appendChild(document.createTextNode(A.i18n.t(on ? 'Выйти из режима проектора' : 'Режим проектора')));
      // На проекторе график выше — его смотрят с последней парты.
      if (chart) { chart.opts.maxH = on ? 620 : 420; chart.opts.minH = on ? 380 : 260; setTimeout(function () { if (chart) chart.resize(); }, 200); }
    }
    paintProj();

    var copy = h('button.btn.btn--primary', { type: 'button', onclick: function () {
      var url = linkOf(code);
      var ok = function () { toast('Ссылка скопирована'); };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(url).then(ok, function () { window.prompt(A.i18n.t('Скопируй ссылку'), url); });
      else window.prompt(A.i18n.t('Скопируй ссылку'), url);
    } }, ['Скопировать ссылку']);

    var qr = null;
    if (!demo && A.qr) { try { qr = h('div.board__qr', [A.qr.svg(linkOf(code), A.i18n.t('QR-код ссылки класса'))]); } catch (e) {} }

    var join = demo
      ? h('div.board__join.board__join--demo', [
          h('span.board__kick', ['Пример класса']),
          h('p', ['Это сгенерированные данные восьми учеников — так выглядит экран класса на уроке. Создай свой класс, чтобы собрать настоящие точки.']),
          h('button.btn.btn--primary', { type: 'button', onclick: function (e) { create('dombra', e.currentTarget); } }, ['Создать класс'])
        ])
      : h('div.board__join', [
          h('div.board__joinrow', [
            qr,
            h('div', [
              h('span.board__kick', ['Код класса']),
              h('div.board__code', [A.raw(code)]),
              h('div.board__link', [A.raw(shortLink(code))])
            ])
          ]),
          h('ol.board__how', [
            h('li', ['Наведите камеру телефона на QR-код или откройте ссылку']),
            h('li', ['Каждый проходит опыт и доходит до результата']),
            h('li', ['Точки сами появляются на общем графике'])
          ]),
          copy
        ]);

    view.appendChild(h('section.board', [
      h('div.labtop', [
        h('button.back', { type: 'button', onclick: function () { projector(false); A.app.go('home'); } }, ['← Назад']),
        h('div.board__top', [h('span.board__live', [h('i'), demo ? 'Пример' : 'Данные класса']), proj])
      ]),
      h('div.board__grid', [
        h('div.board__main', [
          title, question,
          h('div.board__stats', [
            h('div', [nPeople, lPeople]),
            h('div', [nPoints, lPoints]),
            h('div', [nR2, h('span', ['R² кривой класса'])])
          ]),
          h('div.board__card', [chartHost, empty, h('div.legend', [
            h('span.legend__pt', ['последний ученик']),
            h('span.legend__ghost', ['остальные ученики']),
            h('span.legend__fit', ['кривая по всем точкам']),
            h('span.legend__odd', ['далеко от кривой'])
          ]), params, odd]),
          state
        ]),
        h('aside.board__side', [join, h('div.board__disc', [h('b', ['Обсудите с классом']), discuss]), h('div.btn-row', [download, openLab, sheet])])
      ])
    ]));

    function draw(runs) {
      lastRuns = runs;
      var all = [];
      runs.forEach(function (r) { r.forEach(function (p) { all.push(p); }); });
      nPeople.textContent = String(runs.length);
      nPoints.textContent = String(all.length);
      lPeople.textContent = plural(runs.length, ['участник', 'участника', 'участников']);
      lPoints.textContent = plural(all.length, ['точка на графике', 'точки на графике', 'точек на графике']);
      empty.hidden = all.length > 0;
      chartHost.hidden = !all.length;
      download.disabled = !all.length;
      A.u.clear(params);
      odd.textContent = '';
      if (!all.length) { nR2.textContent = '—'; return; }
      var model = lab.models[0];
      var fit = all.length >= 2 ? A.fit.best(model, all) : null;
      var f = fit ? function (x) { return model.fn(fit.params, x); } : null;
      if (!chart) chart = new A.Chart(chartHost, Object.assign({}, lab.chart || {}, { minH: 260, maxH: 420 }));
      var last = runs[runs.length - 1], before = all.slice(0, all.length - last.length);
      chart.set(last, f, before.length ? before : null);
      var bad = f ? outliers(all, f) : [];
      chart.flag(bad);
      var pct = fit ? Math.round(fit.r2 * 100) : null;
      nR2.textContent = pct === null ? '—' : pct < 0 ? A.i18n.t('ниже 0') : pct + '%';
      if (fit) {
        params.appendChild(h('span.board__model', [A.raw(model.label)]));
        model.params.forEach(function (q) {
          params.appendChild(h('span', [A.raw(A.i18n.t(q.label) + ': ' + (q.fmt ? q.fmt(fit.params[q.key]) : A.u.num(fit.params[q.key], 2)))]));
        });
      }
      if (bad.length) odd.textContent = A.i18n.fmt('Точек далеко от общей кривой: {n}. Обсудите, что могло пойти не так: ошибка измерения, спешка, шум или другие условия опыта?', { n: bad.length });
    }

    // Таблица для учителя: ученик (по номеру), x, y и значение общей кривой.
    function exportCsv() {
      if (!lab || !lastRuns.length) return;
      var model = lab.models[0], all = [];
      lastRuns.forEach(function (r) { r.forEach(function (p) { all.push(p); }); });
      var fit = all.length >= 2 ? A.fit.best(model, all) : null;
      var L = A.lessons && A.lessons[lab.id];
      var cols = L ? L.cols : ['x', 'y'];
      var rows = [];
      lastRuns.forEach(function (r, i) {
        r.forEach(function (p) { rows.push([i + 1, p.x, p.y, fit ? model.fn(fit.params, p.x) : '']); });
      });
      A.u.csv('qaltalab-' + lab.id + '-' + code + '.csv',
        [A.i18n.t('Ученик'), A.i18n.t(cols[0]), A.i18n.t(cols[1]), A.i18n.t('Кривая класса')], rows);
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
      openLab.onclick = function () { projector(false); A.app.go('lab:' + lab.id); };
      sheet.onclick = function () { projector(false); A.app.go('lesson:' + lab.id); };
      A.u.clear(discuss);
      var qs = ['Почему точки разных учеников разбросаны вокруг одной кривой?'];
      var L = A.lessons && A.lessons[lab.id];
      if (L) qs = qs.concat(L.q);
      qs.forEach(function (q) { discuss.appendChild(h('li', { text: q })); });
    }

    var onKey = function (e) { if (e.key === 'Escape') { projector(false); paintProj(); } };
    var onFs = function () { if (!document.fullscreenElement && document.documentElement.classList.contains('is-projector')) { projector(false); paintProj(); } };
    document.addEventListener('keydown', onKey);
    document.addEventListener('fullscreenchange', onFs);

    if (demo) { setLab('dombra'); draw(demoRuns()); state.textContent = A.i18n.t('Сгенерированные данные для примера: так выглядит экран класса на уроке.'); }
    else tick();

    stopBoard = function () {
      alive = false;
      if (timer) clearTimeout(timer);
      if (chart) chart.destroy();
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('fullscreenchange', onFs);
      document.documentElement.classList.remove('is-projector');
      stopBoard = null;
    };
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
    active: active, leave: leave, valid: function (c) { return c === 'demo' || CODE.test(c); },
    demoRuns: demoRuns, outliers: outliers,
    mine: function () { return load(MINE, []); }
  };
})(window.A);
