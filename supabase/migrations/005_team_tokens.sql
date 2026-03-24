-- Team tokens for parent-facing shareable links
-- Allows coaches to share a link with parents for RSVPs, schedule, and announcements

create table if not exists public.team_tokens (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  coach_id uuid not null references auth.users(id) on delete cascade,
  token text not null default encode(gen_random_bytes(24), 'base64url'),
  is_active boolean not null default true,
  access_count integer not null default 0,
  created_at timestamptz not null default now()
);

-- Index for fast token lookups (parent page hits this on every load)
create index if not exists team_tokens_token_idx on public.team_tokens(token);
create index if not exists team_tokens_team_id_idx on public.team_tokens(team_id);

-- RLS
alter table public.team_tokens enable row level security;

-- Coaches can manage their own tokens
create policy "coaches can manage their tokens"
  on public.team_tokens
  for all
  using (coach_id = auth.uid());
