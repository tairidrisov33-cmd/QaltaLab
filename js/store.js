/* Прогресс и журнал опытов.
   Всё лежит в браузере: аккаунтов нет, данные никуда не уходят —
   это важно, потому что опыты личные (слух, время реакции). */

window.A = window.A || {};

(function (A) {
  'use strict';

  var KEY = 'spl.state.v1';

  var state = {
    results: {},   // id опыта -> { points, hypothesis, params, match, done, at }
    opened: []     // id открытых законов, в порядке открытия
  };

  function load() {
    try {
      var raw = localStorage.getItem(KEY);
      if (!raw) return;
      var v = JSON.parse(raw);
      if (v && typeof v === 'object') {
        state.results = v.results || {};
        state.opened = Array.isArray(v.opened) ? v.opened : [];
      }
    } catch (e) { /* порченое или недоступное хранилище — начинаем с нуля */ }
  }

  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {}
  }

  function result(id) {
    if (!state.results[id]) state.results[id] = { points: [], hypothesis: null, done: false };
    return state.results[id];
  }

  function setHypothesis(id, hyp) { result(id).hypothesis = hyp; save(); }

  function setPoints(id, points) { result(id).points = points.slice(); save(); }

  function finish(id, data) {
    var r = result(id);
    r.params = data.params;
    r.match = data.match;
    r.done = true;
    r.at = Date.now();
    if (state.opened.indexOf(id) < 0) state.opened.push(id);
    save();
  }

  function reset(id) {
    delete state.results[id];
    state.opened = state.opened.filter(function (openedId) { return openedId !== id; });
    save();
  }

  function openedCount() { return state.opened.length; }

  A.store = {
    load: load, save: save,
    result: result, setHypothesis: setHypothesis, setPoints: setPoints,
    finish: finish, reset: reset, openedCount: openedCount,
    get state() { return state; }
  };
})(window.A);
