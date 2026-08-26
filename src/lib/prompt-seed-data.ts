import type { Prompt, PromptCategory } from './prompt-categories'
import { ALL_CATEGORIES } from './prompt-categories'

const CAT_MAP: Record<string, PromptCategory> = Object.fromEntries(
  ALL_CATEGORIES.map((cat) => [cat.slug, cat])
)

export const SEED_PROMPTS: Prompt[] = [
  {
    id: 'p-blind-spot-finder',
    category_id: CAT_MAP['chatbot']?.id || 'cat-chatbot',
    slug: "blind-spot-finder",
    title: "Поиск скрытых багов перед запуском» (The Production Blind Spot Finder)",
    difficulty: "intermediate",
    tools: ["Claude 3.7 Sonnet","GPT-4o","o3-mini","Gemini 2.5 Pro"],
    prompt_text: "I wrote this code and it passes my local unit tests. That is the problem — local environments lie. I need you to act as an adversarial Staff Reliability & Security Engineer and find the failure modes that only manifest in production.\n\nDO NOT:\n- Comment on styling, indentation, or naming conventions.\n- Suggest cosmetic refactorings or premature micro-benchmarks.\n- Tell me to \"add more logging\" or \"add input validation\" in the abstract.\n\nAUDIT RIGOROUSLY FOR:\n1. Concurrency & State Invariants: Race conditions, non-atomic read-modify-write cycles, thread-safety violations, deadlocks, stale state under high contention.\n2. Resource Leaks & Boundaries: Unclosed streams/handles, unbounded in-memory collection growth, memory leaks via closures/event-listeners, missing connection timeouts.\n3. Distributed & Network Realities: Partial failures, network blips, unhandled idempotency violations on retries, clock skew assumptions, timezone edge cases.\n4. Security & Data Integrity: Parameter tampering, injection vectors, authorization bypasses due to missing tenant checks, sensitive data leaking into error responses.\n\nFOR EACH ISSUE DETECTED, FORMAT AS:\n- 🔴 SEVERITY: [P0 - Immediate Prod Outage / P1 - Silent Data Corruption / P2 - High Load Degradation]\n- 📍 LOCATION: Exact function name and line context.\n- 💥 FAILURE SCENARIO: A concrete, step-by-step sequence of events or exact payload that triggers the failure.\n- 🛡️ DEFENSIVE FIX: The minimal, surgical code modification that eliminates the failure mode.\n\nIf no genuine P0/P1/P2 vulnerabilities exist, output ONLY: \"NO CRITICAL BLIND SPOTS FOUND. System invariants hold.\" Do not fabricate issues to seem helpful.\n\nCode under audit:\n```{{LANGUAGE}}\n{{CODE}}\n```\nOperational context:\n- Concurrency: {{CONCURRENCY_LEVEL}} (e.g. 5,000 req/sec, multi-tenant background worker)\n- Persistence: {{PERSISTENCE_LAYER}} (e.g. Postgres with Read-Replicas, DynamoDB, In-Memory Redis)",
    when_to_use: "Используйте, когда ваш код работает на компьютере, но вы боитесь запускать его на реальных пользователях. Промпт заставит нейросеть найти race conditions, утечки памяти и падения под нагрузкой.",
    why_it_works: "Модели по умолчанию скатываются в поверхностный style-review. Фрейминг «Local environments lie» + явный запрет косметических правок + требование конкретного воспроизводимого сценария отказа (Failure Scenario) заставляют модель моделировать runtime-поведение системы.",
    pro_tips: "При аудите многопоточного кода или асинхронных очередей ставьте температуру 0.1–0.2. Для reasoning-моделей (o3-mini, DeepSeek-R1) этот промпт инициирует построение деревьев состояний (state-space exploration) в блоке скрытого рассуждения.",
    sort_order: 1,
    is_active: true,
    is_featurable: true,
    featured_date: '2026-08-25',
    published_at: "2026-08-25T03:48:51.038Z",
    author_type: 'team',
    author_name: 'Eengineer Staff Lead',
    pack_slug: null,
    created_at: new Date().toISOString(),
    category: CAT_MAP['chatbot'],
    variables: [
          {
                "name": "LANGUAGE",
                "description": "Язык и фреймворк (например: TypeScript / Node.js 22, Go 1.24, Python FastAPI)",
                "is_multiline": false
          },
          {
                "name": "CODE",
                "description": "Исходный код для глубокого аудита (вставьте полностью)",
                "is_multiline": true
          },
          {
                "name": "CONCURRENCY_LEVEL",
                "description": "Нагрузка (например: 2000 req/sec, 50 одновременных воркеров)",
                "is_multiline": false
          },
          {
                "name": "PERSISTENCE_LAYER",
                "description": "База данных и кэш (например: PostgreSQL 16 + Redis + Prisma)",
                "is_multiline": false
          }
    ],
  },
  {
    id: 'p-postgres-schema-optimizer',
    category_id: CAT_MAP['chatbot']?.id || 'cat-chatbot',
    slug: "postgres-schema-optimizer",
    title: "Архитектор схемы и ускорения базы PostgreSQL» (The PostgreSQL Schema & Query Optimizer)",
    difficulty: "intermediate",
    tools: ["Claude 3.7 Sonnet","GPT-4o","Gemini 2.5 Pro"],
    prompt_text: "You are a Principal PostgreSQL Database Architect and Performance Engineer. Design or optimize a PostgreSQL schema and query strategy for the domain described below.\n\nREQUIREMENTS & CONSTRAINTS:\n1. Relational Integrity: Enforce domain rules strictly at the DB level (composite unique constraints, foreign keys with explicit ON DELETE semantics, CHECK constraints for business invariants). Never push core integrity solely to application code.\n2. Indexing Strategy: Propose an optimal indexing strategy (B-Tree, Partial Indexes, Composite indexes ordered by cardinality and query predicates, GIN for JSONB/Arrays). For every index, explicitly state which query filter it satisfies.\n3. Access Pattern Evaluation: Analyze read/write amplification, table bloat risks (MVCC impact on high-frequency UPDATE columns), and lock contention (Row-level vs Table-level lock risks during mutations).\n4. Data Volume Horizon: The design must remain optimal at {{EXPECTED_ROW_COUNT}} rows.\n\nINPUT DOMAIN & QUERIES:\nDomain entity requirements:\n```\n{{DOMAIN_DESCRIPTION}}\n```\nTop 3 critical queries that must run in sub-millisecond p99 latency:\n```sql\n{{CRITICAL_QUERIES}}\n```\n\nOUTPUT FORMAT:\n1. DDL (CREATE TABLE, CONSTRAINTS, INDEXES) with explicit data types (prefer timestamptz, uuidv7 or bigint, proper numeric scale/precision, non-nullable columns where invariant).\n2. Query Plan Analysis: For each critical query, explain how Postgres will execute it (Index Scan vs Bitmap Index Scan) and why sequential scans are structurally prevented.\n3. Concurrency & Lock Analysis: Highlight any risk of deadlocks on concurrent writes and specify transaction isolation level recommendations (e.g. Read Committed vs Serializable).",
    when_to_use: "Используйте при создании таблиц или когда запросы в базе данных начинают тормозить. Промпт спроектирует идеальные индексы, связи и проверит блокировки при миллионах строк.",
    why_it_works: "Большинство инженеров получают от ИИ примитивные таблицы без учета MVCC, partial indexing и deadlock patterns. Промпт требует четкого сопоставления индексов с предикатами запросов и анализа блокировок на уровне PostgreSQL.",
    pro_tips: "Для проектов на Supabase укажите в описании наличие RLS-политик, чтобы модель сгенерировала индексы под auth.uid() фильтры.",
    sort_order: 2,
    is_active: true,
    is_featurable: true,
    featured_date: null,
    published_at: "2026-08-24T03:48:51.039Z",
    author_type: 'team',
    author_name: 'Eengineer Staff Lead',
    pack_slug: null,
    created_at: new Date().toISOString(),
    category: CAT_MAP['chatbot'],
    variables: [
          {
                "name": "DOMAIN_DESCRIPTION",
                "description": "Описание сущностей, связей (1:N, M:N) и бизнес-правил",
                "is_multiline": false
          },
          {
                "name": "CRITICAL_QUERIES",
                "description": "2-3 главных SQL запроса, которые должны работать мгновенно",
                "is_multiline": false
          },
          {
                "name": "EXPECTED_ROW_COUNT",
                "description": "Ожидаемый объем данных (например: 50,000,000 строк за год)",
                "is_multiline": false
          }
    ],
  },
  {
    id: 'p-distributed-resilience-architect',
    category_id: CAT_MAP['chatbot']?.id || 'cat-chatbot',
    slug: "distributed-resilience-architect",
    title: "Аудит отказоустойчивости распределенной системы» (The Distributed Systems Resilience Architect)",
    difficulty: "intermediate",
    tools: ["Claude 3.7 Sonnet","GPT-4o","o3-mini"],
    prompt_text: "Evaluate this system architecture as a Distributed Systems Reliability Lead. Your goal is to systematically identify where network partitions, cascading failures, retry storms, and split-brain scenarios will bring this service down.\n\nARCHITECTURE SPECIFICATION:\n- Communication: {{COMMUNICATION_PROTOCOL}} (e.g. gRPC, REST, Kafka events, WebSockets)\n- Components & Topology:\n```\n{{TOPOLOGY_DESCRIPTION}}\n```\n\nSYSTEMATIC AUDIT CHECKLIST:\n1. Failure Cascades: If downstream dependency X degrades to 3,000ms latency, what happens to upstream connection pools and thread starvation? Is there circuit breaking and backpressure?\n2. Idempotency & Re-delivery: When a network timeout occurs during message processing or an API write, how is duplicate processing prevented? (Evaluate idempotency keys, deduplication windows).\n3. Data Consistency vs Availability: Where does this design sit on the CAP / PACELC spectrum? What happens during a network partition between primary and replica/worker nodes?\n4. Thundering Herd & Cache Invalidation: What happens when the primary cache node restarts or a hot cache key expires under 10k QPS?\n\nDELIVERABLE:\n- 📊 Single Point of Failure (SPOF) Matrix: Component | Failure Mode | Blast Radius | Mitigation\n- 🛡️ Resilience Architecture Patches: Concrete changes (Rate Limiting algorithms, Circuit Breakers with half-open states, Dead Letter Queues, Saga / Outbox patterns) needed before launch.",
    when_to_use: "Используйте, когда ваш бэкенд общается с несколькими сервисами, платежками или очередями сообщений. Промпт покажет, что произойдет при падении сети или зависании стороннего API.",
    why_it_works: "Предотвращает типичную ошибку 'happy path architecture', заставляя LLM моделировать деградацию соединений и штормы повторных запросов (retry storms).",
    pro_tips: "Укажите в описании SLA сторонних сервисов (например, Stripe или OpenAI API), чтобы модель рассчитала таймауты circuit breaker.",
    sort_order: 3,
    is_active: true,
    is_featurable: true,
    featured_date: null,
    published_at: "2026-08-23T03:48:51.039Z",
    author_type: 'team',
    author_name: 'Eengineer Staff Lead',
    pack_slug: null,
    created_at: new Date().toISOString(),
    category: CAT_MAP['chatbot'],
    variables: [
          {
                "name": "COMMUNICATION_PROTOCOL",
                "description": "Протоколы связи (например: REST + WebSockets + Stripe Webhooks)",
                "is_multiline": false
          },
          {
                "name": "TOPOLOGY_DESCRIPTION",
                "description": "Сервисы, базы, очереди, кэш и внешние интеграции",
                "is_multiline": false
          }
    ],
  },
  {
    id: 'p-memory-leak-detective',
    category_id: CAT_MAP['chatbot']?.id || 'cat-chatbot',
    slug: "memory-leak-detective",
    title: "Поиск утечек памяти и зависаний в коде» (The Memory Leak & Heap Detective)",
    difficulty: "intermediate",
    tools: ["Claude 3.7 Sonnet","GPT-4o","Gemini 2.5 Pro"],
    prompt_text: "Act as a Principal Systems Performance Engineer specializing in Garbage Collection internals, heap layout, and memory lifecycle analysis. Audit the provided code for memory retention bugs, uncollected objects, and unbounded heap growth.\n\nDO NOT:\n- Suggest premature micro-optimizations like object pooling unless there is an allocation hotspot.\n- Advise running Garbage Collector manually.\n- Give generic tips on 'closing resources'.\n\nANALYZE RIGOROUSLY FOR:\n1. Closure Captures & Scope Retention: Inner functions inadvertently capturing large enclosing objects or parent scopes.\n2. Unbounded Collections & Caches: Maps, Sets, or arrays acting as hidden global roots without eviction policies (LRU/TTL) or WeakRef/WeakMap semantics.\n3. Event Subscriptions & Observer Leaks: Unregistered event emitters, DOM listeners, RxJS subscriptions, or WebSocket handlers surviving component/request lifecycle.\n4. Buffer & Native Resource Accumulation: Stream buffers accumulating under unconsumed backpressure, unclosed file descriptors, database client connection leaks.\n\nOUTPUT FORMAT:\n1. 🔍 ROOT CAUSE PINPOINT: Specific lines and objects that escape garbage collection.\n2. 📈 RETAINED GRAPH EXPLANATION: Step-by-step object retention path from the GC Root to the leaking instance.\n3. 🛠️ SURGICAL FIX: The exact refactored code using proper lifecycle teardown, weak references, or bounded structures.\n\nCode under review:\n```{{LANGUAGE}}\n{{CODE}}\n```\nRuntime environment: {{RUNTIME_ENV}} (e.g. Node.js 22 LTS on 512MB RAM Docker container, Browser SPA long-lived session)",
    when_to_use: "Используйте, когда сервер или приложение со временем начинает потреблять все больше оперативной памяти (RAM) и в итоге падает с ошибкой Out Of Memory.",
    why_it_works: "Обычный AI не умеет строить цепочки GC Root retention. Промпт заставляет восстановить граф ссылок от GC Root до объекта и выявить утечку замыкания.",
    pro_tips: "Если у вас есть лог heap snapshot или график роста памяти в МБ/мин — приложите его в поле окружения.",
    sort_order: 4,
    is_active: true,
    is_featurable: true,
    featured_date: null,
    published_at: "2026-08-22T03:48:51.039Z",
    author_type: 'team',
    author_name: 'Eengineer Staff Lead',
    pack_slug: null,
    created_at: new Date().toISOString(),
    category: CAT_MAP['chatbot'],
    variables: [
          {
                "name": "LANGUAGE",
                "description": "Язык (TypeScript / Node.js, Go, Python, Java)",
                "is_multiline": false
          },
          {
                "name": "CODE",
                "description": "Подозрительный код сервиса или модуля",
                "is_multiline": true
          },
          {
                "name": "RUNTIME_ENV",
                "description": "Среда выполнения (например: Node.js на AWS Lambda с 256MB RAM)",
                "is_multiline": false
          }
    ],
  },
  {
    id: 'p-high-throughput-api-designer',
    category_id: CAT_MAP['chatbot']?.id || 'cat-chatbot',
    slug: "high-throughput-api-designer",
    title: "Проектирование высоконагруженного API (High-QPS)» (The High-Throughput API Contract Designer)",
    difficulty: "intermediate",
    tools: ["Claude 3.7 Sonnet","GPT-4o","Gemini 2.5 Pro"],
    prompt_text: "You are a Principal API Architect at a tier-1 technology company. Design an enterprise-grade, high-throughput API contract and execution model for the business capability described below.\n\nREQUIREMENTS & ARCHITECTURAL INVARIANTS:\n1. Idempotency Protocol: Implement robust idempotent mutation semantics using Idempotency-Key headers, atomic state reservation, and cached response re-delivery.\n2. Pagination & Cursor Mechanics: Design keyset/cursor-based pagination (no inefficient offset/limit) that guarantees zero skipped or duplicate items during concurrent mutations.\n3. Concurrency Control: Use optimistic locking (ETags / If-Match / version columns) to prevent lost updates in concurrent write scenarios.\n4. Rate Limiting & Shedding: Specify token bucket or sliding window limits per tenant, including standardized 429 Retry-After header contracts.\n5. Error Payload Standard: Design RFC 7807 (Problem Details) compliant error structures with actionable machine-readable error codes.\n\nBUSINESS CAPABILITY SPECIFICATION:\n```\n{{FEATURE_REQUIREMENTS}}\n```\nTarget Volume: {{REQUEST_RATE}} (e.g. 15,000 write req/sec, p99 latency < 45ms)\n\nDELIVERABLE:\n1. OpenAPI 3.1 / TypeScript Interface Definition with exact HTTP verbs, status codes, headers, and request/response schemas.\n2. Server-side State Transition & Idempotency Flow Diagram (Mermaid or step-by-step sequence).\n3. Edge Case Matrix: Handling duplicate in-flight requests, concurrent conflicting updates, and partial batch failures.",
    when_to_use: "Используйте для создания публичного или внутреннего API, который выдержит миллионы запросов, повторные клики пользователей (idempotency) и не уронит базу данных.",
    why_it_works: "Предотвращает создание 'наивных REST CRUD' эндпоинтов, заставляя заложить idempotency keys, ETag optimistic locking и курсорную пагинацию до написания кода.",
    pro_tips: "Используйте для проектирования Stripe-like платежных интерфейсов или систем бронирования билетов.",
    sort_order: 5,
    is_active: true,
    is_featurable: true,
    featured_date: null,
    published_at: "2026-08-21T03:48:51.039Z",
    author_type: 'team',
    author_name: 'Eengineer Staff Lead',
    pack_slug: null,
    created_at: new Date().toISOString(),
    category: CAT_MAP['chatbot'],
    variables: [
          {
                "name": "FEATURE_REQUIREMENTS",
                "description": "Что должен делать API (например: списание баланса, создание заказа, загрузка файлов)",
                "is_multiline": false
          },
          {
                "name": "REQUEST_RATE",
                "description": "Ожидаемый RPS/QPS и требования к задержке (например: 5,000 req/sec, p99 < 50ms)",
                "is_multiline": false
          }
    ],
  },
  {
    id: 'p-zero-trust-auth-auditor',
    category_id: CAT_MAP['chatbot']?.id || 'cat-chatbot',
    slug: "zero-trust-auth-auditor",
    title: "Аудит безопасности и защита авторизации (Zero-Trust)» (The Zero-Trust Auth & Security Auditor)",
    difficulty: "intermediate",
    tools: ["Claude 3.7 Sonnet","GPT-4o","o3-mini"],
    prompt_text: "Act as a Lead Application Security Architect and Penetration Tester. Audit the authentication, authorization, and tenant isolation implementation below for critical security vulnerabilities.\n\nAUDIT RIGOROUSLY FOR:\n1. BOLA / IDOR (Broken Object Level Authorization): Can user A access, mutate, or delete user B's resources by guessing/manipulating IDs? Are tenant scopes validated at the database layer?\n2. JWT & Token Mechanics: Signature validation flaws, algorithm confusion (none/HS256 vs RS256), token expiration / revocation gaps, sensitive data exposure in claims, improper storage (XSS vulnerability in localStorage vs HttpOnly cookies).\n3. Privilege Escalation: Can a standard user modify their own role, tenant_id, or permission flags via mass-assignment / parameter pollution?\n4. Session & Replay Vulnerabilities: Missing CSRF tokens on state-changing endpoints with cookie auth, uninvalidated sessions on password/email change.\n\nDO NOT:\n- Give generic advice like 'use HTTPS' or 'use strong passwords'.\n- Waste tokens explaining basic OWASP definitions.\n\nOUTPUT FORMAT:\n- 🚨 VULNERABILITY MATRIX: [Issue | Exploit Vector | Impact (CVSS Est.) | Concrete Exploit Payload]\n- 🛡️ SECURE IMPLEMENTATION: The remediated code with defense-in-depth authorization guards and middleware.\n\nAuth & Data Flow under audit:\n```{{LANGUAGE}}\n{{AUTH_CODE}}\n```\nUser Role Hierarchy & Multi-Tenancy Model:\n{{ROLE_MODEL}}",
    when_to_use: "Используйте для проверки входа, токенов (JWT), прав пользователей (RBAC) и защиты от взлома (IDOR, подделка токенов, кража чужих данных).",
    why_it_works: "AI обычно проверяет только наличие проверки токена. Промпт заставляет тестировать BOLA/IDOR — самую частую дыру в SaaS, когда юзер меняет userId в запросе.",
    pro_tips: "Обязательно включите в код запросы к базе данных (Prisma, Supabase, TypeORM), чтобы модель проверила фильтрацию по tenant_id.",
    sort_order: 6,
    is_active: true,
    is_featurable: true,
    featured_date: null,
    published_at: "2026-08-20T03:48:51.039Z",
    author_type: 'team',
    author_name: 'Eengineer Staff Lead',
    pack_slug: null,
    created_at: new Date().toISOString(),
    category: CAT_MAP['chatbot'],
    variables: [
          {
                "name": "LANGUAGE",
                "description": "Язык (TypeScript / Next.js, Python Django, Go Gin)",
                "is_multiline": false
          },
          {
                "name": "AUTH_CODE",
                "description": "Код middleware, проверки токенов, эндпоинтов и запросов к БД",
                "is_multiline": true
          },
          {
                "name": "ROLE_MODEL",
                "description": "Роли в системе (например: User, Manager, Admin, SuperAdmin, Multi-tenant orgs)",
                "is_multiline": false
          }
    ],
  },
  {
    id: 'p-redis-caching-optimizer',
    category_id: CAT_MAP['chatbot']?.id || 'cat-chatbot',
    slug: "redis-caching-optimizer",
    title: "Архитектор стратегии кэширования в Redis» (The Redis Caching Strategy Optimizer)",
    difficulty: "intermediate",
    tools: ["Claude 3.7 Sonnet","GPT-4o"],
    prompt_text: "You are a Principal Caching & In-Memory Storage Architect. Design an optimal Redis caching and invalidation strategy for the application workload described below.\n\nREQUIREMENTS & PITFALL PREVENTION:\n1. Pattern Selection: Justify Cache-Aside vs Write-Through vs Write-Behind based on read/write ratios and consistency tolerance.\n2. Invalidation Strategy: Eliminate stale data bugs without relying on blind low TTLs. Propose deterministic event-driven invalidation or versioned cache keys.\n3. Stampede & Thundering Herd Defense: Implement distributed mutex / singleflight locks (e.g. probabilistic early expiration / XFetch algorithm) when refreshing hot keys.\n4. Memory & Eviction Profile: Choose optimal data structures (Hashes, Sorted Sets, Bitmaps, HyperLogLogs) over raw serialized JSON strings to minimize RAM footprint.\n5. Serialization & Network Cost: Address payload size, compression, and pipeline/MGET batching to avoid Redis event loop blockage.\n\nAPPLICATION ACCESS PATTERNS:\n```\n{{WORKLOAD_DESCRIPTION}}\n```\nData consistency requirements: {{CONSISTENCY_REQUIREMENT}} (e.g. Strong consistency for financial balance, Eventual consistency up to 5s for analytics)\n\nDELIVERABLE:\n1. Cache Key Schema & Data Structure Blueprint (Key format, Redis data type, TTL strategy).\n2. Read & Write Flow Code (Production-ready implementation with thundering herd protection).\n3. Invalidation & Eviction Topology (Pub/Sub, CDC with Debezium, or transactional application hooks).",
    when_to_use: "Используйте, когда база данных перегружена, а вы хотите внедрить Redis/кэш, не сломав актуальность данных и не получив проблему 'старого кэша' (stale data).",
    why_it_works: "90% разработчиков просто сохраняют JSON в SET key json EX 60. Промпт предотвращает thundering herd и подбирает компактные структуры данных Redis.",
    pro_tips: "Укажите объем доступной оперативной памяти Redis сервера, чтобы получить рекомендации по maxmemory-policy.",
    sort_order: 7,
    is_active: true,
    is_featurable: true,
    featured_date: null,
    published_at: "2026-08-19T03:48:51.039Z",
    author_type: 'team',
    author_name: 'Eengineer Staff Lead',
    pack_slug: null,
    created_at: new Date().toISOString(),
    category: CAT_MAP['chatbot'],
    variables: [
          {
                "name": "WORKLOAD_DESCRIPTION",
                "description": "Какие данные кэшируются, соотношение Read/Write, частота обновлений",
                "is_multiline": false
          },
          {
                "name": "CONSISTENCY_REQUIREMENT",
                "description": "Допустима ли задержка обновления (например: строго свежие данные или задержка до 5 сек)",
                "is_multiline": false
          }
    ],
  },
  {
    id: 'p-concurrency-race-hunter',
    category_id: CAT_MAP['chatbot']?.id || 'cat-chatbot',
    slug: "concurrency-race-hunter",
    title: "Охотник за гонками состояний и дедлоками (Concurrency)» (The Concurrency & Race Condition Hunter)",
    difficulty: "intermediate",
    tools: ["Claude 3.7 Sonnet","o3-mini","GPT-4o"],
    prompt_text: "You are an expert Concurrency & Multithreading Systems Engineer. Audit the following multithreaded / asynchronous code for race conditions, non-atomic mutations, memory visibility bugs, and deadlocks.\n\nSTRICT AUDIT RULES:\n1. Thread-Safety Invariants: Identify shared mutable state accessed without proper synchronization, atomic primitives, or transactional boundaries.\n2. Read-Modify-Write Hazards: Pinpoint non-atomic check-then-act sequences (e.g. if (balance >= amount) balance -= amount) susceptible to double-spending under concurrent execution.\n3. Lock Ordering & Deadlock Hazards: Trace all lock acquisition sequences across code paths to identify lock inversion deadlocks.\n4. Async Interleaving (JS/Node/Python): Identify shared variables mutated across await / async ticks where state invariants can be invalidated by interleaved microtasks.\n\nFORMAT EACH BUG AS:\n- 💥 INTERLEAVING SCENARIO: Exact timeline of Thread A vs Thread B (T0, T1, T2, T3) that breaks the invariant.\n- 📉 CORRUPTED STATE RESULT: The resulting corrupt memory/database state.\n- 🛡️ SYNCHRONIZATION FIX: The minimal, lock-free, atomic, or transactional solution.\n\nCode to audit:\n```{{LANGUAGE}}\n{{CONCURRENT_CODE}}\n```\nConcurrency Model: {{CONCURRENCY_MODEL}} (e.g. Go goroutines with channels, Node.js event loop with Promise.all, Java Virtual Threads)",
    when_to_use: "Используйте для поиска багов, которые происходят случайно — когда два пользователя одновременно нажимают кнопку или фоновые задачи пересекаются друг с другом.",
    why_it_works: "Требование построить пошаговый таймлайн чередования потоков (T0, T1, T2) активирует симуляцию runtime памяти в reasoning моделях.",
    pro_tips: "Идеально подходит для проверки логики списания денег, инкремента счетчиков просмотров и систем очередей.",
    sort_order: 8,
    is_active: true,
    is_featurable: true,
    featured_date: null,
    published_at: "2026-08-25T03:48:51.039Z",
    author_type: 'team',
    author_name: 'Eengineer Staff Lead',
    pack_slug: null,
    created_at: new Date().toISOString(),
    category: CAT_MAP['chatbot'],
    variables: [
          {
                "name": "LANGUAGE",
                "description": "Язык (Go, TypeScript / Node.js, Rust, Python asyncio, Java)",
                "is_multiline": false
          },
          {
                "name": "CONCURRENT_CODE",
                "description": "Код с параллельными задачами, промисами или мьютексами",
                "is_multiline": true
          },
          {
                "name": "CONCURRENCY_MODEL",
                "description": "Модель параллелизма (например: 100 воркеров читают одну очередь Kafka)",
                "is_multiline": false
          }
    ],
  },
  {
    id: 'p-owasp-pentest-reviewer',
    category_id: CAT_MAP['chatbot']?.id || 'cat-chatbot',
    slug: "owasp-pentest-reviewer",
    title: "Пентест и аудит уязвимостей API (OWASP Top 10)» (The OWASP Top 10 & API Pentest Reviewer)",
    difficulty: "intermediate",
    tools: ["Claude 3.7 Sonnet","GPT-4o","o3-mini"],
    prompt_text: "Act as a Principal White-Hat Penetration Tester and Offensive Security Auditor. Conduct an aggressive, adversarial vulnerability assessment of the provided API handlers and business logic.\n\nEXAMINE METHODICALLY FOR OWASP API TOP 10:\n1. Injection Flaws: SQL, NoSQL, OS Command, Template (SSTI), or LDAP injection through unescaped user inputs.\n2. Broken Object Property Level Auth: Mass-assignment allowing clients to override internal properties (is_verified, role, balance).\n3. SSRF (Server-Side Request Forgery): Can user-supplied URLs/webhooks trigger requests to internal cloud metadata endpoints (169.254.169.254) or loopback services?\n4. Unrestricted Resource Consumption: Missing payload size limits, regex DoS (ReDoS) on user strings, unbounded DB queries.\n5. Security Misconfigurations: Verbose stack traces in error responses, missing CORS allow-list validation, permissive headers.\n\nOUTPUT CONTRACT:\nFor every confirmed exploit:\n- 🎯 ATTACK VECTOR: HTTP Request / curl command with malicious payload.\n- 💥 IMPACT: What an attacker achieves (Data exfiltration, RCE, Account takeover).\n- 🛡️ REMEDIATION CODE: Secure rewrite with input sanitization, schema validation (Zod/Pydantic), and safe execution.\n\nAPI Endpoints under audit:\n```{{LANGUAGE}}\n{{API_CODE}}\n```",
    when_to_use: "Используйте перед релизом бэкенда. Промпт атакует ваш API как белый хакер и проверит защиту от инъекций, утечек данных, SSRF и подделки параметров.",
    why_it_works: "Промпт требует сгенерировать готовые curl-команды для взлома. Это отсекает теоретические рассуждения и заставляет искать реальные векторы атак.",
    pro_tips: "Если API принимает загрузку файлов или URL для скачивания — обязательно добавьте эти хэндлеры в код.",
    sort_order: 9,
    is_active: true,
    is_featurable: true,
    featured_date: null,
    published_at: "2026-08-24T03:48:51.039Z",
    author_type: 'team',
    author_name: 'Eengineer Staff Lead',
    pack_slug: null,
    created_at: new Date().toISOString(),
    category: CAT_MAP['chatbot'],
    variables: [
          {
                "name": "LANGUAGE",
                "description": "Язык и фреймворк (Node.js Express/NestJS, Python FastAPI, Go Fiber)",
                "is_multiline": false
          },
          {
                "name": "API_CODE",
                "description": "Код контроллеров, роутов и валидации входящих данных",
                "is_multiline": true
          }
    ],
  },
  {
    id: 'p-graphql-schema-n1-solver',
    category_id: CAT_MAP['chatbot']?.id || 'cat-chatbot',
    slug: "graphql-schema-n1-solver",
    title: "Архитектор GraphQL схемы и решение проблемы N+1» (The GraphQL Schema & N+1 Problem Solver)",
    difficulty: "intermediate",
    tools: ["Claude 3.7 Sonnet","GPT-4o"],
    prompt_text: "You are a Principal GraphQL Architect. Design a production-grade GraphQL schema and resolver architecture for the domain described below, strictly eliminating N+1 query cascades and query depth DOS vulnerabilities.\n\nREQUIREMENTS:\n1. Schema Design: Clean Schema Definition Language (SDL) with Relay-compliant pagination (Connection, Edge, PageInfo), strict nullability contracts, and input object types.\n2. N+1 Elimination: Implement DataLoader batching and caching patterns for all nested relation resolvers.\n3. Query Complexity & Depth Limiting: Define maximum query depth and cost-analysis heuristics to prevent malicious deeply nested recursive queries.\n4. Error Handling: Differentiate between partial data with operational field-level errors vs top-level execution errors.\n\nDOMAIN SPECIFICATION:\n```\n{{DOMAIN_MODELS}}\n```\n\nDELIVERABLE:\n1. Complete GraphQL SDL Schema with types, queries, mutations, and subscriptions.\n2. Resolver Implementation with DataLoader batching for all relational fields (TypeScript / Node.js).\n3. Security Configuration (Query complexity, depth limits, and rate limiting rules).",
    when_to_use: "Используйте для проектирования GraphQL API, чтобы клиенты могли запрашивать любые вложенные данные без зависаний сервера и сотен лишних запросов в базу.",
    why_it_works: "Решает главную беду GraphQL — N+1 запросы в базу данных, когда на каждый элемент списка выполняется отдельный SQL SELECT.",
    pro_tips: "Используйте с библиотеками Dataloader или Pothos/Nexus.",
    sort_order: 10,
    is_active: true,
    is_featurable: true,
    featured_date: null,
    published_at: "2026-08-23T03:48:51.039Z",
    author_type: 'team',
    author_name: 'Eengineer Staff Lead',
    pack_slug: null,
    created_at: new Date().toISOString(),
    category: CAT_MAP['chatbot'],
    variables: [
          {
                "name": "DOMAIN_MODELS",
                "description": "Модели данных и связи (например: Пользователи, Посты, Комментарии, Лайки)",
                "is_multiline": false
          }
    ],
  },
  {
    id: 'p-database-scaling-sharding',
    category_id: CAT_MAP['chatbot']?.id || 'cat-chatbot',
    slug: "database-scaling-sharding",
    title: "Масштабирование БД: Реплики, Шардинг и Партиции» (The Database Read/Write Scaling & Sharding Architect)",
    difficulty: "intermediate",
    tools: ["Claude 3.7 Sonnet","GPT-4o","o3-mini"],
    prompt_text: "Act as a Principal Database Reliability Engineer specializing in high-scale data tier architecture. Formulate a scaling, partitioning, and read/write splitting blueprint for the database schema and workload below.\n\nSCALE METRICS:\n- Current Data Size: {{DATA_SIZE}}\n- Growth Rate: {{GROWTH_RATE}}\n- Read/Write Ratio: {{READ_WRITE_RATIO}} (e.g. 90% Read / 10% Write)\n- Database Engine: {{DATABASE_ENGINE}} (e.g. PostgreSQL 16, MySQL 8)\n\nARCHITECTURAL EVALUATION:\n1. Read/Write Splitting & Replica Lag: Strategy for routing reads to replicas while preventing stale-read anomalies immediately after user mutations (Read-Your-Own-Writes consistency via LSN / replication lag tokens).\n2. Table Partitioning Strategy: Declarative partitioning (Range vs List vs Hash) for high-growth tables. Include exact DDL, partition pruning mechanics, and maintenance automation (pg_partman).\n3. Connection Pool Topology: Optimal PgBouncer / ProxySQL architecture to prevent connection saturation under 20k concurrent application workers.\n4. Sharding Feasibility: Evaluate sharding key candidates (tenant_id vs user_id vs hash), cross-shard join avoidance, and distributed transaction implications.\n\nDELIVERABLE:\n- DDL Migration scripts for table partitioning.\n- Application routing architecture for Master vs Replica connections with lag protection.\n- Operational runbook for archiving cold partition data to S3 / Parquet.",
    when_to_use: "Используйте, когда база данных не справляется с объемом и нужно настроить чтение с Read-Replicas, разбить гигантские таблицы на партиции (Partitioning) или сделать шардинг.",
    why_it_works: "Предотвращает проблему 'грязного чтения' после репликации, когда юзер сохраняет профиль, обновляет страницу и видит старые данные из-за replica lag.",
    pro_tips: "Укажите, какие поля чаще всего используются в WHERE запросах, для идеального выбора Partition Key.",
    sort_order: 11,
    is_active: true,
    is_featurable: true,
    featured_date: null,
    published_at: "2026-08-22T03:48:51.039Z",
    author_type: 'team',
    author_name: 'Eengineer Staff Lead',
    pack_slug: null,
    created_at: new Date().toISOString(),
    category: CAT_MAP['chatbot'],
    variables: [
          {
                "name": "DATA_SIZE",
                "description": "Текущий размер данных (например: 500 GB, 200M строк)",
                "is_multiline": false
          },
          {
                "name": "GROWTH_RATE",
                "description": "Скорость роста (например: +10M строк в месяц)",
                "is_multiline": false
          },
          {
                "name": "READ_WRITE_RATIO",
                "description": "Соотношение чтения и записи (например: 80% Read / 20% Write)",
                "is_multiline": false
          },
          {
                "name": "DATABASE_ENGINE",
                "description": "СУБД (например: PostgreSQL 16 на AWS RDS)",
                "is_multiline": false
          }
    ],
  },
  {
    id: 'p-serverless-cold-start-optimizer',
    category_id: CAT_MAP['chatbot']?.id || 'cat-chatbot',
    slug: "serverless-cold-start-optimizer",
    title: "Оптимизация Serverless: Cold Starts и пулы соединений» (The Serverless Cold Start & Boundary Optimizer)",
    difficulty: "intermediate",
    tools: ["Claude 3.7 Sonnet","GPT-4o"],
    prompt_text: "You are a Principal Cloud Architect specializing in Serverless Runtimes (AWS Lambda, Vercel Edge, Cloudflare Workers). Optimize the provided serverless function for minimal cold start latency, connection reuse, and predictable execution boundaries.\n\nANALYZE & OPTIMIZE FOR:\n1. Cold Start Minimization: Heavy dependency trees imported at top-level, unnecessary runtime polyfills, dynamic imports for rare code paths, tree-shaking dead ends.\n2. Connection Management: Database client instantiation inside handler vs global scope initialization, connection pool starvation in ephemeral containers, HTTP keep-alive connection reuse.\n3. Execution Lifecycle & Global State: Safe vs unsafe caching in container memory across invocations, background execution leaks after response return.\n4. Memory & Timeout Tuning: Memory-to-CPU allocation trade-offs and edge timeout budgets.\n\nOPTIMIZATION DELIVERABLE:\n1. Refactored serverless handler with lazy-loaded modules and persistent connection caching.\n2. Bundle analysis suggestions (esbuild / rollup externals).\n3. Database pooling architecture (Supabase connection pooler / AWS RDS Proxy / Prisma Accelerate).\n\nServerless Code:\n```{{LANGUAGE}}\n{{FUNCTION_CODE}}\n```\nTarget Platform: {{PLATFORM}} (e.g. Vercel Serverless Node 22, Cloudflare Workers V8, AWS Lambda ARM64)",
    when_to_use: "Используйте для Vercel Edge, AWS Lambda или Cloudflare Workers, если функции долго стартуют (Cold Start) или исчерпывают лимит подключений к базе данных.",
    why_it_works: "Серверлесс требует специфических паттернов (инициализация клиентов вне хэндлера, lazy imports). Промпт перестраивает код под жизненный цикл лямбды.",
    pro_tips: "Для Next.js 15+ укажите nodejs или edge runtime для точной оптимизации бандла.",
    sort_order: 12,
    is_active: true,
    is_featurable: true,
    featured_date: null,
    published_at: "2026-08-21T03:48:51.039Z",
    author_type: 'team',
    author_name: 'Eengineer Staff Lead',
    pack_slug: null,
    created_at: new Date().toISOString(),
    category: CAT_MAP['chatbot'],
    variables: [
          {
                "name": "LANGUAGE",
                "description": "Язык (TypeScript / JavaScript, Python, Go)",
                "is_multiline": false
          },
          {
                "name": "FUNCTION_CODE",
                "description": "Код serverless-функции или API route (Next.js route.ts / Lambda handler)",
                "is_multiline": true
          },
          {
                "name": "PLATFORM",
                "description": "Платформа (Vercel Serverless, AWS Lambda, Cloudflare Workers)",
                "is_multiline": false
          }
    ],
  },
  {
    id: 'p-webhook-delivery-architect',
    category_id: CAT_MAP['chatbot']?.id || 'cat-chatbot',
    slug: "webhook-delivery-architect",
    title: "Надежная отправка и прием вебхуков (At-Least-Once)» (The Webhook Delivery & Retry Architect)",
    difficulty: "intermediate",
    tools: ["Claude 3.7 Sonnet","GPT-4o"],
    prompt_text: "Act as a Staff Systems Reliability Engineer. Design a mission-critical webhook ingestion AND delivery architecture with at-least-once delivery guarantees, cryptographic signature verification, and backpressure protection.\n\nREQUIREMENTS:\n1. Ingestion Security: Cryptographic HMAC SHA-256 signature verification (timestamped to prevent replay attacks, constant-time comparison to prevent timing attacks).\n2. Asynchronous Ingestion: Handler must return HTTP 202/200 in < 50ms, offloading payload processing to a durable queue (SQS, RabbitMQ, BullMQ, Redis Streams).\n3. Outbound Delivery & Retry Schedule: Exponential backoff with jitter (e.g. 5s, 30s, 5m, 30m, 2h, 24h), circuit breakers for constantly failing client endpoints, and Dead Letter Queue (DLQ) routing.\n4. Idempotency at Consumer: Deduplication keys stored with TTL to prevent duplicate event processing.\n\nINPUT SPECIFICATION:\n```\n{{WEBHOOK_SCENARIO}}\n```\n\nDELIVERABLE:\n1. Ingestion Endpoint Code with constant-time HMAC verification and rapid queue dispatch.\n2. Worker Consumer Code with idempotency check and retry logic.\n3. Database DDL for Webhook Event Log, Delivery Attempts, and DLQ tracking.",
    when_to_use: "Используйте, когда ваш сервис должен отправлять вебхуки клиентам или надежно принимать уведомления от Stripe / GitHub без потерь при сбоях сети.",
    why_it_works: "Предотвращает фатальную ошибку 'тяжелая обработка прямо в теле вебхук-эндпоинта', из-за которой сторонний сервис (Stripe) отваливается по таймауту и шлет дубли.",
    pro_tips: "Используйте crypto.timingSafeEqual в Node.js для защиты от timing-атак при сравнении хэшей.",
    sort_order: 13,
    is_active: true,
    is_featurable: true,
    featured_date: null,
    published_at: "2026-08-20T03:48:51.039Z",
    author_type: 'team',
    author_name: 'Eengineer Staff Lead',
    pack_slug: null,
    created_at: new Date().toISOString(),
    category: CAT_MAP['chatbot'],
    variables: [
          {
                "name": "WEBHOOK_SCENARIO",
                "description": "Сценарий (например: прием оплат от Stripe или отправка вебхуков клиентам нашего SaaS)",
                "is_multiline": false
          }
    ],
  },
  {
    id: 'p-surgical-agent-fix',
    category_id: CAT_MAP['agent']?.id || 'cat-agent',
    slug: "surgical-agent-fix",
    title: "Точечный фикс бага без поломки соседнего кода» (The Surgical Codebase Fixer (Zero-Collateral))",
    difficulty: "intermediate",
    tools: ["Cursor","Windsurf","Claude Code","Aider","Cline"],
    prompt_text: "Fix the bug described below. You must act as a surgical coder with ZERO collateral damage to surrounding code.\n\nBUG REPORT:\n- Observed Behavior: {{OBSERVED_BEHAVIOR}}\n- Expected Invariant: {{EXPECTED_BEHAVIOR}}\n- Target Files/Modules: {{TARGET_FILES}}\n\nSTRICT EXECUTION PROTOCOL FOR AGENT:\n1. Root Cause Formulation: Before editing any file, state your root cause hypothesis in exactly TWO sentences.\n2. Minimal Diff Invariant: Make the absolute minimum lines-of-code change necessary to fix the root cause. Do NOT:\n   - Reformat untouched lines or reorder imports.\n   - Refactor adjacent helper functions \"while you are here\".\n   - Replace native implementations with external packages.\n   - Change existing function signatures unless explicitly broken.\n3. Regression Guard: If the fix requires modifying more than 2 files, STOP immediately and explain why before proceeding.\n4. Regression Test: Add exactly ONE targeted regression unit test that fails on the old code and passes on your modified code.\n5. Post-Fix Verification: Output a clean git diff and confirm that all existing type checks and test suites remain green.",
    when_to_use: "Используйте в Cursor или Claude Code, когда нужно исправить конкретный баг. Промпт запрещает агенту трогать форматирование, переписывать соседние функции или ломать проект.",
    why_it_works: "AI-агенты в IDE печально известны тем, что переписывают половину файла. Протокол вводит жесткий трипвайр (stop if > 2 files) и запрещает паразитный рефакторинг.",
    pro_tips: "В Cursor используйте режим Composer / Agent с прикреплением только целевого файла через @file.",
    sort_order: 14,
    is_active: true,
    is_featurable: true,
    featured_date: null,
    published_at: "2026-08-19T03:48:51.039Z",
    author_type: 'team',
    author_name: 'Eengineer Staff Lead',
    pack_slug: null,
    created_at: new Date().toISOString(),
    category: CAT_MAP['agent'],
    variables: [
          {
                "name": "OBSERVED_BEHAVIOR",
                "description": "Что именно работает неправильно (текст ошибки или неожиданный вывод)",
                "is_multiline": false
          },
          {
                "name": "EXPECTED_BEHAVIOR",
                "description": "Как код должен работать правильно",
                "is_multiline": false
          },
          {
                "name": "TARGET_FILES",
                "description": "Пути к файлам (например: src/services/auth.ts)",
                "is_multiline": false
          }
    ],
  },
  {
    id: 'p-pattern-apprentice-feature',
    category_id: CAT_MAP['agent']?.id || 'cat-agent',
    slug: "pattern-apprentice-feature",
    title: "Создание новой фичи строго по существующим образцам» (The Pattern Apprentice (Idiomatic Feature Builder))",
    difficulty: "intermediate",
    tools: ["Cursor","Windsurf","Claude Code","Antigravity"],
    prompt_text: "Implement the new feature {{FEATURE_NAME}} into this codebase by strictly mimicking our established architecture and conventions.\n\nREFERENCE IMPLEMENTATIONS (Study these existing files first):\n- Reference File 1: `{{EXISTING_FILE_1}}`\n- Reference File 2: `{{EXISTING_FILE_2}}`\n\nEXTRACTION OF CONVENTIONS:\nBefore generating the new files, analyze and list:\n1. Error handling idiom: (e.g. Result types vs thrown Custom Errors vs HTTP response tuples).\n2. State & Data flow: (e.g. React Context + Reducer vs Zustand vs Server Actions).\n3. Dependency injection / import style / naming: (e.g. named exports, barrel files, path aliases).\n4. Validation & Typing layer: (e.g. Zod schemas, TypeScript branded types).\n\nNEW FEATURE SPECIFICATION:\n```\n{{FEATURE_SPECIFICATION}}\n```\n\nIMPLEMENTATION INSTRUCTIONS:\n- Generate the new module files matching the structure of the reference files 1:1.\n- Use the exact same naming conventions, comment density, and export strategies.\n- Do NOT introduce any new npm dependencies. Use what is already configured in the repository.\n- Wire the new feature into the existing router / barrel export / DI container cleanly.",
    when_to_use: "Используйте для добавления нового модуля или сервиса. Агент сначала изучит ваши уже написанные файлы и повторит их структуру, названия и стиль 1 в 1.",
    why_it_works: "Устраняет проблему 'чужеродного кода', заставляя агент сначала извлечь локальные паттерны кодовой базы (few-shot context injection).",
    pro_tips: "Всегда прикрепляйте 2 файла: один с логикой и один с типами/тестами.",
    sort_order: 15,
    is_active: true,
    is_featurable: true,
    featured_date: null,
    published_at: "2026-08-25T03:48:51.039Z",
    author_type: 'team',
    author_name: 'Eengineer Staff Lead',
    pack_slug: null,
    created_at: new Date().toISOString(),
    category: CAT_MAP['agent'],
    variables: [
          {
                "name": "FEATURE_NAME",
                "description": "Название новой фичи (например: Webhook Notification Dispatcher)",
                "is_multiline": false
          },
          {
                "name": "EXISTING_FILE_1",
                "description": "Путь к похожему рабочему файлу (например: src/services/email-dispatcher.ts)",
                "is_multiline": false
          },
          {
                "name": "EXISTING_FILE_2",
                "description": "Путь к связанным типам/тестам (например: src/services/__tests__/email.test.ts)",
                "is_multiline": false
          },
          {
                "name": "FEATURE_SPECIFICATION",
                "description": "Бизнес-логика, входные/выходные данные и крайние случаи",
                "is_multiline": true
          }
    ],
  },
  {
    id: 'p-type-safe-refactor',
    category_id: CAT_MAP['agent']?.id || 'cat-agent',
    slug: "type-safe-refactor",
    title: "Безопасный рефакторинг модуля с проверкой типов» (The Type-Safe Refactoring Specialist)",
    difficulty: "intermediate",
    tools: ["Cursor","Claude Code","Windsurf"],
    prompt_text: "Refactor {{TARGET_MODULE}} to achieve {{REFACTORING_GOAL}} while maintaining 100% backward compatibility for all external callers.\n\nINVENTORY AUDIT (Phase 1):\n1. Identify and list all public interfaces, exported functions, and types exposed by this module.\n2. List all downstream consumers across the repository that import from this path.\n3. Explicitly state the contract invariants that must not change.\n\nREFACTORING RULES (Phase 2):\n1. Strictly leverage the TypeScript type system:\n   - Use Discriminated Unions over multiple optional boolean flags.\n   - Replace any 'any' or loose 'Record<string, any>' with strict generic constraints or 'unknown' + type guards.\n   - Use 'as const' / 'satisfies' operators for immutable configuration maps.\n2. Eliminate code duplication and extract pure, side-effect-free helper functions.\n3. Every step must keep the TypeScript compiler (tsc --noEmit) completely error-free.\n4. Output the changes file-by-file with a concise summary of why each change improves maintainability or performance.",
    when_to_use: "Используйте для очистки и улучшения старого сложного кода. Агент найдет всех потребителей функции по проекту и гарантирует, что TypeScript компилируется без единой ошибки.",
    why_it_works: "Обеспечивает безопасность за счет обязательной фазы аудита всех мест вызова (call-site audit) до внесения изменений.",
    pro_tips: "Запустите `tsc --noEmit` до и после работы агента для подтверждения нулевого числа регрессий.",
    sort_order: 16,
    is_active: true,
    is_featurable: true,
    featured_date: null,
    published_at: "2026-08-24T03:48:51.039Z",
    author_type: 'team',
    author_name: 'Eengineer Staff Lead',
    pack_slug: null,
    created_at: new Date().toISOString(),
    category: CAT_MAP['agent'],
    variables: [
          {
                "name": "TARGET_MODULE",
                "description": "Путь к файлу или папке для рефакторинга",
                "is_multiline": false
          },
          {
                "name": "REFACTORING_GOAL",
                "description": "Цель (например: отделить логику базы данных от валидации)",
                "is_multiline": false
          }
    ],
  },
  {
    id: 'p-test-suite-architect',
    category_id: CAT_MAP['agent']?.id || 'cat-agent',
    slug: "test-suite-architect",
    title: "Генератор надежного набора автотестов (Unit + Edge Cases)» (The Test Suite Architect)",
    difficulty: "intermediate",
    tools: ["Cursor","Claude Code","Windsurf","Copilot"],
    prompt_text: "Generate a comprehensive test suite for the module described below. You must act as a Senior QA Architect who writes tests that catch real regressions, not tests that pass by tautology.\n\nMODULE UNDER TEST:\n- File(s): {{TARGET_FILES}}\n- Language/Framework: {{LANGUAGE_AND_TEST_FRAMEWORK}}\n- Business Context: {{BUSINESS_CONTEXT}}\n\nSTRICT TEST ENGINEERING PROTOCOL:\n1. Test Taxonomy (generate tests in this order):\n   a. Contract Tests (Unit): Test each public function's input→output contract. For every function, include:\n      - Happy path with realistic production-like data (not 'foo', 'bar', 'test123').\n      - Boundary values: empty inputs, maximum length strings, zero/negative numbers, unicode edge cases.\n      - Error paths: invalid types, null/undefined, missing required fields — assert specific error types, not just \"it throws.\"\n   b. State Transition Tests: If the module manages state (DB, cache, in-memory store), test the full lifecycle: create → read → update → delete. Verify state after each transition, not just the return value.\n   c. Integration Boundary Tests: Test the seams where this module interacts with external dependencies (DB, API, file system). Use realistic test doubles. Assert that the module handles dependency failures gracefully (timeout, connection refused, malformed response).\n   d. Regression Guards: For each test, add a one-line comment explaining what specific bug this test would catch if the code regressed.\n\n2. Anti-Patterns — DO NOT:\n   - Write tests that simply mirror the implementation (tautology tests).\n   - Mock the module under test itself.\n   - Use 'any' type in test code or skip TypeScript type checking.\n   - Write 'test(\"should work\")' — every test name must describe the specific invariant being verified.\n\n3. Output Format:\n   - One complete test file, ready to run with zero modifications.\n   - Group tests with describe blocks matching the module's public API surface.",
    when_to_use: "Используйте для покрытия важной функции тестами. Промпт заставит агента написать реальные тесты на граничные случаи и сбои, а не бесполезные 'тесты для галочки'.",
    why_it_works: "Промпт вводит таксономию (contract → state → integration → regression) и явно запрещает тавтологические тесты и бездумное мокирование.",
    pro_tips: "Укажите 1-2 реальных бага из прошлого — агент добавит регрессионные тесты именно на них.",
    sort_order: 17,
    is_active: true,
    is_featurable: true,
    featured_date: null,
    published_at: "2026-08-23T03:48:51.039Z",
    author_type: 'team',
    author_name: 'Eengineer Staff Lead',
    pack_slug: null,
    created_at: new Date().toISOString(),
    category: CAT_MAP['agent'],
    variables: [
          {
                "name": "TARGET_FILES",
                "description": "Пути к файлам (например: src/services/payment-processor.ts)",
                "is_multiline": false
          },
          {
                "name": "LANGUAGE_AND_TEST_FRAMEWORK",
                "description": "Язык и тестовый раннер (TypeScript / Vitest, Python / pytest)",
                "is_multiline": false
          },
          {
                "name": "BUSINESS_CONTEXT",
                "description": "Что делает модуль в системе (например: обработка вебхуков от Stripe)",
                "is_multiline": false
          }
    ],
  },
  {
    id: 'p-zero-downtime-db-migration',
    category_id: CAT_MAP['agent']?.id || 'cat-agent',
    slug: "zero-downtime-db-migration",
    title: "Пошаговый план миграции БД без остановки сайта (Zero-Downtime)» (The Zero-Downtime Database Migration Planner)",
    difficulty: "intermediate",
    tools: ["Cursor","Claude Code","ChatGPT","Copilot"],
    prompt_text: "Plan and generate a zero-downtime database migration for the schema change described below. You must think as a Principal Database Reliability Engineer who has been paged at 3 AM because of a botched migration.\n\nCURRENT STATE:\n- Database: {{DATABASE_ENGINE}}\n- Current Schema (relevant tables):\n```sql\n{{CURRENT_SCHEMA}}\n```\n- Active traffic: {{TRAFFIC_PATTERN}} (e.g. 2,000 writes/sec to this table during peak)\n\nDESIRED CHANGE:\n```\n{{MIGRATION_GOAL}}\n```\n\nMIGRATION ENGINEERING PROTOCOL:\n1. Risk Assessment First: Classify this migration (SAFE additive vs CAREFUL backward-compatible vs DANGEROUS breaking change).\n2. Multi-Phase Migration Plan: Generate migrations as numbered, independently deployable steps:\n   - Phase 1 (Expand): Add new structures without breaking existing code. All existing queries MUST continue to work identically.\n   - Phase 2 (Migrate): Backfill data, dual-write logic in application code. Include exact backfill query with batch size and progress logging.\n   - Phase 3 (Cutover): Switch application reads to new structure. Old structure still populated.\n   - Phase 4 (Contract): Remove old columns/tables ONLY after verification period. Include the verification query.\n\n3. For each phase, specify:\n   - Exact SQL migration (up and down).\n   - Lock analysis: Will this acquire an ACCESS EXCLUSIVE lock? For how long?\n   - Rollback procedure: Exact steps to undo this phase independently.",
    when_to_use: "Используйте при переименовании колонок, разбиении таблиц или изменении типов в базе данных на работающем проекте. Агент создаст 4 безопасных шага миграции без блокировки таблиц.",
    why_it_works: "Фреймворк Expand-Migrate-Cutover-Contract заставляет модель генерировать безопасные multi-deploy миграции с анализом блокировок.",
    pro_tips: "Для PostgreSQL указывайте версию — поведение ADD COLUMN DEFAULT сильно различается между версиями.",
    sort_order: 18,
    is_active: true,
    is_featurable: true,
    featured_date: null,
    published_at: "2026-08-22T03:48:51.039Z",
    author_type: 'team',
    author_name: 'Eengineer Staff Lead',
    pack_slug: null,
    created_at: new Date().toISOString(),
    category: CAT_MAP['agent'],
    variables: [
          {
                "name": "DATABASE_ENGINE",
                "description": "СУБД (PostgreSQL 16, MySQL 8, Supabase)",
                "is_multiline": false
          },
          {
                "name": "CURRENT_SCHEMA",
                "description": "Текущий DDL затронутых таблиц",
                "is_multiline": true
          },
          {
                "name": "TRAFFIC_PATTERN",
                "description": "Нагрузка (например: 5000 reads/sec + 500 writes/sec)",
                "is_multiline": false
          },
          {
                "name": "MIGRATION_GOAL",
                "description": "Что нужно изменить (например: разделить таблицу users на accounts + profiles)",
                "is_multiline": false
          }
    ],
  },
  {
    id: 'p-ui-component-builder',
    category_id: CAT_MAP['agent']?.id || 'cat-agent',
    slug: "ui-component-builder",
    title: "Создание готового UI-компонента по дизайну и токенам» (The Pixel-Perfect UI Component Builder)",
    difficulty: "intermediate",
    tools: ["Cursor","Claude Code","Windsurf","v0.dev"],
    prompt_text: "Build a production-ready UI component based on the specification below. You are a Senior Frontend Engineer who ships accessible, performant components — not throwaway prototypes.\n\nCOMPONENT SPECIFICATION:\n- Component Name: {{COMPONENT_NAME}}\n- UI Framework: {{UI_FRAMEWORK}}\n- Design Description / Reference:\n```\n{{DESIGN_DESCRIPTION}}\n```\n\nIMPLEMENTATION CONTRACT:\n1. Component API Design:\n   - Define a strict TypeScript props interface. Every prop must have a JSDoc comment explaining its purpose.\n   - Use Discriminated Unions for mutually exclusive variants, NOT optional boolean flags.\n   - Export both the component and its props type.\n\n2. Styling Rules:\n   - Use the project's existing styling approach (Tailwind / CSS Modules).\n   - DO NOT hardcode colors as hex/rgb values. Use design tokens and theme variables.\n   - Support dark mode and responsive design (320px to 1440px).\n\n3. Accessibility (Non-Negotiable):\n   - Correct ARIA roles and attributes. Full keyboard navigation (Tab, Enter, Escape). Minimum 4.5:1 contrast.\n\n4. State & Interaction:\n   - Handle all states: default, hover, focus-visible, active, disabled, loading, error.\n   - Animations must respect prefers-reduced-motion: reduce.",
    when_to_use: "Используйте для создания кнопок, карточек, модалок или форм. Агент напишет адаптивный компонент с поддержкой темной темы, клавиатуры и всех 7 состояний (hover, loading, error и т.д.).",
    why_it_works: "AI обычно делает прототипы с хардкодом цветов. Контракт заставляет соблюдать дизайн-токены, accessibility и все интерактивные состояния.",
    pro_tips: "Прикрепите в Cursor файл вашей дизайн-системы (например tailwind.config.js) для 100% совпадения цветов.",
    sort_order: 19,
    is_active: true,
    is_featurable: true,
    featured_date: null,
    published_at: "2026-08-21T03:48:51.039Z",
    author_type: 'team',
    author_name: 'Eengineer Staff Lead',
    pack_slug: null,
    created_at: new Date().toISOString(),
    category: CAT_MAP['agent'],
    variables: [
          {
                "name": "COMPONENT_NAME",
                "description": "Имя компонента (например: FilterDropdown, PricingCard, DataTable)",
                "is_multiline": false
          },
          {
                "name": "UI_FRAMEWORK",
                "description": "Стек (React 19 + Tailwind v3, Next.js, Vue 3)",
                "is_multiline": false
          },
          {
                "name": "DESIGN_DESCRIPTION",
                "description": "Описание внешнего вида, расположения элементов и поведения",
                "is_multiline": false
          }
    ],
  },
  {
    id: 'p-e2e-suite-generator',
    category_id: CAT_MAP['agent']?.id || 'cat-agent',
    slug: "e2e-suite-generator",
    title: "Генератор E2E сценариев (Playwright / Cypress)» (The End-to-End Playwright/Cypress Suite Generator)",
    difficulty: "intermediate",
    tools: ["Cursor","Claude Code","Windsurf"],
    prompt_text: "You are a Principal Test Automation Architect specializing in Playwright and Cypress. Generate a robust, resilient End-to-End (E2E) test suite for the critical user journey below.\n\nSTRICT STABILITY PROTOCOL:\n1. Page Object Model (POM): Encapsulate all selectors and page interactions inside typed Page Object classes.\n2. Resilient Locators: NEVER use fragile XPath, generated CSS classes (e.g. .css-12345), or index-based selectors. Prefer user-facing locators: page.getByRole(), page.getByLabel(), page.getByTestId().\n3. Auto-Waiting & Zero Flakiness: Strictly avoid arbitrary sleep/timeout calls (page.waitForTimeout). Rely on Playwright's built-in web-first assertions (expect(locator).toBeVisible()).\n4. Network & State Isolation: Define mock handlers or seed cookies for authenticated states to prevent test pollution.\n\nUSER JOURNEY SPECIFICATION:\n```\n{{USER_JOURNEY}}\n```\nFramework: {{E2E_FRAMEWORK}} (e.g. Playwright TypeScript, Cypress 13)\n\nDELIVERABLE:\n1. Page Object Classes with clean action methods.\n2. Complete Spec File covering happy path, validation errors, and network failure fallback.",
    when_to_use: "Используйте для создания тестов в браузере. Агент напишет стабильные сквозные тесты (авторизация, покупка, заполнение форм) по паттерну Page Object Model без случайных падений.",
    why_it_works: "Запрет на waitForTimeout и принудительное использование role-based селекторов устраняет 95% причин флакующих (flaky) E2E тестов.",
    pro_tips: "Используйте `page.getByRole('button', { name: 'Submit' })` вместо `.btn-primary`.",
    sort_order: 20,
    is_active: true,
    is_featurable: true,
    featured_date: null,
    published_at: "2026-08-20T03:48:51.039Z",
    author_type: 'team',
    author_name: 'Eengineer Staff Lead',
    pack_slug: null,
    created_at: new Date().toISOString(),
    category: CAT_MAP['agent'],
    variables: [
          {
                "name": "USER_JOURNEY",
                "description": "Шаги пользователя (например: вход через Google → добавление товара в корзину → оплата)",
                "is_multiline": false
          },
          {
                "name": "E2E_FRAMEWORK",
                "description": "Фреймворк (Playwright TypeScript / Cypress)",
                "is_multiline": false
          }
    ],
  },
  {
    id: 'p-js-to-ts-migrator',
    category_id: CAT_MAP['agent']?.id || 'cat-agent',
    slug: "js-to-ts-migrator",
    title: "Перевод старого JavaScript в строгий TypeScript» (The Legacy JS to Strict TypeScript Migrator)",
    difficulty: "intermediate",
    tools: ["Cursor","Claude Code","Windsurf"],
    prompt_text: "Convert the following legacy JavaScript code into modern, strictly-typed TypeScript (tsconfig strict: true).\n\nMIGRATION MANDATES:\n1. Zero 'any' Policy: Never use 'any'. Use generics, unknown with type guards, or discriminated unions for dynamic payloads.\n2. Runtime Invariants to Types: Infer precise literal types and readonly const maps (as const, satisfies) where values are immutable.\n3. JSDoc Preservation: Convert existing JSDoc comments into native TypeScript interfaces and TSDoc annotations.\n4. Nullability & Optionality: Explicitly model undefined vs null vs missing properties based on runtime branches.\n\nLegacy JavaScript:\n```javascript\n{{LEGACY_JS_CODE}}\n```\nRelated Type Definitions / Context:\n{{TYPE_CONTEXT}}",
    when_to_use: "Используйте при переводе старых .js файлов в строгий .ts/.tsx. Агент расставит точные типы, дженерики и type guards без единого костыльного `any` или `@ts-ignore`.",
    why_it_works: "Модели часто 'ленятся' и ставят `any` на сложные структуры. Промпт запрещает это и заставляет выводить строгие Discriminated Unions.",
    pro_tips: "После конвертации проверьте файл через `npx tsc --noEmit`.",
    sort_order: 21,
    is_active: true,
    is_featurable: true,
    featured_date: null,
    published_at: "2026-08-19T03:48:51.039Z",
    author_type: 'team',
    author_name: 'Eengineer Staff Lead',
    pack_slug: null,
    created_at: new Date().toISOString(),
    category: CAT_MAP['agent'],
    variables: [
          {
                "name": "LEGACY_JS_CODE",
                "description": "Исходный JavaScript код для конвертации",
                "is_multiline": true
          },
          {
                "name": "TYPE_CONTEXT",
                "description": "Существующие типы в проекте, с которыми должен стыковаться файл",
                "is_multiline": false
          }
    ],
  },
  {
    id: 'p-react-rerender-optimizer',
    category_id: CAT_MAP['agent']?.id || 'cat-agent',
    slug: "react-rerender-optimizer",
    title: "Устранение лишних ре-рендеров и тормозов в React» (The React Performance & Re-render Optimizer)",
    difficulty: "intermediate",
    tools: ["Cursor","Claude Code","Windsurf"],
    prompt_text: "You are a Principal React Performance Engineer. Audit and optimize the React component hierarchy below for wasted renders, excessive DOM updates, and memoization misuse.\n\nPERFORMANCE DIAGNOSTIC PROTOCOL:\n1. Render Cascades: Identify state located too high in the tree forcing child re-renders. Recommend state colocation, context splitting, or composition (children prop).\n2. Memoization Audit:\n   - Identify missing or broken memo dependencies (inline object literals, unstable callback references).\n   - Flag premature/harmful use of useMemo/useCallback where overhead exceeds benefit.\n3. Heavy Computations: Move CPU-heavy transformations out of the render loop or into Web Workers / concurrent transitions (useTransition / useDeferredValue).\n4. Virtualization: For long lists (> 100 items), integrate windowing/virtualization patterns.\n\nComponent Code:\n```tsx\n{{REACT_CODE}}\n```",
    when_to_use: "Используйте, когда интерфейс на React подвисает при вводе текста, скролле или кликах. Агент найдет лишние ре-рендеры и точечно применит мемоизацию и оптимизацию стейта.",
    why_it_works: "Устраняет типичную ошибку начинающих — обернуть всё подряд в useCallback без понимания ссылочной целостности объектов в React.",
    pro_tips: "Если компонент рендерит таблицу или список, укажите среднее количество элементов в пропсах.",
    sort_order: 22,
    is_active: true,
    is_featurable: true,
    featured_date: null,
    published_at: "2026-08-25T03:48:51.039Z",
    author_type: 'team',
    author_name: 'Eengineer Staff Lead',
    pack_slug: null,
    created_at: new Date().toISOString(),
    category: CAT_MAP['agent'],
    variables: [
          {
                "name": "REACT_CODE",
                "description": "Код тормозящего React-компонента и его дочерних элементов",
                "is_multiline": true
          }
    ],
  },
  {
    id: 'p-openapi-spec-extractor',
    category_id: CAT_MAP['agent']?.id || 'cat-agent',
    slug: "openapi-spec-extractor",
    title: "Генерация схемы OpenAPI/Swagger прямо из кода» (The OpenAPI/Swagger Spec Extractor)",
    difficulty: "intermediate",
    tools: ["Cursor","Claude Code","ChatGPT"],
    prompt_text: "Reverse-engineer a complete, production-grade OpenAPI 3.1 YAML specification by analyzing the route handlers, validation schemas, and database models below.\n\nSPECIFICATION REQUIREMENTS:\n1. Exact Status Codes: Include all success codes (200, 201, 204) and failure codes (400, 401, 403, 404, 409, 422, 500) derived from actual code branches.\n2. Schema Components: Extract reusable data structures into #/components/schemas rather than inlining large objects.\n3. Security Schemes: Define BearerAuth / ApiKeyAuth in components and apply them to protected paths.\n4. Parameter Constraints: Include required flags, formats (uuid, date-time, email), enums, and min/max limits found in validation code.\n\nSource Route Handlers & Schemas:\n```{{LANGUAGE}}\n{{ROUTE_CODE}}\n```",
    when_to_use: "Используйте, когда у вас есть готовый бэкенд, но нет документации для фронтендеров или Swagger UI. Агент извлечет полную спецификацию OpenAPI 3.1 прямо из ваших эндпоинтов.",
    why_it_works: "Извлекает точные коды ошибок (400/403/409) из условий `if/else` и `throw` внутри реального кода, а не выдумывает типовой список.",
    pro_tips: "Вставьте файл с валидацией (например, Zod схемы) для идеальной генерации типов параметров.",
    sort_order: 23,
    is_active: true,
    is_featurable: true,
    featured_date: null,
    published_at: "2026-08-24T03:48:51.039Z",
    author_type: 'team',
    author_name: 'Eengineer Staff Lead',
    pack_slug: null,
    created_at: new Date().toISOString(),
    category: CAT_MAP['agent'],
    variables: [
          {
                "name": "LANGUAGE",
                "description": "Язык/фреймворк (TypeScript Express/Fastify/Next.js, Python FastAPI, Go)",
                "is_multiline": false
          },
          {
                "name": "ROUTE_CODE",
                "description": "Код эндпоинтов, Zod-схем и контроллеров",
                "is_multiline": true
          }
    ],
  },
  {
    id: 'p-a11y-remediation-agent',
    category_id: CAT_MAP['agent']?.id || 'cat-agent',
    slug: "a11y-remediation-agent",
    title: "Аудит доступности интерфейса (Accessibility WCAG 2.1)» (The Accessibility (a11y) Remediation Agent)",
    difficulty: "intermediate",
    tools: ["Cursor","Claude Code","Windsurf"],
    prompt_text: "Audit and remediate the provided UI component to meet WCAG 2.1 Level AA accessibility standards.\n\nACCESSIBILITY MANDATES:\n1. Keyboard Navigation: All interactive elements must be focusable via Tab, operable via Enter/Space, and dismissible via Escape where applicable. Focus order must follow visual flow.\n2. Screen Reader Semantics: Correct ARIA roles, states, and properties (aria-expanded, aria-controls, aria-haspopup, aria-live). Ensure icon-only buttons have aria-label.\n3. Form Controls: Explicit associations between inputs and labels (htmlFor/id or aria-labelledby). Error messages linked via aria-describedby and aria-invalid.\n4. Focus Visibility: Never remove outline without providing a high-contrast focus-visible ring.\n\nComponent to remediate:\n```tsx\n{{COMPONENT_CODE}}\n```",
    when_to_use: "Используйте для проверки сайта на доступность для пользователей с ограниченными возможностями, экранных дикторов (screen readers) и навигации только с клавиатуры.",
    why_it_works: "Фокусируется на WCAG 2.1 AA критериях, предотвращая распространенные проблемы вроде невидимого фокуса клавиатуры и кнопок без меток.",
    pro_tips: "Идеально подходит для сложных интерактивных компонентов: кастомных дропдаунов, аккордеонов и модалок.",
    sort_order: 24,
    is_active: true,
    is_featurable: true,
    featured_date: null,
    published_at: "2026-08-23T03:48:51.039Z",
    author_type: 'team',
    author_name: 'Eengineer Staff Lead',
    pack_slug: null,
    created_at: new Date().toISOString(),
    category: CAT_MAP['agent'],
    variables: [
          {
                "name": "COMPONENT_CODE",
                "description": "Код интерфейсного компонента или модального окна",
                "is_multiline": true
          }
    ],
  },
  {
    id: 'p-dead-code-pruner',
    category_id: CAT_MAP['agent']?.id || 'cat-agent',
    slug: "dead-code-pruner",
    title: "Очистка мертвого кода и неиспользуемых библиотек» (The Dead Code & Dependency Tree Pruner)",
    difficulty: "intermediate",
    tools: ["Cursor","Claude Code"],
    prompt_text: "Analyze the provided module, exports, and package dependencies. Identify all dead code branches, unused exports, obsolete imports, and bloated dependencies that can be safely pruned.\n\nPRUNING AUDIT:\n1. Unused Exports & Variables: Variables assigned but never read, unexported private helpers, orphaned functions.\n2. Unreachable Branches: Dead conditional branches (if (false), redundant null checks superseded by strict types).\n3. Heavy Dependency Alternatives: Identify large libraries (e.g. lodash, moment.js) that can be replaced with native ES2024 methods or tiny sub-packages.\n4. Safety Check: Verify that no dynamic reflection (eval, window[key]) relies on the candidates for deletion.\n\nModule under audit:\n```{{LANGUAGE}}\n{{MODULE_CODE}}\n```\nImports / package.json dependencies context:\n{{DEPENDENCY_CONTEXT}}",
    when_to_use: "Используйте для генеральной уборки в кодовой базе. Агент выявит забытые функции, мертвые файлы и тяжелые npm-пакеты, уменьшив вес финального сайта.",
    why_it_works: "Помогает сократить размер JS бандла и избавиться от устаревших монструозных библиотек в пользу нативного JS.",
    pro_tips: "Отличный промпт перед релизом для прохождения аудита производительности в Google Lighthouse.",
    sort_order: 25,
    is_active: true,
    is_featurable: true,
    featured_date: null,
    published_at: "2026-08-22T03:48:51.039Z",
    author_type: 'team',
    author_name: 'Eengineer Staff Lead',
    pack_slug: null,
    created_at: new Date().toISOString(),
    category: CAT_MAP['agent'],
    variables: [
          {
                "name": "LANGUAGE",
                "description": "Язык (TypeScript, JavaScript, Python)",
                "is_multiline": false
          },
          {
                "name": "MODULE_CODE",
                "description": "Исходный код файла или группы связанных модулей",
                "is_multiline": true
          },
          {
                "name": "DEPENDENCY_CONTEXT",
                "description": "Список установленных пакетов из package.json",
                "is_multiline": false
          }
    ],
  },
  {
    id: 'p-css-to-tailwind-migrator',
    category_id: CAT_MAP['agent']?.id || 'cat-agent',
    slug: "css-to-tailwind-migrator",
    title: "Перевод стилей CSS/SCSS в классы Tailwind CSS» (The CSS/SCSS to Tailwind Token Migrator)",
    difficulty: "intermediate",
    tools: ["Cursor","Claude Code","Windsurf"],
    prompt_text: "Convert the following legacy CSS/SCSS styles into modern, idiomatic Tailwind CSS (v3/v4) utility classes applied directly to the JSX markup.\n\nCONVERSION RULES:\n1. Design Token Mapping: Map raw pixel/hex values to Tailwind theme tokens (spacing scale, font sizes, project theme colors). Do NOT use arbitrary bracket notation (e.g. w-[23px] or bg-[#123456]) unless no theme token exists.\n2. Pseudo-classes & Responsive: Convert media queries to Tailwind prefixes (sm:, md:, lg:) and state modifiers (hover:, focus-visible:, active:, disabled:, dark:).\n3. Flexbox & Grid Simplification: Replace verbose CSS layout rules with compact Tailwind layout primitives (flex items-center justify-between gap-4).\n\nJSX Component:\n```tsx\n{{JSX_MARKUP}}\n```\nCSS / SCSS Styles:\n```css\n{{CSS_STYLES}}\n```\nTailwind Config / Design Tokens Context:\n{{TAILWIND_CONFIG_SNIPPET}}",
    when_to_use: "Используйте, когда у вас есть верстка на чистом CSS/SCSS, и вы хотите переписать её на Tailwind CSS с сохранением адаптивности и дизайн-токенов вашего проекта.",
    why_it_works: "Запрет на `w-[342px]` и принудительное сопоставление с дизайн-токенами сохраняет единый визуальный стиль приложения.",
    pro_tips: "Приложите tailwind.config.js для корректного маппинга кастомных цветов вроде `gold-dark` и `dark-surface`.",
    sort_order: 26,
    is_active: true,
    is_featurable: true,
    featured_date: null,
    published_at: "2026-08-21T03:48:51.039Z",
    author_type: 'team',
    author_name: 'Eengineer Staff Lead',
    pack_slug: null,
    created_at: new Date().toISOString(),
    category: CAT_MAP['agent'],
    variables: [
          {
                "name": "JSX_MARKUP",
                "description": "HTML или JSX разметка компонента",
                "is_multiline": false
          },
          {
                "name": "CSS_STYLES",
                "description": "Старые CSS / SCSS стили",
                "is_multiline": false
          },
          {
                "name": "TAILWIND_CONFIG_SNIPPET",
                "description": "Токены цветов и шрифтов из вашего tailwind.config.js",
                "is_multiline": false
          }
    ],
  },
  {
    id: 'p-i18n-extractor',
    category_id: CAT_MAP['agent']?.id || 'cat-agent',
    slug: "i18n-extractor",
    title: "Подготовка сайта к переводу на другие языки (i18n)» (The Internationalization (i18n) Extractor)",
    difficulty: "intermediate",
    tools: ["Cursor","Claude Code"],
    prompt_text: "Extract all hardcoded user-facing strings from the provided component into structured i18n translation keys and JSON message catalogs.\n\nEXTRACTION INVARIANTS:\n1. Key Naming: Use hierarchical semantic keys (e.g. feature.section.element_description). Never use the English string itself as the key.\n2. Pluralization & Interpolation: Correctly model dynamic numbers and variables using ICU MessageFormat syntax (e.g. \"{count, plural, one {# item} other {# items}}\").\n3. Context Preservation: Add context comments for translators explaining where and how the string is displayed.\n4. Component Refactoring: Replace raw strings in JSX with useTranslation / t() calls.\n\nComponent Code:\n```tsx\n{{COMPONENT_CODE}}\n```\nTarget i18n Library: {{I18N_LIBRARY}} (e.g. react-i18next, next-intl, formatjs)",
    when_to_use: "Используйте для извлечения захардкоженного текста из компонентов в JSON-файлы переводов (i18next, next-intl) с поддержкой плюрализации (1 день, 2 дня, 5 дней).",
    why_it_works: "Учитывает правила плюрализации русского и английского языков (1, 2-4, 5+ форм), предотвращая кривые фразы вроде '1 дней'.",
    pro_tips: "Укажите языки проекта (например, ru, en, uz) для генерации словарей сразу во все нужные файлы.",
    sort_order: 27,
    is_active: true,
    is_featurable: true,
    featured_date: null,
    published_at: "2026-08-20T03:48:51.039Z",
    author_type: 'team',
    author_name: 'Eengineer Staff Lead',
    pack_slug: null,
    created_at: new Date().toISOString(),
    category: CAT_MAP['agent'],
    variables: [
          {
                "name": "COMPONENT_CODE",
                "description": "Исходный код компонента с захардкоженным текстом",
                "is_multiline": true
          },
          {
                "name": "I18N_LIBRARY",
                "description": "Библиотека переводов (например: react-i18next, next-intl)",
                "is_multiline": false
          }
    ],
  },
  {
    id: 'p-monorepo-package-decoupler',
    category_id: CAT_MAP['agent']?.id || 'cat-agent',
    slug: "monorepo-package-decoupler",
    title: "Разделение монолита на модули без циклов (Monorepo Packages)» (The Monorepo Package Decoupler)",
    difficulty: "intermediate",
    tools: ["Cursor","Claude Code","Windsurf"],
    prompt_text: "You are a Principal Software Architect specializing in Monorepo architecture (Turborepo, Nx, pnpm workspaces). Extract the functionality below into an isolated, reusable internal package while strictly eliminating circular dependency cycles.\n\nDECOUPLING PROTOCOL:\n1. Dependency Graph Audit: Identify all inbound and outbound import edges. Determine clean layer boundaries (UI -> Domain -> Core/Utils).\n2. Interface Extraction: Define public API boundary via barrel exports (index.ts) with explicit package.json exports map.\n3. Zero Circular Dependencies: Ensure the extracted package never imports from consumer apps. Invert dependencies using dependency injection or callback interfaces.\n\nCode to extract:\n```{{LANGUAGE}}\n{{EXTRACTION_CODE}}\n```\nTarget Package Name: {{PACKAGE_NAME}} (e.g. @app/shared-auth, @app/ui-core)",
    when_to_use: "Используйте при выносе общего кода в отдельный пакет (shared/ui, shared/utils), чтобы избавиться от циклических зависимостей (circular dependencies).",
    why_it_works: "Предотвращает циклы импортов (Package A -> Package B -> Package A), из-за которых ломается сборка бандлеров Vite и Webpack.",
    pro_tips: "Используйте для построения масштабируемой структуры в Turborepo или Nx.",
    sort_order: 28,
    is_active: true,
    is_featurable: true,
    featured_date: null,
    published_at: "2026-08-19T03:48:51.039Z",
    author_type: 'team',
    author_name: 'Eengineer Staff Lead',
    pack_slug: null,
    created_at: new Date().toISOString(),
    category: CAT_MAP['agent'],
    variables: [
          {
                "name": "LANGUAGE",
                "description": "Язык (TypeScript, JavaScript)",
                "is_multiline": false
          },
          {
                "name": "EXTRACTION_CODE",
                "description": "Код для выноса в отдельный пакет",
                "is_multiline": true
          },
          {
                "name": "PACKAGE_NAME",
                "description": "Имя нового пакета (например: @app/ui-tokens, @app/api-client)",
                "is_multiline": false
          }
    ],
  },
  {
    id: 'p-bulletproof-pr-description',
    category_id: CAT_MAP['cowork']?.id || 'cat-cowork',
    slug: "bulletproof-pr-description",
    title: "Идеальное описание Pull Request с выделением рисков» (The Bulletproof PR Description)",
    difficulty: "intermediate",
    tools: ["ChatGPT","Claude","Cursor"],
    prompt_text: "Generate a pull request description that makes the reviewer's job effortless, transparent, and fast.\n\nGIT DIFF / SUMMARY OF CHANGES:\n```diff\n{{GIT_DIFF}}\n```\nTASK CONTEXT / TICKET:\n```\n{{TICKET_DESCRIPTION}}\n```\n\nFORMAT CONTRACT:\n## 📌 Summary of Change\n[1-2 clear sentences explaining the core functional change.]\n\n## 🎯 Motivation & Context\n[Why was this change necessary? What bug was happening or what business capability was missing?]\n\n## 🛠️ Technical Decisions & Trade-offs\n[Bullet list of key architectural decisions made during implementation. For each: why Option A was chosen over Option B.]\n\n## ⚠️ Areas of Uncertainty / Specific Review Requests\n[Crucial: Identify 1-2 specific lines or logic branches where you want the reviewer's extra scrutiny. E.g. \"Please check the lock acquisition timeout in line 45\". If completely confident, state why.]\n\n## 🧪 Verification & Testing Performed\n- [ ] Unit tests added/updated: [list test file names]\n- [ ] Manual test scenario executed: [exact steps to verify]\n- [ ] Edge cases verified: [e.g. empty input, timeout handling]\n\n## 🔄 Migration / Deployment Notes\n[Are there DB migrations, new env variables, or feature flags required before merging?]",
    when_to_use: "Используйте перед отправкой кода на ревью коллегам. Промпт создаст четкое описание изменений, укажет спорные места и сэкономит часы обсуждений в комментариях.",
    why_it_works: "Секция 'Areas of Uncertainty' явно направляет внимание ревьюера на тонкие места, исключая слепое подтверждение PR.",
    pro_tips: "Выполните `git diff --stat` и вставьте вывод в поле диффа.",
    sort_order: 29,
    is_active: true,
    is_featurable: true,
    featured_date: null,
    published_at: "2026-08-25T03:48:51.039Z",
    author_type: 'team',
    author_name: 'Eengineer Staff Lead',
    pack_slug: null,
    created_at: new Date().toISOString(),
    category: CAT_MAP['cowork'],
    variables: [
          {
                "name": "GIT_DIFF",
                "description": "Git diff или краткий список измененных файлов",
                "is_multiline": true
          },
          {
                "name": "TICKET_DESCRIPTION",
                "description": "Описание задачи из Jira/Linear или суть фичи",
                "is_multiline": false
          }
    ],
  },
  {
    id: 'p-rfc-tech-spec-builder',
    category_id: CAT_MAP['cowork']?.id || 'cat-cowork',
    slug: "rfc-tech-spec-builder",
    title: "Техническая спецификация фичи с таблицей решений (RFC / ADR)» (The Tech Spec with Decision Log (RFC))",
    difficulty: "intermediate",
    tools: ["Claude 3.7 Sonnet","GPT-4o","Gemini 2.5 Pro"],
    prompt_text: "Write a comprehensive Request for Comments (RFC) / Technical Design Document for the engineering team.\n\nPROJECT CONTEXT:\n- Feature: {{FEATURE_TITLE}}\n- Core Problem: {{PROBLEM_STATEMENT}}\n- Target Constraints: {{CONSTRAINTS}} (e.g. must scale to 1M users, < 100ms p95, zero schema downtime)\n\nRFC STRUCTURE:\n1. Executive Summary: Problem, proposed solution, and measurable business impact in < 150 words.\n2. Non-Goals: Explicitly list 3-4 related capabilities that are DELIBERATELY out of scope for v1 to prevent scope creep.\n3. System Architecture & Data Flow:\n   - Sequence of events (ASCII / Mermaid diagram notation).\n   - Database schema changes (DDL draft).\n   - API contract draft (OpenAPI/TypeScript interfaces).\n4. Decision Log Table:\n   | Decision Point | Alternatives Considered | Selected Option | Rationale & Trade-off |\n   | -------------- | ----------------------- | --------------- | --------------------- |\n5. Failure Modes & Mitigations: Table of what happens when dependencies fail, timeouts occur, or invalid states arise.\n6. Phased Rollout & Rollback Plan: How will this be deployed (Feature flags, dark launch) and how to rollback in < 2 minutes without data loss.",
    when_to_use: "Используйте перед написанием большой фичи, чтобы согласовать архитектуру с командой. Промпт составит техспек с диаграммами, схемой БД и таблицей 'почему мы выбрали вариант А, а не Б'.",
    why_it_works: "Таблица 'Decision Log' и раздел 'Non-Goals' экономят дни споров, фиксируя решения до написания кода.",
    pro_tips: "Используйте для согласования архитектуры с тимлидом и техдиректором.",
    sort_order: 30,
    is_active: true,
    is_featurable: true,
    featured_date: null,
    published_at: "2026-08-24T03:48:51.039Z",
    author_type: 'team',
    author_name: 'Eengineer Staff Lead',
    pack_slug: null,
    created_at: new Date().toISOString(),
    category: CAT_MAP['cowork'],
    variables: [
          {
                "name": "FEATURE_TITLE",
                "description": "Название фичи (например: Двухфакторная аутентификация 2FA)",
                "is_multiline": false
          },
          {
                "name": "PROBLEM_STATEMENT",
                "description": "Какую проблему решаем",
                "is_multiline": false
          },
          {
                "name": "CONSTRAINTS",
                "description": "Ограничения (скорость ответа, бюджет, обратная совместимость)",
                "is_multiline": false
          }
    ],
  },
  {
    id: 'p-blameless-post-mortem',
    category_id: CAT_MAP['cowork']?.id || 'cat-cowork',
    slug: "blameless-post-mortem",
    title: "Постмортем аварии без поиска виноватых (Blameless Post-Mortem)» (The Blameless Post-Mortem Engineer)",
    difficulty: "intermediate",
    tools: ["Claude 3.7 Sonnet","GPT-4o"],
    prompt_text: "Generate a blameless, engineering-rigorous Incident Post-Mortem based on the raw timeline and logs provided.\n\nRAW INCIDENT NOTES & LOGS:\n```\n{{INCIDENT_RAW_NOTES}}\n```\n\nBLAMELESS POST-MORTEM RULES:\n- Never assign fault to individuals (\"the developer ran the command\"). Frame failures as systemic gaps in automation, validation, observability, or guardrails.\n- Apply the \"5 Whys\" methodology to reach systemic root causes, not superficial human errors.\n\nDOCUMENT STRUCTURE:\n1. Incident Overview: Severity, Duration (Start, Detection, Mitigation), User Impact (% of failed requests, data impact).\n2. Detailed Timeline (UTC): Bulleted chronological log from trigger event to full recovery.\n3. Root Cause Analysis (5 Whys Chain):\n   - Why 1 (Direct trigger) -> Why 2 -> Why 3 -> Why 4 -> Why 5 (Systemic vulnerability).\n4. What Went Well vs Where We Got Lucky vs What Went Wrong.\n5. Action Items Matrix:\n   | Action Item | Type (Prevent / Detect / Mitigate) | Owner Role | Priority (P0-P2) | Verification Metric |",
    when_to_use: "Используйте после падения продакшена. Промпт превратит сырые логи и сообщения из чата аварии в профессиональный отчет по методу '5 Почему' уровня Google SRE.",
    why_it_works: "Трансформирует стрессовые логи аварии в конструктивный документ, направленный на исправление автоматизации, а не обвинение людей.",
    pro_tips: "Вставьте таймстемпы начала сбоя, первого алерта в мониторинге и момента выкатки хотфикса.",
    sort_order: 31,
    is_active: true,
    is_featurable: true,
    featured_date: null,
    published_at: "2026-08-23T03:48:51.039Z",
    author_type: 'team',
    author_name: 'Eengineer Staff Lead',
    pack_slug: null,
    created_at: new Date().toISOString(),
    category: CAT_MAP['cowork'],
    variables: [
          {
                "name": "INCIDENT_RAW_NOTES",
                "description": "Сырые логи, время падения, сообщения из чата дежурных",
                "is_multiline": true
          }
    ],
  },
  {
    id: 'p-prd-to-technical-tasks',
    category_id: CAT_MAP['cowork']?.id || 'cat-cowork',
    slug: "prd-to-technical-tasks",
    title: "Декомпозиция бизнес-требований на задачи для спринта» (The PRD to Technical Subtasks Splitter)",
    difficulty: "intermediate",
    tools: ["Claude 3.7 Sonnet","GPT-4o"],
    prompt_text: "Decompose the product requirement document (PRD) below into an actionable, dependency-ordered engineering task breakdown for an Agile sprint.\n\nREQUIREMENTS FOR BREAKDOWN:\n1. Architectural Layering: Separate tasks into Database/Schema -> Backend Services/API -> Frontend/UI -> Analytics/Tracking.\n2. Vertical Slicing: Ensure each task slice is testable and delivers verifiable incremental value.\n3. Dependency Ordering: Explicitly specify which tasks block others (e.g. Task 3 blocked by Task 1).\n4. Definition of Done (DoD): Every task must include concrete acceptance criteria.\n\nPRD SPECIFICATION:\n```\n{{PRD_CONTENT}}\n```\nTarget Team Velocity / Sprint Length: {{SPRINT_CONTEXT}}\n\nDELIVERABLE:\n- Dependency Graph (ASCII / Mermaid).\n- Numbered Task Cards (Title, Layer, Description, DoD, Risk/Complexity Score [1-5]).",
    when_to_use: "Используйте, когда продакт-менеджер дал описание фичи (PRD), а вам нужно разбить её на понятные технические таски для Jira/Linear с оценкой времени и связями.",
    why_it_works: "Исключает ситуацию, когда фронтендер ждет бэкендера 2 недели: задачи выстраиваются в вертикальные независимые слайсы.",
    pro_tips: "Отлично подходит для оценки трудозатрат перед началом спринта.",
    sort_order: 32,
    is_active: true,
    is_featurable: true,
    featured_date: null,
    published_at: "2026-08-22T03:48:51.039Z",
    author_type: 'team',
    author_name: 'Eengineer Staff Lead',
    pack_slug: null,
    created_at: new Date().toISOString(),
    category: CAT_MAP['cowork'],
    variables: [
          {
                "name": "PRD_CONTENT",
                "description": "Описание требований от продакта или клиента",
                "is_multiline": true
          },
          {
                "name": "SPRINT_CONTEXT",
                "description": "Длительность спринта (например: спринт 2 недели, 2 разработчика)",
                "is_multiline": false
          }
    ],
  },
  {
    id: 'p-readme-onboarding-architect',
    category_id: CAT_MAP['cowork']?.id || 'cat-cowork',
    slug: "readme-onboarding-architect",
    title: "Понятный README и инструкция для быстрого онбординга» (The Technical Onboarding & README Architect)",
    difficulty: "intermediate",
    tools: ["ChatGPT","Claude"],
    prompt_text: "Generate a gold-standard README.md and Day-1 Developer Setup Runbook for the repository described below.\n\nREQUIREMENTS:\n1. Fast-Path Local Setup: Step-by-step commands to clone, install dependencies, configure environment variables (.env.example), run migrations, and launch local server in < 5 minutes.\n2. Architecture At A Glance: 3-sentence summary of tech stack, folder structure diagram, and core data flow.\n3. Common Pitfalls & FAQs: Troubleshooting for OS-specific quirks (macOS M-series vs Windows/WSL2), Docker port conflicts, and seed data scripts.\n\nREPOSITORY CONTEXT:\n- Tech Stack: {{TECH_STACK}}\n- Key Commands: {{COMMANDS}} (build, dev, test, lint)\n- Services & Dependencies: {{SERVICES}} (Postgres, Redis, external APIs)",
    when_to_use: "Используйте для создания файла README.md в проекте, чтобы новый разработчик или вы сами через полгода могли поднять проект за 5 минут без боли.",
    why_it_works: "Фокусируется на 'First Time to Hello World' метрике, убирая лишнюю воду и оставляя точные команды терминала.",
    pro_tips: "Положите результат в корень проекта как README.md.",
    sort_order: 33,
    is_active: true,
    is_featurable: true,
    featured_date: null,
    published_at: "2026-08-21T03:48:51.039Z",
    author_type: 'team',
    author_name: 'Eengineer Staff Lead',
    pack_slug: null,
    created_at: new Date().toISOString(),
    category: CAT_MAP['cowork'],
    variables: [
          {
                "name": "TECH_STACK",
                "description": "Стек (React 19, Vite, Tailwind, Supabase, Node 22)",
                "is_multiline": false
          },
          {
                "name": "COMMANDS",
                "description": "Команды запуска (npm run dev, npm run test)",
                "is_multiline": false
          },
          {
                "name": "SERVICES",
                "description": "Необходимые сервисы (Docker, Supabase локально, Redis)",
                "is_multiline": false
          }
    ],
  },
  {
    id: 'p-stakeholder-status-translator',
    category_id: CAT_MAP['cowork']?.id || 'cat-cowork',
    slug: "stakeholder-status-translator",
    title: "Перевод сложного тех-статуса на понятный язык бизнеса» (The Engineering-to-Stakeholder Translator)",
    difficulty: "intermediate",
    tools: ["ChatGPT","Claude"],
    prompt_text: "Translate the complex engineering update below into a crisp, high-impact executive summary for non-technical stakeholders (CEO, Product Director, Investors).\n\nTRANSLATION RULES:\n1. Zero Technical Jargon: Replace terms like 'database connection pooling' or 'Docker multi-stage build' with business impact (reliability, speed, cost savings, user retention).\n2. Traffic Light Status: Use 🟢 On Track, 🟡 At Risk, 🔴 Blocked with clear root causes and next steps.\n3. Quantified Impact: Highlight metrics (e.g. 'reduced checkout latency by 40%', 'unblocked payment gateway rollout').\n\nRAW TECHNICAL NOTES:\n```\n{{TECHNICAL_NOTES}}\n```\nTarget Audience: {{STAKEHOLDER_AUDIENCE}}",
    when_to_use: "Используйте для отправки статуса проекта руководству, инвесторам или клиентам. Промпт превратит технический жаргон (рефакторинг, миграции, кэш) в понятную бизнес-ценность.",
    why_it_works: "Помогает разработчикам защищать ценность технической работы (рефакторинг, тесты) перед бизнесом без конфликтов.",
    pro_tips: "Идеально подходит для еженедельных пятничных апдейтов в Slack.",
    sort_order: 34,
    is_active: true,
    is_featurable: true,
    featured_date: null,
    published_at: "2026-08-20T03:48:51.039Z",
    author_type: 'team',
    author_name: 'Eengineer Staff Lead',
    pack_slug: null,
    created_at: new Date().toISOString(),
    category: CAT_MAP['cowork'],
    variables: [
          {
                "name": "TECHNICAL_NOTES",
                "description": "Что сделано разработчиками за неделю (на техническом языке)",
                "is_multiline": true
          },
          {
                "name": "STAKEHOLDER_AUDIENCE",
                "description": "Для кого отчет (например: Генеральный директор, Инвестор, Заказчик)",
                "is_multiline": false
          }
    ],
  },
  {
    id: 'p-constructive-code-review-rewriter',
    category_id: CAT_MAP['cowork']?.id || 'cat-cowork',
    slug: "constructive-code-review-rewriter",
    title: "Тактичный и конструктивный пересказ замечаний на Code Review» (The Constructive Code Review Feedback Rewriter)",
    difficulty: "intermediate",
    tools: ["ChatGPT","Claude"],
    prompt_text: "Rewrite the following raw, frustrated, or blunt code review comments into highly constructive, empathetic, and technically rigorous feedback following Google's Engineering Practices.\n\nREWRITING PRINCIPLES:\n1. Explain the 'Why': Never just say 'change this'. Explain the architectural trade-off, performance hazard, or maintenance cost.\n2. Offer Concrete Alternatives: Always provide a small code snippet demonstrating the cleaner pattern.\n3. Distinguish Critical vs Nitpick: Explicitly tag suggestions with [Blocking - Bug/Security] vs [Non-blocking - Nit/Suggestion].\n4. Praise Good Decisions: Acknowledge clean patterns where evident.\n\nRAW COMMENTS & CODE CONTEXT:\n```\n{{RAW_COMMENTS}}\n```",
    when_to_use: "Используйте, когда на код-ревью хочется написать 'это ужасно переделай', но нужно дать профессиональный, дружелюбный и аргументированный фидбек коллеге.",
    why_it_works: "Сохраняет здоровую командную культуру, переводя раздражение в обучающий фидбек с примерами кода.",
    pro_tips: "Используйте префиксы `[Blocking]` и `[Nit]` для четких приоритетов.",
    sort_order: 35,
    is_active: true,
    is_featurable: true,
    featured_date: null,
    published_at: "2026-08-19T03:48:51.039Z",
    author_type: 'team',
    author_name: 'Eengineer Staff Lead',
    pack_slug: null,
    created_at: new Date().toISOString(),
    category: CAT_MAP['cowork'],
    variables: [
          {
                "name": "RAW_COMMENTS",
                "description": "Ваши черновые мысли или кусок кода с замечаниями",
                "is_multiline": false
          }
    ],
  },
  {
    id: 'p-incident-runbook-generator',
    category_id: CAT_MAP['cowork']?.id || 'cat-cowork',
    slug: "incident-runbook-generator",
    title: "Инструкция дежурного при сбое (Incident Runbook / SOP)» (The Incident Response Runbook / SOP Generator)",
    difficulty: "intermediate",
    tools: ["Claude 3.7 Sonnet","GPT-4o"],
    prompt_text: "Generate a production Incident Response Runbook (Standard Operating Procedure) for on-call engineers facing the alert scenario below.\n\nRUNBOOK REQUIREMENTS:\n1. Triage in < 2 Minutes: Step-by-step terminal commands to determine severity, blast radius, and affected user count.\n2. Immediate Mitigation: Safe stop-gap actions (traffic shed, rollback, feature flag disable, replica promotion) before finding the deep root cause.\n3. Diagnostic Commands: Specific CLI queries (grep, kubectl, sql, curl) to isolate the failing component.\n4. Escalation Path: Clear criteria for when to escalate to Principal Engineers or VP of Engineering.\n\nALERT / SCENARIO:\n- Alert Name: {{ALERT_NAME}} (e.g. PostgresConnectionPoolExhausted, High5xxRateOnCheckout)\n- Infrastructure: {{INFRASTRUCTURE_CONTEXT}}",
    when_to_use: "Используйте для создания пошаговой шпаргалки для дежурных инженеров: что делать в 3 часа ночи, если упала база, забилась память или отвалился платежный шлюз.",
    why_it_works: "В стрессовой ситуации дежурный инженер не должен думать — он должен следовать проверенному чек-листу команд.",
    pro_tips: "Сохраняйте такие runbook-инструкции рядом с мониторингом в Grafana / Datadog.",
    sort_order: 36,
    is_active: true,
    is_featurable: true,
    featured_date: null,
    published_at: "2026-08-25T03:48:51.039Z",
    author_type: 'team',
    author_name: 'Eengineer Staff Lead',
    pack_slug: null,
    created_at: new Date().toISOString(),
    category: CAT_MAP['cowork'],
    variables: [
          {
                "name": "ALERT_NAME",
                "description": "Название алерта (например: HighApiLatencyAlert, DBDeadlockSpike)",
                "is_multiline": false
          },
          {
                "name": "INFRASTRUCTURE_CONTEXT",
                "description": "Стек (AWS ECS, Supabase, Kubernetes, Vercel)",
                "is_multiline": false
          }
    ],
  },
  {
    id: 'p-sprint-retro-extractor',
    category_id: CAT_MAP['cowork']?.id || 'cat-cowork',
    slug: "sprint-retro-extractor",
    title: "Извлечение системных выводов из ретроспективы спринта» (The Sprint Retrospective Action Item Extractor)",
    difficulty: "intermediate",
    tools: ["ChatGPT","Claude"],
    prompt_text: "Analyze the raw feedback from our team sprint retrospective and extract 3-4 systemic, high-leverage Action Items with clear owners and success metrics.\n\nANALYSIS RULES:\n1. Systemic Focus: Distinguish one-off bad luck from recurring friction in tooling, CI/CD, review bottlenecks, or unclear specifications.\n2. Actionable & Measurable: Action items must not be vague (e.g. 'write better code'). They must be concrete (e.g. 'Add pre-commit hook with Oxlint to catch type errors before PR').\n\nRAW RETRO FEEDBACK:\n```\n{{RETRO_FEEDBACK}}\n```",
    when_to_use: "Используйте после созвона ретроспективы команды. Промпт соберет жалобы разработчиков ('долго тестируем', 'падал CI') и превратит их в конкретные инженерные задачи.",
    why_it_works: "Превращает бесконечные жалобы на созвонах в 3 конкретные инженерные задачи с измеримым результатом.",
    pro_tips: "Ограничьтесь максимум 3 действиями на спринт, чтобы команда реально успела их внедрить.",
    sort_order: 37,
    is_active: true,
    is_featurable: true,
    featured_date: null,
    published_at: "2026-08-24T03:48:51.039Z",
    author_type: 'team',
    author_name: 'Eengineer Staff Lead',
    pack_slug: null,
    created_at: new Date().toISOString(),
    category: CAT_MAP['cowork'],
    variables: [
          {
                "name": "RETRO_FEEDBACK",
                "description": "Заметки с ретро: что было хорошо, что плохо, что бесило",
                "is_multiline": false
          }
    ],
  },
  {
    id: 'p-changelog-release-writer',
    category_id: CAT_MAP['cowork']?.id || 'cat-cowork',
    slug: "changelog-release-writer",
    title: "Генератор списка изменений релиза (Changelog & Breaking Changes)» (The API Documentation & Changelog Writer)",
    difficulty: "intermediate",
    tools: ["ChatGPT","Claude"],
    prompt_text: "Generate an industry-standard CHANGELOG.md release entry (Keep a Changelog format) and developer migration guide based on the commit history and PR notes below.\n\nSTRUCTURE:\n- 🚀 Added: New user-facing capabilities or APIs.\n- 🔄 Changed: Modifications in existing behavior.\n- ⚠️ BREAKING CHANGES: Explicit before/after code diffs showing developers how to migrate their code.\n- 🐛 Fixed: Bugs resolved with ticket references.\n- 🛡️ Security: Vulnerabilities patched.\n\nGIT LOGS / RELEASE NOTES:\n```\n{{RELEASE_NOTES}}\n```\nVersion Number: {{VERSION}} (e.g. v2.4.0)",
    when_to_use: "Используйте перед релизом новой версии для составления красивого списка изменений (Changelog) с понятными предупреждениями о несовместимости (Breaking Changes).",
    why_it_works: "Формат 'Keep a Changelog' с наглядными примерами 'было / стало' снижает число обращений в техподдержку при обновлениях.",
    pro_tips: "Используйте для релизов в GitHub Releases или в документации для клиентов.",
    sort_order: 38,
    is_active: true,
    is_featurable: true,
    featured_date: null,
    published_at: "2026-08-23T03:48:51.039Z",
    author_type: 'team',
    author_name: 'Eengineer Staff Lead',
    pack_slug: null,
    created_at: new Date().toISOString(),
    category: CAT_MAP['cowork'],
    variables: [
          {
                "name": "RELEASE_NOTES",
                "description": "Список коммитов (`git log v1..v2 --oneline`) или список закрытых PR",
                "is_multiline": true
          },
          {
                "name": "VERSION",
                "description": "Номер версии (например: v1.3.0)",
                "is_multiline": false
          }
    ],
  },
  {
    id: 'p-stack-trace-interrogator',
    category_id: CAT_MAP['error-clinic']?.id || 'cat-error-clinic',
    slug: "stack-trace-interrogator",
    title: "Глубокий анализ стектрейса и поиск места зарождения ошибки» (The Stack Trace Deep Interrogator)",
    difficulty: "intermediate",
    tools: ["ChatGPT","Claude","Cursor"],
    prompt_text: "Analyze and resolve this error. Do not simply provide a patch — conduct a structured forensic analysis.\n\nERROR STACK TRACE / TERMINAL OUTPUT:\n```\n{{ERROR_TEXT}}\n```\n\nRELEVANT CODE SNIPPET:\n```{{LANGUAGE}}\n{{CODE_SNIPPET}}\n```\n\nFORENSIC EXECUTION STEPS:\n1. Frame Dissection: Read the stack trace from the root cause frame upward. Distinguish between where the error was detected (e.g. inside a library) vs where the invalid state was injected in user code.\n2. Root Cause Classification: Classify into Type/Null Reference, Async Order, Memory Exhaustion, Protocol Mismatch, or Environment Incompatibility.\n3. Minimum Reproducible State: What exact object state or execution sequence caused this invariant to fail?\n4. Surgical Fix: Provide the exact minimal code fix.\n5. Defensive Pattern: Show how to refactor this code or type definition so that this entire class of bug is caught at compile-time rather than runtime.",
    when_to_use: "Используйте при падении программы с длинным стектрейсом. Промпт найдет место, где ошибка реально зародилась в вашем коде, а не где она упала внутри внешней библиотеки.",
    why_it_works: "Большинство смотрят только на последнюю строчку стектрейса. Промпт разделяет место обнаружения и место зарождения невалидного состояния.",
    pro_tips: "Копируйте стектрейс полностью, не обрезая системные строки.",
    sort_order: 39,
    is_active: true,
    is_featurable: true,
    featured_date: null,
    published_at: "2026-08-22T03:48:51.039Z",
    author_type: 'team',
    author_name: 'Eengineer Staff Lead',
    pack_slug: null,
    created_at: new Date().toISOString(),
    category: CAT_MAP['error-clinic'],
    variables: [
          {
                "name": "ERROR_TEXT",
                "description": "Полный текст ошибки и стектрейс из консоли/терминала",
                "is_multiline": false
          },
          {
                "name": "LANGUAGE",
                "description": "Язык (TypeScript, Python, Go)",
                "is_multiline": false
          },
          {
                "name": "CODE_SNIPPET",
                "description": "Код функции или файла, где произошел сбой",
                "is_multiline": true
          }
    ],
  },
  {
    id: 'p-typescript-error-untangler',
    category_id: CAT_MAP['error-clinic']?.id || 'cat-error-clinic',
    slug: "typescript-error-untangler",
    title: "Распутывание сложных ошибок типов TypeScript» (The TypeScript Type Mismatch Untangler)",
    difficulty: "intermediate",
    tools: ["Claude 3.7 Sonnet","GPT-4o","Cursor"],
    prompt_text: "I have a TypeScript compilation error. Untangle the type system mismatch and explain the root structural issue.\n\nTYPESCRIPT ERROR (tsc / IDE output):\n```\n{{TS_ERROR}}\n```\n\nRELEVANT TYPES AND CODE:\n```typescript\n{{TS_CODE}}\n```\n\nDIAGNOSIS INSTRUCTIONS:\n1. Type Divergence Matrix:\n   - What type TypeScript expected: [Exact Type Representation]\n   - What type was actually provided: [Exact Type Representation]\n   - The exact property or structural variance where they diverge.\n2. The \"Why\": Why did TypeScript reject this? (Explain covariance/contravariance, excess property checks, union narrowing loss, or missing index signatures).\n3. The Proper Fix:\n   - ❌ DO NOT suggest as any, @ts-ignore, or loose non-null assertions (!).\n   - ✅ Provide a clean fix using idiomatic TypeScript (Type Guards, Discriminated Unions, satisfies, keyof, or Generics).",
    when_to_use: "Используйте, когда компилятор TypeScript ругается на несовпадение типов (TS2322, TS2345). Промпт объяснит несоответствие и исправит тип без костыльного `as any`.",
    why_it_works: "Запрет на `any` и `@ts-ignore` заставляет модель найти настоящее решение в рамках системы типов TypeScript.",
    pro_tips: "Вставьте все связанные `interface` и `type`, чтобы модель видела полную картину.",
    sort_order: 40,
    is_active: true,
    is_featurable: true,
    featured_date: null,
    published_at: "2026-08-21T03:48:51.039Z",
    author_type: 'team',
    author_name: 'Eengineer Staff Lead',
    pack_slug: null,
    created_at: new Date().toISOString(),
    category: CAT_MAP['error-clinic'],
    variables: [
          {
                "name": "TS_ERROR",
                "description": "Текст ошибки из терминала или VS Code (например: Type 'X' is not assignable to type 'Y')",
                "is_multiline": false
          },
          {
                "name": "TS_CODE",
                "description": "Интерфейсы, типы и код функции, вызывающей ошибку",
                "is_multiline": true
          }
    ],
  },
  {
    id: 'p-db-deadlock-rls-debugger',
    category_id: CAT_MAP['error-clinic']?.id || 'cat-error-clinic',
    slug: "db-deadlock-rls-debugger",
    title: "Лечение блокировок базы и рекурсивных RLS-политик» (The Database Deadlock & RLS Policy Debugger)",
    difficulty: "intermediate",
    tools: ["Claude 3.7 Sonnet","GPT-4o"],
    prompt_text: "Debug this PostgreSQL / Supabase error involving Row Level Security (RLS), permission violations, or lock deadlocks.\n\nERROR MESSAGE:\n```\n{{DB_ERROR}}\n```\n\nRELEVANT SCHEMA / POLICIES / QUERY:\n```sql\n{{SCHEMA_AND_QUERY}}\n```\n\nDEBUGGING PROTOCOL:\n1. Failure Mechanism: Explain exactly why PostgreSQL rejected this query or failed with a lock conflict. (Trace JWT auth.uid() evaluation, recursive RLS policy loops, or unindexed foreign key locks).\n2. Performance Impact: Does the current RLS policy force a full table subquery evaluation on every row?\n3. Remediated SQL: Provide the corrected CREATE POLICY / query / index definition with optimized USING and WITH CHECK clauses.",
    when_to_use: "Используйте при зависаниях запросов в PostgreSQL / Supabase, ошибках бесконечной рекурсии в политиках RLS или конфликтах блокировок (Deadlock detected).",
    why_it_works: "Рекурсивные RLS-политики в Supabase — частая и трудноуловимая ошибка. Промпт оптимизирует `USING` и `WITH CHECK` выражения.",
    pro_tips: "Для Supabase оберните подзапросы в RLS-политиках в `(select auth.uid())` для кэширования.",
    sort_order: 41,
    is_active: true,
    is_featurable: true,
    featured_date: null,
    published_at: "2026-08-20T03:48:51.039Z",
    author_type: 'team',
    author_name: 'Eengineer Staff Lead',
    pack_slug: null,
    created_at: new Date().toISOString(),
    category: CAT_MAP['error-clinic'],
    variables: [
          {
                "name": "DB_ERROR",
                "description": "Текст ошибки БД (например: infinite recursion detected in policy for relation 'users')",
                "is_multiline": false
          },
          {
                "name": "SCHEMA_AND_QUERY",
                "description": "Таблицы, RLS политики и запрос, который падает",
                "is_multiline": true
          }
    ],
  },
  {
    id: 'p-api-network-diagnostician',
    category_id: CAT_MAP['error-clinic']?.id || 'cat-error-clinic',
    slug: "api-network-diagnostician",
    title: "Диагностика сетевых сбоев, таймаутов и API ошибок» (The API & Network Failure Diagnostician)",
    difficulty: "intermediate",
    tools: ["ChatGPT","Claude","Cursor"],
    prompt_text: "Diagnose this API or network-related failure. Determine whether the root cause is client-side, server-side, infrastructure, or a protocol mismatch.\n\nERROR CONTEXT:\n- HTTP Status / Error Message:\n```\n{{ERROR_OUTPUT}}\n```\n- Request Details (method, URL, headers, body):\n```\n{{REQUEST_DETAILS}}\n```\n- Environment: {{ENVIRONMENT}} (e.g. local dev, staging behind Cloudflare, production on Vercel Edge)\n\nDIAGNOSTIC PROTOCOL:\n1. Error Classification: Client Error (4xx), Server Crash (5xx), Transport/DNS, or Silent Failure (wrong data on 200 OK).\n2. Reproduction Command: Provide an exact curl command with all headers and body.\n3. Root Cause Lifecycle Tracing: Where did the failure occur? (DNS → TCP → TLS → HTTP Request → Server Processing → Client Parsing).\n4. Surgical Fix & Defensive Pattern: Provide code fix and retry/timeout middleware.",
    when_to_use: "Используйте, когда запрос к API завершается с 4xx/5xx ошибкой, таймаутом или возвращает пустой экран. Промпт проверит весь путь запроса от DNS до парсинга JSON.",
    why_it_works: "Сетевые ошибки часто маскируют реальную причину (CORS-ошибка часто следствие 500 падения бэкенда). Протокол трассирует весь lifecycle.",
    pro_tips: "Сгенерированная curl-команда позволит воспроизвести ошибку прямо в терминале.",
    sort_order: 42,
    is_active: true,
    is_featurable: true,
    featured_date: null,
    published_at: "2026-08-19T03:48:51.039Z",
    author_type: 'team',
    author_name: 'Eengineer Staff Lead',
    pack_slug: null,
    created_at: new Date().toISOString(),
    category: CAT_MAP['error-clinic'],
    variables: [
          {
                "name": "ERROR_OUTPUT",
                "description": "Код статуса (400, 502, 504) и тело ошибки",
                "is_multiline": false
          },
          {
                "name": "REQUEST_DETAILS",
                "description": "URL, метод, заголовки и тело запроса",
                "is_multiline": true
          },
          {
                "name": "ENVIRONMENT",
                "description": "Окружение (например: Next.js на Vercel, бэкенд на NestJS за Nginx)",
                "is_multiline": false
          }
    ],
  },
  {
    id: 'p-git-conflict-surgeon',
    category_id: CAT_MAP['error-clinic']?.id || 'cat-error-clinic',
    slug: "git-conflict-surgeon",
    title: "Безопасное разрешение конфликтов в Git (Merge / Rebase)» (The Git Conflict & History Surgeon)",
    difficulty: "intermediate",
    tools: ["ChatGPT","Claude","Cursor"],
    prompt_text: "Resolve this Git error or conflict situation. You are a Version Control Systems specialist who understands Git's internal object model (commits, trees, blobs, refs).\n\nGIT ERROR / SITUATION:\n```\n{{GIT_ERROR}}\n```\n\nCURRENT STATE:\n- Branch: {{BRANCH_CONTEXT}} (e.g. feature/auth rebasing onto main, 47 commits behind)\n- What I was trying to do: {{INTENDED_ACTION}}\n\nRESOLUTION PROTOCOL:\n1. State Diagnosis: Explain Git's internal state right now (detached HEAD, mid-rebase, mid-merge).\n2. Conflict Resolution: For each conflicting file, explain what \"ours\" and \"theirs\" represent in this specific context (they are inverted between merge and rebase!).\n3. Recovery Commands: Provide the exact sequence of Git commands with safety backup checkpoints.\n4. DO NOT: Suggest git push --force blindly or recommend deleting and re-cloning the repo.",
    when_to_use: "Используйте, когда застряли в посреди git rebase / git merge, и боитесь потерять код или случайно затереть чужие правки при 'ours' vs 'theirs'.",
    why_it_works: "Семантика 'ours/theirs' инвертирована между merge и rebase. Промпт защищает от случайного затирания кода.",
    pro_tips: "Сначала выполните команду создания резервной ветки (`git branch backup-before-fix`).",
    sort_order: 43,
    is_active: true,
    is_featurable: true,
    featured_date: null,
    published_at: "2026-08-25T03:48:51.039Z",
    author_type: 'team',
    author_name: 'Eengineer Staff Lead',
    pack_slug: null,
    created_at: new Date().toISOString(),
    category: CAT_MAP['error-clinic'],
    variables: [
          {
                "name": "GIT_ERROR",
                "description": "Вывод команды git status или текст ошибки из терминала",
                "is_multiline": false
          },
          {
                "name": "BRANCH_CONTEXT",
                "description": "Текущая ветка и целевая ветка",
                "is_multiline": false
          },
          {
                "name": "INTENDED_ACTION",
                "description": "Что вы пытались сделать (например: подтянуть main в feature ветку)",
                "is_multiline": false
          }
    ],
  },
  {
    id: 'p-docker-deploy-debugger',
    category_id: CAT_MAP['error-clinic']?.id || 'cat-error-clinic',
    slug: "docker-deploy-debugger",
    title: "Починка ошибок сборки Docker и сбоев в CI/CD» (The Docker & Deployment Pipeline Debugger)",
    difficulty: "intermediate",
    tools: ["ChatGPT","Claude","Cursor"],
    prompt_text: "Debug this Docker build failure, container runtime error, or CI/CD deployment pipeline issue.\n\nERROR OUTPUT:\n```\n{{DEPLOY_ERROR}}\n```\n\nCONFIGURATION FILES:\n```{{CONFIG_FORMAT}}\n{{CONFIG_CONTENT}}\n```\n\nDEPLOYMENT TARGET: {{DEPLOY_TARGET}} (e.g. Vercel, AWS ECS, Docker Compose local, GitHub Actions)\n\nDEBUGGING PROTOCOL:\n1. Failure Layer Identification: Build Stage vs Container Runtime Crash vs Network/Orchestration vs CI/CD Environment Delta.\n2. Environment Delta Analysis: Identify architecture differences (arm64 vs amd64), missing secrets, or cache invalidation issues.\n3. Root Cause Fix: Provide the exact corrected Dockerfile / docker-compose.yml / CI workflow.\n4. DO NOT: Suggest disabling security features (--privileged) or using latest tags in production.",
    when_to_use: "Используйте, когда падает сборка Dockerfile, контейнер падает сразу после запуска (CrashLoopBackOff) или пайплайн в GitHub Actions завершился красным крестиком.",
    why_it_works: "Анализ 'Environment Delta' выявляет скрытые различия между локальным компьютером и сервером CI (разные архитектуры процессора, переменные окружения).",
    pro_tips: "Для Node.js проверьте наличие `NODE_ENV=production` при установке devDependencies.",
    sort_order: 44,
    is_active: true,
    is_featurable: true,
    featured_date: null,
    published_at: "2026-08-24T03:48:51.039Z",
    author_type: 'team',
    author_name: 'Eengineer Staff Lead',
    pack_slug: null,
    created_at: new Date().toISOString(),
    category: CAT_MAP['error-clinic'],
    variables: [
          {
                "name": "DEPLOY_ERROR",
                "description": "Лог падения сборки или запуска контейнера",
                "is_multiline": false
          },
          {
                "name": "CONFIG_FORMAT",
                "description": "Формат (dockerfile, yaml, toml)",
                "is_multiline": false
          },
          {
                "name": "CONFIG_CONTENT",
                "description": "Содержимое Dockerfile, docker-compose.yml или .github/workflows",
                "is_multiline": true
          },
          {
                "name": "DEPLOY_TARGET",
                "description": "Куда деплоим (Docker Compose, Vercel, AWS, GitHub Actions)",
                "is_multiline": false
          }
    ],
  },
  {
    id: 'p-react-hydration-resolver',
    category_id: CAT_MAP['error-clinic']?.id || 'cat-error-clinic',
    slug: "react-hydration-resolver",
    title: "Исправление расхождения рендера React (Hydration Mismatch)» (The React Hydration Mismatch Resolver)",
    difficulty: "intermediate",
    tools: ["Claude 3.7 Sonnet","GPT-4o","Cursor"],
    prompt_text: "Diagnose and eliminate this React Server-Side Rendering (SSR) Hydration Mismatch error in Next.js / React 19.\n\nHYDRATION ERROR LOG:\n```\n{{HYDRATION_ERROR}}\n```\n\nSUSPICIOUS COMPONENT CODE:\n```tsx\n{{COMPONENT_CODE}}\n```\n\nFORENSIC AUDIT:\n1. Diff Dissection: What exact HTML tag, text node, or attribute differed between Server Rendered HTML and Client Hydrated DOM?\n2. Culprit Root Cause:\n   - Date/Time/Timezone formatting differences (new Date(), toLocaleDateString()).\n   - Non-deterministic values (Math.random(), window.innerWidth, localStorage checks during initial render).\n   - Invalid HTML nesting (e.g. <p> containing <div>, <tr> directly inside <table> without <tbody>).\n   - Browser extensions mutating DOM before hydration.\n3. Clean Solution: Provide the proper pattern (useEffect mounting gate, suppressHydrationWarning where safe, or server-safe client components).",
    when_to_use: "Используйте в Next.js / Remix, когда в консоли появляется ошибка 'Hydration failed because the initial UI does not match what was rendered on the server'.",
    why_it_works: "Сравнивает дерево DOM сервера и клиента, локализуя несовпадающий тег или недетерминированное значение времени.",
    pro_tips: "Используйте хук `useSyncExternalStore` или проверку `mounted` для клиентских значений.",
    sort_order: 45,
    is_active: true,
    is_featurable: true,
    featured_date: null,
    published_at: "2026-08-23T03:48:51.039Z",
    author_type: 'team',
    author_name: 'Eengineer Staff Lead',
    pack_slug: null,
    created_at: new Date().toISOString(),
    category: CAT_MAP['error-clinic'],
    variables: [
          {
                "name": "HYDRATION_ERROR",
                "description": "Полный текст ошибки Hydration failed из консоли браузера",
                "is_multiline": false
          },
          {
                "name": "COMPONENT_CODE",
                "description": "Код компонента, вызывающего расхождение",
                "is_multiline": true
          }
    ],
  },
  {
    id: 'p-nodejs-oom-investigator',
    category_id: CAT_MAP['error-clinic']?.id || 'cat-error-clinic',
    slug: "nodejs-oom-investigator",
    title: "Лечение аварийного падения памяти (Node.js Heap OOM)» (The Node.js / V8 Out of Memory (OOM) Crash Investigator)",
    difficulty: "intermediate",
    tools: ["Claude 3.7 Sonnet","GPT-4o"],
    prompt_text: "Investigate and fix this fatal Node.js / V8 JavaScript heap out of memory crash or Docker OOMKilled exit code 137.\n\nCRASH LOG & HEAP METRICS:\n```\n{{OOM_LOGS}}\n```\n\nOFFENDING CODE PIPELINE:\n```typescript\n{{PIPELINE_CODE}}\n```\n\nFORENSIC PROTOCOL:\n1. Allocation Hotspot: Identify where large arrays, buffers, or unpaginated DB query results are held in memory simultaneously.\n2. Stream & Transform Pattern: Convert bulk in-memory operations (JSON.parse of 50MB file, fetching 100k rows) into Node.js Streams / async iterators with backpressure.\n3. V8 Memory Configuration: Provide optimal --max-old-space-size flags for container memory limits.",
    when_to_use: "Используйте, когда сервер падает с ошибкой 'JavaScript heap out of memory' или контейнер убивается по OOMKilled в облаке.",
    why_it_works: "Переводит код с жадной загрузки всего массива в память на потоковую обработку (Streams / Pipelines).",
    pro_tips: "Никогда не делайте `SELECT *` без лимита или `fs.readFileSync` на больших файлах.",
    sort_order: 46,
    is_active: true,
    is_featurable: true,
    featured_date: null,
    published_at: "2026-08-22T03:48:51.039Z",
    author_type: 'team',
    author_name: 'Eengineer Staff Lead',
    pack_slug: null,
    created_at: new Date().toISOString(),
    category: CAT_MAP['error-clinic'],
    variables: [
          {
                "name": "OOM_LOGS",
                "description": "Лог падения памяти из терминала / Docker",
                "is_multiline": true
          },
          {
                "name": "PIPELINE_CODE",
                "description": "Код функции, обрабатывающей большие данные или файлы",
                "is_multiline": true
          }
    ],
  },
  {
    id: 'p-cors-preflight-fixer',
    category_id: CAT_MAP['error-clinic']?.id || 'cat-error-clinic',
    slug: "cors-preflight-fixer",
    title: "Быстрое исправление блокировки CORS и preflight-запросов» (The CORS & Preflight Header Deep Fixer)",
    difficulty: "intermediate",
    tools: ["ChatGPT","Claude","Cursor"],
    prompt_text: "Resolve this Cross-Origin Resource Sharing (CORS) or OPTIONS Preflight failure.\n\nBROWSER CONSOLE CORS ERROR:\n```\n{{CORS_ERROR}}\n```\n\nBACKEND & PROXY CONFIGURATION:\n```{{LANGUAGE}}\n{{BACKEND_CORS_CODE}}\n```\nClient Origin: {{CLIENT_ORIGIN}} (e.g. http://localhost:5173, https://app.example.com)\nServer URL: {{SERVER_URL}} (e.g. https://api.example.com)\n\nDIAGNOSIS & REMEDIATION:\n1. Exact Mismatch: What header is missing or misconfigured (Access-Control-Allow-Origin, Allow-Methods, Allow-Headers, Allow-Credentials with wildcard origin conflict)?\n2. OPTIONS Preflight Handling: Is the HTTP OPTIONS request returning 204/200 before authentication middleware, or is auth middleware rejecting OPTIONS?\n3. Remediated Configuration: Provide the exact CORS middleware configuration.",
    when_to_use: "Используйте, когда в браузере горит красная ошибка 'Access to fetch at X from origin Y has been blocked by CORS policy' при отправке запросов на бэкенд.",
    why_it_works: "Решает частую причину 90% CORS-ошибок: когда middleware авторизации блокирует предварительный OPTIONS запрос до проверки CORS.",
    pro_tips: "Не используйте `Access-Control-Allow-Origin: *` если включен `Allow-Credentials: true`.",
    sort_order: 47,
    is_active: true,
    is_featurable: true,
    featured_date: null,
    published_at: "2026-08-21T03:48:51.039Z",
    author_type: 'team',
    author_name: 'Eengineer Staff Lead',
    pack_slug: null,
    created_at: new Date().toISOString(),
    category: CAT_MAP['error-clinic'],
    variables: [
          {
                "name": "CORS_ERROR",
                "description": "Текст ошибки CORS из консоли браузера",
                "is_multiline": false
          },
          {
                "name": "LANGUAGE",
                "description": "Стек (Node.js Express, NestJS, FastAPI, Nginx)",
                "is_multiline": false
          },
          {
                "name": "BACKEND_CORS_CODE",
                "description": "Текущая настройка CORS на бэкенде или в Nginx",
                "is_multiline": true
          },
          {
                "name": "CLIENT_ORIGIN",
                "description": "Адрес фронтенда (например: http://localhost:5173)",
                "is_multiline": false
          },
          {
                "name": "SERVER_URL",
                "description": "Адрес бэкенда (например: https://api.myapp.com)",
                "is_multiline": false
          }
    ],
  },
  {
    id: 'p-orm-n1-query-fixer',
    category_id: CAT_MAP['error-clinic']?.id || 'cat-error-clinic',
    slug: "orm-n1-query-fixer",
    title: "Поиск и устранение паразитных запросов N+1 в ORM (Prisma/TypeORM)» (The ORM N+1 Query Detector & Fixer)",
    difficulty: "intermediate",
    tools: ["Claude 3.7 Sonnet","GPT-4o","Cursor"],
    prompt_text: "Eliminate the N+1 database query cascade in the ORM code below.\n\nOFFENDING ORM QUERY CODE:\n```typescript\n{{ORM_CODE}}\n```\n\nDATABASE SCHEMA CONTEXT:\n```sql\n{{SCHEMA_SNIPPET}}\n```\nORM Framework: {{ORM_FRAMEWORK}} (e.g. Prisma, Drizzle, TypeORM, SQLAlchemy)\n\nREFACTORING CONTRACT:\n1. Query Cascade Analysis: Explain why the current code executes 1 + N queries instead of a single batched query or JOIN.\n2. Optimized Query Rewrite: Rewrite using eager loading (include/with/relations), lateral joins, or subqueries.\n3. Verification SQL: Show the raw SQL query generated before vs after the optimization.",
    when_to_use: "Используйте, когда страница со списком пользователей или постов загружается несколько секунд, а в логах базы данных бегут сотни одинаковых SQL запросов.",
    why_it_works: "Превращает N+1 отдельных сетевых обращений к базе в 1 эффективный SQL JOIN или батчинг по ключам.",
    pro_tips: "В Prisma используйте `include: { relation: true }` вместо маппинга по массиву с `await prisma.relation.findFirst()`.",
    sort_order: 48,
    is_active: true,
    is_featurable: true,
    featured_date: null,
    published_at: "2026-08-20T03:48:51.039Z",
    author_type: 'team',
    author_name: 'Eengineer Staff Lead',
    pack_slug: null,
    created_at: new Date().toISOString(),
    category: CAT_MAP['error-clinic'],
    variables: [
          {
                "name": "ORM_CODE",
                "description": "Код запроса в базу данных через Prisma / Drizzle / TypeORM",
                "is_multiline": true
          },
          {
                "name": "SCHEMA_SNIPPET",
                "description": "Связи и таблицы в базе данных",
                "is_multiline": true
          },
          {
                "name": "ORM_FRAMEWORK",
                "description": "Используемый ORM (Prisma, Drizzle, TypeORM, Sequelize)",
                "is_multiline": false
          }
    ],
  },
  {
    id: 'p-bundler-circular-dependency-fixer',
    category_id: CAT_MAP['error-clinic']?.id || 'cat-error-clinic',
    slug: "bundler-circular-dependency-fixer",
    title: "Починка циклических зависимостей и ошибок сборщика (Vite / Webpack)» (The Webpack/Vite Module Resolution & Circular Dependency Fixer)",
    difficulty: "intermediate",
    tools: ["ChatGPT","Claude","Cursor"],
    prompt_text: "Resolve this module resolution failure, circular dependency deadlock, or build-time bundler error.\n\nBUNDLER / TERMINAL ERROR:\n```\n{{BUNDLER_ERROR}}\n```\n\nCONFIG & RELEVANT IMPORTS:\n```\n{{CONFIG_AND_IMPORTS}}\n```\nBundler: {{BUNDLER}} (e.g. Vite 6, Webpack 5, Turbopack, esbuild)\n\nRESOLUTION STEPS:\n1. Cycle / Resolution Trace: Map the circular dependency chain (A -> B -> C -> A) or path alias misconfiguration (tsconfig.json paths vs vite.config.ts resolve.alias).\n2. Clean Extraction: Show how to extract shared types/constants into a standalone leaf module to break the cycle.\n3. Config Alignment: Ensure tsconfig and bundler config resolve aliases identically.",
    when_to_use: "Используйте, когда проект не собирается с ошибками 'Cannot resolve module', 'Cannot access before initialization' или циклическими импортами.",
    why_it_works: "Синхронизирует `paths` в tsconfig.json и `resolve.alias` в vite.config.ts, устраняя циклы через вынос общих типов.",
    pro_tips: "Используйте утилиту `madge` для визуализации графа циклических импортов.",
    sort_order: 49,
    is_active: true,
    is_featurable: true,
    featured_date: null,
    published_at: "2026-08-19T03:48:51.039Z",
    author_type: 'team',
    author_name: 'Eengineer Staff Lead',
    pack_slug: null,
    created_at: new Date().toISOString(),
    category: CAT_MAP['error-clinic'],
    variables: [
          {
                "name": "BUNDLER_ERROR",
                "description": "Текст ошибки из консоли сборщика Vite или Webpack",
                "is_multiline": false
          },
          {
                "name": "CONFIG_AND_IMPORTS",
                "description": "Файлы vite.config.ts, tsconfig.json и проблемные импорты",
                "is_multiline": false
          },
          {
                "name": "BUNDLER",
                "description": "Сборщик (Vite, Webpack 5, Next.js Turbopack)",
                "is_multiline": false
          }
    ],
  },
  {
    id: 'p-jwt-session-auth-debugger',
    category_id: CAT_MAP['error-clinic']?.id || 'cat-error-clinic',
    slug: "jwt-session-auth-debugger",
    title: "Отладка сбоев токенов авторизации (JWT / OAuth / Cookie)» (The JWT / Session Auth State Corrupt Debugger)",
    difficulty: "intermediate",
    tools: ["Claude 3.7 Sonnet","GPT-4o","Cursor"],
    prompt_text: "Debug and fix this authentication token / session corruption error (JWT, OAuth2 session, HttpOnly cookie mismatch).\n\nAUTH ERROR / SYMPTOM:\n```\n{{AUTH_ERROR}}\n```\n\nAUTH FLOW CODE / TOKEN VERIFICATION:\n```typescript\n{{AUTH_CODE}}\n```\nDomain / Cookie Context: {{DOMAIN_CONTEXT}} (e.g. api.example.com server with app.example.com client, SameSite=None, Secure)\n\nDIAGNOSIS PROTOCOL:\n1. Failure Point: Signature mismatch (secret vs public key), clock skew expiration, SameSite/Secure cookie policy dropping cookies on cross-subdomain requests.\n2. Token Lifecycle Verification: Refresh token rotation race conditions (concurrent requests using expired access token).\n3. Remediated Code: Correct token signing, verification, and cookie header configuration.",
    when_to_use: "Используйте, когда юзера постоянно разлогинивает, токен выдает ошибку 'jwt expired / invalid signature' или куки не сохраняются между доменами.",
    why_it_works: "Учитывает тонкости междоменных куки (`SameSite=None`, `Secure`), timezone/clock-skew на серверах и гонки обновления refresh-токенов.",
    pro_tips: "Для междоменных запросов убедитесь, что включен `credentials: 'include'` на клиенте.",
    sort_order: 50,
    is_active: true,
    is_featurable: true,
    featured_date: null,
    published_at: "2026-08-25T03:48:51.039Z",
    author_type: 'team',
    author_name: 'Eengineer Staff Lead',
    pack_slug: null,
    created_at: new Date().toISOString(),
    category: CAT_MAP['error-clinic'],
    variables: [
          {
                "name": "AUTH_ERROR",
                "description": "Текст ошибки авторизации или описание бага (например: бесконечный редирект на /login)",
                "is_multiline": false
          },
          {
                "name": "AUTH_CODE",
                "description": "Код проверки токена, обновления сессии или установки cookie",
                "is_multiline": true
          },
          {
                "name": "DOMAIN_CONTEXT",
                "description": "Домены клиента и сервера (например: localhost:5173 и api.myapp.com)",
                "is_multiline": false
          }
    ],
  },
]
