/* Живой визуал в шапке главной.
   Вместо стоковой фотографии показываем то, чем продукт и является: точки
   измерения появляются одна за другой, потом под них ложится кривая и
   считается совпадение. Картинка честная — это настоящие числа опыта
   «Скорость мысли», а не рисунок. */

window.A = window.A || {};

(function (A) {
  'use strict';

  var DATA = [
    { x: 1, y: 282 },
    { x: 2, y: 331 },
    { x: 4, y: 376 },
    { x: 8, y: 424 }
  ];
  var A0 = 232, B0 = 64;   // T = a + b*log2(n+1)

  function model(n) { return A0 + B0 * (Math.log(n + 1) / Math.LN2); }

  function create(host, onR2) {
    var canvas = document.createElement('canvas');
    host.appendChild(canvas);
    var ctx = canvas.getContext('2d');
    var w = 0, hgt = 0, raf = 0, t0 = performance.now();

    function size() {
      w = canvas.clientWidth || 300;
      hgt = Math.round(Math.min(Math.max(w * 0.46, 128), 190));
      var dpr = Math.min(window.devicePixelRatio || 1, 3);
      canvas.style.height = hgt + 'px';
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(hgt * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function css(name, fb) {
      var v = getComputedStyle(document.documentElement).getPropertyValue(name);
      return (v || '').trim() || fb;
    }

    // Плавный вход значения от 0 до 1 на отрезке времени [a, b].
    function seg(t, a, b) {
      if (t <= a) return 0;
      if (t >= b) return 1;
      var k = (t - a) / (b - a);
      return 1 - Math.pow(1 - k, 3);
    }

    function frame(now) {
      var t = ((now - t0) / 1000) % 9;        // цикл девять секунд
      var line = css('--line', '#E7E9EE');
      var accent = css('--accent', '#2563EB');
      var ink = css('--text', '#0E1420');
      var dim = css('--text-3', '#8A93A3');

      ctx.clearRect(0, 0, w, hgt);
      var L = 30, R = 12, T = 14, B = 22;
      var x0 = 0.6, x1 = 8.8, y0 = 200, y1 = 470;
      var fx = function (v) { return L + (Math.log(v) - Math.log(x0)) / (Math.log(x1) - Math.log(x0)) * (w - L - R); };
      var fy = function (v) { return hgt - B - (v - y0) / (y1 - y0) * (hgt - T - B); };

      // сетка
      ctx.strokeStyle = line;
      ctx.lineWidth = 1;
      for (var i = 0; i <= 3; i++) {
        var y = Math.round(fy(y0 + (y1 - y0) * i / 3)) + 0.5;
        ctx.beginPath(); ctx.moveTo(L, y); ctx.lineTo(w - R, y); ctx.stroke();
      }
      ctx.fillStyle = dim;
      ctx.font = '10px ' + css('--mono', 'monospace');
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillText('450', L - 6, fy(450));
      ctx.fillText('250', L - 6, fy(250));

      // кривая подгонки
      var grow = seg(t, 2.6, 4.8);
      if (grow > 0) {
        ctx.strokeStyle = accent;
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        var span = (w - L - R) * grow;
        var started = false;
        for (var px = L; px <= L + span; px++) {
          var k = (px - L) / (w - L - R);
          var vx = Math.exp(Math.log(x0) + k * (Math.log(x1) - Math.log(x0)));
          var py = fy(model(vx));
          if (!started) { ctx.moveTo(px, py); started = true; } else ctx.lineTo(px, py);
        }
        ctx.stroke();
      }

      // точки появляются по очереди
      for (var j = 0; j < DATA.length; j++) {
        var appear = seg(t, 0.35 + j * 0.42, 0.95 + j * 0.42);
        if (appear <= 0) continue;
        var p = DATA[j];
        var cx = fx(p.x), cy = fy(p.y);
        var r = 4.6 * appear;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fillStyle = ink;
        ctx.globalAlpha = appear;
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      if (onR2) onR2(Math.round(96 * seg(t, 2.8, 5.2)));
      raf = requestAnimationFrame(frame);
    }

    size();
    raf = requestAnimationFrame(frame);

    var onResize = function () { size(); };
    window.addEventListener('resize', onResize);

    return function () {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
    };
  }

  A.hero = { create: create };
})(window.A);
