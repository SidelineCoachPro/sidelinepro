-- Custom practice games
create table if not exists public.custom_games (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  category text not null default 'competitive',
  duration_mins integer not null default 10,
  players_min integer not null default 4,
  players_max integer not null default 20,
  energy_level text not null default 'High',
  skill_focus text[] not null default '{}',
  description text not null,
  setup text,
  how_to_play text,
  coaching_tips text[] not null default '{}',
  variations text[] not null default '{}',
  created_at timestamptz not null default now()
);

alter table public.custom_games enable row level security;
create policy "coaches manage own games"
  on public.custom_games for all using (coach_id = auth.uid());

-- Custom plays
create table if not exists public.custom_plays (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  category text not null default 'halfcourt',
  difficulty text not null default 'int',
  type text not null default 'Custom',
  description text not null,
  teaching_keys text[] not null default '{}',
  steps text[] not null default '{}',
  suggested_duration_mins integer not null default 12,
  created_at timestamptz not null default now()
);

alter table public.custom_plays enable row level security;
create policy "coaches manage own plays"
  on public.custom_plays for all using (coach_id = auth.uid());
