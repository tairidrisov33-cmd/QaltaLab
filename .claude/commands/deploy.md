---
description: Выложить сайт — проверки, коммит без соавтора, push, Vercel, проверка живого сайта
argument-hint: "<сообщение коммита>"
---
Выкладка QaltaLab. Сообщение коммита: `$ARGUMENTS` (если пусто — составь короткое по-русски по сути изменений).

1. `/check` — всё зелёное, иначе остановись.
2. `git add -A -- . ':!*.mov'` и `git commit -m "..."`. **Никаких строк Co-Authored-By** — автор только `tairidrisov33-cmd` (хук `commit-msg` это проверяет).
3. `git push`.
4. `npx --yes vercel deploy --prod --yes` — если в выводе нет `Aliased https://qaltalab.site`, повтори один раз.
5. Проверь живой сайт: изменённые файлы отдаются с кодом 200 (`curl -s -o /dev/null -w "%{http_code}"`), для заметных изменений — `BASE=https://qaltalab.site/ node tools/qa/features.mjs` или `full-audit.mjs`.
6. Сообщи: что выложено, ссылка https://qaltalab.site, напомни обновить страницу с Ctrl+F5.
