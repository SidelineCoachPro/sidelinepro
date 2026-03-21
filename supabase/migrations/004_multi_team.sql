-- Multi-team support: teams table + team_id on all data tables

create table if not exists teams (
  id          uuid primary key default gen_random_uuid(),
  coach_id    uuid not null references auth.users(id) on delete cascade,
  name        text not null,
  emoji       text not null default '🏀',
  color       text not null default '#F7620A',
  age_group   text,
  season_year text,
  team_type   text not null default 'rec',
  created_at  timestamptz not null default now()
);

alter table teams enable row level security;

create policy "coaches manage own teams"
  on teams for all
  using  (auth.uid() = coach_id)
  with check (auth.uid() = coach_id);

-- Add team_id to all data tables (nullable so existing data is unaffected)
alter table players         add column if not exists team_id uuid references teams(id) on delete set null;
alter table practice_plans  add column if not exists team_id uuid references teams(id) on delete set null;
alter table season_plans    add column if not exists team_id uuid references teams(id) on delete set null;
alter table games           add column if not exists team_id uuid references teams(id) on delete set null;
alter table calendar_events add column if not exists team_id uuid references teams(id) on delete set null;
alter table parent_contacts add column if not exists team_id uuid references teams(id) on delete set null;
alter table message_log     add column if not exists team_id uuid references teams(id) on delete set null;
alter table dev_plans       add column if not exists team_id uuid references teams(id) on delete set null;
alter table evaluations     add column if not exists team_id uuid references teams(id) on delete set null;

-- Indexes
create index if not exists idx_teams_coach_id           on teams(coach_id);
create index if not exists idx_players_team_id          on players(team_id);
create index if not exists idx_practice_plans_team_id   on practice_plans(team_id);
create index if not exists idx_season_plans_team_id     on season_plans(team_id);
create index if not exists idx_games_team_id            on games(team_id);
create index if not exists idx_calendar_events_team_id  on calendar_events(team_id);
create index if not exists idx_parent_contacts_team_id  on parent_contacts(team_id);
create index if not exists idx_message_log_team_id      on message_log(team_id);
create index if not exists idx_dev_plans_team_id        on dev_plans(team_id);
create index if not exists idx_evaluations_team_id      on evaluations(team_id);
