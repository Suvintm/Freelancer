-- ==============================================================================
-- Migration V15: Harmonize all subscription columns and add payment_pending status
-- ==============================================================================

ALTER TABLE subscriptions 
    ADD COLUMN IF NOT EXISTS previous_status VARCHAR(20),
    ADD COLUMN IF NOT EXISTS status_change_reason TEXT,
    ADD COLUMN IF NOT EXISTS status_changed_at TIMESTAMP WITH TIME ZONE,
    ADD COLUMN IF NOT EXISTS status_changed_by VARCHAR(50),
    ADD COLUMN IF NOT EXISTS base_amount NUMERIC(19,4) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS tax_amount NUMERIC(19,4) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS total_amount NUMERIC(19,4) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS plan_snapshot JSONB,
    ADD COLUMN IF NOT EXISTS metadata JSONB,
    ADD COLUMN IF NOT EXISTS plan_version_id VARCHAR(50),
    ADD COLUMN IF NOT EXISTS enterprise_plan_id VARCHAR(50),
    ADD COLUMN IF NOT EXISTS cancellation_reason VARCHAR(50),
    ADD COLUMN IF NOT EXISTS cancellation_feedback TEXT,
    ADD COLUMN IF NOT EXISTS paused_at TIMESTAMP WITH TIME ZONE,
    ADD COLUMN IF NOT EXISTS pause_resumes_at TIMESTAMP WITH TIME ZONE,
    ADD COLUMN IF NOT EXISTS ended_at TIMESTAMP WITH TIME ZONE,
    ADD COLUMN IF NOT EXISTS payment_method_id VARCHAR(100),
    ADD COLUMN IF NOT EXISTS payment_method_type VARCHAR(20),
    ADD COLUMN IF NOT EXISTS proration_credit NUMERIC(19,4) NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS grace_period_ends_at TIMESTAMP WITH TIME ZONE,
    ADD COLUMN IF NOT EXISTS retry_count INT NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS last_retry_at TIMESTAMP WITH TIME ZONE,
    ADD COLUMN IF NOT EXISTS next_retry_at TIMESTAMP WITH TIME ZONE,
    ADD COLUMN IF NOT EXISTS plan_version_at_creation INT NOT NULL DEFAULT 1,
    ADD COLUMN IF NOT EXISTS trial_start TIMESTAMP WITH TIME ZONE,
    ADD COLUMN IF NOT EXISTS trial_end TIMESTAMP WITH TIME ZONE,
    ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;

-- Relax / update constraint if it exists to allow payment_pending
ALTER TABLE subscriptions DROP CONSTRAINT IF EXISTS subscriptions_status_check;
ALTER TABLE subscriptions ADD CONSTRAINT subscriptions_status_check CHECK (
    status IN ('incomplete', 'trialing', 'active', 'past_due', 'unpaid', 'cancelling', 'paused', 'expired', 'disputed', 'cancelled', 'payment_pending')
);
