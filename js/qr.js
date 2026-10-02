/* QR-код без библиотек: для ссылки класса на экране проектора, чтобы
   ученики (и жюри) заходили камерой, а не набирали адрес.

   Байтовый режим, уровень коррекции M, версии 1–6 (до 106 байт — ссылке
   класса хватает с запасом). Алгоритм — по стандарту ISO/IEC 18004 в том
   виде, как его излагает открытая библиотека qrcodegen (Nayuki, MIT):
   служебные узоры, данные с Рида — Соломона, змейка размещения, выбор
   маски по штрафам. Результат — SVG, который масштабируется без потерь. */

window.A = window.A || {};

(function (A) {
  'use strict';

  var ECC = [0, 10, 16, 26, 18, 24, 16];     // кодовых слов коррекции на блок, уровень M
  var BLOCKS = [0, 1, 1, 1, 2, 2, 4];        // число блоков, уровень M

  function rawModules(v) {
    var r = (16 * v + 128) * v + 64;
    if (v >= 2) { var n = Math.floor(v / 7) + 2; r -= (25 * n - 10) * n - 55; }
    return r;
  }
  function dataCodewords(v) { return Math.floor(rawModules(v) / 8) - ECC[v] * BLOCKS[v]; }

  // Поле Галуа GF(256), порождающий многочлен 0x11D.
  function mul(x, y) {
    var z = 0;
    for (var i = 7; i >= 0; i--) { z = (z << 1) ^ ((z >>> 7) * 0x11D); z ^= ((y >>> i) & 1) * x; }
    return z & 0xFF;
  }
  function divisor(deg) {
    var r = []; for (var i = 0; i < deg - 1; i++) r.push(0); r.push(1);
    var root = 1;
    for (var k = 0; k < deg; k++) {
      for (var j = 0; j < r.length; j++) { r[j] = mul(r[j], root); if (j + 1 < r.length) r[j] ^= r[j + 1]; }
      root = mul(root, 0x02);
    }
    return r;
  }
  function remainder(data, div) {
    var r = div.map(function () { return 0; });
    data.forEach(function (b) {
      var f = b ^ r.shift(); r.push(0);
      div.forEach(function (c, i) { r[i] ^= mul(c, f); });
    });
    return r;
  }

  function utf8(text) {
    var s = unescape(encodeURIComponent(text)), out = [];
    for (var i = 0; i < s.length; i++) out.push(s.charCodeAt(i));
    return out;
  }

  // Матрица модулей (true — тёмный) для текста.
  function encode(text) {
    var bytes = utf8(text), v = 1;
    while (v <= 6 && 4 + 8 + bytes.length * 8 > dataCodewords(v) * 8) v++;
    if (v > 6) throw new Error('qr: too long');
    var size = v * 4 + 17, cap = dataCodewords(v);

    // Биты данных: режим «байты», длина, сами байты, терминатор, добивка.
    var bits = [];
    var put = function (val, len) { for (var i = len - 1; i >= 0; i--) bits.push((val >>> i) & 1); };
    put(4, 4); put(bytes.length, 8);
    bytes.forEach(function (b) { put(b, 8); });
    put(0, Math.min(4, cap * 8 - bits.length));
    put(0, (8 - bits.length % 8) % 8);
    var data = [];
    for (var i = 0; i < bits.length; i += 8) { var b = 0; for (var j = 0; j < 8; j++) b = (b << 1) | bits[i + j]; data.push(b); }
    for (var pad = 0xEC; data.length < cap; pad ^= 0xEC ^ 0x11) data.push(pad);

    // Разбиение на блоки, коррекция ошибок и чередование.
    var nb = BLOCKS[v], ecl = ECC[v], raw = Math.floor(rawModules(v) / 8);
    var nShort = nb - raw % nb, shortLen = Math.floor(raw / nb);
    var div = divisor(ecl), blocks = [], k = 0;
    for (var bi = 0; bi < nb; bi++) {
      var dat = data.slice(k, k + shortLen - ecl + (bi < nShort ? 0 : 1));
      k += dat.length;
      var ec = remainder(dat, div);
      if (bi < nShort) dat.push(0);
      blocks.push(dat.concat(ec));
    }
    var words = [];
    for (var c = 0; c < blocks[0].length; c++) {
      blocks.forEach(function (bl, bj) { if (c !== shortLen - ecl || bj >= nShort) words.push(bl[c]); });
    }

    var mod = [], fn = [];
    for (var y = 0; y < size; y++) { mod.push(new Array(size).fill(false)); fn.push(new Array(size).fill(false)); }
    var set = function (x, y, dark) { mod[y][x] = dark; fn[y][x] = true; };

    // Служебные узоры: синхронизация, искатели, выравнивание.
    for (var t = 0; t < size; t++) { set(6, t, t % 2 === 0); set(t, 6, t % 2 === 0); }
    [[3, 3], [size - 4, 3], [3, size - 4]].forEach(function (p) {
      for (var dy = -4; dy <= 4; dy++) for (var dx = -4; dx <= 4; dx++) {
        var d = Math.max(Math.abs(dx), Math.abs(dy)), xx = p[0] + dx, yy = p[1] + dy;
        if (xx >= 0 && xx < size && yy >= 0 && yy < size) set(xx, yy, d !== 2 && d !== 4);
      }
    });
    if (v >= 2) {
      var na = Math.floor(v / 7) + 2, step = Math.ceil((size - 13) / (na * 2 - 2)) * 2, pos = [6];
      for (var q = size - 7; pos.length < na; q -= step) pos.splice(1, 0, q);
      pos.forEach(function (ax, ai) {
        pos.forEach(function (ay, aj) {
          if ((ai === 0 && aj === 0) || (ai === 0 && aj === na - 1) || (ai === na - 1 && aj === 0)) return;
          for (var dy = -2; dy <= 2; dy++) for (var dx = -2; dx <= 2; dx++) set(ax + dx, ay + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
        });
      });
    }
    var format = function (mask) {
      var d = mask, r = d;                    // уровень M — биты 00
      for (var i = 0; i < 10; i++) r = (r << 1) ^ ((r >>> 9) * 0x537);
      var f = ((d << 10) | r) ^ 0x5412;
      var bit = function (i) { return ((f >>> i) & 1) !== 0; };
      for (var i1 = 0; i1 <= 5; i1++) set(8, i1, bit(i1));
      set(8, 7, bit(6)); set(8, 8, bit(7)); set(7, 8, bit(8));
      for (var i2 = 9; i2 < 15; i2++) set(14 - i2, 8, bit(i2));
      for (var i3 = 0; i3 < 8; i3++) set(size - 1 - i3, 8, bit(i3));
      for (var i4 = 8; i4 < 15; i4++) set(8, size - 15 + i4, bit(i4));
      set(8, size - 8, true);
    };
    format(0);

    // Змейка: столбцы парами справа налево, вверх-вниз по очереди.
    var n = 0;
    for (var right = size - 1; right >= 1; right -= 2) {
      if (right === 6) right = 5;
      for (var vert = 0; vert < size; vert++) {
        for (var jj = 0; jj < 2; jj++) {
          var x = right - jj, up = ((right + 1) & 2) === 0, yy2 = up ? size - 1 - vert : vert;
          if (!fn[yy2][x] && n < words.length * 8) { mod[yy2][x] = ((words[n >>> 3] >>> (7 - (n & 7))) & 1) !== 0; n++; }
        }
      }
    }

    var MASKS = [
      function (x, y) { return (x + y) % 2 === 0; },
      function (x, y) { return y % 2 === 0; },
      function (x) { return x % 3 === 0; },
      function (x, y) { return (x + y) % 3 === 0; },
      function (x, y) { return (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0; },
      function (x, y) { return x * y % 2 + x * y % 3 === 0; },
      function (x, y) { return (x * y % 2 + x * y % 3) % 2 === 0; },
      function (x, y) { return ((x + y) % 2 + x * y % 3) % 2 === 0; }
    ];
    var apply = function (m) {
      for (var yy = 0; yy < size; yy++) for (var xx = 0; xx < size; xx++) if (!fn[yy][xx] && MASKS[m](xx, yy)) mod[yy][xx] = !mod[yy][xx];
    };
    // Штраф по правилам стандарта: длинные ряды, квадраты 2×2, доля тёмных.
    var penalty = function () {
      var p = 0, dark = 0;
      for (var a = 0; a < size; a++) {
        var rx = 1, ry = 1;
        for (var bb = 1; bb < size; bb++) {
          if (mod[a][bb] === mod[a][bb - 1]) { rx++; if (rx === 5) p += 3; else if (rx > 5) p++; } else rx = 1;
          if (mod[bb][a] === mod[bb - 1][a]) { ry++; if (ry === 5) p += 3; else if (ry > 5) p++; } else ry = 1;
        }
      }
      for (var y3 = 0; y3 < size; y3++) for (var x3 = 0; x3 < size; x3++) {
        if (mod[y3][x3]) dark++;
        if (y3 < size - 1 && x3 < size - 1 && mod[y3][x3] === mod[y3][x3 + 1] && mod[y3][x3] === mod[y3 + 1][x3] && mod[y3][x3] === mod[y3 + 1][x3 + 1]) p += 3;
      }
      return p + Math.floor(Math.abs(dark * 20 - size * size * 10) / (size * size)) * 10;
    };
    var best = 0, bestP = Infinity;
    for (var m = 0; m < 8; m++) {
      apply(m); format(m);
      var pp = penalty();
      if (pp < bestP) { bestP = pp; best = m; }
      apply(m);                                // XOR второй раз — откат
    }
    apply(best); format(best);
    return mod;
  }

  // SVG с полем в 4 модуля вокруг — без него камеры читают хуже.
  function svg(text, label) {
    var m = encode(text), n = m.length, d = '';
    for (var y = 0; y < n; y++) for (var x = 0; x < n; x++) if (m[y][x]) d += 'M' + (x + 4) + ' ' + (y + 4) + 'h1v1h-1z';
    var el = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    el.setAttribute('viewBox', '0 0 ' + (n + 8) + ' ' + (n + 8));
    el.setAttribute('class', 'qr');
    el.setAttribute('role', 'img');
    el.setAttribute('aria-label', label || text);
    el.setAttribute('shape-rendering', 'crispEdges');
    el.innerHTML = '<rect width="100%" height="100%" fill="#fff"/><path d="' + d + '" fill="#111"/>';
    return el;
  }

  A.qr = { encode: encode, svg: svg };
})(window.A);
