-- ensureMyProject() in api/projects.ts does a select-then-insert to lazily
-- give every Builder exactly one project row on first read. With no unique
-- constraint on owner_id, that check-then-insert is racy: concurrent calls
-- (multiple mounts/tabs/StrictMode double-invoke all firing the same
-- "does a row exist?" query before either insert lands) can each see "no
-- row" and each insert one. In practice this produced dozens of duplicate
-- empty project rows per Builder on the accounts used for manual testing,
-- and worse: fetchProjects()'s .maybeSingle() throws once more than one row
-- matches, so the entire Projects Hub silently failed to load for those
-- accounts (reported as "the Create your project / Get started buttons
-- don't work" — they don't, but the deeper failure is upstream of the
-- button).
--
-- All duplicate rows found were empty (no name/description) and had zero
-- attached stats/materials/team/feedback/followers/join-requests, so keeping
-- the earliest row per owner and dropping the rest loses nothing. Child
-- tables are ON DELETE CASCADE, so this needs no extra cleanup.
delete from projects p
where exists (
  select 1 from projects p2
  where p2.owner_id = p.owner_id
    and (p2.created_at < p.created_at or (p2.created_at = p.created_at and p2.id < p.id))
);

alter table projects add constraint projects_owner_id_key unique (owner_id);
