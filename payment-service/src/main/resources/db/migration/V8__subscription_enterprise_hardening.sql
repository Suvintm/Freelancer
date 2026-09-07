-- V8: Enterprise Subscription System Hardening (Million-User Scale)
-- Author: SuviX Platform Team
-- Covers: 10-State Machine, Status History Audit, Double-Entry Ledger, Plan Versioning, Outbox & GST Invoicing

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. SUBSCRIPTION PLANS VERSIONING & EXTENSIONS
-- ============================================
ALTER TABLE subscription_plans 
    ADD COLUMN IF NOT EXISTS version INT NOT NULL DEFAULT 1,
    ADD COLUMN IF NOT EXISTS is_latest_version BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN IF NOT EXISTS replaced_by_id VARCHAR(50),
    ADD COLUMN IF NOT EXISTS trial_days INT NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS quota_reset_period VARCHAR(20) NOT NULL DEFAULT 'billing_cycle',
    ADD COLUMN IF NOT EXISTS display_order INT NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS is_popular BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS badge VARCHAR(50),
    ADD COLUMN IF NOT EXISTS available_from TIMESTAMP WITH TIME ZONE,
    ADD COLUMN IF NOT EXISTS available_until TIMESTAMP WITH TIME ZONE,
    ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;

CREATE INDEX IF NOT EXISTS idx_subscription_plans_version ON subscription_plans(is_latest_version, is_active);

-- ============================================
-- 2. SUBSCRIPTIONS 10-STATE MACHINE & PRORATION
-- ============================================
-- Drop existing status check constraint if present to support 10 states
ALTER TABLE subscriptions DROP CONSTRAINT IF EXISTS subscriptions_status_check;

ALTER TABLE subscriptions
    ADD COLUMN IF NOT EXISTS previous_status VARCHAR(20),
    ADD COLUMN IF NOT EXISTS status_change_reason TEXT,
    ADD COLUMN IF NOT EXISTS status_changed_at TIMESTAMP WITH TIME ZONE,
    ADD COLUMN IF NOT EXISTS status_changed_by VARCHAR(50),
    ADD COLUMN IF NOT EXISTS cancellation_reason VARCHAR(50),
    ADD COLUMN IF NOT EXISTS cancellation_feedback TEXT,
    ADD COLUMN IF NOT EXISTS paused_at TIMESTAMP WITH TIME ZONE,
    ADD COLUMN IF NOT EXISTS pause_resumes_at TIMESTAMP WITH TIME ZONE,
    ADD COLUMN IF NOT EXISTS payment_method_type VARCHAR(20),
    ADD COLUMN IF NOT EXISTS proration_credit NUMERIC(19,4) NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS grace_period_ends_at TIMESTAMP WITH TIME ZONE,
    ADD COLUMN IF NOT EXISTS retry_count INT NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS last_retry_at TIMESTAMP WITH TIME ZONE,
    ADD COLUMN IF NOT EXISTS next_retry_at TIMESTAMP WITH TIME ZONE,
    ADD COLUMN IF NOT EXISTS plan_version_at_creation INT NOT NULL DEFAULT 1,
    ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;

-- Add updated 10-state check constraint
ALTER TABLE subscriptions ADD CONSTRAINT subscriptions_status_check CHECK (
    status IN ('incomplete', 'trialing', 'active', 'past_due', 'unpaid', 'cancelling', 'paused', 'expired', 'disputed', 'cancelled')
);

-- ============================================
-- 3. SUBSCRIPTION STATUS HISTORY (IMMUTABLE AUDIT TRAIL)
-- ============================================
CREATE TABLE IF NOT EXISTS subscription_status_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
    from_status VARCHAR(20) NOT NULL,
    to_status VARCHAR(20) NOT NULL,
    reason TEXT,
    triggered_by VARCHAR(50),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sub_status_hist_sub ON subscription_status_history(subscription_id, created_at DESC);

-- ============================================
-- 4. STATE MACHINE TRANSITION TRIGGER
-- ============================================
CREATE OR REPLACE FUNCTION validate_subscription_transition()
RETURNS TRIGGER AS $$
BEGIN
    -- Only check transitions if status actually changed
    IF OLD.status IS NOT DISTINCT FROM NEW.status THEN
        RETURN NEW;
    END IF;

    -- Define 10-state transition rules
    IF OLD.status = 'incomplete' AND NEW.status NOT IN ('active', 'trialing', 'cancelled', 'expired') THEN
        RAISE EXCEPTION 'Invalid transition from incomplete to %', NEW.status;
    END IF;
    
    IF OLD.status = 'trialing' AND NEW.status NOT IN ('active', 'expired', 'cancelled', 'past_due') THEN
        RAISE EXCEPTION 'Invalid transition from trialing to %', NEW.status;
    END IF;
    
    IF OLD.status = 'active' AND NEW.status NOT IN ('active', 'past_due', 'cancelling', 'paused', 'disputed', 'expired', 'cancelled') THEN
        RAISE EXCEPTION 'Invalid transition from active to %', NEW.status;
    END IF;
    
    IF OLD.status = 'past_due' AND NEW.status NOT IN ('active', 'unpaid', 'cancelled', 'expired') THEN
        RAISE EXCEPTION 'Invalid transition from past_due to %', NEW.status;
    END IF;

    IF OLD.status = 'unpaid' AND NEW.status NOT IN ('active', 'expired', 'cancelled') THEN
        RAISE EXCEPTION 'Invalid transition from unpaid to %', NEW.status;
    END IF;
    
    IF OLD.status = 'cancelling' AND NEW.status NOT IN ('active', 'expired', 'cancelled') THEN
        RAISE EXCEPTION 'Invalid transition from cancelling to %', NEW.status;
    END IF;

    IF OLD.status = 'paused' AND NEW.status NOT IN ('active', 'cancelling', 'expired', 'cancelled') THEN
        RAISE EXCEPTION 'Invalid transition from paused to %', NEW.status;
    END IF;

    IF OLD.status = 'disputed' AND NEW.status NOT IN ('active', 'expired', 'cancelled') THEN
        RAISE EXCEPTION 'Invalid transition from disputed to %', NEW.status;
    END IF;

    -- Track previous status & timestamp
    NEW.previous_status := OLD.status;
    NEW.status_changed_at := NOW();

    -- Automatically log transition to immutable status history table
    INSERT INTO subscription_status_history (
        subscription_id, 
        from_status, 
        to_status, 
        reason,
        triggered_by,
        metadata,
        created_at
    ) VALUES (
        NEW.id,
        OLD.status,
        NEW.status,
        NEW.status_change_reason,
        NEW.status_changed_by,
        COALESCE(NEW.metadata, '{}'::jsonb),
        NOW()
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS subscription_status_transition_trigger ON subscriptions;
CREATE TRIGGER subscription_status_transition_trigger
    BEFORE UPDATE OF status ON subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION validate_subscription_transition();

-- ============================================
-- 5. DOUBLE-ENTRY SUBSCRIPTION LEDGER
-- ============================================
CREATE TABLE IF NOT EXISTS subscription_ledger (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
    entry_type VARCHAR(30) NOT NULL, -- charge, refund, proration_credit, proration_debit, tax
    description VARCHAR(255) NOT NULL,
    debit NUMERIC(19,4) NOT NULL DEFAULT 0,
    credit NUMERIC(19,4) NOT NULL DEFAULT 0,
    currency VARCHAR(3) NOT NULL DEFAULT 'INR',
    balance NUMERIC(19,4) NOT NULL DEFAULT 0,
    invoice_id UUID REFERENCES invoices(id),
    transaction_id UUID REFERENCES payment_transactions(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subscription_ledger_sub ON subscription_ledger(subscription_id, created_at DESC);

-- ============================================
-- 6. INVOICE ENHANCEMENTS (GST + PRORATION)
-- ============================================
ALTER TABLE invoices
    ADD COLUMN IF NOT EXISTS line_items JSONB NOT NULL DEFAULT '[]',
    ADD COLUMN IF NOT EXISTS is_prorated BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS proration_credit NUMERIC(19,4) NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS customer_address JSONB DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS voided_at TIMESTAMP WITH TIME ZONE,
    ADD COLUMN IF NOT EXISTS pdf_generated_at TIMESTAMP WITH TIME ZONE;

-- ============================================
-- 7. TRANSACTIONAL OUTBOX EVENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS outbox_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    aggregate_type VARCHAR(50) NOT NULL,
    aggregate_id VARCHAR(100) NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    topic VARCHAR(100) NOT NULL,
    payload JSONB NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    retry_count INT NOT NULL DEFAULT 0,
    error_message TEXT,
    published_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_outbox_pending ON outbox_events(status, created_at) WHERE status = 'PENDING';

-- ============================================
-- 8. COMPOSITE PARTIAL INDEXES FOR SCALE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_subscriptions_grace ON subscriptions(status, grace_period_ends_at) 
WHERE status = 'past_due';

CREATE INDEX IF NOT EXISTS idx_subscriptions_renewal_due ON subscriptions(status, current_period_end) 
WHERE status IN ('active', 'past_due', 'trialing');

CREATE INDEX IF NOT EXISTS idx_subscriptions_retry ON subscriptions(next_retry_at, status) 
WHERE status = 'past_due';

CREATE INDEX IF NOT EXISTS idx_subscriptions_cancel_check ON subscriptions(cancel_at_period_end, current_period_end) 
WHERE cancel_at_period_end = true;