-- Migration V10: Subscription Reconciliation Audit Schema

CREATE TABLE IF NOT EXISTS subscription_reconciliation_audit (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subscription_id VARCHAR(50) NOT NULL,
    user_id VARCHAR(50) NOT NULL,
    provider VARCHAR(20) NOT NULL,
    provider_subscription_id VARCHAR(100),
    db_status VARCHAR(30) NOT NULL,
    gateway_status VARCHAR(30) NOT NULL,
    discrepancy_type VARCHAR(50) NOT NULL,
    action_taken VARCHAR(50) NOT NULL,
    reconciled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    details JSONB DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_reconciliation_audit_sub ON subscription_reconciliation_audit(subscription_id);
CREATE INDEX IF NOT EXISTS idx_reconciliation_audit_user ON subscription_reconciliation_audit(user_id);
CREATE INDEX IF NOT EXISTS idx_reconciliation_audit_date ON subscription_reconciliation_audit(reconciled_at);
