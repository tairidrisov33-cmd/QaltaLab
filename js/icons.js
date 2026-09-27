/* Монолинейные иконки.
   Эмодзи не годятся: в Windows часть из них чёрно-белая, и карточки выглядят
   случайными. Здесь один стиль, один вес линии, цвет наследуется от текста. */

window.A = window.A || {};

(function (A) {
  'use strict';

  var P = {
    // микрофон, камера, касание, телефон — возможности устройства
    mic: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21"/>',
    camera: '<path d="M4 7.5h3.2L9 5h6l1.8 2.5H20a1 1 0 0 1 1 1V18a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V8.5a1 1 0 0 1 1-1z"/><circle cx="12" cy="13" r="3.4"/>',
    touch: '<path d="M9 11V5.5a1.7 1.7 0 0 1 3.4 0V11m0-1.5a1.7 1.7 0 0 1 3.4 0V12m0-1a1.7 1.7 0 0 1 3.4 0v3.5a6 6 0 0 1-6 6h-1a6 6 0 0 1-4.6-2.2L4.8 15a1.7 1.7 0 0 1 2.6-2.2L9 14.5"/>',
    phone: '<rect x="6.5" y="2.5" width="11" height="19" rx="2.5"/><path d="M10.5 18.5h3"/>',
    speaker: '<path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/><path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11"/>',
    timer: '<circle cx="12" cy="13.5" r="7.5"/><path d="M12 13.5V9.5M10 2.5h4M18.5 6.5l1.2-1.2"/>',
    code: '<path d="M8.5 7.5 4 12l4.5 4.5M15.5 7.5 20 12l-4.5 4.5M13.5 5l-3 14"/>',
    // наушники — опыт со слухом
    hearing: '<path d="M4 14v-2a8 8 0 0 1 16 0v2"/><rect x="2.5" y="13.5" width="4.5" height="7" rx="2.2"/><rect x="17" y="13.5" width="4.5" height="7" rx="2.2"/>',
    // молния — скорость реакции
    bolt: '<path d="M13 2 4.5 13.5H11l-1 8.5 8.5-11.5H12z"/>',
    // звуковая волна — высота звука
    wave: '<path d="M3 12h2M7 12v0M7 8.5v7M11 5v14M15 8v8M19 10.5v3M21.5 12h.5"/>',
    // сердце — пульс
    heart: '<path d="M12 20.5 4.2 13a4.8 4.8 0 0 1 6.8-6.8l1 1 1-1A4.8 4.8 0 0 1 19.8 13z"/>',
    // маятник
    pendulum: '<path d="M12 3v8"/><circle cx="12" cy="15" r="3.6"/><path d="M4 21c1.6-3.4 4.5-5.4 8-5.4s6.4 2 8 5.4"/>',
    // колба — научная основа
    flask: '<path d="M9 3h6M10 3v6.2L4.6 18a2.4 2.4 0 0 0 2 3.6h10.8a2.4 2.4 0 0 0 2-3.6L14 9.2V3"/><path d="M7.2 15h9.6"/>',
    // мишень — закон Фиттса
    target: "<circle cx=\"12\" cy=\"12\" r=\"8.5\"/><circle cx=\"12\" cy=\"12\" r=\"3.5\"/>",
    // мозг — память
    brain: "<path d=\"M9.5 4.5a3 3 0 0 0-3 3v.3a3 3 0 0 0-2 5.2 3 3 0 0 0 2 5 3 3 0 0 0 3 2.5V4.5z\"/><path d=\"M14.5 4.5a3 3 0 0 1 3 3v.3a3 3 0 0 1 2 5.2 3 3 0 0 1-2 5 3 3 0 0 1-3 2.5V4.5z\"/>",
    // часы — чувство времени
    clock: "<circle cx=\"12\" cy=\"12\" r=\"8.5\"/><path d=\"M12 7.5V12l3 2\"/>",
    // стрелка вправо
    arrow: '<path d="M4 12h15"/><path d="M13.5 6.5 20 12l-6.5 5.5"/>',
    // галочка
    check: '<path d="M4.5 12.5 9.5 17.5 19.5 6.5"/>',
    // искра — акцент
    spark: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18"/>',
    // график
    chart: '<path d="M4 4v16h16"/><path d="M7.5 15.5 11 11l3 2.5L20 6"/>',
    // вопрос в круге
    quest: '<circle cx="12" cy="12" r="9"/><path d="M9.6 9.3a2.5 2.5 0 1 1 3.2 2.6c-.6.2-.8.7-.8 1.3v.4"/><path d="M12 17.2v.01"/>',
    // луна и солнце для переключателя темы
    moon: '<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M19.1 4.9l-1.4 1.4M6.3 17.7l-1.4 1.4"/>'
  };

  // Возвращает готовый узел, а не строку: разметка у нас собирается узлами.
  function icon(name, size) {
    var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', 'currentColor');
    svg.setAttribute('stroke-width', '1.7');
    svg.setAttribute('stroke-linecap', 'round');
    svg.setAttribute('stroke-linejoin', 'round');
    svg.setAttribute('aria-hidden', 'true');
    if (size) { svg.setAttribute('width', size); svg.setAttribute('height', size); }
    svg.innerHTML = P[name] || '';
    return svg;
  }

  A.icon = icon;
  A.iconPaths = P;
})(window.A);
