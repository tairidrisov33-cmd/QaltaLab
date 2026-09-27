/* Опыт «Чувство времени».
   Без часов и без счёта отмерить 2, 4, 8 и 16 секунд. Внутренние часы у
   каждого идут со своей скоростью, и эта скорость постоянна: кто спешит на
   двух секундах, спешит и на шестнадцати в той же пропорции.

   Нужен только экран. */

(function (A) {
  'use strict';

  var h = A.h;
  var TARGETS = [2, 4, 8, 16];

  function measure(host, api) {
    var idx = 0, t0 = 0, running = false;
    var points = [];

    var readout = h('div.readout');
    var hint = h('div.pad__hint');
    var ring = h('div.timering', [h('i')]);
    var stage = h('div.pad', [h('div', { style: { width: '100%' } }, [readout, hint, ring])]);
    var bar = h('i');
    var progress = h('div.match__bar', { style: { marginTop: '18px' } }, [bar]);
    var mainBtn = h('button.btn.btn--primary.btn--wide', { type: 'button', onclick: onMain }, ['Старт']);
    var table = h('div');

    host.appendChild(h('h2.lab-h', ['Чувство времени']));
    host.appendChild(h('p.lab-q', ['Нажми «Старт», а когда по твоим ощущениям пройдёт нужное число секунд — «Стоп». Часов на экране нет, и считать про себя нельзя.']));
    host.appendChild(stage);
    host.appendChild(progress);
    host.appendChild(h('div.btn-row', [mainBtn]));
    host.appendChild(table);
    host.appendChild(h('p.note', ['Не считай «раз-и, два-и»: тогда измеряешь счёт, а не чувство времени. Просто дождись момента, когда покажется, что пора.']));

    paint();

    function paint() {
      var target = TARGETS[idx];
      readout.textContent = target + ' ';
      readout.appendChild(h('small', ['с']));
      hint.textContent = running
        ? A.i18n.t('Идёт… жми «Стоп», когда почувствуешь')
        : A.i18n.fmt('Отмерь {s} секунд · замер {n} из {m}', { s: target, n: idx + 1, m: TARGETS.length });
      ring.classList.toggle('is-on', running);
      bar.style.width = (idx / TARGETS.length * 100) + '%';
    }

    function onMain() {
      if (!running) {
        running = true;
        t0 = performance.now();
        mainBtn.textContent = A.i18n.t('Стоп');
        paint();
        return;
      }
      var got = (performance.now() - t0) / 1000;
      running = false;
      points.push({ x: TARGETS[idx], y: Math.round(got * 100) / 100 });
      paintTable();
      idx++;
      if (idx >= TARGETS.length) {
        api.setPoints(points);
        api.done();
        return;
      }
      mainBtn.textContent = A.i18n.t('Старт');
      paint();
    }

    function paintTable() {
      A.u.clear(table);
      var t = h('table.points');
      t.appendChild(h('thead', [h('tr', [h('th', ['Нужно, с']), h('th', ['Вышло, с'])])]));
      var body = h('tbody');
      points.forEach(function (p) {
        body.appendChild(h('tr', [h('td', [A.raw(String(p.x))]), h('td', [A.raw(A.u.num(p.y, 2))])]));
      });
      t.appendChild(body);
      table.appendChild(t);
    }

    return function () { running = false; };
  }

  A.labs.push({
    id: 'timing',
    icon: 'clock',
    title: 'Чувство времени',
    subject: 'Биология · Восприятие',
    gear: 'Нужен только экран',

    question: 'Твои внутренние часы спешат или отстают — и одинаково ли на коротких и длинных отрезках?',
    intro: 'Мозг отмеряет время без всяких часов, и у каждого они идут со своей скоростью. Сейчас узнаешь, насколько твои «внутренние секунды» совпадают с настоящими.',
    howto: [
      'Нажми «Старт» и жди, не глядя ни на какие часы.',
      'Когда покажется, что прошло нужное время — жми «Стоп».',
      'Будет четыре отрезка: 2, 4, 8 и 16 секунд.',
      'Не считай про себя — просто почувствуй момент.'
    ],
    warn: 'Опыт короткий, около полуминуты. Если отвлёкся посреди отрезка — пройди опыт заново, иначе точка будет случайной.',

    hypotheses: [
      { id: 'prop', text: 'Ошибаюсь в одну сторону и всегда в одной пропорции' },
      { id: 'const', text: 'Ошибаюсь на одну и ту же долю секунды на любом отрезке' },
      { id: 'exact', text: 'Попаду почти точно, внутренние часы у меня верные' }
    ],

    chart: {
      xMin: 0, yMin: 0,
      xTicks: [2, 4, 8, 16],
      xFmt: function (v) { return Math.round(v) + ' с'; },
      yFmt: function (v) { return Math.round(v) + ''; }
    },

    models: [
      {
        id: 'prop',
        label: 'T = k · t',
        params: [{
          key: 'k', label: 'Скорость внутренних часов k', min: 0.4, max: 1.8, step: 0.01,
          init: function (p) {
            if (!p.length) return 1;
            var s = 0; p.forEach(function (q) { s += q.y / q.x; });
            return Math.max(0.4, Math.min(1.8, s / p.length));
          },
          fmt: function (v) { return A.u.num(v, 2); }
        }],
        fn: function (p, t) { return p.k * t; }
      },
      {
        id: 'shift',
        label: 'T = t + c',
        params: [{ key: 'c', label: 'Постоянная ошибка, с', min: -4, max: 4, step: 0.05, init: 0, fmt: function (v) { return A.u.num(v, 2); } }],
        fn: function (p, t) { return t + p.c; }
      }
    ],

    reveal: function (c) {
      var good = c.model.id === 'prop' && c.match >= 60;
      var k = c.model.id === 'prop' ? c.params.k : null;
      var how = k === null ? '' : k > 1.05
        ? A.i18n.fmt('Твои часы <b>отстают</b>: ты отмеряешь в {k} раза больше, чем нужно. Минута по ощущениям длится у тебя дольше настоящей.', { k: A.u.num(k, 2) })
        : k < 0.95
          ? A.i18n.fmt('Твои часы <b>спешат</b>: ты жмёшь «Стоп» раньше — вместо минуты отмеряешь около {s} секунд.', { s: Math.round(k * 60) })
          : A.i18n.t('Твои внутренние часы идут почти точно — редкий результат.');
      return {
        kicker: A.i18n.t(good ? 'Твои данные поддерживают модель' : 'Что говорит исследование'),
        name: A.i18n.t('Скалярный закон времени'),
        formula: 'T = k · t',
        who: A.i18n.t('<b>Закон Вебера для времени.</b> Ошибка в оценке интервала растёт вместе с самим интервалом: кто ошибся на десятую долю на двух секундах, ошибётся на ту же долю и на шестнадцати. Это свойство называют скалярностью, и оно наблюдается у людей, крыс и голубей одинаково.'),
        you: good
          ? A.i18n.fmt('Прямая через ноль описала точки с R² = {r}%. {how}', { r: c.match, how: how })
          : A.i18n.t('Точки легли неровно — скорее всего, на каком-то отрезке ты отвлёкся или начал считать. Повтори опыт в тишине.')
      };
    },

    verdict: function (c) {
      if (c.model.id !== 'prop' || c.match < 60) {
        return { inconclusive: true, ok: false, text: A.i18n.t('По этим четырём точкам нельзя уверенно судить. Повтори опыт, не отвлекаясь и не считая про себя.') };
      }
      var k = c.params.k;
      if (c.hyp === 'prop') {
        return { ok: true, text: A.i18n.t('Верно: ошибка растёт вместе с интервалом, а доля ошибки остаётся той же. Именно это и называют скалярностью восприятия времени.') };
      }
      if (c.hyp === 'const') {
        return { ok: false, text: A.i18n.t('Постоянной ошибки не вышло: на длинных отрезках ты промахнулся сильнее, чем на коротких. Ошибка растёт пропорционально, а не держится на месте.') };
      }
      return Math.abs(k - 1) < 0.05
        ? { ok: true, text: A.i18n.t('И правда почти точно — коэффициент близок к единице. Такое встречается нечасто.') }
        : { ok: false, text: A.i18n.fmt('Точно не вышло: твой коэффициент {k}. Почти ни у кого внутренние часы не идут ровно — и это нормально.', { k: A.u.num(k, 2) }) };
    },

    explain: 'Внутренние часы спешат или отстают в одной и той же пропорции на любом отрезке. Поэтому точки ложатся на прямую из нуля, а её наклон k — скорость твоих часов.',

    variants: ['с закрытыми глазами', 'после десяти приседаний', 'под музыку'],

    measure: measure
  });
})(window.A);
