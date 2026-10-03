---
description: Быстрые проверки перед коммитом — тесты, цифры README, перевод
---
Запусти из корня проекта (Node в Git Bash: `export PATH="/c/Program Files/nodejs:$PATH"`):

1. `node --test tests/core.test.mjs` — все тесты зелёные.
2. `node tools/check-facts.js` — README совпадает с `js/facts.js` в обоих языках.
3. `node tools/qa/i18n-check.mjs` — 0 непереведённых строк.

Коротко сообщи результат. Если что-то упало — покажи вывод и исправь, ничего не выкладывая.
