-- V21: Enterprise Subscription Transitions, Credit Rollover Balance, Webhook Deduplication & High-Performance Indices
-- Author: SuviX Platform Architecture Team

-- 1. APPEND-ONLY SUBSCRIPTION TRANSITION AUDIT TRAIL
CREATE TABLE IF NOT EXISTS subscription_transitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
    user_id VARCHAR(64) NOT NULL,
    transition_type VARCHAR(40) NOT NULL, -- UPGRADE_COTERM | UPGRADE_INTERVAL_RESET | DOWNGRADE_SCHEDULED | DOWNGRADE_EXECUTED | CANCEL | PAUSE | RESUME | RENEWAL
    from_plan_id VARCHAR(64),
    to_plan_id VARCHAR(64) NOT NULL,
    proration_credit_calculated NUMERIC(19, 4) DEFAULT 0.0000,
    proration_credit_applied NUMERIC(19, 4) DEFAULT 0.0000,
    leftover_credit_generated NUMERIC(19, 4) DEFAULT 0.0000,
    gross_target_price NUMERIC(19, 4) NOT NULL,
    coupon_discount_applied NUMERIC(19, 4) DEFAULT 0.0000,
    coupon_code VARCHAR(50),
    net_amount_charged NUMERIC(19, 4) NOT NULL,
    amount_in_paise BIGINT NOT NULL,
    currency VARCHAR(10) DEFAULT 'INR' NOT NULL,
    invoice_id UUID,
    previous_period_end TIMESTAMPTZ,
    new_period_end TIMESTAMPTZ NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sub_transitions_user ON subscription_transitions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sub_transitions_sub ON subscription_transitions(subscription_id);

-- 2. CUSTOMER LEFTOVER CREDIT BALANCE (ROLLOVER WALLET)
CREATE TABLE IF NOT EXISTS customer_credit_balances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(64) UNIQUE NOT NULL,
    balance_amount NUMERIC(19, 4) DEFAULT 0.0000 NOT NULL,
    currency VARCHAR(10) DEFAULT 'INR' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_credit_balances_user ON customer_credit_balances(user_id);

-- 3. IDEMPOTENT WEBHOOK PROCESSED EVENTS
CREATE TABLE IF NOT EXISTS processed_webhook_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider VARCHAR(30) NOT NULL,
    event_id VARCHAR(120) NOT NULL,
    event_type VARCHAR(80),
    payload JSONB DEFAULT '{}'::jsonb,
    processed_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT uq_processed_provider_event UNIQUE (provider, event_id)
);

CREATE INDEX IF NOT EXISTS idx_processed_webhooks ON processed_webhook_events(provider, event_id);

-- 4. CRITICAL HIGH-TRAFFIC SUBSCRIPTION INDICES
CREATE INDEX IF NOT EXISTS idx_subscriptions_status_period_end 
ON subscriptions(status, current_period_end);

CREATE INDEX IF NOT EXISTS idx_subscriptions_downgrade_sweep 
ON subscriptions(current_period_end) 
WHERE cancel_at_period_end = true;

CREATE INDEX IF NOT EXISTS idx_subscriptions_provider_sub_id 
ON subscriptions(provider, provider_subscription_id);

-- 5. LEGAL GAP-FREE INVOICE SEQUENCE FOR FINANCIAL YEAR 2026-27
CREATE SEQUENCE IF NOT EXISTS invoice_number_seq_fy26_27 START 1;
