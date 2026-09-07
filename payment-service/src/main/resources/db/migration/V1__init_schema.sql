-- V1: Initial Payment Schema
-- Author: SuviX Platform Team

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. SUBSCRIPTION PLANS
-- ============================================
CREATE TABLE IF NOT EXISTS subscription_plans (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    tier_level INT NOT NULL DEFAULT 0,
    billing_interval VARCHAR(20) NOT NULL CHECK (billing_interval IN ('month', 'year', 'week')),
    price_monthly NUMERIC(19,4) NOT NULL DEFAULT 0,
    price_annual NUMERIC(19,4) NOT NULL DEFAULT 0,
    features JSONB NOT NULL DEFAULT '{}',
    limits JSONB NOT NULL DEFAULT '{}',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subscription_plans_active ON subscription_plans(is_active);
CREATE INDEX IF NOT EXISTS idx_subscription_plans_tier ON subscription_plans(tier_level);

-- Insert default tiered subscription plans
INSERT INTO subscription_plans (id, name, description, tier_level, billing_interval, price_monthly, price_annual, features, limits) 
VALUES
('plan_free', 'Free Creator', 'Basic features for new creators', 0, 'month', 0, 0,
 '{"uploads": {"max_videos_per_month": 5, "max_video_duration_minutes": 10, "max_video_size_mb": 500}, "ai_features": {"ai_thumbnail_generator": false, "ai_caption_generator": false, "max_ai_requests_per_day": 0}, "monetization": {"can_accept_sponsorships": false, "can_create_paid_content": false, "platform_fee_percent": 20}, "analytics": {"advanced_analytics": false, "audience_insights": false}, "support": {"priority_support": false}}',
 '{"max_storage_gb": 5, "max_team_members": 1}'),

('plan_pro_monthly', 'Pro Creator', 'For growing creators with AI & Monetization', 1, 'month', 49900, 0,
 '{"uploads": {"max_videos_per_month": 100, "max_video_duration_minutes": 60, "max_video_size_mb": 2048}, "ai_features": {"ai_thumbnail_generator": true, "ai_caption_generator": true, "ai_content_analyzer": true, "max_ai_requests_per_day": 500}, "monetization": {"can_accept_sponsorships": true, "can_create_paid_content": true, "platform_fee_percent": 10}, "analytics": {"advanced_analytics": true, "audience_insights": true, "revenue_forecast": false}, "support": {"priority_support": true, "dedicated_account_manager": false}}',
 '{"max_storage_gb": 100, "max_team_members": 5}'),

('plan_pro_annual', 'Pro Creator (Annual)', 'Pro plan billed annually with 2 months free', 1, 'year', 0, 499000,
 '{"uploads": {"max_videos_per_month": 100, "max_video_duration_minutes": 60, "max_video_size_mb": 2048}, "ai_features": {"ai_thumbnail_generator": true, "ai_caption_generator": true, "ai_content_analyzer": true, "max_ai_requests_per_day": 500}, "monetization": {"can_accept_sponsorships": true, "can_create_paid_content": true, "platform_fee_percent": 10}, "analytics": {"advanced_analytics": true, "audience_insights": true, "revenue_forecast": false}, "support": {"priority_support": true, "dedicated_account_manager": false}}',
 '{"max_storage_gb": 100, "max_team_members": 5}'),

('plan_business_monthly', 'Business Enterprise', 'For professional teams & agencies', 2, 'month', 149900, 0,
 '{"uploads": {"max_videos_per_month": 500, "max_video_duration_minutes": 180, "max_video_size_mb": 5120}, "ai_features": {"ai_thumbnail_generator": true, "ai_caption_generator": true, "ai_content_analyzer": true, "max_ai_requests_per_day": 5000}, "monetization": {"can_accept_sponsorships": true, "can_create_paid_content": true, "platform_fee_percent": 5}, "analytics": {"advanced_analytics": true, "audience_insights": true, "revenue_forecast": true}, "support": {"priority_support": true, "dedicated_account_manager": true}}',
 '{"max_storage_gb": 500, "max_team_members": 20}')
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 2. USER WALLETS
-- ============================================
CREATE TABLE IF NOT EXISTS user_wallets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id VARCHAR(50) NOT NULL UNIQUE,
    balance NUMERIC(19,4) NOT NULL DEFAULT 0 CHECK (balance >= 0),
    hold_balance NUMERIC(19,4) NOT NULL DEFAULT 0 CHECK (hold_balance >= 0),
    total_earned NUMERIC(19,4) NOT NULL DEFAULT 0,
    total_withdrawn NUMERIC(19,4) NOT NULL DEFAULT 0,
    currency VARCHAR(3) NOT NULL DEFAULT 'INR',
    kyc_status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (kyc_status IN ('pending', 'submitted', 'verified', 'rejected')),
    kyc_verified_at TIMESTAMP WITH TIME ZONE,
    bank_account_encrypted TEXT,
    upi_id_encrypted TEXT,
    pan_encrypted TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_wallets_user_id ON user_wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_user_wallets_kyc ON user_wallets(kyc_status);

-- ============================================
-- 3. SUBSCRIPTIONS
-- ============================================
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id VARCHAR(50) NOT NULL,
    plan_id VARCHAR(50) NOT NULL REFERENCES subscription_plans(id),
    status VARCHAR(20) NOT NULL DEFAULT 'incomplete' CHECK (status IN ('incomplete', 'active', 'past_due', 'cancelled', 'expired')),
    provider VARCHAR(20) NOT NULL DEFAULT 'razorpay' CHECK (provider IN ('razorpay', 'stripe', 'internal')),
    provider_subscription_id VARCHAR(100),
    provider_customer_id VARCHAR(100),
    current_period_start TIMESTAMP WITH TIME ZONE,
    current_period_end TIMESTAMP WITH TIME ZONE,
    cancel_at_period_end BOOLEAN NOT NULL DEFAULT false,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    ended_at TIMESTAMP WITH TIME ZONE,
    payment_method_id VARCHAR(100),
    trial_start TIMESTAMP WITH TIME ZONE,
    trial_end TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_period_end ON subscriptions(current_period_end);

-- ============================================
-- 4. PAYMENT TRANSACTIONS (NUMERIC 19,4)
-- ============================================
CREATE TABLE IF NOT EXISTS payment_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id VARCHAR(50) NOT NULL,
    amount NUMERIC(19,4) NOT NULL CHECK (amount > 0),
    currency VARCHAR(3) NOT NULL DEFAULT 'INR',
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'refunded', 'disputed')),
    
    provider VARCHAR(20) NOT NULL CHECK (provider IN ('razorpay', 'stripe', 'internal')),
    provider_order_id VARCHAR(100),
    provider_payment_id VARCHAR(100),
    provider_signature VARCHAR(255),
    
    platform_fee NUMERIC(19,4) NOT NULL DEFAULT 0,
    editor_earnings NUMERIC(19,4) NOT NULL DEFAULT 0,
    tax_amount NUMERIC(19,4) NOT NULL DEFAULT 0,
    
    subscription_id UUID REFERENCES subscriptions(id),
    escrow_id UUID,
    payout_id UUID,
    
    idempotency_key VARCHAR(64) NOT NULL UNIQUE,
    correlation_id VARCHAR(64),
    
    description TEXT,
    metadata JSONB DEFAULT '{}',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_payment_transactions_user_id ON payment_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_status ON payment_transactions(status);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_provider ON payment_transactions(provider_order_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_created ON payment_transactions(created_at);

-- ============================================
-- 5. AUDIT LOGS (Immutable)
-- ============================================
CREATE TABLE IF NOT EXISTS audit_logs (
    id BIGSERIAL PRIMARY KEY,
    table_name VARCHAR(50) NOT NULL,
    record_id VARCHAR(100) NOT NULL,
    action VARCHAR(20) NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
    old_values JSONB,
    new_values JSONB,
    changed_by VARCHAR(50) NOT NULL,
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT,
    correlation_id VARCHAR(64)
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_table ON audit_logs(table_name, record_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_changed_at ON audit_logs(changed_at);

-- ============================================
-- 6. IDEMPOTENCY KEYS
-- ============================================
CREATE TABLE IF NOT EXISTS idempotency_keys (
    id VARCHAR(64) PRIMARY KEY,
    status VARCHAR(20) NOT NULL CHECK (status IN ('processing', 'completed', 'failed')),
    request_hash VARCHAR(64) NOT NULL,
    response_body JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_idempotency_expires ON idempotency_keys(expires_at);

-- ============================================
-- 7. FUNCTIONS & TRIGGERS
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_user_wallets_updated_at ON user_wallets;
CREATE TRIGGER update_user_wallets_updated_at BEFORE UPDATE ON user_wallets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON subscriptions;
CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_payment_transactions_updated_at ON payment_transactions;
CREATE TRIGGER update_payment_transactions_updated_at BEFORE UPDATE ON payment_transactions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
