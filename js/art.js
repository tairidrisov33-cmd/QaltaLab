/* Рисунки на карточках опытов.
   Стоковые фотографии не показывали сам опыт, поэтому у каждого опыта своя
   сцена: что именно ученик будет делать. Цвета берутся из темы через классы,
   так что рисунок одинаково читается в светлой и тёмной теме. */

window.A = window.A || {};

(function (A) {
  'use strict';

  var NS = 'http://www.w3.org/2000/svg';

  function bottle(x, water, i) {
    // тело бутылки 44×86, горлышко 16×30; вода — снизу на заданную высоту
    return '<g class="sc-bottle" style="--i:' + i + '">' +
      '<rect class="sc-water" x="' + (x + 3) + '" y="' + (153 - water) + '" width="38" height="' + water + '" rx="7"/>' +
      '<rect class="sc-line" x="' + x + '" y="70" width="44" height="86" rx="11"/>' +
      '<path class="sc-line" d="M' + (x + 14) + ' 71 V44 h16 V71"/>' +
      '</g>';
  }

  function waves(x, gap, i) {
    var s = '';
    for (var k = 0; k < 3; k++) {
      var r = 8 + k * gap;
      s += '<path class="sc-wave" style="--i:' + (i * 3 + k) + '" d="M' + (x + 22 - r) + ' ' + (36 - r * 0.2) + ' A' + r + ' ' + r + ' 0 0 1 ' + (x + 22 + r) + ' ' + (36 - r * 0.2) + '"/>';
    }
    return s;
  }

  var SCENES = {
    // Домбра лежит грифом вправо. Лады стоят по закону струны: каждый
    // следующий короче на одну и ту же долю, поэтому к подставке они
    // сходятся всё теснее. Середина струны (октава) отмечена «½».
    dombra: function () {
      var bridge = 62, L0 = 214, s = '';
      for (var k = 1; k <= 14; k++) {
        var x = bridge + L0 * Math.pow(2, -k / 12);
        s += '<path class="' + (k === 12 ? 'sc-fret is-oct' : 'sc-fret') + '" d="M' + x.toFixed(1) + ' 83V97"/>';
      }
      var half = bridge + L0 / 2;
      return '<path class="sc-card" d="M30 90C30 62 58 52 92 59c20 4 34 17 38 31-4 14-18 27-38 31-34 7-62-3-62-31z"/>' +
        '<circle class="sc-line" cx="80" cy="90" r="9"/>' +
        '<rect class="sc-card" x="128" y="83" width="152" height="14" rx="4"/>' +
        '<rect class="sc-card" x="276" y="78" width="22" height="24" rx="5"/>' +
        s +
        '<rect class="sc-acc" x="' + (bridge - 3) + '" y="82" width="6" height="16" rx="2"/>' +
        '<path class="sc-string" d="M' + bridge + ' 87.5H280"/><path class="sc-string sc-vib" d="M' + bridge + ' 92.5Q' + (bridge + 109) + ' 92.5 280 92.5"/>' +
        '<text class="sc-txt" x="' + half.toFixed(0) + '" y="70" text-anchor="middle">½</text>' +
        '<path class="sc-dash" d="M' + half.toFixed(1) + ' 74V82"/>' +
        waves(58, 8, 0);
    },

    pitch: function () {
      return bottle(64, 18, 0) + bottle(138, 44, 1) + bottle(212, 70, 2) +
        waves(64, 9, 0) + waves(138, 6.5, 1) + waves(212, 4.5, 2);
    },

    pendulum: function () {
      return '<path class="sc-line" d="M96 24 H224"/>' +
        '<path class="sc-dash" d="M124.2 134.3 A116 116 0 0 0 195.8 134.3"/>' +
        '<g class="sc-swing"><path class="sc-line" d="M160 24 V132"/>' +
        '<circle class="sc-acc" cx="160" cy="140" r="11"/></g>' +
        '<text class="sc-txt" x="168" y="80">L</text>';
    },

    hearing: function () {
      var d = 'M112 90';
      for (var x = 112; x <= 292; x += 1) {
        var t = (x - 112) / 180;
        var f = 0.07 + t * t * 0.38;
        var a = 30 * (1 - t * 0.85);
        d += ' L' + x + ' ' + (90 + Math.sin((x - 112) * f) * a).toFixed(1);
      }
      return '<rect class="sc-phone" x="36" y="30" width="62" height="120" rx="12"/>' +
        '<circle class="sc-acc" cx="67" cy="90" r="15"/><circle class="sc-hole" cx="67" cy="90" r="6"/>' +
        '<path class="sc-sig" d="' + d + '"/>';
    },

    timing: function () {
      var ticks = '';
      for (var i = 0; i < 12; i++) {
        var a = i / 12 * Math.PI * 2;
        ticks += '<path class="sc-tick" d="M' + (160 + Math.sin(a) * 50).toFixed(1) + ' ' + (98 - Math.cos(a) * 50).toFixed(1) +
          ' L' + (160 + Math.sin(a) * 57).toFixed(1) + ' ' + (98 - Math.cos(a) * 57).toFixed(1) + '"/>';
      }
      return '<rect class="sc-acc" x="152" y="18" width="16" height="10" rx="3"/>' +
        '<circle class="sc-card" cx="160" cy="98" r="64"/>' + ticks +
        '<circle class="sc-ring" cx="160" cy="98" r="64"/>' +
        '<path class="sc-hand" d="M160 98 L160 58"/><circle class="sc-dot" cx="160" cy="98" r="5"/>';
    },

    hick: function () {
      var s = '', lit = 4;
      for (var r = 0; r < 2; r++) {
        for (var c = 0; c < 4; c++) {
          var n = r * 4 + c;
          s += '<rect class="' + (n === lit ? 'sc-acc sc-blink' : 'sc-card') + '" x="' + (62 + c * 52) + '" y="' + (46 + r * 50) + '" width="42" height="40" rx="10"/>';
        }
      }
      return s + '<path class="sc-finger" d="M88 176 V124 a9 9 0 0 1 18 0 V176"/>';
    },

    fitts: function () {
      return '<circle class="sc-card" cx="78" cy="96" r="17"/><circle class="sc-acc" cx="78" cy="96" r="7"/>' +
        '<circle class="sc-card" cx="246" cy="90" r="44"/><circle class="sc-ring2" cx="246" cy="90" r="28"/><circle class="sc-acc" cx="246" cy="90" r="11"/>' +
        '<path class="sc-dash sc-move" d="M96 90 Q160 20 206 78"/>' +
        '<path class="sc-line" d="M196 70 L207 79 L193 84"/>';
    },

    practice: function () {
      var s = '';
      for (var r = 0; r < 3; r++) {
        for (var c = 0; c < 6; c++) {
          var odd = r === 1 && c === 4;
          var x = 70 + c * 32, y = 38 + r * 38;
          s += '<rect class="' + (odd ? 'sc-acc' : 'sc-card') + '" x="' + x + '" y="' + y + '" width="26" height="30" rx="7"/>' +
            '<text class="sc-let' + (odd ? ' is-odd' : '') + '" x="' + (x + 13) + '" y="' + (y + 21) + '">' + (odd ? 'R' : 'P') + '</text>';
        }
      }
      return s;
    },

    memory: function () {
      var digits = ['7', '3', '9', '1', '4', '?'], s = '';
      digits.forEach(function (d, i) {
        var x = 44 + i * 40;
        s += '<g class="sc-pop" style="--i:' + i + '"><rect class="' + (d === '?' ? 'sc-acc' : 'sc-card') + '" x="' + x + '" y="66" width="32" height="44" rx="8"/>' +
          '<text class="sc-dig' + (d === '?' ? ' is-odd' : '') + '" x="' + (x + 16) + '" y="96">' + d + '</text></g>';
      });
      return s + '<path class="sc-dash" d="M44 130 H276"/>';
    },

    pulse: function () {
      var d = 'M24 104 H70 L80 104 L88 60 L98 138 L106 94 L114 104 H150 L160 104 L168 60 L178 138 L186 94 L194 104 H230 L240 104 L248 60 L258 138 L266 94 L274 104 H300';
      return '<circle class="sc-card" cx="160" cy="40" r="22"/><circle class="sc-acc" cx="160" cy="40" r="12"/>' +
        '<path class="sc-sig sc-draw" d="' + d + '"/>';
    }
  };

  function scene(id) {
    var svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', '0 0 320 180');
    svg.setAttribute('class', 'scene scene--' + id);
    svg.setAttribute('aria-hidden', 'true');
    var dots = '';
    for (var y = 14; y < 180; y += 22) for (var x = 14; x < 320; x += 22) dots += 'M' + x + ' ' + y + 'h.01';
    svg.innerHTML = '<rect class="sc-bg" width="320" height="180"/><path class="sc-grid" d="' + dots + '"/>' +
      (SCENES[id] ? SCENES[id]() : '');
    return svg;
  }

  A.scene = scene;
})(window.A);
