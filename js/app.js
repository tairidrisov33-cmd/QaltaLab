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

  var LAB_ICON = { hearing: 'hearing', hick: 'bolt', pitch: 'wave' };

  var SOON = [
    { icon: 'heart', title: 'Пульс камерой', subject: 'Биология', gear: 'Камера' },
    { icon: 'pendulum', title: 'Маятник и g', subject: 'Механика', gear: 'Нитка и ластик' }
  ];

  var PROBLEM = [
    { n: '8 048', t: 'школ в Казахстане', d: 'По данным Бюро национальной статистики на начало 2026–2027 учебного года.' },
    { n: '967', t: 'школ получили новые кабинеты в 2024 году', d: 'Министерство просвещения сообщает о 1 621 новом предметном кабинете для этих школ. Это число за один год, а не число всех оснащённых школ.' },
    { n: '82,2%', t: 'охват предметными кабинетами в 2024 году', d: 'Официальный показатель для основных и средних школ. QaltaLab дополняет школьное оборудование возможностью провести опыт дома.' }
  ];

  var HOW = [
    { t: 'Вопрос', d: 'Не «выучи параграф», а понятный вопрос: почему пустая бутылка гудит низко, а полная — высоко?' },
    { t: 'Гипотеза', d: 'Ученик записывает предсказание до опыта, и приложение его запоминает. Ошибиться здесь можно и нужно.', key: true },
    { t: 'Измерение', d: 'Телефон меряет по-настоящему: микрофон ловит частоту, динамик проверяет слух, экран — скорость реакции.' },
    { t: 'Подгонка', d: 'Формулы на экране нет. Ученик двигает ползунки, пока кривая не ляжет на его точки, а приложение считает настоящий коэффициент детерминации.', key: true },
    { t: 'Открытие', d: 'Только теперь появляется имя закона, формула, учёный и год. И разбор: что ты предполагал и почему вышло иначе.' }
  ];

  var TEACHER = [
    { ic: 'arrow', t: 'Задать как домашнюю работу', d: 'Учитель даёт ссылку. Ни установки, ни регистрации, ни закупки — ученик открывает её на своём телефоне и ставит опыт дома.' },
    { ic: 'chart', t: 'Ученик приносит свои данные', d: 'У каждого получается свой график: свой слух, своя скорость реакции, своя бутылка. Списать чужой результат бессмысленно — он не сойдётся с его же гипотезой.' },
    { ic: 'quest', t: 'Разговор на уроке становится другим', d: 'Вместо «кто сделал домашку» — «почему графики двух учеников отличаются». Это и есть разбор данных, ради которого всё затевалось.' }
  ];

  var VS_HEAD = ['', 'Виртуальные лаборатории', 'Видеоуроки', 'Приложения-датчики', 'QaltaLab'];
  var VS = [
    ['Откуда берутся числа', 'придумал разработчик', 'измерений нет', 'измеряет телефон', 'измеряет телефон'],
    ['Ведёт ли по опыту', 'песочница без цели', 'ученик смотрит', 'сырые показания', 'пять шагов научного метода'],
    ['Что с формулой', 'показана сразу', 'объясняется', 'формулы нет', 'ученик выводит сам'],
    ['Гипотеза до опыта', 'нет', 'нет', 'нет', 'записывается и разбирается'],
    ['Язык интерфейса', 'чаще английский', 'есть русский', 'английский, немецкий', 'русский и қазақша'],
    ['Нужна установка', 'зависит от сервиса', 'нет', 'обычно да', 'нет']
  ];

  var TECH = [
    { ic: 'wave', t: 'Быстрое преобразование Фурье', d: 'Звук с микрофона раскладывается на частоты, пик уточняется параболой по трём точкам — иначе частота прыгала бы ступеньками по 5 Гц и график выходил бы рваным.' },
    { ic: 'chart', t: 'Качество модели и R²', d: 'Приложение считает сумму квадратов ошибок и коэффициент детерминации. Слабое совпадение остаётся видимым и не мешает обсудить результат.' },
    { ic: 'spark', t: 'Измерения на устройстве', d: 'В работающих опытах используются экран, динамик и микрофон телефона. Камера и акселерометр — возможное развитие проекта.' },
    { ic: 'flask', t: 'Ни сборщика, ни зависимостей', d: 'Обычные HTML, CSS и JavaScript. Открывается на телефоне, ноутбуке и школьном ПК одинаково, данные не покидают устройство.' }
  ];

  var SOURCES = [
    { t: 'Активное обучение работает лучше лекции — и ученик этого не замечает', w: 'Гарвардский университет · PNAS, 2019', d: 'Deslauriers, McCarty, Callaghan, Kestin, Miller. Студенты на активных занятиях усваивают заметно больше, хотя субъективно им кажется, что меньше. Отсюда наш вывод: давать действие, а не объяснение.' },
    { t: 'Активное обучение снижает долю несдавших в STEM-курсах', w: 'PNAS, 2014 · метаанализ 225 исследований', d: 'Freeman и соавторы. Обзор по курсам математики, инженерии и естественных наук: доля несдавших падает, средние баллы растут.' },
    { t: 'Время выбора растёт как логарифм числа вариантов', w: 'W. E. Hick, 1952 · R. Hyman, 1953', d: 'Опыт «Скорость мысли» проверяет эту зависимость на данных ученика. Короткий домашний опыт может дать шумный или иной результат.' },
    { t: 'Пороги слышимости и их зависимость от возраста', w: 'Международный стандарт ISO 7029', d: 'Стандарт напоминает, почему нельзя определять состояние слуха по некалиброванному динамику телефона. Наш опыт показывает только результат на данном устройстве.' },
    { t: 'Датчики смартфона как учебный измерительный прибор', w: 'RWTH Aachen University · проект phyphox', d: 'Немецкий университет несколько лет использует сенсоры смартфона для школьных и студенческих опытов.' },
    { t: 'Схема «предскажи — проверь — объясни»', w: 'White & Gunstone, Probing Understanding, 1992', d: 'Сначала предсказание, потом опыт, потом объяснение расхождения. По ней сделаны наши шаги гипотезы и разбора.' }
  ];

  var ROAD = [
    { t: 'Пульс камерой и маятник', d: 'Ещё два опыта на датчиках, которые есть в каждом телефоне.' },
    { t: 'Отчёт об опыте', d: 'Гипотеза, таблица и график одним файлом — чтобы сдавать как лабораторную работу.' },
    { t: 'Режим класса', d: 'Учитель даёт код, тридцать телефонов дают один общий график: видно разброс, выбросы и то, как усреднение вытаскивает истину из шума.' },
    { t: 'Библиотека опытов', d: 'Движок один на все опыты, поэтому новый опыт — это один файл. Рост с трёх до тридцати упирается в контент, а не в код.' }
  ];

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
    var meta = h('div.labcard__meta', [
      h('span.tag', { text: lab.subject }),
      h('span.tag.tag--gear', { text: lab.gear })
    ]);
    if (done) {
      var t = h('span.tag.tag--done');
      t.appendChild(A.icon('check'));
      t.appendChild(document.createTextNode(A.i18n.t('открыто')));
      meta.appendChild(t);
    }
    return stagger(h('button.labcard.labcard--has-go', {
      type: 'button', onclick: function () { go('lab:' + lab.id); }
    }, [
      h('img.labcard__photo', { src: 'assets/' + ({ hick: 'reaction', pitch: 'pitch', hearing: 'hearing' }[lab.id] || 'reaction') + '.jpg', alt: '', loading: 'lazy' }),
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

    /* герой */
    var left = h('div', [
      chip('WIT Teens Challenge 2026 · кейс «STEM без оборудования»', 'spark'),
      // Порядок слов в казахском другой, поэтому у заголовка есть хвост,
      // которого в русском варианте просто нет.
      h('h1', [
        A.raw(A.i18n.t('В твоём телефоне уже есть') + ' '),
        h('em', { text: 'лаборатория' }),
        A.raw(A.i18n.t('%h1_after%'))
      ]),
      h('p.hero__lead', ['Экран, динамик и микрофон помогают поставить настоящий опыт. В каждом опыте ты получаешь собственные измерения, строишь график и проверяешь гипотезу.'])
    ]);

    var startBtn = h('button.btn.btn--primary', {
      type: 'button', onclick: function () { go('lab:hick'); }
    }, ['Начать первый опыт']);
    startBtn.appendChild(A.icon('arrow')).classList.add('ico');

    left.appendChild(h('div.cta-row', [
      startBtn,
      h('button.btn.btn--ghost', { type: 'button', onclick: function () { jump('how'); } }, ['Как это работает'])
    ]));

    var r2 = h('span.viz__r2', ['R² 0%']);
    var canvasHost = h('div');
    var viz = h('div.viz', [
      h('div.viz__bar', [
        h('i.viz__dot'), h('i.viz__dot'), h('i.viz__dot'),
        h('span.viz__name', { text: 'пример графика · скорость мысли' }),
        h('span.viz__live', [h('i'), A.raw(A.i18n.t('демо'))])
      ]),
      h('div.viz__body', [
        canvasHost,
        h('div.viz__foot', [h('span.viz__eq', ['пример данных']), r2])
      ])
    ]);

    view.appendChild(h('section.hero', [
      h('img.hero__image', { src: 'assets/hero.jpg', alt: '', fetchPriority: 'high' }),
      h('div.hero__grid', [left, viz])
    ]));

    /* цифры */
    var stats = h('div.stats', [
      stagger(h('div.stat', [h('div.stat__n', [A.raw('8 048')]), h('div.stat__t', { text: 'школ в стране' })]), 0),
      stagger(h('div.stat', [h('div.stat__n', [A.raw('967')]), h('div.stat__t', { text: 'получили новые кабинеты в 2024' })]), 1),
      stagger(h('div.stat.stat--accent', [h('div.stat__n', [A.raw('0 ₸')]), h('div.stat__t', { text: 'дополнительное оборудование при наличии телефона' })]), 2),
      stagger(h('div.stat.stat--accent', [h('div.stat__n', [A.raw(String(A.labs.length))]), h('div.stat__t', { text: 'опыта работают сейчас' })]), 3)
    ]);
    view.appendChild(stats);

    /* проблема */
    view.appendChild(sec(null, 'Проблема', 'Школьный кабинет не всегда доступен, когда хочется экспериментировать',
      'Современные кабинеты появляются в школах. Но дома ученик часто может только читать или смотреть симуляцию. QaltaLab даёт ему собственные измерения на доступном телефоне.'));
    var pcards = h('div.cards.cards--3');
    PROBLEM.forEach(function (p, i) {
      pcards.appendChild(stagger(h('div.fcard', [
        h('div.fcard__n', [A.raw(p.n)]),
        h('div.fcard__t', { text: p.t }),
        h('div.fcard__d', { text: p.d })
      ]), i));
    });
    view.appendChild(pcards);
    view.appendChild(h('p.note', [
      'Источники: ',
      h('a', { href: 'https://stat.gov.kz/ru/news/bolee-8-tysyach-shkol-kazakhstana-nachali-novyy-uchebnyy-god/', target: '_blank', rel: 'noopener noreferrer' }, ['Бюро национальной статистики']),
      '; ',
      h('a', { href: 'https://www.gov.kz/memleket/entities/edu/documents/details/836066', target: '_blank', rel: 'noopener noreferrer' }, ['Министерство просвещения'])
    ]));

    view.appendChild(h('blockquote.quote', [
      A.raw(A.i18n.t('При наличии телефона специальное оборудование не требуется.')),
      h('span', ['Телефон может измерить время реакции и частоту звука. Результат зависит от устройства и условий опыта — поэтому данные нужно обсуждать, а не просто принимать на веру.'])
    ]));

    /* для кого */
    view.appendChild(sec(null, 'Для кого', 'Семиклассник, который не видел лабораторию',
      'Кейс просит выбрать конкретику, и мы её выбрали: 7–9 класс, физика, раздел «Звук и колебания», плюс сам научный метод. Опыты подобраны так, чтобы к ним не требовалось ничего, кроме телефона и бутылки воды.'));

    /* опыты */
    view.appendChild(sec('labs', 'Опыты', 'Три настоящих измерения',
      'Результат у каждого свой — потому что измеряет он себя и свою комнату, а не картинку.'));
    var list = h('div.labs.labs--2');
    ['hick', 'pitch', 'hearing'].forEach(function (id, i) {
      var lab = A.lab.byId(id);
      if (lab) list.appendChild(labCard(lab, i));
    });
    view.appendChild(list);

    view.appendChild(h('div.score', [
      h('div.score__n', [A.raw(A.store.openedCount() + '/' + A.labs.length)]),
      h('div.score__t', ['Завершено опытов. Сравни свои данные с моделью и выясни, где она работает, а где нет.'])
    ]));

    var soon = h('div.labs.labs--2');
    SOON.forEach(function (s, i) { soon.appendChild(soonCard(s, i)); });
    view.appendChild(h('div', { style: { marginTop: '12px' } }, [soon]));

    /* как работает */
    view.appendChild(sec('how', 'Как это работает', 'Пять шагов научного метода',
      'Два шага из пяти — те, ради которых всё построено: гипотеза записывается до опыта, а формула не показывается, пока ученик не выведет её сам.'));
    var how = h('div.how.how--2');
    HOW.forEach(function (s, i) {
      how.appendChild(stagger(h('div.how__row' + (s.key ? '.how__row--key' : ''), [
        h('div.how__n', [A.raw(String(i + 1))]),
        h('div', [h('div.how__t', { text: s.t }), h('div.how__d', { text: s.d })])
      ]), i));
    });
    view.appendChild(how);

    /* учителю */
    view.appendChild(sec('teacher', 'Учителю', 'Как это попадает в класс',
      'Если у ученика есть телефон, школе не требуется специальное оборудование для этих опытов. Нужна ссылка.'));
    var tcards = h('div.cards.cards--3');
    TEACHER.forEach(function (t, i) {
      tcards.appendChild(stagger(h('div.fcard', [
        h('div.fcard__ic', [A.icon(t.ic)]),
        h('div.fcard__t', { text: t.t }),
        h('div.fcard__d', { text: t.d })
      ]), i));
    });
    view.appendChild(tcards);

    /* сравнение */
    view.appendChild(sec(null, 'Чем отличается', 'Похожие решения есть. Разница в том, откуда берутся числа',
      'Мы не утверждаем, что придумали измерения телефоном: этим занимаются и университеты, и готовые приложения. Мы соединили их с научным методом и школьной задачей.'));
    var table = h('table.vs');
    var thead = h('thead'), trh = h('tr');
    VS_HEAD.forEach(function (c, i) { trh.appendChild(h('th', { className: i === 4 ? 'is-us' : '' }, [c ? A.i18n.t(c) : ''])); });
    thead.appendChild(trh);
    table.appendChild(thead);
    var tbody = h('tbody');
    VS.forEach(function (row) {
      var tr = h('tr');
      row.forEach(function (c, i) { tr.appendChild(h('td', { className: i === 4 ? 'is-us' : '' }, [c])); });
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    view.appendChild(h('div.vs-wrap', [table]));

    /* что внутри */
    view.appendChild(sec(null, 'Что внутри', 'Технологии, без которых опыт был бы рисунком', null));
    var tech = h('div.cards.cards--2');
    TECH.forEach(function (t, i) {
      tech.appendChild(stagger(h('div.fcard', [
        h('div.fcard__ic', [A.icon(t.ic)]),
        h('div.fcard__t', { text: t.t }),
        h('div.fcard__d', { text: t.d })
      ]), i));
    });
    view.appendChild(tech);

    /* основа */
    view.appendChild(sec('basis', 'На чём это основано', 'Не придумано, а взято из работ',
      'И сами опыты, и порядок шагов опираются на конкретные исследования.'));
    var src = h('div.sources.sources--2');
    SOURCES.forEach(function (s, i) {
      src.appendChild(stagger(h('div.src', [
        h('div.src__t', { text: s.t }),
        h('div.src__w', { text: s.w }),
        h('div.src__d', { text: s.d })
      ]), i));
    });
    view.appendChild(src);

    /* куда растёт */
    view.appendChild(sec(null, 'Куда растёт', 'Что дальше', null));
    var road = h('div.road');
    ROAD.forEach(function (r) {
      road.appendChild(h('div.road__row', [
        h('div.road__m', [A.icon('arrow')]),
        h('div', [h('div.road__t', { text: r.t }), h('div.road__d', { text: r.d })])
      ]));
    });
    view.appendChild(road);

    /* подвал */
    view.appendChild(footer());

    if (heroStop) { heroStop(); heroStop = null; }
    if (A.hero) heroStop = A.hero.create(canvasHost, function (v) { r2.textContent = 'R² ' + v + '%'; });

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

  function go(next) { route = next; render(); }

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
  var NAV = { labs: 'Опыты', how: 'Как работает', teacher: 'Учителю', basis: 'Основа' };

  function paintNav() {
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

    render();
  }

  A.app = { go: go, render: render, init: init, jump: jump };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})(window.A);
