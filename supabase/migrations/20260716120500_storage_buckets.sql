-- ============================================================================
-- eengineer — Storage buckets for avatars and project covers (block 17 support).
-- Public read; a user may write only into a folder named by their auth.uid()
-- (object path convention: "<uid>/<filename>"). Replaces the data-URL/FileReader
-- approach and removes the Unsplash CDN dependency for covers.
-- ============================================================================
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true), ('project-covers', 'project-covers', true)
on conflict (id) do nothing;

create policy "media public read" on storage.objects for select to public
  using (bucket_id in ('avatars', 'project-covers'));

create policy "media owner insert" on storage.objects for insert to authenticated
  with check (
    bucket_id in ('avatars', 'project-covers')
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "media owner update" on storage.objects for update to authenticated
  using (
    bucket_id in ('avatars', 'project-covers')
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "media owner delete" on storage.objects for delete to authenticated
  using (
    bucket_id in ('avatars', 'project-covers')
    and (storage.foldername(name))[1] = auth.uid()::text
  );
