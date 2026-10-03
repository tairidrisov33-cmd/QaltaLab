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

    // Тест общего графика класса 03.10.2026, опыт «Чувство времени», класс X6G44.
    // Числа — из /api/class (tools/qa/class-report.mjs X6G44) на момент теста:
    // кривая по всем 32 точкам T = k·t, R² = 88,1%. У семи участников k от 0,938
    // до 1,160; восьмой отмерял почти вдвое короче (k = 0,475) — его точки экран
    // подсветил как далёкие от общей кривой. Первые семь вошли по QR сами и
    // сказали, что почти всё было понятно и интересно.
    classTest: {
      date: '03.10.2026', code: 'X6G44', lab: 'timing',
      n: 8, points: 32, r2: 88, kMin: 0.94, kMax: 1.16, regular: 7, outlierK: 0.48,
      url: 'https://qaltalab.site/#/class/X6G44'
    }
  };

  // Доля от числа участников с одним знаком после запятой: 22/29 → 75.9.
  F.pct = function (count) { return Math.round(count / F.pilot.n * 1000) / 10; };

  // Русская и казахская запись: 8 048, 4,83, 75,9.
  F.fmt = function (v, digits) {
    var s = v.toFixed(digits || 0).split('.');
    s[0] = s[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    return s.join(',');
  };

  A.facts = F;
})(window.A);
