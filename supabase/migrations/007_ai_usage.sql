-- AI usage tracking table
create table if not exists ai_usage (
  id          uuid primary key default gen_random_uuid(),
  coach_id    uuid not null references coaches(id) on delete cascade,
  feature     text not null,
  month       text not null,  -- "YYYY-MM"
  count       integer not null default 0,
  updated_at  timestamptz not null default now(),
  unique(coach_id, feature, month)
);

-- RLS
alter table ai_usage enable row level security;

create policy "Coaches read own usage"
  on ai_usage for select
  using (auth.uid() = coach_id);

create policy "Coaches upsert own usage"
  on ai_usage for insert
  with check (auth.uid() = coach_id);

create policy "Coaches update own usage"
  on ai_usage for update
  using (auth.uid() = coach_id);

-- RPC to increment usage atomically
create or replace function increment_ai_usage(
  p_coach_id uuid,
  p_feature  text,
  p_month    text
) returns void
language plpgsql security definer as $$
begin
  insert into ai_usage (coach_id, feature, month, count, updated_at)
  values (p_coach_id, p_feature, p_month, 1, now())
  on conflict (coach_id, feature, month)
  do update set
    count = ai_usage.count + 1,
    updated_at = now();
end;
$$;
