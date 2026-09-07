-- V7: Performance Composite, Partial, and GIN Indexes
-- Author: SuviX Platform Team

-- Composite indexes for query acceleration
CREATE INDEX IF NOT EXISTS idx_payment_transactions_user_status ON payment_transactions(user_id, status);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_user_created ON payment_transactions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_status ON subscriptions(user_id, status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_renewal ON subscriptions(status, current_period_end) 
    WHERE status IN ('active', 'past_due');
CREATE INDEX IF NOT EXISTS idx_escrows_status_expires ON escrows(status, expires_at) 
    WHERE status = 'held';
CREATE INDEX IF NOT EXISTS idx_payouts_status_retry ON payouts(status, next_retry_at) 
    WHERE status IN ('pending', 'failed');

-- Partial indexes for active/pending records
CREATE INDEX IF NOT EXISTS idx_active_subscriptions ON subscriptions(user_id) 
    WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_pending_payments ON payment_transactions(idempotency_key) 
    WHERE status = 'pending';

-- GIN indexes for JSONB features & metadata queries
CREATE INDEX IF NOT EXISTS idx_payment_metadata ON payment_transactions USING GIN (metadata);
CREATE INDEX IF NOT EXISTS idx_plan_features ON subscription_plans USING GIN (features);
