-- Deadline Sense schema. Run this in the Supabase SQL editor.
-- Designed for the free tier with row-level security tied to auth.uid().

create extension if not exists "pgcrypto";

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  course text,
  notes text,
  deadline timestamptz not null,
  effort_minutes int not null check (effort_minutes >= 0),
  difficulty int not null check (difficulty between 1 and 5),
  status text not null default 'todo' check (status in ('todo', 'in_progress', 'done')),
  progress_minutes int not null default 0 check (progress_minutes >= 0),
  emoji text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists tasks_user_deadline_idx on public.tasks (user_id, deadline);
create index if not exists tasks_user_status_idx on public.tasks (user_id, status);

create table if not exists public.class_blocks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  weekday smallint not null check (weekday between 0 and 6),
  start_minutes int not null check (start_minutes between 0 and 1439),
  end_minutes int not null check (end_minutes between 0 and 1440),
  created_at timestamptz not null default now()
);

create index if not exists class_blocks_user_idx on public.class_blocks (user_id, weekday);

-- Group projects: a task can belong to a group, and group members share visibility.
create table if not exists public.task_groups (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.task_group_members (
  group_id uuid not null references public.task_groups(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'member')),
  primary key (group_id, user_id)
);

alter table public.tasks add column if not exists group_id uuid references public.task_groups(id) on delete set null;
alter table public.tasks add column if not exists assigned_to uuid references auth.users(id) on delete set null;

-- Auto-update updated_at on row changes.
create or replace function public.tg_set_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists tasks_set_updated_at on public.tasks;
create trigger tasks_set_updated_at
before update on public.tasks
for each row execute function public.tg_set_updated_at();

-- Row-level security.
alter table public.tasks enable row level security;
alter table public.class_blocks enable row level security;
alter table public.task_groups enable row level security;
alter table public.task_group_members enable row level security;

drop policy if exists "tasks_owner_or_group" on public.tasks;
create policy "tasks_owner_or_group" on public.tasks
  for all
  using (
    user_id = auth.uid()
    or assigned_to = auth.uid()
    or group_id in (select group_id from public.task_group_members where user_id = auth.uid())
  )
  with check (
    user_id = auth.uid()
    or group_id in (select group_id from public.task_group_members where user_id = auth.uid())
  );

drop policy if exists "class_blocks_owner" on public.class_blocks;
create policy "class_blocks_owner" on public.class_blocks
  for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "task_groups_member" on public.task_groups;
create policy "task_groups_member" on public.task_groups
  for select
  using (
    owner_id = auth.uid()
    or id in (select group_id from public.task_group_members where user_id = auth.uid())
  );

drop policy if exists "task_groups_owner_write" on public.task_groups;
create policy "task_groups_owner_write" on public.task_groups
  for all
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

drop policy if exists "task_group_members_self" on public.task_group_members;
create policy "task_group_members_self" on public.task_group_members
  for select
  using (
    user_id = auth.uid()
    or group_id in (select id from public.task_groups where owner_id = auth.uid())
  );
