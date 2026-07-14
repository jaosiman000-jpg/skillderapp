alter table public.skills
  add column if not exists likes_count integer not null default 0 check (likes_count >= 0);

update public.skills as skill
set likes_count = (
  select count(*)::integer
  from public.interactions
  where interactions.skill_id = skill.id and interactions.decision = 'like'
);

create or replace function public.refresh_skill_likes_count()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    if new.decision = 'like' then
      update public.skills set likes_count = likes_count + 1 where id = new.skill_id;
    end if;
    return new;
  end if;

  if tg_op = 'DELETE' then
    if old.decision = 'like' then
      update public.skills set likes_count = greatest(0, likes_count - 1) where id = old.skill_id;
    end if;
    return old;
  end if;

  if old.skill_id <> new.skill_id then
    if old.decision = 'like' then
      update public.skills set likes_count = greatest(0, likes_count - 1) where id = old.skill_id;
    end if;
    if new.decision = 'like' then
      update public.skills set likes_count = likes_count + 1 where id = new.skill_id;
    end if;
  elsif old.decision <> new.decision then
    update public.skills
    set likes_count = greatest(0, likes_count + case when new.decision = 'like' then 1 else -1 end)
    where id = new.skill_id;
  end if;

  return new;
end;
$$;

drop trigger if exists on_interaction_refresh_skill_likes on public.interactions;
create trigger on_interaction_refresh_skill_likes
after insert or update or delete on public.interactions
for each row execute function public.refresh_skill_likes_count();

create index if not exists skills_likes_count_idx on public.skills (active, likes_count desc);
