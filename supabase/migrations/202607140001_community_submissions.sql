alter table public.skills
  add column if not exists cover_image_url text,
  add column if not exists is_community boolean not null default false,
  add column if not exists submitted_by uuid references auth.users(id) on delete set null,
  add column if not exists submitted_by_name text,
  add column if not exists match_message text;

alter table public.skills
  add constraint skills_community_author_check check (
    not is_community or (
      submitted_by is not null and
      submitted_by_name is not null and
      char_length(submitted_by_name) between 2 and 40
    )
  ),
  add constraint skills_match_message_check check (
    not is_community or char_length(match_message) between 20 and 500
  ),
  add constraint skills_cover_image_url_check check (
    cover_image_url is null or cover_image_url ~ '^https://[a-z0-9-]+\.supabase\.co/storage/v1/object/public/skill-covers/'
  );

create index if not exists skills_community_created_idx on public.skills (is_community, created_at desc);
create index if not exists skills_submitted_by_created_idx on public.skills (submitted_by, created_at desc) where submitted_by is not null;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('skill-covers', 'skill-covers', true, 3145728, array['image/png', 'image/jpeg', 'image/webp'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;
