/* Главный экран, тема, язык и переходы.
   Главная сделана как страница проекта, а не как меню приложения: жюри и
   учитель попадают сюда первыми и за минуту должны увидеть проблему, решение,
   отличие от аналогов и то, как это попадает в класс. */

window.A = window.A || {};

(function (A) {
  'use strict';

  var h = A.h;
  var route = 'home';
  var theme = 'light';
  var heroStop = null;

  var LAB_ICON = { hearing: 'hearing', hick: 'bolt', pitch: 'wave', pendulum: 'pendulum', pulse: 'heart', fitts: 'target', practice: 'spark', memory: 'brain', timing: 'clock' };

  var SOON = [];

  var FLOW = ['Теория', 'Эксперимент', 'Понимание'];

  var WHY = [
    { ic: 'flask', t: 'Без оборудования', d: 'Нужен телефон или компьютер с браузером — и вещи, которые есть дома.' },
    { ic: 'chart', t: 'Интерактивно', d: 'Меняй параметры модели и сразу видь, как кривая ложится на твои точки.' },
    { ic: 'quest', t: 'Можно ошибаться', d: 'Гипотеза может не подтвердиться. Повтори опыт сколько нужно — в других условиях.' },
    { ic: 'target', t: 'Доступно', d: 'Работает на телефоне, планшете и компьютере. Без установки и регистрации.' },
    { ic: 'wave', t: 'Два языка', d: 'Русский және қазақша — переключается в любой момент, даже посреди опыта.' },
    { ic: 'spark', t: 'Практика вместо одной теории', d: 'Школьник сам находит закономерность в своих данных, а не читает о ней.' }
  ];

  var HOW = [
    { t: 'Вопрос', d: 'Не «выучи параграф», а понятный вопрос: почему пустая бутылка гудит низко, а полная — высоко?' },
    { t: 'Гипотеза', d: 'Ученик записывает предсказание до опыта, и приложение его запоминает. Ошибиться здесь можно и нужно.', key: true },
    { t: 'Измерение', d: 'Телефон меряет по-настоящему: микрофон ловит частоту, камера — пульс, экран — время и касания.' },
    { t: 'Подгонка', d: 'Формулы на экране нет. Ученик двигает ползунки, пока кривая не ляжет на его точки, а приложение считает совпадение R².', key: true },
    { t: 'Открытие', d: 'Только теперь появляется имя закона, формула и объяснение простыми словами: что произошло и почему.' }
  ];

  var PIPE = [
    { t: 'Телефон', d: 'микрофон, камера, динамик, экран' },
    { t: 'Измерение', d: 'настоящий опыт дома или в классе' },
    { t: 'Твои данные', d: 'таблица точек, у каждого своя' },
    { t: 'График', d: 'ползунки подгоняют модель, R² считается сразу' },
    { t: 'Закономерность', d: 'закон и объяснение простыми словами' }
  ];

  // Сначала польза, потом название технологии.
  var STACK = [
    ['Микрофон', 'измеряет частоту звука — бутылка превращается в резонатор'],
    ['Камера', 'ловит изменение яркости пальца — так видно удары пульса'],
    ['Касания и таймер', 'измеряют время реакции с точностью до миллисекунд'],
    ['Web Audio API', 'генерирует чистые тона и раскладывает звук на частоты'],
    ['Canvas', 'перерисовывает график при каждом движении ползунка'],
    ['JavaScript', 'считает подгонку кривой и R² прямо на устройстве']
  ];

  var TEACH = [
    'Выберите опыт и скопируйте ссылку на него.',
    'Отправьте ссылку ученикам — в чат класса или на доске.',
    'Каждый ставит опыт на своём телефоне, в классе или дома.',
    'На уроке сравните графики: почему у всех по-разному?'
  ];

  var WHO = [
    { ic: 'spark', t: 'Ученик', d: 'Экспериментируй, проверяй гипотезы и лучше понимай STEM-темы.' },
    { ic: 'quest', t: 'Учитель', d: 'Показывай опыты на уроке или задавай на дом — достаточно дать ссылку.' },
    { ic: 'flask', t: 'Школа', d: 'Дополняй практическое STEM-обучение даже при ограниченном доступе к лабораториям.' }
  ];

  var CMP_OLD = ['прочитал формулу', 'решил пример', 'получил готовый ответ'];
  var CMP_NEW = ['выдвинул гипотезу', 'провёл эксперимент', 'получил свои данные', 'построил зависимость', 'открыл закон'];

  var SOURCES = [
    { t: 'Активное обучение работает лучше лекции — и ученик этого не замечает', w: 'Гарвардский университет · PNAS, 2019', d: 'Deslauriers, McCarty, Callaghan, Kestin, Miller. Студенты на активных занятиях усваивают заметно больше, хотя субъективно им кажется, что меньше. Отсюда наш вывод: давать действие, а не объяснение.' },
    { t: 'Активное обучение снижает долю несдавших в STEM-курсах', w: 'PNAS, 2014 · метаанализ 225 исследований', d: 'Freeman и соавторы. Обзор по курсам математики, инженерии и естественных наук: доля несдавших падает, средние баллы растут.' },
    { t: 'Датчики смартфона как учебный измерительный прибор', w: 'RWTH Aachen University · проект phyphox', d: 'Немецкий университет несколько лет использует сенсоры смартфона для школьных и студенческих опытов.' },
    { t: 'Схема «предскажи — проверь — объясни»', w: 'White & Gunstone, Probing Understanding, 1992', d: 'Сначала предсказание, потом опыт, потом объяснение расхождения. По ней сделаны наши шаги гипотезы и разбора.' }
  ];

  // Первый шаг работает, остальные — план. Это должно быть видно сразу.
  var ROAD = [
    { now: true, t: 'Девять опытов', d: 'Три по физике звука и колебаний и шесть — про человека и данные.' },
    { t: 'Больше физики', d: 'Ускорение, наклон и магнитное поле — через датчики, которые уже есть в телефоне.' },
    { t: 'Химия и инженерия', d: 'Тот же движок: измерение, модель, проверка гипотезы.' },
    { t: 'Задания для классов', d: 'Готовые практические работы под школьную программу.' },
    { t: 'STEM-библиотека для школ', d: 'Каталог опытов и общий график класса для учителя.' }
  ];

  var SCALE = ['Ученик', 'Класс', 'Школа', 'Школы Казахстана'];

  // Результаты опроса школьников. Показываются только настоящие данные:
  // пока enabled = false, блока на странице нет. После опроса заполнить числа
  // и включить. Пустые поля (null) просто не выводятся.
  var userTesting = {
    enabled: false,
    respondents: null,       // сколько школьников прошли опыт
    usabilityScore: null,    // средняя оценка удобства из 5, например 4.6
    wouldUsePercent: null,   // % хотели бы использовать на уроках
    understoodPercent: null  // % поняли принцип самостоятельно
  };

  /* ---------- тема ---------- */

  function applyTheme() {
    document.documentElement.setAttribute('data-theme', theme);
    var meta = document.querySelector('meta[name=theme-color]');
    if (meta) meta.setAttribute('content', theme === 'dark' ? '#0B0E13' : '#FFFFFF');
    var btn = document.getElementById('theme');
    if (btn) { A.u.clear(btn); btn.appendChild(A.icon(theme === 'dark' ? 'sun' : 'moon')); }
    if (A.lab && A.lab.refreshTheme) A.lab.refreshTheme();
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

  function sec(id, eyebrow, title, lead) {
    var box = h('section.sec', [chip(eyebrow, null, true), h('h2.sec__h', { text: title })]);
    if (id) box.id = id;
    if (lead) box.appendChild(h('p.sec__lead', { text: lead }));
    return box;
  }


  function labCard(lab, i) {
    var done = A.store.result(lab.id).done;
    // На карточке — то, по чему выбирают опыт: сколько займёт, что нужно
    // и чем меряет телефон (если это не видно из списка вещей).
    var meta = h('div.labcard__meta', [
      h('span.tag', { text: lab.subject }),
      lab.time ? h('span.tag.tag--time', [A.raw(A.i18n.t(lab.time))]) : null,
      h('span.tag.tag--gear', { text: lab.gear })
    ]);
    if (lab.sensor && !/экран|динамик|микрофон|камер/i.test(lab.gear)) {
      meta.appendChild(h('span.tag', { text: lab.sensor }));
    }
    if (done) {
      var t = h('span.tag.tag--done');
      t.appendChild(A.icon('check'));
      t.appendChild(document.createTextNode(A.i18n.t('открыто')));
      meta.appendChild(t);
    }
    return stagger(h('button.labcard.labcard--has-go', {
      type: 'button', onclick: function () { go('lab:' + lab.id); }
    }, [
      h('div.labcard__visual', [A.scene(lab.id)]),
      h('div.labcard__icon', [A.icon(LAB_ICON[lab.id] || 'flask')]),
      h('div', [
        h('div.labcard__t', { text: lab.title }),
        h('div.labcard__s', { text: lab.question }),
        meta
      ]),
      h('div.labcard__go', [A.icon('arrow')])
    ]), i);
  }

  function soonCard(s, i) {
    return stagger(h('div.labcard.labcard--soon', [
      h('div.labcard__icon', [A.icon(s.icon)]),
      h('div', [
        h('div.labcard__t', { text: s.title }),
        h('div.labcard__s', { text: 'Появится в следующей версии' }),
        h('div.labcard__meta', [h('span.tag', { text: s.subject }), h('span.tag', { text: s.gear })])
      ])
    ]), i);
  }

  /* ---------- главная ---------- */

  function home() {
    var view = document.getElementById('view');
    A.u.clear(view);
    view.classList.add('landing');

    /* герой: за пять секунд — что это и что делать */
    var left = h('div', [
      chip('WIT Teens Challenge 2026 · кейс «STEM без оборудования»', 'spark'),
      h('h1', [
        A.raw(A.i18n.t('Лаборатория') + ' '),
        h('em', { text: 'в кармане' })
      ]),
      h('p.hero__lead', ['Превращаем обычный телефон в STEM-лабораторию. Проводи настоящие эксперименты, собирай свои данные и сам открывай закономерности.']),
      h('p.hero__sub', ['Без лабораторного оборудования. Без установки. Прямо в браузере.'])
    ]);

    // Главная кнопка ведёт прямо в опыт, который работает на любом
    // устройстве без подготовки: жюри и учитель проверят его за минуту.
    var startBtn = h('button.btn.btn--primary', {
      type: 'button', onclick: function () { go('lab:timing'); }
    }, ['Начать эксперимент']);
    startBtn.appendChild(A.icon('arrow')).classList.add('ico');

    left.appendChild(h('div.cta-row', [
      startBtn,
      h('button.btn.btn--ghost', { type: 'button', onclick: function () { jump('how'); } }, ['Как это работает'])
    ]));
    left.appendChild(h('p.hero__hint', ['Первый опыт займёт около минуты: «Чувство времени», нужен только экран.']));
    left.appendChild(h('p.hero__privacy', ['Без аккаунта. Измерения остаются на устройстве.']));

    var vizBody = h('div.viz__body');
    var viz = h('div.viz', [
      h('div.viz__bar', [
        h('i.viz__dot'), h('i.viz__dot'), h('i.viz__dot'),
        h('span.viz__name', { text: 'попробуй сам' }),
        h('span.viz__live', [h('i'), A.raw(A.i18n.t('пример данных'))])
      ]),
      vizBody
    ]);

    view.appendChild(h('section.hero', [
      h('img.hero__image', { src: 'assets/hero.jpg', alt: '', fetchPriority: 'high' }),
      h('div.hero__grid', [left, viz])
    ]));

    /* цифры: слева проблема, справа наш ответ — у каждой цифры своя
       маленькая наглядность, чтобы число читалось, а не просто стояло */
    var share = Math.round(967 / 8048 * 100);
    var bar = h('div.fact__bar', [h('i')]);
    bar.firstChild.style.width = share + '%';
    var parts = h('div.fact__chips');
    ['микрофон', 'камера', 'динамик', 'экран'].forEach(function (p) { parts.appendChild(h('span', { text: p })); });
    var grid = h('div.fact__grid');
    ['pitch', 'pendulum', 'hearing', 'timing', 'hick', 'fitts', 'practice', 'memory', 'pulse'].forEach(function (id, i) {
      grid.appendChild(h('i' + (i < 3 ? '.is-phys' : '')));
    });
    var fact = function (n, t, extra, i) {
      return stagger(h('div.fact', [h('div.fact__n', [A.raw(n)]), h('div.fact__t', { text: t }), extra]), i);
    };
    view.appendChild(h('div.facts', [
      h('div.facts__side', [
        h('div.facts__h', ['Школы Казахстана']),
        h('div.facts__row', [
          fact('8 048', 'школ в Казахстане', h('div.fact__src', ['Бюро национальной статистики, 2026']), 0),
          fact('967', 'школ получили новые кабинеты в 2024 году', h('div', [bar, h('div.fact__src', [A.raw(A.i18n.fmt('≈{p}% школ за год', { p: share }))])]), 1)
        ])
      ]),
      h('div.facts__side.facts__side--us', [
        h('div.facts__h', ['Ответ QaltaLab']),
        h('div.facts__row', [
          fact('0 ₸', 'на оборудование — приборы уже есть в телефоне', parts, 2),
          fact(String(A.labs.length), 'опытов работают сейчас, три из них — физика', grid, 3)
        ])
      ])
    ]));

    /* проблема */
    view.appendChild(sec(null, 'Проблема', 'STEM должен быть доступен каждому',
      'Не у каждой школы есть лаборатория, оборудование и расходные материалы. Поэтому многие школьники изучают физику и другие STEM-дисциплины только в теории.'));
    var flow = h('div.flow');
    FLOW.forEach(function (f, i) {
      if (i) flow.appendChild(h('span.flow__arrow', [A.icon('arrow')]));
      flow.appendChild(stagger(h('div.flow__step' + (i === 1 ? '.is-key' : ''), [
        h('span.flow__n', [A.raw('0' + (i + 1))]), h('b', { text: f })
      ]), i));
    });
    view.appendChild(flow);
    view.appendChild(h('p.flow__line', ['QaltaLab позволяет перейти от формулы к эксперименту прямо в браузере.']));
    view.appendChild(h('p.note', [
      'Цифры выше: ',
      h('a', { href: 'https://stat.gov.kz/ru/news/bolee-8-tysyach-shkol-kazakhstana-nachali-novyy-uchebnyy-god/', target: '_blank', rel: 'noopener noreferrer' }, ['Бюро национальной статистики']),
      '; ',
      h('a', { href: 'https://www.gov.kz/memleket/entities/edu/documents/details/836066', target: '_blank', rel: 'noopener noreferrer' }, ['Министерство просвещения']),
      '. ',
      'Новые кабинеты — число за один 2024 год, а не всех оснащённых школ.'
    ]));

    /* главное отличие */
    view.appendChild(sec('measure', 'Не наблюдай — измеряй', 'Телефон становится лабораторным прибором',
      'В QaltaLab ученик не смотрит заранее подготовленную анимацию. Он получает данные из собственного эксперимента и сам находит зависимость.'));
    var pipe = h('div.pipe');
    PIPE.forEach(function (p, i) {
      pipe.appendChild(stagger(h('div.pipe__s' + (i === 2 ? '.is-key' : ''), [
        h('b', { text: p.t }), h('span', { text: p.d })
      ]), i));
    });
    view.appendChild(pipe);

    /* почему QaltaLab */
    view.appendChild(sec('why', 'Почему QaltaLab', 'Опыт, который можно поставить сегодня', null));
    var why = h('div.why');
    WHY.forEach(function (w, i) {
      why.appendChild(stagger(h('div.why__c', [
        h('div.why__ic', [A.icon(w.ic)]),
        h('div.why__t', { text: w.t }),
        h('div.why__d', { text: w.d })
      ]), i));
    });
    view.appendChild(why);

    /* опыты */
    view.appendChild(sec('labs', 'Основной трек', 'Три физических опыта без лаборатории',
      'Начни со звука и колебаний. Для измерений нужны телефон и доступные предметы: бутылка с водой или нитка с небольшим грузом.'));
    var list = h('div.labs.labs--3');
    ['pitch', 'pendulum', 'hearing'].forEach(function (id, i) {
      var lab = A.lab.byId(id);
      if (lab) list.appendChild(labCard(lab, i));
    });
    view.appendChild(list);

    view.appendChild(sec(null, 'Дополнительные исследования', 'Ещё шесть опытов: человек и данные',
      'Тот же научный цикл — для реакции, памяти, чувства времени и восстановления пульса. Телефон помогает собрать данные, а ученик сам ищет в них закономерность.'));
    var extraList = h('div.labs.labs--3');
    ['timing', 'hick', 'fitts', 'practice', 'memory', 'pulse'].forEach(function (id, i) {
      var lab = A.lab.byId(id);
      if (lab) extraList.appendChild(labCard(lab, i));
    });
    view.appendChild(extraList);

    view.appendChild(h('div.score', [
      h('div.score__n', [A.raw(A.store.openedCount() + '/' + A.labs.length)]),
      h('div.score__t', ['Завершено опытов. Сравни свои данные с моделью и выясни, где она работает, а где нет.'])
    ]));

    /* как работает */
    view.appendChild(sec('how', 'Как это работает', 'Как работает QaltaLab',
      'Телефон измеряет, ученик подбирает модель, а приложение после каждого изменения пересчитывает совпадение и обновляет график. Расчёты выполняются прямо в браузере — данные не уходят на сервер.'));
    view.appendChild(h('h3.sub-h', ['Пять шагов научного метода в каждом опыте']));
    var how = h('div.how.how--2');
    HOW.forEach(function (s, i) {
      how.appendChild(stagger(h('div.how__row' + (s.key ? '.how__row--key' : ''), [
        h('div.how__n', [A.raw(String(i + 1))]),
        h('div', [h('div.how__t', { text: s.t }), h('div.how__d', { text: s.d })])
      ]), i));
    });
    view.appendChild(how);

    var stack = h('dl.stack');
    STACK.forEach(function (s) {
      stack.appendChild(h('div', [h('dt', [A.raw(s[0])]), h('dd', { text: s[1] })]));
    });
    view.appendChild(h('div.stack-wrap', [
      h('div.stack__h', ['Что внутри на самом деле']),
      h('p.stack__lead', ['QaltaLab использует возможности самого устройства как лабораторные инструменты.']),
      stack,
      h('p.stack__priv', ['Данные обрабатываются прямо на устройстве и не отправляются на сервер. Аккаунт не нужен.'])
    ]));

    /* для кого */
    view.appendChild(sec('teacher', 'Для кого', 'Ученику, учителю и школе',
      'Для 7–9 классов. Учителю ничего не нужно закупать и устанавливать: он даёт ссылку, а ученик ставит опыт на своём телефоне — в классе или дома.'));
    var who = h('div.cards.cards--3');
    WHO.forEach(function (t, i) {
      who.appendChild(stagger(h('div.fcard', [
        h('div.fcard__ic', [A.icon(t.ic)]),
        h('div.fcard__t', { text: t.t }),
        h('div.fcard__d', { text: t.d })
      ]), i));
    });
    view.appendChild(who);

    var steps = h('ol.teach__steps');
    TEACH.forEach(function (t) { steps.appendChild(h('li', { text: t })); });
    var links = h('div.teach__links');
    ['pitch', 'pendulum', 'hearing', 'timing', 'hick', 'fitts', 'practice', 'memory', 'pulse'].forEach(function (id) {
      var lab = A.lab.byId(id);
      if (!lab) return;
      links.appendChild(h('div.teach__row', [
        h('span.teach__t', { text: lab.title }),
        h('button.linkbtn', { type: 'button', onclick: function () { A.lab.copyLink(id); } }, ['Ссылка для класса'])
      ]));
    });
    view.appendChild(h('div.teach', [
      h('div', [h('h3.sub-h', ['Как провести опыт с классом']), steps,
        h('p.note', ['Регистрация не нужна ни учителю, ни ученикам. Ссылка открывает опыт сразу.'])]),
      links
    ]));

    /* чем отличается */
    view.appendChild(sec(null, 'Чем отличается', 'Формула, с которой можно взаимодействовать', null));
    var col = function (title, items, us) {
      var row = h('div.cmp__chain');
      items.forEach(function (t, i) {
        if (i) row.appendChild(h('span.cmp__arr', [A.raw('→')]));
        row.appendChild(h('span.cmp__s', { text: t }));
      });
      return h('div.cmp__col' + (us ? '.is-us' : ''), [h('div.cmp__h', { text: title }), row]);
    };
    view.appendChild(h('div.cmp', [col('Обычная теория', CMP_OLD), col('QaltaLab', CMP_NEW, true)]));
    view.appendChild(h('p.flow__line', ['QaltaLab — не коллекция симуляций. Главный объект эксперимента — реальные данные ученика.']));
    view.appendChild(h('p.note', ['Приложения-датчики вроде phyphox тоже измеряют телефоном, но показывают сырые показания. Мы добавили к измерению научный метод, школьные темы и казахский язык.']));

    /* тестирование    /* тестирование — только настоящие результаты */
    if (userTesting.enabled && userTesting.respondents) {
      view.appendChild(sec(null, 'Протестировано школьниками', A.i18n.fmt('{n} школьников протестировали QaltaLab', { n: userTesting.respondents }), null));
      var ut = h('div.facts__row.ut');
      if (userTesting.usabilityScore != null) ut.appendChild(h('div.fact', [h('div.fact__n', [A.raw(A.u.num(userTesting.usabilityScore, 1) + ' / 5')]), h('div.fact__t', { text: 'удобство' })]));
      if (userTesting.wouldUsePercent != null) ut.appendChild(h('div.fact', [h('div.fact__n', [A.raw(userTesting.wouldUsePercent + '%')]), h('div.fact__t', { text: 'хотели бы использовать на уроках' })]));
      if (userTesting.understoodPercent != null) ut.appendChild(h('div.fact', [h('div.fact__n', [A.raw(userTesting.understoodPercent + '%')]), h('div.fact__t', { text: 'поняли принцип самостоятельно' })]));
      view.appendChild(ut);
    }

    /* масштабирование */
    view.appendChild(sec(null, 'Развитие', 'От девяти опытов к STEM-платформе', null));
    var road = h('div.road2');
    ROAD.forEach(function (r, i) {
      road.appendChild(stagger(h('div.road2__s' + (r.now ? '.is-now' : ''), [
        h('span.road2__m', { text: r.now ? 'Работает сейчас' : 'Планируется' }),
        h('b', { text: r.t }),
        h('span.road2__d', { text: r.d })
      ]), i));
    });
    view.appendChild(road);
    var chain = h('div.chain');
    SCALE.forEach(function (s, i) {
      if (i) chain.appendChild(h('span.flow__arrow', [A.icon('arrow')]));
      chain.appendChild(h('span.chain__s', { text: s }));
    });
    view.appendChild(chain);
    view.appendChild(h('p.note', ['Это потенциал развития: движок один на все опыты, поэтому новый опыт — это один файл. Внедрения в школах пока нет.']));

    /* основа */
    view.appendChild(sec('basis', 'На чём это основано', 'Не придумано, а взято из работ', null));
    var src = h('div.sources.sources--2');
    SOURCES.forEach(function (s, i) {
      src.appendChild(stagger(h('div.src', [
        h('div.src__t', { text: s.t }),
        h('div.src__w', { text: s.w }),
        h('div.src__d', { text: s.d })
      ]), i));
    });
    view.appendChild(src);

    view.appendChild(footer());

    if (heroStop) { heroStop(); heroStop = null; }
    if (A.hero) heroStop = A.hero.create(vizBody, function () { go('lab:pendulum'); });

    window.scrollTo(0, 0);
  }

  function footer() {
    var brand = h('div.foot__brand');
    var mark = document.querySelector('.brand__mark');
    if (mark) brand.appendChild(mark.cloneNode(true));
    brand.appendChild(h('b', [A.raw('QaltaLab')]));

    var col1 = h('div', [
      brand,
      h('div', [A.raw('зертхана қалтаңда — лаборатория в кармане')]),
      h('div', ['Настоящие измерения вместо симуляций. Ученик собирает свои данные и сам выводит закон.'])
    ]);

    var col2 = h('div', [
      h('div.foot__h', ['Разделы']),
      h('div.foot__list', [
        h('button', { type: 'button', onclick: function () { jump('labs'); } }, ['Опыты']),
        h('button', { type: 'button', onclick: function () { jump('how'); } }, ['Как это работает']),
        h('button', { type: 'button', onclick: function () { jump('teacher'); } }, ['Учителю']),
        h('button', { type: 'button', onclick: function () { jump('basis'); } }, ['Научная основа'])
      ])
    ]);

    var col3 = h('div', [
      h('div.foot__h', ['Проект']),
      h('div.foot__list', [
        h('a', { href: 'https://github.com/tairidrisov33-cmd/QaltaLab', target: '_blank', rel: 'noopener' }, ['Исходный код на GitHub']),
        h('div', ['Хакатон WIT Teens Challenge 2026']),
        h('div', ['Кейс «STEM без сложного оборудования»'])
      ])
    ]);

    return h('footer.foot', [
      h('div.foot__cols', [col1, col2, col3]),
      h('div.foot__bottom', [A.raw('© 2026 QaltaLab · ' + A.i18n.t('данные остаются на устройстве, аккаунт не нужен'))])
    ]);
  }

  /* ---------- переходы ---------- */

  function jump(id) {
    if (route !== 'home') { go('home'); setTimeout(function () { jump(id); }, 60); return; }
    var el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // Адрес опыта постоянный (#/lab/hearing): учитель может отправить ссылку,
  // обновление страницы не выкидывает на главную, кнопка «назад» работает.
  function hashOf(r) { return r.indexOf('lab:') === 0 ? '#/lab/' + r.slice(4) : '#/'; }

  function routeFromHash() {
    var m = /^#\/lab\/([\w-]+)/.exec(location.hash);
    return m && A.lab.byId(m[1]) ? 'lab:' + m[1] : 'home';
  }

  function go(next) {
    var hash = hashOf(next);
    if (location.hash !== hash && !(hash === '#/' && !location.hash)) { location.hash = hash; return; }
    route = next; render();
  }

  function onHash() {
    var next = routeFromHash();
    if (next === route && next !== 'home') return;
    route = next; render();
  }

  function render() {
    var view = document.getElementById('view');
    if (route.indexOf('lab:') === 0) {
      if (heroStop) { heroStop(); heroStop = null; }
      view.classList.remove('landing');
      view.classList.add('lab');
      if (A.lab.currentId() === route.slice(4)) A.lab.languageChanged();
      else A.lab.open(route.slice(4));
    } else {
      view.classList.remove('lab');
      A.lab.cleanup();
      home();
    }
    paintLang();
  }

  // Меню лежит в разметке, а не строится через h(), поэтому переводим его
  // отдельно — иначе в казахском режиме шапка оставалась бы русской.
  var NAV = { labs: 'Опыты', how: 'Как работает', teacher: 'Учителю' };

  // Подписи для экранного диктора в статичной шапке тоже переводим.
  var ARIA = { home: 'На главную', nav: 'Разделы', lang: 'Язык', theme: 'Тема оформления' };

  function paintNav() {
    Object.keys(ARIA).forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.setAttribute('aria-label', A.i18n.t(ARIA[id]));
    });
    var skip = document.getElementById('skip');
    if (skip) skip.textContent = A.i18n.t('К содержимому');
    var nav = document.getElementById('nav');
    if (!nav) return;
    var kids = nav.querySelectorAll('button[data-to]');
    for (var i = 0; i < kids.length; i++) {
      var key = NAV[kids[i].getAttribute('data-to')];
      if (key) kids[i].textContent = A.i18n.t(key);
    }
  }

  function paintLang() {
    paintNav();
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
    document.getElementById('theme').addEventListener('click', function () { setTheme(theme === 'dark' ? 'light' : 'dark'); });
    document.getElementById('lang').addEventListener('click', function (e) {
      var b = e.target.closest('button[data-lang]');
      if (b) A.i18n.set(b.getAttribute('data-lang'));
    });
    document.getElementById('nav').addEventListener('click', function (e) {
      var b = e.target.closest('button[data-to]');
      if (b) jump(b.getAttribute('data-to'));
    });

    // Тонкая линия под шапкой появляется только когда страница прокручена —
    // на самом верху она лишняя.
    var bar = document.getElementById('topbar');
    var onScroll = function () { bar.classList.toggle('is-stuck', window.scrollY > 4); };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    document.getElementById('skip').addEventListener('click', function () {
      var v = document.getElementById('view');
      v.setAttribute('tabindex', '-1');
      v.focus();
    });
    window.addEventListener('hashchange', onHash);
    route = routeFromHash();
    render();
  }

  A.app = { go: go, render: render, init: init, jump: jump };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})(window.A);
