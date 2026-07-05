# PROGRESS

Статус по коду (не по документации). Источник шагов: `docs/ai-agent-build-instructions.md`.
Обновлять одной строкой в конце каждой значимой сессии/правки — это дополняет git log, не заменяет его.

## Чеклист по шагам

> **Аудит 2026-07-05:** предыдущая версия этого файла (04.07) сильно отставала от
> реального кода — Шаги 5–8 и 10 были фактически реализованы, но помечены как
> "not started". Ниже — статус, сверенный построчным чтением `src/`, а не по памяти.

- [x] **Шаг 0** — Инициализация проекта — done
- [x] **Шаг 1** — Дизайн-токены и две темы (cornsilk / dark) — done
- [ ] **Шаг 1.5** — Custom UI design (Claude Design, человеческий gate) — не проверяется в коде
- [x] **Шаг 1.6** — Компонентный слой — done (`button.tsx` имеет `done`-state, `card.tsx`/`chip.tsx`/`avatar.tsx`/`label-caps.tsx` на токенах)
- [x] **Шаг 2** — Welcome-страница — done (декоративный EngineeringCanvas удалён, правая колонка намеренно пустует сверху — см. журнал сессий)
- [x] **Шаг 3** — Help-страница (accordion, 4 FAQ) — done
- [x] **Шаг 4** — Signup / Login (AuthForm, OAuth-моки) — done (`components/ui/sign-in.tsx` рескин, `lib/auth-context.tsx` мок-сессии)
- [x] **Шаг 5** — Post-auth shell (сайдбар, хедер) — done (`Sidebar.tsx`, `DashboardHeader.tsx`, role-gated nav через `permissions.ts`)
- [x] **Шаг 6** — Лендинг дашборда (Joined Clubs, Calendar widget, Post a Project) — done (`DashboardHome.tsx`, `JoinedClubs.tsx` мок-данные с TODO на real-time)
- [x] **Шаг 7** — Community (Q&A, Webinars, My Network) — done (4 действия на пост, duplicate-check через `similarity.ts`, вебинары по дисциплинам, connect-флоу)
- [x] **Шаг 8** — Opportunities / Internships (edugrants) — done (мок-фид, edugrants credit на каждой карточке, rule-based `rankByDiscipline`)
- [x] **Шаг 9** — Profiles — done (список + детальная страница, self-rated skills, project entries, endorsements с обязательной причиной, публичный просмотр)
- [x] **Шаг 10** — Competition Calendar — done (компонент был готов, но `/dashboard/calendar` рендерил заглушку — заведён на реальный компонент)
- [~] **Шаг 11** — Роли и права доступа — частично: модель ролей и `can()`-гейты реализованы (`permissions.ts`, `auth-context.tsx`), но админ-панели назначения ролей нет — блокируется отсутствием backend-справочника пользователей (мок-сессия знает только "себя"). Не строить на моках без директории пользователей — заведёт в фиктивный UI.
- [x] **Шаг 12** — Direct Messages — done (открытый 1:1 месседжинг между Builder'ами, без модерации)
- [x] **Шаг 13** — Deferred-хуки — done (ToS/Privacy — смонтированные заглушки, ссылки из AuthForm; Post a Project ведёт на placeholder-роут вместо простого disabled)
- [ ] **Шаг 14** — Финальный проход — не проводился формально в этой сессии, часть пунктов (responsive/cross-browser QA) остаётся открытой

## Открытые вопросы, ожидающие решения

1. ~~EngineeringCanvas на Welcome vs "отклонённые паттерны".~~ **Решено (2026-07-04, финально):** декоративная схемотехника убрана из `Welcome.tsx` полностью, компонент `EngineeringCanvas.tsx` удалён из кодовой базы. Замены нет и не будет — правая колонка намеренно пустует сверху (`pt-32` над карточкой), заполнится органически контентом Community/Opportunities (Шаг 7–8). Не предлагать декоративный filler повторно.
2. **Контактный email — временный.** `bshoxrux48@gmail.com` используется в Welcome/Help с явным комментарием в коде "until domain decision is finalized" — ждёт финального домена/адреса перед релизом.
3. **Логотип — только текстовый wordmark ("ee" / "engineer"), без иконки/лого-файла.** Не зафиксировано, финальное ли это решение или временная заглушка до дизайна логотипа.
4. **OAuth backend не подключён.** Шаг 4 по спеке допускает моки, но реальный token exchange/сессии — отдельная незапланированная работа, блокирующая "настоящий" post-auth доступ.
5. **edugrants API** — зависимость от внешнего партнёра (Шаг 8), доступность ключей/SLA не подтверждена.
6. **AI-matching** (Opportunities, возможно Community) — по roadmap помечено как недооценённое по сложности, требует отдельного R&D.
7. **Terms of Service / Privacy Policy** — контент сознательно отложен (Шаг 13), заведены смонтированные роуты `/terms` и `/privacy` (см. журнал 2026-07-05), но нужно не забыть настоящий текст перед публичным релизом.
8. **`docs/roadmap-for-team.md` всё ещё не закоммичен** (правка про "отклонённые паттерны") — стоит закоммитить вместе с кодовым решением по пункту 1, чтобы оба совпадали в истории.
9. **Шаг 11 (роли) не имеет админ-панели.** Модель ролей (`permissions.ts`) существует и активно используется route guard'ами, но UI назначения Community Lead/Admin сознательно не построен на моках — нет backend-справочника пользователей, а фиктивный список только внутри одной сессии не был бы реальной функциональностью. Ждёт backend user directory.
10. **Онбординг после сайдапа — placeholder, не настоящий флоу.** `/onboarding` смонтирован и подключён в цепочку signup (GitHub/LinkedIn/email signup → `/onboarding` → "Continue to dashboard"), но не собирает display name/дисциплину — сам сбор данных остаётся будущей работой поверх этого хука.

## Журнал сессий

- 2026-07-04 — git инициализирован, документация перенесена в `docs/`, аудит Шагов 0–14 проведён, обнаружен конфликт EngineeringCanvas vs "отклонённые паттерны", создан этот файл.
- 2026-07-04 — финальное решение по правой колонке Welcome: `EngineeringCanvas` удалён из `Welcome.tsx` и из кодовой базы, замены не добавлено, верхний padding карточки увеличен до `pt-32` — пустота задокументирована как намеренная.
- 2026-07-04 — Шаг 4 реализован: `/auth` страница (`Auth.tsx`) с рескиненным `AuthForm` (`components/ui/sign-in.tsx`) под cornsilk-палитру; добавлены `ui/card.tsx`, `ui/input.tsx`, `ui/label.tsx`; GitHub/LinkedIn/Google — inline SVG-бренд-марки (lucide-react 1.x не содержит бренд-иконок). Мок-OAuth через `lib/auth-context.tsx`: GitHub/LinkedIn → persisted Builder-сессия (localStorage), Google → stateless preview (только in-memory, ничего не сохраняется). Email/password форма визуально присутствует по референсу, но логика мокнута как эквивалент GitHub-сайнина (нет отдельного backend). Проверено Playwright-скриптом: обе mode-варианты рендерятся, password show/hide переключается, клик по GitHub уводит на `/dashboard` без console errors.
- 2026-07-05 — **Аудит + продолжение по инструкции агента.** Этот файл сильно разошёлся с кодом (см. пометку в чеклисте выше) — Шаги 5–8, 10 были реализованы в предыдущих сессиях, но не отмечены. После сверки построчным чтением `src/` продолжено с недоделанного:
  - **Шаг 9 (Profiles)** — реализован полностью: `lib/profile-data.ts` (мок-профили) + `lib/profiles-context.tsx` (in-memory store, редактирование только своего профиля), `pages/dashboard/profiles/{ProfilesLayout,ProfilesList,ProfileDetail}.tsx`, `components/profile/{SkillBar,EndorseDialog}.tsx`. Self-rated skills (клик по точкам), project-записи с привязкой к skills, endorsements с обязательной причиной (видна эндорсд-пользователю), кастомизация фона через токен-based пресеты (без хардкод-hex), профили публичны для любого пользователя.
  - **Шаг 12 (Direct Messages)** — реализован: `lib/messages-data.ts` + `pages/dashboard/Messages.tsx`, список диалогов + тред + композер, без единого элемента модерации/сканирования (намеренно, см. комментарий в коде).
  - **Шаг 10 фикс** — `/dashboard/calendar` рендерил `PlaceholderSection`, хотя `CompetitionCalendar.tsx` уже был полностью готов (использовался только в виджете на Home). Заведён `pages/dashboard/Calendar.tsx`, отдающий тот же компонент на полноценный роут.
  - **Шаг 13 (deferred-хуки)** — `/terms` и `/privacy` смонтированы (`pages/legal/`), подключены как реальные ссылки из текста AuthForm (было: голый неактивный текст). Кнопка "Post a Project" на Home раньше была просто `disabled` без пункта назначения — по спеке она должна вести на placeholder-роут; заведена на `/dashboard/projects/new`. Добавлен `/onboarding` (Project Onboarding flow, тоже Шаг 13) — signup-ветка `Auth.tsx` теперь ведёт туда перед дашбордом, login по-прежнему уходит сразу в `/dashboard`.
  - Не реализовано намеренно в этой сессии: Шаг 11 админ-панель ролей (см. открытый вопрос #9 — ждёт backend), Шаг 14 формальный QA-проход (responsive/cross-browser не прогонялся, `npm run build`/`tsc` не запускались — среда выполнения в этой сессии была без доступа к shell/сборке, проверка только построчным чтением кода).
