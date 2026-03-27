-- Add Stripe billing fields to coaches table
ALTER TABLE coaches
  ADD COLUMN IF NOT EXISTS stripe_customer_id   TEXT,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
  ADD COLUMN IF NOT EXISTS subscription_tier     TEXT NOT NULL DEFAULT 'free'
                             CHECK (subscription_tier IN ('free','pro','elite')),
  ADD COLUMN IF NOT EXISTS subscription_status   TEXT NOT NULL DEFAULT 'inactive'
                             CHECK (subscription_status IN ('trialing','active','past_due','canceled','inactive')),
  ADD COLUMN IF NOT EXISTS subscription_period   TEXT CHECK (subscription_period IN ('monthly','annual')),
  ADD COLUMN IF NOT EXISTS trial_ends_at         TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS subscription_ends_at  TIMESTAMPTZ;

-- Index for webhook lookups
CREATE UNIQUE INDEX IF NOT EXISTS coaches_stripe_customer_id_idx
  ON coaches (stripe_customer_id)
  WHERE stripe_customer_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS coaches_stripe_subscription_id_idx
  ON coaches (stripe_subscription_id)
  WHERE stripe_subscription_id IS NOT NULL;
