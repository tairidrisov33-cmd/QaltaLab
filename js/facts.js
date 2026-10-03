/* Все числа, которые QaltaLab показывает о мире и о себе, — в одном месте.
   Сайт берёт их отсюда, а tools/check-facts.js сверяет с ними README, чтобы
   цифры нигде не разошлись. Проценты не хранятся, а считаются из ответов. */

window.A = window.A || {};

(function (A) {
  'use strict';

  var F = {
    schools: {
      count: 8048, date: '31.08.2026',
      source: 'Бюро национальной статистики',
      url: 'https://stat.gov.kz/ru/news/bolee-8-tysyach-shkol-kazakhstana-nachali-novyy-uchebnyy-god/'
    },
    cabinets: {
      cabinets: 1621, schools: 967, rural: 601, urban: 366, year: 2024,
      source: 'Министерство просвещения',
      url: 'https://www.gov.kz/memleket/entities/edu/documents/details/836066'
    },
    // PISA 2022, ОЭСР: доля 15-летних, достигших базового уровня (Level 2)
    // по естественным наукам. Дословно в Country Note: «Some 55% of students
    // in Kazakhstan attained Level 2 or higher in science (OECD average: 76%)».
    pisa: {
      year: 2022, kz: 55, oecd: 76,
      source: 'ОЭСР, PISA 2022',
      url: 'https://www.oecd.org/en/publications/pisa-2022-results-volume-i-and-ii-country-notes_ed6fbcc5-en/kazakhstan_8c403c04-en.html'
    },
    // Голос учителя: заполняется только настоящим интервью (с согласия
    // учителя). Пока null — блок на главной не показывается.
    teacher: null,

    // Пилотное тестирование QaltaLab (Google Форма). Возраст и статус
    // участников анкета не фиксировала — поэтому «участники», а не «школьники».
    pilot: {
      n: 29,
      understood: { yes: 22, partial: 7, no: 0 },
      mobile: { avg: 4.83, five: 24, fourPlus: 29 },
      format: { yes: 21, rather: 8 },
      wouldUse: { yes: 22, maybe: 7, no: 0 },
      overall: { avg: 4.79, five: 23, fourPlus: 29 },
      liked: [
        ['Интерактивные эксперименты', 28],
        ['Дизайн', 23],
        ['Использование возможностей телефона', 22],
        ['Простота', 22],
        ['Русский и казахский языки', 19]
      ],
      comments: { total: 9, positive: 8, moreGames: 1 }
    },

    // Раунд 2: живой урок с общим графиком класса, 03.10.2026, опыт «Чувство
    // времени», класс X6G44. runs — точки как есть из /api/class (серия = один
    // участник, x — заданный интервал, y — измеренный, с). R² и k сайт и
    // tools/check-facts.js считают из этих точек сами, руками не вписываются.
    // Ответы — первых семи участников, как их передала команда.
    classTest: {
      date: '03.10.2026', code: 'X6G44', lab: 'timing',
      runs: [
        [[2, 2.01], [4, 4.13], [8, 7.82], [16, 16.29]],
        [[2, 1.52], [4, 3.88], [8, 8.24], [16, 19.39]],
        [[2, 2.13], [4, 3.49], [8, 9.03], [16, 14.29]],
        [[2, 2.17], [4, 3.72], [8, 7.44], [16, 16.59]],
        [[2, 1.95], [4, 4.17], [8, 10.23], [16, 15.85]],
        [[2, 2.12], [4, 3.36], [8, 8.59], [16, 16.43]],
        [[2, 2.28], [4, 3.75], [8, 8.79], [16, 14.62]],
        [[2, 0.88], [4, 1.88], [8, 3.62], [16, 7.7]],
        [[2, 0.44], [4, 0.44], [8, 0.37], [16, 5.64]]
      ],
      // Серии, точки которых экран класса отметил как далёкие от общей кривой (номера с 1).
      odd: [8, 9],
      answered: 7,
      answers: [
        ['Получилось зайти по QR-коду с первого раза?', 'Да'],
        ['Что было непонятно или неудобно?', 'Практически всё понятно и интересно'],
        ['Понятно, что показывает общий график?', 'Да']
      ],
      url: 'https://qaltalab.site/#/class/X6G44'
    }
  };

  // Доля от числа участников с одним знаком после запятой: 22/29 → 75.9.
  F.pct = function (count) { return Math.round(count / F.pilot.n * 1000) / 10; };

  // Итоги живого урока считаются из точек — той же подгонкой, что на экране
  // класса. fit = A.fit, model = первая модель опыта (T = k · t).
  F.classStats = function (fit, model) {
    var C = F.classTest, all = [], main = [], odd = [], ks = [];
    var pts = function (run) { return run.map(function (p) { return { x: p[0], y: p[1] }; }); };
    C.runs.forEach(function (run, i) {
      var p = pts(run);
      all = all.concat(p);
      if (C.odd.indexOf(i + 1) >= 0) odd = odd.concat(p);
      else { main = main.concat(p); ks.push(fit.best(model, p).params.k); }
    });
    var fa = fit.best(model, all), fm = fit.best(model, main);
    var r = function (v) { return Math.round(v * 100) / 100; };
    return {
      n: C.runs.length, points: all.length, main: main, oddPoints: odd,
      regular: C.runs.length - C.odd.length,
      r2All: Math.round(fa.r2 * 100), r2Main: Math.round(fm.r2 * 100), kMain: r(fm.params.k),
      kMin: r(Math.min.apply(null, ks)), kMax: r(Math.max.apply(null, ks)),
      kOdd: r(fit.best(model, pts(C.runs[C.odd[0] - 1])).params.k),
      // замеры короче полсекунды во второй отмеченной серии — похоже на случайное «Стоп»
      tiny: C.runs[C.odd[1] - 1].filter(function (p) { return p[1] < 0.5; }).length
    };
  };

  // Русская и казахская запись: 8 048, 4,83, 75,9.
  F.fmt = function (v, digits) {
    var s = v.toFixed(digits || 0).split('.');
    s[0] = s[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    return s.join(',');
  };

  A.facts = F;
})(window.A);
