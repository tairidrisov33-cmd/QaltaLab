/* Главный экран, тема оформления и переходы между экранами. */

window.A = window.A || {};

(function (A) {
  'use strict';

  var h = A.h;
  var route = 'home';
  var theme = 'light';

  // Опыты, которых пока нет: показываем честно, что они впереди, а не делаем
  // вид, будто продукт больше, чем он есть.
  var SOON = [
    { icon: '🎵', title: 'Высота звука', subject: 'Физика звука', gear: 'Микрофон, бутылка и вода' },
    { icon: '❤️', title: 'Пульс камерой', subject: 'Биология', gear: 'Камера' },
    { icon: '🕰', title: 'Маятник и g', subject: 'Механика', gear: 'Нитка и ластик' }
  ];

  // На чём основан продукт. Это не украшение: каждый опыт и сам порядок шагов
  // взяты из конкретных исследований, а не придуманы.
  var SOURCES = [
    {
      t: 'Активное обучение работает лучше лекции — и студенты этого не замечают',
      w: 'Гарвардский университет · PNAS, 2019',
      d: 'Deslauriers, McCarty, Callaghan, Kestin, Miller. Студенты на занятиях с активным обучением усваивают материал заметно лучше, хотя субъективно им кажется, что они выучили меньше: думать тяжелее, чем слушать. Отсюда наш вывод — школьнику нужно дать действие, а не объяснение.'
    },
    {
      t: 'Активное обучение снижает долю несдавших в естественных науках',
      w: 'PNAS, 2014 · обзор 225 исследований',
      d: 'Freeman и соавторы. Метаанализ по курсам математики, инженерии и естественных наук: доля несдавших падает, средние баллы растут. Это основание для того, чтобы вообще строить продукт вокруг опыта, а не вокруг теории.'
    },
    {
      t: 'Закон Хика: время выбора растёт как логарифм числа вариантов',
      w: 'W. E. Hick, 1952 · R. Hyman, 1953',
      d: 'Quarterly Journal of Experimental Psychology и Journal of Experimental Psychology. Опыт «Скорость мысли» воспроизводит именно эту работу, и школьник получает ту же зависимость на своих данных.'
    },
    {
      t: 'Пороги слышимости и их зависимость от возраста',
      w: 'Стандарт ISO 7029',
      d: 'Международный стандарт описывает статистическое распределение порогов слуха по возрасту. Эталонная кривая в опыте «Твой слух» опирается на эту закономерность: верхняя граница слуха закономерно опускается с годами.'
    },
    {
      t: 'Телефон как измерительный прибор в школьной физике',
      w: 'RWTH Aachen University · проект phyphox',
      d: 'Немецкий университет уже несколько лет использует датчики смартфона для школьных и студенческих опытов. Это подтверждает главный тезис QaltaLab: прибор у школьника уже есть.'
    },
    {
      t: 'Схема «предскажи — проверь — объясни»',
      w: 'White & Gunstone, Probing Understanding, 1992',
      d: 'Классическая методика: ученик сначала записывает предсказание, потом ставит опыт, потом объясняет расхождение. Наши шаги «гипотеза» и «разбор гипотезы» сделаны по ней, поэтому ошибка у нас разбирается, а не засчитывается как поражение.'
    }
  ];

  /* ---------- тема ---------- */

  var SUN = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M19.1 4.9l-1.4 1.4M6.3 17.7l-1.4 1.4"/></svg>';
  var MOON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>';

  function applyTheme() {
    document.documentElement.setAttribute('data-theme', theme);
    var meta = document.querySelector('meta[name=theme-color]');
    if (meta) meta.setAttribute('content', theme === 'dark' ? '#0E1116' : '#FFFFFF');
    var btn = document.getElementById('theme');
    if (btn) btn.innerHTML = theme === 'dark' ? SUN : MOON;
  }

  function setTheme(next) {
    theme = next === 'dark' ? 'dark' : 'light';
    try { localStorage.setItem('spl.theme', theme); } catch (e) {}
    applyTheme();
  }

  /* ---------- карточки ---------- */

  function labCard(lab, i) {
    var done = A.store.result(lab.id).done;
    var meta = h('div.labcard__meta', [
      h('span.tag', { text: lab.subject }),
      h('span.tag.tag--gear', { text: lab.gear })
    ]);
    if (done) meta.appendChild(h('span.tag.tag--done', ['✓ открыто']));

    var card = h('button.labcard', {
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
    card.style.setProperty('--i', i);
    return card;
  }

  function soonCard(s, i) {
    var card = h('div.labcard.labcard--soon', [
      h('div.labcard__icon', [A.raw(s.icon)]),
      h('div', [
        h('div.labcard__t', { text: s.title }),
        h('div.labcard__s', { text: 'Появится в следующей версии' }),
        h('div.labcard__meta', [
          h('span.tag', { text: s.subject }),
          h('span.tag', { text: s.gear })
        ])
      ])
    ]);
    card.style.setProperty('--i', i);
    return card;
  }

  function sourceRow(s, i) {
    var row = h('div.src', [
      h('div.src__t', { text: s.t }),
      h('div.src__w', { text: s.w }),
      h('div.src__d', { text: s.d })
    ]);
    row.style.setProperty('--i', i);
    return row;
  }

  /* ---------- главный экран ---------- */

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
    A.labs.forEach(function (lab, i) { list.appendChild(labCard(lab, i)); });
    view.appendChild(list);

    view.appendChild(h('div.section-title', ['Скоро']));
    var soon = h('div.labs');
    SOON.forEach(function (s, i) { soon.appendChild(soonCard(s, i)); });
    view.appendChild(soon);

    view.appendChild(h('div.section-title', ['На чём это основано']));
    var src = h('div.sources');
    SOURCES.forEach(function (s, i) { src.appendChild(sourceRow(s, i)); });
    view.appendChild(src);

    view.appendChild(h('footer.foot', [
      h('div', ['QaltaLab · зертхана қалтаңда']),
      h('div', ['Проект хакатона WIT Teens Challenge 2026 · кейс «STEM без сложного оборудования»'])
    ]));

    window.scrollTo(0, 0);
  }

  /* ---------- переходы ---------- */

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

    var saved = null;
    try { saved = localStorage.getItem('spl.theme'); } catch (e) {}
    theme = saved === 'dark' ? 'dark' : 'light';   // светлая по умолчанию
    applyTheme();

    document.getElementById('home').addEventListener('click', function () { go('home'); });
    document.getElementById('theme').addEventListener('click', function () {
      setTheme(theme === 'dark' ? 'light' : 'dark');
    });
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
