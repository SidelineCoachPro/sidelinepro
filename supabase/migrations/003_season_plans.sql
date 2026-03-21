-- ============================================================
-- SidelinePro — 003_season_plans.sql
-- ============================================================

-- ── season_plans ──────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.season_plans (
  id                        uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id                  uuid        NOT NULL REFERENCES coaches(id) ON DELETE CASCADE,
  name                      text        NOT NULL,
  season_type               text        NOT NULL CHECK (season_type IN ('rec','aau','school','custom')),
  start_date                date        NOT NULL,
  end_date                  date        NOT NULL,
  practices_per_week        integer     NOT NULL DEFAULT 2,
  practice_duration_mins    integer     NOT NULL DEFAULT 75,
  age_group                 text,
  skill_level               text        NOT NULL DEFAULT 'Intermediate',
  phases                    jsonb       NOT NULL DEFAULT '[]',
  weekly_focus_rotation     jsonb       NOT NULL DEFAULT '[]',
  character_theme_sequence  text[]      NOT NULL DEFAULT '{}',
  use_player_evals          boolean     NOT NULL DEFAULT false,
  team_weaknesses           text[],
  status                    text        NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','active','completed')),
  total_weeks               integer     GENERATED ALWAYS AS (
                              GREATEST(1, CEIL((end_date - start_date)::numeric / 7)::integer)
                            ) STORED,
  created_at                timestamptz NOT NULL DEFAULT now(),
  updated_at                timestamptz NOT NULL DEFAULT now()
);

-- ── Trigger: auto-update updated_at ───────────────────────────

CREATE TRIGGER set_season_plans_updated_at
  BEFORE UPDATE ON public.season_plans
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── RLS ───────────────────────────────────────────────────────

ALTER TABLE public.season_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "season_plans: own rows only" ON public.season_plans
  FOR ALL USING (coach_id = auth.uid()) WITH CHECK (coach_id = auth.uid());

-- ── practice_plans: add scheduling + season link columns ──────

ALTER TABLE public.practice_plans
  ADD COLUMN IF NOT EXISTS scheduled_date  date,
  ADD COLUMN IF NOT EXISTS scheduled_time  time,
  ADD COLUMN IF NOT EXISTS season_plan_id  uuid REFERENCES season_plans(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_practice_plans_scheduled_date
  ON public.practice_plans (coach_id, scheduled_date)
  WHERE scheduled_date IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_practice_plans_season_plan_id
  ON public.practice_plans (season_plan_id)
  WHERE season_plan_id IS NOT NULL;
