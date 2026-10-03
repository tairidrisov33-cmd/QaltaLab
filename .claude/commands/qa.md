---
description: Полный аудит сайта в браузере — 10 опытов, оба языка, телефон и компьютер
argument-hint: "[local|live]"
---
Полная проверка QaltaLab (см. `tools/qa/README.md`). Аргумент: `$ARGUMENTS` (по умолчанию `local`).

1. Сначала `/check`.
2. `local`: запусти `node tools/qa/serve.mjs` в фоне, затем `node tools/qa/full-audit.mjs` и `node tools/qa/features.mjs`.
   `live`: те же скрипты с `BASE=https://qaltalab.site/`.
3. Просмотри несколько скриншотов из `tools/qa/.out/` глазами — гармония, обрезанный текст, наложения.
4. Итог: список замечаний (или «0 замечаний, 0 ошибок консоли»). Найденное исправь и предложи выложить.
