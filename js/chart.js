/* График: точки школьника и кривая, которую он подбирает.
   Рисуем на canvas в логических координатах, а битмап держим в реальных
   пикселях устройства — иначе на телефоне линии мылятся. */

window.A = window.A || {};

(function (A) {
  'use strict';

  // Цвета берём из темы, а не зашиваем: график должен читаться и на светлом,
  // и на тёмном фоне, а тему пользователь переключает на лету.
  function palette() {
    var s = getComputedStyle(document.documentElement);
    var v = function (name, fallback) {
      return (s.getPropertyValue(name) || '').trim() || fallback;
    };
    return {
      grid: v('--line', '#E7E9EE'),
      axis: v('--text-3', '#8A93A3'),
      text: v('--text-3', '#8A93A3'),
      point: v('--text', '#0E1420'),
      pointEdge: v('--bg-soft', '#F6F7F9'),
      curve: v('--accent', '#2563EB'),
      pred: v('--warn', '#A96C08')
    };
  }

  function Chart(host, opts) {
    this.opts = opts || {};
    this.points = [];
    this.fn = null;
    this.canvas = A.h('canvas.chart');
    host.appendChild(this.canvas);
    this.ctx = this.canvas.getContext('2d');

    var self = this;
    this._resize = function () { self.resize(); };
    window.addEventListener('resize', this._resize);
    this.resize();
  }

  Chart.prototype.destroy = function () {
    window.removeEventListener('resize', this._resize);
  };

  Chart.prototype.resize = function () {
    var w = this.canvas.clientWidth || 320;
    var h = Math.round(Math.min(Math.max(w * 0.62, this.opts.minH || 180), this.opts.maxH || 260));
    var dpr = Math.min(window.devicePixelRatio || 1, 3);
    this.canvas.style.height = h + 'px';
    this.canvas.width = Math.round(w * dpr);
    this.canvas.height = Math.round(h * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.w = w; this.h = h;
    this.draw();
  };

  Chart.prototype.set = function (points, fn, ghost, pred) {
    this.points = points || [];
    this.fn = fn || null;
    this.ghost = ghost || null;   // точки предыдущей серии — для сравнения условий
    this.pred = pred || null;     // нарисованное до опыта предсказание — пунктиром
    this.draw();
  };

  // Границы по данным с небольшим полем, но с уважением к заданным пределам.
  Chart.prototype.bounds = function () {
    var o = this.opts, p = this.points;
    var xs = [], ys = [];
    for (var i = 0; i < p.length; i++) { xs.push(p[i].x); ys.push(p[i].y); }
    if (this.ghost) for (var g = 0; g < this.ghost.length; g++) { xs.push(this.ghost[g].x); ys.push(this.ghost[g].y); }
    // Предсказание тоже должно поместиться: иначе промах интуиции уйдёт за край.
    if (this.pred) for (var q = 0; q < this.pred.length; q++) { xs.push(this.pred[q].x); ys.push(this.pred[q].y); }
    if (o.xMin !== undefined) xs.push(o.xMin);
    if (o.xMax !== undefined) xs.push(o.xMax);
    if (o.yMin !== undefined) ys.push(o.yMin);
    if (o.yMax !== undefined) ys.push(o.yMax);
    if (!xs.length) { xs = [0, 1]; ys = [0, 1]; }
    var x0 = Math.min.apply(null, xs), x1 = Math.max.apply(null, xs);
    var y0 = Math.min.apply(null, ys), y1 = Math.max.apply(null, ys);
    if (x1 === x0) x1 = x0 + 1;
    if (y1 === y0) y1 = y0 + 1;
    var padY = (y1 - y0) * 0.12;
    // Поле снизу не должно уводить ось ниже заданного минимума: «−0,2 с» у
    // времени или частоты выглядит как ошибка.
    var lo = y0 - padY;
    if (o.yMin !== undefined && lo < o.yMin) lo = o.yMin;
    return { x0: x0, x1: x1, y0: lo, y1: y1 + padY };
  };

  Chart.prototype.draw = function () {
    var c = this.ctx, o = this.opts;
    if (!c) return;
    var CSS = palette();
    var W = this.w, H = this.h;
    var L = 42, R = 22, T = 12, B = 30;
    c.clearRect(0, 0, W, H);

    var b = this.bounds();
    var logX = !!o.logX;
    var fx = function (v) {
      var t = logX
        ? (Math.log(v) - Math.log(b.x0)) / (Math.log(b.x1) - Math.log(b.x0))
        : (v - b.x0) / (b.x1 - b.x0);
      return L + t * (W - L - R);
    };
    var fy = function (v) {
      var t = (v - b.y0) / (b.y1 - b.y0);
      return H - B - t * (H - T - B);
    };

    // сетка
    c.strokeStyle = CSS.grid;
    c.lineWidth = 1;
    c.font = '11px system-ui, sans-serif';
    c.fillStyle = CSS.text;
    c.textAlign = 'right';
    c.textBaseline = 'middle';
    for (var i = 0; i <= 4; i++) {
      var yv = b.y0 + (b.y1 - b.y0) * i / 4;
      var y = Math.round(fy(yv)) + 0.5;
      c.beginPath(); c.moveTo(L, y); c.lineTo(W - R, y); c.stroke();
      c.fillText(o.yFmt ? o.yFmt(yv) : A.u.num(yv, 0), L - 8, y);
    }

    // подписи по X
    c.textAlign = 'center';
    c.textBaseline = 'top';
    var ticks = o.xTicks || [b.x0, (b.x0 + b.x1) / 2, b.x1];
    for (var k = 0; k < ticks.length; k++) {
      var xv = ticks[k];
      if (xv < b.x0 || xv > b.x1) continue;
      var x = fx(xv);
      c.fillText(o.xFmt ? o.xFmt(xv) : A.u.num(xv, 0), x, H - B + 8);
    }

    // оси
    c.strokeStyle = CSS.axis;
    c.beginPath();
    c.moveTo(L, T); c.lineTo(L, H - B); c.lineTo(W - R, H - B);
    c.stroke();

    // кривая подгонки
    if (this.fn) {
      c.strokeStyle = CSS.curve;
      c.lineWidth = 2.5;
      c.beginPath();
      var started = false;
      for (var px = L; px <= W - R; px++) {
        var t = (px - L) / (W - L - R);
        var vx = logX
          ? Math.exp(Math.log(b.x0) + t * (Math.log(b.x1) - Math.log(b.x0)))
          : b.x0 + t * (b.x1 - b.x0);
        var vy = this.fn(vx);
        if (!isFinite(vy)) { started = false; continue; }
        var py = fy(vy);
        if (py < T - 40 || py > H - B + 40) { started = false; continue; }
        if (!started) { c.moveTo(px, py); started = true; } else c.lineTo(px, py);
      }
      c.stroke();
    }

    // предсказание — пунктиром; разрыв в рисунке остаётся разрывом
    if (this.pred && this.pred.length > 1) {
      c.save();
      c.strokeStyle = CSS.pred;
      c.lineWidth = 2.5;
      c.setLineDash([7, 6]);
      c.lineCap = 'round';
      c.beginPath();
      var gap = (W - L - R) * 0.06, lastX = null;
      for (var r = 0; r < this.pred.length; r++) {
        var X = fx(this.pred[r].x), Y = fy(this.pred[r].y);
        if (lastX === null || X - lastX > gap) c.moveTo(X, Y); else c.lineTo(X, Y);
        lastX = X;
      }
      c.stroke();
      c.restore();
    }

    // предыдущая серия — бледными кружками, чтобы было видно, что изменилось
    if (this.ghost) {
      for (var q = 0; q < this.ghost.length; q++) {
        var gp = this.ghost[q];
        c.beginPath();
        c.arc(fx(gp.x), fy(gp.y), 4.5, 0, Math.PI * 2);
        c.strokeStyle = CSS.axis;
        c.lineWidth = 1.6;
        c.stroke();
      }
    }

    // точки поверх кривой — данные важнее модели
    for (var j = 0; j < this.points.length; j++) {
      var p = this.points[j];
      var cx = fx(p.x), cy = fy(p.y);
      c.beginPath();
      c.arc(cx, cy, 5.5, 0, Math.PI * 2);
      c.fillStyle = CSS.point;
      c.fill();
      c.lineWidth = 2.5;
      c.strokeStyle = CSS.pointEdge;
      c.stroke();
    }
  };

  A.Chart = Chart;
})(window.A);
