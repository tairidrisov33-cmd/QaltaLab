/* Знаки-достижения: у каждого опыта свой мотив казахского орнамента.
   Открыл закон — знак попадает в коллекцию на главной, а на экране
   результата появляется «Новый знак». Это ответ на отзыв пилотного теста
   «больше игровых элементов»: игра есть, но награда — за научный результат,
   а не за клики. Прогресс берётся из A.store (браузер, без аккаунта). */

window.A = window.A || {};

(function (A) {
  'use strict';

  var h = A.h;
  // опыт → мотив (js/orn.js), казахское название и перевод
  var MAP = {
    dombra: ['horn', 'Қошқар мүйіз', 'бараньи рога'],
    pitch: ['wave', 'Өркеш', 'волна'],
    pendulum: ['sun', 'Күн', 'солнце'],
    hearing: ['wing', 'Құс қанаты', 'крыло птицы'],
    timing: ['tumar', 'Тұмар', 'оберег'],
    hick: ['single', 'Сыңар мүйіз', 'одинарный рог'],
    fitts: ['rhomb', 'Ромб', 'ромб сырмака'],
    practice: ['sprout', 'Өсімдік', 'побег'],
    memory: ['camel', 'Түйе табан', 'верблюжий след'],
    pulse: ['shanyrak', 'Шаңырақ', 'купол юрты']
  };
  var ORDER = ['dombra', 'pitch', 'pendulum', 'hearing', 'timing', 'hick', 'fitts', 'practice', 'memory', 'pulse'];

  function earned(id) { return !!(A.store && A.store.result(id).done); }
  function count() { return ORDER.filter(earned).length; }

  function medal(id, big) {
    var m = MAP[id];
    var on = earned(id);
    return h('span.badge' + (on ? '.is-on' : '') + (big ? '.badge--big' : ''), [A.orn ? A.orn(m[0]) : null]);
  }

  // Коллекция на главной: десять знаков, полученные — цветом.
  function shelf(go) {
    var n = count();
    var grid = h('div.shelf__grid');
    ORDER.forEach(function (id, i) {
      var lab = A.lab.byId(id), m = MAP[id];
      if (!lab) return;
      var b = h('button.shelf__item' + (earned(id) ? '.is-on' : ''), {
        type: 'button', title: A.i18n.t(lab.title), onclick: function () { go('lab:' + id); }
      }, [medal(id), h('b', [A.raw(m[1])]), h('span', { text: lab.title })]);
      b.style.setProperty('--i', i);
      grid.appendChild(b);
    });
    var bar = h('i');
    bar.style.width = (n * 10) + '%';
    return h('div.shelf', { id: 'badges' }, [
      h('div.shelf__head', [
        h('div', [
          h('b.shelf__t', ['Коллекция знаков']),
          h('p.shelf__d', ['Открой закон в опыте — получи знак казахского орнамента. Знаки хранятся только в твоём браузере.'])
        ]),
        h('div.shelf__n', [A.raw(n + ' / ' + ORDER.length)])
      ]),
      h('div.shelf__bar', [bar]),
      grid
    ]);
  }

  // Карточка на экране результата: новый знак или напоминание, какой он у опыта.
  function card(id, fresh, go) {
    var m = MAP[id];
    if (!m || !earned(id)) return null;
    var n = count();
    return h('div.newbadge' + (fresh ? '.is-fresh' : ''), [
      medal(id, true),
      h('div', [
        h('span.newbadge__k', [fresh ? 'Новый знак в коллекции' : 'Знак этого опыта']),
        h('b.newbadge__t', [A.raw(m[1] + ' · '), h('span', { text: m[2] })]),
        h('p.newbadge__d', [A.raw(A.i18n.fmt(n === ORDER.length ? 'Собраны все {m} знаков — вся коллекция!' : 'Собрано {n} из {m}. Каждый новый опыт — новый знак.', { n: n, m: ORDER.length }))]),
        h('button.linkbtn', { type: 'button', onclick: function () { go(); } }, ['Смотреть коллекцию'])
      ])
    ]);
  }

  A.badges = { shelf: shelf, card: card, count: count, MAP: MAP };
})(window.A);
