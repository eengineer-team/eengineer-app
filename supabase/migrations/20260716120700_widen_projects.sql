-- ============================================================================
-- eengineer — widen `projects` to full parity with the frontend Project type
-- (block 19, domain 2). Applied live to bgdlpdokubhutwicsfyp.
-- Adds kind/link/socials columns + project_team_members, project_join_requests,
-- project_materials (supportingMaterials). All owner-gated via RLS.
-- ============================================================================
alter table projects
  add column kind          text,
  add column link          text,
  add column telegram_url  text,
  add column instagram_url text;

create table project_team_members (
  id         uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  profile_id uuid references profiles(id) on delete set null,
  name       text not null default '',
  role       text not null default '',
  ordinal    int  not null default 0
);
create index on project_team_members(project_id);
alter table project_team_members enable row level security;
create policy ptm_select on project_team_members for select to authenticated using (app.is_builder());
create policy ptm_write on project_team_members for all to authenticated
  using      (exists (select 1 from projects p where p.id = project_id and p.owner_id = auth.uid()))
  with check (exists (select 1 from projects p where p.id = project_id and p.owner_id = auth.uid()));

create table project_join_requests (
  id           uuid primary key default gen_random_uuid(),
  project_id   uuid not null references projects(id) on delete cascade,
  requester_id uuid not null references profiles(id) on delete cascade,
  message      text not null default '',
  status       text not null default 'pending' check (status in ('pending','accepted','declined')),
  created_at   timestamptz not null default now(),
  unique (project_id, requester_id)
);
create index on project_join_requests(project_id);
alter table project_join_requests enable row level security;
create policy pjr_select on project_join_requests for select to authenticated
  using (requester_id = auth.uid()
         or exists (select 1 from projects p where p.id = project_id and p.owner_id = auth.uid()));
create policy pjr_insert on project_join_requests for insert to authenticated
  with check (app.is_verified() and requester_id = auth.uid()
              and not exists (select 1 from projects p where p.id = project_id and p.owner_id = auth.uid()));
create policy pjr_update on project_join_requests for update to authenticated
  using      (exists (select 1 from projects p where p.id = project_id and p.owner_id = auth.uid()))
  with check (exists (select 1 from projects p where p.id = project_id and p.owner_id = auth.uid()));
create policy pjr_delete on project_join_requests for delete to authenticated
  using (requester_id = auth.uid()
         or exists (select 1 from projects p where p.id = project_id and p.owner_id = auth.uid()));

create table project_materials (
  id         uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  kind       app.attachment_kind not null,
  url        text not null,
  name       text,
  ordinal    int  not null default 0
);
create index on project_materials(project_id);
alter table project_materials enable row level security;
create policy pmat_select on project_materials for select to authenticated using (app.is_builder());
create policy pmat_write on project_materials for all to authenticated
  using      (exists (select 1 from projects p where p.id = project_id and p.owner_id = auth.uid()))
  with check (exists (select 1 from projects p where p.id = project_id and p.owner_id = auth.uid()));
