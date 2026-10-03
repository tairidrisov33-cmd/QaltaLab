# Архитектура QaltaLab

Статический сайт без сборщика и зависимостей: обычные `<script defer>` в `index.html`, всё в пространстве имён `A`. Серверные функции — две Vercel Functions в `api/`.

## Файлы

```
index.html          порядок скриптов важен: i18n → facts → utils → … → labs → app
css/style.css       все стили; палитра — переменные :root, тёмная тема — :root[data-theme="dark"]

js/i18n.js          словарь ru→kk (ключ = русский текст): A.i18n.t, A.i18n.fmt, retranslate
js/i18n-labs.js     перевод опытов и новых блоков (дополняет словарь блоками add/more/draw/dombra/more2/more3)
js/lessons.js       листы для урока: цель, столбцы таблицы, вопросы; общий план на 45 минут
js/facts.js         ВСЕ цифры сайта: школы, кабинеты, PISA, пилот n=29, teacher (null — блок скрыт)
js/utils.js         A.h() — разметка с переводом; A.u — num, hz, median, clamp, csv (Excel: «;» и BOM)
js/icons.js         SVG-иконки A.icon(name), пути — A.iconPaths (их же берёт генератор README)
js/orn.js           10 казахских мотивов A.orn(name), разделители A.orn.divider([...])
js/store.js         прогресс в localStorage (spl.state.v1): результаты, открытые законы
js/fit.js           R² (бывает < 0 — показываем «ниже 0»), A.fit.best — автоподгонка по образцу
js/chart.js         график: точки, кривая, «призрак» прошлой серии, пунктир предсказания, кольца-выбросы
js/predict.js       «Нарисуй предсказание»: поле рисования, valueAt, compare, карточка «Предсказание и реальность»
js/sound.js         спектр A.sound.draw и основной тон по гармоникам A.sound.fundamental (HPS)
js/hero.js          мини-опыт в шапке: маятник, ползунок k, «пример данных»
js/art.js           сцены-рисунки опытов на карточках A.scene(id)
js/perm.js          пояснения и ошибки разрешений камеры и микрофона
js/zerde.js         Zerde AI на экране результата (по кнопке)
js/zchat.js         плавающий чат Zerde
js/lab.js           движок опыта: 5 шагов, результат, PNG, CSV, «под капотом», пример (openDemo)
js/qr.js            QR-код без библиотек (байты, уровень M, версии 1–6) → SVG
js/class.js         общий график класса: создать, войти по /c/КОД, отправить точки (с очередью), экран для проектора
js/tour.js          «QaltaLab за 60 секунд» (#/tour)
js/badges.js        знаки-достижения: мотив за каждый открытый закон, коллекция на главной
js/labs/*.js        10 опытов, по файлу на опыт
js/app.js           главная, маршруты, тема, язык, боковая панель, орнамент, раздел учителя

api/zerde.js        разбор результата и чат → Groq (ключ GROQ_API_KEY)
api/_zerde-config.js описания опытов для подсказки (подчёркивание — не публичный адрес)
api/class.js        общий график класса → Supabase (SUPABASE_URL, SUPABASE_KEY), лимиты по адресу

tests/core.test.mjs 16 тестов на Node
tools/              check-facts.js, make-readme-assets.js, qa/ — браузерные проверки (см. tools/qa/README.md)
docs/               эти записки и инфографика README (в выкладку не идут, см. .vercelignore)
```

## Маршруты (hash)

| Адрес | Что |
|---|---|
| `#/` | главная |
| `#/lab/<id>` | опыт |
| `#/demo/pendulum` | пример результата с рисунком-предсказанием |
| `#/lesson/<id>` | лист для урока (печать, QR) |
| `#/class/<КОД>` | экран класса для проектора; `#/class/demo` — пример без сервера |
| `#/c/<КОД>` | вход ученика; короткая ссылка `/c/КОД` → redirect в `vercel.json` |
| `#/tour` | тур «за 60 секунд» |

## Опыт = один файл

Поля: `id, title, subject, gear, time, sensor, question, intro, howto, warn, hypotheses, pipeline, predict, chart, models, reveal, verdict, next, explain, variants, measure`.
Подключить: `<script>` в `index.html`; `LAB_ICON`, `OUTCOME`, тема в `TRACKS` и список учителя в `app.js`; сцена в `art.js`; лист в `lessons.js`; описание в `api/_zerde-config.js`; знак в `badges.js`; **перевод всех строк** в `i18n-labs.js`.

## Сервер и данные

- **Zerde:** только известный id опыта, ≤60 числовых точек, тело ≤8 КБ, 6 запросов/мин (чат 15), модели Groq по очереди, отказы — код 200 с `success:false`.
- **Класс:** Supabase-проект `qaltalab` (uswdtaounibudmiootoy, eu-central-1). Таблицы `classes`, `class_runs` закрыты RLS без политик; доступ только через `class_create / class_add / class_get` (security definer, EXECUTE только у anon). Класс — до 300 серий, 30 дней. Лимиты API на адрес в минуту: создание 30, отправка 150, чтение 600 (весь класс через один Wi-Fi).
- **Приватность:** измерения считаются на устройстве; на сервер — только числа опыта (Zerde) и точки с кодом класса (класс). Имён и аккаунтов нет.
