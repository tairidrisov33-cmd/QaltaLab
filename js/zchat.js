/* Zerde AI — плавающий чат-наставник в правом нижнем углу.
   Отвечает только про QaltaLab, опыты и научный метод (это держит сервер).
   Если открыт опыт, к вопросу прикладываются его точки — только числа.
   Пока человек ничего не спросил, на сервер не уходит ничего. */

window.A = window.A || {};

(function (A) {
  'use strict';

  var h = A.h;
  var TIMEOUT = 25000;
  var KEY = 'zchat.v1';
  var msgs = [];          // {role: 'user'|'assistant', text}
  var busy = false;
  var root, panel, list, input, sendBtn, chipsBox, fab;

  var SUGGEST = {
    home: ['С какого опыта начать?', 'Как телефон измеряет частоту звука?', 'Что такое R² простыми словами?'],
    lab: ['Как правильно провести этот опыт?', 'Что здесь измеряется?', 'Что такое R² простыми словами?'],
    result: ['Разбери мой результат', 'Почему результат отличается от теории?', 'Что попробовать дальше?']
  };

  function load() {
    try { var v = JSON.parse(sessionStorage.getItem(KEY) || '[]'); if (Array.isArray(v)) msgs = v.slice(-20); } catch (e) {}
  }
  function save() { try { sessionStorage.setItem(KEY, JSON.stringify(msgs.slice(-20))); } catch (e) {} }

  function context() {
    var c = A.lab && A.lab.context ? A.lab.context() : null;
    if (!c) return null;
    var round = function (v) { return Math.round(v * 1000) / 1000; };
    return {
      experimentId: c.id, step: c.step,
      measurements: (c.points || []).slice(0, 60).map(function (p) { return { x: round(p.x), y: round(p.y) }; }),
      params: c.params || {}, r2: typeof c.match === 'number' ? Math.round(c.match) / 100 : null
    };
  }

  function mode() {
    var c = A.lab && A.lab.context ? A.lab.context() : null;
    if (!c) return 'home';
    return c.step === 4 ? 'result' : 'lab';
  }

  function bubble(m) {
    return h('div.zc__m.zc__m--' + (m.role === 'user' ? 'me' : 'ai'), [A.raw(m.text)]);
  }

  function paint() {
    A.u.clear(list);
    list.appendChild(h('div.zc__m.zc__m--ai', ['Привет! Я Zerde. Спроси про любой опыт QaltaLab, научный метод или свои результаты.']));
    msgs.forEach(function (m) { list.appendChild(bubble(m)); });
    A.u.clear(chipsBox);
    SUGGEST[mode()].forEach(function (s) {
      chipsBox.appendChild(h('button.zc__chip', { type: 'button', onclick: function () { send(A.i18n.t(s)); } }, [s]));
    });
    list.scrollTop = list.scrollHeight;
  }

  function send(text) {
    text = (text || '').trim().slice(0, 400);
    if (!text || busy) return;
    busy = true;
    sendBtn.disabled = true;
    input.value = '';
    var history = msgs.slice(-6);
    msgs.push({ role: 'user', text: text });
    list.appendChild(bubble(msgs[msgs.length - 1]));
    var typing = h('div.zc__m.zc__m--ai.zc__typing', { 'aria-label': 'Zerde печатает' }, [h('i'), h('i'), h('i')]);
    list.appendChild(typing);
    list.scrollTop = list.scrollHeight;

    var ctrl = window.AbortController ? new AbortController() : null;
    var timer = setTimeout(function () { if (ctrl) ctrl.abort(); }, TIMEOUT);
    fetch('/api/zerde', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: ctrl ? ctrl.signal : undefined,
      body: JSON.stringify({ mode: 'chat', language: A.i18n.lang, message: text, history: history, context: context() })
    }).then(function (r) { return r.json(); }).then(function (j) {
      if (!j || !j.success || !j.reply) throw new Error('bad');
      return j.reply;
    }).then(function (reply) {
      msgs.push({ role: 'assistant', text: reply });
      done(bubble(msgs[msgs.length - 1]));
    }, function () {
      done(h('div.zc__m.zc__m--ai.zc__m--err', ['Zerde сейчас недоступен. Опыты работают как обычно — попробуй спросить чуть позже.']));
      msgs.pop();
    });

    function done(node) {
      clearTimeout(timer);
      busy = false;
      sendBtn.disabled = false;
      if (typing.parentNode) typing.parentNode.replaceChild(node, typing);
      list.scrollTop = list.scrollHeight;
      save();
    }
  }

  function open() {
    root.classList.add('is-open');
    fab.setAttribute('aria-expanded', 'true');
    paint();
    setTimeout(function () { input.focus(); }, 60);
  }
  function close() {
    root.classList.remove('is-open');
    fab.setAttribute('aria-expanded', 'false');
    fab.focus();
  }

  function build() {
    if (root) root.remove();
    fab = h('button.zc__fab', { type: 'button', 'aria-expanded': 'false', 'aria-controls': 'zchat-panel', onclick: function () { if (root.classList.contains('is-open')) close(); else open(); } }, [
      h('span.zc__fabic', [A.icon('spark')]), h('span.zc__fabt', [A.raw('Zerde AI')])
    ]);
    list = h('div.zc__list', { role: 'log', 'aria-live': 'polite' });
    chipsBox = h('div.zc__chips');
    input = h('textarea.zc__in', { rows: 1, maxLength: 400, placeholder: 'Спроси про опыт или закон…', 'aria-label': 'Вопрос для Zerde' });
    input.addEventListener('keydown', function (e) { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input.value); } });
    sendBtn = h('button.zc__send', { type: 'button', 'aria-label': 'Отправить', onclick: function () { send(input.value); } }, [A.icon('arrow')]);
    panel = h('section.zc__panel', { id: 'zchat-panel', role: 'dialog', 'aria-label': 'Zerde AI' }, [
      h('header.zc__head', [
        h('span.zc__ic', [A.icon('spark')]),
        h('div', [h('b', [A.raw('Zerde AI')]), h('span', ['Твой STEM-наставник'])]),
        h('button.zc__close', { type: 'button', 'aria-label': 'Закрыть', onclick: close }, [A.raw('×')])
      ]),
      list,
      chipsBox,
      h('div.zc__form', [input, sendBtn]),
      h('p.zc__priv', ['Отправляется только твой вопрос и числа открытого опыта. Zerde может ошибаться — проверяй опытом.'])
    ]);
    root = h('div.zc', [panel, fab]);
    root.addEventListener('keydown', function (e) { if (e.key === 'Escape' && root.classList.contains('is-open')) close(); });
    document.body.appendChild(root);
  }

  function init() { load(); build(); }

  // При смене языка перестраиваем виджет, переписка сохраняется.
  function translate() {
    var wasOpen = root && root.classList.contains('is-open');
    build();
    if (wasOpen) open();
  }

  // Подсказки зависят от экрана: обновляем их, если окно открыто.
  function refresh() { if (root && root.classList.contains('is-open') && !busy) paint(); }

  A.zchat = { init: init, translate: translate, refresh: refresh, open: open };
})(window.A);
