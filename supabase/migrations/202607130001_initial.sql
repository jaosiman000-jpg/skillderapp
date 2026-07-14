create extension if not exists pgcrypto;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  locale text not null default 'pt-BR' check (locale in ('pt-BR', 'en')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.skills (
  id uuid primary key default gen_random_uuid(),
  github_full_name text not null unique check (github_full_name ~ '^[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+$'),
  slug text not null unique,
  name text not null,
  owner text not null,
  description_pt text not null,
  description_en text not null,
  repository_url text not null check (repository_url ~ '^https://github.com/'),
  image_url text not null check (image_url ~ '^https://opengraph.githubassets.com/'),
  install_command text not null check (length(install_command) <= 500),
  ecosystems text[] not null default '{}',
  categories text[] not null default '{}',
  license text,
  stars_total integer not null default 0 check (stars_total >= 0),
  stars_24h integer check (stars_24h is null or stars_24h >= 0),
  forks_total integer not null default 0 check (forks_total >= 0),
  repo_updated_at timestamptz not null,
  verified boolean not null default false,
  install_documented boolean not null default false,
  permissions_declared boolean not null default false,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.skill_snapshots (
  skill_id uuid not null references public.skills(id) on delete cascade,
  captured_on date not null,
  stars integer not null check (stars >= 0),
  primary key (skill_id, captured_on)
);

create table public.preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  locale text not null default 'pt-BR' check (locale in ('pt-BR', 'en')),
  min_stars_24h integer not null default 0 check (min_stars_24h between 0 and 1000000),
  include_new_verified boolean not null default true,
  ecosystems text[] not null default '{}',
  categories text[] not null default '{}',
  verified_only boolean not null default true,
  require_license boolean not null default true,
  documented_install_only boolean not null default true,
  max_age_days integer not null default 90 check (max_age_days between 1 and 3650),
  updated_at timestamptz not null default now()
);

create table public.interactions (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  skill_id uuid not null references public.skills(id) on delete cascade,
  decision text not null check (decision in ('like', 'dislike')),
  created_at timestamptz not null default now(),
  unique (user_id, skill_id)
);

create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  skill_id uuid not null references public.skills(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, skill_id)
);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  kind text not null default 'automated' check (kind = 'automated'),
  body jsonb not null check (jsonb_typeof(body) = 'object'),
  created_at timestamptz not null default now(),
  unique (conversation_id, kind)
);

create index skills_feed_idx on public.skills (active, verified, stars_24h desc, repo_updated_at desc);
create index skill_snapshots_captured_idx on public.skill_snapshots (captured_on desc, skill_id);
create index interactions_user_created_idx on public.interactions (user_id, created_at desc);
create index interactions_skill_id_idx on public.interactions (skill_id);
create index conversations_user_created_idx on public.conversations (user_id, created_at desc);
create index conversations_skill_id_idx on public.conversations (skill_id);
create index messages_conversation_created_idx on public.messages (conversation_id, created_at);

alter table public.profiles enable row level security;
alter table public.skills enable row level security;
alter table public.skill_snapshots enable row level security;
alter table public.preferences enable row level security;
alter table public.interactions enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;

create policy skills_public_read on public.skills for select to anon, authenticated using (active);
create policy profiles_own_read on public.profiles for select to authenticated using ((select auth.uid()) = id);
create policy profiles_own_update on public.profiles for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
create policy preferences_own_read on public.preferences for select to authenticated using ((select auth.uid()) = user_id);
create policy preferences_own_insert on public.preferences for insert to authenticated with check ((select auth.uid()) = user_id);
create policy preferences_own_update on public.preferences for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy interactions_own_read on public.interactions for select to authenticated using ((select auth.uid()) = user_id);
create policy interactions_own_insert on public.interactions for insert to authenticated with check ((select auth.uid()) = user_id);
create policy interactions_own_update on public.interactions for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy conversations_own_read on public.conversations for select to authenticated using ((select auth.uid()) = user_id);
create policy messages_own_read on public.messages for select to authenticated using (
  exists (select 1 from public.conversations where conversations.id = messages.conversation_id and conversations.user_id = (select auth.uid()))
);

revoke all on public.skills, public.skill_snapshots from anon, authenticated;
grant select on public.skills to anon, authenticated;
grant select, update on public.profiles to authenticated;
grant select, insert, update on public.preferences to authenticated;
grant select, insert, update on public.interactions to authenticated;
grant select on public.conversations, public.messages to authenticated;
grant usage, select on sequence public.interactions_id_seq to authenticated;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id) values (new.id) on conflict (id) do nothing;
  insert into public.preferences (user_id) values (new.id) on conflict (user_id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.create_match_conversation()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  conversation_id uuid;
begin
  if new.decision <> 'like' then
    return new;
  end if;
  if tg_op = 'UPDATE' and old.decision = 'like' then return new; end if;

  insert into public.conversations (user_id, skill_id)
  values (new.user_id, new.skill_id)
  on conflict (user_id, skill_id) do update set user_id = excluded.user_id
  returning id into conversation_id;

  insert into public.messages (conversation_id, body)
  values (conversation_id, jsonb_build_object('type', 'install', 'skill_id', new.skill_id))
  on conflict (conversation_id, kind) do nothing;
  return new;
end;
$$;

create trigger on_skill_like
after insert or update of decision on public.interactions
for each row execute function public.create_match_conversation();
