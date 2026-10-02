/* Казахские орнаментальные мотивы — маленькой SVG-графикой.
   У каждого раздела свой знак, разделители и фоновые узоры тоже разные,
   чтобы страница не повторяла одно и то же. Цвет — currentColor, поэтому
   мотив сам подстраивается под тему и место, где стоит.

   шаңырақ   — купол юрты, символ дома и единства
   тұмар     — треугольный оберег
   қошқар мүйіз — бараньи рога, главный мотив казахского орнамента
   сыңар мүйіз  — одинарный рог-завиток
   түйе табан   — «верблюжий след», четырёхлепестковый знак
   құс қанаты   — крыло птицы
   өркеш     — волна-горб, ритм степи
   ромб      — ромб сырмака
   күн       — солнце
   өсімдік   — побег папоротника */

window.A = window.A || {};

(function (A) {
  'use strict';

  var NS = 'http://www.w3.org/2000/svg';
  var PATHS = {
    shanyrak: 'M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18zM12 8.5a3.5 3.5 0 1 0 0 7a3.5 3.5 0 1 0 0-7zM4.6 7c3 2.6 11.8 2.6 14.8 0M4.6 17c3-2.6 11.8-2.6 14.8 0M7 4.6c2.6 3 2.6 11.8 0 14.8M17 4.6c-2.6 3-2.6 11.8 0 14.8',
    tumar: 'M12 3l9 16H3zM12 8.5l5 9H7zM12 19v3M9.5 22h5',
    horn: 'M12 20C12 13 9 8 5.5 8 3 8 2 10.5 3 12c.9 1.3 3 .7 3-1M12 20c0-7 3-12 6.5-12C21 8 22 10.5 21 12c-.9 1.3-3 .7-3-1M12 20v2',
    single: 'M6 21c0-8.5 4.5-15 10-15 3 0 4.5 2.5 3.4 4.6-1 1.8-3.9 1.8-4.4-.3M6 21H3',
    camel: 'M12 3.5c1.8 0 2.8 1.8 2.8 3.8S13.8 11 12 11s-2.8-1.7-2.8-3.7 1-3.8 2.8-3.8zM12 13c1.8 0 2.8 1.8 2.8 3.8S13.8 20.5 12 20.5s-2.8-1.7-2.8-3.7S10.2 13 12 13zM3.5 12c0-1.8 1.8-2.8 3.8-2.8S11 10.2 11 12s-1.7 2.8-3.7 2.8-3.8-1-3.8-2.8zM13 12c0-1.8 1.8-2.8 3.8-2.8s3.7 1 3.7 2.8-1.7 2.8-3.7 2.8S13 13.8 13 12z',
    wing: 'M2.5 14c4.5 0 7.5-3.4 9.5-9 2 5.6 5 9 9.5 9M6.5 14.5c2.3 0 4.4-1.7 5.5-4.5 1.1 2.8 3.2 4.5 5.5 4.5M12 14v7M9 21h6',
    wave: 'M2 15c2.5 0 2.5-6 5-6s2.5 6 5 6 2.5-6 5-6 2.5 6 5 6M2 19h20',
    rhomb: 'M12 2.5l8.5 9.5-8.5 9.5L3.5 12zM12 7.5l4.3 4.5-4.3 4.5L7.7 12zM12 11l1 1-1 1-1-1z',
    sun: 'M12 7.5a4.5 4.5 0 1 0 0 9a4.5 4.5 0 1 0 0-9zM12 1.5v3M12 19.5v3M1.5 12h3M19.5 12h3M4.6 4.6l2.1 2.1M17.3 17.3l2.1 2.1M4.6 19.4l2.1-2.1M17.3 6.7l2.1-2.1',
    sprout: 'M12 22V4M12 9.5C9 9.5 6.5 7.5 6.5 4.5c3 0 5.5 2 5.5 5zM12 9.5c3 0 5.5-2 5.5-5-3 0-5.5 2-5.5 5zM12 16c-3 0-5.5-2-5.5-5 3 0 5.5 2 5.5 5zM12 16c3 0 5.5-2 5.5-5-3 0-5.5 2-5.5 5z'
  };

  function orn(name, cls) {
    var svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('class', 'orn' + (cls ? ' ' + cls : ''));
    svg.innerHTML = '<path d="' + (PATHS[name] || PATHS.horn) + '" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>';
    return svg;
  }

  // Разделитель: две линии и в центре один–три разных мотива.
  function divider(names) {
    var box = document.createElement('div');
    box.className = 'orn-div';
    box.setAttribute('aria-hidden', 'true');
    box.appendChild(document.createElement('i'));
    names.forEach(function (n, k) { box.appendChild(orn(n, k === (names.length - 1) / 2 ? 'is-main' : '')); });
    box.appendChild(document.createElement('i'));
    return box;
  }

  A.orn = orn;
  A.orn.divider = divider;
  A.orn.names = Object.keys(PATHS);
})(window.A);
