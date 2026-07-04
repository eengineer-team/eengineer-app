# PROGRESS

Статус по коду (не по документации). Источник шагов: `docs/ai-agent-build-instructions.md`.
Обновлять одной строкой в конце каждой значимой сессии/правки — это дополняет git log, не заменяет его.

## Чеклист по шагам

- [x] **Шаг 0** — Инициализация проекта — done
- [x] **Шаг 1** — Дизайн-токены и две темы (cornsilk / dark) — done
- [ ] **Шаг 1.5** — Custom UI design (Claude Design, человеческий gate) — не проверяется в коде
- [x] **Шаг 2** — Welcome-страница — done (декоративный EngineeringCanvas удалён, правая колонка намеренно пустует сверху — см. журнал сессий)
- [x] **Шаг 3** — Help-страница (accordion, 4 FAQ) — done
- [x] **Шаг 4** — Signup / Login (AuthForm, OAuth-моки) — done (`components/ui/sign-in.tsx` рескин, `lib/auth-context.tsx` мок-сессии)
- [ ] **Шаг 5** — Post-auth shell (сайдбар, хедер) — not started (`Dashboard.tsx` — заглушка)
- [ ] **Шаг 6** — Лендинг дашборда (Joined Clubs, Calendar, Post a Project) — not started
- [ ] **Шаг 7** — Community (Q&A, Webinars, My Network) — not started
- [ ] **Шаг 8** — Opportunities / Internships (edugrants) — not started
- [ ] **Шаг 9** — Profiles — not started
- [ ] **Шаг 10** — Competition Calendar — not started
- [ ] **Шаг 11** — Роли и права доступа — not started
- [ ] **Шаг 12** — Direct Messages — not started
- [ ] **Шаг 13** — Deferred-хуки (Onboarding, ToS/Privacy, Post a Project flow) — not started
- [ ] **Шаг 14** — Финальный проход — not started

## Открытые вопросы, ожидающие решения

1. ~~EngineeringCanvas на Welcome vs "отклонённые паттерны".~~ **Решено (2026-07-04, финально):** декоративная схемотехника убрана из `Welcome.tsx` полностью, компонент `EngineeringCanvas.tsx` удалён из кодовой базы. Замены нет и не будет — правая колонка намеренно пустует сверху (`pt-32` над карточкой), заполнится органически контентом Community/Opportunities (Шаг 7–8). Не предлагать декоративный filler повторно.
2. **Контактный email — временный.** `bshoxrux48@gmail.com` используется в Welcome/Help с явным комментарием в коде "until domain decision is finalized" — ждёт финального домена/адреса перед релизом.
3. **Логотип — только текстовый wordmark ("ee" / "engineer"), без иконки/лого-файла.** Не зафиксировано, финальное ли это решение или временная заглушка до дизайна логотипа.
4. **OAuth backend не подключён.** Шаг 4 по спеке допускает моки, но реальный token exchange/сессии — отдельная незапланированная работа, блокирующая "настоящий" post-auth доступ.
5. **edugrants API** — зависимость от внешнего партнёра (Шаг 8), доступность ключей/SLA не подтверждена.
6. **AI-matching** (Opportunities, возможно Community) — по roadmap помечено как недооценённое по сложности, требует отдельного R&D.
7. **Terms of Service / Privacy Policy** — контент сознательно отложен (Шаг 13), но нужно не забыть перед публичным релизом.
8. **`docs/roadmap-for-team.md` всё ещё не закоммичен** (правка про "отклонённые паттерны") — стоит закоммитить вместе с кодовым решением по пункту 1, чтобы оба совпадали в истории.

## Журнал сессий

- 2026-07-04 — git инициализирован, документация перенесена в `docs/`, аудит Шагов 0–14 проведён, обнаружен конфликт EngineeringCanvas vs "отклонённые паттерны", создан этот файл.
- 2026-07-04 — финальное решение по правой колонке Welcome: `EngineeringCanvas` удалён из `Welcome.tsx` и из кодовой базы, замены не добавлено, верхний padding карточки увеличен до `pt-32` — пустота задокументирована как намеренная.
- 2026-07-04 — Шаг 4 реализован: `/auth` страница (`Auth.tsx`) с рескиненным `AuthForm` (`components/ui/sign-in.tsx`) под cornsilk-палитру; добавлены `ui/card.tsx`, `ui/input.tsx`, `ui/label.tsx`; GitHub/LinkedIn/Google — inline SVG-бренд-марки (lucide-react 1.x не содержит бренд-иконок). Мок-OAuth через `lib/auth-context.tsx`: GitHub/LinkedIn → persisted Builder-сессия (localStorage), Google → stateless preview (только in-memory, ничего не сохраняется). Email/password форма визуально присутствует по референсу, но логика мокнута как эквивалент GitHub-сайнина (нет отдельного backend). Проверено Playwright-скриптом: обе mode-варианты рендерятся, password show/hide переключается, клик по GitHub уводит на `/dashboard` без console errors.
