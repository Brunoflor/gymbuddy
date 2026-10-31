-- Private bucket for progress photos. Paths are {athlete_id}/{filename}.
-- Coaches manage files for their athletes. Approved athletes can read their own.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'athlete-files',
  'athlete-files',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy athlete_files_select on storage.objects
  for select to authenticated
  using (
    bucket_id = 'athlete-files'
    and (
      public.manages_athlete(public.safe_uuid((storage.foldername(name))[1]))
      or (
        public.safe_uuid((storage.foldername(name))[1]) = auth.uid()
        and public.is_approved_self()
      )
    )
  );

create policy athlete_files_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'athlete-files'
    and public.manages_athlete(public.safe_uuid((storage.foldername(name))[1]))
  );

create policy athlete_files_update on storage.objects
  for update to authenticated
  using (
    bucket_id = 'athlete-files'
    and public.manages_athlete(public.safe_uuid((storage.foldername(name))[1]))
  )
  with check (
    bucket_id = 'athlete-files'
    and public.manages_athlete(public.safe_uuid((storage.foldername(name))[1]))
  );

create policy athlete_files_delete on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'athlete-files'
    and public.manages_athlete(public.safe_uuid((storage.foldername(name))[1]))
  );
