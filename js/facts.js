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
