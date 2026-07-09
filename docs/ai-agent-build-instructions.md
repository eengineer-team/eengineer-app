# Engineering Network — инструкция для AI-агента (Claude Code)

> Формат: последовательные промпты/задачи. Выполняй строго по порядку —
> каждый шаг предполагает, что предыдущий завершён и закоммичен.
> Стек: React + TypeScript + Tailwind + shadcn/ui (`/components/ui`) + next-themes + framer-motion.
>
> **Обновление от фаундера (03.07.2026, подтверждено в переписке):**
> "Sure, make it as good as possible, down to the details, humanly possible."
> Фаундер явно одобрил отказ от прямого использования 21st.dev-компонентов —
> они делают продукт похожим на "average AI written website". Ниже везде,
> где раньше стояла ссылка на конкретный 21st.dev-пакет как обязательный код,
> она заменена на **функциональное описание** (что компонент должен делать
> и как себя вести), а визуальную реализацию нужно проектировать с нуля —
> см. новый Шаг 1.5. shadcn/ui **примитивы** (Button, Input, Card, Label,
> DropdownMenu) остаются как техническая база — это просто безголовые
> строительные блоки без узнаваемого "вида", проблема не в них.
>
> **Разрешённый конфликт спеки:** кнопка Settings размещается **top-right** на всех страницах
> (и на welcome, и в post-auth дашборде) — используй это значение везде ниже, не top-left.
>
> **Визуальные референсы:** изображения из исходного PDF вынесены отдельными файлами
> в папку `refs/` и привязаны к конкретным шагам по имени файла. Прикладывай агенту
> ТОЛЬКО картинку, относящуюся к текущему шагу — не весь PDF целиком. Список:
> - `step4-auth-form-reference.png` — целевой вид формы входа (бейджи Full access/Limited preview)
> - `step5-sidebar-reference.png`, `step5-sidebar-reference-color.png` — паттерн сайдбара (порядок пунктов, ховер)
> - `step6-landing-wireframe.png` — набросок лендинга (Hello [name], Joined Clubs, Post a project)
> - `step6-post-project-wireframe-note.png` — уточняющий набросок кнопки "Apply to project with link"
> - `step7-network-connect-card.png` — карточка коннекта в My Network
> - `step10-calendar-source-reference.png` — исходный стиль календаря aliimam (ДО чистки текста)
> - `step10-calendar-target-reference.png` — целевой вид календаря (Upcoming Deadlines / Daily Reminders, финальный)

---

## Шаг 0 — Инициализация проекта

```
Создай новый проект: React + TypeScript + Vite (или Next.js, если планируется SSR).
Установи и настрой Tailwind CSS.
Инициализируй shadcn/ui, подтверди что путь для компонентов — /components/ui.
Если путь по умолчанию не /components/ui — создай эту структуру вручную и объясни,
почему она важна для консистентности с остальными шагами этой инструкции.
Установи зависимости: next-themes, framer-motion, lucide-react,
@radix-ui/react-slot, class-variance-authority, @radix-ui/react-label.
Настрой next-themes provider на верхнем уровне приложения.
Создай базовую структуру роутов: "/", "/auth", "/help", "/dashboard".
```

---

## Шаг 1 — Дизайн-токены и две визуальные темы

> **ВАЖНО (04.07.2026):** токены живут в `tailwind.config.js` (палитры `corn-*`,
> `dark-*`, `gold-dark`). Это ЕДИНСТВЕННЫЙ источник цвета. Нигде в шагах 2–14 не
> хардкодь hex (`text-[#2A2118]` и т.п.) — всегда ссылайся на токен-класс
> (`text-corn-900`, `bg-dark-surface`). Нужного значения нет → сначала добавь в
> конфиг, потом используй. Любой цвет в коде обязан быть трассируем до токена.
>
> **Текущий факт (из ревизии кода 04.07):** до этой правки часть значений жила
> хардкодом — `card.tsx` содержал `text-[#2A2118]` (≈ но ≠ corn-900), фон карточки
> `bg-white/65`; кнопки Register/Connect использовали `corn-700 #8B6914`, тогда как
> на тёмных экранах золото выглядело светлее. Это и есть источник разъезжания.
> Ниже — приведение к токенам.

```
Тема определяется РОУТОМ, не статусом входа (зафиксировано):
  /, /help, /auth   → тема "welcome" — палитра corn-* (cornsilk фон corn-100)
  /dashboard/*      → тема "dashboard" — палитра dark-* (фон bg-dark-radial),
                      включая Google-preview гостей

Не объединяй темы, не ищи компромисс — два разных identity для двух состояний.
```

### 1.1 — Токены темы "welcome" (уже в конфиге, corn-*)

```
Фон страницы:      bg-corn-100  (#FFF8DC) или bg-corn-subtle (radial)
Поверхность карт.: используй светлый corn (см. Card в Шаге 1.6) — НЕ bg-white/65 хардкодом
Основной текст:    text-corn-900  (#1A1208)
Заголовки:         text-corn-900  + font-display
Вторичный текст:   text-corn-800  (#5C4A1E) — не светлее, иначе тонет на cornsilk
Акцент (gold):     corn-700  (#8B6914) — лейблы-капсы, ссылки, primary-кнопка welcome
Hairline:          border-corn-900/10  или /14
```

### 1.2 — Токены темы "dashboard" (ДОСТРОЕНЫ в конфиге, dark-*)

```
Фон:               bg-dark-900 + bg-dark-radial (чистый radial, БЕЗ grid/borders/path lines)
Поверхность карт.: bg-dark-surface   (#16150F)
Вложенная поверх.: bg-dark-surface2  (#1E1C14) — комментарий/ответ внутри карточки
Основной текст:    text-dark-text    (#F5F0DF) — и заголовки тоже
Вторичный текст:   text-dark-muted   (#B8AE93) — спикеры, локации, "N mutual", requirements.
                   ВАЖНО: осознанно светлый. Прошлая проблема — muted тонул на тёмном.
                   Не опускай ниже этого значения.
Акцент (gold):     text-gold-dark / bg-gold-dark  (#C79A3A) — кнопки, активная вкладка,
                   дедлайн-бейджи. НЕ corn-700 (он тускнеет на тёмном).
Hairline:          border-white/10
Hover interactive: hover:bg-white/6  (white-tinted, единый паттерн — вынеси в variant)
```

### 1.3 — Типографика (общая для обеих тем)

```
font-display: Syne (weight 800)      — hero, имена, заголовки-акценты
font-sans:    Space Grotesk (400–500) — body, UI
Роли размеров (уже в конфиге fontSize): display / display-sm / heading / label.
label (капс-лейблы TRUST/SKILLS/OVERVIEW): text-label, uppercase, tracking, weight 500,
  цвет corn-700 (welcome) / dark-muted (dashboard).
```

### 1.4 — Radii (договорённость, дефолтный Tailwind-скейл)

```
chips/бейджи:  rounded      (0.25rem)
кнопки/инпуты: rounded      (0.25rem) — как сейчас в button.tsx
карточки:      rounded-lg   (0.5rem)  — как сейчас в card.tsx
Держи эти три единообразно, не вводи произвольные rounded-* по месту.
```

---

## Шаг 1.5 — Custom UI exploration (Claude Design)

**Выполняется человеком (тех-менеджером), не AI-агентом. Это gate перед Шагом 2.**

```
До начала сборки страниц спроектируй кастомный визуальный язык в Claude Design
для ключевых экранов, вместо использования 21st.dev-шаблонов:

1. Welcome-страница: анимированный фон (движение/частицы/линии — идея из Background
   Paths остаётся как ФУНКЦИОНАЛЬНОЕ требование "нужен живой, ненавязчивый фон",
   но визуальное решение — своё), headline "Just Engineer It!", 2 фичи, Contact Us.
2. Post-auth дашборд: сайдбар + хедер + лендинг-виджеты (calendar, joined clubs).
3. Signup/Login: рескин AuthForm с нуля под общий визуальный язык, не просто
   перекраска дефолтных shadcn-цветов.
4. Q&A dialog, Help accordion, Profile page — как отдельные экраны/состояния.

Результат этого шага — набор макетов/токенов (цвета, шрифты, spacing, motion),
которые становятся источником истины для всех последующих шагов ВМЕСТО
конкретных 21st.dev URL, упомянутых ниже. Референсы на 21st.dev в шагах 2-10
оставлены только как ОПИСАНИЕ ПОВЕДЕНИЯ (что за функциональность нужна:
"аккордеон", "диалог без оверлея", "календарь с точками дедлайнов"), а не
как код/пакет для установки.
```

---

## Шаг 1.6 — Компонентный слой (component specs)

> **Причина (04.07.2026, по ревизии кода):** `button.tsx` уже cva-компонент, но
> варианты неполные (нет `done`-состояния); `card.tsx` содержит хардкод
> (`text-[#2A2118]`, `bg-white/65`); Avatar/Chip/Tag НЕ существуют. Из-за этого
> экраны собирают элементы по-разному → разнобой (Register vs Registered).
> Ниже — привести существующие компоненты к полному виду и создать недостающие.
> Всё на токенах Шага 1, оба-темных через `dark:`-варианты или отдельные variant.
>
> **Правило:** one-off кнопки/карточки/чипы запрещены. Нужен вариант, которого
> нет → добавь в компонент, потом используй. Не изобретай вид на месте.

### Button — расширить существующий `src/components/ui/button.tsx`

```
Существующие варианты (оставить): primary, ghost, shell, accent.
ПРИВЕСТИ К ТОКЕНАМ:
  accent (dashboard CTA) — сейчас 'bg-corn-700 text-white ...'.
    Заменить на золото тёмной темы: 'bg-gold-dark text-dark-900 hover:brightness-110'.
    (corn-700 тускнеет на тёмном; gold-dark #C79A3A — правильное золото дашборда.)

ДОБАВИТЬ недостающее состояние `done` (через новый variant или prop state):
  done — ЗАВЕРШЁННОЕ действие. НЕ серый, НЕ похоже на disabled.
    welcome:   'bg-transparent border border-corn-700 text-corn-700'
    dashboard: 'bg-transparent border border-gold-dark text-gold-dark'
    + ведущая иконка-галочка (lucide Check) слева.
    Применение: "Registered" (вебинар, куда записан), "Connected" (уже в сети).
    Читается как ДОСТИЖЕНИЕ.

КРИТИЧНО: Register↔Registered и Connect↔Connected — ОДНА кнопка в двух состояниях
(accent → done), НЕ две разные кнопки. Не рисуй "выполнено" серым текстом.

Размеры (size) — оставить существующие sm/md/lg/icon как есть.
```

### Card — переписать `src/components/ui/card.tsx` (убрать хардкод)

```
Card контейнер — заменить хардкод на токены, сделать тема-зависимым:
  welcome:   'bg-corn-50 border border-corn-900/10 rounded-lg'
  dashboard: 'bg-dark-surface border border-white/10 rounded-lg'
  (убрать 'bg-white/65' и backdrop-blur как дефолт — или оставить blur опцией
   только для welcome-стекла, но НЕ хардкодить в базовом Card.)
CardTitle — заменить 'text-[#2A2118] text-[1.5rem]' на:
  'font-display font-bold text-corn-900 dark:text-dark-text text-heading'
CardDescription — заменить 'text-corn-700' на:
  'text-corn-800 dark:text-dark-muted' (вторичный текст обеих тем)
Вложенная поверхность (ответ/коммент внутри карточки): bg-dark-surface2 на дашборде,
  с отступом сверху и hairline над ней.
gap между карточками в списке: 20px (space-y-5).
```

### Chip / Tag — СОЗДАТЬ `src/components/ui/chip.tsx` (не существует)

```
Дисциплины (Aerospace/Software) и скиллы (CFD Analysis, MATLAB):
  welcome:   'bg-corn-900/6 text-corn-800 rounded px-2.5 py-0.5 text-xs'
  dashboard: 'bg-white/6 text-dark-muted rounded px-2.5 py-0.5 text-xs'
Вариант deadline-бейдж (Opportunities/Calendar): текст/рамка gold-dark.
```

### Avatar — СОЗДАТЬ `src/components/ui/avatar.tsx` (не существует)

```
Кружок с инициалами (пока нет фото) или фото (object-cover):
  заглушка: 'rounded-full bg-corn-900 dark:bg-[#2E2416] text-corn-100 font-medium
             flex items-center justify-center'
  размеры: sm 30px (комментарии), md 44px (карточки/строки сети), lg (профиль).
  фото: тот же круг, единый кроп; при тонировке — один filter на все.
```

### Label (caps) — СОЗДАТЬ `src/components/ui/label-caps.tsx` (или использовать text-label)

```
OVERVIEW / TRUST / SKILLS / CONNECTION REQUESTS / UPCOMING DEADLINES — самый частый паттерн:
  'text-label uppercase tracking-[0.16em] font-medium text-corn-700 dark:text-dark-muted'
Один компонент — не набирать капс-лейблы вручную с разным трекингом.
(Примечание: это НЕ shadcn Label для форм — тот остаётся для инпутов отдельно.)
```

### Input — привести форм-инпуты к токенам

```
"Type your question below", "Write a comment…", auth-поля:
  welcome:   'bg-corn-50 border border-corn-900/14 focus:border-corn-700 rounded'
  dashboard: 'bg-dark-surface2 border border-white/10 focus:border-gold-dark rounded'
  текст: text-corn-900 dark:text-dark-text; placeholder: text-corn-800/60 dark:text-dark-muted/70
```

> **Definition of done Шага 1.6:** button.tsx имеет state=done; card.tsx без хардкода,
> тема-зависимый; созданы chip.tsx, avatar.tsx, label-caps.tsx; все на токенах, обе
> темы. Никакой экран в шагах 2–14 не собирает эти элементы заново вручную.

---

## Шаг 2 — Welcome-страница

```
Собери страницу "/":

1. Реализуй кастомный анимированный full-page фон (framer-motion) по макету
   из Шага 1.5 — живые, плавно движущиеся линии/частицы, не отвлекающие от
   контента. Не устанавливай готовый пакет background-paths — пиши свою
   реализацию анимации с нуля на framer-motion + SVG/canvas.

2. По центру страницы: headline "Just Engineer It!" — крупный градиентный текст
   по макету из Шага 1.5.

3. Прямо под headline: две кнопки рядом — "Sign up" и "Log in".

4. Feature-секция — кастомный layout по макету из Шага 1.5, СТРОГО с двумя
   фичами (не три, даже если в процессе дизайна многоколоночная сетка
   визуально просит третью карточку):
   - Verifiability: "the network is trusted"
   - Field-Specific Chats: дедикейтед чат под каждую инженерную дисциплину
     (Aerospace, Mechanical, Electrical, Software и т.д.)

5. Внизу страницы: секция "Contact Us" с email bshoxrux48@gmail.com.

6. Кнопка Settings — top-right угол страницы (см. разрешённый конфликт выше).
   Клик открывает кастомный dropdown (можно на базе shadcn DropdownMenu
   примитива, но со своей визуальной отделкой) с пунктом:
   - Help (ссылка на /help)

   **Разрешённый конфликт (03.07.2026):** Dark/Light toggle убран из
   Settings на welcome-странице — cornsilk-фон pre-auth — это фиксированное
   дизайн-решение, не пользовательская настройка (симметрично тому, что
   post-auth всегда тёмный). next-themes provider из Шага 0 остаётся в
   проекте на случай будущей accessibility-фичи внутри дашборда, но
   переключателя тут не будет.

Примени тему cornsilk из Шага 1 ко всей странице.
```

---

## Шаг 3 — Help-страница

```
Собери страницу "/help" как кастомный accordion-компонент (плюс/минус иконки
слева при раскрытии/закрытии) по макету из Шага 1.5 — не устанавливай готовый
originui-пакет, реализуй с нуля на базе Radix Accordion примитива + своя стилизация.

Наполнение — ровно эти 4 пары вопрос/ответ, без изменений сути:
1. What is this platform about?
2. What is the aim?
3. Why sign up through GitHub or LinkedIn?
4. How does this help high school engineering students?

(Текст ответов бери из исходной спеки дословно — это уже финальный копирайт продукта.)
```

---

## Шаг 4 — Signup / Login

**Референс:** `refs/step4-auth-form-reference.png`

```
Задача: интегрировать существующий React-компонент AuthForm в кодовую базу.

1. Скопируй компонент AuthForm (sign-in.tsx) as-is в /components/ui/sign-in.tsx —
   код уже предоставлен в спеке проекта, используй его буквально, не переписывай логику.

2. Скопируй файлы-зависимости в /components/ui: button.tsx, card.tsx, input.tsx, label.tsx
   (код каждого файла — в спеке проекта).

3. Установи npm-зависимости, если ещё не установлены:
   next-themes, lucide-react, @radix-ui/react-slot, class-variance-authority,
   @radix-ui/react-label.

4. Рескинь компонент полностью под макет из Шага 1.5 (референс-скриншот ниже
   показывает только СОСТАВ элементов и бейджей, не финальный визуальный стиль —
   цвета, шрифты, spacing, скругления должны идти из вашей дизайн-системы,
   а не из дефолтных shadcn/Radix стилей):
   - Замени соц-кнопки Google/Microsoft/Apple/SSO на: GitHub, LinkedIn, Google.
   - GitHub и LinkedIn кнопки получают бейдж "Full access" (зелёный).
   - Google кнопка получает бейдж "Limited preview" (жёлтый/оранжевый).
   - Подзаголовок формы (под "Create your account"/"Welcome back"):
     **Решение (07.07.2026):** "Join eengineer" — чуть крупнее обычного текста,
     но не перегруженный размер (заменяет прежний "Join the Engineering Network —
     connect, build, and find your team.").
   - Добавь warning-баннер под соц-кнопками.
     **Решение (07.07.2026), "финальный копирайт" — ЗАМЕНЕНО 09.07.2026:**
     ~~"Google only gets read-only preview access. Everything else is locked
     until you register through Github or Linkedin. However, neither reuses
     or stores your data. It is just for the sake of confirming you are a
     real person."~~ Founder feedback (Slidelike PDF, page 2): этот текст
     звучит шаблонно/AI-написанно — заменить на более человеческую
     формулировку. Действующий текст (09.07.2026): "Google gets you a quick,
     read-only look around — nothing saved, nothing created. Want full
     access? Sign up with GitHub or LinkedIn instead. We don't touch your
     data either way — it's just there to prove you're a real person, not a
     bot." Факты не изменились (Google = read-only preview; GitHub/LinkedIn =
     full access; ни один провайдер не хранит/не переиспользует данные сверх
     подтверждения личности) — поменялся только тон.

5. Логика состояний (можно на моках, если backend OAuth ещё не готов):
   - GitHub OAuth ИЛИ LinkedIn OAuth → присвоить статус "Builder", full access.
   - Google OAuth → stateless preview: НЕ создавать аккаунт, НЕ сохранять сессию/данные.
     Доступ только к: Community overview (публичные Q&A треды, discipline-структура)
     и полной странице Opportunities. Всё остальное — заблокировано с prompt "upgrade
     to GitHub/LinkedIn".

6. UI-копирайт должен явно доносить: GitHub/LinkedIn не хранят и не используют
   профильные данные сверх верификации OAuth-хендшейка. Это trust-сигнал, не data-play.
   Используй эту формулировку в любых местах, где объясняешь пользователю зачем OAuth.

7. Заполни недостающие ассеты (если нужны) стоковыми Unsplash-изображениями,
   иконки — из lucide-react.

Определи путь для компонентов /components/ui (уже должен существовать из Шага 0).
```

---

## Шаг 5 — Post-auth shell (сайдбар + хедер)

**Референсы:** `refs/step5-sidebar-reference.png`, `refs/step5-sidebar-reference-color.png`

```
Собери каркас "/dashboard" в post-auth теме (тёмный radial gradient, Шаг 1):

1. Левый сайдбар, full navigation height:
   - Home — первый пункт
   - Community — СРАЗУ под Home (это ключевое позиционирование, не переставляй ниже)
   - остальные Engineering Disciplines как под-пункты/секции Community
   - платформенные шорткаты
   - sticky footer внизу сайдбара: Settings, Help/Support

2. Верхний бар (topbar):
   - слева: "Hello, [name]" — используй onboarding display name из состояния пользователя
   - справа: notification badge + message badge (unread count)

3. Все interactive-элементы сайдбара/хедера используют white-tinted hover
   из дизайн-токенов Шага 1.

Не реализуй пока содержимое Community/Opportunities/Profile — только структуру
навигации и пустые роуты-заглушки, которые заполнятся в следующих шагах.
```

---

## Шаг 6 — Лендинг (главная страница дашборда)

**Референсы:** `refs/step6-landing-wireframe.png` (общая композиция),
`refs/step6-post-project-wireframe-note.png` (уточнение по кнопке Post a Project)

```
Наполни главную страницу дашборда (Home внутри "/dashboard"):

1. Секция Joined Clubs под хедером: список дисциплин/клубов, к которым присоединился
   пользователь, с unread count. Заложи real-time обновление через WebSocket/polling —
   если backend ещё не готов, сделай интерфейс с mock-данными и явно оставь TODO
   с точкой интеграции.

2. Competition Calendar — middle-left колонка страницы (детали в Шаге 10).

3. Кнопка "Post a Project" — заметная, но НЕ реализуй сам флоу постинга.
   Это явно отложенная фича (deferred). Кнопка должна существовать, вести на
   пустой/placeholder роут с текстом вида "Coming soon".

Не путай эту страницу с Community — здесь только личный обзор пользователя.
```

---

## Шаг 7 — Community (ядро продукта, реализуй с максимальным вниманием)

```
Community — приоритет №1 в продукте. Строй в таком порядке:

### 7.1 Q&A фид
- Единый поток постов, БЕЗ подкатегорий.
- Каждый пост имеет ровно 4 действия: Approve, Disapprove, Report, Comment.
  Не добавляй других действий (например, Share, Save) — их нет в спеке.
- Диалог создания нового вопроса — кастомный модальный компонент БЕЗ
  затемнения фона (без overlay/backdrop), реализуй с нуля по макету из
  Шага 1.5, не устанавливай готовый reui-пакет:
  - Поле 1: "likely category" (выбор дисциплины/категории)
  - Поле 2: буквально "Type your question below" — НЕ формулируй как
    "Share your idea" или подобное, это принципиально другой фрейминг по спеке.
- Перед сабмитом — проверка на дубликат вопроса. Реализуй базовое текстовое
  сравнение/similarity check против существующих вопросов; если находится
  вероятный дубликат — блокируй сабмит и покажи найденный похожий вопрос.

### 7.2 Webinars
- Ежемесячные, организованы по дисциплинам (например: внутри Aerospace-хаба
  есть подраздел "Webinars").
- Community Lead только назначает/организует — UI для "ведения" сессии не нужен,
  только UI для расписания/анонса предстоящих вебинаров.

### 7.3 My Network

**Референс:** `refs/step7-network-connect-card.png`
- LinkedIn-style connect-карточки: имя, короткое описание, аватар,
  "N mutual connections", кнопка "+ Connect".
- Реализуй базовую модель связей (отправка/принятие запроса на коннект).

Всё внутри Community доступно только Builder'ам, кроме Q&A public overview
и discipline-структуры, которые видны и Google-preview пользователям (read-only,
без возможности постить/комментировать/коннектиться).
```

---

## Шаг 8 — Opportunities / Internships

```
Собери страницу Opportunities:

1. Подключи (или замокай, если ключей ещё нет) edugrants API как источник данных.
2. Везде, где показываются данные из edugrants — обязательный видимый credit
   "in collaboration with edugrants" (или аналогичная явная атрибуция). Это не
   опциональный copyright-текст, а условие использования данных партнёра.
3. Каждый листинг — карточка с requirements и responsibilities, не просто title.
4. Реализуй AI-matching листингов под discipline + project history пользователя.
   Если AI-слой не готов — начни с rule-based фильтра по discipline, оставь
   точку расширения под ML-скоринг.

Эта страница доступна ПОЛНОСТЬЮ и Google-preview, и Builder-пользователям.
```

---

## Шаг 9 — Profiles

```
Собери страницу профиля как кастомный layout по макету из Шага 1.5
(референс ruixenui в исходной спеке использовался только как пример
СОСТАВА полей — модальное окно/детальный вид профиля с фото, бейджем,
секциями, — не копируй его визуальный стиль), дополнительно с блоками,
которых нет в этом референсе:

1. Кастомизация: background image, profile picture, online/Builder badge.
2. "My Skills": список скиллов с self-rated proficiency (например, слайдер/шкала).
3. Привязка skills → конкретные проекты пользователя как доказательство.
4. Standalone project-записи: заголовок, картинки, видео, длинный текстовый блок.
5. Endorsements:
   - Другой пользователь может заэндорсить skill или project, но ОБЯЗАН
     указать причину (текстовое поле, не опционально).
   - Заэндорсенный пользователь видит эту причину у себя в профиле.
6. Builder badge — визуальный индикатор верификации через GitHub/LinkedIn.

Профили публичны: любой залогиненный пользователь может открыть чужой профиль
и видеть все его skills/projects/activity без ограничений.
```

---

## Шаг 10 — Competition Calendar

**Референсы:** `refs/step10-calendar-source-reference.png` (исходный стиль ДО чистки текста),
`refs/step10-calendar-target-reference.png` (финальный целевой вид)

```
Собери кастомный календарь-компонент для middle-left колонки лендинга (Шаг 6)
по макету из Шага 1.5. Референсные скриншоты ниже используй только как
описание НАБОРА элементов и поведения — не копируй визуальный стиль
исходного 21st.dev-пакета:

1. Компактный лейбл маленьким текстом: "Competition Calendar" —
   никакого copy про "questions about design", "Book Now", "30 min call".
2. Логика дат: показывай только даты от today() и далее. Прошлые даты —
   не отображай вовсе (не просто затемняй, а исключай из активного вида).
3. Дедлайны — отмечены жёлтой точкой прямо на дне календаря.
4. Под календарём: "Upcoming Deadlines" — список в хронологическом порядке,
   каждый пункт: название, локация/дисциплина, дата дедлайна.
5. Под этим списком: "Daily Reminders" — панель с короткими напоминаниями
   вида "[Событие] deadline in N days".

`refs/step10-calendar-target-reference.png` показывает целевой НАБОР элементов
(Upcoming Deadlines + Daily Reminders в одной колонке) — это референс состава,
не референс визуального стиля.
```

---

## Шаг 11 — Роли и права доступа

```
Реализуй ролевую модель на уровне route guards / component-level checks:

- Builder: verified через GitHub/LinkedIn OAuth. Полный доступ ко всем фичам.
- Admin: НЕ self-assign, НЕ requestable через UI. Назначается только Super Admin'ом.
  Если создаёшь любой UI для управления ролями — он должен быть доступен
  исключительно Super Admin роли.
- Community Lead: доступ к инструментам организации вебинаров (расписание,
  список спикеров) в рамках своей дисциплины.

Google-preview пользователи не имеют роли — это стейтлес-гости, не сохраняй
для них никакого persistent состояния.
```

---

## Шаг 12 — Direct Messages

```
Собери систему сообщений между Builder'ами:

1. Открытый 1:1 месседжинг, доступен только verified Builder'ам.
2. НЕ добавляй никакой модерации, автоматического сканирования сообщений
   или мониторинга контента — это явно противоречит заявленному продуктовому
   принципу ("free platform, not surveillance-driven").
3. Если в задаче или в будущем тикете появится требование добавить
   модерацию/мониторинг DM — остановись и уточни у заказчика перед реализацией,
   это прямо помечено в спеке как конфликтующее с принципом продукта.
```

---

## Шаг 13 — Deferred-хуки (не реализовывать, только заглушки)

```
Для следующих трёх пунктов НЕ пиши функциональность — только оставь
корректно смонтированные, но пустые точки входа (роут существует,
кнопка/ссылка на него ведёт, показывается заглушка "Coming soon"):

1. Project Onboarding flow
2. Terms of Service / Privacy Policy — контент
3. Полный "Post a Project" submission flow

Цель — чтобы навигация и структура сайта не ломались, когда эти фичи
добавят позже, но чтобы сейчас не тратилось время на их логику.
```

---

## Шаг 14 — Финальный проход

```
1. Проверь оба визуальных identity (cornsilk pre-auth / dark post-auth)
   на предмет того, что они не смешались нигде случайно.
2. Проверь, что Settings-кнопка находится top-right и на welcome-странице,
   и в post-auth сайдбаре (сквозная консистентность).
3. Проверь все места, где в спеке требовался конкретный дословный текст
   (например, "Type your question below", "Just Engineer It!", email
   bshoxrux48@gmail.com, edugrants-credit) — сверь дословно.
4. Прогони responsive-проверку на мобильной ширине.
5. Составь итоговый список известных ограничений (моки вместо реального
   OAuth/AI-matching/edugrants API, если они ещё не подключены боевыми ключами).
6. Аудит компонентного слоя (Шаг 1.6): пройди по всем экранам и убедись, что
   кнопки/карточки/чипы/аватары/лейблы/инпуты собраны ИЗ спеков Шага 1.6, а не
   как one-off. Частая точка провала — «выполненные» состояния (Registered,
   Connected): они должны быть state=done (акцентная обводка + галочка), НЕ
   серый текст, похожий на disabled.
7. Аудит токенов: убедись, что нигде в компонентах нет хардкод-hex/px/font-family
   в обход именованных токенов Шага 1. Любой цвет обязан быть трассируем до токена.
```
