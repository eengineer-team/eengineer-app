-- Migration: 20260824120000_prompts.sql
-- Prompt Lab schema: categories, prompts, variables, telemetry, and community submissions.

-- 1. Create prompt_categories table
CREATE TABLE IF NOT EXISTS public.prompt_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  label TEXT NOT NULL,
  icon_emoji TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  is_visible BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Create prompts table
CREATE TABLE IF NOT EXISTS public.prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES public.prompt_categories(id) ON DELETE CASCADE,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  difficulty TEXT NOT NULL CHECK (difficulty IN ('starter', 'intermediate', 'advanced')),
  tools TEXT[] NOT NULL DEFAULT '{}',
  prompt_text TEXT NOT NULL,
  when_to_use TEXT,
  why_it_works TEXT,
  pro_tips TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_featurable BOOLEAN NOT NULL DEFAULT true,
  featured_date DATE,
  published_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  author_type TEXT NOT NULL DEFAULT 'team' CHECK (author_type IN ('team', 'community')),
  author_name TEXT,
  pack_slug TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Create prompt_variables table
CREATE TABLE IF NOT EXISTS public.prompt_variables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_id UUID NOT NULL REFERENCES public.prompts(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  is_multiline BOOLEAN NOT NULL DEFAULT false,
  sort_order INT NOT NULL DEFAULT 0,
  UNIQUE(prompt_id, name)
);

-- 4. Create prompt_usage_stats table
CREATE TABLE IF NOT EXISTS public.prompt_usage_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_id UUID NOT NULL REFERENCES public.prompts(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL CHECK (action IN ('copy', 'view')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Create prompt_submissions table
CREATE TABLE IF NOT EXISTS public.prompt_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  category_slug TEXT NOT NULL,
  prompt_text TEXT NOT NULL,
  variables JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewer_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_prompts_category ON public.prompts(category_id);
CREATE INDEX IF NOT EXISTS idx_prompts_slug ON public.prompts(slug);
CREATE INDEX IF NOT EXISTS idx_prompts_sort_order ON public.prompts(sort_order);
CREATE INDEX IF NOT EXISTS idx_prompt_vars_prompt ON public.prompt_variables(prompt_id);
CREATE INDEX IF NOT EXISTS idx_prompt_usage_prompt ON public.prompt_usage_stats(prompt_id);
CREATE INDEX IF NOT EXISTS idx_prompt_submissions_profile ON public.prompt_submissions(profile_id);

-- Enable RLS
ALTER TABLE public.prompt_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompt_variables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompt_usage_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompt_submissions ENABLE ROW LEVEL SECURITY;

-- Policies: Prompt categories (Public Read)
DROP POLICY IF EXISTS "prompt_categories_select" ON public.prompt_categories;
CREATE POLICY "prompt_categories_select" ON public.prompt_categories
  FOR SELECT USING (true);

-- Policies: Prompts (Public Read for active)
DROP POLICY IF EXISTS "prompts_select" ON public.prompts;
CREATE POLICY "prompts_select" ON public.prompts
  FOR SELECT USING (is_active = true);

-- Policies: Prompt Variables (Public Read)
DROP POLICY IF EXISTS "prompt_variables_select" ON public.prompt_variables;
CREATE POLICY "prompt_variables_select" ON public.prompt_variables
  FOR SELECT USING (true);

-- Policies: Usage Stats (Insert authenticated, Read own)
DROP POLICY IF EXISTS "prompt_usage_stats_insert" ON public.prompt_usage_stats;
CREATE POLICY "prompt_usage_stats_insert" ON public.prompt_usage_stats
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "prompt_usage_stats_select" ON public.prompt_usage_stats;
CREATE POLICY "prompt_usage_stats_select" ON public.prompt_usage_stats
  FOR SELECT USING (auth.uid() = profile_id);

-- Policies: Submissions
DROP POLICY IF EXISTS "prompt_submissions_select_own" ON public.prompt_submissions;
CREATE POLICY "prompt_submissions_select_own" ON public.prompt_submissions
  FOR SELECT USING (auth.uid() = profile_id);

DROP POLICY IF EXISTS "prompt_submissions_insert_auth" ON public.prompt_submissions;
CREATE POLICY "prompt_submissions_insert_auth" ON public.prompt_submissions
  FOR INSERT WITH CHECK (auth.uid() = profile_id);

-- Seed Categories
INSERT INTO public.prompt_categories (id, slug, label, icon_emoji, sort_order, is_visible)
VALUES
  ('c1111111-1111-1111-1111-111111111111', 'chatbot', 'AI Chatbot', '🤖', 1, true),
  ('c2222222-2222-2222-2222-222222222222', 'agent', 'AI Agent', '🕹️', 2, true),
  ('c3333333-3333-3333-3333-333333333333', 'cowork', 'Cowork AI', '🤝', 3, true),
  ('c4444444-4444-4444-4444-444444444444', 'error-clinic', 'Error Clinic', '🔧', 4, true),
  ('c5555555-5555-5555-5555-555555555555', 'design', 'Design AI', '🎨', 5, false)
ON CONFLICT (slug) DO UPDATE SET
  label = EXCLUDED.label,
  icon_emoji = EXCLUDED.icon_emoji,
  sort_order = EXCLUDED.sort_order,
  is_visible = EXCLUDED.is_visible;


-- Prompt 1: blind-spot-finder
INSERT INTO public.prompts (
  category_id, slug, title, difficulty, tools, prompt_text,
  when_to_use, why_it_works, pro_tips, sort_order, is_active, is_featurable, author_type, author_name
) VALUES (
  'c1111111-1111-1111-1111-111111111111',
  'blind-spot-finder',
  'Production Blind Spot Finder',
  'intermediate',
  ARRAY['Claude 3.7 Sonnet','GPT-4o','o3-mini','Gemini 2.5 Pro']::TEXT[],
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
  'Use when your code passes local tests, but you want to uncover hidden edge cases, race conditions, memory leaks, and failure modes under high production load before shipping.',
  'Overrides standard LLM bias toward superficial style reviews. Negative constraints combined with adversarial failure scenarios force the model to simulate runtime execution environments.',
  'Set temperature to 0.1-0.2 for concurrency audits. When using reasoning models (o3-mini, DeepSeek-R1), this prompt triggers deep state-space exploration.',
  1,
  true,
  true,
  'team',
  'Eengineer Staff Lead'
) ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  difficulty = EXCLUDED.difficulty,
  tools = EXCLUDED.tools,
  prompt_text = EXCLUDED.prompt_text,
  when_to_use = EXCLUDED.when_to_use,
  why_it_works = EXCLUDED.why_it_works,
  pro_tips = EXCLUDED.pro_tips,
  sort_order = EXCLUDED.sort_order;

INSERT INTO public.prompt_variables (prompt_id, name, description, is_multiline, sort_order)
SELECT id, 'LANGUAGE', 'Language and framework (e.g. TypeScript / Node.js 22, Go 1.24, Python FastAPI)', false, 1
FROM public.prompts WHERE slug = 'blind-spot-finder'
ON CONFLICT (prompt_id, name) DO UPDATE SET
  description = EXCLUDED.description,
  is_multiline = EXCLUDED.is_multiline,
  sort_order = EXCLUDED.sort_order;

INSERT INTO public.prompt_variables (prompt_id, name, description, is_multiline, sort_order)
SELECT id, 'CODE', 'Source code under audit (paste full block)', true, 2
FROM public.prompts WHERE slug = 'blind-spot-finder'
ON CONFLICT (prompt_id, name) DO UPDATE SET
  description = EXCLUDED.description,
  is_multiline = EXCLUDED.is_multiline,
  sort_order = EXCLUDED.sort_order;

INSERT INTO public.prompt_variables (prompt_id, name, description, is_multiline, sort_order)
SELECT id, 'CONCURRENCY_LEVEL', 'Operational load (e.g. 5,000 req/sec, 50 concurrent background workers)', false, 3
FROM public.prompts WHERE slug = 'blind-spot-finder'
ON CONFLICT (prompt_id, name) DO UPDATE SET
  description = EXCLUDED.description,
  is_multiline = EXCLUDED.is_multiline,
  sort_order = EXCLUDED.sort_order;

INSERT INTO public.prompt_variables (prompt_id, name, description, is_multiline, sort_order)
SELECT id, 'PERSISTENCE_LAYER', 'Database and caching stack (e.g. PostgreSQL 16 + Redis + Prisma)', false, 4
FROM public.prompts WHERE slug = 'blind-spot-finder'
ON CONFLICT (prompt_id, name) DO UPDATE SET
  description = EXCLUDED.description,
  is_multiline = EXCLUDED.is_multiline,
  sort_order = EXCLUDED.sort_order;

-- Prompt 2: postgres-schema-optimizer
INSERT INTO public.prompts (
  category_id, slug, title, difficulty, tools, prompt_text,
  when_to_use, why_it_works, pro_tips, sort_order, is_active, is_featurable, author_type, author_name
) VALUES (
  'c1111111-1111-1111-1111-111111111111',
  'postgres-schema-optimizer',
  'PostgreSQL Schema & Query Optimizer',
  'intermediate',
  ARRAY['Claude 3.7 Sonnet','GPT-4o','Gemini 2.5 Pro']::TEXT[],
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
  'Use when designing new database schemas or optimizing slow SQL queries for high-throughput transactional and analytical workloads.',
  'Forces database-level relational invariant enforcement and explicit query plan execution modeling, structurally preventing sequential scans and table bloat.',
  'Supply realistic row count estimates and explain plans. Ideal with Claude 3.7 Sonnet for complex multi-table DDL.',
  2,
  true,
  true,
  'team',
  'Eengineer Staff Lead'
) ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  difficulty = EXCLUDED.difficulty,
  tools = EXCLUDED.tools,
  prompt_text = EXCLUDED.prompt_text,
  when_to_use = EXCLUDED.when_to_use,
  why_it_works = EXCLUDED.why_it_works,
  pro_tips = EXCLUDED.pro_tips,
  sort_order = EXCLUDED.sort_order;

INSERT INTO public.prompt_variables (prompt_id, name, description, is_multiline, sort_order)
SELECT id, 'DOMAIN_DESCRIPTION', 'Domain entity requirements, relationships, and invariants', false, 1
FROM public.prompts WHERE slug = 'postgres-schema-optimizer'
ON CONFLICT (prompt_id, name) DO UPDATE SET
  description = EXCLUDED.description,
  is_multiline = EXCLUDED.is_multiline,
  sort_order = EXCLUDED.sort_order;

INSERT INTO public.prompt_variables (prompt_id, name, description, is_multiline, sort_order)
SELECT id, 'CRITICAL_QUERIES', 'Top critical queries requiring sub-millisecond p99 latency', false, 2
FROM public.prompts WHERE slug = 'postgres-schema-optimizer'
ON CONFLICT (prompt_id, name) DO UPDATE SET
  description = EXCLUDED.description,
  is_multiline = EXCLUDED.is_multiline,
  sort_order = EXCLUDED.sort_order;

INSERT INTO public.prompt_variables (prompt_id, name, description, is_multiline, sort_order)
SELECT id, 'EXPECTED_ROW_COUNT', 'Expected data scale (e.g. 50,000,000 rows across 3 years)', false, 3
FROM public.prompts WHERE slug = 'postgres-schema-optimizer'
ON CONFLICT (prompt_id, name) DO UPDATE SET
  description = EXCLUDED.description,
  is_multiline = EXCLUDED.is_multiline,
  sort_order = EXCLUDED.sort_order;

-- Prompt 3: distributed-resilience-architect
INSERT INTO public.prompts (
  category_id, slug, title, difficulty, tools, prompt_text,
  when_to_use, why_it_works, pro_tips, sort_order, is_active, is_featurable, author_type, author_name
) VALUES (
  'c1111111-1111-1111-1111-111111111111',
  'distributed-resilience-architect',
  'Distributed Systems Resilience Architect',
  'intermediate',
  ARRAY['Claude 3.7 Sonnet','GPT-4o','o3-mini']::TEXT[],
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
  'Use when architecting microservices or background queues to ensure graceful degradation, idempotency, and partition tolerance during outages.',
  'Models network partitions, cascading timeouts, and out-of-order delivery explicitly, eliminating single points of failure.',
  'Provide specific SLAs and downstream dependency failure rates for tailored circuit breaker configurations.',
  3,
  true,
  true,
  'team',
  'Eengineer Staff Lead'
) ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  difficulty = EXCLUDED.difficulty,
  tools = EXCLUDED.tools,
  prompt_text = EXCLUDED.prompt_text,
  when_to_use = EXCLUDED.when_to_use,
  why_it_works = EXCLUDED.why_it_works,
  pro_tips = EXCLUDED.pro_tips,
  sort_order = EXCLUDED.sort_order;

INSERT INTO public.prompt_variables (prompt_id, name, description, is_multiline, sort_order)
SELECT id, 'COMMUNICATION_PROTOCOL', 'Communication protocol (paste details)', false, 1
FROM public.prompts WHERE slug = 'distributed-resilience-architect'
ON CONFLICT (prompt_id, name) DO UPDATE SET
  description = EXCLUDED.description,
  is_multiline = EXCLUDED.is_multiline,
  sort_order = EXCLUDED.sort_order;

INSERT INTO public.prompt_variables (prompt_id, name, description, is_multiline, sort_order)
SELECT id, 'TOPOLOGY_DESCRIPTION', 'Topology description (paste details)', false, 2
FROM public.prompts WHERE slug = 'distributed-resilience-architect'
ON CONFLICT (prompt_id, name) DO UPDATE SET
  description = EXCLUDED.description,
  is_multiline = EXCLUDED.is_multiline,
  sort_order = EXCLUDED.sort_order;

-- Prompt 4: memory-leak-detective
INSERT INTO public.prompts (
  category_id, slug, title, difficulty, tools, prompt_text,
  when_to_use, why_it_works, pro_tips, sort_order, is_active, is_featurable, author_type, author_name
) VALUES (
  'c1111111-1111-1111-1111-111111111111',
  'memory-leak-detective',
  'Memory Leak & Heap Detective',
  'intermediate',
  ARRAY['Claude 3.7 Sonnet','GPT-4o','Gemini 2.5 Pro']::TEXT[],
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
  'Use when diagnosing rising memory consumption, uncollected closures, dangling event listeners, or GC pressure in long-running processes.',
  'Applies heap allocation lifecycle analysis and reference graph tracing to identify retained object hierarchies.',
  'Include heap snapshots or allocation timelines alongside the code for surgical root cause identification.',
  4,
  true,
  true,
  'team',
  'Eengineer Staff Lead'
) ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  difficulty = EXCLUDED.difficulty,
  tools = EXCLUDED.tools,
  prompt_text = EXCLUDED.prompt_text,
  when_to_use = EXCLUDED.when_to_use,
  why_it_works = EXCLUDED.why_it_works,
  pro_tips = EXCLUDED.pro_tips,
  sort_order = EXCLUDED.sort_order;

INSERT INTO public.prompt_variables (prompt_id, name, description, is_multiline, sort_order)
SELECT id, 'LANGUAGE', 'Language (paste details)', false, 1
FROM public.prompts WHERE slug = 'memory-leak-detective'
ON CONFLICT (prompt_id, name) DO UPDATE SET
  description = EXCLUDED.description,
  is_multiline = EXCLUDED.is_multiline,
  sort_order = EXCLUDED.sort_order;

INSERT INTO public.prompt_variables (prompt_id, name, description, is_multiline, sort_order)
SELECT id, 'CODE', 'Suspicious codebase or module handling state/events', true, 2
FROM public.prompts WHERE slug = 'memory-leak-detective'
ON CONFLICT (prompt_id, name) DO UPDATE SET
  description = EXCLUDED.description,
  is_multiline = EXCLUDED.is_multiline,
  sort_order = EXCLUDED.sort_order;

INSERT INTO public.prompt_variables (prompt_id, name, description, is_multiline, sort_order)
SELECT id, 'RUNTIME_ENV', 'Runtime env (paste details)', false, 3
FROM public.prompts WHERE slug = 'memory-leak-detective'
ON CONFLICT (prompt_id, name) DO UPDATE SET
  description = EXCLUDED.description,
  is_multiline = EXCLUDED.is_multiline,
  sort_order = EXCLUDED.sort_order;

-- Prompt 5: high-throughput-api-designer
INSERT INTO public.prompts (
  category_id, slug, title, difficulty, tools, prompt_text,
  when_to_use, why_it_works, pro_tips, sort_order, is_active, is_featurable, author_type, author_name
) VALUES (
  'c1111111-1111-1111-1111-111111111111',
  'high-throughput-api-designer',
  'High-Throughput API Contract Designer',
  'intermediate',
  ARRAY['Claude 3.7 Sonnet','GPT-4o','Gemini 2.5 Pro']::TEXT[],
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
  'Use when designing high-QPS REST/gRPC interfaces that require strict rate-limiting, idempotency, and minimal serialization overhead.',
  'Enforces API contract best practices including pagination cursor invariants, binary protocols, and backward compatibility.',
  'Specify client types (mobile, frontend SPA, backend workers) to tailor caching headers and payload compression.',
  5,
  true,
  true,
  'team',
  'Eengineer Staff Lead'
) ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  difficulty = EXCLUDED.difficulty,
  tools = EXCLUDED.tools,
  prompt_text = EXCLUDED.prompt_text,
  when_to_use = EXCLUDED.when_to_use,
  why_it_works = EXCLUDED.why_it_works,
  pro_tips = EXCLUDED.pro_tips,
  sort_order = EXCLUDED.sort_order;

INSERT INTO public.prompt_variables (prompt_id, name, description, is_multiline, sort_order)
SELECT id, 'FEATURE_REQUIREMENTS', 'Feature requirements (paste details)', false, 1
FROM public.prompts WHERE slug = 'high-throughput-api-designer'
ON CONFLICT (prompt_id, name) DO UPDATE SET
  description = EXCLUDED.description,
  is_multiline = EXCLUDED.is_multiline,
  sort_order = EXCLUDED.sort_order;

INSERT INTO public.prompt_variables (prompt_id, name, description, is_multiline, sort_order)
SELECT id, 'REQUEST_RATE', 'Request rate (paste details)', false, 2
FROM public.prompts WHERE slug = 'high-throughput-api-designer'
ON CONFLICT (prompt_id, name) DO UPDATE SET
  description = EXCLUDED.description,
  is_multiline = EXCLUDED.is_multiline,
  sort_order = EXCLUDED.sort_order;

-- Prompt 6: zero-trust-auth-auditor
INSERT INTO public.prompts (
  category_id, slug, title, difficulty, tools, prompt_text,
  when_to_use, why_it_works, pro_tips, sort_order, is_active, is_featurable, author_type, author_name
) VALUES (
  'c1111111-1111-1111-1111-111111111111',
  'zero-trust-auth-auditor',
  'Zero-Trust Auth & Security Auditor',
  'intermediate',
  ARRAY['Claude 3.7 Sonnet','GPT-4o','o3-mini']::TEXT[],
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
  'Use when reviewing authentication and authorization flows (OAuth2, JWT, RBAC/ABAC, Session Management) for vulnerability vectors.',
  'Employs an adversarial security mindset to uncover broken object-level authorization (BOLA), token hijacking, and replay vulnerabilities.',
  'Test multi-tenant isolation scenarios specifically by providing cross-tenant IDs in test cases.',
  6,
  true,
  true,
  'team',
  'Eengineer Staff Lead'
) ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  difficulty = EXCLUDED.difficulty,
  tools = EXCLUDED.tools,
  prompt_text = EXCLUDED.prompt_text,
  when_to_use = EXCLUDED.when_to_use,
  why_it_works = EXCLUDED.why_it_works,
  pro_tips = EXCLUDED.pro_tips,
  sort_order = EXCLUDED.sort_order;

INSERT INTO public.prompt_variables (prompt_id, name, description, is_multiline, sort_order)
SELECT id, 'LANGUAGE', 'Language (paste details)', false, 1
FROM public.prompts WHERE slug = 'zero-trust-auth-auditor'
ON CONFLICT (prompt_id, name) DO UPDATE SET
  description = EXCLUDED.description,
  is_multiline = EXCLUDED.is_multiline,
  sort_order = EXCLUDED.sort_order;

INSERT INTO public.prompt_variables (prompt_id, name, description, is_multiline, sort_order)
SELECT id, 'AUTH_CODE', 'Auth code (paste details)', true, 2
FROM public.prompts WHERE slug = 'zero-trust-auth-auditor'
ON CONFLICT (prompt_id, name) DO UPDATE SET
  description = EXCLUDED.description,
  is_multiline = EXCLUDED.is_multiline,
  sort_order = EXCLUDED.sort_order;

INSERT INTO public.prompt_variables (prompt_id, name, description, is_multiline, sort_order)
SELECT id, 'ROLE_MODEL', 'Role model (paste details)', false, 3
FROM public.prompts WHERE slug = 'zero-trust-auth-auditor'
ON CONFLICT (prompt_id, name) DO UPDATE SET
  description = EXCLUDED.description,
  is_multiline = EXCLUDED.is_multiline,
  sort_order = EXCLUDED.sort_order;

-- Prompt 7: redis-caching-optimizer
INSERT INTO public.prompts (
  category_id, slug, title, difficulty, tools, prompt_text,
  when_to_use, why_it_works, pro_tips, sort_order, is_active, is_featurable, author_type, author_name
) VALUES (
  'c1111111-1111-1111-1111-111111111111',
  'redis-caching-optimizer',
  'Redis Caching Strategy Optimizer',
  'intermediate',
  ARRAY['Claude 3.7 Sonnet','GPT-4o']::TEXT[],
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
  'Use when designing caching layers to prevent cache stampedes, hotkey degradation, stale state, and memory exhaustion.',
  'Applies data structure selection (Sets, Hashes, HyperLogLog, Streams) and eviction policies tailored to access distributions.',
  'Specify read-to-write ratios and whether cache invalidation or TTL-based expiry is preferred.',
  7,
  true,
  true,
  'team',
  'Eengineer Staff Lead'
) ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  difficulty = EXCLUDED.difficulty,
  tools = EXCLUDED.tools,
  prompt_text = EXCLUDED.prompt_text,
  when_to_use = EXCLUDED.when_to_use,
  why_it_works = EXCLUDED.why_it_works,
  pro_tips = EXCLUDED.pro_tips,
  sort_order = EXCLUDED.sort_order;

INSERT INTO public.prompt_variables (prompt_id, name, description, is_multiline, sort_order)
SELECT id, 'WORKLOAD_DESCRIPTION', 'Workload description (paste details)', false, 1
FROM public.prompts WHERE slug = 'redis-caching-optimizer'
ON CONFLICT (prompt_id, name) DO UPDATE SET
  description = EXCLUDED.description,
  is_multiline = EXCLUDED.is_multiline,
  sort_order = EXCLUDED.sort_order;

INSERT INTO public.prompt_variables (prompt_id, name, description, is_multiline, sort_order)
SELECT id, 'CONSISTENCY_REQUIREMENT', 'Consistency requirement (paste details)', false, 2
FROM public.prompts WHERE slug = 'redis-caching-optimizer'
ON CONFLICT (prompt_id, name) DO UPDATE SET
  description = EXCLUDED.description,
  is_multiline = EXCLUDED.is_multiline,
  sort_order = EXCLUDED.sort_order;

-- Prompt 8: concurrency-race-hunter
INSERT INTO public.prompts (
  category_id, slug, title, difficulty, tools, prompt_text,
  when_to_use, why_it_works, pro_tips, sort_order, is_active, is_featurable, author_type, author_name
) VALUES (
  'c1111111-1111-1111-1111-111111111111',
  'concurrency-race-hunter',
  'Concurrency & Race Condition Hunter',
  'intermediate',
  ARRAY['Claude 3.7 Sonnet','o3-mini','GPT-4o']::TEXT[],
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
  'Use when writing multithreaded, async/await, or distributed locking routines where race conditions and deadlocks can corrupt state.',
  'Exhaustively maps asynchronous execution interleavings and verifies atomic guarantees across shared memory boundaries.',
  'Provide the exact async primitives and synchronization locks used in your implementation.',
  8,
  true,
  true,
  'team',
  'Eengineer Staff Lead'
) ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  difficulty = EXCLUDED.difficulty,
  tools = EXCLUDED.tools,
  prompt_text = EXCLUDED.prompt_text,
  when_to_use = EXCLUDED.when_to_use,
  why_it_works = EXCLUDED.why_it_works,
  pro_tips = EXCLUDED.pro_tips,
  sort_order = EXCLUDED.sort_order;

INSERT INTO public.prompt_variables (prompt_id, name, description, is_multiline, sort_order)
SELECT id, 'LANGUAGE', 'Language (paste details)', false, 1
FROM public.prompts WHERE slug = 'concurrency-race-hunter'
ON CONFLICT (prompt_id, name) DO UPDATE SET
  description = EXCLUDED.description,
  is_multiline = EXCLUDED.is_multiline,
  sort_order = EXCLUDED.sort_order;

INSERT INTO public.prompt_variables (prompt_id, name, description, is_multiline, sort_order)
SELECT id, 'CONCURRENT_CODE', 'Critical code block mutating shared state', true, 2
FROM public.prompts WHERE slug = 'concurrency-race-hunter'
ON CONFLICT (prompt_id, name) DO UPDATE SET
  description = EXCLUDED.description,
  is_multiline = EXCLUDED.is_multiline,
  sort_order = EXCLUDED.sort_order;

INSERT INTO public.prompt_variables (prompt_id, name, description, is_multiline, sort_order)
SELECT id, 'CONCURRENCY_MODEL', 'Concurrency model (paste details)', false, 3
FROM public.prompts WHERE slug = 'concurrency-race-hunter'
ON CONFLICT (prompt_id, name) DO UPDATE SET
  description = EXCLUDED.description,
  is_multiline = EXCLUDED.is_multiline,
  sort_order = EXCLUDED.sort_order;

-- Prompt 9: owasp-pentest-reviewer
INSERT INTO public.prompts (
  category_id, slug, title, difficulty, tools, prompt_text,
  when_to_use, why_it_works, pro_tips, sort_order, is_active, is_featurable, author_type, author_name
) VALUES (
  'c1111111-1111-1111-1111-111111111111',
  'owasp-pentest-reviewer',
  'OWASP Top 10 & API Pentest Reviewer',
  'intermediate',
  ARRAY['Claude 3.7 Sonnet','GPT-4o','o3-mini']::TEXT[],
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
  'Use to run an automated penetration test and security review against the latest OWASP API Security Top 10 vectors.',
  'Systematically tests injection, broken authorization, SSRF, mass assignment, and unvalidated redirects.',
  'Pass both the route handler and input validation schemas to assess full boundary defenses.',
  9,
  true,
  true,
  'team',
  'Eengineer Staff Lead'
) ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  difficulty = EXCLUDED.difficulty,
  tools = EXCLUDED.tools,
  prompt_text = EXCLUDED.prompt_text,
  when_to_use = EXCLUDED.when_to_use,
  why_it_works = EXCLUDED.why_it_works,
  pro_tips = EXCLUDED.pro_tips,
  sort_order = EXCLUDED.sort_order;

INSERT INTO public.prompt_variables (prompt_id, name, description, is_multiline, sort_order)
SELECT id, 'LANGUAGE', 'Language (paste details)', false, 1
FROM public.prompts WHERE slug = 'owasp-pentest-reviewer'
ON CONFLICT (prompt_id, name) DO UPDATE SET
  description = EXCLUDED.description,
  is_multiline = EXCLUDED.is_multiline,
  sort_order = EXCLUDED.sort_order;

INSERT INTO public.prompt_variables (prompt_id, name, description, is_multiline, sort_order)
SELECT id, 'API_CODE', 'Api code (paste details)', true, 2
FROM public.prompts WHERE slug = 'owasp-pentest-reviewer'
ON CONFLICT (prompt_id, name) DO UPDATE SET
  description = EXCLUDED.description,
  is_multiline = EXCLUDED.is_multiline,
  sort_order = EXCLUDED.sort_order;

-- Prompt 10: graphql-schema-n1-solver
INSERT INTO public.prompts (
  category_id, slug, title, difficulty, tools, prompt_text,
  when_to_use, why_it_works, pro_tips, sort_order, is_active, is_featurable, author_type, author_name
) VALUES (
  'c1111111-1111-1111-1111-111111111111',
  'graphql-schema-n1-solver',
  'GraphQL Schema & N+1 Problem Solver',
  'intermediate',
  ARRAY['Claude 3.7 Sonnet','GPT-4o']::TEXT[],
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
  'Use when building GraphQL APIs to eliminate N+1 query cascades and design clean schema hierarchies with DataLoader.',
  'Constructs batching and caching resolver architectures, enforcing query depth limits and cost analysis.',
  'Provide your database relationship graph for optimized batched SQL queries.',
  10,
  true,
  true,
  'team',
  'Eengineer Staff Lead'
) ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  difficulty = EXCLUDED.difficulty,
  tools = EXCLUDED.tools,
  prompt_text = EXCLUDED.prompt_text,
  when_to_use = EXCLUDED.when_to_use,
  why_it_works = EXCLUDED.why_it_works,
  pro_tips = EXCLUDED.pro_tips,
  sort_order = EXCLUDED.sort_order;

INSERT INTO public.prompt_variables (prompt_id, name, description, is_multiline, sort_order)
SELECT id, 'DOMAIN_MODELS', 'Domain models (paste details)', false, 1
FROM public.prompts WHERE slug = 'graphql-schema-n1-solver'
ON CONFLICT (prompt_id, name) DO UPDATE SET
  description = EXCLUDED.description,
  is_multiline = EXCLUDED.is_multiline,
  sort_order = EXCLUDED.sort_order;

-- Prompt 11: database-scaling-sharding
INSERT INTO public.prompts (
  category_id, slug, title, difficulty, tools, prompt_text,
  when_to_use, why_it_works, pro_tips, sort_order, is_active, is_featurable, author_type, author_name
) VALUES (
  'c1111111-1111-1111-1111-111111111111',
  'database-scaling-sharding',
  'The Database Read/Write Scaling & Sharding Architect',
  'intermediate',
  ARRAY['Claude 3.7 Sonnet','GPT-4o','o3-mini']::TEXT[],
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
  'Use when you need staff-level engineering precision, strict architectural invariants, and zero hallucinated code for database scaling sharding.',
  'Applies negative constraints and step-by-step cognitive modeling to ensure production-ready output.',
  'Recommended models: Claude 3.7 Sonnet, GPT-4o, or Gemini 2.5 Pro with temperature set to 0.2.',
  11,
  true,
  true,
  'team',
  'Eengineer Staff Lead'
) ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  difficulty = EXCLUDED.difficulty,
  tools = EXCLUDED.tools,
  prompt_text = EXCLUDED.prompt_text,
  when_to_use = EXCLUDED.when_to_use,
  why_it_works = EXCLUDED.why_it_works,
  pro_tips = EXCLUDED.pro_tips,
  sort_order = EXCLUDED.sort_order;

INSERT INTO public.prompt_variables (prompt_id, name, description, is_multiline, sort_order)
SELECT id, 'DATA_SIZE', 'Data size (paste details)', false, 1
FROM public.prompts WHERE slug = 'database-scaling-sharding'
ON CONFLICT (prompt_id, name) DO UPDATE SET
  description = EXCLUDED.description,
  is_multiline = EXCLUDED.is_multiline,
  sort_order = EXCLUDED.sort_order;

INSERT INTO public.prompt_variables (prompt_id, name, description, is_multiline, sort_order)
SELECT id, 'GROWTH_RATE', 'Growth rate (paste details)', false, 2
FROM public.prompts WHERE slug = 'database-scaling-sharding'
ON CONFLICT (prompt_id, name) DO UPDATE SET
  description = EXCLUDED.description,
  is_multiline = EXCLUDED.is_multiline,
  sort_order = EXCLUDED.sort_order;

INSERT INTO public.prompt_variables (prompt_id, name, description, is_multiline, sort_order)
SELECT id, 'READ_WRITE_RATIO', 'Read write ratio (paste details)', false, 3
FROM public.prompts WHERE slug = 'database-scaling-sharding'
ON CONFLICT (prompt_id, name) DO UPDATE SET
  description = EXCLUDED.description,
  is_multiline = EXCLUDED.is_multiline,
  sort_order = EXCLUDED.sort_order;

INSERT INTO public.prompt_variables (prompt_id, name, description, is_multiline, sort_order)
SELECT id, 'DATABASE_ENGINE', 'Database engine (paste details)', false, 4
FROM public.prompts WHERE slug = 'database-scaling-sharding'
ON CONFLICT (prompt_id, name) DO UPDATE SET
  description = EXCLUDED.description,
  is_multiline = EXCLUDED.is_multiline,
  sort_order = EXCLUDED.sort_order;

-- Prompt 12: serverless-cold-start-optimizer
INSERT INTO public.prompts (
  category_id, slug, title, difficulty, tools, prompt_text,
  when_to_use, why_it_works, pro_tips, sort_order, is_active, is_featurable, author_type, author_name
) VALUES (
  'c1111111-1111-1111-1111-111111111111',
  'serverless-cold-start-optimizer',
  'The Serverless Cold Start & Boundary Optimizer',
  'intermediate',
  ARRAY['Claude 3.7 Sonnet','GPT-4o']::TEXT[],
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
  'Use when you need staff-level engineering precision, strict architectural invariants, and zero hallucinated code for serverless cold start optimizer.',
  'Applies negative constraints and step-by-step cognitive modeling to ensure production-ready output.',
  'Recommended models: Claude 3.7 Sonnet, GPT-4o, or Gemini 2.5 Pro with temperature set to 0.2.',
  12,
  true,
  true,
  'team',
  'Eengineer Staff Lead'
) ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  difficulty = EXCLUDED.difficulty,
  tools = EXCLUDED.tools,
  prompt_text = EXCLUDED.prompt_text,
  when_to_use = EXCLUDED.when_to_use,
  why_it_works = EXCLUDED.why_it_works,
  pro_tips = EXCLUDED.pro_tips,
  sort_order = EXCLUDED.sort_order;

INSERT INTO public.prompt_variables (prompt_id, name, description, is_multiline, sort_order)
SELECT id, 'LANGUAGE', 'Language (paste details)', false, 1
FROM public.prompts WHERE slug = 'serverless-cold-start-optimizer'
ON CONFLICT (prompt_id, name) DO UPDATE SET
  description = EXCLUDED.description,
  is_multiline = EXCLUDED.is_multiline,
  sort_order = EXCLUDED.sort_order;

INSERT INTO public.prompt_variables (prompt_id, name, description, is_multiline, sort_order)
SELECT id, 'FUNCTION_CODE', 'Function code (paste details)', true, 2
FROM public.prompts WHERE slug = 'serverless-cold-start-optimizer'
ON CONFLICT (prompt_id, name) DO UPDATE SET
  description = EXCLUDED.description,
  is_multiline = EXCLUDED.is_multiline,
  sort_order = EXCLUDED.sort_order;

INSERT INTO public.prompt_variables (prompt_id, name, description, is_multiline, sort_order)
SELECT id, 'PLATFORM', 'Platform (paste details)', false, 3
FROM public.prompts WHERE slug = 'serverless-cold-start-optimizer'
ON CONFLICT (prompt_id, name) DO UPDATE SET
  description = EXCLUDED.description,
  is_multiline = EXCLUDED.is_multiline,
  sort_order = EXCLUDED.sort_order;

-- Prompt 13: webhook-delivery-architect
INSERT INTO public.prompts (
  category_id, slug, title, difficulty, tools, prompt_text,
  when_to_use, why_it_works, pro_tips, sort_order, is_active, is_featurable, author_type, author_name
) VALUES (
  'c1111111-1111-1111-1111-111111111111',
  'webhook-delivery-architect',
  'At-Least-Once',
  'intermediate',
  ARRAY['Claude 3.7 Sonnet','GPT-4o']::TEXT[],
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
  'Use when you need staff-level engineering precision, strict architectural invariants, and zero hallucinated code for webhook delivery architect.',
  'Applies negative constraints and step-by-step cognitive modeling to ensure production-ready output.',
  'Recommended models: Claude 3.7 Sonnet, GPT-4o, or Gemini 2.5 Pro with temperature set to 0.2.',
  13,
  true,
  true,
  'team',
  'Eengineer Staff Lead'
) ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  difficulty = EXCLUDED.difficulty,
  tools = EXCLUDED.tools,
  prompt_text = EXCLUDED.prompt_text,
  when_to_use = EXCLUDED.when_to_use,
  why_it_works = EXCLUDED.why_it_works,
  pro_tips = EXCLUDED.pro_tips,
  sort_order = EXCLUDED.sort_order;

INSERT INTO public.prompt_variables (prompt_id, name, description, is_multiline, sort_order)
SELECT id, 'WEBHOOK_SCENARIO', 'Webhook scenario (paste details)', false, 1
FROM public.prompts WHERE slug = 'webhook-delivery-architect'
ON CONFLICT (prompt_id, name) DO UPDATE SET
  description = EXCLUDED.description,
  is_multiline = EXCLUDED.is_multiline,
  sort_order = EXCLUDED.sort_order;

-- Prompt 14: surgical-agent-fix
INSERT INTO public.prompts (
  category_id, slug, title, difficulty, tools, prompt_text,
  when_to_use, why_it_works, pro_tips, sort_order, is_active, is_featurable, author_type, author_name
) VALUES (
  'c2222222-2222-2222-2222-222222222222',
  'surgical-agent-fix',
  'The Surgical Codebase Fixer (Zero-Collateral',
  'intermediate',
  ARRAY['Cursor','Windsurf','Claude Code','Aider','Cline']::TEXT[],
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
  'Use when you need staff-level engineering precision, strict architectural invariants, and zero hallucinated code for surgical agent fix.',
  'Applies negative constraints and step-by-step cognitive modeling to ensure production-ready output.',
  'Recommended models: Claude 3.7 Sonnet, GPT-4o, or Gemini 2.5 Pro with temperature set to 0.2.',
  14,
  true,
  true,
  'team',
  'Eengineer Staff Lead'
) ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  difficulty = EXCLUDED.difficulty,
  tools = EXCLUDED.tools,
  prompt_text = EXCLUDED.prompt_text,
  when_to_use = EXCLUDED.when_to_use,
  why_it_works = EXCLUDED.why_it_works,
  pro_tips = EXCLUDED.pro_tips,
  sort_order = EXCLUDED.sort_order;

INSERT INTO public.prompt_variables (prompt_id, name, description, is_multiline, sort_order)
SELECT id, 'OBSERVED_BEHAVIOR', 'Observed behavior (paste details)', false, 1
FROM public.prompts WHERE slug = 'surgical-agent-fix'
ON CONFLICT (prompt_id, name) DO UPDATE SET
  description = EXCLUDED.description,
  is_multiline = EXCLUDED.is_multiline,
  sort_order = EXCLUDED.sort_order;

INSERT INTO public.prompt_variables (prompt_id, name, description, is_multiline, sort_order)
SELECT id, 'EXPECTED_BEHAVIOR', 'Expected behavior (paste details)', false, 2
FROM public.prompts WHERE slug = 'surgical-agent-fix'
ON CONFLICT (prompt_id, name) DO UPDATE SET
  description = EXCLUDED.description,
  is_multiline = EXCLUDED.is_multiline,
  sort_order = EXCLUDED.sort_order;

INSERT INTO public.prompt_variables (prompt_id, name, description, is_multiline, sort_order)
SELECT id, 'TARGET_FILES', 'Target files (paste details)', false, 3
FROM public.prompts WHERE slug = 'surgical-agent-fix'
ON CONFLICT (prompt_id, name) DO UPDATE SET
  description = EXCLUDED.description,
  is_multiline = EXCLUDED.is_multiline,
  sort_order = EXCLUDED.sort_order;

-- Prompt 15: pattern-apprentice-feature
INSERT INTO public.prompts (
  category_id, slug, title, difficulty, tools, prompt_text,
  when_to_use, why_it_works, pro_tips, sort_order, is_active, is_featurable, author_type, author_name
) VALUES (
  'c2222222-2222-2222-2222-222222222222',
  'pattern-apprentice-feature',
  'The Pattern Apprentice (Idiomatic Feature Builder',
  'intermediate',
  ARRAY['Cursor','Windsurf','Claude Code','Antigravity']::TEXT[],
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
  'Use when you need staff-level engineering precision, strict architectural invariants, and zero hallucinated code for pattern apprentice feature.',
  'Applies negative constraints and step-by-step cognitive modeling to ensure production-ready output.',
  'Recommended models: Claude 3.7 Sonnet, GPT-4o, or Gemini 2.5 Pro with temperature set to 0.2.',
  15,
  true,
  true,
  'team',
  'Eengineer Staff Lead'
) ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  difficulty = EXCLUDED.difficulty,
  tools = EXCLUDED.tools,
  prompt_text = EXCLUDED.prompt_text,
  when_to_use = EXCLUDED.when_to_use,
  why_it_works = EXCLUDED.why_it_works,
  pro_tips = EXCLUDED.pro_tips,
  sort_order = EXCLUDED.sort_order;

INSERT INTO public.prompt_variables (prompt_id, name, description, is_multiline, sort_order)
SELECT id, 'FEATURE_NAME', 'Feature name (paste details)', false, 1
FROM public.prompts WHERE slug = 'pattern-apprentice-feature'
ON CONFLICT (prompt_id, name) DO UPDATE SET
  description = EXCLUDED.description,
  is_multiline = EXCLUDED.is_multiline,
  sort_order = EXCLUDED.sort_order;

INSERT INTO public.prompt_variables (prompt_id, name, description, is_multiline, sort_order)
SELECT id, 'EXISTING_FILE_1', 'Existing file 1 (paste details)', false, 2
FROM public.prompts WHERE slug = 'pattern-apprentice-feature'
ON CONFLICT (prompt_id, name) DO UPDATE SET
  description = EXCLUDED.description,
  is_multiline = EXCLUDED.is_multiline,
  sort_order = EXCLUDED.sort_order;

INSERT INTO public.prompt_variables (prompt_id, name, description, is_multiline, sort_order)
SELECT id, 'EXISTING_FILE_2', 'Existing file 2 (paste details)', false, 3
FROM public.prompts WHERE slug = 'pattern-apprentice-feature'
ON CONFLICT (prompt_id, name) DO UPDATE SET
  description = EXCLUDED.description,
  is_multiline = EXCLUDED.is_multiline,
  sort_order = EXCLUDED.sort_order;

INSERT INTO public.prompt_variables (prompt_id, name, description, is_multiline, sort_order)
SELECT id, 'FEATURE_SPECIFICATION', 'Feature specification (paste details)', true, 4
FROM public.prompts WHERE slug = 'pattern-apprentice-feature'
ON CONFLICT (prompt_id, name) DO UPDATE SET
  description = EXCLUDED.description,
  is_multiline = EXCLUDED.is_multiline,
  sort_order = EXCLUDED.sort_order;

-- Prompt 16: type-safe-refactor
INSERT INTO public.prompts (
  category_id, slug, title, difficulty, tools, prompt_text,
  when_to_use, why_it_works, pro_tips, sort_order, is_active, is_featurable, author_type, author_name
) VALUES (
  'c2222222-2222-2222-2222-222222222222',
  'type-safe-refactor',
  'The Type-Safe Refactoring Specialist',
  'intermediate',
  ARRAY['Cursor','Claude Code','Windsurf']::TEXT[],
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
  'Use when you need staff-level engineering precision, strict architectural invariants, and zero hallucinated code for type safe refactor.',
  'Applies negative constraints and step-by-step cognitive modeling to ensure production-ready output.',
  'Recommended models: Claude 3.7 Sonnet, GPT-4o, or Gemini 2.5 Pro with temperature set to 0.2.',
  16,
  true,
  true,
  'team',
  'Eengineer Staff Lead'
) ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  difficulty = EXCLUDED.difficulty,
  tools = EXCLUDED.tools,
  prompt_text = EXCLUDED.prompt_text,
  when_to_use = EXCLUDED.when_to_use,
  why_it_works = EXCLUDED.why_it_works,
  pro_tips = EXCLUDED.pro_tips,
  sort_order = EXCLUDED.sort_order;

INSERT INTO public.prompt_variables (prompt_id, name, description, is_multiline, sort_order)
SELECT id, 'TARGET_MODULE', 'Target module (paste details)', false, 1
FROM public.prompts WHERE slug = 'type-safe-refactor'
ON CONFLICT (prompt_id, name) DO UPDATE SET
  description = EXCLUDED.description,
  is_multiline = EXCLUDED.is_multiline,
  sort_order = EXCLUDED.sort_order;

INSERT INTO public.prompt_variables (prompt_id, name, description, is_multiline, sort_order)
SELECT id, 'REFACTORING_GOAL', 'Refactoring goal (paste details)', false, 2
FROM public.prompts WHERE slug = 'type-safe-refactor'
ON CONFLICT (prompt_id, name) DO UPDATE SET
  description = EXCLUDED.description,
  is_multiline = EXCLUDED.is_multiline,
  sort_order = EXCLUDED.sort_order;

-- Prompt 17: test-suite-architect
INSERT INTO public.prompts (
  category_id, slug, title, difficulty, tools, prompt_text,
  when_to_use, why_it_works, pro_tips, sort_order, is_active, is_featurable, author_type, author_name
) VALUES (
  'c2222222-2222-2222-2222-222222222222',
  'test-suite-architect',
  'Unit + Edge Cases',
  'intermediate',
  ARRAY['Cursor','Claude Code','Windsurf','Copilot']::TEXT[],
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
  'Use when you need staff-level engineering precision, strict architectural invariants, and zero hallucinated code for test suite architect.',
  'Applies negative constraints and step-by-step cognitive modeling to ensure production-ready output.',
  'Recommended models: Claude 3.7 Sonnet, GPT-4o, or Gemini 2.5 Pro with temperature set to 0.2.',
  17,
  true,
  true,
  'team',
  'Eengineer Staff Lead'
) ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  difficulty = EXCLUDED.difficulty,
  tools = EXCLUDED.tools,
  prompt_text = EXCLUDED.prompt_text,
  when_to_use = EXCLUDED.when_to_use,
  why_it_works = EXCLUDED.why_it_works,
  pro_tips = EXCLUDED.pro_tips,
  sort_order = EXCLUDED.sort_order;

INSERT INTO public.prompt_variables (prompt_id, name, description, is_multiline, sort_order)
SELECT id, 'TARGET_FILES', 'Target files (paste details)', false, 1
FROM public.prompts WHERE slug = 'test-suite-architect'
ON CONFLICT (prompt_id, name) DO UPDATE SET
  description = EXCLUDED.description,
  is_multiline = EXCLUDED.is_multiline,
  sort_order = EXCLUDED.sort_order;

INSERT INTO public.prompt_variables (prompt_id, name, description, is_multiline, sort_order)
SELECT id, 'LANGUAGE_AND_TEST_FRAMEWORK', 'Language and test framework (paste details)', false, 2
FROM public.prompts WHERE slug = 'test-suite-architect'
ON CONFLICT (prompt_id, name) DO UPDATE SET
  description = EXCLUDED.description,
  is_multiline = EXCLUDED.is_multiline,
  sort_order = EXCLUDED.sort_order;

INSERT INTO public.prompt_variables (prompt_id, name, description, is_multiline, sort_order)
SELECT id, 'BUSINESS_CONTEXT', 'Business context (paste details)', false, 3
FROM public.prompts WHERE slug = 'test-suite-architect'
ON CONFLICT (prompt_id, name) DO UPDATE SET
  description = EXCLUDED.description,
  is_multiline = EXCLUDED.is_multiline,
  sort_order = EXCLUDED.sort_order;

-- Prompt 18: zero-downtime-db-migration
INSERT INTO public.prompts (
  category_id, slug, title, difficulty, tools, prompt_text,
  when_to_use, why_it_works, pro_tips, sort_order, is_active, is_featurable, author_type, author_name
) VALUES (
  'c2222222-2222-2222-2222-222222222222',
  'zero-downtime-db-migration',
  'Zero-Downtime',
  'intermediate',
  ARRAY['Cursor','Claude Code','ChatGPT','Copilot']::TEXT[],
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
  'Use when you need staff-level engineering precision, strict architectural invariants, and zero hallucinated code for zero downtime db migration.',
  'Applies negative constraints and step-by-step cognitive modeling to ensure production-ready output.',
  'Recommended models: Claude 3.7 Sonnet, GPT-4o, or Gemini 2.5 Pro with temperature set to 0.2.',
  18,
  true,
  true,
  'team',
  'Eengineer Staff Lead'
) ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  difficulty = EXCLUDED.difficulty,
  tools = EXCLUDED.tools,
  prompt_text = EXCLUDED.prompt_text,
  when_to_use = EXCLUDED.when_to_use,
  why_it_works = EXCLUDED.why_it_works,
  pro_tips = EXCLUDED.pro_tips,
  sort_order = EXCLUDED.sort_order;

INSERT INTO public.prompt_variables (prompt_id, name, description, is_multiline, sort_order)
SELECT id, 'DATABASE_ENGINE', 'Database engine (paste details)', false, 1
FROM public.prompts WHERE slug = 'zero-downtime-db-migration'
ON CONFLICT (prompt_id, name) DO UPDATE SET
  description = EXCLUDED.description,
  is_multiline = EXCLUDED.is_multiline,
  sort_order = EXCLUDED.sort_order;

INSERT INTO public.prompt_variables (prompt_id, name, description, is_multiline, sort_order)
SELECT id, 'CURRENT_SCHEMA', 'Current schema (paste details)', true, 2
FROM public.prompts WHERE slug = 'zero-downtime-db-migration'
ON CONFLICT (prompt_id, name) DO UPDATE SET
  description = EXCLUDED.description,
  is_multiline = EXCLUDED.is_multiline,
  sort_order = EXCLUDED.sort_order;

INSERT INTO public.prompt_variables (prompt_id, name, description, is_multiline, sort_order)
SELECT id, 'TRAFFIC_PATTERN', 'Traffic pattern (paste details)', false, 3
FROM public.prompts WHERE slug = 'zero-downtime-db-migration'
ON CONFLICT (prompt_id, name) DO UPDATE SET
  description = EXCLUDED.description,
  is_multiline = EXCLUDED.is_multiline,
  sort_order = EXCLUDED.sort_order;

INSERT INTO public.prompt_variables (prompt_id, name, description, is_multiline, sort_order)
SELECT id, 'MIGRATION_GOAL', 'Migration goal (paste details)', false, 4
FROM public.prompts WHERE slug = 'zero-downtime-db-migration'
ON CONFLICT (prompt_id, name) DO UPDATE SET
  description = EXCLUDED.description,
  is_multiline = EXCLUDED.is_multiline,
  sort_order = EXCLUDED.sort_order;

-- Prompt 19: ui-component-builder
INSERT INTO public.prompts (
  category_id, slug, title, difficulty, tools, prompt_text,
  when_to_use, why_it_works, pro_tips, sort_order, is_active, is_featurable, author_type, author_name
) VALUES (
  'c2222222-2222-2222-2222-222222222222',
  'ui-component-builder',
  'The Pixel-Perfect UI Component Builder',
  'intermediate',
  ARRAY['Cursor','Claude Code','Windsurf','v0.dev']::TEXT[],
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
  'Use when you need staff-level engineering precision, strict architectural invariants, and zero hallucinated code for ui component builder.',
  'Applies negative constraints and step-by-step cognitive modeling to ensure production-ready output.',
  'Recommended models: Claude 3.7 Sonnet, GPT-4o, or Gemini 2.5 Pro with temperature set to 0.2.',
  19,
  true,
  true,
  'team',
  'Eengineer Staff Lead'
) ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  difficulty = EXCLUDED.difficulty,
  tools = EXCLUDED.tools,
  prompt_text = EXCLUDED.prompt_text,
  when_to_use = EXCLUDED.when_to_use,
  why_it_works = EXCLUDED.why_it_works,
  pro_tips = EXCLUDED.pro_tips,
  sort_order = EXCLUDED.sort_order;

INSERT INTO public.prompt_variables (prompt_id, name, description, is_multiline, sort_order)
SELECT id, 'COMPONENT_NAME', 'Component name (paste details)', false, 1
FROM public.prompts WHERE slug = 'ui-component-builder'
ON CONFLICT (prompt_id, name) DO UPDATE SET
  description = EXCLUDED.description,
  is_multiline = EXCLUDED.is_multiline,
  sort_order = EXCLUDED.sort_order;

INSERT INTO public.prompt_variables (prompt_id, name, description, is_multiline, sort_order)
SELECT id, 'UI_FRAMEWORK', 'Ui framework (paste details)', false, 2
FROM public.prompts WHERE slug = 'ui-component-builder'
ON CONFLICT (prompt_id, name) DO UPDATE SET
  description = EXCLUDED.description,
  is_multiline = EXCLUDED.is_multiline,
  sort_order = EXCLUDED.sort_order;

INSERT INTO public.prompt_variables (prompt_id, name, description, is_multiline, sort_order)
SELECT id, 'DESIGN_DESCRIPTION', 'Design description (paste details)', false, 3
FROM public.prompts WHERE slug = 'ui-component-builder'
ON CONFLICT (prompt_id, name) DO UPDATE SET
  description = EXCLUDED.description,
  is_multiline = EXCLUDED.is_multiline,
  sort_order = EXCLUDED.sort_order;

-- Prompt 20: e2e-suite-generator
INSERT INTO public.prompts (
  category_id, slug, title, difficulty, tools, prompt_text,
  when_to_use, why_it_works, pro_tips, sort_order, is_active, is_featurable, author_type, author_name
) VALUES (
  'c2222222-2222-2222-2222-222222222222',
  'e2e-suite-generator',
  'Playwright / Cypress',
  'intermediate',
  ARRAY['Cursor','Claude Code','Windsurf']::TEXT[],
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
  'Use when you need staff-level engineering precision, strict architectural invariants, and zero hallucinated code for e2e suite generator.',
  'Applies negative constraints and step-by-step cognitive modeling to ensure production-ready output.',
  'Recommended models: Claude 3.7 Sonnet, GPT-4o, or Gemini 2.5 Pro with temperature set to 0.2.',
  20,
  true,
  true,
  'team',
  'Eengineer Staff Lead'
) ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  difficulty = EXCLUDED.difficulty,
  tools = EXCLUDED.tools,
  prompt_text = EXCLUDED.prompt_text,
  when_to_use = EXCLUDED.when_to_use,
  why_it_works = EXCLUDED.why_it_works,
  pro_tips = EXCLUDED.pro_tips,
  sort_order = EXCLUDED.sort_order;

INSERT INTO public.prompt_variables (prompt_id, name, description, is_multiline, sort_order)
SELECT id, 'USER_JOURNEY', 'User journey (paste details)', false, 1
FROM public.prompts WHERE slug = 'e2e-suite-generator'
ON CONFLICT (prompt_id, name) DO UPDATE SET
  description = EXCLUDED.description,
  is_multiline = EXCLUDED.is_multiline,
  sort_order = EXCLUDED.sort_order;

INSERT INTO public.prompt_variables (prompt_id, name, description, is_multiline, sort_order)
SELECT id, 'E2E_FRAMEWORK', 'E2e framework (paste details)', false, 2
FROM public.prompts WHERE slug = 'e2e-suite-generator'
ON CONFLICT (prompt_id, name) DO UPDATE SET
  description = EXCLUDED.description,
  is_multiline = EXCLUDED.is_multiline,
  sort_order = EXCLUDED.sort_order;

-- Prompt 21: js-to-ts-migrator
INSERT INTO public.prompts (
  category_id, slug, title, difficulty, tools, prompt_text,
  when_to_use, why_it_works, pro_tips, sort_order, is_active, is_featurable, author_type, author_name
) VALUES (
  'c2222222-2222-2222-2222-222222222222',
  'js-to-ts-migrator',
  'The Legacy JS to Strict TypeScript Migrator',
  'intermediate',
  ARRAY['Cursor','Claude Code','Windsurf']::TEXT[],
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
  'Use when you need staff-level engineering precision, strict architectural invariants, and zero hallucinated code for js to ts migrator.',
  'Applies negative constraints and step-by-step cognitive modeling to ensure production-ready output.',
  'Recommended models: Claude 3.7 Sonnet, GPT-4o, or Gemini 2.5 Pro with temperature set to 0.2.',
  21,
  true,
  true,
  'team',
  'Eengineer Staff Lead'
) ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  difficulty = EXCLUDED.difficulty,
  tools = EXCLUDED.tools,
  prompt_text = EXCLUDED.prompt_text,
  when_to_use = EXCLUDED.when_to_use,
  why_it_works = EXCLUDED.why_it_works,
  pro_tips = EXCLUDED.pro_tips,
  sort_order = EXCLUDED.sort_order;

INSERT INTO public.prompt_variables (prompt_id, name, description, is_multiline, sort_order)
SELECT id, 'LEGACY_JS_CODE', 'Legacy js code (paste details)', true, 1
FROM public.prompts WHERE slug = 'js-to-ts-migrator'
ON CONFLICT (prompt_id, name) DO UPDATE SET
  description = EXCLUDED.description,
  is_multiline = EXCLUDED.is_multiline,
  sort_order = EXCLUDED.sort_order;

INSERT INTO public.prompt_variables (prompt_id, name, description, is_multiline, sort_order)
SELECT id, 'TYPE_CONTEXT', 'Type context (paste details)', false, 2
FROM public.prompts WHERE slug = 'js-to-ts-migrator'
ON CONFLICT (prompt_id, name) DO UPDATE SET
  description = EXCLUDED.description,
  is_multiline = EXCLUDED.is_multiline,
  sort_order = EXCLUDED.sort_order;

-- Prompt 22: react-rerender-optimizer
INSERT INTO public.prompts (
  category_id, slug, title, difficulty, tools, prompt_text,
  when_to_use, why_it_works, pro_tips, sort_order, is_active, is_featurable, author_type, author_name
) VALUES (
  'c2222222-2222-2222-2222-222222222222',
  'react-rerender-optimizer',
  'The React Performance & Re-render Optimizer',
  'intermediate',
  ARRAY['Cursor','Claude Code','Windsurf']::TEXT[],
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
  'Use when you need staff-level engineering precision, strict architectural invariants, and zero hallucinated code for react rerender optimizer.',
  'Applies negative constraints and step-by-step cognitive modeling to ensure production-ready output.',
  'Recommended models: Claude 3.7 Sonnet, GPT-4o, or Gemini 2.5 Pro with temperature set to 0.2.',
  22,
  true,
  true,
  'team',
  'Eengineer Staff Lead'
) ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  difficulty = EXCLUDED.difficulty,
  tools = EXCLUDED.tools,
  prompt_text = EXCLUDED.prompt_text,
  when_to_use = EXCLUDED.when_to_use,
  why_it_works = EXCLUDED.why_it_works,
  pro_tips = EXCLUDED.pro_tips,
  sort_order = EXCLUDED.sort_order;

INSERT INTO public.prompt_variables (prompt_id, name, description, is_multiline, sort_order)
SELECT id, 'REACT_CODE', 'React code (paste details)', true, 1
FROM public.prompts WHERE slug = 'react-rerender-optimizer'
ON CONFLICT (prompt_id, name) DO UPDATE SET
  description = EXCLUDED.description,
  is_multiline = EXCLUDED.is_multiline,
  sort_order = EXCLUDED.sort_order;

-- Prompt 23: openapi-spec-extractor
INSERT INTO public.prompts (
  category_id, slug, title, difficulty, tools, prompt_text,
  when_to_use, why_it_works, pro_tips, sort_order, is_active, is_featurable, author_type, author_name
) VALUES (
  'c2222222-2222-2222-2222-222222222222',
  'openapi-spec-extractor',
  'The OpenAPI/Swagger Spec Extractor',
  'intermediate',
  ARRAY['Cursor','Claude Code','ChatGPT']::TEXT[],
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
  'Use when you need staff-level engineering precision, strict architectural invariants, and zero hallucinated code for openapi spec extractor.',
  'Applies negative constraints and step-by-step cognitive modeling to ensure production-ready output.',
  'Recommended models: Claude 3.7 Sonnet, GPT-4o, or Gemini 2.5 Pro with temperature set to 0.2.',
  23,
  true,
  true,
  'team',
  'Eengineer Staff Lead'
) ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  difficulty = EXCLUDED.difficulty,
  tools = EXCLUDED.tools,
  prompt_text = EXCLUDED.prompt_text,
  when_to_use = EXCLUDED.when_to_use,
  why_it_works = EXCLUDED.why_it_works,
  pro_tips = EXCLUDED.pro_tips,
  sort_order = EXCLUDED.sort_order;

INSERT INTO public.prompt_variables (prompt_id, name, description, is_multiline, sort_order)
SELECT id, 'LANGUAGE', 'Language (paste details)', false, 1
FROM public.prompts WHERE slug = 'openapi-spec-extractor'
ON CONFLICT (prompt_id, name) DO UPDATE SET
  description = EXCLUDED.description,
  is_multiline = EXCLUDED.is_multiline,
  sort_order = EXCLUDED.sort_order;

INSERT INTO public.prompt_variables (prompt_id, name, description, is_multiline, sort_order)
SELECT id, 'ROUTE_CODE', 'Route code (paste details)', true, 2
FROM public.prompts WHERE slug = 'openapi-spec-extractor'
ON CONFLICT (prompt_id, name) DO UPDATE SET
  description = EXCLUDED.description,
  is_multiline = EXCLUDED.is_multiline,
  sort_order = EXCLUDED.sort_order;

-- Prompt 24: a11y-remediation-agent
INSERT INTO public.prompts (
  category_id, slug, title, difficulty, tools, prompt_text,
  when_to_use, why_it_works, pro_tips, sort_order, is_active, is_featurable, author_type, author_name
) VALUES (
  'c2222222-2222-2222-2222-222222222222',
  'a11y-remediation-agent',
  'Accessibility WCAG 2.1',
  'intermediate',
  ARRAY['Cursor','Claude Code','Windsurf']::TEXT[],
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
  'Use when you need staff-level engineering precision, strict architectural invariants, and zero hallucinated code for a11y remediation agent.',
  'Applies negative constraints and step-by-step cognitive modeling to ensure production-ready output.',
  'Recommended models: Claude 3.7 Sonnet, GPT-4o, or Gemini 2.5 Pro with temperature set to 0.2.',
  24,
  true,
  true,
  'team',
  'Eengineer Staff Lead'
) ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  difficulty = EXCLUDED.difficulty,
  tools = EXCLUDED.tools,
  prompt_text = EXCLUDED.prompt_text,
  when_to_use = EXCLUDED.when_to_use,
  why_it_works = EXCLUDED.why_it_works,
  pro_tips = EXCLUDED.pro_tips,
  sort_order = EXCLUDED.sort_order;

INSERT INTO public.prompt_variables (prompt_id, name, description, is_multiline, sort_order)
SELECT id, 'COMPONENT_CODE', 'Component code (paste details)', true, 1
FROM public.prompts WHERE slug = 'a11y-remediation-agent'
ON CONFLICT (prompt_id, name) DO UPDATE SET
  description = EXCLUDED.description,
  is_multiline = EXCLUDED.is_multiline,
  sort_order = EXCLUDED.sort_order;

-- Prompt 25: dead-code-pruner
INSERT INTO public.prompts (
  category_id, slug, title, difficulty, tools, prompt_text,
  when_to_use, why_it_works, pro_tips, sort_order, is_active, is_featurable, author_type, author_name
) VALUES (
  'c2222222-2222-2222-2222-222222222222',
  'dead-code-pruner',
  'The Dead Code & Dependency Tree Pruner',
  'intermediate',
  ARRAY['Cursor','Claude Code']::TEXT[],
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
  'Use when you need staff-level engineering precision, strict architectural invariants, and zero hallucinated code for dead code pruner.',
  'Applies negative constraints and step-by-step cognitive modeling to ensure production-ready output.',
  'Recommended models: Claude 3.7 Sonnet, GPT-4o, or Gemini 2.5 Pro with temperature set to 0.2.',
  25,
  true,
  true,
  'team',
  'Eengineer Staff Lead'
) ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  difficulty = EXCLUDED.difficulty,
  tools = EXCLUDED.tools,
  prompt_text = EXCLUDED.prompt_text,
  when_to_use = EXCLUDED.when_to_use,
  why_it_works = EXCLUDED.why_it_works,
  pro_tips = EXCLUDED.pro_tips,
  sort_order = EXCLUDED.sort_order;

INSERT INTO public.prompt_variables (prompt_id, name, description, is_multiline, sort_order)
SELECT id, 'LANGUAGE', 'Language (paste details)', false, 1
FROM public.prompts WHERE slug = 'dead-code-pruner'
ON CONFLICT (prompt_id, name) DO UPDATE SET
  description = EXCLUDED.description,
  is_multiline = EXCLUDED.is_multiline,
  sort_order = EXCLUDED.sort_order;

INSERT INTO public.prompt_variables (prompt_id, name, description, is_multiline, sort_order)
SELECT id, 'MODULE_CODE', 'Module code (paste details)', true, 2
FROM public.prompts WHERE slug = 'dead-code-pruner'
ON CONFLICT (prompt_id, name) DO UPDATE SET
  description = EXCLUDED.description,
  is_multiline = EXCLUDED.is_multiline,
  sort_order = EXCLUDED.sort_order;

INSERT INTO public.prompt_variables (prompt_id, name, description, is_multiline, sort_order)
SELECT id, 'DEPENDENCY_CONTEXT', 'Dependency context (paste details)', false, 3
FROM public.prompts WHERE slug = 'dead-code-pruner'
ON CONFLICT (prompt_id, name) DO UPDATE SET
  description = EXCLUDED.description,
  is_multiline = EXCLUDED.is_multiline,
  sort_order = EXCLUDED.sort_order;

-- Prompt 26: css-to-tailwind-migrator
INSERT INTO public.prompts (
  category_id, slug, title, difficulty, tools, prompt_text,
  when_to_use, why_it_works, pro_tips, sort_order, is_active, is_featurable, author_type, author_name
) VALUES (
  'c2222222-2222-2222-2222-222222222222',
  'css-to-tailwind-migrator',
  'The CSS/SCSS to Tailwind Token Migrator',
  'intermediate',
  ARRAY['Cursor','Claude Code','Windsurf']::TEXT[],
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
  'Use when you need staff-level engineering precision, strict architectural invariants, and zero hallucinated code for css to tailwind migrator.',
  'Applies negative constraints and step-by-step cognitive modeling to ensure production-ready output.',
  'Recommended models: Claude 3.7 Sonnet, GPT-4o, or Gemini 2.5 Pro with temperature set to 0.2.',
  26,
  true,
  true,
  'team',
  'Eengineer Staff Lead'
) ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  difficulty = EXCLUDED.difficulty,
  tools = EXCLUDED.tools,
  prompt_text = EXCLUDED.prompt_text,
  when_to_use = EXCLUDED.when_to_use,
  why_it_works = EXCLUDED.why_it_works,
  pro_tips = EXCLUDED.pro_tips,
  sort_order = EXCLUDED.sort_order;

INSERT INTO public.prompt_variables (prompt_id, name, description, is_multiline, sort_order)
SELECT id, 'JSX_MARKUP', 'Jsx markup (paste details)', false, 1
FROM public.prompts WHERE slug = 'css-to-tailwind-migrator'
ON CONFLICT (prompt_id, name) DO UPDATE SET
  description = EXCLUDED.description,
  is_multiline = EXCLUDED.is_multiline,
  sort_order = EXCLUDED.sort_order;

INSERT INTO public.prompt_variables (prompt_id, name, description, is_multiline, sort_order)
SELECT id, 'CSS_STYLES', 'Css styles (paste details)', false, 2
FROM public.prompts WHERE slug = 'css-to-tailwind-migrator'
ON CONFLICT (prompt_id, name) DO UPDATE SET
  description = EXCLUDED.description,
  is_multiline = EXCLUDED.is_multiline,
  sort_order = EXCLUDED.sort_order;

INSERT INTO public.prompt_variables (prompt_id, name, description, is_multiline, sort_order)
SELECT id, 'TAILWIND_CONFIG_SNIPPET', 'Tailwind config snippet (paste details)', false, 3
FROM public.prompts WHERE slug = 'css-to-tailwind-migrator'
ON CONFLICT (prompt_id, name) DO UPDATE SET
  description = EXCLUDED.description,
  is_multiline = EXCLUDED.is_multiline,
  sort_order = EXCLUDED.sort_order;

-- Prompt 27: i18n-extractor
INSERT INTO public.prompts (
  category_id, slug, title, difficulty, tools, prompt_text,
  when_to_use, why_it_works, pro_tips, sort_order, is_active, is_featurable, author_type, author_name
) VALUES (
  'c2222222-2222-2222-2222-222222222222',
  'i18n-extractor',
  'i18n',
  'intermediate',
  ARRAY['Cursor','Claude Code']::TEXT[],
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
  'Use when you need staff-level engineering precision, strict architectural invariants, and zero hallucinated code for i18n extractor.',
  'Applies negative constraints and step-by-step cognitive modeling to ensure production-ready output.',
  'Recommended models: Claude 3.7 Sonnet, GPT-4o, or Gemini 2.5 Pro with temperature set to 0.2.',
  27,
  true,
  true,
  'team',
  'Eengineer Staff Lead'
) ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  difficulty = EXCLUDED.difficulty,
  tools = EXCLUDED.tools,
  prompt_text = EXCLUDED.prompt_text,
  when_to_use = EXCLUDED.when_to_use,
  why_it_works = EXCLUDED.why_it_works,
  pro_tips = EXCLUDED.pro_tips,
  sort_order = EXCLUDED.sort_order;

INSERT INTO public.prompt_variables (prompt_id, name, description, is_multiline, sort_order)
SELECT id, 'COMPONENT_CODE', 'Component code (paste details)', true, 1
FROM public.prompts WHERE slug = 'i18n-extractor'
ON CONFLICT (prompt_id, name) DO UPDATE SET
  description = EXCLUDED.description,
  is_multiline = EXCLUDED.is_multiline,
  sort_order = EXCLUDED.sort_order;

INSERT INTO public.prompt_variables (prompt_id, name, description, is_multiline, sort_order)
SELECT id, 'I18N_LIBRARY', 'I18n library (paste details)', false, 2
FROM public.prompts WHERE slug = 'i18n-extractor'
ON CONFLICT (prompt_id, name) DO UPDATE SET
  description = EXCLUDED.description,
  is_multiline = EXCLUDED.is_multiline,
  sort_order = EXCLUDED.sort_order;

-- Prompt 28: monorepo-package-decoupler
INSERT INTO public.prompts (
  category_id, slug, title, difficulty, tools, prompt_text,
  when_to_use, why_it_works, pro_tips, sort_order, is_active, is_featurable, author_type, author_name
) VALUES (
  'c2222222-2222-2222-2222-222222222222',
  'monorepo-package-decoupler',
  'Monorepo Packages',
  'intermediate',
  ARRAY['Cursor','Claude Code','Windsurf']::TEXT[],
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
  'Use when you need staff-level engineering precision, strict architectural invariants, and zero hallucinated code for monorepo package decoupler.',
  'Applies negative constraints and step-by-step cognitive modeling to ensure production-ready output.',
  'Recommended models: Claude 3.7 Sonnet, GPT-4o, or Gemini 2.5 Pro with temperature set to 0.2.',
  28,
  true,
  true,
  'team',
  'Eengineer Staff Lead'
) ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  difficulty = EXCLUDED.difficulty,
  tools = EXCLUDED.tools,
  prompt_text = EXCLUDED.prompt_text,
  when_to_use = EXCLUDED.when_to_use,
  why_it_works = EXCLUDED.why_it_works,
  pro_tips = EXCLUDED.pro_tips,
  sort_order = EXCLUDED.sort_order;

INSERT INTO public.prompt_variables (prompt_id, name, description, is_multiline, sort_order)
SELECT id, 'LANGUAGE', 'Language (paste details)', false, 1
FROM public.prompts WHERE slug = 'monorepo-package-decoupler'
ON CONFLICT (prompt_id, name) DO UPDATE SET
  description = EXCLUDED.description,
  is_multiline = EXCLUDED.is_multiline,
  sort_order = EXCLUDED.sort_order;

INSERT INTO public.prompt_variables (prompt_id, name, description, is_multiline, sort_order)
SELECT id, 'EXTRACTION_CODE', 'Extraction code (paste details)', true, 2
FROM public.prompts WHERE slug = 'monorepo-package-decoupler'
ON CONFLICT (prompt_id, name) DO UPDATE SET
  description = EXCLUDED.description,
  is_multiline = EXCLUDED.is_multiline,
  sort_order = EXCLUDED.sort_order;

INSERT INTO public.prompt_variables (prompt_id, name, description, is_multiline, sort_order)
SELECT id, 'PACKAGE_NAME', 'Package name (paste details)', false, 3
FROM public.prompts WHERE slug = 'monorepo-package-decoupler'
ON CONFLICT (prompt_id, name) DO UPDATE SET
  description = EXCLUDED.description,
  is_multiline = EXCLUDED.is_multiline,
  sort_order = EXCLUDED.sort_order;

-- Prompt 29: bulletproof-pr-description
INSERT INTO public.prompts (
  category_id, slug, title, difficulty, tools, prompt_text,
  when_to_use, why_it_works, pro_tips, sort_order, is_active, is_featurable, author_type, author_name
) VALUES (
  'c3333333-3333-3333-3333-333333333333',
  'bulletproof-pr-description',
  'The Bulletproof PR Description',
  'intermediate',
  ARRAY['ChatGPT','Claude','Cursor']::TEXT[],
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
  'Use when you need staff-level engineering precision, strict architectural invariants, and zero hallucinated code for bulletproof pr description.',
  'Applies negative constraints and step-by-step cognitive modeling to ensure production-ready output.',
  'Recommended models: Claude 3.7 Sonnet, GPT-4o, or Gemini 2.5 Pro with temperature set to 0.2.',
  29,
  true,
  true,
  'team',
  'Eengineer Staff Lead'
) ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  difficulty = EXCLUDED.difficulty,
  tools = EXCLUDED.tools,
  prompt_text = EXCLUDED.prompt_text,
  when_to_use = EXCLUDED.when_to_use,
  why_it_works = EXCLUDED.why_it_works,
  pro_tips = EXCLUDED.pro_tips,
  sort_order = EXCLUDED.sort_order;

INSERT INTO public.prompt_variables (prompt_id, name, description, is_multiline, sort_order)
SELECT id, 'GIT_DIFF', 'Git diff (paste details)', true, 1
FROM public.prompts WHERE slug = 'bulletproof-pr-description'
ON CONFLICT (prompt_id, name) DO UPDATE SET
  description = EXCLUDED.description,
  is_multiline = EXCLUDED.is_multiline,
  sort_order = EXCLUDED.sort_order;

INSERT INTO public.prompt_variables (prompt_id, name, description, is_multiline, sort_order)
SELECT id, 'TICKET_DESCRIPTION', 'Ticket description (paste details)', false, 2
FROM public.prompts WHERE slug = 'bulletproof-pr-description'
ON CONFLICT (prompt_id, name) DO UPDATE SET
  description = EXCLUDED.description,
  is_multiline = EXCLUDED.is_multiline,
  sort_order = EXCLUDED.sort_order;

-- Prompt 30: rfc-tech-spec-builder
INSERT INTO public.prompts (
  category_id, slug, title, difficulty, tools, prompt_text,
  when_to_use, why_it_works, pro_tips, sort_order, is_active, is_featurable, author_type, author_name
) VALUES (
  'c3333333-3333-3333-3333-333333333333',
  'rfc-tech-spec-builder',
  'RFC / ADR',
  'intermediate',
  ARRAY['Claude 3.7 Sonnet','GPT-4o','Gemini 2.5 Pro']::TEXT[],
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
  'Use when you need staff-level engineering precision, strict architectural invariants, and zero hallucinated code for rfc tech spec builder.',
  'Applies negative constraints and step-by-step cognitive modeling to ensure production-ready output.',
  'Recommended models: Claude 3.7 Sonnet, GPT-4o, or Gemini 2.5 Pro with temperature set to 0.2.',
  30,
  true,
  true,
  'team',
  'Eengineer Staff Lead'
) ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  difficulty = EXCLUDED.difficulty,
  tools = EXCLUDED.tools,
  prompt_text = EXCLUDED.prompt_text,
  when_to_use = EXCLUDED.when_to_use,
  why_it_works = EXCLUDED.why_it_works,
  pro_tips = EXCLUDED.pro_tips,
  sort_order = EXCLUDED.sort_order;

INSERT INTO public.prompt_variables (prompt_id, name, description, is_multiline, sort_order)
SELECT id, 'FEATURE_TITLE', 'Feature title (paste details)', false, 1
FROM public.prompts WHERE slug = 'rfc-tech-spec-builder'
ON CONFLICT (prompt_id, name) DO UPDATE SET
  description = EXCLUDED.description,
  is_multiline = EXCLUDED.is_multiline,
  sort_order = EXCLUDED.sort_order;

INSERT INTO public.prompt_variables (prompt_id, name, description, is_multiline, sort_order)
SELECT id, 'PROBLEM_STATEMENT', 'Problem statement (paste details)', false, 2
FROM public.prompts WHERE slug = 'rfc-tech-spec-builder'
ON CONFLICT (prompt_id, name) DO UPDATE SET
  description = EXCLUDED.description,
  is_multiline = EXCLUDED.is_multiline,
  sort_order = EXCLUDED.sort_order;

INSERT INTO public.prompt_variables (prompt_id, name, description, is_multiline, sort_order)
SELECT id, 'CONSTRAINTS', 'Constraints (paste details)', false, 3
FROM public.prompts WHERE slug = 'rfc-tech-spec-builder'
ON CONFLICT (prompt_id, name) DO UPDATE SET
  description = EXCLUDED.description,
  is_multiline = EXCLUDED.is_multiline,
  sort_order = EXCLUDED.sort_order;

-- Prompt 31: blameless-post-mortem
INSERT INTO public.prompts (
  category_id, slug, title, difficulty, tools, prompt_text,
  when_to_use, why_it_works, pro_tips, sort_order, is_active, is_featurable, author_type, author_name
) VALUES (
  'c3333333-3333-3333-3333-333333333333',
  'blameless-post-mortem',
  'Blameless Post-Mortem',
  'intermediate',
  ARRAY['Claude 3.7 Sonnet','GPT-4o']::TEXT[],
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
  'Use when you need staff-level engineering precision, strict architectural invariants, and zero hallucinated code for blameless post mortem.',
  'Applies negative constraints and step-by-step cognitive modeling to ensure production-ready output.',
  'Recommended models: Claude 3.7 Sonnet, GPT-4o, or Gemini 2.5 Pro with temperature set to 0.2.',
  31,
  true,
  true,
  'team',
  'Eengineer Staff Lead'
) ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  difficulty = EXCLUDED.difficulty,
  tools = EXCLUDED.tools,
  prompt_text = EXCLUDED.prompt_text,
  when_to_use = EXCLUDED.when_to_use,
  why_it_works = EXCLUDED.why_it_works,
  pro_tips = EXCLUDED.pro_tips,
  sort_order = EXCLUDED.sort_order;

INSERT INTO public.prompt_variables (prompt_id, name, description, is_multiline, sort_order)
SELECT id, 'INCIDENT_RAW_NOTES', 'Incident raw notes (paste details)', true, 1
FROM public.prompts WHERE slug = 'blameless-post-mortem'
ON CONFLICT (prompt_id, name) DO UPDATE SET
  description = EXCLUDED.description,
  is_multiline = EXCLUDED.is_multiline,
  sort_order = EXCLUDED.sort_order;

-- Prompt 32: prd-to-technical-tasks
INSERT INTO public.prompts (
  category_id, slug, title, difficulty, tools, prompt_text,
  when_to_use, why_it_works, pro_tips, sort_order, is_active, is_featurable, author_type, author_name
) VALUES (
  'c3333333-3333-3333-3333-333333333333',
  'prd-to-technical-tasks',
  'The PRD to Technical Subtasks Splitter',
  'intermediate',
  ARRAY['Claude 3.7 Sonnet','GPT-4o']::TEXT[],
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
  'Use when you need staff-level engineering precision, strict architectural invariants, and zero hallucinated code for prd to technical tasks.',
  'Applies negative constraints and step-by-step cognitive modeling to ensure production-ready output.',
  'Recommended models: Claude 3.7 Sonnet, GPT-4o, or Gemini 2.5 Pro with temperature set to 0.2.',
  32,
  true,
  true,
  'team',
  'Eengineer Staff Lead'
) ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  difficulty = EXCLUDED.difficulty,
  tools = EXCLUDED.tools,
  prompt_text = EXCLUDED.prompt_text,
  when_to_use = EXCLUDED.when_to_use,
  why_it_works = EXCLUDED.why_it_works,
  pro_tips = EXCLUDED.pro_tips,
  sort_order = EXCLUDED.sort_order;

INSERT INTO public.prompt_variables (prompt_id, name, description, is_multiline, sort_order)
SELECT id, 'PRD_CONTENT', 'Prd content (paste details)', true, 1
FROM public.prompts WHERE slug = 'prd-to-technical-tasks'
ON CONFLICT (prompt_id, name) DO UPDATE SET
  description = EXCLUDED.description,
  is_multiline = EXCLUDED.is_multiline,
  sort_order = EXCLUDED.sort_order;

INSERT INTO public.prompt_variables (prompt_id, name, description, is_multiline, sort_order)
SELECT id, 'SPRINT_CONTEXT', 'Sprint context (paste details)', false, 2
FROM public.prompts WHERE slug = 'prd-to-technical-tasks'
ON CONFLICT (prompt_id, name) DO UPDATE SET
  description = EXCLUDED.description,
  is_multiline = EXCLUDED.is_multiline,
  sort_order = EXCLUDED.sort_order;

-- Prompt 33: readme-onboarding-architect
INSERT INTO public.prompts (
  category_id, slug, title, difficulty, tools, prompt_text,
  when_to_use, why_it_works, pro_tips, sort_order, is_active, is_featurable, author_type, author_name
) VALUES (
  'c3333333-3333-3333-3333-333333333333',
  'readme-onboarding-architect',
  'The Technical Onboarding & README Architect',
  'intermediate',
  ARRAY['ChatGPT','Claude']::TEXT[],
  'Generate a gold-standard README.md and Day-1 Developer Setup Runbook for the repository described below.

REQUIREMENTS:
1. Fast-Path Local Setup: Step-by-step commands to clone, install dependencies, configure environment variables (.env.example), run migrations, and launch local server in < 5 minutes.
2. Architecture At A Glance: 3-sentence summary of tech stack, folder structure diagram, and core data flow.
3. Common Pitfalls & FAQs: Troubleshooting for OS-specific quirks (macOS M-series vs Windows/WSL2), Docker port conflicts, and seed data scripts.

REPOSITORY CONTEXT:
- Tech Stack: {{TECH_STACK}}
- Key Commands: {{COMMANDS}} (build, dev, test, lint)
- Services & Dependencies: {{SERVICES}} (Postgres, Redis, external APIs)',
  'Use when you need staff-level engineering precision, strict architectural invariants, and zero hallucinated code for readme onboarding architect.',
  'Applies negative constraints and step-by-step cognitive modeling to ensure production-ready output.',
  'Recommended models: Claude 3.7 Sonnet, GPT-4o, or Gemini 2.5 Pro with temperature set to 0.2.',
  33,
  true,
  true,
  'team',
  'Eengineer Staff Lead'
) ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  difficulty = EXCLUDED.difficulty,
  tools = EXCLUDED.tools,
  prompt_text = EXCLUDED.prompt_text,
  when_to_use = EXCLUDED.when_to_use,
  why_it_works = EXCLUDED.why_it_works,
  pro_tips = EXCLUDED.pro_tips,
  sort_order = EXCLUDED.sort_order;

INSERT INTO public.prompt_variables (prompt_id, name, description, is_multiline, sort_order)
SELECT id, 'TECH_STACK', 'Tech stack (paste details)', false, 1
FROM public.prompts WHERE slug = 'readme-onboarding-architect'
ON CONFLICT (prompt_id, name) DO UPDATE SET
  description = EXCLUDED.description,
  is_multiline = EXCLUDED.is_multiline,
  sort_order = EXCLUDED.sort_order;

INSERT INTO public.prompt_variables (prompt_id, name, description, is_multiline, sort_order)
SELECT id, 'COMMANDS', 'Commands (paste details)', false, 2
FROM public.prompts WHERE slug = 'readme-onboarding-architect'
ON CONFLICT (prompt_id, name) DO UPDATE SET
  description = EXCLUDED.description,
  is_multiline = EXCLUDED.is_multiline,
  sort_order = EXCLUDED.sort_order;

INSERT INTO public.prompt_variables (prompt_id, name, description, is_multiline, sort_order)
SELECT id, 'SERVICES', 'Services (paste details)', false, 3
FROM public.prompts WHERE slug = 'readme-onboarding-architect'
ON CONFLICT (prompt_id, name) DO UPDATE SET
  description = EXCLUDED.description,
  is_multiline = EXCLUDED.is_multiline,
  sort_order = EXCLUDED.sort_order;

-- Prompt 34: stakeholder-status-translator
INSERT INTO public.prompts (
  category_id, slug, title, difficulty, tools, prompt_text,
  when_to_use, why_it_works, pro_tips, sort_order, is_active, is_featurable, author_type, author_name
) VALUES (
  'c3333333-3333-3333-3333-333333333333',
  'stakeholder-status-translator',
  'The Engineering-to-Stakeholder Translator',
  'intermediate',
  ARRAY['ChatGPT','Claude']::TEXT[],
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
  'Use when you need staff-level engineering precision, strict architectural invariants, and zero hallucinated code for stakeholder status translator.',
  'Applies negative constraints and step-by-step cognitive modeling to ensure production-ready output.',
  'Recommended models: Claude 3.7 Sonnet, GPT-4o, or Gemini 2.5 Pro with temperature set to 0.2.',
  34,
  true,
  true,
  'team',
  'Eengineer Staff Lead'
) ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  difficulty = EXCLUDED.difficulty,
  tools = EXCLUDED.tools,
  prompt_text = EXCLUDED.prompt_text,
  when_to_use = EXCLUDED.when_to_use,
  why_it_works = EXCLUDED.why_it_works,
  pro_tips = EXCLUDED.pro_tips,
  sort_order = EXCLUDED.sort_order;

INSERT INTO public.prompt_variables (prompt_id, name, description, is_multiline, sort_order)
SELECT id, 'TECHNICAL_NOTES', 'Technical notes (paste details)', true, 1
FROM public.prompts WHERE slug = 'stakeholder-status-translator'
ON CONFLICT (prompt_id, name) DO UPDATE SET
  description = EXCLUDED.description,
  is_multiline = EXCLUDED.is_multiline,
  sort_order = EXCLUDED.sort_order;

INSERT INTO public.prompt_variables (prompt_id, name, description, is_multiline, sort_order)
SELECT id, 'STAKEHOLDER_AUDIENCE', 'Stakeholder audience (paste details)', false, 2
FROM public.prompts WHERE slug = 'stakeholder-status-translator'
ON CONFLICT (prompt_id, name) DO UPDATE SET
  description = EXCLUDED.description,
  is_multiline = EXCLUDED.is_multiline,
  sort_order = EXCLUDED.sort_order;

-- Prompt 35: constructive-code-review-rewriter
INSERT INTO public.prompts (
  category_id, slug, title, difficulty, tools, prompt_text,
  when_to_use, why_it_works, pro_tips, sort_order, is_active, is_featurable, author_type, author_name
) VALUES (
  'c3333333-3333-3333-3333-333333333333',
  'constructive-code-review-rewriter',
  'The Constructive Code Review Feedback Rewriter',
  'intermediate',
  ARRAY['ChatGPT','Claude']::TEXT[],
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
  'Use when you need staff-level engineering precision, strict architectural invariants, and zero hallucinated code for constructive code review rewriter.',
  'Applies negative constraints and step-by-step cognitive modeling to ensure production-ready output.',
  'Recommended models: Claude 3.7 Sonnet, GPT-4o, or Gemini 2.5 Pro with temperature set to 0.2.',
  35,
  true,
  true,
  'team',
  'Eengineer Staff Lead'
) ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  difficulty = EXCLUDED.difficulty,
  tools = EXCLUDED.tools,
  prompt_text = EXCLUDED.prompt_text,
  when_to_use = EXCLUDED.when_to_use,
  why_it_works = EXCLUDED.why_it_works,
  pro_tips = EXCLUDED.pro_tips,
  sort_order = EXCLUDED.sort_order;

INSERT INTO public.prompt_variables (prompt_id, name, description, is_multiline, sort_order)
SELECT id, 'RAW_COMMENTS', 'Raw comments (paste details)', false, 1
FROM public.prompts WHERE slug = 'constructive-code-review-rewriter'
ON CONFLICT (prompt_id, name) DO UPDATE SET
  description = EXCLUDED.description,
  is_multiline = EXCLUDED.is_multiline,
  sort_order = EXCLUDED.sort_order;

-- Prompt 36: incident-runbook-generator
INSERT INTO public.prompts (
  category_id, slug, title, difficulty, tools, prompt_text,
  when_to_use, why_it_works, pro_tips, sort_order, is_active, is_featurable, author_type, author_name
) VALUES (
  'c3333333-3333-3333-3333-333333333333',
  'incident-runbook-generator',
  'Incident Runbook / SOP',
  'intermediate',
  ARRAY['Claude 3.7 Sonnet','GPT-4o']::TEXT[],
  'Generate a production Incident Response Runbook (Standard Operating Procedure) for on-call engineers facing the alert scenario below.

RUNBOOK REQUIREMENTS:
1. Triage in < 2 Minutes: Step-by-step terminal commands to determine severity, blast radius, and affected user count.
2. Immediate Mitigation: Safe stop-gap actions (traffic shed, rollback, feature flag disable, replica promotion) before finding the deep root cause.
3. Diagnostic Commands: Specific CLI queries (grep, kubectl, sql, curl) to isolate the failing component.
4. Escalation Path: Clear criteria for when to escalate to Principal Engineers or VP of Engineering.

ALERT / SCENARIO:
- Alert Name: {{ALERT_NAME}} (e.g. PostgresConnectionPoolExhausted, High5xxRateOnCheckout)
- Infrastructure: {{INFRASTRUCTURE_CONTEXT}}',
  'Use when you need staff-level engineering precision, strict architectural invariants, and zero hallucinated code for incident runbook generator.',
  'Applies negative constraints and step-by-step cognitive modeling to ensure production-ready output.',
  'Recommended models: Claude 3.7 Sonnet, GPT-4o, or Gemini 2.5 Pro with temperature set to 0.2.',
  36,
  true,
  true,
  'team',
  'Eengineer Staff Lead'
) ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  difficulty = EXCLUDED.difficulty,
  tools = EXCLUDED.tools,
  prompt_text = EXCLUDED.prompt_text,
  when_to_use = EXCLUDED.when_to_use,
  why_it_works = EXCLUDED.why_it_works,
  pro_tips = EXCLUDED.pro_tips,
  sort_order = EXCLUDED.sort_order;

INSERT INTO public.prompt_variables (prompt_id, name, description, is_multiline, sort_order)
SELECT id, 'ALERT_NAME', 'Alert name (paste details)', false, 1
FROM public.prompts WHERE slug = 'incident-runbook-generator'
ON CONFLICT (prompt_id, name) DO UPDATE SET
  description = EXCLUDED.description,
  is_multiline = EXCLUDED.is_multiline,
  sort_order = EXCLUDED.sort_order;

INSERT INTO public.prompt_variables (prompt_id, name, description, is_multiline, sort_order)
SELECT id, 'INFRASTRUCTURE_CONTEXT', 'Infrastructure context (paste details)', false, 2
FROM public.prompts WHERE slug = 'incident-runbook-generator'
ON CONFLICT (prompt_id, name) DO UPDATE SET
  description = EXCLUDED.description,
  is_multiline = EXCLUDED.is_multiline,
  sort_order = EXCLUDED.sort_order;

-- Prompt 37: sprint-retro-extractor
INSERT INTO public.prompts (
  category_id, slug, title, difficulty, tools, prompt_text,
  when_to_use, why_it_works, pro_tips, sort_order, is_active, is_featurable, author_type, author_name
) VALUES (
  'c3333333-3333-3333-3333-333333333333',
  'sprint-retro-extractor',
  'The Sprint Retrospective Action Item Extractor',
  'intermediate',
  ARRAY['ChatGPT','Claude']::TEXT[],
  'Analyze the raw feedback from our team sprint retrospective and extract 3-4 systemic, high-leverage Action Items with clear owners and success metrics.

ANALYSIS RULES:
1. Systemic Focus: Distinguish one-off bad luck from recurring friction in tooling, CI/CD, review bottlenecks, or unclear specifications.
2. Actionable & Measurable: Action items must not be vague (e.g. ''write better code''). They must be concrete (e.g. ''Add pre-commit hook with Oxlint to catch type errors before PR'').

RAW RETRO FEEDBACK:
```
{{RETRO_FEEDBACK}}
```',
  'Use when you need staff-level engineering precision, strict architectural invariants, and zero hallucinated code for sprint retro extractor.',
  'Applies negative constraints and step-by-step cognitive modeling to ensure production-ready output.',
  'Recommended models: Claude 3.7 Sonnet, GPT-4o, or Gemini 2.5 Pro with temperature set to 0.2.',
  37,
  true,
  true,
  'team',
  'Eengineer Staff Lead'
) ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  difficulty = EXCLUDED.difficulty,
  tools = EXCLUDED.tools,
  prompt_text = EXCLUDED.prompt_text,
  when_to_use = EXCLUDED.when_to_use,
  why_it_works = EXCLUDED.why_it_works,
  pro_tips = EXCLUDED.pro_tips,
  sort_order = EXCLUDED.sort_order;

INSERT INTO public.prompt_variables (prompt_id, name, description, is_multiline, sort_order)
SELECT id, 'RETRO_FEEDBACK', 'Retro feedback (paste details)', false, 1
FROM public.prompts WHERE slug = 'sprint-retro-extractor'
ON CONFLICT (prompt_id, name) DO UPDATE SET
  description = EXCLUDED.description,
  is_multiline = EXCLUDED.is_multiline,
  sort_order = EXCLUDED.sort_order;

-- Prompt 38: changelog-release-writer
INSERT INTO public.prompts (
  category_id, slug, title, difficulty, tools, prompt_text,
  when_to_use, why_it_works, pro_tips, sort_order, is_active, is_featurable, author_type, author_name
) VALUES (
  'c3333333-3333-3333-3333-333333333333',
  'changelog-release-writer',
  'Changelog & Breaking Changes',
  'intermediate',
  ARRAY['ChatGPT','Claude']::TEXT[],
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
  'Use when you need staff-level engineering precision, strict architectural invariants, and zero hallucinated code for changelog release writer.',
  'Applies negative constraints and step-by-step cognitive modeling to ensure production-ready output.',
  'Recommended models: Claude 3.7 Sonnet, GPT-4o, or Gemini 2.5 Pro with temperature set to 0.2.',
  38,
  true,
  true,
  'team',
  'Eengineer Staff Lead'
) ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  difficulty = EXCLUDED.difficulty,
  tools = EXCLUDED.tools,
  prompt_text = EXCLUDED.prompt_text,
  when_to_use = EXCLUDED.when_to_use,
  why_it_works = EXCLUDED.why_it_works,
  pro_tips = EXCLUDED.pro_tips,
  sort_order = EXCLUDED.sort_order;

INSERT INTO public.prompt_variables (prompt_id, name, description, is_multiline, sort_order)
SELECT id, 'RELEASE_NOTES', 'Release notes (paste details)', true, 1
FROM public.prompts WHERE slug = 'changelog-release-writer'
ON CONFLICT (prompt_id, name) DO UPDATE SET
  description = EXCLUDED.description,
  is_multiline = EXCLUDED.is_multiline,
  sort_order = EXCLUDED.sort_order;

INSERT INTO public.prompt_variables (prompt_id, name, description, is_multiline, sort_order)
SELECT id, 'VERSION', 'Version (paste details)', false, 2
FROM public.prompts WHERE slug = 'changelog-release-writer'
ON CONFLICT (prompt_id, name) DO UPDATE SET
  description = EXCLUDED.description,
  is_multiline = EXCLUDED.is_multiline,
  sort_order = EXCLUDED.sort_order;

-- Prompt 39: stack-trace-interrogator
INSERT INTO public.prompts (
  category_id, slug, title, difficulty, tools, prompt_text,
  when_to_use, why_it_works, pro_tips, sort_order, is_active, is_featurable, author_type, author_name
) VALUES (
  'c4444444-4444-4444-4444-444444444444',
  'stack-trace-interrogator',
  'The Stack Trace Deep Interrogator',
  'intermediate',
  ARRAY['ChatGPT','Claude','Cursor']::TEXT[],
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
  'Use when you need staff-level engineering precision, strict architectural invariants, and zero hallucinated code for stack trace interrogator.',
  'Applies negative constraints and step-by-step cognitive modeling to ensure production-ready output.',
  'Recommended models: Claude 3.7 Sonnet, GPT-4o, or Gemini 2.5 Pro with temperature set to 0.2.',
  39,
  true,
  true,
  'team',
  'Eengineer Staff Lead'
) ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  difficulty = EXCLUDED.difficulty,
  tools = EXCLUDED.tools,
  prompt_text = EXCLUDED.prompt_text,
  when_to_use = EXCLUDED.when_to_use,
  why_it_works = EXCLUDED.why_it_works,
  pro_tips = EXCLUDED.pro_tips,
  sort_order = EXCLUDED.sort_order;

INSERT INTO public.prompt_variables (prompt_id, name, description, is_multiline, sort_order)
SELECT id, 'ERROR_TEXT', 'Error text (paste details)', false, 1
FROM public.prompts WHERE slug = 'stack-trace-interrogator'
ON CONFLICT (prompt_id, name) DO UPDATE SET
  description = EXCLUDED.description,
  is_multiline = EXCLUDED.is_multiline,
  sort_order = EXCLUDED.sort_order;

INSERT INTO public.prompt_variables (prompt_id, name, description, is_multiline, sort_order)
SELECT id, 'LANGUAGE', 'Language (paste details)', false, 2
FROM public.prompts WHERE slug = 'stack-trace-interrogator'
ON CONFLICT (prompt_id, name) DO UPDATE SET
  description = EXCLUDED.description,
  is_multiline = EXCLUDED.is_multiline,
  sort_order = EXCLUDED.sort_order;

INSERT INTO public.prompt_variables (prompt_id, name, description, is_multiline, sort_order)
SELECT id, 'CODE_SNIPPET', 'Code snippet (paste details)', true, 3
FROM public.prompts WHERE slug = 'stack-trace-interrogator'
ON CONFLICT (prompt_id, name) DO UPDATE SET
  description = EXCLUDED.description,
  is_multiline = EXCLUDED.is_multiline,
  sort_order = EXCLUDED.sort_order;

-- Prompt 40: typescript-error-untangler
INSERT INTO public.prompts (
  category_id, slug, title, difficulty, tools, prompt_text,
  when_to_use, why_it_works, pro_tips, sort_order, is_active, is_featurable, author_type, author_name
) VALUES (
  'c4444444-4444-4444-4444-444444444444',
  'typescript-error-untangler',
  'The TypeScript Type Mismatch Untangler',
  'intermediate',
  ARRAY['Claude 3.7 Sonnet','GPT-4o','Cursor']::TEXT[],
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
  'Use when you need staff-level engineering precision, strict architectural invariants, and zero hallucinated code for typescript error untangler.',
  'Applies negative constraints and step-by-step cognitive modeling to ensure production-ready output.',
  'Recommended models: Claude 3.7 Sonnet, GPT-4o, or Gemini 2.5 Pro with temperature set to 0.2.',
  40,
  true,
  true,
  'team',
  'Eengineer Staff Lead'
) ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  difficulty = EXCLUDED.difficulty,
  tools = EXCLUDED.tools,
  prompt_text = EXCLUDED.prompt_text,
  when_to_use = EXCLUDED.when_to_use,
  why_it_works = EXCLUDED.why_it_works,
  pro_tips = EXCLUDED.pro_tips,
  sort_order = EXCLUDED.sort_order;

INSERT INTO public.prompt_variables (prompt_id, name, description, is_multiline, sort_order)
SELECT id, 'TS_ERROR', 'Ts error (paste details)', false, 1
FROM public.prompts WHERE slug = 'typescript-error-untangler'
ON CONFLICT (prompt_id, name) DO UPDATE SET
  description = EXCLUDED.description,
  is_multiline = EXCLUDED.is_multiline,
  sort_order = EXCLUDED.sort_order;

INSERT INTO public.prompt_variables (prompt_id, name, description, is_multiline, sort_order)
SELECT id, 'TS_CODE', 'Ts code (paste details)', true, 2
FROM public.prompts WHERE slug = 'typescript-error-untangler'
ON CONFLICT (prompt_id, name) DO UPDATE SET
  description = EXCLUDED.description,
  is_multiline = EXCLUDED.is_multiline,
  sort_order = EXCLUDED.sort_order;

-- Prompt 41: db-deadlock-rls-debugger
INSERT INTO public.prompts (
  category_id, slug, title, difficulty, tools, prompt_text,
  when_to_use, why_it_works, pro_tips, sort_order, is_active, is_featurable, author_type, author_name
) VALUES (
  'c4444444-4444-4444-4444-444444444444',
  'db-deadlock-rls-debugger',
  'The Database Deadlock & RLS Policy Debugger',
  'intermediate',
  ARRAY['Claude 3.7 Sonnet','GPT-4o']::TEXT[],
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
  'Use when you need staff-level engineering precision, strict architectural invariants, and zero hallucinated code for db deadlock rls debugger.',
  'Applies negative constraints and step-by-step cognitive modeling to ensure production-ready output.',
  'Recommended models: Claude 3.7 Sonnet, GPT-4o, or Gemini 2.5 Pro with temperature set to 0.2.',
  41,
  true,
  true,
  'team',
  'Eengineer Staff Lead'
) ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  difficulty = EXCLUDED.difficulty,
  tools = EXCLUDED.tools,
  prompt_text = EXCLUDED.prompt_text,
  when_to_use = EXCLUDED.when_to_use,
  why_it_works = EXCLUDED.why_it_works,
  pro_tips = EXCLUDED.pro_tips,
  sort_order = EXCLUDED.sort_order;

INSERT INTO public.prompt_variables (prompt_id, name, description, is_multiline, sort_order)
SELECT id, 'DB_ERROR', 'Db error (paste details)', false, 1
FROM public.prompts WHERE slug = 'db-deadlock-rls-debugger'
ON CONFLICT (prompt_id, name) DO UPDATE SET
  description = EXCLUDED.description,
  is_multiline = EXCLUDED.is_multiline,
  sort_order = EXCLUDED.sort_order;

INSERT INTO public.prompt_variables (prompt_id, name, description, is_multiline, sort_order)
SELECT id, 'SCHEMA_AND_QUERY', 'Schema and query (paste details)', true, 2
FROM public.prompts WHERE slug = 'db-deadlock-rls-debugger'
ON CONFLICT (prompt_id, name) DO UPDATE SET
  description = EXCLUDED.description,
  is_multiline = EXCLUDED.is_multiline,
  sort_order = EXCLUDED.sort_order;

-- Prompt 42: api-network-diagnostician
INSERT INTO public.prompts (
  category_id, slug, title, difficulty, tools, prompt_text,
  when_to_use, why_it_works, pro_tips, sort_order, is_active, is_featurable, author_type, author_name
) VALUES (
  'c4444444-4444-4444-4444-444444444444',
  'api-network-diagnostician',
  'The API & Network Failure Diagnostician',
  'intermediate',
  ARRAY['ChatGPT','Claude','Cursor']::TEXT[],
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
  'Use when you need staff-level engineering precision, strict architectural invariants, and zero hallucinated code for api network diagnostician.',
  'Applies negative constraints and step-by-step cognitive modeling to ensure production-ready output.',
  'Recommended models: Claude 3.7 Sonnet, GPT-4o, or Gemini 2.5 Pro with temperature set to 0.2.',
  42,
  true,
  true,
  'team',
  'Eengineer Staff Lead'
) ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  difficulty = EXCLUDED.difficulty,
  tools = EXCLUDED.tools,
  prompt_text = EXCLUDED.prompt_text,
  when_to_use = EXCLUDED.when_to_use,
  why_it_works = EXCLUDED.why_it_works,
  pro_tips = EXCLUDED.pro_tips,
  sort_order = EXCLUDED.sort_order;

INSERT INTO public.prompt_variables (prompt_id, name, description, is_multiline, sort_order)
SELECT id, 'ERROR_OUTPUT', 'Error output (paste details)', false, 1
FROM public.prompts WHERE slug = 'api-network-diagnostician'
ON CONFLICT (prompt_id, name) DO UPDATE SET
  description = EXCLUDED.description,
  is_multiline = EXCLUDED.is_multiline,
  sort_order = EXCLUDED.sort_order;

INSERT INTO public.prompt_variables (prompt_id, name, description, is_multiline, sort_order)
SELECT id, 'REQUEST_DETAILS', 'Request details (paste details)', true, 2
FROM public.prompts WHERE slug = 'api-network-diagnostician'
ON CONFLICT (prompt_id, name) DO UPDATE SET
  description = EXCLUDED.description,
  is_multiline = EXCLUDED.is_multiline,
  sort_order = EXCLUDED.sort_order;

INSERT INTO public.prompt_variables (prompt_id, name, description, is_multiline, sort_order)
SELECT id, 'ENVIRONMENT', 'Environment (paste details)', false, 3
FROM public.prompts WHERE slug = 'api-network-diagnostician'
ON CONFLICT (prompt_id, name) DO UPDATE SET
  description = EXCLUDED.description,
  is_multiline = EXCLUDED.is_multiline,
  sort_order = EXCLUDED.sort_order;

-- Prompt 43: git-conflict-surgeon
INSERT INTO public.prompts (
  category_id, slug, title, difficulty, tools, prompt_text,
  when_to_use, why_it_works, pro_tips, sort_order, is_active, is_featurable, author_type, author_name
) VALUES (
  'c4444444-4444-4444-4444-444444444444',
  'git-conflict-surgeon',
  'Merge / Rebase',
  'intermediate',
  ARRAY['ChatGPT','Claude','Cursor']::TEXT[],
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
  'Use when you need staff-level engineering precision, strict architectural invariants, and zero hallucinated code for git conflict surgeon.',
  'Applies negative constraints and step-by-step cognitive modeling to ensure production-ready output.',
  'Recommended models: Claude 3.7 Sonnet, GPT-4o, or Gemini 2.5 Pro with temperature set to 0.2.',
  43,
  true,
  true,
  'team',
  'Eengineer Staff Lead'
) ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  difficulty = EXCLUDED.difficulty,
  tools = EXCLUDED.tools,
  prompt_text = EXCLUDED.prompt_text,
  when_to_use = EXCLUDED.when_to_use,
  why_it_works = EXCLUDED.why_it_works,
  pro_tips = EXCLUDED.pro_tips,
  sort_order = EXCLUDED.sort_order;

INSERT INTO public.prompt_variables (prompt_id, name, description, is_multiline, sort_order)
SELECT id, 'GIT_ERROR', 'Git error (paste details)', false, 1
FROM public.prompts WHERE slug = 'git-conflict-surgeon'
ON CONFLICT (prompt_id, name) DO UPDATE SET
  description = EXCLUDED.description,
  is_multiline = EXCLUDED.is_multiline,
  sort_order = EXCLUDED.sort_order;

INSERT INTO public.prompt_variables (prompt_id, name, description, is_multiline, sort_order)
SELECT id, 'BRANCH_CONTEXT', 'Branch context (paste details)', false, 2
FROM public.prompts WHERE slug = 'git-conflict-surgeon'
ON CONFLICT (prompt_id, name) DO UPDATE SET
  description = EXCLUDED.description,
  is_multiline = EXCLUDED.is_multiline,
  sort_order = EXCLUDED.sort_order;

INSERT INTO public.prompt_variables (prompt_id, name, description, is_multiline, sort_order)
SELECT id, 'INTENDED_ACTION', 'Intended action (paste details)', false, 3
FROM public.prompts WHERE slug = 'git-conflict-surgeon'
ON CONFLICT (prompt_id, name) DO UPDATE SET
  description = EXCLUDED.description,
  is_multiline = EXCLUDED.is_multiline,
  sort_order = EXCLUDED.sort_order;

-- Prompt 44: docker-deploy-debugger
INSERT INTO public.prompts (
  category_id, slug, title, difficulty, tools, prompt_text,
  when_to_use, why_it_works, pro_tips, sort_order, is_active, is_featurable, author_type, author_name
) VALUES (
  'c4444444-4444-4444-4444-444444444444',
  'docker-deploy-debugger',
  'The Docker & Deployment Pipeline Debugger',
  'intermediate',
  ARRAY['ChatGPT','Claude','Cursor']::TEXT[],
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
  'Use when you need staff-level engineering precision, strict architectural invariants, and zero hallucinated code for docker deploy debugger.',
  'Applies negative constraints and step-by-step cognitive modeling to ensure production-ready output.',
  'Recommended models: Claude 3.7 Sonnet, GPT-4o, or Gemini 2.5 Pro with temperature set to 0.2.',
  44,
  true,
  true,
  'team',
  'Eengineer Staff Lead'
) ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  difficulty = EXCLUDED.difficulty,
  tools = EXCLUDED.tools,
  prompt_text = EXCLUDED.prompt_text,
  when_to_use = EXCLUDED.when_to_use,
  why_it_works = EXCLUDED.why_it_works,
  pro_tips = EXCLUDED.pro_tips,
  sort_order = EXCLUDED.sort_order;

INSERT INTO public.prompt_variables (prompt_id, name, description, is_multiline, sort_order)
SELECT id, 'DEPLOY_ERROR', 'Deploy error (paste details)', false, 1
FROM public.prompts WHERE slug = 'docker-deploy-debugger'
ON CONFLICT (prompt_id, name) DO UPDATE SET
  description = EXCLUDED.description,
  is_multiline = EXCLUDED.is_multiline,
  sort_order = EXCLUDED.sort_order;

INSERT INTO public.prompt_variables (prompt_id, name, description, is_multiline, sort_order)
SELECT id, 'CONFIG_FORMAT', 'Config format (paste details)', false, 2
FROM public.prompts WHERE slug = 'docker-deploy-debugger'
ON CONFLICT (prompt_id, name) DO UPDATE SET
  description = EXCLUDED.description,
  is_multiline = EXCLUDED.is_multiline,
  sort_order = EXCLUDED.sort_order;

INSERT INTO public.prompt_variables (prompt_id, name, description, is_multiline, sort_order)
SELECT id, 'CONFIG_CONTENT', 'Config content (paste details)', true, 3
FROM public.prompts WHERE slug = 'docker-deploy-debugger'
ON CONFLICT (prompt_id, name) DO UPDATE SET
  description = EXCLUDED.description,
  is_multiline = EXCLUDED.is_multiline,
  sort_order = EXCLUDED.sort_order;

INSERT INTO public.prompt_variables (prompt_id, name, description, is_multiline, sort_order)
SELECT id, 'DEPLOY_TARGET', 'Deploy target (paste details)', false, 4
FROM public.prompts WHERE slug = 'docker-deploy-debugger'
ON CONFLICT (prompt_id, name) DO UPDATE SET
  description = EXCLUDED.description,
  is_multiline = EXCLUDED.is_multiline,
  sort_order = EXCLUDED.sort_order;

-- Prompt 45: react-hydration-resolver
INSERT INTO public.prompts (
  category_id, slug, title, difficulty, tools, prompt_text,
  when_to_use, why_it_works, pro_tips, sort_order, is_active, is_featurable, author_type, author_name
) VALUES (
  'c4444444-4444-4444-4444-444444444444',
  'react-hydration-resolver',
  'Hydration Mismatch',
  'intermediate',
  ARRAY['Claude 3.7 Sonnet','GPT-4o','Cursor']::TEXT[],
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
  'Use when you need staff-level engineering precision, strict architectural invariants, and zero hallucinated code for react hydration resolver.',
  'Applies negative constraints and step-by-step cognitive modeling to ensure production-ready output.',
  'Recommended models: Claude 3.7 Sonnet, GPT-4o, or Gemini 2.5 Pro with temperature set to 0.2.',
  45,
  true,
  true,
  'team',
  'Eengineer Staff Lead'
) ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  difficulty = EXCLUDED.difficulty,
  tools = EXCLUDED.tools,
  prompt_text = EXCLUDED.prompt_text,
  when_to_use = EXCLUDED.when_to_use,
  why_it_works = EXCLUDED.why_it_works,
  pro_tips = EXCLUDED.pro_tips,
  sort_order = EXCLUDED.sort_order;

INSERT INTO public.prompt_variables (prompt_id, name, description, is_multiline, sort_order)
SELECT id, 'HYDRATION_ERROR', 'Hydration error (paste details)', false, 1
FROM public.prompts WHERE slug = 'react-hydration-resolver'
ON CONFLICT (prompt_id, name) DO UPDATE SET
  description = EXCLUDED.description,
  is_multiline = EXCLUDED.is_multiline,
  sort_order = EXCLUDED.sort_order;

INSERT INTO public.prompt_variables (prompt_id, name, description, is_multiline, sort_order)
SELECT id, 'COMPONENT_CODE', 'Component code (paste details)', true, 2
FROM public.prompts WHERE slug = 'react-hydration-resolver'
ON CONFLICT (prompt_id, name) DO UPDATE SET
  description = EXCLUDED.description,
  is_multiline = EXCLUDED.is_multiline,
  sort_order = EXCLUDED.sort_order;

-- Prompt 46: nodejs-oom-investigator
INSERT INTO public.prompts (
  category_id, slug, title, difficulty, tools, prompt_text,
  when_to_use, why_it_works, pro_tips, sort_order, is_active, is_featurable, author_type, author_name
) VALUES (
  'c4444444-4444-4444-4444-444444444444',
  'nodejs-oom-investigator',
  'Node.js Heap OOM',
  'intermediate',
  ARRAY['Claude 3.7 Sonnet','GPT-4o']::TEXT[],
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
  'Use when you need staff-level engineering precision, strict architectural invariants, and zero hallucinated code for nodejs oom investigator.',
  'Applies negative constraints and step-by-step cognitive modeling to ensure production-ready output.',
  'Recommended models: Claude 3.7 Sonnet, GPT-4o, or Gemini 2.5 Pro with temperature set to 0.2.',
  46,
  true,
  true,
  'team',
  'Eengineer Staff Lead'
) ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  difficulty = EXCLUDED.difficulty,
  tools = EXCLUDED.tools,
  prompt_text = EXCLUDED.prompt_text,
  when_to_use = EXCLUDED.when_to_use,
  why_it_works = EXCLUDED.why_it_works,
  pro_tips = EXCLUDED.pro_tips,
  sort_order = EXCLUDED.sort_order;

INSERT INTO public.prompt_variables (prompt_id, name, description, is_multiline, sort_order)
SELECT id, 'OOM_LOGS', 'Oom logs (paste details)', true, 1
FROM public.prompts WHERE slug = 'nodejs-oom-investigator'
ON CONFLICT (prompt_id, name) DO UPDATE SET
  description = EXCLUDED.description,
  is_multiline = EXCLUDED.is_multiline,
  sort_order = EXCLUDED.sort_order;

INSERT INTO public.prompt_variables (prompt_id, name, description, is_multiline, sort_order)
SELECT id, 'PIPELINE_CODE', 'Pipeline code (paste details)', true, 2
FROM public.prompts WHERE slug = 'nodejs-oom-investigator'
ON CONFLICT (prompt_id, name) DO UPDATE SET
  description = EXCLUDED.description,
  is_multiline = EXCLUDED.is_multiline,
  sort_order = EXCLUDED.sort_order;

-- Prompt 47: cors-preflight-fixer
INSERT INTO public.prompts (
  category_id, slug, title, difficulty, tools, prompt_text,
  when_to_use, why_it_works, pro_tips, sort_order, is_active, is_featurable, author_type, author_name
) VALUES (
  'c4444444-4444-4444-4444-444444444444',
  'cors-preflight-fixer',
  'The CORS & Preflight Header Deep Fixer',
  'intermediate',
  ARRAY['ChatGPT','Claude','Cursor']::TEXT[],
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
  'Use when you need staff-level engineering precision, strict architectural invariants, and zero hallucinated code for cors preflight fixer.',
  'Applies negative constraints and step-by-step cognitive modeling to ensure production-ready output.',
  'Recommended models: Claude 3.7 Sonnet, GPT-4o, or Gemini 2.5 Pro with temperature set to 0.2.',
  47,
  true,
  true,
  'team',
  'Eengineer Staff Lead'
) ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  difficulty = EXCLUDED.difficulty,
  tools = EXCLUDED.tools,
  prompt_text = EXCLUDED.prompt_text,
  when_to_use = EXCLUDED.when_to_use,
  why_it_works = EXCLUDED.why_it_works,
  pro_tips = EXCLUDED.pro_tips,
  sort_order = EXCLUDED.sort_order;

INSERT INTO public.prompt_variables (prompt_id, name, description, is_multiline, sort_order)
SELECT id, 'CORS_ERROR', 'Cors error (paste details)', false, 1
FROM public.prompts WHERE slug = 'cors-preflight-fixer'
ON CONFLICT (prompt_id, name) DO UPDATE SET
  description = EXCLUDED.description,
  is_multiline = EXCLUDED.is_multiline,
  sort_order = EXCLUDED.sort_order;

INSERT INTO public.prompt_variables (prompt_id, name, description, is_multiline, sort_order)
SELECT id, 'LANGUAGE', 'Language (paste details)', false, 2
FROM public.prompts WHERE slug = 'cors-preflight-fixer'
ON CONFLICT (prompt_id, name) DO UPDATE SET
  description = EXCLUDED.description,
  is_multiline = EXCLUDED.is_multiline,
  sort_order = EXCLUDED.sort_order;

INSERT INTO public.prompt_variables (prompt_id, name, description, is_multiline, sort_order)
SELECT id, 'BACKEND_CORS_CODE', 'Backend cors code (paste details)', true, 3
FROM public.prompts WHERE slug = 'cors-preflight-fixer'
ON CONFLICT (prompt_id, name) DO UPDATE SET
  description = EXCLUDED.description,
  is_multiline = EXCLUDED.is_multiline,
  sort_order = EXCLUDED.sort_order;

INSERT INTO public.prompt_variables (prompt_id, name, description, is_multiline, sort_order)
SELECT id, 'CLIENT_ORIGIN', 'Client origin (paste details)', false, 4
FROM public.prompts WHERE slug = 'cors-preflight-fixer'
ON CONFLICT (prompt_id, name) DO UPDATE SET
  description = EXCLUDED.description,
  is_multiline = EXCLUDED.is_multiline,
  sort_order = EXCLUDED.sort_order;

INSERT INTO public.prompt_variables (prompt_id, name, description, is_multiline, sort_order)
SELECT id, 'SERVER_URL', 'Server url (paste details)', false, 5
FROM public.prompts WHERE slug = 'cors-preflight-fixer'
ON CONFLICT (prompt_id, name) DO UPDATE SET
  description = EXCLUDED.description,
  is_multiline = EXCLUDED.is_multiline,
  sort_order = EXCLUDED.sort_order;

-- Prompt 48: orm-n1-query-fixer
INSERT INTO public.prompts (
  category_id, slug, title, difficulty, tools, prompt_text,
  when_to_use, why_it_works, pro_tips, sort_order, is_active, is_featurable, author_type, author_name
) VALUES (
  'c4444444-4444-4444-4444-444444444444',
  'orm-n1-query-fixer',
  'Prisma/TypeORM',
  'intermediate',
  ARRAY['Claude 3.7 Sonnet','GPT-4o','Cursor']::TEXT[],
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
  'Use when you need staff-level engineering precision, strict architectural invariants, and zero hallucinated code for orm n1 query fixer.',
  'Applies negative constraints and step-by-step cognitive modeling to ensure production-ready output.',
  'Recommended models: Claude 3.7 Sonnet, GPT-4o, or Gemini 2.5 Pro with temperature set to 0.2.',
  48,
  true,
  true,
  'team',
  'Eengineer Staff Lead'
) ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  difficulty = EXCLUDED.difficulty,
  tools = EXCLUDED.tools,
  prompt_text = EXCLUDED.prompt_text,
  when_to_use = EXCLUDED.when_to_use,
  why_it_works = EXCLUDED.why_it_works,
  pro_tips = EXCLUDED.pro_tips,
  sort_order = EXCLUDED.sort_order;

INSERT INTO public.prompt_variables (prompt_id, name, description, is_multiline, sort_order)
SELECT id, 'ORM_CODE', 'Orm code (paste details)', true, 1
FROM public.prompts WHERE slug = 'orm-n1-query-fixer'
ON CONFLICT (prompt_id, name) DO UPDATE SET
  description = EXCLUDED.description,
  is_multiline = EXCLUDED.is_multiline,
  sort_order = EXCLUDED.sort_order;

INSERT INTO public.prompt_variables (prompt_id, name, description, is_multiline, sort_order)
SELECT id, 'SCHEMA_SNIPPET', 'Schema snippet (paste details)', true, 2
FROM public.prompts WHERE slug = 'orm-n1-query-fixer'
ON CONFLICT (prompt_id, name) DO UPDATE SET
  description = EXCLUDED.description,
  is_multiline = EXCLUDED.is_multiline,
  sort_order = EXCLUDED.sort_order;

INSERT INTO public.prompt_variables (prompt_id, name, description, is_multiline, sort_order)
SELECT id, 'ORM_FRAMEWORK', 'Orm framework (paste details)', false, 3
FROM public.prompts WHERE slug = 'orm-n1-query-fixer'
ON CONFLICT (prompt_id, name) DO UPDATE SET
  description = EXCLUDED.description,
  is_multiline = EXCLUDED.is_multiline,
  sort_order = EXCLUDED.sort_order;

-- Prompt 49: bundler-circular-dependency-fixer
INSERT INTO public.prompts (
  category_id, slug, title, difficulty, tools, prompt_text,
  when_to_use, why_it_works, pro_tips, sort_order, is_active, is_featurable, author_type, author_name
) VALUES (
  'c4444444-4444-4444-4444-444444444444',
  'bundler-circular-dependency-fixer',
  'Vite / Webpack',
  'intermediate',
  ARRAY['ChatGPT','Claude','Cursor']::TEXT[],
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
  'Use when you need staff-level engineering precision, strict architectural invariants, and zero hallucinated code for bundler circular dependency fixer.',
  'Applies negative constraints and step-by-step cognitive modeling to ensure production-ready output.',
  'Recommended models: Claude 3.7 Sonnet, GPT-4o, or Gemini 2.5 Pro with temperature set to 0.2.',
  49,
  true,
  true,
  'team',
  'Eengineer Staff Lead'
) ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  difficulty = EXCLUDED.difficulty,
  tools = EXCLUDED.tools,
  prompt_text = EXCLUDED.prompt_text,
  when_to_use = EXCLUDED.when_to_use,
  why_it_works = EXCLUDED.why_it_works,
  pro_tips = EXCLUDED.pro_tips,
  sort_order = EXCLUDED.sort_order;

INSERT INTO public.prompt_variables (prompt_id, name, description, is_multiline, sort_order)
SELECT id, 'BUNDLER_ERROR', 'Bundler error (paste details)', false, 1
FROM public.prompts WHERE slug = 'bundler-circular-dependency-fixer'
ON CONFLICT (prompt_id, name) DO UPDATE SET
  description = EXCLUDED.description,
  is_multiline = EXCLUDED.is_multiline,
  sort_order = EXCLUDED.sort_order;

INSERT INTO public.prompt_variables (prompt_id, name, description, is_multiline, sort_order)
SELECT id, 'CONFIG_AND_IMPORTS', 'Config and imports (paste details)', false, 2
FROM public.prompts WHERE slug = 'bundler-circular-dependency-fixer'
ON CONFLICT (prompt_id, name) DO UPDATE SET
  description = EXCLUDED.description,
  is_multiline = EXCLUDED.is_multiline,
  sort_order = EXCLUDED.sort_order;

INSERT INTO public.prompt_variables (prompt_id, name, description, is_multiline, sort_order)
SELECT id, 'BUNDLER', 'Bundler (paste details)', false, 3
FROM public.prompts WHERE slug = 'bundler-circular-dependency-fixer'
ON CONFLICT (prompt_id, name) DO UPDATE SET
  description = EXCLUDED.description,
  is_multiline = EXCLUDED.is_multiline,
  sort_order = EXCLUDED.sort_order;

-- Prompt 50: jwt-session-auth-debugger
INSERT INTO public.prompts (
  category_id, slug, title, difficulty, tools, prompt_text,
  when_to_use, why_it_works, pro_tips, sort_order, is_active, is_featurable, author_type, author_name
) VALUES (
  'c4444444-4444-4444-4444-444444444444',
  'jwt-session-auth-debugger',
  'JWT / OAuth / Cookie',
  'intermediate',
  ARRAY['Claude 3.7 Sonnet','GPT-4o','Cursor']::TEXT[],
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
  'Use when you need staff-level engineering precision, strict architectural invariants, and zero hallucinated code for jwt session auth debugger.',
  'Applies negative constraints and step-by-step cognitive modeling to ensure production-ready output.',
  'Recommended models: Claude 3.7 Sonnet, GPT-4o, or Gemini 2.5 Pro with temperature set to 0.2.',
  50,
  true,
  true,
  'team',
  'Eengineer Staff Lead'
) ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  difficulty = EXCLUDED.difficulty,
  tools = EXCLUDED.tools,
  prompt_text = EXCLUDED.prompt_text,
  when_to_use = EXCLUDED.when_to_use,
  why_it_works = EXCLUDED.why_it_works,
  pro_tips = EXCLUDED.pro_tips,
  sort_order = EXCLUDED.sort_order;

INSERT INTO public.prompt_variables (prompt_id, name, description, is_multiline, sort_order)
SELECT id, 'AUTH_ERROR', 'Auth error (paste details)', false, 1
FROM public.prompts WHERE slug = 'jwt-session-auth-debugger'
ON CONFLICT (prompt_id, name) DO UPDATE SET
  description = EXCLUDED.description,
  is_multiline = EXCLUDED.is_multiline,
  sort_order = EXCLUDED.sort_order;

INSERT INTO public.prompt_variables (prompt_id, name, description, is_multiline, sort_order)
SELECT id, 'AUTH_CODE', 'Auth code (paste details)', true, 2
FROM public.prompts WHERE slug = 'jwt-session-auth-debugger'
ON CONFLICT (prompt_id, name) DO UPDATE SET
  description = EXCLUDED.description,
  is_multiline = EXCLUDED.is_multiline,
  sort_order = EXCLUDED.sort_order;

INSERT INTO public.prompt_variables (prompt_id, name, description, is_multiline, sort_order)
SELECT id, 'DOMAIN_CONTEXT', 'Domain context (paste details)', false, 3
FROM public.prompts WHERE slug = 'jwt-session-auth-debugger'
ON CONFLICT (prompt_id, name) DO UPDATE SET
  description = EXCLUDED.description,
  is_multiline = EXCLUDED.is_multiline,
  sort_order = EXCLUDED.sort_order;
