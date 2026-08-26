-- ==========================================
-- Prompt Lab: Migration & 50 Seed Prompts
-- ==========================================

-- 1. Prompt Categories
create table if not exists prompt_categories (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  label text not null,
  icon_emoji text,
  sort_order int not null default 0,
  is_visible boolean not null default true,
  created_at timestamptz not null default now()
);

-- 2. Prompts
create table if not exists prompts (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references prompt_categories(id) on delete cascade,
  slug text unique not null,
  title text not null,
  difficulty text not null check (difficulty in ('starter', 'intermediate', 'advanced')),
  tools text[] not null default '{}',
  prompt_text text not null,
  when_to_use text,
  why_it_works text,
  pro_tips text,
  sort_order int not null default 0,
  is_active boolean not null default true,
  is_featurable boolean not null default true,
  featured_date date,
  published_at timestamptz not null default now(),
  author_type text not null default 'team' check (author_type in ('team', 'community')),
  author_name text,
  pack_slug text,
  created_at timestamptz not null default now()
);

-- 3. Prompt Variables
create table if not exists prompt_variables (
  id uuid primary key default gen_random_uuid(),
  prompt_id uuid not null references prompts(id) on delete cascade,
  name text not null,
  description text not null,
  is_multiline boolean not null default false,
  sort_order int not null default 0,
  unique (prompt_id, name)
);

-- 4. Prompt Usage Stats
create table if not exists prompt_usage_stats (
  id uuid primary key default gen_random_uuid(),
  prompt_id uuid not null references prompts(id) on delete cascade,
  profile_id uuid references profiles(id) on delete set null,
  action text not null check (action in ('copy', 'view')),
  created_at timestamptz not null default now()
);

-- 5. Prompt Submissions (Community)
create table if not exists prompt_submissions (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  title text not null,
  category_slug text not null,
  prompt_text text not null,
  variables jsonb not null default '[]',
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  reviewer_notes text,
  created_at timestamptz not null default now()
);

-- Enable RLS
alter table prompt_categories enable row level security;
alter table prompts enable row level security;
alter table prompt_variables enable row level security;
alter table prompt_usage_stats enable row level security;
alter table prompt_submissions enable row level security;

-- Policies
drop policy if exists prompt_categories_select_all on prompt_categories;
create policy prompt_categories_select_all on prompt_categories for select using (true);

drop policy if exists prompts_select_all on prompts;
create policy prompts_select_all on prompts for select using (is_active = true);

drop policy if exists prompt_variables_select_all on prompt_variables;
create policy prompt_variables_select_all on prompt_variables for select using (true);

drop policy if exists prompt_usage_stats_insert on prompt_usage_stats;
create policy prompt_usage_stats_insert on prompt_usage_stats for insert with check (true);

drop policy if exists prompt_submissions_insert_own on prompt_submissions;
create policy prompt_submissions_insert_own on prompt_submissions for insert with check (profile_id = auth.uid());

drop policy if exists prompt_submissions_select_own on prompt_submissions;
create policy prompt_submissions_select_own on prompt_submissions for select using (profile_id = auth.uid());

-- Indices
create index if not exists idx_prompts_category on prompts(category_id);
create index if not exists idx_prompts_slug on prompts(slug);
create index if not exists idx_prompts_published on prompts(published_at desc);
create index if not exists idx_prompts_featured on prompts(featured_date) where featured_date is not null;
create index if not exists idx_prompt_variables_prompt on prompt_variables(prompt_id);
create index if not exists idx_prompt_usage_stats_prompt on prompt_usage_stats(prompt_id);

-- Insert Base Categories
insert into prompt_categories (slug, label, icon_emoji, sort_order, is_visible)
values
  ('chatbot', 'AI Chatbot', '🤖', 1, true),
  ('agent', 'AI Agent', '🕹️', 2, true),
  ('cowork', 'Cowork AI', '🤝', 3, true),
  ('error-clinic', 'Error Clinic', '🔧', 4, true),
  ('design', 'Design AI', '🎨', 5, false)
on conflict (slug) do update set
  label = excluded.label,
  sort_order = excluded.sort_order,
  is_visible = excluded.is_visible;

-- Insert 50 Seed Prompts

-- ----------------------------------------------------------------------------
-- Prompt 1: blind-spot-finder
-- ----------------------------------------------------------------------------
insert into prompts (
  category_id,
  slug,
  title,
  difficulty,
  tools,
  prompt_text,
  when_to_use,
  why_it_works,
  pro_tips,
  sort_order,
  is_active,
  is_featurable,
  featured_date,
  author_type,
  author_name
)
select
  id,
  'blind-spot-finder',
  'Поиск скрытых багов перед запуском» (The Production Blind Spot Finder)',
  'intermediate',
  '{"Claude 3.7 Sonnet","GPT-4o","o3-mini","Gemini 2.5 Pro"}'::text[],
  'I wrote this code and it passes my local unit tests. That is the problem — local environments lie. I need you to act as an adversarial Staff Reliability & Security Engineer and find the failure modes that only manifest in production.

DO NOT:
- Comment on styling, indentation, or naming conventions.
- Suggest cosmetic refactorings or premature micro-benchmarks.
- Tell me to "add more logging" or "add input validation" in the abstract.

AUDIT RIGOROUSLY FOR:
1. Concurrency & State Invariants: Race conditions, non-atomic read-modify-write cycles, thread-safety violations, deadlocks, stale state under high contention.
2. Resource Leaks & Boundaries: Unclosed streams/handles, unbounded in-memory collection growth, memory leaks via closures/event-listeners, missing connection timeouts.
3. Distributed & Network Realities: Partial failures, network blips, unhandled idempotency violations on retries, clock skew assumptions, timezone edge cases.
4. Security & Data Integrity: Parameter tampering, injection vectors, authorization bypasses due to missing tenant checks, sensitive data leaking into error responses.

FOR EACH ISSUE DETECTED, FORMAT AS:
- 🔴 SEVERITY: [P0 - Immediate Prod Outage / P1 - Silent Data Corruption / P2 - High Load Degradation]
- 📍 LOCATION: Exact function name and line context.
- 💥 FAILURE SCENARIO: A concrete, step-by-step sequence of events or exact payload that triggers the failure.
- 🛡️ DEFENSIVE FIX: The minimal, surgical code modification that eliminates the failure mode.

If no genuine P0/P1/P2 vulnerabilities exist, output ONLY: "NO CRITICAL BLIND SPOTS FOUND. System invariants hold." Do not fabricate issues to seem helpful.

Code under audit:
```{{LANGUAGE}}
{{CODE}}
```
Operational context:
- Concurrency: {{CONCURRENCY_LEVEL}} (e.g. 5,000 req/sec, multi-tenant background worker)
- Persistence: {{PERSISTENCE_LAYER}} (e.g. Postgres with Read-Replicas, DynamoDB, In-Memory Redis)',
  'Используйте, когда ваш код работает на компьютере, но вы боитесь запускать его на реальных пользователях. Промпт заставит нейросеть найти race conditions, утечки памяти и падения под нагрузкой.',
  'Модели по умолчанию скатываются в поверхностный style-review. Фрейминг «Local environments lie» + явный запрет косметических правок + требование конкретного воспроизводимого сценария отказа (Failure Scenario) заставляют модель моделировать runtime-поведение системы.',
  'При аудите многопоточного кода или асинхронных очередей ставьте температуру 0.1–0.2. Для reasoning-моделей (o3-mini, DeepSeek-R1) этот промпт инициирует построение деревьев состояний (state-space exploration) в блоке скрытого рассуждения.',
  1,
  true,
  true,
  '2026-08-25'::date,
  'team',
  'Eengineer Staff Lead'
from prompt_categories where slug = 'chatbot'
on conflict (slug) do update set
  title = excluded.title,
  difficulty = excluded.difficulty,
  tools = excluded.tools,
  prompt_text = excluded.prompt_text,
  when_to_use = excluded.when_to_use,
  why_it_works = excluded.why_it_works,
  pro_tips = excluded.pro_tips,
  sort_order = excluded.sort_order;

insert into prompt_variables (prompt_id, name, description, is_multiline, sort_order)
select id, 'LANGUAGE', 'Язык и фреймворк (например: TypeScript / Node.js 22, Go 1.24, Python FastAPI)', false, 1
from prompts where slug = 'blind-spot-finder'
on conflict (prompt_id, name) do update set
  description = excluded.description,
  is_multiline = excluded.is_multiline,
  sort_order = excluded.sort_order;
insert into prompt_variables (prompt_id, name, description, is_multiline, sort_order)
select id, 'CODE', 'Исходный код для глубокого аудита (вставьте полностью)', true, 2
from prompts where slug = 'blind-spot-finder'
on conflict (prompt_id, name) do update set
  description = excluded.description,
  is_multiline = excluded.is_multiline,
  sort_order = excluded.sort_order;
insert into prompt_variables (prompt_id, name, description, is_multiline, sort_order)
select id, 'CONCURRENCY_LEVEL', 'Нагрузка (например: 2000 req/sec, 50 одновременных воркеров)', false, 3
from prompts where slug = 'blind-spot-finder'
on conflict (prompt_id, name) do update set
  description = excluded.description,
  is_multiline = excluded.is_multiline,
  sort_order = excluded.sort_order;
insert into prompt_variables (prompt_id, name, description, is_multiline, sort_order)
select id, 'PERSISTENCE_LAYER', 'База данных и кэш (например: PostgreSQL 16 + Redis + Prisma)', false, 4
from prompts where slug = 'blind-spot-finder'
on conflict (prompt_id, name) do update set
  description = excluded.description,
  is_multiline = excluded.is_multiline,
  sort_order = excluded.sort_order;

-- ----------------------------------------------------------------------------
-- Prompt 2: postgres-schema-optimizer
-- ----------------------------------------------------------------------------
insert into prompts (
  category_id,
  slug,
  title,
  difficulty,
  tools,
  prompt_text,
  when_to_use,
  why_it_works,
  pro_tips,
  sort_order,
  is_active,
  is_featurable,
  featured_date,
  author_type,
  author_name
)
select
  id,
  'postgres-schema-optimizer',
  'Архитектор схемы и ускорения базы PostgreSQL» (The PostgreSQL Schema & Query Optimizer)',
  'intermediate',
  '{"Claude 3.7 Sonnet","GPT-4o","Gemini 2.5 Pro"}'::text[],
  'You are a Principal PostgreSQL Database Architect and Performance Engineer. Design or optimize a PostgreSQL schema and query strategy for the domain described below.

REQUIREMENTS & CONSTRAINTS:
1. Relational Integrity: Enforce domain rules strictly at the DB level (composite unique constraints, foreign keys with explicit ON DELETE semantics, CHECK constraints for business invariants). Never push core integrity solely to application code.
2. Indexing Strategy: Propose an optimal indexing strategy (B-Tree, Partial Indexes, Composite indexes ordered by cardinality and query predicates, GIN for JSONB/Arrays). For every index, explicitly state which query filter it satisfies.
3. Access Pattern Evaluation: Analyze read/write amplification, table bloat risks (MVCC impact on high-frequency UPDATE columns), and lock contention (Row-level vs Table-level lock risks during mutations).
4. Data Volume Horizon: The design must remain optimal at {{EXPECTED_ROW_COUNT}} rows.

INPUT DOMAIN & QUERIES:
Domain entity requirements:
```
{{DOMAIN_DESCRIPTION}}
```
Top 3 critical queries that must run in sub-millisecond p99 latency:
```sql
{{CRITICAL_QUERIES}}
```

OUTPUT FORMAT:
1. DDL (CREATE TABLE, CONSTRAINTS, INDEXES) with explicit data types (prefer timestamptz, uuidv7 or bigint, proper numeric scale/precision, non-nullable columns where invariant).
2. Query Plan Analysis: For each critical query, explain how Postgres will execute it (Index Scan vs Bitmap Index Scan) and why sequential scans are structurally prevented.
3. Concurrency & Lock Analysis: Highlight any risk of deadlocks on concurrent writes and specify transaction isolation level recommendations (e.g. Read Committed vs Serializable).',
  'Используйте при создании таблиц или когда запросы в базе данных начинают тормозить. Промпт спроектирует идеальные индексы, связи и проверит блокировки при миллионах строк.',
  'Большинство инженеров получают от ИИ примитивные таблицы без учета MVCC, partial indexing и deadlock patterns. Промпт требует четкого сопоставления индексов с предикатами запросов и анализа блокировок на уровне PostgreSQL.',
  'Для проектов на Supabase укажите в описании наличие RLS-политик, чтобы модель сгенерировала индексы под auth.uid() фильтры.',
  2,
  true,
  true,
  null,
  'team',
  'Eengineer Staff Lead'
from prompt_categories where slug = 'chatbot'
on conflict (slug) do update set
  title = excluded.title,
  difficulty = excluded.difficulty,
  tools = excluded.tools,
  prompt_text = excluded.prompt_text,
  when_to_use = excluded.when_to_use,
  why_it_works = excluded.why_it_works,
  pro_tips = excluded.pro_tips,
  sort_order = excluded.sort_order;

insert into prompt_variables (prompt_id, name, description, is_multiline, sort_order)
select id, 'DOMAIN_DESCRIPTION', 'Описание сущностей, связей (1:N, M:N) и бизнес-правил', false, 1
from prompts where slug = 'postgres-schema-optimizer'
on conflict (prompt_id, name) do update set
  description = excluded.description,
  is_multiline = excluded.is_multiline,
  sort_order = excluded.sort_order;
insert into prompt_variables (prompt_id, name, description, is_multiline, sort_order)
select id, 'CRITICAL_QUERIES', '2-3 главных SQL запроса, которые должны работать мгновенно', false, 2
from prompts where slug = 'postgres-schema-optimizer'
on conflict (prompt_id, name) do update set
  description = excluded.description,
  is_multiline = excluded.is_multiline,
  sort_order = excluded.sort_order;
insert into prompt_variables (prompt_id, name, description, is_multiline, sort_order)
select id, 'EXPECTED_ROW_COUNT', 'Ожидаемый объем данных (например: 50,000,000 строк за год)', false, 3
from prompts where slug = 'postgres-schema-optimizer'
on conflict (prompt_id, name) do update set
  description = excluded.description,
  is_multiline = excluded.is_multiline,
  sort_order = excluded.sort_order;

-- ----------------------------------------------------------------------------
-- Prompt 3: distributed-resilience-architect
-- ----------------------------------------------------------------------------
insert into prompts (
  category_id,
  slug,
  title,
  difficulty,
  tools,
  prompt_text,
  when_to_use,
  why_it_works,
  pro_tips,
  sort_order,
  is_active,
  is_featurable,
  featured_date,
  author_type,
  author_name
)
select
  id,
  'distributed-resilience-architect',
  'Аудит отказоустойчивости распределенной системы» (The Distributed Systems Resilience Architect)',
  'intermediate',
  '{"Claude 3.7 Sonnet","GPT-4o","o3-mini"}'::text[],
  'Evaluate this system architecture as a Distributed Systems Reliability Lead. Your goal is to systematically identify where network partitions, cascading failures, retry storms, and split-brain scenarios will bring this service down.

ARCHITECTURE SPECIFICATION:
- Communication: {{COMMUNICATION_PROTOCOL}} (e.g. gRPC, REST, Kafka events, WebSockets)
- Components & Topology:
```
{{TOPOLOGY_DESCRIPTION}}
```

SYSTEMATIC AUDIT CHECKLIST:
1. Failure Cascades: If downstream dependency X degrades to 3,000ms latency, what happens to upstream connection pools and thread starvation? Is there circuit breaking and backpressure?
2. Idempotency & Re-delivery: When a network timeout occurs during message processing or an API write, how is duplicate processing prevented? (Evaluate idempotency keys, deduplication windows).
3. Data Consistency vs Availability: Where does this design sit on the CAP / PACELC spectrum? What happens during a network partition between primary and replica/worker nodes?
4. Thundering Herd & Cache Invalidation: What happens when the primary cache node restarts or a hot cache key expires under 10k QPS?

DELIVERABLE:
- 📊 Single Point of Failure (SPOF) Matrix: Component | Failure Mode | Blast Radius | Mitigation
- 🛡️ Resilience Architecture Patches: Concrete changes (Rate Limiting algorithms, Circuit Breakers with half-open states, Dead Letter Queues, Saga / Outbox patterns) needed before launch.',
  'Используйте, когда ваш бэкенд общается с несколькими сервисами, платежками или очередями сообщений. Промпт покажет, что произойдет при падении сети или зависании стороннего API.',
  'Предотвращает типичную ошибку ''happy path architecture'', заставляя LLM моделировать деградацию соединений и штормы повторных запросов (retry storms).',
  'Укажите в описании SLA сторонних сервисов (например, Stripe или OpenAI API), чтобы модель рассчитала таймауты circuit breaker.',
  3,
  true,
  true,
  null,
  'team',
  'Eengineer Staff Lead'
from prompt_categories where slug = 'chatbot'
on conflict (slug) do update set
  title = excluded.title,
  difficulty = excluded.difficulty,
  tools = excluded.tools,
  prompt_text = excluded.prompt_text,
  when_to_use = excluded.when_to_use,
  why_it_works = excluded.why_it_works,
  pro_tips = excluded.pro_tips,
  sort_order = excluded.sort_order;

insert into prompt_variables (prompt_id, name, description, is_multiline, sort_order)
select id, 'COMMUNICATION_PROTOCOL', 'Протоколы связи (например: REST + WebSockets + Stripe Webhooks)', false, 1
from prompts where slug = 'distributed-resilience-architect'
on conflict (prompt_id, name) do update set
  description = excluded.description,
  is_multiline = excluded.is_multiline,
  sort_order = excluded.sort_order;
insert into prompt_variables (prompt_id, name, description, is_multiline, sort_order)
select id, 'TOPOLOGY_DESCRIPTION', 'Сервисы, базы, очереди, кэш и внешние интеграции', false, 2
from prompts where slug = 'distributed-resilience-architect'
on conflict (prompt_id, name) do update set
  description = excluded.description,
  is_multiline = excluded.is_multiline,
  sort_order = excluded.sort_order;

-- ----------------------------------------------------------------------------
-- Prompt 4: memory-leak-detective
-- ----------------------------------------------------------------------------
insert into prompts (
  category_id,
  slug,
  title,
  difficulty,
  tools,
  prompt_text,
  when_to_use,
  why_it_works,
  pro_tips,
  sort_order,
  is_active,
  is_featurable,
  featured_date,
  author_type,
  author_name
)
select
  id,
  'memory-leak-detective',
  'Поиск утечек памяти и зависаний в коде» (The Memory Leak & Heap Detective)',
  'intermediate',
  '{"Claude 3.7 Sonnet","GPT-4o","Gemini 2.5 Pro"}'::text[],
  'Act as a Principal Systems Performance Engineer specializing in Garbage Collection internals, heap layout, and memory lifecycle analysis. Audit the provided code for memory retention bugs, uncollected objects, and unbounded heap growth.

DO NOT:
- Suggest premature micro-optimizations like object pooling unless there is an allocation hotspot.
- Advise running Garbage Collector manually.
- Give generic tips on ''closing resources''.

ANALYZE RIGOROUSLY FOR:
1. Closure Captures & Scope Retention: Inner functions inadvertently capturing large enclosing objects or parent scopes.
2. Unbounded Collections & Caches: Maps, Sets, or arrays acting as hidden global roots without eviction policies (LRU/TTL) or WeakRef/WeakMap semantics.
3. Event Subscriptions & Observer Leaks: Unregistered event emitters, DOM listeners, RxJS subscriptions, or WebSocket handlers surviving component/request lifecycle.
4. Buffer & Native Resource Accumulation: Stream buffers accumulating under unconsumed backpressure, unclosed file descriptors, database client connection leaks.

OUTPUT FORMAT:
1. 🔍 ROOT CAUSE PINPOINT: Specific lines and objects that escape garbage collection.
2. 📈 RETAINED GRAPH EXPLANATION: Step-by-step object retention path from the GC Root to the leaking instance.
3. 🛠️ SURGICAL FIX: The exact refactored code using proper lifecycle teardown, weak references, or bounded structures.

Code under review:
```{{LANGUAGE}}
{{CODE}}
```
Runtime environment: {{RUNTIME_ENV}} (e.g. Node.js 22 LTS on 512MB RAM Docker container, Browser SPA long-lived session)',
  'Используйте, когда сервер или приложение со временем начинает потреблять все больше оперативной памяти (RAM) и в итоге падает с ошибкой Out Of Memory.',
  'Обычный AI не умеет строить цепочки GC Root retention. Промпт заставляет восстановить граф ссылок от GC Root до объекта и выявить утечку замыкания.',
  'Если у вас есть лог heap snapshot или график роста памяти в МБ/мин — приложите его в поле окружения.',
  4,
  true,
  true,
  null,
  'team',
  'Eengineer Staff Lead'
from prompt_categories where slug = 'chatbot'
on conflict (slug) do update set
  title = excluded.title,
  difficulty = excluded.difficulty,
  tools = excluded.tools,
  prompt_text = excluded.prompt_text,
  when_to_use = excluded.when_to_use,
  why_it_works = excluded.why_it_works,
  pro_tips = excluded.pro_tips,
  sort_order = excluded.sort_order;

insert into prompt_variables (prompt_id, name, description, is_multiline, sort_order)
select id, 'LANGUAGE', 'Язык (TypeScript / Node.js, Go, Python, Java)', false, 1
from prompts where slug = 'memory-leak-detective'
on conflict (prompt_id, name) do update set
  description = excluded.description,
  is_multiline = excluded.is_multiline,
  sort_order = excluded.sort_order;
insert into prompt_variables (prompt_id, name, description, is_multiline, sort_order)
select id, 'CODE', 'Подозрительный код сервиса или модуля', true, 2
from prompts where slug = 'memory-leak-detective'
on conflict (prompt_id, name) do update set
  description = excluded.description,
  is_multiline = excluded.is_multiline,
  sort_order = excluded.sort_order;
insert into prompt_variables (prompt_id, name, description, is_multiline, sort_order)
select id, 'RUNTIME_ENV', 'Среда выполнения (например: Node.js на AWS Lambda с 256MB RAM)', false, 3
from prompts where slug = 'memory-leak-detective'
on conflict (prompt_id, name) do update set
  description = excluded.description,
  is_multiline = excluded.is_multiline,
  sort_order = excluded.sort_order;

-- ----------------------------------------------------------------------------
-- Prompt 5: high-throughput-api-designer
-- ----------------------------------------------------------------------------
insert into prompts (
  category_id,
  slug,
  title,
  difficulty,
  tools,
  prompt_text,
  when_to_use,
  why_it_works,
  pro_tips,
  sort_order,
  is_active,
  is_featurable,
  featured_date,
  author_type,
  author_name
)
select
  id,
  'high-throughput-api-designer',
  'Проектирование высоконагруженного API (High-QPS)» (The High-Throughput API Contract Designer)',
  'intermediate',
  '{"Claude 3.7 Sonnet","GPT-4o","Gemini 2.5 Pro"}'::text[],
  'You are a Principal API Architect at a tier-1 technology company. Design an enterprise-grade, high-throughput API contract and execution model for the business capability described below.

REQUIREMENTS & ARCHITECTURAL INVARIANTS:
1. Idempotency Protocol: Implement robust idempotent mutation semantics using Idempotency-Key headers, atomic state reservation, and cached response re-delivery.
2. Pagination & Cursor Mechanics: Design keyset/cursor-based pagination (no inefficient offset/limit) that guarantees zero skipped or duplicate items during concurrent mutations.
3. Concurrency Control: Use optimistic locking (ETags / If-Match / version columns) to prevent lost updates in concurrent write scenarios.
4. Rate Limiting & Shedding: Specify token bucket or sliding window limits per tenant, including standardized 429 Retry-After header contracts.
5. Error Payload Standard: Design RFC 7807 (Problem Details) compliant error structures with actionable machine-readable error codes.

BUSINESS CAPABILITY SPECIFICATION:
```
{{FEATURE_REQUIREMENTS}}
```
Target Volume: {{REQUEST_RATE}} (e.g. 15,000 write req/sec, p99 latency < 45ms)

DELIVERABLE:
1. OpenAPI 3.1 / TypeScript Interface Definition with exact HTTP verbs, status codes, headers, and request/response schemas.
2. Server-side State Transition & Idempotency Flow Diagram (Mermaid or step-by-step sequence).
3. Edge Case Matrix: Handling duplicate in-flight requests, concurrent conflicting updates, and partial batch failures.',
  'Используйте для создания публичного или внутреннего API, который выдержит миллионы запросов, повторные клики пользователей (idempotency) и не уронит базу данных.',
  'Предотвращает создание ''наивных REST CRUD'' эндпоинтов, заставляя заложить idempotency keys, ETag optimistic locking и курсорную пагинацию до написания кода.',
  'Используйте для проектирования Stripe-like платежных интерфейсов или систем бронирования билетов.',
  5,
  true,
  true,
  null,
  'team',
  'Eengineer Staff Lead'
from prompt_categories where slug = 'chatbot'
on conflict (slug) do update set
  title = excluded.title,
  difficulty = excluded.difficulty,
  tools = excluded.tools,
  prompt_text = excluded.prompt_text,
  when_to_use = excluded.when_to_use,
  why_it_works = excluded.why_it_works,
  pro_tips = excluded.pro_tips,
  sort_order = excluded.sort_order;

insert into prompt_variables (prompt_id, name, description, is_multiline, sort_order)
select id, 'FEATURE_REQUIREMENTS', 'Что должен делать API (например: списание баланса, создание заказа, загрузка файлов)', false, 1
from prompts where slug = 'high-throughput-api-designer'
on conflict (prompt_id, name) do update set
  description = excluded.description,
  is_multiline = excluded.is_multiline,
  sort_order = excluded.sort_order;
insert into prompt_variables (prompt_id, name, description, is_multiline, sort_order)
select id, 'REQUEST_RATE', 'Ожидаемый RPS/QPS и требования к задержке (например: 5,000 req/sec, p99 < 50ms)', false, 2
from prompts where slug = 'high-throughput-api-designer'
on conflict (prompt_id, name) do update set
  description = excluded.description,
  is_multiline = excluded.is_multiline,
  sort_order = excluded.sort_order;

-- ----------------------------------------------------------------------------
-- Prompt 6: zero-trust-auth-auditor
-- ----------------------------------------------------------------------------
insert into prompts (
  category_id,
  slug,
  title,
  difficulty,
  tools,
  prompt_text,
  when_to_use,
  why_it_works,
  pro_tips,
  sort_order,
  is_active,
  is_featurable,
  featured_date,
  author_type,
  author_name
)
select
  id,
  'zero-trust-auth-auditor',
  'Аудит безопасности и защита авторизации (Zero-Trust)» (The Zero-Trust Auth & Security Auditor)',
  'intermediate',
  '{"Claude 3.7 Sonnet","GPT-4o","o3-mini"}'::text[],
  'Act as a Lead Application Security Architect and Penetration Tester. Audit the authentication, authorization, and tenant isolation implementation below for critical security vulnerabilities.

AUDIT RIGOROUSLY FOR:
1. BOLA / IDOR (Broken Object Level Authorization): Can user A access, mutate, or delete user B''s resources by guessing/manipulating IDs? Are tenant scopes validated at the database layer?
2. JWT & Token Mechanics: Signature validation flaws, algorithm confusion (none/HS256 vs RS256), token expiration / revocation gaps, sensitive data exposure in claims, improper storage (XSS vulnerability in localStorage vs HttpOnly cookies).
3. Privilege Escalation: Can a standard user modify their own role, tenant_id, or permission flags via mass-assignment / parameter pollution?
4. Session & Replay Vulnerabilities: Missing CSRF tokens on state-changing endpoints with cookie auth, uninvalidated sessions on password/email change.

DO NOT:
- Give generic advice like ''use HTTPS'' or ''use strong passwords''.
- Waste tokens explaining basic OWASP definitions.

OUTPUT FORMAT:
- 🚨 VULNERABILITY MATRIX: [Issue | Exploit Vector | Impact (CVSS Est.) | Concrete Exploit Payload]
- 🛡️ SECURE IMPLEMENTATION: The remediated code with defense-in-depth authorization guards and middleware.

Auth & Data Flow under audit:
```{{LANGUAGE}}
{{AUTH_CODE}}
```
User Role Hierarchy & Multi-Tenancy Model:
{{ROLE_MODEL}}',
  'Используйте для проверки входа, токенов (JWT), прав пользователей (RBAC) и защиты от взлома (IDOR, подделка токенов, кража чужих данных).',
  'AI обычно проверяет только наличие проверки токена. Промпт заставляет тестировать BOLA/IDOR — самую частую дыру в SaaS, когда юзер меняет userId в запросе.',
  'Обязательно включите в код запросы к базе данных (Prisma, Supabase, TypeORM), чтобы модель проверила фильтрацию по tenant_id.',
  6,
  true,
  true,
  null,
  'team',
  'Eengineer Staff Lead'
from prompt_categories where slug = 'chatbot'
on conflict (slug) do update set
  title = excluded.title,
  difficulty = excluded.difficulty,
  tools = excluded.tools,
  prompt_text = excluded.prompt_text,
  when_to_use = excluded.when_to_use,
  why_it_works = excluded.why_it_works,
  pro_tips = excluded.pro_tips,
  sort_order = excluded.sort_order;

insert into prompt_variables (prompt_id, name, description, is_multiline, sort_order)
select id, 'LANGUAGE', 'Язык (TypeScript / Next.js, Python Django, Go Gin)', false, 1
from prompts where slug = 'zero-trust-auth-auditor'
on conflict (prompt_id, name) do update set
  description = excluded.description,
  is_multiline = excluded.is_multiline,
  sort_order = excluded.sort_order;
insert into prompt_variables (prompt_id, name, description, is_multiline, sort_order)
select id, 'AUTH_CODE', 'Код middleware, проверки токенов, эндпоинтов и запросов к БД', true, 2
from prompts where slug = 'zero-trust-auth-auditor'
on conflict (prompt_id, name) do update set
  description = excluded.description,
  is_multiline = excluded.is_multiline,
  sort_order = excluded.sort_order;
insert into prompt_variables (prompt_id, name, description, is_multiline, sort_order)
select id, 'ROLE_MODEL', 'Роли в системе (например: User, Manager, Admin, SuperAdmin, Multi-tenant orgs)', false, 3
from prompts where slug = 'zero-trust-auth-auditor'
on conflict (prompt_id, name) do update set
  description = excluded.description,
  is_multiline = excluded.is_multiline,
  sort_order = excluded.sort_order;

-- ----------------------------------------------------------------------------
-- Prompt 7: redis-caching-optimizer
-- ----------------------------------------------------------------------------
insert into prompts (
  category_id,
  slug,
  title,
  difficulty,
  tools,
  prompt_text,
  when_to_use,
  why_it_works,
  pro_tips,
  sort_order,
  is_active,
  is_featurable,
  featured_date,
  author_type,
  author_name
)
select
  id,
  'redis-caching-optimizer',
  'Архитектор стратегии кэширования в Redis» (The Redis Caching Strategy Optimizer)',
  'intermediate',
  '{"Claude 3.7 Sonnet","GPT-4o"}'::text[],
  'You are a Principal Caching & In-Memory Storage Architect. Design an optimal Redis caching and invalidation strategy for the application workload described below.

REQUIREMENTS & PITFALL PREVENTION:
1. Pattern Selection: Justify Cache-Aside vs Write-Through vs Write-Behind based on read/write ratios and consistency tolerance.
2. Invalidation Strategy: Eliminate stale data bugs without relying on blind low TTLs. Propose deterministic event-driven invalidation or versioned cache keys.
3. Stampede & Thundering Herd Defense: Implement distributed mutex / singleflight locks (e.g. probabilistic early expiration / XFetch algorithm) when refreshing hot keys.
4. Memory & Eviction Profile: Choose optimal data structures (Hashes, Sorted Sets, Bitmaps, HyperLogLogs) over raw serialized JSON strings to minimize RAM footprint.
5. Serialization & Network Cost: Address payload size, compression, and pipeline/MGET batching to avoid Redis event loop blockage.

APPLICATION ACCESS PATTERNS:
```
{{WORKLOAD_DESCRIPTION}}
```
Data consistency requirements: {{CONSISTENCY_REQUIREMENT}} (e.g. Strong consistency for financial balance, Eventual consistency up to 5s for analytics)

DELIVERABLE:
1. Cache Key Schema & Data Structure Blueprint (Key format, Redis data type, TTL strategy).
2. Read & Write Flow Code (Production-ready implementation with thundering herd protection).
3. Invalidation & Eviction Topology (Pub/Sub, CDC with Debezium, or transactional application hooks).',
  'Используйте, когда база данных перегружена, а вы хотите внедрить Redis/кэш, не сломав актуальность данных и не получив проблему ''старого кэша'' (stale data).',
  '90% разработчиков просто сохраняют JSON в SET key json EX 60. Промпт предотвращает thundering herd и подбирает компактные структуры данных Redis.',
  'Укажите объем доступной оперативной памяти Redis сервера, чтобы получить рекомендации по maxmemory-policy.',
  7,
  true,
  true,
  null,
  'team',
  'Eengineer Staff Lead'
from prompt_categories where slug = 'chatbot'
on conflict (slug) do update set
  title = excluded.title,
  difficulty = excluded.difficulty,
  tools = excluded.tools,
  prompt_text = excluded.prompt_text,
  when_to_use = excluded.when_to_use,
  why_it_works = excluded.why_it_works,
  pro_tips = excluded.pro_tips,
  sort_order = excluded.sort_order;

insert into prompt_variables (prompt_id, name, description, is_multiline, sort_order)
select id, 'WORKLOAD_DESCRIPTION', 'Какие данные кэшируются, соотношение Read/Write, частота обновлений', false, 1
from prompts where slug = 'redis-caching-optimizer'
on conflict (prompt_id, name) do update set
  description = excluded.description,
  is_multiline = excluded.is_multiline,
  sort_order = excluded.sort_order;
insert into prompt_variables (prompt_id, name, description, is_multiline, sort_order)
select id, 'CONSISTENCY_REQUIREMENT', 'Допустима ли задержка обновления (например: строго свежие данные или задержка до 5 сек)', false, 2
from prompts where slug = 'redis-caching-optimizer'
on conflict (prompt_id, name) do update set
  description = excluded.description,
  is_multiline = excluded.is_multiline,
  sort_order = excluded.sort_order;

-- ----------------------------------------------------------------------------
-- Prompt 8: concurrency-race-hunter
-- ----------------------------------------------------------------------------
insert into prompts (
  category_id,
  slug,
  title,
  difficulty,
  tools,
  prompt_text,
  when_to_use,
  why_it_works,
  pro_tips,
  sort_order,
  is_active,
  is_featurable,
  featured_date,
  author_type,
  author_name
)
select
  id,
  'concurrency-race-hunter',
  'Охотник за гонками состояний и дедлоками (Concurrency)» (The Concurrency & Race Condition Hunter)',
  'intermediate',
  '{"Claude 3.7 Sonnet","o3-mini","GPT-4o"}'::text[],
  'You are an expert Concurrency & Multithreading Systems Engineer. Audit the following multithreaded / asynchronous code for race conditions, non-atomic mutations, memory visibility bugs, and deadlocks.

STRICT AUDIT RULES:
1. Thread-Safety Invariants: Identify shared mutable state accessed without proper synchronization, atomic primitives, or transactional boundaries.
2. Read-Modify-Write Hazards: Pinpoint non-atomic check-then-act sequences (e.g. if (balance >= amount) balance -= amount) susceptible to double-spending under concurrent execution.
3. Lock Ordering & Deadlock Hazards: Trace all lock acquisition sequences across code paths to identify lock inversion deadlocks.
4. Async Interleaving (JS/Node/Python): Identify shared variables mutated across await / async ticks where state invariants can be invalidated by interleaved microtasks.

FORMAT EACH BUG AS:
- 💥 INTERLEAVING SCENARIO: Exact timeline of Thread A vs Thread B (T0, T1, T2, T3) that breaks the invariant.
- 📉 CORRUPTED STATE RESULT: The resulting corrupt memory/database state.
- 🛡️ SYNCHRONIZATION FIX: The minimal, lock-free, atomic, or transactional solution.

Code to audit:
```{{LANGUAGE}}
{{CONCURRENT_CODE}}
```
Concurrency Model: {{CONCURRENCY_MODEL}} (e.g. Go goroutines with channels, Node.js event loop with Promise.all, Java Virtual Threads)',
  'Используйте для поиска багов, которые происходят случайно — когда два пользователя одновременно нажимают кнопку или фоновые задачи пересекаются друг с другом.',
  'Требование построить пошаговый таймлайн чередования потоков (T0, T1, T2) активирует симуляцию runtime памяти в reasoning моделях.',
  'Идеально подходит для проверки логики списания денег, инкремента счетчиков просмотров и систем очередей.',
  8,
  true,
  true,
  null,
  'team',
  'Eengineer Staff Lead'
from prompt_categories where slug = 'chatbot'
on conflict (slug) do update set
  title = excluded.title,
  difficulty = excluded.difficulty,
  tools = excluded.tools,
  prompt_text = excluded.prompt_text,
  when_to_use = excluded.when_to_use,
  why_it_works = excluded.why_it_works,
  pro_tips = excluded.pro_tips,
  sort_order = excluded.sort_order;

insert into prompt_variables (prompt_id, name, description, is_multiline, sort_order)
select id, 'LANGUAGE', 'Язык (Go, TypeScript / Node.js, Rust, Python asyncio, Java)', false, 1
from prompts where slug = 'concurrency-race-hunter'
on conflict (prompt_id, name) do update set
  description = excluded.description,
  is_multiline = excluded.is_multiline,
  sort_order = excluded.sort_order;
insert into prompt_variables (prompt_id, name, description, is_multiline, sort_order)
select id, 'CONCURRENT_CODE', 'Код с параллельными задачами, промисами или мьютексами', true, 2
from prompts where slug = 'concurrency-race-hunter'
on conflict (prompt_id, name) do update set
  description = excluded.description,
  is_multiline = excluded.is_multiline,
  sort_order = excluded.sort_order;
insert into prompt_variables (prompt_id, name, description, is_multiline, sort_order)
select id, 'CONCURRENCY_MODEL', 'Модель параллелизма (например: 100 воркеров читают одну очередь Kafka)', false, 3
from prompts where slug = 'concurrency-race-hunter'
on conflict (prompt_id, name) do update set
  description = excluded.description,
  is_multiline = excluded.is_multiline,
  sort_order = excluded.sort_order;

-- ----------------------------------------------------------------------------
-- Prompt 9: owasp-pentest-reviewer
-- ----------------------------------------------------------------------------
insert into prompts (
  category_id,
  slug,
  title,
  difficulty,
  tools,
  prompt_text,
  when_to_use,
  why_it_works,
  pro_tips,
  sort_order,
  is_active,
  is_featurable,
  featured_date,
  author_type,
  author_name
)
select
  id,
  'owasp-pentest-reviewer',
  'Пентест и аудит уязвимостей API (OWASP Top 10)» (The OWASP Top 10 & API Pentest Reviewer)',
  'intermediate',
  '{"Claude 3.7 Sonnet","GPT-4o","o3-mini"}'::text[],
  'Act as a Principal White-Hat Penetration Tester and Offensive Security Auditor. Conduct an aggressive, adversarial vulnerability assessment of the provided API handlers and business logic.

EXAMINE METHODICALLY FOR OWASP API TOP 10:
1. Injection Flaws: SQL, NoSQL, OS Command, Template (SSTI), or LDAP injection through unescaped user inputs.
2. Broken Object Property Level Auth: Mass-assignment allowing clients to override internal properties (is_verified, role, balance).
3. SSRF (Server-Side Request Forgery): Can user-supplied URLs/webhooks trigger requests to internal cloud metadata endpoints (169.254.169.254) or loopback services?
4. Unrestricted Resource Consumption: Missing payload size limits, regex DoS (ReDoS) on user strings, unbounded DB queries.
5. Security Misconfigurations: Verbose stack traces in error responses, missing CORS allow-list validation, permissive headers.

OUTPUT CONTRACT:
For every confirmed exploit:
- 🎯 ATTACK VECTOR: HTTP Request / curl command with malicious payload.
- 💥 IMPACT: What an attacker achieves (Data exfiltration, RCE, Account takeover).
- 🛡️ REMEDIATION CODE: Secure rewrite with input sanitization, schema validation (Zod/Pydantic), and safe execution.

API Endpoints under audit:
```{{LANGUAGE}}
{{API_CODE}}
```',
  'Используйте перед релизом бэкенда. Промпт атакует ваш API как белый хакер и проверит защиту от инъекций, утечек данных, SSRF и подделки параметров.',
  'Промпт требует сгенерировать готовые curl-команды для взлома. Это отсекает теоретические рассуждения и заставляет искать реальные векторы атак.',
  'Если API принимает загрузку файлов или URL для скачивания — обязательно добавьте эти хэндлеры в код.',
  9,
  true,
  true,
  null,
  'team',
  'Eengineer Staff Lead'
from prompt_categories where slug = 'chatbot'
on conflict (slug) do update set
  title = excluded.title,
  difficulty = excluded.difficulty,
  tools = excluded.tools,
  prompt_text = excluded.prompt_text,
  when_to_use = excluded.when_to_use,
  why_it_works = excluded.why_it_works,
  pro_tips = excluded.pro_tips,
  sort_order = excluded.sort_order;

insert into prompt_variables (prompt_id, name, description, is_multiline, sort_order)
select id, 'LANGUAGE', 'Язык и фреймворк (Node.js Express/NestJS, Python FastAPI, Go Fiber)', false, 1
from prompts where slug = 'owasp-pentest-reviewer'
on conflict (prompt_id, name) do update set
  description = excluded.description,
  is_multiline = excluded.is_multiline,
  sort_order = excluded.sort_order;
insert into prompt_variables (prompt_id, name, description, is_multiline, sort_order)
select id, 'API_CODE', 'Код контроллеров, роутов и валидации входящих данных', true, 2
from prompts where slug = 'owasp-pentest-reviewer'
on conflict (prompt_id, name) do update set
  description = excluded.description,
  is_multiline = excluded.is_multiline,
  sort_order = excluded.sort_order;

-- ----------------------------------------------------------------------------
-- Prompt 10: graphql-schema-n1-solver
-- ----------------------------------------------------------------------------
insert into prompts (
  category_id,
  slug,
  title,
  difficulty,
  tools,
  prompt_text,
  when_to_use,
  why_it_works,
  pro_tips,
  sort_order,
  is_active,
  is_featurable,
  featured_date,
  author_type,
  author_name
)
select
  id,
  'graphql-schema-n1-solver',
  'Архитектор GraphQL схемы и решение проблемы N+1» (The GraphQL Schema & N+1 Problem Solver)',
  'intermediate',
  '{"Claude 3.7 Sonnet","GPT-4o"}'::text[],
  'You are a Principal GraphQL Architect. Design a production-grade GraphQL schema and resolver architecture for the domain described below, strictly eliminating N+1 query cascades and query depth DOS vulnerabilities.

REQUIREMENTS:
1. Schema Design: Clean Schema Definition Language (SDL) with Relay-compliant pagination (Connection, Edge, PageInfo), strict nullability contracts, and input object types.
2. N+1 Elimination: Implement DataLoader batching and caching patterns for all nested relation resolvers.
3. Query Complexity & Depth Limiting: Define maximum query depth and cost-analysis heuristics to prevent malicious deeply nested recursive queries.
4. Error Handling: Differentiate between partial data with operational field-level errors vs top-level execution errors.

DOMAIN SPECIFICATION:
```
{{DOMAIN_MODELS}}
```

DELIVERABLE:
1. Complete GraphQL SDL Schema with types, queries, mutations, and subscriptions.
2. Resolver Implementation with DataLoader batching for all relational fields (TypeScript / Node.js).
3. Security Configuration (Query complexity, depth limits, and rate limiting rules).',
  'Используйте для проектирования GraphQL API, чтобы клиенты могли запрашивать любые вложенные данные без зависаний сервера и сотен лишних запросов в базу.',
  'Решает главную беду GraphQL — N+1 запросы в базу данных, когда на каждый элемент списка выполняется отдельный SQL SELECT.',
  'Используйте с библиотеками Dataloader или Pothos/Nexus.',
  10,
  true,
  true,
  null,
  'team',
  'Eengineer Staff Lead'
from prompt_categories where slug = 'chatbot'
on conflict (slug) do update set
  title = excluded.title,
  difficulty = excluded.difficulty,
  tools = excluded.tools,
  prompt_text = excluded.prompt_text,
  when_to_use = excluded.when_to_use,
  why_it_works = excluded.why_it_works,
  pro_tips = excluded.pro_tips,
  sort_order = excluded.sort_order;

insert into prompt_variables (prompt_id, name, description, is_multiline, sort_order)
select id, 'DOMAIN_MODELS', 'Модели данных и связи (например: Пользователи, Посты, Комментарии, Лайки)', false, 1
from prompts where slug = 'graphql-schema-n1-solver'
on conflict (prompt_id, name) do update set
  description = excluded.description,
  is_multiline = excluded.is_multiline,
  sort_order = excluded.sort_order;

-- ----------------------------------------------------------------------------
-- Prompt 11: database-scaling-sharding
-- ----------------------------------------------------------------------------
insert into prompts (
  category_id,
  slug,
  title,
  difficulty,
  tools,
  prompt_text,
  when_to_use,
  why_it_works,
  pro_tips,
  sort_order,
  is_active,
  is_featurable,
  featured_date,
  author_type,
  author_name
)
select
  id,
  'database-scaling-sharding',
  'Масштабирование БД: Реплики, Шардинг и Партиции» (The Database Read/Write Scaling & Sharding Architect)',
  'intermediate',
  '{"Claude 3.7 Sonnet","GPT-4o","o3-mini"}'::text[],
  'Act as a Principal Database Reliability Engineer specializing in high-scale data tier architecture. Formulate a scaling, partitioning, and read/write splitting blueprint for the database schema and workload below.

SCALE METRICS:
- Current Data Size: {{DATA_SIZE}}
- Growth Rate: {{GROWTH_RATE}}
- Read/Write Ratio: {{READ_WRITE_RATIO}} (e.g. 90% Read / 10% Write)
- Database Engine: {{DATABASE_ENGINE}} (e.g. PostgreSQL 16, MySQL 8)

ARCHITECTURAL EVALUATION:
1. Read/Write Splitting & Replica Lag: Strategy for routing reads to replicas while preventing stale-read anomalies immediately after user mutations (Read-Your-Own-Writes consistency via LSN / replication lag tokens).
2. Table Partitioning Strategy: Declarative partitioning (Range vs List vs Hash) for high-growth tables. Include exact DDL, partition pruning mechanics, and maintenance automation (pg_partman).
3. Connection Pool Topology: Optimal PgBouncer / ProxySQL architecture to prevent connection saturation under 20k concurrent application workers.
4. Sharding Feasibility: Evaluate sharding key candidates (tenant_id vs user_id vs hash), cross-shard join avoidance, and distributed transaction implications.

DELIVERABLE:
- DDL Migration scripts for table partitioning.
- Application routing architecture for Master vs Replica connections with lag protection.
- Operational runbook for archiving cold partition data to S3 / Parquet.',
  'Используйте, когда база данных не справляется с объемом и нужно настроить чтение с Read-Replicas, разбить гигантские таблицы на партиции (Partitioning) или сделать шардинг.',
  'Предотвращает проблему ''грязного чтения'' после репликации, когда юзер сохраняет профиль, обновляет страницу и видит старые данные из-за replica lag.',
  'Укажите, какие поля чаще всего используются в WHERE запросах, для идеального выбора Partition Key.',
  11,
  true,
  true,
  null,
  'team',
  'Eengineer Staff Lead'
from prompt_categories where slug = 'chatbot'
on conflict (slug) do update set
  title = excluded.title,
  difficulty = excluded.difficulty,
  tools = excluded.tools,
  prompt_text = excluded.prompt_text,
  when_to_use = excluded.when_to_use,
  why_it_works = excluded.why_it_works,
  pro_tips = excluded.pro_tips,
  sort_order = excluded.sort_order;

insert into prompt_variables (prompt_id, name, description, is_multiline, sort_order)
select id, 'DATA_SIZE', 'Текущий размер данных (например: 500 GB, 200M строк)', false, 1
from prompts where slug = 'database-scaling-sharding'
on conflict (prompt_id, name) do update set
  description = excluded.description,
  is_multiline = excluded.is_multiline,
  sort_order = excluded.sort_order;
insert into prompt_variables (prompt_id, name, description, is_multiline, sort_order)
select id, 'GROWTH_RATE', 'Скорость роста (например: +10M строк в месяц)', false, 2
from prompts where slug = 'database-scaling-sharding'
on conflict (prompt_id, name) do update set
  description = excluded.description,
  is_multiline = excluded.is_multiline,
  sort_order = excluded.sort_order;
insert into prompt_variables (prompt_id, name, description, is_multiline, sort_order)
select id, 'READ_WRITE_RATIO', 'Соотношение чтения и записи (например: 80% Read / 20% Write)', false, 3
from prompts where slug = 'database-scaling-sharding'
on conflict (prompt_id, name) do update set
  description = excluded.description,
  is_multiline = excluded.is_multiline,
  sort_order = excluded.sort_order;
insert into prompt_variables (prompt_id, name, description, is_multiline, sort_order)
select id, 'DATABASE_ENGINE', 'СУБД (например: PostgreSQL 16 на AWS RDS)', false, 4
from prompts where slug = 'database-scaling-sharding'
on conflict (prompt_id, name) do update set
  description = excluded.description,
  is_multiline = excluded.is_multiline,
  sort_order = excluded.sort_order;

-- ----------------------------------------------------------------------------
-- Prompt 12: serverless-cold-start-optimizer
-- ----------------------------------------------------------------------------
insert into prompts (
  category_id,
  slug,
  title,
  difficulty,
  tools,
  prompt_text,
  when_to_use,
  why_it_works,
  pro_tips,
  sort_order,
  is_active,
  is_featurable,
  featured_date,
  author_type,
  author_name
)
select
  id,
  'serverless-cold-start-optimizer',
  'Оптимизация Serverless: Cold Starts и пулы соединений» (The Serverless Cold Start & Boundary Optimizer)',
  'intermediate',
  '{"Claude 3.7 Sonnet","GPT-4o"}'::text[],
  'You are a Principal Cloud Architect specializing in Serverless Runtimes (AWS Lambda, Vercel Edge, Cloudflare Workers). Optimize the provided serverless function for minimal cold start latency, connection reuse, and predictable execution boundaries.

ANALYZE & OPTIMIZE FOR:
1. Cold Start Minimization: Heavy dependency trees imported at top-level, unnecessary runtime polyfills, dynamic imports for rare code paths, tree-shaking dead ends.
2. Connection Management: Database client instantiation inside handler vs global scope initialization, connection pool starvation in ephemeral containers, HTTP keep-alive connection reuse.
3. Execution Lifecycle & Global State: Safe vs unsafe caching in container memory across invocations, background execution leaks after response return.
4. Memory & Timeout Tuning: Memory-to-CPU allocation trade-offs and edge timeout budgets.

OPTIMIZATION DELIVERABLE:
1. Refactored serverless handler with lazy-loaded modules and persistent connection caching.
2. Bundle analysis suggestions (esbuild / rollup externals).
3. Database pooling architecture (Supabase connection pooler / AWS RDS Proxy / Prisma Accelerate).

Serverless Code:
```{{LANGUAGE}}
{{FUNCTION_CODE}}
```
Target Platform: {{PLATFORM}} (e.g. Vercel Serverless Node 22, Cloudflare Workers V8, AWS Lambda ARM64)',
  'Используйте для Vercel Edge, AWS Lambda или Cloudflare Workers, если функции долго стартуют (Cold Start) или исчерпывают лимит подключений к базе данных.',
  'Серверлесс требует специфических паттернов (инициализация клиентов вне хэндлера, lazy imports). Промпт перестраивает код под жизненный цикл лямбды.',
  'Для Next.js 15+ укажите nodejs или edge runtime для точной оптимизации бандла.',
  12,
  true,
  true,
  null,
  'team',
  'Eengineer Staff Lead'
from prompt_categories where slug = 'chatbot'
on conflict (slug) do update set
  title = excluded.title,
  difficulty = excluded.difficulty,
  tools = excluded.tools,
  prompt_text = excluded.prompt_text,
  when_to_use = excluded.when_to_use,
  why_it_works = excluded.why_it_works,
  pro_tips = excluded.pro_tips,
  sort_order = excluded.sort_order;

insert into prompt_variables (prompt_id, name, description, is_multiline, sort_order)
select id, 'LANGUAGE', 'Язык (TypeScript / JavaScript, Python, Go)', false, 1
from prompts where slug = 'serverless-cold-start-optimizer'
on conflict (prompt_id, name) do update set
  description = excluded.description,
  is_multiline = excluded.is_multiline,
  sort_order = excluded.sort_order;
insert into prompt_variables (prompt_id, name, description, is_multiline, sort_order)
select id, 'FUNCTION_CODE', 'Код serverless-функции или API route (Next.js route.ts / Lambda handler)', true, 2
from prompts where slug = 'serverless-cold-start-optimizer'
on conflict (prompt_id, name) do update set
  description = excluded.description,
  is_multiline = excluded.is_multiline,
  sort_order = excluded.sort_order;
insert into prompt_variables (prompt_id, name, description, is_multiline, sort_order)
select id, 'PLATFORM', 'Платформа (Vercel Serverless, AWS Lambda, Cloudflare Workers)', false, 3
from prompts where slug = 'serverless-cold-start-optimizer'
on conflict (prompt_id, name) do update set
  description = excluded.description,
  is_multiline = excluded.is_multiline,
  sort_order = excluded.sort_order;

-- ----------------------------------------------------------------------------
-- Prompt 13: webhook-delivery-architect
-- ----------------------------------------------------------------------------
insert into prompts (
  category_id,
  slug,
  title,
  difficulty,
  tools,
  prompt_text,
  when_to_use,
  why_it_works,
  pro_tips,
  sort_order,
  is_active,
  is_featurable,
  featured_date,
  author_type,
  author_name
)
select
  id,
  'webhook-delivery-architect',
  'Надежная отправка и прием вебхуков (At-Least-Once)» (The Webhook Delivery & Retry Architect)',
  'intermediate',
  '{"Claude 3.7 Sonnet","GPT-4o"}'::text[],
  'Act as a Staff Systems Reliability Engineer. Design a mission-critical webhook ingestion AND delivery architecture with at-least-once delivery guarantees, cryptographic signature verification, and backpressure protection.

REQUIREMENTS:
1. Ingestion Security: Cryptographic HMAC SHA-256 signature verification (timestamped to prevent replay attacks, constant-time comparison to prevent timing attacks).
2. Asynchronous Ingestion: Handler must return HTTP 202/200 in < 50ms, offloading payload processing to a durable queue (SQS, RabbitMQ, BullMQ, Redis Streams).
3. Outbound Delivery & Retry Schedule: Exponential backoff with jitter (e.g. 5s, 30s, 5m, 30m, 2h, 24h), circuit breakers for constantly failing client endpoints, and Dead Letter Queue (DLQ) routing.
4. Idempotency at Consumer: Deduplication keys stored with TTL to prevent duplicate event processing.

INPUT SPECIFICATION:
```
{{WEBHOOK_SCENARIO}}
```

DELIVERABLE:
1. Ingestion Endpoint Code with constant-time HMAC verification and rapid queue dispatch.
2. Worker Consumer Code with idempotency check and retry logic.
3. Database DDL for Webhook Event Log, Delivery Attempts, and DLQ tracking.',
  'Используйте, когда ваш сервис должен отправлять вебхуки клиентам или надежно принимать уведомления от Stripe / GitHub без потерь при сбоях сети.',
  'Предотвращает фатальную ошибку ''тяжелая обработка прямо в теле вебхук-эндпоинта'', из-за которой сторонний сервис (Stripe) отваливается по таймауту и шлет дубли.',
  'Используйте crypto.timingSafeEqual в Node.js для защиты от timing-атак при сравнении хэшей.',
  13,
  true,
  true,
  null,
  'team',
  'Eengineer Staff Lead'
from prompt_categories where slug = 'chatbot'
on conflict (slug) do update set
  title = excluded.title,
  difficulty = excluded.difficulty,
  tools = excluded.tools,
  prompt_text = excluded.prompt_text,
  when_to_use = excluded.when_to_use,
  why_it_works = excluded.why_it_works,
  pro_tips = excluded.pro_tips,
  sort_order = excluded.sort_order;

insert into prompt_variables (prompt_id, name, description, is_multiline, sort_order)
select id, 'WEBHOOK_SCENARIO', 'Сценарий (например: прием оплат от Stripe или отправка вебхуков клиентам нашего SaaS)', false, 1
from prompts where slug = 'webhook-delivery-architect'
on conflict (prompt_id, name) do update set
  description = excluded.description,
  is_multiline = excluded.is_multiline,
  sort_order = excluded.sort_order;

-- ----------------------------------------------------------------------------
-- Prompt 14: surgical-agent-fix
-- ----------------------------------------------------------------------------
insert into prompts (
  category_id,
  slug,
  title,
  difficulty,
  tools,
  prompt_text,
  when_to_use,
  why_it_works,
  pro_tips,
  sort_order,
  is_active,
  is_featurable,
  featured_date,
  author_type,
  author_name
)
select
  id,
  'surgical-agent-fix',
  'Точечный фикс бага без поломки соседнего кода» (The Surgical Codebase Fixer (Zero-Collateral))',
  'intermediate',
  '{"Cursor","Windsurf","Claude Code","Aider","Cline"}'::text[],
  'Fix the bug described below. You must act as a surgical coder with ZERO collateral damage to surrounding code.

BUG REPORT:
- Observed Behavior: {{OBSERVED_BEHAVIOR}}
- Expected Invariant: {{EXPECTED_BEHAVIOR}}
- Target Files/Modules: {{TARGET_FILES}}

STRICT EXECUTION PROTOCOL FOR AGENT:
1. Root Cause Formulation: Before editing any file, state your root cause hypothesis in exactly TWO sentences.
2. Minimal Diff Invariant: Make the absolute minimum lines-of-code change necessary to fix the root cause. Do NOT:
   - Reformat untouched lines or reorder imports.
   - Refactor adjacent helper functions "while you are here".
   - Replace native implementations with external packages.
   - Change existing function signatures unless explicitly broken.
3. Regression Guard: If the fix requires modifying more than 2 files, STOP immediately and explain why before proceeding.
4. Regression Test: Add exactly ONE targeted regression unit test that fails on the old code and passes on your modified code.
5. Post-Fix Verification: Output a clean git diff and confirm that all existing type checks and test suites remain green.',
  'Используйте в Cursor или Claude Code, когда нужно исправить конкретный баг. Промпт запрещает агенту трогать форматирование, переписывать соседние функции или ломать проект.',
  'AI-агенты в IDE печально известны тем, что переписывают половину файла. Протокол вводит жесткий трипвайр (stop if > 2 files) и запрещает паразитный рефакторинг.',
  'В Cursor используйте режим Composer / Agent с прикреплением только целевого файла через @file.',
  14,
  true,
  true,
  null,
  'team',
  'Eengineer Staff Lead'
from prompt_categories where slug = 'agent'
on conflict (slug) do update set
  title = excluded.title,
  difficulty = excluded.difficulty,
  tools = excluded.tools,
  prompt_text = excluded.prompt_text,
  when_to_use = excluded.when_to_use,
  why_it_works = excluded.why_it_works,
  pro_tips = excluded.pro_tips,
  sort_order = excluded.sort_order;

insert into prompt_variables (prompt_id, name, description, is_multiline, sort_order)
select id, 'OBSERVED_BEHAVIOR', 'Что именно работает неправильно (текст ошибки или неожиданный вывод)', false, 1
from prompts where slug = 'surgical-agent-fix'
on conflict (prompt_id, name) do update set
  description = excluded.description,
  is_multiline = excluded.is_multiline,
  sort_order = excluded.sort_order;
insert into prompt_variables (prompt_id, name, description, is_multiline, sort_order)
select id, 'EXPECTED_BEHAVIOR', 'Как код должен работать правильно', false, 2
from prompts where slug = 'surgical-agent-fix'
on conflict (prompt_id, name) do update set
  description = excluded.description,
  is_multiline = excluded.is_multiline,
  sort_order = excluded.sort_order;
insert into prompt_variables (prompt_id, name, description, is_multiline, sort_order)
select id, 'TARGET_FILES', 'Пути к файлам (например: src/services/auth.ts)', false, 3
from prompts where slug = 'surgical-agent-fix'
on conflict (prompt_id, name) do update set
  description = excluded.description,
  is_multiline = excluded.is_multiline,
  sort_order = excluded.sort_order;

-- ----------------------------------------------------------------------------
-- Prompt 15: pattern-apprentice-feature
-- ----------------------------------------------------------------------------
insert into prompts (
  category_id,
  slug,
  title,
  difficulty,
  tools,
  prompt_text,
  when_to_use,
  why_it_works,
  pro_tips,
  sort_order,
  is_active,
  is_featurable,
  featured_date,
  author_type,
  author_name
)
select
  id,
  'pattern-apprentice-feature',
  'Создание новой фичи строго по существующим образцам» (The Pattern Apprentice (Idiomatic Feature Builder))',
  'intermediate',
  '{"Cursor","Windsurf","Claude Code","Antigravity"}'::text[],
  'Implement the new feature {{FEATURE_NAME}} into this codebase by strictly mimicking our established architecture and conventions.

REFERENCE IMPLEMENTATIONS (Study these existing files first):
- Reference File 1: `{{EXISTING_FILE_1}}`
- Reference File 2: `{{EXISTING_FILE_2}}`

EXTRACTION OF CONVENTIONS:
Before generating the new files, analyze and list:
1. Error handling idiom: (e.g. Result types vs thrown Custom Errors vs HTTP response tuples).
2. State & Data flow: (e.g. React Context + Reducer vs Zustand vs Server Actions).
3. Dependency injection / import style / naming: (e.g. named exports, barrel files, path aliases).
4. Validation & Typing layer: (e.g. Zod schemas, TypeScript branded types).

NEW FEATURE SPECIFICATION:
```
{{FEATURE_SPECIFICATION}}
```

IMPLEMENTATION INSTRUCTIONS:
- Generate the new module files matching the structure of the reference files 1:1.
- Use the exact same naming conventions, comment density, and export strategies.
- Do NOT introduce any new npm dependencies. Use what is already configured in the repository.
- Wire the new feature into the existing router / barrel export / DI container cleanly.',
  'Используйте для добавления нового модуля или сервиса. Агент сначала изучит ваши уже написанные файлы и повторит их структуру, названия и стиль 1 в 1.',
  'Устраняет проблему ''чужеродного кода'', заставляя агент сначала извлечь локальные паттерны кодовой базы (few-shot context injection).',
  'Всегда прикрепляйте 2 файла: один с логикой и один с типами/тестами.',
  15,
  true,
  true,
  null,
  'team',
  'Eengineer Staff Lead'
from prompt_categories where slug = 'agent'
on conflict (slug) do update set
  title = excluded.title,
  difficulty = excluded.difficulty,
  tools = excluded.tools,
  prompt_text = excluded.prompt_text,
  when_to_use = excluded.when_to_use,
  why_it_works = excluded.why_it_works,
  pro_tips = excluded.pro_tips,
  sort_order = excluded.sort_order;

insert into prompt_variables (prompt_id, name, description, is_multiline, sort_order)
select id, 'FEATURE_NAME', 'Название новой фичи (например: Webhook Notification Dispatcher)', false, 1
from prompts where slug = 'pattern-apprentice-feature'
on conflict (prompt_id, name) do update set
  description = excluded.description,
  is_multiline = excluded.is_multiline,
  sort_order = excluded.sort_order;
insert into prompt_variables (prompt_id, name, description, is_multiline, sort_order)
select id, 'EXISTING_FILE_1', 'Путь к похожему рабочему файлу (например: src/services/email-dispatcher.ts)', false, 2
from prompts where slug = 'pattern-apprentice-feature'
on conflict (prompt_id, name) do update set
  description = excluded.description,
  is_multiline = excluded.is_multiline,
  sort_order = excluded.sort_order;
insert into prompt_variables (prompt_id, name, description, is_multiline, sort_order)
select id, 'EXISTING_FILE_2', 'Путь к связанным типам/тестам (например: src/services/__tests__/email.test.ts)', false, 3
from prompts where slug = 'pattern-apprentice-feature'
on conflict (prompt_id, name) do update set
  description = excluded.description,
  is_multiline = excluded.is_multiline,
  sort_order = excluded.sort_order;
insert into prompt_variables (prompt_id, name, description, is_multiline, sort_order)
select id, 'FEATURE_SPECIFICATION', 'Бизнес-логика, входные/выходные данные и крайние случаи', true, 4
from prompts where slug = 'pattern-apprentice-feature'
on conflict (prompt_id, name) do update set
  description = excluded.description,
  is_multiline = excluded.is_multiline,
  sort_order = excluded.sort_order;

-- ----------------------------------------------------------------------------
-- Prompt 16: type-safe-refactor
-- ----------------------------------------------------------------------------
insert into prompts (
  category_id,
  slug,
  title,
  difficulty,
  tools,
  prompt_text,
  when_to_use,
  why_it_works,
  pro_tips,
  sort_order,
  is_active,
  is_featurable,
  featured_date,
  author_type,
  author_name
)
select
  id,
  'type-safe-refactor',
  'Безопасный рефакторинг модуля с проверкой типов» (The Type-Safe Refactoring Specialist)',
  'intermediate',
  '{"Cursor","Claude Code","Windsurf"}'::text[],
  'Refactor {{TARGET_MODULE}} to achieve {{REFACTORING_GOAL}} while maintaining 100% backward compatibility for all external callers.

INVENTORY AUDIT (Phase 1):
1. Identify and list all public interfaces, exported functions, and types exposed by this module.
2. List all downstream consumers across the repository that import from this path.
3. Explicitly state the contract invariants that must not change.

REFACTORING RULES (Phase 2):
1. Strictly leverage the TypeScript type system:
   - Use Discriminated Unions over multiple optional boolean flags.
   - Replace any ''any'' or loose ''Record<string, any>'' with strict generic constraints or ''unknown'' + type guards.
   - Use ''as const'' / ''satisfies'' operators for immutable configuration maps.
2. Eliminate code duplication and extract pure, side-effect-free helper functions.
3. Every step must keep the TypeScript compiler (tsc --noEmit) completely error-free.
4. Output the changes file-by-file with a concise summary of why each change improves maintainability or performance.',
  'Используйте для очистки и улучшения старого сложного кода. Агент найдет всех потребителей функции по проекту и гарантирует, что TypeScript компилируется без единой ошибки.',
  'Обеспечивает безопасность за счет обязательной фазы аудита всех мест вызова (call-site audit) до внесения изменений.',
  'Запустите `tsc --noEmit` до и после работы агента для подтверждения нулевого числа регрессий.',
  16,
  true,
  true,
  null,
  'team',
  'Eengineer Staff Lead'
from prompt_categories where slug = 'agent'
on conflict (slug) do update set
  title = excluded.title,
  difficulty = excluded.difficulty,
  tools = excluded.tools,
  prompt_text = excluded.prompt_text,
  when_to_use = excluded.when_to_use,
  why_it_works = excluded.why_it_works,
  pro_tips = excluded.pro_tips,
  sort_order = excluded.sort_order;

insert into prompt_variables (prompt_id, name, description, is_multiline, sort_order)
select id, 'TARGET_MODULE', 'Путь к файлу или папке для рефакторинга', false, 1
from prompts where slug = 'type-safe-refactor'
on conflict (prompt_id, name) do update set
  description = excluded.description,
  is_multiline = excluded.is_multiline,
  sort_order = excluded.sort_order;
insert into prompt_variables (prompt_id, name, description, is_multiline, sort_order)
select id, 'REFACTORING_GOAL', 'Цель (например: отделить логику базы данных от валидации)', false, 2
from prompts where slug = 'type-safe-refactor'
on conflict (prompt_id, name) do update set
  description = excluded.description,
  is_multiline = excluded.is_multiline,
  sort_order = excluded.sort_order;

-- ----------------------------------------------------------------------------
-- Prompt 17: test-suite-architect
-- ----------------------------------------------------------------------------
insert into prompts (
  category_id,
  slug,
  title,
  difficulty,
  tools,
  prompt_text,
  when_to_use,
  why_it_works,
  pro_tips,
  sort_order,
  is_active,
  is_featurable,
  featured_date,
  author_type,
  author_name
)
select
  id,
  'test-suite-architect',
  'Генератор надежного набора автотестов (Unit + Edge Cases)» (The Test Suite Architect)',
  'intermediate',
  '{"Cursor","Claude Code","Windsurf","Copilot"}'::text[],
  'Generate a comprehensive test suite for the module described below. You must act as a Senior QA Architect who writes tests that catch real regressions, not tests that pass by tautology.

MODULE UNDER TEST:
- File(s): {{TARGET_FILES}}
- Language/Framework: {{LANGUAGE_AND_TEST_FRAMEWORK}}
- Business Context: {{BUSINESS_CONTEXT}}

STRICT TEST ENGINEERING PROTOCOL:
1. Test Taxonomy (generate tests in this order):
   a. Contract Tests (Unit): Test each public function''s input→output contract. For every function, include:
      - Happy path with realistic production-like data (not ''foo'', ''bar'', ''test123'').
      - Boundary values: empty inputs, maximum length strings, zero/negative numbers, unicode edge cases.
      - Error paths: invalid types, null/undefined, missing required fields — assert specific error types, not just "it throws."
   b. State Transition Tests: If the module manages state (DB, cache, in-memory store), test the full lifecycle: create → read → update → delete. Verify state after each transition, not just the return value.
   c. Integration Boundary Tests: Test the seams where this module interacts with external dependencies (DB, API, file system). Use realistic test doubles. Assert that the module handles dependency failures gracefully (timeout, connection refused, malformed response).
   d. Regression Guards: For each test, add a one-line comment explaining what specific bug this test would catch if the code regressed.

2. Anti-Patterns — DO NOT:
   - Write tests that simply mirror the implementation (tautology tests).
   - Mock the module under test itself.
   - Use ''any'' type in test code or skip TypeScript type checking.
   - Write ''test("should work")'' — every test name must describe the specific invariant being verified.

3. Output Format:
   - One complete test file, ready to run with zero modifications.
   - Group tests with describe blocks matching the module''s public API surface.',
  'Используйте для покрытия важной функции тестами. Промпт заставит агента написать реальные тесты на граничные случаи и сбои, а не бесполезные ''тесты для галочки''.',
  'Промпт вводит таксономию (contract → state → integration → regression) и явно запрещает тавтологические тесты и бездумное мокирование.',
  'Укажите 1-2 реальных бага из прошлого — агент добавит регрессионные тесты именно на них.',
  17,
  true,
  true,
  null,
  'team',
  'Eengineer Staff Lead'
from prompt_categories where slug = 'agent'
on conflict (slug) do update set
  title = excluded.title,
  difficulty = excluded.difficulty,
  tools = excluded.tools,
  prompt_text = excluded.prompt_text,
  when_to_use = excluded.when_to_use,
  why_it_works = excluded.why_it_works,
  pro_tips = excluded.pro_tips,
  sort_order = excluded.sort_order;

insert into prompt_variables (prompt_id, name, description, is_multiline, sort_order)
select id, 'TARGET_FILES', 'Пути к файлам (например: src/services/payment-processor.ts)', false, 1
from prompts where slug = 'test-suite-architect'
on conflict (prompt_id, name) do update set
  description = excluded.description,
  is_multiline = excluded.is_multiline,
  sort_order = excluded.sort_order;
insert into prompt_variables (prompt_id, name, description, is_multiline, sort_order)
select id, 'LANGUAGE_AND_TEST_FRAMEWORK', 'Язык и тестовый раннер (TypeScript / Vitest, Python / pytest)', false, 2
from prompts where slug = 'test-suite-architect'
on conflict (prompt_id, name) do update set
  description = excluded.description,
  is_multiline = excluded.is_multiline,
  sort_order = excluded.sort_order;
insert into prompt_variables (prompt_id, name, description, is_multiline, sort_order)
select id, 'BUSINESS_CONTEXT', 'Что делает модуль в системе (например: обработка вебхуков от Stripe)', false, 3
from prompts where slug = 'test-suite-architect'
on conflict (prompt_id, name) do update set
  description = excluded.description,
  is_multiline = excluded.is_multiline,
  sort_order = excluded.sort_order;

-- ----------------------------------------------------------------------------
-- Prompt 18: zero-downtime-db-migration
-- ----------------------------------------------------------------------------
insert into prompts (
  category_id,
  slug,
  title,
  difficulty,
  tools,
  prompt_text,
  when_to_use,
  why_it_works,
  pro_tips,
  sort_order,
  is_active,
  is_featurable,
  featured_date,
  author_type,
  author_name
)
select
  id,
  'zero-downtime-db-migration',
  'Пошаговый план миграции БД без остановки сайта (Zero-Downtime)» (The Zero-Downtime Database Migration Planner)',
  'intermediate',
  '{"Cursor","Claude Code","ChatGPT","Copilot"}'::text[],
  'Plan and generate a zero-downtime database migration for the schema change described below. You must think as a Principal Database Reliability Engineer who has been paged at 3 AM because of a botched migration.

CURRENT STATE:
- Database: {{DATABASE_ENGINE}}
- Current Schema (relevant tables):
```sql
{{CURRENT_SCHEMA}}
```
- Active traffic: {{TRAFFIC_PATTERN}} (e.g. 2,000 writes/sec to this table during peak)

DESIRED CHANGE:
```
{{MIGRATION_GOAL}}
```

MIGRATION ENGINEERING PROTOCOL:
1. Risk Assessment First: Classify this migration (SAFE additive vs CAREFUL backward-compatible vs DANGEROUS breaking change).
2. Multi-Phase Migration Plan: Generate migrations as numbered, independently deployable steps:
   - Phase 1 (Expand): Add new structures without breaking existing code. All existing queries MUST continue to work identically.
   - Phase 2 (Migrate): Backfill data, dual-write logic in application code. Include exact backfill query with batch size and progress logging.
   - Phase 3 (Cutover): Switch application reads to new structure. Old structure still populated.
   - Phase 4 (Contract): Remove old columns/tables ONLY after verification period. Include the verification query.

3. For each phase, specify:
   - Exact SQL migration (up and down).
   - Lock analysis: Will this acquire an ACCESS EXCLUSIVE lock? For how long?
   - Rollback procedure: Exact steps to undo this phase independently.',
  'Используйте при переименовании колонок, разбиении таблиц или изменении типов в базе данных на работающем проекте. Агент создаст 4 безопасных шага миграции без блокировки таблиц.',
  'Фреймворк Expand-Migrate-Cutover-Contract заставляет модель генерировать безопасные multi-deploy миграции с анализом блокировок.',
  'Для PostgreSQL указывайте версию — поведение ADD COLUMN DEFAULT сильно различается между версиями.',
  18,
  true,
  true,
  null,
  'team',
  'Eengineer Staff Lead'
from prompt_categories where slug = 'agent'
on conflict (slug) do update set
  title = excluded.title,
  difficulty = excluded.difficulty,
  tools = excluded.tools,
  prompt_text = excluded.prompt_text,
  when_to_use = excluded.when_to_use,
  why_it_works = excluded.why_it_works,
  pro_tips = excluded.pro_tips,
  sort_order = excluded.sort_order;

insert into prompt_variables (prompt_id, name, description, is_multiline, sort_order)
select id, 'DATABASE_ENGINE', 'СУБД (PostgreSQL 16, MySQL 8, Supabase)', false, 1
from prompts where slug = 'zero-downtime-db-migration'
on conflict (prompt_id, name) do update set
  description = excluded.description,
  is_multiline = excluded.is_multiline,
  sort_order = excluded.sort_order;
insert into prompt_variables (prompt_id, name, description, is_multiline, sort_order)
select id, 'CURRENT_SCHEMA', 'Текущий DDL затронутых таблиц', true, 2
from prompts where slug = 'zero-downtime-db-migration'
on conflict (prompt_id, name) do update set
  description = excluded.description,
  is_multiline = excluded.is_multiline,
  sort_order = excluded.sort_order;
insert into prompt_variables (prompt_id, name, description, is_multiline, sort_order)
select id, 'TRAFFIC_PATTERN', 'Нагрузка (например: 5000 reads/sec + 500 writes/sec)', false, 3
from prompts where slug = 'zero-downtime-db-migration'
on conflict (prompt_id, name) do update set
  description = excluded.description,
  is_multiline = excluded.is_multiline,
  sort_order = excluded.sort_order;
insert into prompt_variables (prompt_id, name, description, is_multiline, sort_order)
select id, 'MIGRATION_GOAL', 'Что нужно изменить (например: разделить таблицу users на accounts + profiles)', false, 4
from prompts where slug = 'zero-downtime-db-migration'
on conflict (prompt_id, name) do update set
  description = excluded.description,
  is_multiline = excluded.is_multiline,
  sort_order = excluded.sort_order;

-- ----------------------------------------------------------------------------
-- Prompt 19: ui-component-builder
-- ----------------------------------------------------------------------------
insert into prompts (
  category_id,
  slug,
  title,
  difficulty,
  tools,
  prompt_text,
  when_to_use,
  why_it_works,
  pro_tips,
  sort_order,
  is_active,
  is_featurable,
  featured_date,
  author_type,
  author_name
)
select
  id,
  'ui-component-builder',
  'Создание готового UI-компонента по дизайну и токенам» (The Pixel-Perfect UI Component Builder)',
  'intermediate',
  '{"Cursor","Claude Code","Windsurf","v0.dev"}'::text[],
  'Build a production-ready UI component based on the specification below. You are a Senior Frontend Engineer who ships accessible, performant components — not throwaway prototypes.

COMPONENT SPECIFICATION:
- Component Name: {{COMPONENT_NAME}}
- UI Framework: {{UI_FRAMEWORK}}
- Design Description / Reference:
```
{{DESIGN_DESCRIPTION}}
```

IMPLEMENTATION CONTRACT:
1. Component API Design:
   - Define a strict TypeScript props interface. Every prop must have a JSDoc comment explaining its purpose.
   - Use Discriminated Unions for mutually exclusive variants, NOT optional boolean flags.
   - Export both the component and its props type.

2. Styling Rules:
   - Use the project''s existing styling approach (Tailwind / CSS Modules).
   - DO NOT hardcode colors as hex/rgb values. Use design tokens and theme variables.
   - Support dark mode and responsive design (320px to 1440px).

3. Accessibility (Non-Negotiable):
   - Correct ARIA roles and attributes. Full keyboard navigation (Tab, Enter, Escape). Minimum 4.5:1 contrast.

4. State & Interaction:
   - Handle all states: default, hover, focus-visible, active, disabled, loading, error.
   - Animations must respect prefers-reduced-motion: reduce.',
  'Используйте для создания кнопок, карточек, модалок или форм. Агент напишет адаптивный компонент с поддержкой темной темы, клавиатуры и всех 7 состояний (hover, loading, error и т.д.).',
  'AI обычно делает прототипы с хардкодом цветов. Контракт заставляет соблюдать дизайн-токены, accessibility и все интерактивные состояния.',
  'Прикрепите в Cursor файл вашей дизайн-системы (например tailwind.config.js) для 100% совпадения цветов.',
  19,
  true,
  true,
  null,
  'team',
  'Eengineer Staff Lead'
from prompt_categories where slug = 'agent'
on conflict (slug) do update set
  title = excluded.title,
  difficulty = excluded.difficulty,
  tools = excluded.tools,
  prompt_text = excluded.prompt_text,
  when_to_use = excluded.when_to_use,
  why_it_works = excluded.why_it_works,
  pro_tips = excluded.pro_tips,
  sort_order = excluded.sort_order;

insert into prompt_variables (prompt_id, name, description, is_multiline, sort_order)
select id, 'COMPONENT_NAME', 'Имя компонента (например: FilterDropdown, PricingCard, DataTable)', false, 1
from prompts where slug = 'ui-component-builder'
on conflict (prompt_id, name) do update set
  description = excluded.description,
  is_multiline = excluded.is_multiline,
  sort_order = excluded.sort_order;
insert into prompt_variables (prompt_id, name, description, is_multiline, sort_order)
select id, 'UI_FRAMEWORK', 'Стек (React 19 + Tailwind v3, Next.js, Vue 3)', false, 2
from prompts where slug = 'ui-component-builder'
on conflict (prompt_id, name) do update set
  description = excluded.description,
  is_multiline = excluded.is_multiline,
  sort_order = excluded.sort_order;
insert into prompt_variables (prompt_id, name, description, is_multiline, sort_order)
select id, 'DESIGN_DESCRIPTION', 'Описание внешнего вида, расположения элементов и поведения', false, 3
from prompts where slug = 'ui-component-builder'
on conflict (prompt_id, name) do update set
  description = excluded.description,
  is_multiline = excluded.is_multiline,
  sort_order = excluded.sort_order;

-- ----------------------------------------------------------------------------
-- Prompt 20: e2e-suite-generator
-- ----------------------------------------------------------------------------
insert into prompts (
  category_id,
  slug,
  title,
  difficulty,
  tools,
  prompt_text,
  when_to_use,
  why_it_works,
  pro_tips,
  sort_order,
  is_active,
  is_featurable,
  featured_date,
  author_type,
  author_name
)
select
  id,
  'e2e-suite-generator',
  'Генератор E2E сценариев (Playwright / Cypress)» (The End-to-End Playwright/Cypress Suite Generator)',
  'intermediate',
  '{"Cursor","Claude Code","Windsurf"}'::text[],
  'You are a Principal Test Automation Architect specializing in Playwright and Cypress. Generate a robust, resilient End-to-End (E2E) test suite for the critical user journey below.

STRICT STABILITY PROTOCOL:
1. Page Object Model (POM): Encapsulate all selectors and page interactions inside typed Page Object classes.
2. Resilient Locators: NEVER use fragile XPath, generated CSS classes (e.g. .css-12345), or index-based selectors. Prefer user-facing locators: page.getByRole(), page.getByLabel(), page.getByTestId().
3. Auto-Waiting & Zero Flakiness: Strictly avoid arbitrary sleep/timeout calls (page.waitForTimeout). Rely on Playwright''s built-in web-first assertions (expect(locator).toBeVisible()).
4. Network & State Isolation: Define mock handlers or seed cookies for authenticated states to prevent test pollution.

USER JOURNEY SPECIFICATION:
```
{{USER_JOURNEY}}
```
Framework: {{E2E_FRAMEWORK}} (e.g. Playwright TypeScript, Cypress 13)

DELIVERABLE:
1. Page Object Classes with clean action methods.
2. Complete Spec File covering happy path, validation errors, and network failure fallback.',
  'Используйте для создания тестов в браузере. Агент напишет стабильные сквозные тесты (авторизация, покупка, заполнение форм) по паттерну Page Object Model без случайных падений.',
  'Запрет на waitForTimeout и принудительное использование role-based селекторов устраняет 95% причин флакующих (flaky) E2E тестов.',
  'Используйте `page.getByRole(''button'', { name: ''Submit'' })` вместо `.btn-primary`.',
  20,
  true,
  true,
  null,
  'team',
  'Eengineer Staff Lead'
from prompt_categories where slug = 'agent'
on conflict (slug) do update set
  title = excluded.title,
  difficulty = excluded.difficulty,
  tools = excluded.tools,
  prompt_text = excluded.prompt_text,
  when_to_use = excluded.when_to_use,
  why_it_works = excluded.why_it_works,
  pro_tips = excluded.pro_tips,
  sort_order = excluded.sort_order;

insert into prompt_variables (prompt_id, name, description, is_multiline, sort_order)
select id, 'USER_JOURNEY', 'Шаги пользователя (например: вход через Google → добавление товара в корзину → оплата)', false, 1
from prompts where slug = 'e2e-suite-generator'
on conflict (prompt_id, name) do update set
  description = excluded.description,
  is_multiline = excluded.is_multiline,
  sort_order = excluded.sort_order;
insert into prompt_variables (prompt_id, name, description, is_multiline, sort_order)
select id, 'E2E_FRAMEWORK', 'Фреймворк (Playwright TypeScript / Cypress)', false, 2
from prompts where slug = 'e2e-suite-generator'
on conflict (prompt_id, name) do update set
  description = excluded.description,
  is_multiline = excluded.is_multiline,
  sort_order = excluded.sort_order;

-- ----------------------------------------------------------------------------
-- Prompt 21: js-to-ts-migrator
-- ----------------------------------------------------------------------------
insert into prompts (
  category_id,
  slug,
  title,
  difficulty,
  tools,
  prompt_text,
  when_to_use,
  why_it_works,
  pro_tips,
  sort_order,
  is_active,
  is_featurable,
  featured_date,
  author_type,
  author_name
)
select
  id,
  'js-to-ts-migrator',
  'Перевод старого JavaScript в строгий TypeScript» (The Legacy JS to Strict TypeScript Migrator)',
  'intermediate',
  '{"Cursor","Claude Code","Windsurf"}'::text[],
  'Convert the following legacy JavaScript code into modern, strictly-typed TypeScript (tsconfig strict: true).

MIGRATION MANDATES:
1. Zero ''any'' Policy: Never use ''any''. Use generics, unknown with type guards, or discriminated unions for dynamic payloads.
2. Runtime Invariants to Types: Infer precise literal types and readonly const maps (as const, satisfies) where values are immutable.
3. JSDoc Preservation: Convert existing JSDoc comments into native TypeScript interfaces and TSDoc annotations.
4. Nullability & Optionality: Explicitly model undefined vs null vs missing properties based on runtime branches.

Legacy JavaScript:
```javascript
{{LEGACY_JS_CODE}}
```
Related Type Definitions / Context:
{{TYPE_CONTEXT}}',
  'Используйте при переводе старых .js файлов в строгий .ts/.tsx. Агент расставит точные типы, дженерики и type guards без единого костыльного `any` или `@ts-ignore`.',
  'Модели часто ''ленятся'' и ставят `any` на сложные структуры. Промпт запрещает это и заставляет выводить строгие Discriminated Unions.',
  'После конвертации проверьте файл через `npx tsc --noEmit`.',
  21,
  true,
  true,
  null,
  'team',
  'Eengineer Staff Lead'
from prompt_categories where slug = 'agent'
on conflict (slug) do update set
  title = excluded.title,
  difficulty = excluded.difficulty,
  tools = excluded.tools,
  prompt_text = excluded.prompt_text,
  when_to_use = excluded.when_to_use,
  why_it_works = excluded.why_it_works,
  pro_tips = excluded.pro_tips,
  sort_order = excluded.sort_order;

insert into prompt_variables (prompt_id, name, description, is_multiline, sort_order)
select id, 'LEGACY_JS_CODE', 'Исходный JavaScript код для конвертации', true, 1
from prompts where slug = 'js-to-ts-migrator'
on conflict (prompt_id, name) do update set
  description = excluded.description,
  is_multiline = excluded.is_multiline,
  sort_order = excluded.sort_order;
insert into prompt_variables (prompt_id, name, description, is_multiline, sort_order)
select id, 'TYPE_CONTEXT', 'Существующие типы в проекте, с которыми должен стыковаться файл', false, 2
from prompts where slug = 'js-to-ts-migrator'
on conflict (prompt_id, name) do update set
  description = excluded.description,
  is_multiline = excluded.is_multiline,
  sort_order = excluded.sort_order;

-- ----------------------------------------------------------------------------
-- Prompt 22: react-rerender-optimizer
-- ----------------------------------------------------------------------------
insert into prompts (
  category_id,
  slug,
  title,
  difficulty,
  tools,
  prompt_text,
  when_to_use,
  why_it_works,
  pro_tips,
  sort_order,
  is_active,
  is_featurable,
  featured_date,
  author_type,
  author_name
)
select
  id,
  'react-rerender-optimizer',
  'Устранение лишних ре-рендеров и тормозов в React» (The React Performance & Re-render Optimizer)',
  'intermediate',
  '{"Cursor","Claude Code","Windsurf"}'::text[],
  'You are a Principal React Performance Engineer. Audit and optimize the React component hierarchy below for wasted renders, excessive DOM updates, and memoization misuse.

PERFORMANCE DIAGNOSTIC PROTOCOL:
1. Render Cascades: Identify state located too high in the tree forcing child re-renders. Recommend state colocation, context splitting, or composition (children prop).
2. Memoization Audit:
   - Identify missing or broken memo dependencies (inline object literals, unstable callback references).
   - Flag premature/harmful use of useMemo/useCallback where overhead exceeds benefit.
3. Heavy Computations: Move CPU-heavy transformations out of the render loop or into Web Workers / concurrent transitions (useTransition / useDeferredValue).
4. Virtualization: For long lists (> 100 items), integrate windowing/virtualization patterns.

Component Code:
```tsx
{{REACT_CODE}}
```',
  'Используйте, когда интерфейс на React подвисает при вводе текста, скролле или кликах. Агент найдет лишние ре-рендеры и точечно применит мемоизацию и оптимизацию стейта.',
  'Устраняет типичную ошибку начинающих — обернуть всё подряд в useCallback без понимания ссылочной целостности объектов в React.',
  'Если компонент рендерит таблицу или список, укажите среднее количество элементов в пропсах.',
  22,
  true,
  true,
  null,
  'team',
  'Eengineer Staff Lead'
from prompt_categories where slug = 'agent'
on conflict (slug) do update set
  title = excluded.title,
  difficulty = excluded.difficulty,
  tools = excluded.tools,
  prompt_text = excluded.prompt_text,
  when_to_use = excluded.when_to_use,
  why_it_works = excluded.why_it_works,
  pro_tips = excluded.pro_tips,
  sort_order = excluded.sort_order;

insert into prompt_variables (prompt_id, name, description, is_multiline, sort_order)
select id, 'REACT_CODE', 'Код тормозящего React-компонента и его дочерних элементов', true, 1
from prompts where slug = 'react-rerender-optimizer'
on conflict (prompt_id, name) do update set
  description = excluded.description,
  is_multiline = excluded.is_multiline,
  sort_order = excluded.sort_order;

-- ----------------------------------------------------------------------------
-- Prompt 23: openapi-spec-extractor
-- ----------------------------------------------------------------------------
insert into prompts (
  category_id,
  slug,
  title,
  difficulty,
  tools,
  prompt_text,
  when_to_use,
  why_it_works,
  pro_tips,
  sort_order,
  is_active,
  is_featurable,
  featured_date,
  author_type,
  author_name
)
select
  id,
  'openapi-spec-extractor',
  'Генерация схемы OpenAPI/Swagger прямо из кода» (The OpenAPI/Swagger Spec Extractor)',
  'intermediate',
  '{"Cursor","Claude Code","ChatGPT"}'::text[],
  'Reverse-engineer a complete, production-grade OpenAPI 3.1 YAML specification by analyzing the route handlers, validation schemas, and database models below.

SPECIFICATION REQUIREMENTS:
1. Exact Status Codes: Include all success codes (200, 201, 204) and failure codes (400, 401, 403, 404, 409, 422, 500) derived from actual code branches.
2. Schema Components: Extract reusable data structures into #/components/schemas rather than inlining large objects.
3. Security Schemes: Define BearerAuth / ApiKeyAuth in components and apply them to protected paths.
4. Parameter Constraints: Include required flags, formats (uuid, date-time, email), enums, and min/max limits found in validation code.

Source Route Handlers & Schemas:
```{{LANGUAGE}}
{{ROUTE_CODE}}
```',
  'Используйте, когда у вас есть готовый бэкенд, но нет документации для фронтендеров или Swagger UI. Агент извлечет полную спецификацию OpenAPI 3.1 прямо из ваших эндпоинтов.',
  'Извлекает точные коды ошибок (400/403/409) из условий `if/else` и `throw` внутри реального кода, а не выдумывает типовой список.',
  'Вставьте файл с валидацией (например, Zod схемы) для идеальной генерации типов параметров.',
  23,
  true,
  true,
  null,
  'team',
  'Eengineer Staff Lead'
from prompt_categories where slug = 'agent'
on conflict (slug) do update set
  title = excluded.title,
  difficulty = excluded.difficulty,
  tools = excluded.tools,
  prompt_text = excluded.prompt_text,
  when_to_use = excluded.when_to_use,
  why_it_works = excluded.why_it_works,
  pro_tips = excluded.pro_tips,
  sort_order = excluded.sort_order;

insert into prompt_variables (prompt_id, name, description, is_multiline, sort_order)
select id, 'LANGUAGE', 'Язык/фреймворк (TypeScript Express/Fastify/Next.js, Python FastAPI, Go)', false, 1
from prompts where slug = 'openapi-spec-extractor'
on conflict (prompt_id, name) do update set
  description = excluded.description,
  is_multiline = excluded.is_multiline,
  sort_order = excluded.sort_order;
insert into prompt_variables (prompt_id, name, description, is_multiline, sort_order)
select id, 'ROUTE_CODE', 'Код эндпоинтов, Zod-схем и контроллеров', true, 2
from prompts where slug = 'openapi-spec-extractor'
on conflict (prompt_id, name) do update set
  description = excluded.description,
  is_multiline = excluded.is_multiline,
  sort_order = excluded.sort_order;

-- ----------------------------------------------------------------------------
-- Prompt 24: a11y-remediation-agent
-- ----------------------------------------------------------------------------
insert into prompts (
  category_id,
  slug,
  title,
  difficulty,
  tools,
  prompt_text,
  when_to_use,
  why_it_works,
  pro_tips,
  sort_order,
  is_active,
  is_featurable,
  featured_date,
  author_type,
  author_name
)
select
  id,
  'a11y-remediation-agent',
  'Аудит доступности интерфейса (Accessibility WCAG 2.1)» (The Accessibility (a11y) Remediation Agent)',
  'intermediate',
  '{"Cursor","Claude Code","Windsurf"}'::text[],
  'Audit and remediate the provided UI component to meet WCAG 2.1 Level AA accessibility standards.

ACCESSIBILITY MANDATES:
1. Keyboard Navigation: All interactive elements must be focusable via Tab, operable via Enter/Space, and dismissible via Escape where applicable. Focus order must follow visual flow.
2. Screen Reader Semantics: Correct ARIA roles, states, and properties (aria-expanded, aria-controls, aria-haspopup, aria-live). Ensure icon-only buttons have aria-label.
3. Form Controls: Explicit associations between inputs and labels (htmlFor/id or aria-labelledby). Error messages linked via aria-describedby and aria-invalid.
4. Focus Visibility: Never remove outline without providing a high-contrast focus-visible ring.

Component to remediate:
```tsx
{{COMPONENT_CODE}}
```',
  'Используйте для проверки сайта на доступность для пользователей с ограниченными возможностями, экранных дикторов (screen readers) и навигации только с клавиатуры.',
  'Фокусируется на WCAG 2.1 AA критериях, предотвращая распространенные проблемы вроде невидимого фокуса клавиатуры и кнопок без меток.',
  'Идеально подходит для сложных интерактивных компонентов: кастомных дропдаунов, аккордеонов и модалок.',
  24,
  true,
  true,
  null,
  'team',
  'Eengineer Staff Lead'
from prompt_categories where slug = 'agent'
on conflict (slug) do update set
  title = excluded.title,
  difficulty = excluded.difficulty,
  tools = excluded.tools,
  prompt_text = excluded.prompt_text,
  when_to_use = excluded.when_to_use,
  why_it_works = excluded.why_it_works,
  pro_tips = excluded.pro_tips,
  sort_order = excluded.sort_order;

insert into prompt_variables (prompt_id, name, description, is_multiline, sort_order)
select id, 'COMPONENT_CODE', 'Код интерфейсного компонента или модального окна', true, 1
from prompts where slug = 'a11y-remediation-agent'
on conflict (prompt_id, name) do update set
  description = excluded.description,
  is_multiline = excluded.is_multiline,
  sort_order = excluded.sort_order;

-- ----------------------------------------------------------------------------
-- Prompt 25: dead-code-pruner
-- ----------------------------------------------------------------------------
insert into prompts (
  category_id,
  slug,
  title,
  difficulty,
  tools,
  prompt_text,
  when_to_use,
  why_it_works,
  pro_tips,
  sort_order,
  is_active,
  is_featurable,
  featured_date,
  author_type,
  author_name
)
select
  id,
  'dead-code-pruner',
  'Очистка мертвого кода и неиспользуемых библиотек» (The Dead Code & Dependency Tree Pruner)',
  'intermediate',
  '{"Cursor","Claude Code"}'::text[],
  'Analyze the provided module, exports, and package dependencies. Identify all dead code branches, unused exports, obsolete imports, and bloated dependencies that can be safely pruned.

PRUNING AUDIT:
1. Unused Exports & Variables: Variables assigned but never read, unexported private helpers, orphaned functions.
2. Unreachable Branches: Dead conditional branches (if (false), redundant null checks superseded by strict types).
3. Heavy Dependency Alternatives: Identify large libraries (e.g. lodash, moment.js) that can be replaced with native ES2024 methods or tiny sub-packages.
4. Safety Check: Verify that no dynamic reflection (eval, window[key]) relies on the candidates for deletion.

Module under audit:
```{{LANGUAGE}}
{{MODULE_CODE}}
```
Imports / package.json dependencies context:
{{DEPENDENCY_CONTEXT}}',
  'Используйте для генеральной уборки в кодовой базе. Агент выявит забытые функции, мертвые файлы и тяжелые npm-пакеты, уменьшив вес финального сайта.',
  'Помогает сократить размер JS бандла и избавиться от устаревших монструозных библиотек в пользу нативного JS.',
  'Отличный промпт перед релизом для прохождения аудита производительности в Google Lighthouse.',
  25,
  true,
  true,
  null,
  'team',
  'Eengineer Staff Lead'
from prompt_categories where slug = 'agent'
on conflict (slug) do update set
  title = excluded.title,
  difficulty = excluded.difficulty,
  tools = excluded.tools,
  prompt_text = excluded.prompt_text,
  when_to_use = excluded.when_to_use,
  why_it_works = excluded.why_it_works,
  pro_tips = excluded.pro_tips,
  sort_order = excluded.sort_order;

insert into prompt_variables (prompt_id, name, description, is_multiline, sort_order)
select id, 'LANGUAGE', 'Язык (TypeScript, JavaScript, Python)', false, 1
from prompts where slug = 'dead-code-pruner'
on conflict (prompt_id, name) do update set
  description = excluded.description,
  is_multiline = excluded.is_multiline,
  sort_order = excluded.sort_order;
insert into prompt_variables (prompt_id, name, description, is_multiline, sort_order)
select id, 'MODULE_CODE', 'Исходный код файла или группы связанных модулей', true, 2
from prompts where slug = 'dead-code-pruner'
on conflict (prompt_id, name) do update set
  description = excluded.description,
  is_multiline = excluded.is_multiline,
  sort_order = excluded.sort_order;
insert into prompt_variables (prompt_id, name, description, is_multiline, sort_order)
select id, 'DEPENDENCY_CONTEXT', 'Список установленных пакетов из package.json', false, 3
from prompts where slug = 'dead-code-pruner'
on conflict (prompt_id, name) do update set
  description = excluded.description,
  is_multiline = excluded.is_multiline,
  sort_order = excluded.sort_order;

-- ----------------------------------------------------------------------------
-- Prompt 26: css-to-tailwind-migrator
-- ----------------------------------------------------------------------------
insert into prompts (
  category_id,
  slug,
  title,
  difficulty,
  tools,
  prompt_text,
  when_to_use,
  why_it_works,
  pro_tips,
  sort_order,
  is_active,
  is_featurable,
  featured_date,
  author_type,
  author_name
)
select
  id,
  'css-to-tailwind-migrator',
  'Перевод стилей CSS/SCSS в классы Tailwind CSS» (The CSS/SCSS to Tailwind Token Migrator)',
  'intermediate',
  '{"Cursor","Claude Code","Windsurf"}'::text[],
  'Convert the following legacy CSS/SCSS styles into modern, idiomatic Tailwind CSS (v3/v4) utility classes applied directly to the JSX markup.

CONVERSION RULES:
1. Design Token Mapping: Map raw pixel/hex values to Tailwind theme tokens (spacing scale, font sizes, project theme colors). Do NOT use arbitrary bracket notation (e.g. w-[23px] or bg-[#123456]) unless no theme token exists.
2. Pseudo-classes & Responsive: Convert media queries to Tailwind prefixes (sm:, md:, lg:) and state modifiers (hover:, focus-visible:, active:, disabled:, dark:).
3. Flexbox & Grid Simplification: Replace verbose CSS layout rules with compact Tailwind layout primitives (flex items-center justify-between gap-4).

JSX Component:
```tsx
{{JSX_MARKUP}}
```
CSS / SCSS Styles:
```css
{{CSS_STYLES}}
```
Tailwind Config / Design Tokens Context:
{{TAILWIND_CONFIG_SNIPPET}}',
  'Используйте, когда у вас есть верстка на чистом CSS/SCSS, и вы хотите переписать её на Tailwind CSS с сохранением адаптивности и дизайн-токенов вашего проекта.',
  'Запрет на `w-[342px]` и принудительное сопоставление с дизайн-токенами сохраняет единый визуальный стиль приложения.',
  'Приложите tailwind.config.js для корректного маппинга кастомных цветов вроде `gold-dark` и `dark-surface`.',
  26,
  true,
  true,
  null,
  'team',
  'Eengineer Staff Lead'
from prompt_categories where slug = 'agent'
on conflict (slug) do update set
  title = excluded.title,
  difficulty = excluded.difficulty,
  tools = excluded.tools,
  prompt_text = excluded.prompt_text,
  when_to_use = excluded.when_to_use,
  why_it_works = excluded.why_it_works,
  pro_tips = excluded.pro_tips,
  sort_order = excluded.sort_order;

insert into prompt_variables (prompt_id, name, description, is_multiline, sort_order)
select id, 'JSX_MARKUP', 'HTML или JSX разметка компонента', false, 1
from prompts where slug = 'css-to-tailwind-migrator'
on conflict (prompt_id, name) do update set
  description = excluded.description,
  is_multiline = excluded.is_multiline,
  sort_order = excluded.sort_order;
insert into prompt_variables (prompt_id, name, description, is_multiline, sort_order)
select id, 'CSS_STYLES', 'Старые CSS / SCSS стили', false, 2
from prompts where slug = 'css-to-tailwind-migrator'
on conflict (prompt_id, name) do update set
  description = excluded.description,
  is_multiline = excluded.is_multiline,
  sort_order = excluded.sort_order;
insert into prompt_variables (prompt_id, name, description, is_multiline, sort_order)
select id, 'TAILWIND_CONFIG_SNIPPET', 'Токены цветов и шрифтов из вашего tailwind.config.js', false, 3
from prompts where slug = 'css-to-tailwind-migrator'
on conflict (prompt_id, name) do update set
  description = excluded.description,
  is_multiline = excluded.is_multiline,
  sort_order = excluded.sort_order;

-- ----------------------------------------------------------------------------
-- Prompt 27: i18n-extractor
-- ----------------------------------------------------------------------------
insert into prompts (
  category_id,
  slug,
  title,
  difficulty,
  tools,
  prompt_text,
  when_to_use,
  why_it_works,
  pro_tips,
  sort_order,
  is_active,
  is_featurable,
  featured_date,
  author_type,
  author_name
)
select
  id,
  'i18n-extractor',
  'Подготовка сайта к переводу на другие языки (i18n)» (The Internationalization (i18n) Extractor)',
  'intermediate',
  '{"Cursor","Claude Code"}'::text[],
  'Extract all hardcoded user-facing strings from the provided component into structured i18n translation keys and JSON message catalogs.

EXTRACTION INVARIANTS:
1. Key Naming: Use hierarchical semantic keys (e.g. feature.section.element_description). Never use the English string itself as the key.
2. Pluralization & Interpolation: Correctly model dynamic numbers and variables using ICU MessageFormat syntax (e.g. "{count, plural, one {# item} other {# items}}").
3. Context Preservation: Add context comments for translators explaining where and how the string is displayed.
4. Component Refactoring: Replace raw strings in JSX with useTranslation / t() calls.

Component Code:
```tsx
{{COMPONENT_CODE}}
```
Target i18n Library: {{I18N_LIBRARY}} (e.g. react-i18next, next-intl, formatjs)',
  'Используйте для извлечения захардкоженного текста из компонентов в JSON-файлы переводов (i18next, next-intl) с поддержкой плюрализации (1 день, 2 дня, 5 дней).',
  'Учитывает правила плюрализации русского и английского языков (1, 2-4, 5+ форм), предотвращая кривые фразы вроде ''1 дней''.',
  'Укажите языки проекта (например, ru, en, uz) для генерации словарей сразу во все нужные файлы.',
  27,
  true,
  true,
  null,
  'team',
  'Eengineer Staff Lead'
from prompt_categories where slug = 'agent'
on conflict (slug) do update set
  title = excluded.title,
  difficulty = excluded.difficulty,
  tools = excluded.tools,
  prompt_text = excluded.prompt_text,
  when_to_use = excluded.when_to_use,
  why_it_works = excluded.why_it_works,
  pro_tips = excluded.pro_tips,
  sort_order = excluded.sort_order;

insert into prompt_variables (prompt_id, name, description, is_multiline, sort_order)
select id, 'COMPONENT_CODE', 'Исходный код компонента с захардкоженным текстом', true, 1
from prompts where slug = 'i18n-extractor'
on conflict (prompt_id, name) do update set
  description = excluded.description,
  is_multiline = excluded.is_multiline,
  sort_order = excluded.sort_order;
insert into prompt_variables (prompt_id, name, description, is_multiline, sort_order)
select id, 'I18N_LIBRARY', 'Библиотека переводов (например: react-i18next, next-intl)', false, 2
from prompts where slug = 'i18n-extractor'
on conflict (prompt_id, name) do update set
  description = excluded.description,
  is_multiline = excluded.is_multiline,
  sort_order = excluded.sort_order;

-- ----------------------------------------------------------------------------
-- Prompt 28: monorepo-package-decoupler
-- ----------------------------------------------------------------------------
insert into prompts (
  category_id,
  slug,
  title,
  difficulty,
  tools,
  prompt_text,
  when_to_use,
  why_it_works,
  pro_tips,
  sort_order,
  is_active,
  is_featurable,
  featured_date,
  author_type,
  author_name
)
select
  id,
  'monorepo-package-decoupler',
  'Разделение монолита на модули без циклов (Monorepo Packages)» (The Monorepo Package Decoupler)',
  'intermediate',
  '{"Cursor","Claude Code","Windsurf"}'::text[],
  'You are a Principal Software Architect specializing in Monorepo architecture (Turborepo, Nx, pnpm workspaces). Extract the functionality below into an isolated, reusable internal package while strictly eliminating circular dependency cycles.

DECOUPLING PROTOCOL:
1. Dependency Graph Audit: Identify all inbound and outbound import edges. Determine clean layer boundaries (UI -> Domain -> Core/Utils).
2. Interface Extraction: Define public API boundary via barrel exports (index.ts) with explicit package.json exports map.
3. Zero Circular Dependencies: Ensure the extracted package never imports from consumer apps. Invert dependencies using dependency injection or callback interfaces.

Code to extract:
```{{LANGUAGE}}
{{EXTRACTION_CODE}}
```
Target Package Name: {{PACKAGE_NAME}} (e.g. @app/shared-auth, @app/ui-core)',
  'Используйте при выносе общего кода в отдельный пакет (shared/ui, shared/utils), чтобы избавиться от циклических зависимостей (circular dependencies).',
  'Предотвращает циклы импортов (Package A -> Package B -> Package A), из-за которых ломается сборка бандлеров Vite и Webpack.',
  'Используйте для построения масштабируемой структуры в Turborepo или Nx.',
  28,
  true,
  true,
  null,
  'team',
  'Eengineer Staff Lead'
from prompt_categories where slug = 'agent'
on conflict (slug) do update set
  title = excluded.title,
  difficulty = excluded.difficulty,
  tools = excluded.tools,
  prompt_text = excluded.prompt_text,
  when_to_use = excluded.when_to_use,
  why_it_works = excluded.why_it_works,
  pro_tips = excluded.pro_tips,
  sort_order = excluded.sort_order;

insert into prompt_variables (prompt_id, name, description, is_multiline, sort_order)
select id, 'LANGUAGE', 'Язык (TypeScript, JavaScript)', false, 1
from prompts where slug = 'monorepo-package-decoupler'
on conflict (prompt_id, name) do update set
  description = excluded.description,
  is_multiline = excluded.is_multiline,
  sort_order = excluded.sort_order;
insert into prompt_variables (prompt_id, name, description, is_multiline, sort_order)
select id, 'EXTRACTION_CODE', 'Код для выноса в отдельный пакет', true, 2
from prompts where slug = 'monorepo-package-decoupler'
on conflict (prompt_id, name) do update set
  description = excluded.description,
  is_multiline = excluded.is_multiline,
  sort_order = excluded.sort_order;
insert into prompt_variables (prompt_id, name, description, is_multiline, sort_order)
select id, 'PACKAGE_NAME', 'Имя нового пакета (например: @app/ui-tokens, @app/api-client)', false, 3
from prompts where slug = 'monorepo-package-decoupler'
on conflict (prompt_id, name) do update set
  description = excluded.description,
  is_multiline = excluded.is_multiline,
  sort_order = excluded.sort_order;

-- ----------------------------------------------------------------------------
-- Prompt 29: bulletproof-pr-description
-- ----------------------------------------------------------------------------
insert into prompts (
  category_id,
  slug,
  title,
  difficulty,
  tools,
  prompt_text,
  when_to_use,
  why_it_works,
  pro_tips,
  sort_order,
  is_active,
  is_featurable,
  featured_date,
  author_type,
  author_name
)
select
  id,
  'bulletproof-pr-description',
  'Идеальное описание Pull Request с выделением рисков» (The Bulletproof PR Description)',
  'intermediate',
  '{"ChatGPT","Claude","Cursor"}'::text[],
  'Generate a pull request description that makes the reviewer''s job effortless, transparent, and fast.

GIT DIFF / SUMMARY OF CHANGES:
```diff
{{GIT_DIFF}}
```
TASK CONTEXT / TICKET:
```
{{TICKET_DESCRIPTION}}
```

FORMAT CONTRACT:
## 📌 Summary of Change
[1-2 clear sentences explaining the core functional change.]

## 🎯 Motivation & Context
[Why was this change necessary? What bug was happening or what business capability was missing?]

## 🛠️ Technical Decisions & Trade-offs
[Bullet list of key architectural decisions made during implementation. For each: why Option A was chosen over Option B.]

## ⚠️ Areas of Uncertainty / Specific Review Requests
[Crucial: Identify 1-2 specific lines or logic branches where you want the reviewer''s extra scrutiny. E.g. "Please check the lock acquisition timeout in line 45". If completely confident, state why.]

## 🧪 Verification & Testing Performed
- [ ] Unit tests added/updated: [list test file names]
- [ ] Manual test scenario executed: [exact steps to verify]
- [ ] Edge cases verified: [e.g. empty input, timeout handling]

## 🔄 Migration / Deployment Notes
[Are there DB migrations, new env variables, or feature flags required before merging?]',
  'Используйте перед отправкой кода на ревью коллегам. Промпт создаст четкое описание изменений, укажет спорные места и сэкономит часы обсуждений в комментариях.',
  'Секция ''Areas of Uncertainty'' явно направляет внимание ревьюера на тонкие места, исключая слепое подтверждение PR.',
  'Выполните `git diff --stat` и вставьте вывод в поле диффа.',
  29,
  true,
  true,
  null,
  'team',
  'Eengineer Staff Lead'
from prompt_categories where slug = 'cowork'
on conflict (slug) do update set
  title = excluded.title,
  difficulty = excluded.difficulty,
  tools = excluded.tools,
  prompt_text = excluded.prompt_text,
  when_to_use = excluded.when_to_use,
  why_it_works = excluded.why_it_works,
  pro_tips = excluded.pro_tips,
  sort_order = excluded.sort_order;

insert into prompt_variables (prompt_id, name, description, is_multiline, sort_order)
select id, 'GIT_DIFF', 'Git diff или краткий список измененных файлов', true, 1
from prompts where slug = 'bulletproof-pr-description'
on conflict (prompt_id, name) do update set
  description = excluded.description,
  is_multiline = excluded.is_multiline,
  sort_order = excluded.sort_order;
insert into prompt_variables (prompt_id, name, description, is_multiline, sort_order)
select id, 'TICKET_DESCRIPTION', 'Описание задачи из Jira/Linear или суть фичи', false, 2
from prompts where slug = 'bulletproof-pr-description'
on conflict (prompt_id, name) do update set
  description = excluded.description,
  is_multiline = excluded.is_multiline,
  sort_order = excluded.sort_order;

-- ----------------------------------------------------------------------------
-- Prompt 30: rfc-tech-spec-builder
-- ----------------------------------------------------------------------------
insert into prompts (
  category_id,
  slug,
  title,
  difficulty,
  tools,
  prompt_text,
  when_to_use,
  why_it_works,
  pro_tips,
  sort_order,
  is_active,
  is_featurable,
  featured_date,
  author_type,
  author_name
)
select
  id,
  'rfc-tech-spec-builder',
  'Техническая спецификация фичи с таблицей решений (RFC / ADR)» (The Tech Spec with Decision Log (RFC))',
  'intermediate',
  '{"Claude 3.7 Sonnet","GPT-4o","Gemini 2.5 Pro"}'::text[],
  'Write a comprehensive Request for Comments (RFC) / Technical Design Document for the engineering team.

PROJECT CONTEXT:
- Feature: {{FEATURE_TITLE}}
- Core Problem: {{PROBLEM_STATEMENT}}
- Target Constraints: {{CONSTRAINTS}} (e.g. must scale to 1M users, < 100ms p95, zero schema downtime)

RFC STRUCTURE:
1. Executive Summary: Problem, proposed solution, and measurable business impact in < 150 words.
2. Non-Goals: Explicitly list 3-4 related capabilities that are DELIBERATELY out of scope for v1 to prevent scope creep.
3. System Architecture & Data Flow:
   - Sequence of events (ASCII / Mermaid diagram notation).
   - Database schema changes (DDL draft).
   - API contract draft (OpenAPI/TypeScript interfaces).
4. Decision Log Table:
   | Decision Point | Alternatives Considered | Selected Option | Rationale & Trade-off |
   | -------------- | ----------------------- | --------------- | --------------------- |
5. Failure Modes & Mitigations: Table of what happens when dependencies fail, timeouts occur, or invalid states arise.
6. Phased Rollout & Rollback Plan: How will this be deployed (Feature flags, dark launch) and how to rollback in < 2 minutes without data loss.',
  'Используйте перед написанием большой фичи, чтобы согласовать архитектуру с командой. Промпт составит техспек с диаграммами, схемой БД и таблицей ''почему мы выбрали вариант А, а не Б''.',
  'Таблица ''Decision Log'' и раздел ''Non-Goals'' экономят дни споров, фиксируя решения до написания кода.',
  'Используйте для согласования архитектуры с тимлидом и техдиректором.',
  30,
  true,
  true,
  null,
  'team',
  'Eengineer Staff Lead'
from prompt_categories where slug = 'cowork'
on conflict (slug) do update set
  title = excluded.title,
  difficulty = excluded.difficulty,
  tools = excluded.tools,
  prompt_text = excluded.prompt_text,
  when_to_use = excluded.when_to_use,
  why_it_works = excluded.why_it_works,
  pro_tips = excluded.pro_tips,
  sort_order = excluded.sort_order;

insert into prompt_variables (prompt_id, name, description, is_multiline, sort_order)
select id, 'FEATURE_TITLE', 'Название фичи (например: Двухфакторная аутентификация 2FA)', false, 1
from prompts where slug = 'rfc-tech-spec-builder'
on conflict (prompt_id, name) do update set
  description = excluded.description,
  is_multiline = excluded.is_multiline,
  sort_order = excluded.sort_order;
insert into prompt_variables (prompt_id, name, description, is_multiline, sort_order)
select id, 'PROBLEM_STATEMENT', 'Какую проблему решаем', false, 2
from prompts where slug = 'rfc-tech-spec-builder'
on conflict (prompt_id, name) do update set
  description = excluded.description,
  is_multiline = excluded.is_multiline,
  sort_order = excluded.sort_order;
insert into prompt_variables (prompt_id, name, description, is_multiline, sort_order)
select id, 'CONSTRAINTS', 'Ограничения (скорость ответа, бюджет, обратная совместимость)', false, 3
from prompts where slug = 'rfc-tech-spec-builder'
on conflict (prompt_id, name) do update set
  description = excluded.description,
  is_multiline = excluded.is_multiline,
  sort_order = excluded.sort_order;

-- ----------------------------------------------------------------------------
-- Prompt 31: blameless-post-mortem
-- ----------------------------------------------------------------------------
insert into prompts (
  category_id,
  slug,
  title,
  difficulty,
  tools,
  prompt_text,
  when_to_use,
  why_it_works,
  pro_tips,
  sort_order,
  is_active,
  is_featurable,
  featured_date,
  author_type,
  author_name
)
select
  id,
  'blameless-post-mortem',
  'Постмортем аварии без поиска виноватых (Blameless Post-Mortem)» (The Blameless Post-Mortem Engineer)',
  'intermediate',
  '{"Claude 3.7 Sonnet","GPT-4o"}'::text[],
  'Generate a blameless, engineering-rigorous Incident Post-Mortem based on the raw timeline and logs provided.

RAW INCIDENT NOTES & LOGS:
```
{{INCIDENT_RAW_NOTES}}
```

BLAMELESS POST-MORTEM RULES:
- Never assign fault to individuals ("the developer ran the command"). Frame failures as systemic gaps in automation, validation, observability, or guardrails.
- Apply the "5 Whys" methodology to reach systemic root causes, not superficial human errors.

DOCUMENT STRUCTURE:
1. Incident Overview: Severity, Duration (Start, Detection, Mitigation), User Impact (% of failed requests, data impact).
2. Detailed Timeline (UTC): Bulleted chronological log from trigger event to full recovery.
3. Root Cause Analysis (5 Whys Chain):
   - Why 1 (Direct trigger) -> Why 2 -> Why 3 -> Why 4 -> Why 5 (Systemic vulnerability).
4. What Went Well vs Where We Got Lucky vs What Went Wrong.
5. Action Items Matrix:
   | Action Item | Type (Prevent / Detect / Mitigate) | Owner Role | Priority (P0-P2) | Verification Metric |',
  'Используйте после падения продакшена. Промпт превратит сырые логи и сообщения из чата аварии в профессиональный отчет по методу ''5 Почему'' уровня Google SRE.',
  'Трансформирует стрессовые логи аварии в конструктивный документ, направленный на исправление автоматизации, а не обвинение людей.',
  'Вставьте таймстемпы начала сбоя, первого алерта в мониторинге и момента выкатки хотфикса.',
  31,
  true,
  true,
  null,
  'team',
  'Eengineer Staff Lead'
from prompt_categories where slug = 'cowork'
on conflict (slug) do update set
  title = excluded.title,
  difficulty = excluded.difficulty,
  tools = excluded.tools,
  prompt_text = excluded.prompt_text,
  when_to_use = excluded.when_to_use,
  why_it_works = excluded.why_it_works,
  pro_tips = excluded.pro_tips,
  sort_order = excluded.sort_order;

insert into prompt_variables (prompt_id, name, description, is_multiline, sort_order)
select id, 'INCIDENT_RAW_NOTES', 'Сырые логи, время падения, сообщения из чата дежурных', true, 1
from prompts where slug = 'blameless-post-mortem'
on conflict (prompt_id, name) do update set
  description = excluded.description,
  is_multiline = excluded.is_multiline,
  sort_order = excluded.sort_order;

-- ----------------------------------------------------------------------------
-- Prompt 32: prd-to-technical-tasks
-- ----------------------------------------------------------------------------
insert into prompts (
  category_id,
  slug,
  title,
  difficulty,
  tools,
  prompt_text,
  when_to_use,
  why_it_works,
  pro_tips,
  sort_order,
  is_active,
  is_featurable,
  featured_date,
  author_type,
  author_name
)
select
  id,
  'prd-to-technical-tasks',
  'Декомпозиция бизнес-требований на задачи для спринта» (The PRD to Technical Subtasks Splitter)',
  'intermediate',
  '{"Claude 3.7 Sonnet","GPT-4o"}'::text[],
  'Decompose the product requirement document (PRD) below into an actionable, dependency-ordered engineering task breakdown for an Agile sprint.

REQUIREMENTS FOR BREAKDOWN:
1. Architectural Layering: Separate tasks into Database/Schema -> Backend Services/API -> Frontend/UI -> Analytics/Tracking.
2. Vertical Slicing: Ensure each task slice is testable and delivers verifiable incremental value.
3. Dependency Ordering: Explicitly specify which tasks block others (e.g. Task 3 blocked by Task 1).
4. Definition of Done (DoD): Every task must include concrete acceptance criteria.

PRD SPECIFICATION:
```
{{PRD_CONTENT}}
```
Target Team Velocity / Sprint Length: {{SPRINT_CONTEXT}}

DELIVERABLE:
- Dependency Graph (ASCII / Mermaid).
- Numbered Task Cards (Title, Layer, Description, DoD, Risk/Complexity Score [1-5]).',
  'Используйте, когда продакт-менеджер дал описание фичи (PRD), а вам нужно разбить её на понятные технические таски для Jira/Linear с оценкой времени и связями.',
  'Исключает ситуацию, когда фронтендер ждет бэкендера 2 недели: задачи выстраиваются в вертикальные независимые слайсы.',
  'Отлично подходит для оценки трудозатрат перед началом спринта.',
  32,
  true,
  true,
  null,
  'team',
  'Eengineer Staff Lead'
from prompt_categories where slug = 'cowork'
on conflict (slug) do update set
  title = excluded.title,
  difficulty = excluded.difficulty,
  tools = excluded.tools,
  prompt_text = excluded.prompt_text,
  when_to_use = excluded.when_to_use,
  why_it_works = excluded.why_it_works,
  pro_tips = excluded.pro_tips,
  sort_order = excluded.sort_order;

insert into prompt_variables (prompt_id, name, description, is_multiline, sort_order)
select id, 'PRD_CONTENT', 'Описание требований от продакта или клиента', true, 1
from prompts where slug = 'prd-to-technical-tasks'
on conflict (prompt_id, name) do update set
  description = excluded.description,
  is_multiline = excluded.is_multiline,
  sort_order = excluded.sort_order;
insert into prompt_variables (prompt_id, name, description, is_multiline, sort_order)
select id, 'SPRINT_CONTEXT', 'Длительность спринта (например: спринт 2 недели, 2 разработчика)', false, 2
from prompts where slug = 'prd-to-technical-tasks'
on conflict (prompt_id, name) do update set
  description = excluded.description,
  is_multiline = excluded.is_multiline,
  sort_order = excluded.sort_order;

-- ----------------------------------------------------------------------------
-- Prompt 33: readme-onboarding-architect
-- ----------------------------------------------------------------------------
insert into prompts (
  category_id,
  slug,
  title,
  difficulty,
  tools,
  prompt_text,
  when_to_use,
  why_it_works,
  pro_tips,
  sort_order,
  is_active,
  is_featurable,
  featured_date,
  author_type,
  author_name
)
select
  id,
  'readme-onboarding-architect',
  'Понятный README и инструкция для быстрого онбординга» (The Technical Onboarding & README Architect)',
  'intermediate',
  '{"ChatGPT","Claude"}'::text[],
  'Generate a gold-standard README.md and Day-1 Developer Setup Runbook for the repository described below.

REQUIREMENTS:
1. Fast-Path Local Setup: Step-by-step commands to clone, install dependencies, configure environment variables (.env.example), run migrations, and launch local server in < 5 minutes.
2. Architecture At A Glance: 3-sentence summary of tech stack, folder structure diagram, and core data flow.
3. Common Pitfalls & FAQs: Troubleshooting for OS-specific quirks (macOS M-series vs Windows/WSL2), Docker port conflicts, and seed data scripts.

REPOSITORY CONTEXT:
- Tech Stack: {{TECH_STACK}}
- Key Commands: {{COMMANDS}} (build, dev, test, lint)
- Services & Dependencies: {{SERVICES}} (Postgres, Redis, external APIs)',
  'Используйте для создания файла README.md в проекте, чтобы новый разработчик или вы сами через полгода могли поднять проект за 5 минут без боли.',
  'Фокусируется на ''First Time to Hello World'' метрике, убирая лишнюю воду и оставляя точные команды терминала.',
  'Положите результат в корень проекта как README.md.',
  33,
  true,
  true,
  null,
  'team',
  'Eengineer Staff Lead'
from prompt_categories where slug = 'cowork'
on conflict (slug) do update set
  title = excluded.title,
  difficulty = excluded.difficulty,
  tools = excluded.tools,
  prompt_text = excluded.prompt_text,
  when_to_use = excluded.when_to_use,
  why_it_works = excluded.why_it_works,
  pro_tips = excluded.pro_tips,
  sort_order = excluded.sort_order;

insert into prompt_variables (prompt_id, name, description, is_multiline, sort_order)
select id, 'TECH_STACK', 'Стек (React 19, Vite, Tailwind, Supabase, Node 22)', false, 1
from prompts where slug = 'readme-onboarding-architect'
on conflict (prompt_id, name) do update set
  description = excluded.description,
  is_multiline = excluded.is_multiline,
  sort_order = excluded.sort_order;
insert into prompt_variables (prompt_id, name, description, is_multiline, sort_order)
select id, 'COMMANDS', 'Команды запуска (npm run dev, npm run test)', false, 2
from prompts where slug = 'readme-onboarding-architect'
on conflict (prompt_id, name) do update set
  description = excluded.description,
  is_multiline = excluded.is_multiline,
  sort_order = excluded.sort_order;
insert into prompt_variables (prompt_id, name, description, is_multiline, sort_order)
select id, 'SERVICES', 'Необходимые сервисы (Docker, Supabase локально, Redis)', false, 3
from prompts where slug = 'readme-onboarding-architect'
on conflict (prompt_id, name) do update set
  description = excluded.description,
  is_multiline = excluded.is_multiline,
  sort_order = excluded.sort_order;

-- ----------------------------------------------------------------------------
-- Prompt 34: stakeholder-status-translator
-- ----------------------------------------------------------------------------
insert into prompts (
  category_id,
  slug,
  title,
  difficulty,
  tools,
  prompt_text,
  when_to_use,
  why_it_works,
  pro_tips,
  sort_order,
  is_active,
  is_featurable,
  featured_date,
  author_type,
  author_name
)
select
  id,
  'stakeholder-status-translator',
  'Перевод сложного тех-статуса на понятный язык бизнеса» (The Engineering-to-Stakeholder Translator)',
  'intermediate',
  '{"ChatGPT","Claude"}'::text[],
  'Translate the complex engineering update below into a crisp, high-impact executive summary for non-technical stakeholders (CEO, Product Director, Investors).

TRANSLATION RULES:
1. Zero Technical Jargon: Replace terms like ''database connection pooling'' or ''Docker multi-stage build'' with business impact (reliability, speed, cost savings, user retention).
2. Traffic Light Status: Use 🟢 On Track, 🟡 At Risk, 🔴 Blocked with clear root causes and next steps.
3. Quantified Impact: Highlight metrics (e.g. ''reduced checkout latency by 40%'', ''unblocked payment gateway rollout'').

RAW TECHNICAL NOTES:
```
{{TECHNICAL_NOTES}}
```
Target Audience: {{STAKEHOLDER_AUDIENCE}}',
  'Используйте для отправки статуса проекта руководству, инвесторам или клиентам. Промпт превратит технический жаргон (рефакторинг, миграции, кэш) в понятную бизнес-ценность.',
  'Помогает разработчикам защищать ценность технической работы (рефакторинг, тесты) перед бизнесом без конфликтов.',
  'Идеально подходит для еженедельных пятничных апдейтов в Slack.',
  34,
  true,
  true,
  null,
  'team',
  'Eengineer Staff Lead'
from prompt_categories where slug = 'cowork'
on conflict (slug) do update set
  title = excluded.title,
  difficulty = excluded.difficulty,
  tools = excluded.tools,
  prompt_text = excluded.prompt_text,
  when_to_use = excluded.when_to_use,
  why_it_works = excluded.why_it_works,
  pro_tips = excluded.pro_tips,
  sort_order = excluded.sort_order;

insert into prompt_variables (prompt_id, name, description, is_multiline, sort_order)
select id, 'TECHNICAL_NOTES', 'Что сделано разработчиками за неделю (на техническом языке)', true, 1
from prompts where slug = 'stakeholder-status-translator'
on conflict (prompt_id, name) do update set
  description = excluded.description,
  is_multiline = excluded.is_multiline,
  sort_order = excluded.sort_order;
insert into prompt_variables (prompt_id, name, description, is_multiline, sort_order)
select id, 'STAKEHOLDER_AUDIENCE', 'Для кого отчет (например: Генеральный директор, Инвестор, Заказчик)', false, 2
from prompts where slug = 'stakeholder-status-translator'
on conflict (prompt_id, name) do update set
  description = excluded.description,
  is_multiline = excluded.is_multiline,
  sort_order = excluded.sort_order;

-- ----------------------------------------------------------------------------
-- Prompt 35: constructive-code-review-rewriter
-- ----------------------------------------------------------------------------
insert into prompts (
  category_id,
  slug,
  title,
  difficulty,
  tools,
  prompt_text,
  when_to_use,
  why_it_works,
  pro_tips,
  sort_order,
  is_active,
  is_featurable,
  featured_date,
  author_type,
  author_name
)
select
  id,
  'constructive-code-review-rewriter',
  'Тактичный и конструктивный пересказ замечаний на Code Review» (The Constructive Code Review Feedback Rewriter)',
  'intermediate',
  '{"ChatGPT","Claude"}'::text[],
  'Rewrite the following raw, frustrated, or blunt code review comments into highly constructive, empathetic, and technically rigorous feedback following Google''s Engineering Practices.

REWRITING PRINCIPLES:
1. Explain the ''Why'': Never just say ''change this''. Explain the architectural trade-off, performance hazard, or maintenance cost.
2. Offer Concrete Alternatives: Always provide a small code snippet demonstrating the cleaner pattern.
3. Distinguish Critical vs Nitpick: Explicitly tag suggestions with [Blocking - Bug/Security] vs [Non-blocking - Nit/Suggestion].
4. Praise Good Decisions: Acknowledge clean patterns where evident.

RAW COMMENTS & CODE CONTEXT:
```
{{RAW_COMMENTS}}
```',
  'Используйте, когда на код-ревью хочется написать ''это ужасно переделай'', но нужно дать профессиональный, дружелюбный и аргументированный фидбек коллеге.',
  'Сохраняет здоровую командную культуру, переводя раздражение в обучающий фидбек с примерами кода.',
  'Используйте префиксы `[Blocking]` и `[Nit]` для четких приоритетов.',
  35,
  true,
  true,
  null,
  'team',
  'Eengineer Staff Lead'
from prompt_categories where slug = 'cowork'
on conflict (slug) do update set
  title = excluded.title,
  difficulty = excluded.difficulty,
  tools = excluded.tools,
  prompt_text = excluded.prompt_text,
  when_to_use = excluded.when_to_use,
  why_it_works = excluded.why_it_works,
  pro_tips = excluded.pro_tips,
  sort_order = excluded.sort_order;

insert into prompt_variables (prompt_id, name, description, is_multiline, sort_order)
select id, 'RAW_COMMENTS', 'Ваши черновые мысли или кусок кода с замечаниями', false, 1
from prompts where slug = 'constructive-code-review-rewriter'
on conflict (prompt_id, name) do update set
  description = excluded.description,
  is_multiline = excluded.is_multiline,
  sort_order = excluded.sort_order;

-- ----------------------------------------------------------------------------
-- Prompt 36: incident-runbook-generator
-- ----------------------------------------------------------------------------
insert into prompts (
  category_id,
  slug,
  title,
  difficulty,
  tools,
  prompt_text,
  when_to_use,
  why_it_works,
  pro_tips,
  sort_order,
  is_active,
  is_featurable,
  featured_date,
  author_type,
  author_name
)
select
  id,
  'incident-runbook-generator',
  'Инструкция дежурного при сбое (Incident Runbook / SOP)» (The Incident Response Runbook / SOP Generator)',
  'intermediate',
  '{"Claude 3.7 Sonnet","GPT-4o"}'::text[],
  'Generate a production Incident Response Runbook (Standard Operating Procedure) for on-call engineers facing the alert scenario below.

RUNBOOK REQUIREMENTS:
1. Triage in < 2 Minutes: Step-by-step terminal commands to determine severity, blast radius, and affected user count.
2. Immediate Mitigation: Safe stop-gap actions (traffic shed, rollback, feature flag disable, replica promotion) before finding the deep root cause.
3. Diagnostic Commands: Specific CLI queries (grep, kubectl, sql, curl) to isolate the failing component.
4. Escalation Path: Clear criteria for when to escalate to Principal Engineers or VP of Engineering.

ALERT / SCENARIO:
- Alert Name: {{ALERT_NAME}} (e.g. PostgresConnectionPoolExhausted, High5xxRateOnCheckout)
- Infrastructure: {{INFRASTRUCTURE_CONTEXT}}',
  'Используйте для создания пошаговой шпаргалки для дежурных инженеров: что делать в 3 часа ночи, если упала база, забилась память или отвалился платежный шлюз.',
  'В стрессовой ситуации дежурный инженер не должен думать — он должен следовать проверенному чек-листу команд.',
  'Сохраняйте такие runbook-инструкции рядом с мониторингом в Grafana / Datadog.',
  36,
  true,
  true,
  null,
  'team',
  'Eengineer Staff Lead'
from prompt_categories where slug = 'cowork'
on conflict (slug) do update set
  title = excluded.title,
  difficulty = excluded.difficulty,
  tools = excluded.tools,
  prompt_text = excluded.prompt_text,
  when_to_use = excluded.when_to_use,
  why_it_works = excluded.why_it_works,
  pro_tips = excluded.pro_tips,
  sort_order = excluded.sort_order;

insert into prompt_variables (prompt_id, name, description, is_multiline, sort_order)
select id, 'ALERT_NAME', 'Название алерта (например: HighApiLatencyAlert, DBDeadlockSpike)', false, 1
from prompts where slug = 'incident-runbook-generator'
on conflict (prompt_id, name) do update set
  description = excluded.description,
  is_multiline = excluded.is_multiline,
  sort_order = excluded.sort_order;
insert into prompt_variables (prompt_id, name, description, is_multiline, sort_order)
select id, 'INFRASTRUCTURE_CONTEXT', 'Стек (AWS ECS, Supabase, Kubernetes, Vercel)', false, 2
from prompts where slug = 'incident-runbook-generator'
on conflict (prompt_id, name) do update set
  description = excluded.description,
  is_multiline = excluded.is_multiline,
  sort_order = excluded.sort_order;

-- ----------------------------------------------------------------------------
-- Prompt 37: sprint-retro-extractor
-- ----------------------------------------------------------------------------
insert into prompts (
  category_id,
  slug,
  title,
  difficulty,
  tools,
  prompt_text,
  when_to_use,
  why_it_works,
  pro_tips,
  sort_order,
  is_active,
  is_featurable,
  featured_date,
  author_type,
  author_name
)
select
  id,
  'sprint-retro-extractor',
  'Извлечение системных выводов из ретроспективы спринта» (The Sprint Retrospective Action Item Extractor)',
  'intermediate',
  '{"ChatGPT","Claude"}'::text[],
  'Analyze the raw feedback from our team sprint retrospective and extract 3-4 systemic, high-leverage Action Items with clear owners and success metrics.

ANALYSIS RULES:
1. Systemic Focus: Distinguish one-off bad luck from recurring friction in tooling, CI/CD, review bottlenecks, or unclear specifications.
2. Actionable & Measurable: Action items must not be vague (e.g. ''write better code''). They must be concrete (e.g. ''Add pre-commit hook with Oxlint to catch type errors before PR'').

RAW RETRO FEEDBACK:
```
{{RETRO_FEEDBACK}}
```',
  'Используйте после созвона ретроспективы команды. Промпт соберет жалобы разработчиков (''долго тестируем'', ''падал CI'') и превратит их в конкретные инженерные задачи.',
  'Превращает бесконечные жалобы на созвонах в 3 конкретные инженерные задачи с измеримым результатом.',
  'Ограничьтесь максимум 3 действиями на спринт, чтобы команда реально успела их внедрить.',
  37,
  true,
  true,
  null,
  'team',
  'Eengineer Staff Lead'
from prompt_categories where slug = 'cowork'
on conflict (slug) do update set
  title = excluded.title,
  difficulty = excluded.difficulty,
  tools = excluded.tools,
  prompt_text = excluded.prompt_text,
  when_to_use = excluded.when_to_use,
  why_it_works = excluded.why_it_works,
  pro_tips = excluded.pro_tips,
  sort_order = excluded.sort_order;

insert into prompt_variables (prompt_id, name, description, is_multiline, sort_order)
select id, 'RETRO_FEEDBACK', 'Заметки с ретро: что было хорошо, что плохо, что бесило', false, 1
from prompts where slug = 'sprint-retro-extractor'
on conflict (prompt_id, name) do update set
  description = excluded.description,
  is_multiline = excluded.is_multiline,
  sort_order = excluded.sort_order;

-- ----------------------------------------------------------------------------
-- Prompt 38: changelog-release-writer
-- ----------------------------------------------------------------------------
insert into prompts (
  category_id,
  slug,
  title,
  difficulty,
  tools,
  prompt_text,
  when_to_use,
  why_it_works,
  pro_tips,
  sort_order,
  is_active,
  is_featurable,
  featured_date,
  author_type,
  author_name
)
select
  id,
  'changelog-release-writer',
  'Генератор списка изменений релиза (Changelog & Breaking Changes)» (The API Documentation & Changelog Writer)',
  'intermediate',
  '{"ChatGPT","Claude"}'::text[],
  'Generate an industry-standard CHANGELOG.md release entry (Keep a Changelog format) and developer migration guide based on the commit history and PR notes below.

STRUCTURE:
- 🚀 Added: New user-facing capabilities or APIs.
- 🔄 Changed: Modifications in existing behavior.
- ⚠️ BREAKING CHANGES: Explicit before/after code diffs showing developers how to migrate their code.
- 🐛 Fixed: Bugs resolved with ticket references.
- 🛡️ Security: Vulnerabilities patched.

GIT LOGS / RELEASE NOTES:
```
{{RELEASE_NOTES}}
```
Version Number: {{VERSION}} (e.g. v2.4.0)',
  'Используйте перед релизом новой версии для составления красивого списка изменений (Changelog) с понятными предупреждениями о несовместимости (Breaking Changes).',
  'Формат ''Keep a Changelog'' с наглядными примерами ''было / стало'' снижает число обращений в техподдержку при обновлениях.',
  'Используйте для релизов в GitHub Releases или в документации для клиентов.',
  38,
  true,
  true,
  null,
  'team',
  'Eengineer Staff Lead'
from prompt_categories where slug = 'cowork'
on conflict (slug) do update set
  title = excluded.title,
  difficulty = excluded.difficulty,
  tools = excluded.tools,
  prompt_text = excluded.prompt_text,
  when_to_use = excluded.when_to_use,
  why_it_works = excluded.why_it_works,
  pro_tips = excluded.pro_tips,
  sort_order = excluded.sort_order;

insert into prompt_variables (prompt_id, name, description, is_multiline, sort_order)
select id, 'RELEASE_NOTES', 'Список коммитов (`git log v1..v2 --oneline`) или список закрытых PR', true, 1
from prompts where slug = 'changelog-release-writer'
on conflict (prompt_id, name) do update set
  description = excluded.description,
  is_multiline = excluded.is_multiline,
  sort_order = excluded.sort_order;
insert into prompt_variables (prompt_id, name, description, is_multiline, sort_order)
select id, 'VERSION', 'Номер версии (например: v1.3.0)', false, 2
from prompts where slug = 'changelog-release-writer'
on conflict (prompt_id, name) do update set
  description = excluded.description,
  is_multiline = excluded.is_multiline,
  sort_order = excluded.sort_order;

-- ----------------------------------------------------------------------------
-- Prompt 39: stack-trace-interrogator
-- ----------------------------------------------------------------------------
insert into prompts (
  category_id,
  slug,
  title,
  difficulty,
  tools,
  prompt_text,
  when_to_use,
  why_it_works,
  pro_tips,
  sort_order,
  is_active,
  is_featurable,
  featured_date,
  author_type,
  author_name
)
select
  id,
  'stack-trace-interrogator',
  'Глубокий анализ стектрейса и поиск места зарождения ошибки» (The Stack Trace Deep Interrogator)',
  'intermediate',
  '{"ChatGPT","Claude","Cursor"}'::text[],
  'Analyze and resolve this error. Do not simply provide a patch — conduct a structured forensic analysis.

ERROR STACK TRACE / TERMINAL OUTPUT:
```
{{ERROR_TEXT}}
```

RELEVANT CODE SNIPPET:
```{{LANGUAGE}}
{{CODE_SNIPPET}}
```

FORENSIC EXECUTION STEPS:
1. Frame Dissection: Read the stack trace from the root cause frame upward. Distinguish between where the error was detected (e.g. inside a library) vs where the invalid state was injected in user code.
2. Root Cause Classification: Classify into Type/Null Reference, Async Order, Memory Exhaustion, Protocol Mismatch, or Environment Incompatibility.
3. Minimum Reproducible State: What exact object state or execution sequence caused this invariant to fail?
4. Surgical Fix: Provide the exact minimal code fix.
5. Defensive Pattern: Show how to refactor this code or type definition so that this entire class of bug is caught at compile-time rather than runtime.',
  'Используйте при падении программы с длинным стектрейсом. Промпт найдет место, где ошибка реально зародилась в вашем коде, а не где она упала внутри внешней библиотеки.',
  'Большинство смотрят только на последнюю строчку стектрейса. Промпт разделяет место обнаружения и место зарождения невалидного состояния.',
  'Копируйте стектрейс полностью, не обрезая системные строки.',
  39,
  true,
  true,
  null,
  'team',
  'Eengineer Staff Lead'
from prompt_categories where slug = 'error-clinic'
on conflict (slug) do update set
  title = excluded.title,
  difficulty = excluded.difficulty,
  tools = excluded.tools,
  prompt_text = excluded.prompt_text,
  when_to_use = excluded.when_to_use,
  why_it_works = excluded.why_it_works,
  pro_tips = excluded.pro_tips,
  sort_order = excluded.sort_order;

insert into prompt_variables (prompt_id, name, description, is_multiline, sort_order)
select id, 'ERROR_TEXT', 'Полный текст ошибки и стектрейс из консоли/терминала', false, 1
from prompts where slug = 'stack-trace-interrogator'
on conflict (prompt_id, name) do update set
  description = excluded.description,
  is_multiline = excluded.is_multiline,
  sort_order = excluded.sort_order;
insert into prompt_variables (prompt_id, name, description, is_multiline, sort_order)
select id, 'LANGUAGE', 'Язык (TypeScript, Python, Go)', false, 2
from prompts where slug = 'stack-trace-interrogator'
on conflict (prompt_id, name) do update set
  description = excluded.description,
  is_multiline = excluded.is_multiline,
  sort_order = excluded.sort_order;
insert into prompt_variables (prompt_id, name, description, is_multiline, sort_order)
select id, 'CODE_SNIPPET', 'Код функции или файла, где произошел сбой', true, 3
from prompts where slug = 'stack-trace-interrogator'
on conflict (prompt_id, name) do update set
  description = excluded.description,
  is_multiline = excluded.is_multiline,
  sort_order = excluded.sort_order;

-- ----------------------------------------------------------------------------
-- Prompt 40: typescript-error-untangler
-- ----------------------------------------------------------------------------
insert into prompts (
  category_id,
  slug,
  title,
  difficulty,
  tools,
  prompt_text,
  when_to_use,
  why_it_works,
  pro_tips,
  sort_order,
  is_active,
  is_featurable,
  featured_date,
  author_type,
  author_name
)
select
  id,
  'typescript-error-untangler',
  'Распутывание сложных ошибок типов TypeScript» (The TypeScript Type Mismatch Untangler)',
  'intermediate',
  '{"Claude 3.7 Sonnet","GPT-4o","Cursor"}'::text[],
  'I have a TypeScript compilation error. Untangle the type system mismatch and explain the root structural issue.

TYPESCRIPT ERROR (tsc / IDE output):
```
{{TS_ERROR}}
```

RELEVANT TYPES AND CODE:
```typescript
{{TS_CODE}}
```

DIAGNOSIS INSTRUCTIONS:
1. Type Divergence Matrix:
   - What type TypeScript expected: [Exact Type Representation]
   - What type was actually provided: [Exact Type Representation]
   - The exact property or structural variance where they diverge.
2. The "Why": Why did TypeScript reject this? (Explain covariance/contravariance, excess property checks, union narrowing loss, or missing index signatures).
3. The Proper Fix:
   - ❌ DO NOT suggest as any, @ts-ignore, or loose non-null assertions (!).
   - ✅ Provide a clean fix using idiomatic TypeScript (Type Guards, Discriminated Unions, satisfies, keyof, or Generics).',
  'Используйте, когда компилятор TypeScript ругается на несовпадение типов (TS2322, TS2345). Промпт объяснит несоответствие и исправит тип без костыльного `as any`.',
  'Запрет на `any` и `@ts-ignore` заставляет модель найти настоящее решение в рамках системы типов TypeScript.',
  'Вставьте все связанные `interface` и `type`, чтобы модель видела полную картину.',
  40,
  true,
  true,
  null,
  'team',
  'Eengineer Staff Lead'
from prompt_categories where slug = 'error-clinic'
on conflict (slug) do update set
  title = excluded.title,
  difficulty = excluded.difficulty,
  tools = excluded.tools,
  prompt_text = excluded.prompt_text,
  when_to_use = excluded.when_to_use,
  why_it_works = excluded.why_it_works,
  pro_tips = excluded.pro_tips,
  sort_order = excluded.sort_order;

insert into prompt_variables (prompt_id, name, description, is_multiline, sort_order)
select id, 'TS_ERROR', 'Текст ошибки из терминала или VS Code (например: Type ''X'' is not assignable to type ''Y'')', false, 1
from prompts where slug = 'typescript-error-untangler'
on conflict (prompt_id, name) do update set
  description = excluded.description,
  is_multiline = excluded.is_multiline,
  sort_order = excluded.sort_order;
insert into prompt_variables (prompt_id, name, description, is_multiline, sort_order)
select id, 'TS_CODE', 'Интерфейсы, типы и код функции, вызывающей ошибку', true, 2
from prompts where slug = 'typescript-error-untangler'
on conflict (prompt_id, name) do update set
  description = excluded.description,
  is_multiline = excluded.is_multiline,
  sort_order = excluded.sort_order;

-- ----------------------------------------------------------------------------
-- Prompt 41: db-deadlock-rls-debugger
-- ----------------------------------------------------------------------------
insert into prompts (
  category_id,
  slug,
  title,
  difficulty,
  tools,
  prompt_text,
  when_to_use,
  why_it_works,
  pro_tips,
  sort_order,
  is_active,
  is_featurable,
  featured_date,
  author_type,
  author_name
)
select
  id,
  'db-deadlock-rls-debugger',
  'Лечение блокировок базы и рекурсивных RLS-политик» (The Database Deadlock & RLS Policy Debugger)',
  'intermediate',
  '{"Claude 3.7 Sonnet","GPT-4o"}'::text[],
  'Debug this PostgreSQL / Supabase error involving Row Level Security (RLS), permission violations, or lock deadlocks.

ERROR MESSAGE:
```
{{DB_ERROR}}
```

RELEVANT SCHEMA / POLICIES / QUERY:
```sql
{{SCHEMA_AND_QUERY}}
```

DEBUGGING PROTOCOL:
1. Failure Mechanism: Explain exactly why PostgreSQL rejected this query or failed with a lock conflict. (Trace JWT auth.uid() evaluation, recursive RLS policy loops, or unindexed foreign key locks).
2. Performance Impact: Does the current RLS policy force a full table subquery evaluation on every row?
3. Remediated SQL: Provide the corrected CREATE POLICY / query / index definition with optimized USING and WITH CHECK clauses.',
  'Используйте при зависаниях запросов в PostgreSQL / Supabase, ошибках бесконечной рекурсии в политиках RLS или конфликтах блокировок (Deadlock detected).',
  'Рекурсивные RLS-политики в Supabase — частая и трудноуловимая ошибка. Промпт оптимизирует `USING` и `WITH CHECK` выражения.',
  'Для Supabase оберните подзапросы в RLS-политиках в `(select auth.uid())` для кэширования.',
  41,
  true,
  true,
  null,
  'team',
  'Eengineer Staff Lead'
from prompt_categories where slug = 'error-clinic'
on conflict (slug) do update set
  title = excluded.title,
  difficulty = excluded.difficulty,
  tools = excluded.tools,
  prompt_text = excluded.prompt_text,
  when_to_use = excluded.when_to_use,
  why_it_works = excluded.why_it_works,
  pro_tips = excluded.pro_tips,
  sort_order = excluded.sort_order;

insert into prompt_variables (prompt_id, name, description, is_multiline, sort_order)
select id, 'DB_ERROR', 'Текст ошибки БД (например: infinite recursion detected in policy for relation ''users'')', false, 1
from prompts where slug = 'db-deadlock-rls-debugger'
on conflict (prompt_id, name) do update set
  description = excluded.description,
  is_multiline = excluded.is_multiline,
  sort_order = excluded.sort_order;
insert into prompt_variables (prompt_id, name, description, is_multiline, sort_order)
select id, 'SCHEMA_AND_QUERY', 'Таблицы, RLS политики и запрос, который падает', true, 2
from prompts where slug = 'db-deadlock-rls-debugger'
on conflict (prompt_id, name) do update set
  description = excluded.description,
  is_multiline = excluded.is_multiline,
  sort_order = excluded.sort_order;

-- ----------------------------------------------------------------------------
-- Prompt 42: api-network-diagnostician
-- ----------------------------------------------------------------------------
insert into prompts (
  category_id,
  slug,
  title,
  difficulty,
  tools,
  prompt_text,
  when_to_use,
  why_it_works,
  pro_tips,
  sort_order,
  is_active,
  is_featurable,
  featured_date,
  author_type,
  author_name
)
select
  id,
  'api-network-diagnostician',
  'Диагностика сетевых сбоев, таймаутов и API ошибок» (The API & Network Failure Diagnostician)',
  'intermediate',
  '{"ChatGPT","Claude","Cursor"}'::text[],
  'Diagnose this API or network-related failure. Determine whether the root cause is client-side, server-side, infrastructure, or a protocol mismatch.

ERROR CONTEXT:
- HTTP Status / Error Message:
```
{{ERROR_OUTPUT}}
```
- Request Details (method, URL, headers, body):
```
{{REQUEST_DETAILS}}
```
- Environment: {{ENVIRONMENT}} (e.g. local dev, staging behind Cloudflare, production on Vercel Edge)

DIAGNOSTIC PROTOCOL:
1. Error Classification: Client Error (4xx), Server Crash (5xx), Transport/DNS, or Silent Failure (wrong data on 200 OK).
2. Reproduction Command: Provide an exact curl command with all headers and body.
3. Root Cause Lifecycle Tracing: Where did the failure occur? (DNS → TCP → TLS → HTTP Request → Server Processing → Client Parsing).
4. Surgical Fix & Defensive Pattern: Provide code fix and retry/timeout middleware.',
  'Используйте, когда запрос к API завершается с 4xx/5xx ошибкой, таймаутом или возвращает пустой экран. Промпт проверит весь путь запроса от DNS до парсинга JSON.',
  'Сетевые ошибки часто маскируют реальную причину (CORS-ошибка часто следствие 500 падения бэкенда). Протокол трассирует весь lifecycle.',
  'Сгенерированная curl-команда позволит воспроизвести ошибку прямо в терминале.',
  42,
  true,
  true,
  null,
  'team',
  'Eengineer Staff Lead'
from prompt_categories where slug = 'error-clinic'
on conflict (slug) do update set
  title = excluded.title,
  difficulty = excluded.difficulty,
  tools = excluded.tools,
  prompt_text = excluded.prompt_text,
  when_to_use = excluded.when_to_use,
  why_it_works = excluded.why_it_works,
  pro_tips = excluded.pro_tips,
  sort_order = excluded.sort_order;

insert into prompt_variables (prompt_id, name, description, is_multiline, sort_order)
select id, 'ERROR_OUTPUT', 'Код статуса (400, 502, 504) и тело ошибки', false, 1
from prompts where slug = 'api-network-diagnostician'
on conflict (prompt_id, name) do update set
  description = excluded.description,
  is_multiline = excluded.is_multiline,
  sort_order = excluded.sort_order;
insert into prompt_variables (prompt_id, name, description, is_multiline, sort_order)
select id, 'REQUEST_DETAILS', 'URL, метод, заголовки и тело запроса', true, 2
from prompts where slug = 'api-network-diagnostician'
on conflict (prompt_id, name) do update set
  description = excluded.description,
  is_multiline = excluded.is_multiline,
  sort_order = excluded.sort_order;
insert into prompt_variables (prompt_id, name, description, is_multiline, sort_order)
select id, 'ENVIRONMENT', 'Окружение (например: Next.js на Vercel, бэкенд на NestJS за Nginx)', false, 3
from prompts where slug = 'api-network-diagnostician'
on conflict (prompt_id, name) do update set
  description = excluded.description,
  is_multiline = excluded.is_multiline,
  sort_order = excluded.sort_order;

-- ----------------------------------------------------------------------------
-- Prompt 43: git-conflict-surgeon
-- ----------------------------------------------------------------------------
insert into prompts (
  category_id,
  slug,
  title,
  difficulty,
  tools,
  prompt_text,
  when_to_use,
  why_it_works,
  pro_tips,
  sort_order,
  is_active,
  is_featurable,
  featured_date,
  author_type,
  author_name
)
select
  id,
  'git-conflict-surgeon',
  'Безопасное разрешение конфликтов в Git (Merge / Rebase)» (The Git Conflict & History Surgeon)',
  'intermediate',
  '{"ChatGPT","Claude","Cursor"}'::text[],
  'Resolve this Git error or conflict situation. You are a Version Control Systems specialist who understands Git''s internal object model (commits, trees, blobs, refs).

GIT ERROR / SITUATION:
```
{{GIT_ERROR}}
```

CURRENT STATE:
- Branch: {{BRANCH_CONTEXT}} (e.g. feature/auth rebasing onto main, 47 commits behind)
- What I was trying to do: {{INTENDED_ACTION}}

RESOLUTION PROTOCOL:
1. State Diagnosis: Explain Git''s internal state right now (detached HEAD, mid-rebase, mid-merge).
2. Conflict Resolution: For each conflicting file, explain what "ours" and "theirs" represent in this specific context (they are inverted between merge and rebase!).
3. Recovery Commands: Provide the exact sequence of Git commands with safety backup checkpoints.
4. DO NOT: Suggest git push --force blindly or recommend deleting and re-cloning the repo.',
  'Используйте, когда застряли в посреди git rebase / git merge, и боитесь потерять код или случайно затереть чужие правки при ''ours'' vs ''theirs''.',
  'Семантика ''ours/theirs'' инвертирована между merge и rebase. Промпт защищает от случайного затирания кода.',
  'Сначала выполните команду создания резервной ветки (`git branch backup-before-fix`).',
  43,
  true,
  true,
  null,
  'team',
  'Eengineer Staff Lead'
from prompt_categories where slug = 'error-clinic'
on conflict (slug) do update set
  title = excluded.title,
  difficulty = excluded.difficulty,
  tools = excluded.tools,
  prompt_text = excluded.prompt_text,
  when_to_use = excluded.when_to_use,
  why_it_works = excluded.why_it_works,
  pro_tips = excluded.pro_tips,
  sort_order = excluded.sort_order;

insert into prompt_variables (prompt_id, name, description, is_multiline, sort_order)
select id, 'GIT_ERROR', 'Вывод команды git status или текст ошибки из терминала', false, 1
from prompts where slug = 'git-conflict-surgeon'
on conflict (prompt_id, name) do update set
  description = excluded.description,
  is_multiline = excluded.is_multiline,
  sort_order = excluded.sort_order;
insert into prompt_variables (prompt_id, name, description, is_multiline, sort_order)
select id, 'BRANCH_CONTEXT', 'Текущая ветка и целевая ветка', false, 2
from prompts where slug = 'git-conflict-surgeon'
on conflict (prompt_id, name) do update set
  description = excluded.description,
  is_multiline = excluded.is_multiline,
  sort_order = excluded.sort_order;
insert into prompt_variables (prompt_id, name, description, is_multiline, sort_order)
select id, 'INTENDED_ACTION', 'Что вы пытались сделать (например: подтянуть main в feature ветку)', false, 3
from prompts where slug = 'git-conflict-surgeon'
on conflict (prompt_id, name) do update set
  description = excluded.description,
  is_multiline = excluded.is_multiline,
  sort_order = excluded.sort_order;

-- ----------------------------------------------------------------------------
-- Prompt 44: docker-deploy-debugger
-- ----------------------------------------------------------------------------
insert into prompts (
  category_id,
  slug,
  title,
  difficulty,
  tools,
  prompt_text,
  when_to_use,
  why_it_works,
  pro_tips,
  sort_order,
  is_active,
  is_featurable,
  featured_date,
  author_type,
  author_name
)
select
  id,
  'docker-deploy-debugger',
  'Починка ошибок сборки Docker и сбоев в CI/CD» (The Docker & Deployment Pipeline Debugger)',
  'intermediate',
  '{"ChatGPT","Claude","Cursor"}'::text[],
  'Debug this Docker build failure, container runtime error, or CI/CD deployment pipeline issue.

ERROR OUTPUT:
```
{{DEPLOY_ERROR}}
```

CONFIGURATION FILES:
```{{CONFIG_FORMAT}}
{{CONFIG_CONTENT}}
```

DEPLOYMENT TARGET: {{DEPLOY_TARGET}} (e.g. Vercel, AWS ECS, Docker Compose local, GitHub Actions)

DEBUGGING PROTOCOL:
1. Failure Layer Identification: Build Stage vs Container Runtime Crash vs Network/Orchestration vs CI/CD Environment Delta.
2. Environment Delta Analysis: Identify architecture differences (arm64 vs amd64), missing secrets, or cache invalidation issues.
3. Root Cause Fix: Provide the exact corrected Dockerfile / docker-compose.yml / CI workflow.
4. DO NOT: Suggest disabling security features (--privileged) or using latest tags in production.',
  'Используйте, когда падает сборка Dockerfile, контейнер падает сразу после запуска (CrashLoopBackOff) или пайплайн в GitHub Actions завершился красным крестиком.',
  'Анализ ''Environment Delta'' выявляет скрытые различия между локальным компьютером и сервером CI (разные архитектуры процессора, переменные окружения).',
  'Для Node.js проверьте наличие `NODE_ENV=production` при установке devDependencies.',
  44,
  true,
  true,
  null,
  'team',
  'Eengineer Staff Lead'
from prompt_categories where slug = 'error-clinic'
on conflict (slug) do update set
  title = excluded.title,
  difficulty = excluded.difficulty,
  tools = excluded.tools,
  prompt_text = excluded.prompt_text,
  when_to_use = excluded.when_to_use,
  why_it_works = excluded.why_it_works,
  pro_tips = excluded.pro_tips,
  sort_order = excluded.sort_order;

insert into prompt_variables (prompt_id, name, description, is_multiline, sort_order)
select id, 'DEPLOY_ERROR', 'Лог падения сборки или запуска контейнера', false, 1
from prompts where slug = 'docker-deploy-debugger'
on conflict (prompt_id, name) do update set
  description = excluded.description,
  is_multiline = excluded.is_multiline,
  sort_order = excluded.sort_order;
insert into prompt_variables (prompt_id, name, description, is_multiline, sort_order)
select id, 'CONFIG_FORMAT', 'Формат (dockerfile, yaml, toml)', false, 2
from prompts where slug = 'docker-deploy-debugger'
on conflict (prompt_id, name) do update set
  description = excluded.description,
  is_multiline = excluded.is_multiline,
  sort_order = excluded.sort_order;
insert into prompt_variables (prompt_id, name, description, is_multiline, sort_order)
select id, 'CONFIG_CONTENT', 'Содержимое Dockerfile, docker-compose.yml или .github/workflows', true, 3
from prompts where slug = 'docker-deploy-debugger'
on conflict (prompt_id, name) do update set
  description = excluded.description,
  is_multiline = excluded.is_multiline,
  sort_order = excluded.sort_order;
insert into prompt_variables (prompt_id, name, description, is_multiline, sort_order)
select id, 'DEPLOY_TARGET', 'Куда деплоим (Docker Compose, Vercel, AWS, GitHub Actions)', false, 4
from prompts where slug = 'docker-deploy-debugger'
on conflict (prompt_id, name) do update set
  description = excluded.description,
  is_multiline = excluded.is_multiline,
  sort_order = excluded.sort_order;

-- ----------------------------------------------------------------------------
-- Prompt 45: react-hydration-resolver
-- ----------------------------------------------------------------------------
insert into prompts (
  category_id,
  slug,
  title,
  difficulty,
  tools,
  prompt_text,
  when_to_use,
  why_it_works,
  pro_tips,
  sort_order,
  is_active,
  is_featurable,
  featured_date,
  author_type,
  author_name
)
select
  id,
  'react-hydration-resolver',
  'Исправление расхождения рендера React (Hydration Mismatch)» (The React Hydration Mismatch Resolver)',
  'intermediate',
  '{"Claude 3.7 Sonnet","GPT-4o","Cursor"}'::text[],
  'Diagnose and eliminate this React Server-Side Rendering (SSR) Hydration Mismatch error in Next.js / React 19.

HYDRATION ERROR LOG:
```
{{HYDRATION_ERROR}}
```

SUSPICIOUS COMPONENT CODE:
```tsx
{{COMPONENT_CODE}}
```

FORENSIC AUDIT:
1. Diff Dissection: What exact HTML tag, text node, or attribute differed between Server Rendered HTML and Client Hydrated DOM?
2. Culprit Root Cause:
   - Date/Time/Timezone formatting differences (new Date(), toLocaleDateString()).
   - Non-deterministic values (Math.random(), window.innerWidth, localStorage checks during initial render).
   - Invalid HTML nesting (e.g. <p> containing <div>, <tr> directly inside <table> without <tbody>).
   - Browser extensions mutating DOM before hydration.
3. Clean Solution: Provide the proper pattern (useEffect mounting gate, suppressHydrationWarning where safe, or server-safe client components).',
  'Используйте в Next.js / Remix, когда в консоли появляется ошибка ''Hydration failed because the initial UI does not match what was rendered on the server''.',
  'Сравнивает дерево DOM сервера и клиента, локализуя несовпадающий тег или недетерминированное значение времени.',
  'Используйте хук `useSyncExternalStore` или проверку `mounted` для клиентских значений.',
  45,
  true,
  true,
  null,
  'team',
  'Eengineer Staff Lead'
from prompt_categories where slug = 'error-clinic'
on conflict (slug) do update set
  title = excluded.title,
  difficulty = excluded.difficulty,
  tools = excluded.tools,
  prompt_text = excluded.prompt_text,
  when_to_use = excluded.when_to_use,
  why_it_works = excluded.why_it_works,
  pro_tips = excluded.pro_tips,
  sort_order = excluded.sort_order;

insert into prompt_variables (prompt_id, name, description, is_multiline, sort_order)
select id, 'HYDRATION_ERROR', 'Полный текст ошибки Hydration failed из консоли браузера', false, 1
from prompts where slug = 'react-hydration-resolver'
on conflict (prompt_id, name) do update set
  description = excluded.description,
  is_multiline = excluded.is_multiline,
  sort_order = excluded.sort_order;
insert into prompt_variables (prompt_id, name, description, is_multiline, sort_order)
select id, 'COMPONENT_CODE', 'Код компонента, вызывающего расхождение', true, 2
from prompts where slug = 'react-hydration-resolver'
on conflict (prompt_id, name) do update set
  description = excluded.description,
  is_multiline = excluded.is_multiline,
  sort_order = excluded.sort_order;

-- ----------------------------------------------------------------------------
-- Prompt 46: nodejs-oom-investigator
-- ----------------------------------------------------------------------------
insert into prompts (
  category_id,
  slug,
  title,
  difficulty,
  tools,
  prompt_text,
  when_to_use,
  why_it_works,
  pro_tips,
  sort_order,
  is_active,
  is_featurable,
  featured_date,
  author_type,
  author_name
)
select
  id,
  'nodejs-oom-investigator',
  'Лечение аварийного падения памяти (Node.js Heap OOM)» (The Node.js / V8 Out of Memory (OOM) Crash Investigator)',
  'intermediate',
  '{"Claude 3.7 Sonnet","GPT-4o"}'::text[],
  'Investigate and fix this fatal Node.js / V8 JavaScript heap out of memory crash or Docker OOMKilled exit code 137.

CRASH LOG & HEAP METRICS:
```
{{OOM_LOGS}}
```

OFFENDING CODE PIPELINE:
```typescript
{{PIPELINE_CODE}}
```

FORENSIC PROTOCOL:
1. Allocation Hotspot: Identify where large arrays, buffers, or unpaginated DB query results are held in memory simultaneously.
2. Stream & Transform Pattern: Convert bulk in-memory operations (JSON.parse of 50MB file, fetching 100k rows) into Node.js Streams / async iterators with backpressure.
3. V8 Memory Configuration: Provide optimal --max-old-space-size flags for container memory limits.',
  'Используйте, когда сервер падает с ошибкой ''JavaScript heap out of memory'' или контейнер убивается по OOMKilled в облаке.',
  'Переводит код с жадной загрузки всего массива в память на потоковую обработку (Streams / Pipelines).',
  'Никогда не делайте `SELECT *` без лимита или `fs.readFileSync` на больших файлах.',
  46,
  true,
  true,
  null,
  'team',
  'Eengineer Staff Lead'
from prompt_categories where slug = 'error-clinic'
on conflict (slug) do update set
  title = excluded.title,
  difficulty = excluded.difficulty,
  tools = excluded.tools,
  prompt_text = excluded.prompt_text,
  when_to_use = excluded.when_to_use,
  why_it_works = excluded.why_it_works,
  pro_tips = excluded.pro_tips,
  sort_order = excluded.sort_order;

insert into prompt_variables (prompt_id, name, description, is_multiline, sort_order)
select id, 'OOM_LOGS', 'Лог падения памяти из терминала / Docker', true, 1
from prompts where slug = 'nodejs-oom-investigator'
on conflict (prompt_id, name) do update set
  description = excluded.description,
  is_multiline = excluded.is_multiline,
  sort_order = excluded.sort_order;
insert into prompt_variables (prompt_id, name, description, is_multiline, sort_order)
select id, 'PIPELINE_CODE', 'Код функции, обрабатывающей большие данные или файлы', true, 2
from prompts where slug = 'nodejs-oom-investigator'
on conflict (prompt_id, name) do update set
  description = excluded.description,
  is_multiline = excluded.is_multiline,
  sort_order = excluded.sort_order;

-- ----------------------------------------------------------------------------
-- Prompt 47: cors-preflight-fixer
-- ----------------------------------------------------------------------------
insert into prompts (
  category_id,
  slug,
  title,
  difficulty,
  tools,
  prompt_text,
  when_to_use,
  why_it_works,
  pro_tips,
  sort_order,
  is_active,
  is_featurable,
  featured_date,
  author_type,
  author_name
)
select
  id,
  'cors-preflight-fixer',
  'Быстрое исправление блокировки CORS и preflight-запросов» (The CORS & Preflight Header Deep Fixer)',
  'intermediate',
  '{"ChatGPT","Claude","Cursor"}'::text[],
  'Resolve this Cross-Origin Resource Sharing (CORS) or OPTIONS Preflight failure.

BROWSER CONSOLE CORS ERROR:
```
{{CORS_ERROR}}
```

BACKEND & PROXY CONFIGURATION:
```{{LANGUAGE}}
{{BACKEND_CORS_CODE}}
```
Client Origin: {{CLIENT_ORIGIN}} (e.g. http://localhost:5173, https://app.example.com)
Server URL: {{SERVER_URL}} (e.g. https://api.example.com)

DIAGNOSIS & REMEDIATION:
1. Exact Mismatch: What header is missing or misconfigured (Access-Control-Allow-Origin, Allow-Methods, Allow-Headers, Allow-Credentials with wildcard origin conflict)?
2. OPTIONS Preflight Handling: Is the HTTP OPTIONS request returning 204/200 before authentication middleware, or is auth middleware rejecting OPTIONS?
3. Remediated Configuration: Provide the exact CORS middleware configuration.',
  'Используйте, когда в браузере горит красная ошибка ''Access to fetch at X from origin Y has been blocked by CORS policy'' при отправке запросов на бэкенд.',
  'Решает частую причину 90% CORS-ошибок: когда middleware авторизации блокирует предварительный OPTIONS запрос до проверки CORS.',
  'Не используйте `Access-Control-Allow-Origin: *` если включен `Allow-Credentials: true`.',
  47,
  true,
  true,
  null,
  'team',
  'Eengineer Staff Lead'
from prompt_categories where slug = 'error-clinic'
on conflict (slug) do update set
  title = excluded.title,
  difficulty = excluded.difficulty,
  tools = excluded.tools,
  prompt_text = excluded.prompt_text,
  when_to_use = excluded.when_to_use,
  why_it_works = excluded.why_it_works,
  pro_tips = excluded.pro_tips,
  sort_order = excluded.sort_order;

insert into prompt_variables (prompt_id, name, description, is_multiline, sort_order)
select id, 'CORS_ERROR', 'Текст ошибки CORS из консоли браузера', false, 1
from prompts where slug = 'cors-preflight-fixer'
on conflict (prompt_id, name) do update set
  description = excluded.description,
  is_multiline = excluded.is_multiline,
  sort_order = excluded.sort_order;
insert into prompt_variables (prompt_id, name, description, is_multiline, sort_order)
select id, 'LANGUAGE', 'Стек (Node.js Express, NestJS, FastAPI, Nginx)', false, 2
from prompts where slug = 'cors-preflight-fixer'
on conflict (prompt_id, name) do update set
  description = excluded.description,
  is_multiline = excluded.is_multiline,
  sort_order = excluded.sort_order;
insert into prompt_variables (prompt_id, name, description, is_multiline, sort_order)
select id, 'BACKEND_CORS_CODE', 'Текущая настройка CORS на бэкенде или в Nginx', true, 3
from prompts where slug = 'cors-preflight-fixer'
on conflict (prompt_id, name) do update set
  description = excluded.description,
  is_multiline = excluded.is_multiline,
  sort_order = excluded.sort_order;
insert into prompt_variables (prompt_id, name, description, is_multiline, sort_order)
select id, 'CLIENT_ORIGIN', 'Адрес фронтенда (например: http://localhost:5173)', false, 4
from prompts where slug = 'cors-preflight-fixer'
on conflict (prompt_id, name) do update set
  description = excluded.description,
  is_multiline = excluded.is_multiline,
  sort_order = excluded.sort_order;
insert into prompt_variables (prompt_id, name, description, is_multiline, sort_order)
select id, 'SERVER_URL', 'Адрес бэкенда (например: https://api.myapp.com)', false, 5
from prompts where slug = 'cors-preflight-fixer'
on conflict (prompt_id, name) do update set
  description = excluded.description,
  is_multiline = excluded.is_multiline,
  sort_order = excluded.sort_order;

-- ----------------------------------------------------------------------------
-- Prompt 48: orm-n1-query-fixer
-- ----------------------------------------------------------------------------
insert into prompts (
  category_id,
  slug,
  title,
  difficulty,
  tools,
  prompt_text,
  when_to_use,
  why_it_works,
  pro_tips,
  sort_order,
  is_active,
  is_featurable,
  featured_date,
  author_type,
  author_name
)
select
  id,
  'orm-n1-query-fixer',
  'Поиск и устранение паразитных запросов N+1 в ORM (Prisma/TypeORM)» (The ORM N+1 Query Detector & Fixer)',
  'intermediate',
  '{"Claude 3.7 Sonnet","GPT-4o","Cursor"}'::text[],
  'Eliminate the N+1 database query cascade in the ORM code below.

OFFENDING ORM QUERY CODE:
```typescript
{{ORM_CODE}}
```

DATABASE SCHEMA CONTEXT:
```sql
{{SCHEMA_SNIPPET}}
```
ORM Framework: {{ORM_FRAMEWORK}} (e.g. Prisma, Drizzle, TypeORM, SQLAlchemy)

REFACTORING CONTRACT:
1. Query Cascade Analysis: Explain why the current code executes 1 + N queries instead of a single batched query or JOIN.
2. Optimized Query Rewrite: Rewrite using eager loading (include/with/relations), lateral joins, or subqueries.
3. Verification SQL: Show the raw SQL query generated before vs after the optimization.',
  'Используйте, когда страница со списком пользователей или постов загружается несколько секунд, а в логах базы данных бегут сотни одинаковых SQL запросов.',
  'Превращает N+1 отдельных сетевых обращений к базе в 1 эффективный SQL JOIN или батчинг по ключам.',
  'В Prisma используйте `include: { relation: true }` вместо маппинга по массиву с `await prisma.relation.findFirst()`.',
  48,
  true,
  true,
  null,
  'team',
  'Eengineer Staff Lead'
from prompt_categories where slug = 'error-clinic'
on conflict (slug) do update set
  title = excluded.title,
  difficulty = excluded.difficulty,
  tools = excluded.tools,
  prompt_text = excluded.prompt_text,
  when_to_use = excluded.when_to_use,
  why_it_works = excluded.why_it_works,
  pro_tips = excluded.pro_tips,
  sort_order = excluded.sort_order;

insert into prompt_variables (prompt_id, name, description, is_multiline, sort_order)
select id, 'ORM_CODE', 'Код запроса в базу данных через Prisma / Drizzle / TypeORM', true, 1
from prompts where slug = 'orm-n1-query-fixer'
on conflict (prompt_id, name) do update set
  description = excluded.description,
  is_multiline = excluded.is_multiline,
  sort_order = excluded.sort_order;
insert into prompt_variables (prompt_id, name, description, is_multiline, sort_order)
select id, 'SCHEMA_SNIPPET', 'Связи и таблицы в базе данных', true, 2
from prompts where slug = 'orm-n1-query-fixer'
on conflict (prompt_id, name) do update set
  description = excluded.description,
  is_multiline = excluded.is_multiline,
  sort_order = excluded.sort_order;
insert into prompt_variables (prompt_id, name, description, is_multiline, sort_order)
select id, 'ORM_FRAMEWORK', 'Используемый ORM (Prisma, Drizzle, TypeORM, Sequelize)', false, 3
from prompts where slug = 'orm-n1-query-fixer'
on conflict (prompt_id, name) do update set
  description = excluded.description,
  is_multiline = excluded.is_multiline,
  sort_order = excluded.sort_order;

-- ----------------------------------------------------------------------------
-- Prompt 49: bundler-circular-dependency-fixer
-- ----------------------------------------------------------------------------
insert into prompts (
  category_id,
  slug,
  title,
  difficulty,
  tools,
  prompt_text,
  when_to_use,
  why_it_works,
  pro_tips,
  sort_order,
  is_active,
  is_featurable,
  featured_date,
  author_type,
  author_name
)
select
  id,
  'bundler-circular-dependency-fixer',
  'Починка циклических зависимостей и ошибок сборщика (Vite / Webpack)» (The Webpack/Vite Module Resolution & Circular Dependency Fixer)',
  'intermediate',
  '{"ChatGPT","Claude","Cursor"}'::text[],
  'Resolve this module resolution failure, circular dependency deadlock, or build-time bundler error.

BUNDLER / TERMINAL ERROR:
```
{{BUNDLER_ERROR}}
```

CONFIG & RELEVANT IMPORTS:
```
{{CONFIG_AND_IMPORTS}}
```
Bundler: {{BUNDLER}} (e.g. Vite 6, Webpack 5, Turbopack, esbuild)

RESOLUTION STEPS:
1. Cycle / Resolution Trace: Map the circular dependency chain (A -> B -> C -> A) or path alias misconfiguration (tsconfig.json paths vs vite.config.ts resolve.alias).
2. Clean Extraction: Show how to extract shared types/constants into a standalone leaf module to break the cycle.
3. Config Alignment: Ensure tsconfig and bundler config resolve aliases identically.',
  'Используйте, когда проект не собирается с ошибками ''Cannot resolve module'', ''Cannot access before initialization'' или циклическими импортами.',
  'Синхронизирует `paths` в tsconfig.json и `resolve.alias` в vite.config.ts, устраняя циклы через вынос общих типов.',
  'Используйте утилиту `madge` для визуализации графа циклических импортов.',
  49,
  true,
  true,
  null,
  'team',
  'Eengineer Staff Lead'
from prompt_categories where slug = 'error-clinic'
on conflict (slug) do update set
  title = excluded.title,
  difficulty = excluded.difficulty,
  tools = excluded.tools,
  prompt_text = excluded.prompt_text,
  when_to_use = excluded.when_to_use,
  why_it_works = excluded.why_it_works,
  pro_tips = excluded.pro_tips,
  sort_order = excluded.sort_order;

insert into prompt_variables (prompt_id, name, description, is_multiline, sort_order)
select id, 'BUNDLER_ERROR', 'Текст ошибки из консоли сборщика Vite или Webpack', false, 1
from prompts where slug = 'bundler-circular-dependency-fixer'
on conflict (prompt_id, name) do update set
  description = excluded.description,
  is_multiline = excluded.is_multiline,
  sort_order = excluded.sort_order;
insert into prompt_variables (prompt_id, name, description, is_multiline, sort_order)
select id, 'CONFIG_AND_IMPORTS', 'Файлы vite.config.ts, tsconfig.json и проблемные импорты', false, 2
from prompts where slug = 'bundler-circular-dependency-fixer'
on conflict (prompt_id, name) do update set
  description = excluded.description,
  is_multiline = excluded.is_multiline,
  sort_order = excluded.sort_order;
insert into prompt_variables (prompt_id, name, description, is_multiline, sort_order)
select id, 'BUNDLER', 'Сборщик (Vite, Webpack 5, Next.js Turbopack)', false, 3
from prompts where slug = 'bundler-circular-dependency-fixer'
on conflict (prompt_id, name) do update set
  description = excluded.description,
  is_multiline = excluded.is_multiline,
  sort_order = excluded.sort_order;

-- ----------------------------------------------------------------------------
-- Prompt 50: jwt-session-auth-debugger
-- ----------------------------------------------------------------------------
insert into prompts (
  category_id,
  slug,
  title,
  difficulty,
  tools,
  prompt_text,
  when_to_use,
  why_it_works,
  pro_tips,
  sort_order,
  is_active,
  is_featurable,
  featured_date,
  author_type,
  author_name
)
select
  id,
  'jwt-session-auth-debugger',
  'Отладка сбоев токенов авторизации (JWT / OAuth / Cookie)» (The JWT / Session Auth State Corrupt Debugger)',
  'intermediate',
  '{"Claude 3.7 Sonnet","GPT-4o","Cursor"}'::text[],
  'Debug and fix this authentication token / session corruption error (JWT, OAuth2 session, HttpOnly cookie mismatch).

AUTH ERROR / SYMPTOM:
```
{{AUTH_ERROR}}
```

AUTH FLOW CODE / TOKEN VERIFICATION:
```typescript
{{AUTH_CODE}}
```
Domain / Cookie Context: {{DOMAIN_CONTEXT}} (e.g. api.example.com server with app.example.com client, SameSite=None, Secure)

DIAGNOSIS PROTOCOL:
1. Failure Point: Signature mismatch (secret vs public key), clock skew expiration, SameSite/Secure cookie policy dropping cookies on cross-subdomain requests.
2. Token Lifecycle Verification: Refresh token rotation race conditions (concurrent requests using expired access token).
3. Remediated Code: Correct token signing, verification, and cookie header configuration.',
  'Используйте, когда юзера постоянно разлогинивает, токен выдает ошибку ''jwt expired / invalid signature'' или куки не сохраняются между доменами.',
  'Учитывает тонкости междоменных куки (`SameSite=None`, `Secure`), timezone/clock-skew на серверах и гонки обновления refresh-токенов.',
  'Для междоменных запросов убедитесь, что включен `credentials: ''include''` на клиенте.',
  50,
  true,
  true,
  null,
  'team',
  'Eengineer Staff Lead'
from prompt_categories where slug = 'error-clinic'
on conflict (slug) do update set
  title = excluded.title,
  difficulty = excluded.difficulty,
  tools = excluded.tools,
  prompt_text = excluded.prompt_text,
  when_to_use = excluded.when_to_use,
  why_it_works = excluded.why_it_works,
  pro_tips = excluded.pro_tips,
  sort_order = excluded.sort_order;

insert into prompt_variables (prompt_id, name, description, is_multiline, sort_order)
select id, 'AUTH_ERROR', 'Текст ошибки авторизации или описание бага (например: бесконечный редирект на /login)', false, 1
from prompts where slug = 'jwt-session-auth-debugger'
on conflict (prompt_id, name) do update set
  description = excluded.description,
  is_multiline = excluded.is_multiline,
  sort_order = excluded.sort_order;
insert into prompt_variables (prompt_id, name, description, is_multiline, sort_order)
select id, 'AUTH_CODE', 'Код проверки токена, обновления сессии или установки cookie', true, 2
from prompts where slug = 'jwt-session-auth-debugger'
on conflict (prompt_id, name) do update set
  description = excluded.description,
  is_multiline = excluded.is_multiline,
  sort_order = excluded.sort_order;
insert into prompt_variables (prompt_id, name, description, is_multiline, sort_order)
select id, 'DOMAIN_CONTEXT', 'Домены клиента и сервера (например: localhost:5173 и api.myapp.com)', false, 3
from prompts where slug = 'jwt-session-auth-debugger'
on conflict (prompt_id, name) do update set
  description = excluded.description,
  is_multiline = excluded.is_multiline,
  sort_order = excluded.sort_order;
