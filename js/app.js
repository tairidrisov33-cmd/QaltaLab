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

  var PATH = [
    { ic: 'quest', t: 'Теория', d: 'формула на доске и готовый пример' },
    { ic: 'phone', t: 'QaltaLab', d: 'телефон превращается в прибор', us: true },
    { ic: 'mic', t: 'Реальное измерение', d: 'микрофон, камера, касания, динамик' },
    { ic: 'chart', t: 'Собственные данные', d: 'таблица и график — у каждого свои' },
    { ic: 'spark', t: 'Понимание', d: 'закон, выведенный самим учеником', end: true }
  ];

  var WHY = [
    { ic: 'flask', t: 'Без оборудования', d: 'Нужен телефон или компьютер с браузером — и вещи, которые есть дома.' },
    { ic: 'chart', t: 'Интерактивно', d: 'Меняй параметры модели и сразу видь, как кривая ложится на твои точки.' },
    { ic: 'quest', t: 'Можно ошибаться', d: 'Гипотеза может не подтвердиться. Повтори опыт сколько нужно — в других условиях.' },
    { ic: 'target', t: 'Доступно', d: 'Работает на телефоне, планшете и компьютере. Без установки и регистрации.' },
    { ic: 'wave', t: 'Два языка', d: 'Русский және қазақша — переключается в любой момент, даже посреди опыта.' },
    { ic: 'spark', t: 'Персональный разбор результатов', d: 'Zerde AI объясняет именно твои данные и подсказывает следующий эксперимент. Он появляется в конце опыта, на экране результата.', go: 'timing', cta: 'Попробовать с Zerde' }
  ];

  // Пять шагов научного метода — маршрут с иконками, на шаге 4 живой график.
  var HOW = [
    { ic: 'quest', t: 'Вопрос', d: 'Понятный вопрос вместо параграфа.' },
    { ic: 'spark', t: 'Гипотеза', d: 'Предсказание записывается до опыта.' },
    { ic: 'mic', t: 'Измерение', d: 'Телефон меряет по-настоящему.' },
    { ic: 'chart', t: 'Данные + модель', d: 'Ползунки подгоняют кривую, R² сразу.', graph: true },
    { ic: 'flask', t: 'Открытие', d: 'Закон, формула и «почему так».' }
  ];

  // Телефон как прибор: что именно даёт устройство. Только то, что реально
  // используют опыты.
  var DEVICE = [
    { ic: 'mic', t: 'Микрофон', d: 'частота звука' },
    { ic: 'speaker', t: 'Динамик', d: 'генерация тона' },
    { ic: 'touch', t: 'Касание', d: 'время реакции' },
    { ic: 'camera', t: 'Камера', d: 'оптическое измерение пульса' },
    { ic: 'timer', t: 'Таймер', d: 'период и время' },
    { ic: 'chart', t: 'Canvas', d: 'график' },
    { ic: 'code', t: 'JavaScript', d: 'анализ и R²' }
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
    { t: 'Активное обучение', w: 'PNAS · Гарвард', y: 2019, d: 'Действие даёт больше, чем объяснение, — даже если ученику кажется наоборот.', u: 'https://doi.org/10.1073/pnas.1821936116' },
    { t: 'Активное обучение в STEM', w: 'PNAS · метаанализ 225 работ', y: 2014, d: 'Доля несдавших падает, средние баллы растут.', u: 'https://doi.org/10.1073/pnas.1319030111' },
    { t: 'Предскажи — проверь — объясни', w: 'White & Gunstone', y: 1992, d: 'Отсюда наш шаг гипотезы до опыта и разбор расхождений.', u: 'https://doi.org/10.4324/9780203761342' },
    { t: 'Смартфон как прибор', w: 'phyphox · RWTH Aachen', y: null, d: 'Университет использует датчики телефона для школьных опытов.', u: 'https://phyphox.org' }
  ];

  var NOW = ['9 опытов с настоящими измерениями', 'русский и казахский', 'ссылки для класса и листы для урока', 'пилотный тест, n = 29', 'Zerde AI — разбор результата'];
  var NEXT = [
    { t: 'Дальше: больше опытов', d: 'ускорение, наклон, магнитное поле — датчики, которые уже есть в телефоне' },
    { t: 'Дальше: удобнее учителю', d: 'готовые наборы уроков из нескольких опытов' },
    { t: 'Потом: инструменты для класса и пилот больше', d: 'общий график класса, проверка в школах, химия и инженерия' }
  ];

  // Сравнение подходов, а не конкретных продуктов: «зависит» — где бывает по-разному.
  var DIFF = [
    ['Реальные измерения', 0, 1, 1],
    ['Гипотеза до опыта', 0, 0, 1],
    ['График своих данных', 0, 1, 1],
    ['Ведёт от вопроса к выводу', 0, 'частично', 1],
    ['Русский и казахский', 'зависит', 'зависит', 1],
    ['Работает в браузере', 1, 'зависит', 1],
    ['Ссылка для класса', 0, 'зависит', 1]
  ];

  var ARCH = [
    ['Телефон и браузер', 'ученик открывает ссылку'],
    ['API устройства', 'микрофон, камера, динамик, касания'],
    ['Движок опыта', 'пять шагов научного метода'],
    ['Анализ на устройстве', 'подгонка модели и R²'],
    ['График и результат', 'закон и объяснение'],
    ['Zerde AI', 'по кнопке: числа опыта → разбор и следующий шаг', true]
  ];

  var UNIT = [
    ['1 ученик', '1 ссылка — и опыт на его телефоне'],
    ['1 класс', 'ссылка для класса — все проводят один опыт'],
    ['1 учитель', 'листы для урока к каждому опыту'],
    ['1 школа', 'библиотека из 9 опытов по физике, биологии и информатике']
  ];

  var COST = [
    ['0 ₸', 'на лабораторное оборудование: приборы уже есть в телефонах учеников'],
    ['0', 'установок и аккаунтов — урок начинается со ссылки'],
    ['1', 'ссылка, чтобы весь класс открыл один и тот же опыт'],
    ['1', 'файл кода — и в библиотеке появляется новый опыт']
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


  // Предмет опыта даёт карточке маленький цветовой акцент: физика, биология
  // или мышление и данные. Бренд остаётся зелёным, акцент — только метка.
  function area(lab) {
    var s = lab.subject || '';
    if (/^(Физика|Механика)/.test(s)) return 'phys';
    if (/^Биология/.test(s)) return 'bio';
    return 'cog';
  }

  // Первый опыт для новичка — самый короткий и работающий на любом устройстве.
  function featured(lab) {
    var go = function () { go2('lab:' + lab.id); };
    var btn = h('button.btn.btn--primary', { type: 'button', onclick: go }, ['Попробовать сейчас']);
    btn.appendChild(A.icon('arrow')).classList.add('ico');
    return h('div.feat', [
      h('div.feat__art', [A.scene(lab.id)]),
      h('div.feat__body', [
        h('span.feat__kick', ['Начни отсюда']),
        h('h3.feat__t', { text: lab.title }),
        h('p.feat__q', { text: lab.question }),
        h('div.labcard__meta', [
          h('span.tag.tag--time', [A.raw(A.i18n.t(lab.time))]),
          h('span.tag', ['Только телефон']),
          h('span.tag', ['Без дополнительных предметов'])
        ]),
        btn
      ])
    ]);
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
    return stagger(h('button.labcard.labcard--has-go.labcard--' + area(lab), {
      type: 'button', onclick: function () { go('lab:' + lab.id); }
    }, [
      h('div.labcard__visual', [A.scene(lab.id)]),
      h('div.labcard__icon', [A.icon(LAB_ICON[lab.id] || 'flask')]),
      h('div', [
        h('div.labcard__t', { text: lab.title }),
        h('div.labcard__s', { text: lab.question }),
        meta
      ]),
      h('div.labcard__go', [h('span', ['Открыть опыт']), A.icon('arrow')])
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
    }, ['Попробовать за 2 минуты']);
    startBtn.appendChild(A.icon('arrow')).classList.add('ico');

    left.appendChild(h('div.cta-row', [
      startBtn,
      h('button.btn.btn--ghost', { type: 'button', onclick: function () { go('demo:pendulum'); } }, ['Посмотреть пример результата'])
    ]));
    left.appendChild(h('p.hero__hint', ['Первый опыт займёт около минуты: «Чувство времени», нужен только экран.']));
    left.appendChild(h('p.hero__privacy', ['Без аккаунта. Измерения обрабатываются на устройстве.']));
    // Чем именно телефон становится прибором — четыре значка вместо абзаца.
    var caps = h('ul.hero__caps', { 'aria-label': 'Чем измеряет телефон' });
    [['mic', 'Микрофон'], ['camera', 'Камера'], ['touch', 'Касание'], ['chart', 'Твои данные']].forEach(function (c) {
      caps.appendChild(h('li', [A.icon(c[0]), h('span', { text: c[1] })]));
    });
    left.appendChild(caps);

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
      h('div.hero__grid', [left, h('div.phone', [h('i.phone__notch'), viz])])
    ]));

    /* проблема и решение — одна история: слева что мешает, справа как
       QaltaLab превращает формулу на доске в собственные данные ученика */
    var FS = A.facts.schools, FC = A.facts.cabinets;
    var src = function (text, url) {
      return h('a.fact__src', { href: url, target: '_blank', rel: 'noopener noreferrer' }, [A.raw(text)]);
    };
    var nums = h('div.pnums');
    [
      [A.facts.fmt(FS.count), 'общеобразовательных школ в Казахстане'],
      [A.facts.fmt(FC.cabinets), 'современных предметных кабинетов закуплено по итогам 2024 года'],
      [A.facts.fmt(FC.schools), 'школ получили эти кабинеты'],
      [A.facts.fmt(FC.rural), 'из них — сельские']
    ].forEach(function (n, i) {
      nums.appendChild(stagger(h('div.pnum', [h('b', [A.raw(n[0])]), h('span', { text: n[1] })]), i));
    });
    var story = h('div.story__steps');
    PATH.forEach(function (p, i) {
      story.appendChild(stagger(h('div.story__s' + (p.us ? '.is-us' : '') + (p.end ? '.is-end' : ''), [
        h('span.story__ic', [A.icon(p.ic)]),
        h('div', [h('b', { text: p.t }), h('span', { text: p.d })])
      ]), i));
    });
    view.appendChild(h('section.sec.problem', { id: 'problem' }, [
      h('div.problem__left', [
        chip('Проблема', null, true),
        h('h2.sec__h', ['STEM должен быть доступен каждому']),
        h('p.sec__lead', ['Не у каждой школы есть лаборатория, оборудование и расходные материалы. Поэтому физику и другие STEM-предметы часто изучают только в теории.']),
        nums,
        h('p.problem__claim', ['Практический STEM не должен зависеть от того, свободен ли специализированный кабинет в конкретный момент.']),
        h('p.problem__sub', ['Для многих экспериментов уже достаточно устройства, которое есть рядом с учеником, — телефона.']),
        h('p.note', [
          src(A.i18n.t(FS.source) + ', ' + FS.date, FS.url), h('span', [A.raw(' · ')]),
          src(A.i18n.t(FC.source) + ', ' + FC.year, FC.url)
        ])
      ]),
      h('div.story', { id: 'measure' }, [
        h('div.story__h', ['Не наблюдай — измеряй']),
        h('p.story__lead', ['Телефон становится лабораторным прибором: ученик получает данные своего эксперимента и сам находит зависимость.']),
        story
      ])
    ]));

    /* почему QaltaLab */
    view.appendChild(sec('why', 'Почему QaltaLab', 'Опыт, который можно поставить сегодня', null));
    var why = h('div.why');
    WHY.forEach(function (w, i) {
      var card = h('div.why__c' + (w.go ? '.why__c--go' : ''), [
        h('div.why__ic', [A.icon(w.ic)]),
        h('div.why__t', { text: w.t }),
        h('div.why__d', { text: w.d })
      ]);
      // Zerde живёт в конце опыта — карточка сразу туда и ведёт.
      if (w.go) {
        var b = h('button.why__go', { type: 'button', onclick: function () { go('lab:' + w.go); } }, [w.cta]);
        b.appendChild(A.icon('arrow'));
        card.appendChild(b);
      }
      why.appendChild(stagger(card, i));
    });
    view.appendChild(why);
    var fit = h('ul.casefit__list');
    ['интерактивность', 'доступность', 'обучение через эксперимент', 'можно ошибаться', 'меняешь параметры', 'сразу видишь результат'].forEach(function (t) {
      fit.appendChild(h('li', [A.icon('check'), h('span', { text: t })]));
    });
    view.appendChild(h('div.casefit', [h('div.casefit__h', [h('span', ['Кейс']), h('b', ['«STEM без сложного оборудования»'])]), fit]));

    /* опыты: сначала один короткий опыт, потом все девять */
    view.appendChild(sec('labs', 'Опыты', 'Девять способов использовать телефон как прибор', null));
    view.appendChild(h('p.notsim', [h('b', ['Не симуляция.']), h('span', [' Телефон измеряет реальное действие или физический сигнал, а график строится по твоим данным.'])]));
    view.appendChild(featured(A.lab.byId('timing')));

    view.appendChild(sec('physics', 'Основной трек', 'Три физических опыта без лаборатории',
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

    /* как работает: маршрут научного метода */
    var howBand = h('div.band.band--grid');
    howBand.appendChild(sec('how', 'Как это работает', 'Пять шагов научного метода в каждом опыте', null));
    view.appendChild(howBand);
    var journey = h('ol.journey');
    HOW.forEach(function (st, i) {
      var li = stagger(h('li.journey__s', [
        h('span.journey__n', [A.raw(String(i + 1))]),
        h('span.journey__ic', [A.icon(st.ic)]),
        h('b', { text: st.t }),
        h('span.journey__d', { text: st.d })
      ]), i);
      if (st.graph) li.appendChild(miniGraph());
      journey.appendChild(li);
    });
    howBand.appendChild(journey);

    /* пилотное тестирование — только настоящие ответы, n = 29 */
    view.appendChild(pilot());

    /* чем отличается */
    view.appendChild(sec(null, 'Чем отличается', 'Формула, с которой можно взаимодействовать', null));
    var table = h('table.diff');
    table.appendChild(h('thead', [h('tr', [h('th'), h('th', ['Учебник']), h('th', ['Сенсорный инструмент']), h('th.is-us', [A.raw('QaltaLab')])])]));
    var tb = h('tbody');
    DIFF.forEach(function (row) {
      var tr = h('tr', [h('th', { text: row[0] })]);
      row.slice(1).forEach(function (c, i) {
        var cell = c === 1 ? h('span.diff__y', { 'aria-label': 'да' }, [A.icon('check')]) : c === 0 ? h('span.diff__n', { 'aria-label': 'нет' }, [A.raw('—')]) : h('span.diff__m', { text: c });
        tr.appendChild(h('td' + (i === 2 ? '.is-us' : ''), [cell]));
      });
      tb.appendChild(tr);
    });
    table.appendChild(tb);
    view.appendChild(h('div.diff-wrap', [table]));
    view.appendChild(h('p.flow__line', ['QaltaLab — не коллекция симуляций. Главный объект эксперимента — реальные данные ученика.']));
    view.appendChild(h('p.note', ['phyphox (RWTH Aachen) показывает, насколько мощным научным прибором может быть смартфон. QaltaLab решает другую задачу: провести школьника от вопроса и гипотезы до собственного вывода — в браузере и на русском или казахском.']));

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
    TEACH.forEach(function (t, i) { steps.appendChild(h('li', [h('span.teach__n', [A.raw(String(i + 1))]), h('span', { text: t })])); });
    var links = h('div.teach__links');
    ['pitch', 'pendulum', 'hearing', 'timing', 'hick', 'fitts', 'practice', 'memory', 'pulse'].forEach(function (id) {
      var lab = A.lab.byId(id);
      if (!lab) return;
      links.appendChild(h('div.teach__row', [
        h('span.teach__t', { text: lab.title }),
        h('span.teach__acts', [
          h('button.linkbtn', { type: 'button', onclick: function () { go('lesson:' + id); } }, ['Лист для урока']),
          h('button.linkbtn', { type: 'button', onclick: function () { A.lab.copyLink(id); } }, ['Ссылка для класса'])
        ])
      ]));
    });
    view.appendChild(h('div.teach', [
      h('div', [h('h3.sub-h', ['Как провести опыт с классом']), steps,
        h('p.note', ['Регистрация не нужна ни учителю, ни ученикам. Ссылка открывает опыт сразу.'])]),
      links
    ]));

    /* телефон = лаборатория */
    view.appendChild(sec('tech', 'Технологии', 'Телефон — это лаборатория', 'QaltaLab использует возможности самого устройства как лабораторные инструменты.'));
    var dev = h('div.device');
    var left = h('ul.device__col'), right = h('ul.device__col');
    DEVICE.forEach(function (d, i) {
      (i < 3 ? left : right).appendChild(stagger(h('li.device__i', [
        h('span.device__ic', [A.icon(d.ic)]),
        h('span', [h('b', { text: d.t }), h('span', { text: d.d })])
      ]), i));
    });
    dev.appendChild(left);
    dev.appendChild(h('div.device__phone', [h('i.phone__notch'), h('div.device__screen', [miniGraph(), h('span', ['Твои данные'])])]));
    dev.appendChild(right);
    view.appendChild(dev);
    view.appendChild(h('p.device__line', ['Без установки · В браузере · На устройстве']));
    var arch = h('ol.arch');
    ARCH.forEach(function (st, i) {
      arch.appendChild(stagger(h('li' + (st[2] ? '.is-opt' : ''), [h('b', { text: st[0] }), h('span', { text: st[1] })]), i));
    });
    view.appendChild(h('div.arch-wrap', [h('h3.sub-h', ['Как устроен QaltaLab']), arch]));
    view.appendChild(h('div.limits', [
      h('b', ['Ограничения измерений']),
      h('span', ['Результат зависит от устройства, шума вокруг, освещения и того, как ученик выполняет опыт. Поэтому QaltaLab показывает R² и честно говорит, когда данных мало.'])
    ]));
    view.appendChild(h('p.stack__priv', ['Измерения обрабатываются на устройстве. При запуске Zerde AI на сервер уходят только обезличенные числа этого опыта.']));

    /* сколько стоит школе: только проверяемые вещи */
    view.appendChild(sec('cost', 'Масштаб', 'Почему это масштабируется', 'Каждый шаг распространения почти ничего не стоит: нужны только телефоны или компьютеры с браузером и интернет.'));
    var cost = h('div.cost');
    COST.forEach(function (c, i) {
      cost.appendChild(stagger(h('div.cost__c', [h('b.cost__n', [A.raw(c[0])]), h('span', { text: c[1] })]), i));
    });
    view.appendChild(cost);
    var unit = h('ol.unit');
    UNIT.forEach(function (u, i) {
      unit.appendChild(stagger(h('li', [h('b', { text: u[0] }), h('span', { text: u[1] })]), i));
    });
    view.appendChild(unit);
    view.appendChild(h('p.note', ['Новый опыт добавляется поверх общего движка: настройка опыта, логика измерения и объяснение результата. Код открыт на GitHub.']));

    /* развитие: что работает, что дальше */
    view.appendChild(sec(null, 'Развитие', 'От девяти опытов к STEM-платформе', null));
    var nowList = h('ul.road3__now');
    NOW.forEach(function (t) { nowList.appendChild(h('li', [A.icon('check'), h('span', { text: t })])); });
    var next = h('ol.road3__next');
    NEXT.forEach(function (n, i) {
      next.appendChild(stagger(h('li', [h('b', { text: n.t }), h('span', { text: n.d })]), i));
    });
    view.appendChild(h('div.road3', [
      h('div.road3__col.is-now', [h('span.road2__m', ['Работает сейчас']), nowList]),
      h('div.road3__col', [h('span.road2__m', ['Планируется']), next])
    ]));
    view.appendChild(h('p.note', ['Это план развития: внедрения в школах пока нет.']));

    /* основа */
    view.appendChild(sec('basis', 'На чём это основано', 'Не придумано, а взято из работ', null));
    var src = h('div.srcs');
    SOURCES.forEach(function (sc, i) {
      src.appendChild(stagger(h('a.srcc', { href: sc.u, target: '_blank', rel: 'noopener noreferrer' }, [
        h('span.srcc__w', [A.raw(A.i18n.t(sc.w) + (sc.y ? ' · ' + sc.y : ''))]),
        h('b', { text: sc.t }),
        h('span.srcc__d', { text: sc.d }),
        h('span.srcc__go', [A.icon('arrow')])
      ]), i));
    });
    view.appendChild(src);

    view.appendChild(footer());

    if (heroStop) { heroStop(); heroStop = null; }
    if (A.hero) heroStop = A.hero.create(vizBody, function () { go('lab:pendulum'); });

    reveal(view);
    window.scrollTo(0, 0);
  }

  // Секции проявляются при прокрутке. Первый экран не трогаем — он виден сразу.
  function reveal(view) {
    if (!('IntersectionObserver' in window)) return;
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    var items = view.querySelectorAll('.problem, .why, .feat, .labs, .journey, .pilot, .teach, .cmp, .device, .cost, .road3, .srcs');
    var io = new IntersectionObserver(function (list) {
      list.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px' });
    for (var i = 0; i < items.length; i++) { items[i].classList.add('reveal'); io.observe(items[i]); }
  }

  // Пилотное тестирование: четыре главных числа, что понравилось и что мы
  // из этого поменяли. Все значения — из A.facts, проценты считаются там же.
  function pilot() {
    var P = A.facts.pilot, pct = A.facts.pct;
    var f1 = function (v) { return A.facts.fmt(v, v % 1 ? 1 : 0) + '%'; };
    var box = h('section.sec.pilot', { id: 'pilot' }, [
      chip('Пилотное тестирование', null, true),
      h('h2.sec__h', ['Проверили на реальных пользователях']),
      h('p.sec__lead', [A.raw(A.i18n.fmt('{n} участников · анкета после опыта', { n: P.n }))])
    ]);
    var kpi = h('div.pilot__kpi');
    [
      [A.facts.fmt(P.mobile.avg, 2) + ' / 5', 'удобство с телефона'],
      [A.facts.fmt(P.overall.avg, 2) + ' / 5', 'общая оценка QaltaLab'],
      [f1(pct(P.format.yes + P.format.rather)), 'ответили «Да» или «Скорее да»: формат «попробуй сам — сразу увидь результат» помогает понимать STEM'],
      [f1(pct(P.liked[0][1])), 'отметили интерактивные эксперименты']
    ].forEach(function (k, i) {
      kpi.appendChild(stagger(h('div.pilot__k', [h('div.pilot__n', [A.raw(k[0])]), h('div.pilot__t', { text: k[1] })]), i));
    });
    box.appendChild(kpi);

    var bars = h('div.pilot__bars', [h('div.pilot__bh', ['Что понравилось, можно было выбрать несколько'])]);
    P.liked.forEach(function (l) {
      var fill = h('i');
      fill.style.width = pct(l[1]) + '%';
      bars.appendChild(h('div.pbar', [
        h('span.pbar__t', { text: l[0] }),
        h('span.pbar__track', [fill]),
        h('span.pbar__v', [A.raw(f1(pct(l[1])) + ' · ' + l[1] + '/' + P.n)])
      ]));
    });
    box.appendChild(bars);

    // Доли ответов одной полосой: видно и «да», и «возможно», и что «нет» — ноль.
    var seg = function (title, parts) {
      var bar = h('div.seg__bar'), legend = h('div.seg__legend');
      parts.forEach(function (p, i) {
        var w = pct(p[0]);
        if (w > 0) { var piece = h('i.seg__p' + i); piece.style.width = w + '%'; bar.appendChild(piece); }
        legend.appendChild(h('span', [h('i.seg__dot.seg__p' + i), h('b', [A.raw(f1(w))]), h('span', { text: p[1] }), h('em', [A.raw(p[0] + '/' + P.n)])]));
      });
      return h('div.seg', [h('div.seg__h', { text: title }), bar, legend]);
    };
    box.appendChild(h('div.pilot__split', [
      seg('Хотели бы использовать QaltaLab на уроках или дома', [[P.wouldUse.yes, 'точно да'], [P.wouldUse.maybe, 'возможно'], [P.wouldUse.no, 'нет']]),
      seg('Поняли, что такое QaltaLab, с первого раза', [[P.understood.yes, 'да'], [P.understood.partial, 'частично'], [P.understood.no, 'нет']])
    ]));
    box.appendChild(h('div.pilot__insight', [
      h('b', ['Что мы узнали']),
      h('p', [A.raw(A.i18n.fmt('{a} сразу поняли, что такое QaltaLab, {b} — частично, не понял никто. Поэтому мы сделали первый экран и первый шаг опыта понятнее: сразу видно, что телефон становится прибором, а ученик получает собственные данные.',
        { a: f1(pct(P.understood.yes)), b: f1(pct(P.understood.partial)) }))]),
      h('div.pilot__loop', [A.raw(A.i18n.t('MVP → тест → вывод → улучшение'))])
    ]));
    box.appendChild(h('p.note', [A.raw(A.i18n.fmt('Пилотное тестирование, n = {n}. Самооценка участников, а не исследование учебной успеваемости. Возраст участников анкета не фиксировала. Открытый комментарий оставили {t} человек: {g} — положительные, один предложил добавить больше игровых элементов.',
      { n: P.n, t: P.comments.total, g: P.comments.positive }))]));
    return box;
  }

  // Маленький график «точки + кривая» для инфографики — тот же образ, что в опыте.
  function miniGraph() {
    var NS = 'http://www.w3.org/2000/svg';
    var svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', '0 0 120 64');
    svg.setAttribute('class', 'mini');
    svg.setAttribute('aria-hidden', 'true');
    svg.innerHTML = '<path class="mini__ax" d="M8 6V58H116"/><path class="mini__c" d="M10 56 C28 30, 52 18, 112 10"/>' +
      [[18, 46], [38, 31], [60, 22], [84, 16], [106, 12]].map(function (p) { return '<circle class="mini__p" cx="' + p[0] + '" cy="' + p[1] + '" r="3.4"/>'; }).join('');
    return svg;
  }

  // Лист для урока: план на 45 минут, таблица для записи данных и вопросы.
  // Печатается на одном-двух листах, на экране — обычная страница сайта.
  function lesson(id) {
    var lab = A.lab.byId(id), L = A.lessons && A.lessons[id];
    var view = document.getElementById('view');
    A.u.clear(view);
    if (!lab || !L) { go('home'); return; }

    var print = h('button.btn.btn--primary', { type: 'button', onclick: function () { window.print(); } }, ['Распечатать лист']);
    var copy = h('button.btn', { type: 'button', onclick: function () { A.lab.copyLink(id); } }, ['Ссылка для класса']);
    var open = h('button.btn', { type: 'button', onclick: function () { go('lab:' + id); } }, ['Открыть опыт']);

    var plan = h('ol.lesson__plan');
    var t = 0;
    A.lessonPlan.forEach(function (p, i) {
      plan.appendChild(stagger(h('li', [
        h('span.lesson__min', [A.raw(t + '–' + (t += +p[0]) + ' ' + A.i18n.t('мин'))]),
        h('div', [h('b', { text: p[1] }), h('span', { text: p[2] })])
      ]), i));
    });

    var steps = h('ol.lesson__steps');
    (lab.howto || []).forEach(function (st) { steps.appendChild(h('li', { text: st })); });

    var table = h('table.lesson__table');
    table.appendChild(h('thead', [h('tr', [h('th', ['№']), h('th', { text: L.cols[0] }), h('th', { text: L.cols[1] })])]));
    var body = h('tbody');
    for (var r = 1; r <= L.rows; r++) body.appendChild(h('tr', [h('td', [A.raw(String(r))]), h('td'), h('td')]));
    table.appendChild(body);

    var qs = h('ol.lesson__qs');
    L.q.concat(lab.next ? [lab.next] : []).forEach(function (q) { qs.appendChild(h('li', { text: q })); });

    view.appendChild(h('article.lesson', [
      h('div.labtop', [
        h('button.back', { type: 'button', onclick: function () { history.length > 1 ? history.back() : go('home'); } }, ['← Назад']),
        h('span.lesson__kick', ['Лист для урока'])
      ]),
      h('header.lesson__head', [
        h('div.lesson__art', [A.scene(id)]),
        h('div', [
          h('span.feat__kick', [A.raw(A.i18n.t(lab.subject) + ' · 7–9 ' + A.i18n.t('класс') + ' · 45 ' + A.i18n.t('мин'))]),
          h('h1.lesson__t', { text: lab.title }),
          h('p.lesson__q', { text: lab.question }),
          h('div.labcard__meta', [
            h('span.tag.tag--time', [A.raw(A.i18n.t('Опыт') + ' ' + A.i18n.t(lab.time))]),
            h('span.tag.tag--gear', { text: lab.gear })
          ])
        ])
      ]),
      h('div.lesson__actions', [print, copy, open]),
      h('section.lesson__card', [h('h2', ['Цель урока']), h('p', { text: L.goal })]),
      h('section.lesson__card', [h('h2', ['План урока']), plan]),
      h('div.lesson__grid', [
        h('section.lesson__card', [h('h2', ['Что делает ученик']), steps]),
        h('section.lesson__card', [h('h2', ['Таблица данных']), table, h('p.note', ['Ученик может вести таблицу на бумаге, а сайт построит такую же на телефоне.'])])
      ]),
      h('section.lesson__card', [h('h2', ['Вопросы для обсуждения']), qs]),
      h('section.lesson__card.lesson__link', [
        h('h2', ['Ссылка для учеников']),
        h('p.lesson__url', [A.raw(A.lab.linkTo(id).replace(/^https?:\/\//, ''))]),
        h('p.note', ['Регистрация не нужна. Измерения обрабатываются на телефоне ученика.'])
      ])
    ]));
    window.scrollTo(0, 0);
  }

  function footer() {
    var brand = h('div.foot__brand');
    var mark = document.querySelector('.brand__mark');
    if (mark) brand.appendChild(mark.cloneNode(true));
    brand.appendChild(h('b', [A.raw('QaltaLab')]));

    var start = h('button.btn.btn--primary', { type: 'button', onclick: function () { go('lab:timing'); } }, ['Начать эксперимент']);
    start.appendChild(A.icon('arrow')).classList.add('ico');
    return h('footer.foot.foot--close', [
      h('div.foot__hero', [
        brand,
        h('p.foot__big', ['Лаборатория в кармане.']),
        h('p.foot__sub', ['Настоящие эксперименты. Свои данные. Своё открытие.']),
        h('div.cta-row', [start])
      ]),
      h('div.foot__meta', [
        h('a', { href: 'https://github.com/tairidrisov33-cmd/QaltaLab', target: '_blank', rel: 'noopener noreferrer' }, ['GitHub']),
        h('span', ['WIT Teens Challenge 2026 · кейс «STEM без сложного оборудования»']),
        h('span', [A.raw('RU · ҚАЗ')]),
        h('span', [A.raw('© ' + new Date().getFullYear() + ' QaltaLab')])
      ])
    ]);
  }

  /* ---------- переходы ---------- */

  function go2(r) { go(r); }

  function jump(id) {
    if (route !== 'home') { go('home'); setTimeout(function () { jump(id); }, 60); return; }
    var el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // Адрес опыта постоянный (#/lab/hearing): учитель может отправить ссылку,
  // обновление страницы не выкидывает на главную, кнопка «назад» работает.
  function hashOf(r) {
    if (r.indexOf('lab:') === 0) return '#/lab/' + r.slice(4);
    if (r.indexOf('lesson:') === 0) return '#/lesson/' + r.slice(7);
    if (r.indexOf('demo:') === 0) return '#/demo/' + r.slice(5);
    return '#/';
  }

  function routeFromHash() {
    var m = /^#\/(lab|lesson|demo)\/([\w-]+)/.exec(location.hash);
    if (!m || !A.lab.byId(m[2])) return 'home';
    return m[1] + ':' + m[2];
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
    } else if (route.indexOf('demo:') === 0) {
      if (heroStop) { heroStop(); heroStop = null; }
      view.classList.remove('landing');
      view.classList.add('lab');
      A.lab.openDemo(route.slice(5));
    } else if (route.indexOf('lesson:') === 0) {
      if (heroStop) { heroStop(); heroStop = null; }
      A.lab.cleanup();
      view.classList.remove('landing');
      view.classList.add('lab');
      lesson(route.slice(7));
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
  var ARIA = { home: 'На главную', nav: 'Разделы', lang: 'Язык', theme: 'Тема оформления', menu: 'Меню разделов' };

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

  var zLang = null;
  function paintLang() {
    paintNav();
    if (A.zchat) { if (zLang && zLang !== A.i18n.lang) A.zchat.translate(); else A.zchat.refresh(); zLang = A.i18n.lang; }
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

    var bar = document.getElementById('topbar');
    document.getElementById('home').addEventListener('click', function () { go('home'); });
    document.getElementById('theme').addEventListener('click', function () { setTheme(theme === 'dark' ? 'light' : 'dark'); });
    document.getElementById('lang').addEventListener('click', function (e) {
      var b = e.target.closest('button[data-lang]');
      if (b) A.i18n.set(b.getAttribute('data-lang'));
    });
    document.getElementById('nav').addEventListener('click', function (e) {
      var b = e.target.closest('button[data-to]');
      if (b) { menu(false); jump(b.getAttribute('data-to')); }
    });
    // На телефоне разделы прячутся в меню под кнопкой — шапка остаётся в одну строку.
    var mb = document.getElementById('menu');
    var menu = function (on) {
      bar.classList.toggle('is-menu', on);
      mb.setAttribute('aria-expanded', on ? 'true' : 'false');
    };
    mb.addEventListener('click', function () { menu(!bar.classList.contains('is-menu')); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') menu(false); });
    document.addEventListener('click', function (e) { if (!bar.contains(e.target)) menu(false); });

    // Тонкая линия под шапкой появляется только когда страница прокручена —
    // на самом верху она лишняя.
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
    if (A.zchat) A.zchat.init();
    render();
  }

  A.app = { go: go, render: render, init: init, jump: jump };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})(window.A);
