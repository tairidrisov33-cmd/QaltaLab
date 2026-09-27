/* Главный экран, тема оформления и переходы.
   Главная сделана как лендинг: жюри и учитель попадают сюда первыми, и за
   полминуты должны понять проблему, решение и чем оно отличается. */

window.A = window.A || {};

(function (A) {
  'use strict';

  var h = A.h;
  var route = 'home';
  var theme = 'light';
  var heroStop = null;

  var LAB_ICON = { hearing: 'hearing', hick: 'bolt', pitch: 'wave' };

  var SOON = [
    { icon: 'heart', title: 'Пульс камерой', subject: 'Биология', gear: 'Камера' },
    { icon: 'pendulum', title: 'Маятник и g', subject: 'Механика', gear: 'Нитка и ластик' }
  ];

  var PROBLEM = [
    {
      n: '7 687',
      t: 'школ в Казахстане',
      d: 'По данным Бюро национальной статистики, в стране 7 687 общеобразовательных школ, и две трети из них — сельские.'
    },
    {
      n: '967',
      t: 'школ с современным кабинетом',
      d: 'К концу 2024 года современные кабинеты физики, химии, биологии и робототехники появились в 967 школах. Это примерно каждая восьмая.'
    },
    {
      n: '2029',
      t: 'год, к которому обещают остальным',
      d: 'Программа модернизации рассчитана на 1 300 школ до 2029 года. Тем, кто учится сейчас, ждать нечего: они закончат школу раньше.'
    }
  ];

  var HOW = [
    { t: 'Вопрос', d: 'Не «выучи параграф», а понятный вопрос: почему пустая бутылка гудит низко, а полная — высоко?' },
    { t: 'Гипотеза', d: 'Ученик записывает предсказание до опыта, и приложение его запоминает. Ошибиться здесь можно и нужно.', key: true },
    { t: 'Измерение', d: 'Телефон меряет по-настоящему: микрофон ловит частоту, динамик проверяет слух, экран — скорость реакции.' },
    { t: 'Подгонка', d: 'Формулы на экране нет. Ученик сам двигает ползунки, пока кривая не ляжет на его точки, а приложение честно считает совпадение.', key: true },
    { t: 'Открытие', d: 'Только теперь появляется имя закона, формула, учёный и год. И разбор: что ты предполагал и почему вышло иначе.' }
  ];

  var TECH = [
    { ic: 'wave', t: 'Быстрое преобразование Фурье', d: 'Звук с микрофона раскладывается на частоты, пик уточняется параболой по трём точкам — иначе частота прыгала бы ступеньками по 5 Гц.' },
    { ic: 'chart', t: 'Метод наименьших квадратов и R²', d: 'Совпадение кривой с точками — настоящий коэффициент детерминации, а не красивая цифра. Без этого «ты открыл закон» было бы обманом.' },
    { ic: 'spark', t: 'Датчики вместо оборудования', d: 'Web Audio API, микрофон, камера и акселерометр. Приборы, которые в школьной лаборатории стоят десятки тысяч тенге, уже лежат в кармане.' },
    { ic: 'flask', t: 'Работает без интернета и без установки', d: 'Ни сборщика, ни зависимостей, ни аккаунтов. Ссылка открывается на телефоне, ноутбуке и школьном ПК одинаково.' }
  ];

  var SOURCES = [
    {
      t: 'Активное обучение работает лучше лекции — и ученик этого не замечает',
      w: 'Гарвардский университет · PNAS, 2019',
      d: 'Deslauriers, McCarty, Callaghan, Kestin, Miller. Студенты на активных занятиях усваивают заметно больше, хотя субъективно им кажется, что меньше: думать тяжелее, чем слушать. Отсюда наш вывод — давать действие, а не объяснение.'
    },
    {
      t: 'Активное обучение снижает долю несдавших в STEM-курсах',
      w: 'PNAS, 2014 · метаанализ 225 исследований',
      d: 'Freeman и соавторы. Обзор по курсам математики, инженерии и естественных наук: доля несдавших падает, средние баллы растут.'
    },
    {
      t: 'Время выбора растёт как логарифм числа вариантов',
      w: 'W. E. Hick, 1952 · R. Hyman, 1953',
      d: 'Quarterly Journal of Experimental Psychology и Journal of Experimental Psychology. Опыт «Скорость мысли» воспроизводит эту работу, и школьник получает ту же зависимость на своих данных.'
    },
    {
      t: 'Пороги слышимости и их зависимость от возраста',
      w: 'Международный стандарт ISO 7029',
      d: 'Стандарт описывает статистическое распределение порогов слуха по возрасту. На этой закономерности построена эталонная кривая в опыте «Твой слух».'
    },
    {
      t: 'Датчики смартфона как учебный измерительный прибор',
      w: 'RWTH Aachen University · проект phyphox',
      d: 'Немецкий университет несколько лет использует сенсоры смартфона для школьных и студенческих опытов. Это подтверждает главный тезис QaltaLab.'
    },
    {
      t: 'Схема «предскажи — проверь — объясни»',
      w: 'White & Gunstone, Probing Understanding, 1992',
      d: 'Классическая методика: сначала предсказание, потом опыт, потом объяснение расхождения. По ней сделаны наши шаги гипотезы и разбора.'
    }
  ];

  var ROAD = [
    { t: 'Пульс камерой и маятник', d: 'Ещё два опыта на датчиках, которые есть в каждом телефоне.' },
    { t: 'Отчёт об опыте', d: 'Выгрузка гипотезы, таблицы и графика одним файлом — чтобы сдавать как лабораторную работу.' },
    { t: 'Режим класса', d: 'Учитель даёт код, тридцать телефонов дают один общий график: видно разброс, выбросы и то, как усреднение вытаскивает истину из шума.' },
    { t: 'Библиотека опытов', d: 'Движок один на все опыты, поэтому новый опыт — это один файл. Рост с трёх до тридцати упирается в контент, а не в код.' }
  ];

  /* ---------- тема ---------- */

  function applyTheme() {
    document.documentElement.setAttribute('data-theme', theme);
    var meta = document.querySelector('meta[name=theme-color]');
    if (meta) meta.setAttribute('content', theme === 'dark' ? '#0E1116' : '#FFFFFF');
    var btn = document.getElementById('theme');
    if (btn) { A.u.clear(btn); btn.appendChild(A.icon(theme === 'dark' ? 'sun' : 'moon')); }
  }

  function setTheme(next) {
    theme = next === 'dark' ? 'dark' : 'light';
    try { localStorage.setItem('spl.theme', theme); } catch (e) {}
    applyTheme();
  }

  /* ---------- кусочки ---------- */

  function chip(text, iconName, plain) {
    var c = h('span.chip' + (plain ? '.chip--plain' : ''));
    if (iconName) c.appendChild(A.icon(iconName));
    c.appendChild(document.createTextNode(A.i18n.t(text)));
    return c;
  }

  function stagger(node, i) { node.style.setProperty('--i', i); return node; }

  function secHead(eyebrow, title, lead) {
    var box = h('section.sec', [chip(eyebrow, null, true), h('h2.sec__h', { text: title })]);
    if (lead) box.appendChild(h('p.sec__lead', { text: lead }));
    return box;
  }

  function labCard(lab, i) {
    var done = A.store.result(lab.id).done;
    var meta = h('div.labcard__meta', [
      h('span.tag', { text: lab.subject }),
      h('span.tag.tag--gear', { text: lab.gear })
    ]);
    if (done) {
      var t = h('span.tag.tag--done');
      t.appendChild(A.icon('check'));
      t.appendChild(document.createTextNode(' ' + A.i18n.t('открыто')));
      meta.appendChild(t);
    }

    var card = h('button.labcard.labcard--has-go', {
      type: 'button',
      onclick: function () { go('lab:' + lab.id); }
    }, [
      h('div.labcard__icon', [A.icon(LAB_ICON[lab.id] || 'flask')]),
      h('div', [
        h('div.labcard__t', { text: lab.title }),
        h('div.labcard__s', { text: lab.question }),
        meta
      ]),
      h('div.labcard__go', [A.icon('arrow')])
    ]);
    return stagger(card, i);
  }

  function soonCard(s, i) {
    return stagger(h('div.labcard.labcard--soon', [
      h('div.labcard__icon', [A.icon(s.icon)]),
      h('div', [
        h('div.labcard__t', { text: s.title }),
        h('div.labcard__s', { text: 'Появится в следующей версии' }),
        h('div.labcard__meta', [
          h('span.tag', { text: s.subject }),
          h('span.tag', { text: s.gear })
        ])
      ])
    ]), i);
  }

  /* ---------- главный экран ---------- */

  function home() {
    var view = document.getElementById('view');
    A.u.clear(view);

    /* герой */
    var hero = h('section.hero', [
      chip('WIT Teens Challenge 2026 · кейс «STEM без оборудования»', 'spark'),
      h('h1', [
        A.raw(A.i18n.t('В твоём телефоне уже есть') + ' '),
        h('em', { text: 'лаборатория' })
      ]),
      h('p.hero__lead', ['Микрофон, камера и динамик — настоящие измерительные приборы. Здесь нет ни одного чужого числа: каждую цифру на экране измеришь ты сам, своим телефоном, у себя дома.'])
    ]);

    var startBtn = h('button.btn.btn--primary', {
      type: 'button',
      onclick: function () { go('lab:' + (A.labs[0] && A.labs[0].id)); }
    }, ['Начать первый опыт']);
    startBtn.appendChild(A.icon('arrow')).classList.add('ico');

    hero.appendChild(h('div.cta-row', [
      startBtn,
      h('button.btn.btn--ghost', {
        type: 'button',
        onclick: function () {
          var el = document.getElementById('how');
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, ['Как это работает'])
    ]));

    /* живой визуал */
    var r2 = h('span.viz__r2', ['R² 0%']);
    var vizBody = h('div.viz__body');
    var viz = h('div.viz', [
      h('div.viz__bar', [
        h('i.viz__dot'), h('i.viz__dot'), h('i.viz__dot'),
        h('span.viz__name', [A.raw('скорость мысли · закон Хика')]),
        h('span.viz__live', [h('i'), A.raw(A.i18n.t('опыт идёт'))])
      ]),
      vizBody
    ]);
    vizBody.appendChild(h('div', { id: 'vizcanvas' }));
    vizBody.appendChild(h('div.viz__foot', [
      h('span.viz__eq', [A.raw('T = a + b · log₂(n + 1)')]),
      r2
    ]));
    hero.appendChild(viz);

    /* цифры */
    var stats = h('div.stats', [
      stagger(h('div.stat', [h('div.stat__n', [A.raw('7 687')]), h('div.stat__t', { text: 'школ в стране' })]), 0),
      stagger(h('div.stat', [h('div.stat__n', [A.raw('967')]), h('div.stat__t', { text: 'с современным кабинетом' })]), 1),
      stagger(h('div.stat.stat--accent', [h('div.stat__n', [A.raw('0 ₸')]), h('div.stat__t', { text: 'стоимость внедрения' })]), 2),
      stagger(h('div.stat.stat--accent', [h('div.stat__n', [A.raw(String(A.labs.length))]), h('div.stat__t', { text: 'опыта уже работают' })]), 3)
    ]);
    hero.appendChild(stats);
    view.appendChild(hero);

    /* проблема */
    view.appendChild(secHead('Проблема', 'Кабинет физики есть не у всех. Телефон — почти у каждого',
      'Оборудование не нужно покупать. Оно уже куплено — родителями, и лежит у школьника в кармане.'));
    var pcards = h('div.cards.cards--3');
    PROBLEM.forEach(function (p, i) {
      pcards.appendChild(stagger(h('div.fcard', [
        h('div.fcard__n', [A.raw(p.n)]),
        h('div.fcard__t', { text: p.t }),
        h('div.fcard__d', { text: p.d })
      ]), i));
    });
    view.appendChild(pcards);
    view.appendChild(h('p.note', ['Источники: Бюро национальной статистики Республики Казахстан; сообщения о ходе оснащения предметных кабинетов, 2025.']));

    /* опыты */
    view.appendChild(secHead('Опыты', 'Три настоящих измерения',
      'Каждый опыт даёт свои числа. Результат у каждого школьника разный — потому что измеряет он себя и свою комнату, а не картинку.'));
    var list = h('div.labs');
    A.labs.forEach(function (lab, i) { list.appendChild(labCard(lab, i)); });
    view.appendChild(list);

    view.appendChild(h('div.score', [
      h('div.score__n', [A.raw(A.store.openedCount() + '/' + A.labs.length)]),
      h('div.score__t', ['Открыто законов. Формулу мы не показываем — ты выводишь её сам из своих же данных.'])
    ]));

    /* как это работает */
    var howSec = secHead('Как это работает', 'Пять шагов научного метода',
      'Два шага из пяти — те, ради которых всё построено: гипотеза записывается до опыта, а формула не показывается, пока ученик не выведет её сам.');
    howSec.id = 'how';
    view.appendChild(howSec);
    var how = h('div.how');
    HOW.forEach(function (s, i) {
      how.appendChild(stagger(h('div.how__row' + (s.key ? '.how__row--key' : ''), [
        h('div.how__n', [A.raw(String(i + 1))]),
        h('div', [h('div.how__t', { text: s.t }), h('div.how__d', { text: s.d })])
      ]), i));
    });
    view.appendChild(how);

    /* скоро */
    view.appendChild(secHead('Скоро', 'Что добавим следующим', null));
    var soon = h('div.labs');
    SOON.forEach(function (s, i) { soon.appendChild(soonCard(s, i)); });
    view.appendChild(soon);

    /* что внутри */
    view.appendChild(secHead('Что внутри', 'Технологии, без которых опыт был бы рисунком', null));
    var tcards = h('div.cards');
    TECH.forEach(function (t, i) {
      tcards.appendChild(stagger(h('div.fcard', [
        h('div.fcard__ic', [A.icon(t.ic)]),
        h('div.fcard__t', { text: t.t }),
        h('div.fcard__d', { text: t.d })
      ]), i));
    });
    view.appendChild(tcards);

    /* научная основа */
    view.appendChild(secHead('На чём это основано', 'Не придумано, а взято из работ',
      'И сами опыты, и порядок шагов опираются на конкретные исследования.'));
    var src = h('div.sources');
    SOURCES.forEach(function (s, i) {
      src.appendChild(stagger(h('div.src', [
        h('div.src__t', { text: s.t }),
        h('div.src__w', { text: s.w }),
        h('div.src__d', { text: s.d })
      ]), i));
    });
    view.appendChild(src);

    /* куда растёт */
    view.appendChild(secHead('Куда растёт', 'Что дальше', null));
    var road = h('div.road');
    ROAD.forEach(function (r) {
      road.appendChild(h('div.road__row', [
        h('div.road__m', [A.icon('arrow')]),
        h('div', [h('div.road__t', { text: r.t }), h('div.road__d', { text: r.d })])
      ]));
    });
    view.appendChild(road);

    /* подвал */
    var brand = h('div.foot__brand');
    var mark = document.querySelector('.brand__mark');
    if (mark) brand.appendChild(mark.cloneNode(true));
    brand.appendChild(h('b', [A.raw('QaltaLab')]));
    view.appendChild(h('footer.foot', [
      brand,
      h('div', [A.raw('зертхана қалтаңда · лаборатория в кармане')]),
      h('div', ['Проект хакатона WIT Teens Challenge 2026 · кейс «STEM без сложного оборудования»'])
    ]));

    if (heroStop) { heroStop(); heroStop = null; }
    var host = document.getElementById('vizcanvas');
    if (host && A.hero) heroStop = A.hero.create(host, function (v) { r2.textContent = 'R² ' + v + '%'; });

    window.scrollTo(0, 0);
  }

  /* ---------- переходы ---------- */

  function go(next) { route = next; render(); }

  function render() {
    if (route.indexOf('lab:') === 0) {
      if (heroStop) { heroStop(); heroStop = null; }
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
    theme = saved === 'dark' ? 'dark' : 'light';
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
