/* График: точки школьника и кривая, которую он подбирает.
   Рисуем на canvas в логических координатах, а битмап держим в реальных
   пикселях устройства — иначе на телефоне линии мылятся. */

window.A = window.A || {};

(function (A) {
  'use strict';

  var CSS = {
    grid: '#232B4A',
    axis: '#3A4468',
    text: '#7D88A8',
    point: '#22D3EE',
    pointEdge: '#0B1020',
    curve: '#A78BFA'
  };

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
    var h = Math.round(Math.min(Math.max(w * 0.62, 180), 260));
    var dpr = Math.min(window.devicePixelRatio || 1, 3);
    this.canvas.style.height = h + 'px';
    this.canvas.width = Math.round(w * dpr);
    this.canvas.height = Math.round(h * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.w = w; this.h = h;
    this.draw();
  };

  Chart.prototype.set = function (points, fn) {
    this.points = points || [];
    this.fn = fn || null;
    this.draw();
  };

  // Границы по данным с небольшим полем, но с уважением к заданным пределам.
  Chart.prototype.bounds = function () {
    var o = this.opts, p = this.points;
    var xs = [], ys = [];
    for (var i = 0; i < p.length; i++) { xs.push(p[i].x); ys.push(p[i].y); }
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
    return { x0: x0, x1: x1, y0: y0 - padY, y1: y1 + padY };
  };

  Chart.prototype.draw = function () {
    var c = this.ctx, o = this.opts;
    if (!c) return;
    var W = this.w, H = this.h;
    var L = 42, R = 12, T = 12, B = 30;
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
