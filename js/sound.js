/* Общее для звуковых опытов: картинка спектра и поиск основного тона.

   Спектр приходит из AnalyserNode в децибелах (getFloatFrequencyData).
   Для бутылки хватает самого сильного пика. У щипнутой струны второй
   обертон часто громче основного тона, поэтому для струны тон ищется по
   гармоникам: кандидат f засчитывается, только если звучат и f, и 2f, и 3f
   (произведение спектров, harmonic product spectrum). */

window.A = window.A || {};

(function (A) {
  'use strict';

  var QUIET = -72;   // тише — это тишина, а не звук

  // Уточнение пика параболой по трём соседним полосам: без этого частота
  // прыгает ступеньками по ширине полосы БПФ.
  function refine(buf, i) {
    var a = buf[i - 1], b = buf[i], c = buf[i + 1] !== undefined ? buf[i + 1] : a;
    var d = a - 2 * b + c;
    return i + (d ? A.u.clamp(0.5 * (a - c) / d, -1, 1) : 0);
  }

  /* Основной тон струны в диапазоне [minHz, maxHz] или 0, если тихо. */
  function fundamental(buf, rate, n, minHz, maxHz) {
    var lo = Math.max(2, Math.floor(minHz * n / rate)), hi = Math.ceil(maxHz * n / rate);
    var best = -Infinity, bi = -1;
    for (var i = lo; i <= hi && i < buf.length - 1; i++) if (buf[i] > best) { best = buf[i]; bi = i; }
    if (bi < 1 || best < QUIET) return 0;

    // Сумма децибел = логарифм произведения амплитуд. Для гармоник берём
    // максимум из трёх соседних полос: частота 2f редко попадает ровно в полосу.
    var near = function (k) {
      if (k + 1 >= buf.length) return -140;
      return Math.max(buf[k - 1], buf[k], buf[k + 1]);
    };
    var hb = -1, hs = -Infinity;
    for (var j = lo; j <= hi && 3 * j + 1 < buf.length; j++) {
      var s = buf[j] + near(2 * j) + near(3 * j);
      if (s > hs) { hs = s; hb = j; }
    }
    // Кандидат должен сам звучать заметно — иначе это совпадение шума.
    if (hb < 1 || buf[hb] < best - 30) hb = bi;
    return refine(buf, hb) * rate / n;
  }

  /* Картинка спектра: логарифмическая ось частот, громкость от −100 до −20 дБ,
     найденный тон — пунктирной линией. */
  function draw(canvas, buf, rate, n, minHz, maxHz, peakHz, ticks) {
    var w = canvas.clientWidth || 280, H = 78;
    var dpr = Math.min(window.devicePixelRatio || 1, 3);
    if (canvas.width !== Math.round(w * dpr)) {
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(H * dpr);
      canvas.style.height = H + 'px';
    }
    var c = canvas.getContext('2d');
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    c.clearRect(0, 0, w, H);
    var css = getComputedStyle(document.documentElement);
    var accent = css.getPropertyValue('--accent').trim() || '#426D4F';
    var warn = css.getPropertyValue('--warn').trim() || '#A96C08';
    var muted = css.getPropertyValue('--text-3').trim() || '#66766C';
    var lmin = Math.log(minHz), lmax = Math.log(maxHz);
    var xHz = function (f) { return (Math.log(Math.max(f, minHz)) - lmin) / (lmax - lmin) * w; };
    var Y = function (db) { return H - 14 - A.u.clamp((db + 100) / 80, 0, 1) * (H - 20); };
    var lo = Math.floor(minHz * n / rate), hi = Math.ceil(maxHz * n / rate);
    c.beginPath();
    c.moveTo(0, H - 14);
    for (var i = lo; i <= hi && i < buf.length; i++) c.lineTo(xHz(i * rate / n), Y(buf[i]));
    c.lineTo(w, H - 14);
    c.closePath();
    c.fillStyle = accent; c.globalAlpha = 0.28; c.fill();
    c.globalAlpha = 1; c.strokeStyle = accent; c.lineWidth = 1.5; c.stroke();
    c.fillStyle = muted; c.font = '10px system-ui, sans-serif'; c.textBaseline = 'alphabetic';
    (ticks || [100, 300, 1000, 2000]).forEach(function (f, k, all) {
      var last = k === all.length - 1;
      // крайняя правая подпись прижимается к краю, а не обрезается
      c.textAlign = last ? 'right' : 'center';
      c.fillText(A.u.hz(f), last ? w - 4 : A.u.clamp(xHz(f), 16, w - 16), H - 3);
    });
    if (peakHz > 0) {
      var px = xHz(peakHz);
      c.strokeStyle = warn; c.lineWidth = 2; c.setLineDash([4, 3]);
      c.beginPath(); c.moveTo(px, 2); c.lineTo(px, H - 14); c.stroke();
      c.setLineDash([]);
    }
  }

  A.sound = { fundamental: fundamental, draw: draw, refine: refine, QUIET: QUIET };
})(window.A);
