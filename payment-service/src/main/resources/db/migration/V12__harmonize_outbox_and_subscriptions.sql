-- ==============================================================================
-- Migration V12: Harmonize entity fields for Outbox, Subscriptions, and Plans
-- ==============================================================================

-- 1. Subscriptions soft delete and dunning columns
ALTER TABLE subscriptions 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS grace_period_ends_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS next_retry_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS last_retry_at TIMESTAMPTZ;

-- 2. Subscription Plans scheduling and soft delete columns
ALTER TABLE subscription_plans 
ADD COLUMN IF NOT EXISTS available_from TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS available_until TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- 3. Outbox Events published timestamp
ALTER TABLE outbox_events
ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'outbox_events' AND column_name = 'processed_at'
    ) THEN
        UPDATE outbox_events SET published_at = processed_at WHERE published_at IS NULL AND processed_at IS NOT NULL;
    END IF;
END $$;
