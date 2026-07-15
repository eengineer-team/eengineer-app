-- ============================================================================
-- eengineer — schema (block 16, step 2)
-- Derived from docs/AUTHORIZATION.md. RLS is ENABLED on every table here;
-- the policies themselves live in 20260716120200_rls.sql. Draft for review —
-- apply after restoring the (currently paused) Supabase project.
-- ============================================================================

create schema if not exists app;                 -- helper functions (auth.sql)
create extension if not exists pgcrypto;          -- gen_random_uuid()

-- ── Enums ───────────────────────────────────────────────────────────────────
create type app.role as enum ('builder', 'community-lead', 'admin', 'super-admin');
create type app.discipline as enum (
  'Aerospace','Mechanical','Electrical','Software','Civil',
  'Chemical','Biomedical','Materials','Environmental','Other'
);
create type app.connection_status as enum ('requested', 'connected', 'declined');
create type app.vote as enum ('approve', 'disapprove');
create type app.endorse_target as enum ('skill', 'project');
create type app.attachment_kind as enum ('image', 'video', 'link');

-- ── Identity ────────────────────────────────────────────────────────────────
-- profiles is 1:1 with auth.users. role lives in user_roles (separate so only a
-- super-admin can write it — a user must never edit their own role). `verified`
-- is set true only for GitHub/LinkedIn signups; never client-writable.
create table profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  display_name  text not null default '',
  discipline    app.discipline not null default 'Other',
  bio           text not null default '',
  background_id text not null default 'slate',
  avatar_url    text,
  github_url    text,
  linkedin_url  text,
  open_to_work  boolean not null default false,
  interests     text[] not null default '{}',
  online        boolean not null default false,
  oauth_provider text,                             -- 'github' | 'linkedin' | 'google'
  verified      boolean not null default false,    -- true only for github/linkedin
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create table user_roles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role    app.role not null default 'builder'
);

-- ── Profile sub-resources ───────────────────────────────────────────────────
create table skills (
  id          uuid primary key default gen_random_uuid(),
  profile_id  uuid not null references profiles(id) on delete cascade,
  name        text not null,
  proficiency int  not null check (proficiency between 1 and 5)
);
create index on skills(profile_id);

create table experiences (
  id           uuid primary key default gen_random_uuid(),
  profile_id   uuid not null references profiles(id) on delete cascade,
  role         text not null,
  organization text not null default 'Independent',
  duration     text not null default 'Present',
  description  text not null default ''
);
create index on experiences(profile_id);

-- Portfolio items shown on a profile (ProjectEntry). Kept DISTINCT from the
-- Projects-hub `projects` table below — see AUTHORIZATION.md "two project concepts".
create table profile_project_entries (
  id          uuid primary key default gen_random_uuid(),
  profile_id  uuid not null references profiles(id) on delete cascade,
  title       text not null,
  year        int,
  description text not null default '',
  image       text,
  video       text,
  skill_names text[] not null default '{}'
);
create index on profile_project_entries(profile_id);

-- Endorsements: reason is MANDATORY (DB check, not just UI); no self-endorsement.
create table endorsements (
  id          uuid primary key default gen_random_uuid(),
  profile_id  uuid not null references profiles(id) on delete cascade,  -- target
  from_id     uuid not null references profiles(id) on delete cascade,  -- endorser (auth.uid())
  target_type app.endorse_target not null,
  target_name text not null,
  reason      text not null check (char_length(btrim(reason)) > 0),
  created_at  timestamptz not null default now(),
  check (from_id <> profile_id)
);
create index on endorsements(profile_id);

-- ── Projects hub ────────────────────────────────────────────────────────────
create table projects (
  id                 uuid primary key default gen_random_uuid(),
  owner_id           uuid not null references profiles(id) on delete cascade,
  name               text not null default '',
  description        text not null default '',
  cover_url          text,
  thumbnail_url      text,
  open_to_recruitment boolean not null default false,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
create index on projects(owner_id);

create table project_stats (
  id         uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  label      text not null,
  value      text not null default '',
  ordinal    int  not null default 0
);
create index on project_stats(project_id);

create table project_followers (
  project_id  uuid not null references projects(id) on delete cascade,
  follower_id uuid not null references profiles(id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (project_id, follower_id)
);

create table project_feedback (
  id         uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  from_id    uuid not null references profiles(id) on delete cascade,
  text       text not null check (char_length(btrim(text)) > 0),
  created_at timestamptz not null default now()
);
create index on project_feedback(project_id);

-- ── Connections & clubs ─────────────────────────────────────────────────────
-- Canonical ordering (requester/addressee) + unique pair. mutuals are DERIVED,
-- never stored.
create table connections (
  id           uuid primary key default gen_random_uuid(),
  requester_id uuid not null references profiles(id) on delete cascade,
  addressee_id uuid not null references profiles(id) on delete cascade,
  status       app.connection_status not null default 'requested',
  created_at   timestamptz not null default now(),
  check (requester_id <> addressee_id),
  unique (requester_id, addressee_id)
);
create index on connections(addressee_id);

create table club_memberships (
  profile_id uuid not null references profiles(id) on delete cascade,
  discipline app.discipline not null,
  joined_at  timestamptz not null default now(),
  primary key (profile_id, discipline)
);

-- ── Community Q&A ───────────────────────────────────────────────────────────
create table questions (
  id         uuid primary key default gen_random_uuid(),
  discipline app.discipline not null,
  author_id  uuid not null references profiles(id) on delete cascade,
  text       text not null check (char_length(btrim(text)) > 0),
  reported   boolean not null default false,
  created_at timestamptz not null default now()
);
create index on questions(discipline);

-- One vote per user per question; a user can change only their own.
create table question_votes (
  question_id uuid not null references questions(id) on delete cascade,
  user_id     uuid not null references profiles(id) on delete cascade,
  vote        app.vote not null,
  primary key (question_id, user_id)
);

create table question_comments (
  id          uuid primary key default gen_random_uuid(),
  question_id uuid not null references questions(id) on delete cascade,
  author_id   uuid not null references profiles(id) on delete cascade,
  text        text not null check (char_length(btrim(text)) > 0),
  created_at  timestamptz not null default now()
);
create index on question_comments(question_id);

-- ── Reports & blocks (safety; see block 18 for the rest) ────────────────────
create table reports (
  id          uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references profiles(id) on delete cascade,
  target_type text not null check (target_type in ('message','conversation','profile','question','comment')),
  target_id   uuid not null,
  reason      text not null default '',
  created_at  timestamptz not null default now()
);

create table blocks (
  blocker_id uuid not null references profiles(id) on delete cascade,
  blocked_id uuid not null references profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);

-- ── Messaging ───────────────────────────────────────────────────────────────
-- One conversation per unordered pair. participant_a < participant_b enforced
-- so the unique constraint dedupes regardless of who started it.
create table conversations (
  id            uuid primary key default gen_random_uuid(),
  participant_a uuid not null references profiles(id) on delete cascade,
  participant_b uuid not null references profiles(id) on delete cascade,
  created_at    timestamptz not null default now(),
  check (participant_a < participant_b),
  unique (participant_a, participant_b)
);

create table messages (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references conversations(id) on delete cascade,
  sender_id       uuid not null references profiles(id) on delete cascade,
  text            text not null default '',
  attachment_kind app.attachment_kind,
  attachment_url  text,
  attachment_name text,
  created_at      timestamptz not null default now(),
  check (char_length(btrim(text)) > 0 or attachment_url is not null)
);
create index on messages(conversation_id, created_at);

-- ── Events / reference data ─────────────────────────────────────────────────
create table webinars (
  id         uuid primary key default gen_random_uuid(),
  title      text not null,
  speaker    text not null default '',
  discipline app.discipline not null,
  starts_at  timestamptz not null,        -- weekday is DERIVED from this, never stored as text
  tz_label   text not null default 'EST',
  created_at timestamptz not null default now()
);

create table webinar_rsvps (
  webinar_id uuid not null references webinars(id) on delete cascade,
  user_id    uuid not null references profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (webinar_id, user_id)
);

create table competitions (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  location     text not null default '',
  remote       boolean not null default false,
  discipline   text not null default 'All disciplines',
  organizer    text not null default '',
  description  text not null default '',
  requirements text[] not null default '{}',
  deadline     timestamptz not null
);

create table opportunities (
  id           uuid primary key default gen_random_uuid(),
  title        text not null,
  organization text not null default '',
  discipline   app.discipline,
  location     text not null default '',
  remote       boolean not null default false,
  description  text not null default '',
  url          text,
  deadline     timestamptz,
  created_at   timestamptz not null default now()
);

-- ── Enable RLS on EVERYTHING (deny-by-default until policies are added) ──────
alter table profiles                enable row level security;
alter table user_roles              enable row level security;
alter table skills                  enable row level security;
alter table experiences             enable row level security;
alter table profile_project_entries enable row level security;
alter table endorsements            enable row level security;
alter table projects                enable row level security;
alter table project_stats           enable row level security;
alter table project_followers       enable row level security;
alter table project_feedback        enable row level security;
alter table connections             enable row level security;
alter table club_memberships        enable row level security;
alter table questions               enable row level security;
alter table question_votes          enable row level security;
alter table question_comments       enable row level security;
alter table reports                 enable row level security;
alter table blocks                  enable row level security;
alter table conversations           enable row level security;
alter table messages                enable row level security;
alter table webinars                enable row level security;
alter table webinar_rsvps           enable row level security;
alter table competitions            enable row level security;
alter table opportunities           enable row level security;
