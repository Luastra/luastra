-- Private user-owned raster uploads for Luastra's provider-neutral content
-- boundary. The runtime creates object names as:
--   <declared-purpose>/<authenticated-user-id>/<opaque-object-id>.(png|jpg)
-- It never uses the client filename and never requests upsert.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'luastra-user-images',
  'luastra-user-images',
  false,
  26214400,
  array['image/png', 'image/jpeg']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy luastra_user_images_insert_own on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'luastra-user-images'
    and split_part(name, '/', 1) ~ '^[a-z][a-z0-9_-]{0,63}$'
    and split_part(name, '/', 2) = (select auth.uid())::text
    and name ~ '^[a-z][a-z0-9_-]{0,63}/[0-9a-f-]{36}/[A-Za-z0-9_-]{32,256}\.(png|jpg)$'
  );

create policy luastra_user_images_select_own on storage.objects
  for select to authenticated
  using (
    bucket_id = 'luastra-user-images'
    and split_part(name, '/', 2) = (select auth.uid())::text
    and owner_id = (select auth.uid()::text)
  );

create policy luastra_user_images_delete_own on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'luastra-user-images'
    and split_part(name, '/', 2) = (select auth.uid())::text
    and owner_id = (select auth.uid()::text)
  );

-- Deliberately no UPDATE policy: upload intents are create-once and cannot
-- overwrite an existing object. Reads and deletes remain owner-scoped.
