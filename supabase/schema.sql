-- Schema do FocoNow para Supabase.
-- Como aplicar: Supabase Dashboard > SQL Editor > cole este arquivo inteiro > Run.
-- Todas as tabelas usam RLS: cada usuário só enxerga e altera as próprias linhas.

create table public.tasks (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title text not null,
  category text not null,
  priority text not null,
  due_date date,
  estimated_pomodoros int not null default 1,
  completed_pomodoros int not null default 0,
  done boolean not null default false,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create table public.sessions (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  task_id bigint references public.tasks (id) on delete set null,
  type text not null,
  duration_minutes int not null,
  started_at timestamptz not null,
  ended_at timestamptz,
  completed boolean not null default false
);

create table public.rewards (
  user_id uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  points int not null default 0,
  streak_days int not null default 0,
  last_active_date text,
  last_water_goal_date text
);

create table public.settings (
  user_id uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  work_start text not null default '09:00',
  work_end text not null default '18:00',
  weight_kg numeric,
  cup_ml int not null default 250
);

create table public.water_entries (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  date_key text not null,
  ml int not null,
  at timestamptz not null default now()
);

create index tasks_user_created_idx on public.tasks (user_id, created_at desc);
create index sessions_user_started_idx on public.sessions (user_id, started_at desc);
create index water_user_date_idx on public.water_entries (user_id, date_key);

alter table public.tasks enable row level security;
alter table public.sessions enable row level security;
alter table public.rewards enable row level security;
alter table public.settings enable row level security;
alter table public.water_entries enable row level security;

create policy "own tasks" on public.tasks
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own sessions" on public.sessions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own rewards" on public.rewards
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own settings" on public.settings
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own water" on public.water_entries
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
