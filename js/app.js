/* Главный экран и переходы между ним и опытами. */

window.A = window.A || {};

(function (A) {
  'use strict';

  var h = A.h;
  var route = 'home';

  // Опыты, которых пока нет в приложении: показываем честно, что они впереди,
  // а не делаем вид, будто продукт больше, чем он есть.
  var SOON = [
    { icon: '🎵', title: 'Высота звука', subject: 'Физика звука', gear: 'Микрофон, бутылка и вода' },
    { icon: '❤️', title: 'Пульс камерой', subject: 'Биология', gear: 'Камера' },
    { icon: '🕰', title: 'Маятник и g', subject: 'Механика', gear: 'Нитка и ластик' }
  ];

  function labCard(lab) {
    var done = A.store.result(lab.id).done;
    var meta = h('div.labcard__meta', [
      h('span.tag', { text: lab.subject }),
      h('span.tag.tag--gear', { text: lab.gear })
    ]);
    if (done) meta.appendChild(h('span.tag.tag--done', ['✓ открыто']));

    return h('button.labcard', {
      type: 'button',
      onclick: function () { go('lab:' + lab.id); }
    }, [
      h('div.labcard__icon', [A.raw(lab.icon)]),
      h('div', [
        h('div.labcard__t', { text: lab.title }),
        h('div.labcard__s', { text: lab.question }),
        meta
      ])
    ]);
  }

  function soonCard(s) {
    return h('div.labcard.labcard--soon', [
      h('div.labcard__icon', [A.raw(s.icon)]),
      h('div', [
        h('div.labcard__t', { text: s.title }),
        h('div.labcard__s', { text: 'Появится в следующей версии' }),
        h('div.labcard__meta', [
          h('span.tag', { text: s.subject }),
          h('span.tag.tag--soon', { text: s.gear })
        ])
      ])
    ]);
  }

  function home() {
    var view = document.getElementById('view');
    A.u.clear(view);

    view.appendChild(h('section.hero', [
      h('h1', [A.raw(A.i18n.t('В твоём телефоне уже есть') + ' '), h('em', { text: 'лаборатория' })]),
      h('p', ['Микрофон, камера и динамик — это настоящие измерительные приборы. Здесь нет ни одного чужого числа: каждую цифру на экране измеришь ты сам.'])
    ]));

    view.appendChild(h('div.score', [
      h('div.score__n', [A.raw(A.store.openedCount() + '/' + A.labs.length)]),
      h('div.score__t', ['Открыто законов. Формулу мы не показываем — ты выводишь её сам из своих же данных.'])
    ]));

    view.appendChild(h('div.section-title', ['Опыты']));
    var list = h('div.labs');
    A.labs.forEach(function (lab) { list.appendChild(labCard(lab)); });
    view.appendChild(list);

    view.appendChild(h('div.section-title', ['Скоро']));
    var soon = h('div.labs');
    SOON.forEach(function (s) { soon.appendChild(soonCard(s)); });
    view.appendChild(soon);

    view.appendChild(h('footer.foot', [
      h('div', ['QaltaLab · зертхана қалтаңда']),
      h('div', ['Проект хакатона WIT Teens Challenge 2026 · кейс «STEM без сложного оборудования»'])
    ]));

    window.scrollTo(0, 0);
  }

  function go(next) {
    route = next;
    render();
  }

  function render() {
    if (route.indexOf('lab:') === 0) {
      A.lab.open(route.slice(4));
    } else {
      A.lab.cleanup();
      home();
    }
    paintLang();
  }

  function paintLang() {
    var box = document.getElementById('lang');
    if (!box) return;
    var kids = box.querySelectorAll('button');
    for (var i = 0; i < kids.length; i++) {
      var on = kids[i].getAttribute('data-lang') === A.i18n.lang;
      kids[i].classList.toggle('is-on', on);
      kids[i].setAttribute('aria-pressed', on ? 'true' : 'false');
    }
  }

  function init() {
    A.i18n.init();
    A.store.load();

    document.getElementById('home').addEventListener('click', function () { go('home'); });
    document.getElementById('lang').addEventListener('click', function (e) {
      var b = e.target.closest('button[data-lang]');
      if (b) A.i18n.set(b.getAttribute('data-lang'));
    });

    render();
  }

  A.app = { go: go, render: render, init: init };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})(window.A);
