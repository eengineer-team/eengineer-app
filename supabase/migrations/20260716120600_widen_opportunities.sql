-- ============================================================================
-- eengineer — widen `opportunities` to match the frontend Opportunity model
-- (block 19, domain 5 backend). Applied live to bgdlpdokubhutwicsfyp; rows
-- seeded in supabase/seed.sql. image_url left null (stock photos dropped per the
-- UX audit — the frontend renders a brand fallback).
-- ============================================================================
alter table opportunities
  add column requirements    text[] not null default '{}',
  add column responsibilities text[] not null default '{}',
  add column image_url       text,
  add column apply_url       text,
  add column source          text not null default 'edugrants',
  add column deadline_label  text;
