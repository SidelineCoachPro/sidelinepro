-- ============================================================
-- SidelinePro — 001_initial_schema.sql
-- ============================================================

-- ============================================================
-- TABLES
-- ============================================================

-- 1. coaches
CREATE TABLE IF NOT EXISTS public.coaches (
  id                    uuid        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email                 text        NOT NULL,
  full_name             text,
  plan                  text        NOT NULL DEFAULT 'free' CHECK (plan IN ('free','pro','elite')),
  stripe_customer_id    text,
  stripe_subscription_id text,
  plan_expires_at       timestamptz,
  created_at            timestamptz NOT NULL DEFAULT now()
);

-- 2. players
CREATE TABLE IF NOT EXISTS public.players (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id       uuid        NOT NULL REFERENCES coaches(id) ON DELETE CASCADE,
  first_name     text        NOT NULL,
  last_name      text,
  jersey_number  text,
  position       text        CHECK (position IN ('PG','SG','SF','PF','C','G','F')),
  age            integer,
  is_active      boolean     NOT NULL DEFAULT true,
  created_at     timestamptz NOT NULL DEFAULT now()
);

-- 3. evaluations
CREATE TABLE IF NOT EXISTS public.evaluations (
  id             uuid           PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id      uuid           NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  coach_id       uuid           NOT NULL REFERENCES coaches(id) ON DELETE CASCADE,
  ball_handling  numeric(3,1),
  shooting       numeric(3,1),
  passing        numeric(3,1),
  defense        numeric(3,1),
  athleticism    numeric(3,1),
  coachability   numeric(3,1),
  overall_avg    numeric(3,1),
  grade          text,
  notes          text,
  evaluated_at   timestamptz    NOT NULL DEFAULT now()
);

-- 4. practice_plans
CREATE TABLE IF NOT EXISTS public.practice_plans (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id         uuid        NOT NULL REFERENCES coaches(id) ON DELETE CASCADE,
  name             text        NOT NULL,
  age_group        text,
  duration_mins    integer     NOT NULL DEFAULT 75,
  focus_areas      text[],
  character_theme  text,
  drills           jsonb       NOT NULL DEFAULT '[]',
  is_template      boolean     NOT NULL DEFAULT false,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

-- 5. custom_drills
CREATE TABLE IF NOT EXISTS public.custom_drills (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id        uuid        NOT NULL REFERENCES coaches(id) ON DELETE CASCADE,
  name            text        NOT NULL,
  category        text        NOT NULL,
  duration_mins   integer     NOT NULL DEFAULT 10,
  players_needed  text        DEFAULT 'Full team',
  level           text        DEFAULT 'Intermediate',
  description     text        NOT NULL,
  setup           text,
  instructions    text,
  cues            text[],
  progression     text,
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- 6. games
CREATE TABLE IF NOT EXISTS public.games (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id        uuid        NOT NULL REFERENCES coaches(id) ON DELETE CASCADE,
  opponent        text        NOT NULL,
  location        text,
  scheduled_at    timestamptz NOT NULL,
  our_score       integer,
  opponent_score  integer,
  lineup_q1       jsonb       DEFAULT '[]',
  lineup_q2       jsonb       DEFAULT '[]',
  lineup_q3       jsonb       DEFAULT '[]',
  lineup_q4       jsonb       DEFAULT '[]',
  game_log        jsonb       DEFAULT '[]',
  notes           text,
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- 7. dev_plans
CREATE TABLE IF NOT EXISTS public.dev_plans (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id        uuid        NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  coach_id         uuid        NOT NULL REFERENCES coaches(id) ON DELETE CASCADE,
  evaluation_id    uuid        REFERENCES evaluations(id),
  focus_skill      text        NOT NULL,
  drills           jsonb       NOT NULL DEFAULT '[]',
  duration_mins    integer     NOT NULL DEFAULT 20,
  message_text     text,
  created_at       timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- TRIGGER: auto-update updated_at on practice_plans
-- ============================================================

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_practice_plans_updated_at
  BEFORE UPDATE ON public.practice_plans
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- TRIGGER: auto-create coach profile on auth signup
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.coaches (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

-- coaches: can only access their own row (id = auth.uid())
ALTER TABLE public.coaches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "coaches: own row only" ON public.coaches
  FOR ALL USING (id = auth.uid()) WITH CHECK (id = auth.uid());

-- players
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;
CREATE POLICY "players: own rows only" ON public.players
  FOR ALL USING (coach_id = auth.uid()) WITH CHECK (coach_id = auth.uid());

-- evaluations
ALTER TABLE public.evaluations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "evaluations: own rows only" ON public.evaluations
  FOR ALL USING (coach_id = auth.uid()) WITH CHECK (coach_id = auth.uid());

-- practice_plans
ALTER TABLE public.practice_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "practice_plans: own rows only" ON public.practice_plans
  FOR ALL USING (coach_id = auth.uid()) WITH CHECK (coach_id = auth.uid());

-- custom_drills
ALTER TABLE public.custom_drills ENABLE ROW LEVEL SECURITY;
CREATE POLICY "custom_drills: own rows only" ON public.custom_drills
  FOR ALL USING (coach_id = auth.uid()) WITH CHECK (coach_id = auth.uid());

-- games
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;
CREATE POLICY "games: own rows only" ON public.games
  FOR ALL USING (coach_id = auth.uid()) WITH CHECK (coach_id = auth.uid());

-- dev_plans
ALTER TABLE public.dev_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "dev_plans: own rows only" ON public.dev_plans
  FOR ALL USING (coach_id = auth.uid()) WITH CHECK (coach_id = auth.uid());
