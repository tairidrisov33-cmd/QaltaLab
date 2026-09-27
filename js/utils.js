/* Мелкие помощники и построение разметки.
   Весь текст идёт через h(), поэтому перевод включён в одну точку —
   экраны про языки ничего не знают. */

window.A = window.A || {};

(function (A) {
  'use strict';

  // Текст, который переводить нельзя (имена, числа с единицами) — оборачиваем сюда.
  function raw(s) { return { __raw: String(s) }; }

  function h(sel, props, kids) {
    if (Array.isArray(props)) { kids = props; props = null; }
    var m = /^([a-z0-9]+)?((?:[.#][\w-]+)*)$/i.exec(sel || 'div');
    var el = document.createElement((m && m[1]) || 'div');
    if (m && m[2]) {
      m[2].split(/(?=[.#])/).forEach(function (p) {
        if (p[0] === '#') el.id = p.slice(1);
        else el.classList.add(p.slice(1));
      });
    }
    if (props) {
      Object.keys(props).forEach(function (k) {
        var v = props[k];
        if (v === null || v === undefined || v === false) return;
        if (k === 'text') { el.textContent = A.i18n.t(v); return; }
        if (k === 'html') { el.innerHTML = v; return; }
        if (k === 'style') { Object.assign(el.style, v); return; }
        if (k.slice(0, 2) === 'on' && typeof v === 'function') {
          el.addEventListener(k.slice(2).toLowerCase(), v);
          return;
        }
        if (k === 'title' || k === 'placeholder' || k === 'aria-label') {
          el.setAttribute(k, A.i18n.t(v));
          return;
        }
        if (k in el && k !== 'list' && typeof v !== 'object') { el[k] = v; return; }
        el.setAttribute(k, v);
      });
    }
    (kids || []).forEach(function (c) {
      if (c === null || c === undefined || c === false) return;
      if (typeof c === 'string') el.appendChild(document.createTextNode(A.i18n.t(c)));
      else if (typeof c === 'number') el.appendChild(document.createTextNode(String(c)));
      else if (c.__raw !== undefined) el.appendChild(document.createTextNode(c.__raw));
      else el.appendChild(c);
    });
    return el;
  }

  function clear(el) { while (el.firstChild) el.removeChild(el.firstChild); return el; }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }

  // Число с нужным количеством знаков, но без хвостовых нулей: 1.50 -> 1.5
  function num(v, digits) {
    if (!isFinite(v)) return '—';
    var s = v.toFixed(digits === undefined ? 1 : digits);
    return s.replace(/\.?0+$/, '');
  }

  // Частота: до 1000 Гц в герцах, дальше в килогерцах — так читается человеком.
  function hz(f) {
    return f >= 1000 ? num(f / 1000, 1) + A.i18n.t(' кГц') : Math.round(f) + A.i18n.t(' Гц');
  }

  function median(arr) {
    var a = arr.slice().sort(function (x, y) { return x - y; });
    var n = a.length;
    if (!n) return 0;
    return n % 2 ? a[(n - 1) / 2] : (a[n / 2 - 1] + a[n / 2]) / 2;
  }

  A.h = h;
  A.raw = raw;
  A.u = { clear: clear, clamp: clamp, num: num, hz: hz, median: median };
})(window.A);
