-- ==============================================================================
-- Migration V13: Harmonize all entity columns for full enterprise schema parity
-- ==============================================================================

-- 1. Subscriptions table
ALTER TABLE subscriptions 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS grace_period_ends_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS next_retry_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS last_retry_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS payment_method_type VARCHAR(20);

-- 2. Subscription Plans table
ALTER TABLE subscription_plans 
ADD COLUMN IF NOT EXISTS available_from TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS available_until TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS replaced_by_id VARCHAR(50);

-- 3. Outbox Events table
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
