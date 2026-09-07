-- V2: Add Escrow and Refund Tables
-- Author: SuviX Platform Team

-- ============================================
-- 1. ESCROW
-- ============================================
CREATE TABLE IF NOT EXISTS escrows (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_id UUID NOT NULL REFERENCES payment_transactions(id),
    
    payer_user_id VARCHAR(50) NOT NULL,
    payee_user_id VARCHAR(50) NOT NULL,
    
    amount NUMERIC(19,4) NOT NULL CHECK (amount > 0),
    currency VARCHAR(3) NOT NULL DEFAULT 'INR',
    platform_fee NUMERIC(19,4) NOT NULL DEFAULT 0,
    
    status VARCHAR(20) NOT NULL DEFAULT 'held' CHECK (status IN ('held', 'released', 'disputed', 'refunded', 'expired')),
    
    release_condition VARCHAR(50) NOT NULL DEFAULT 'manual_approval',
    release_metadata JSONB DEFAULT '{}',
    
    held_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    released_at TIMESTAMP WITH TIME ZONE,
    disputed_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    
    dispute_reason TEXT,
    resolved_by VARCHAR(50),
    resolution_notes TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_escrows_payer ON escrows(payer_user_id);
CREATE INDEX IF NOT EXISTS idx_escrows_payee ON escrows(payee_user_id);
CREATE INDEX IF NOT EXISTS idx_escrows_status ON escrows(status);
CREATE INDEX IF NOT EXISTS idx_escrows_expires ON escrows(expires_at);
CREATE INDEX IF NOT EXISTS idx_escrows_transaction ON escrows(transaction_id);

DROP TRIGGER IF EXISTS update_escrows_updated_at ON escrows;
CREATE TRIGGER update_escrows_updated_at BEFORE UPDATE ON escrows
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 2. REFUNDS
-- ============================================
CREATE TABLE IF NOT EXISTS refunds (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_id UUID NOT NULL REFERENCES payment_transactions(id),
    
    amount NUMERIC(19,4) NOT NULL CHECK (amount > 0),
    currency VARCHAR(3) NOT NULL DEFAULT 'INR',
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    
    provider VARCHAR(20) NOT NULL,
    provider_refund_id VARCHAR(100),
    
    reason TEXT NOT NULL,
    reason_code VARCHAR(50) CHECK (reason_code IN ('customer_request', 'fraud', 'duplicate', 'dispute', 'escrow_release', 'other')),
    
    initiated_by VARCHAR(50) NOT NULL,
    initiated_by_type VARCHAR(20) NOT NULL CHECK (initiated_by_type IN ('user', 'admin', 'system')),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_refunds_transaction ON refunds(transaction_id);
CREATE INDEX IF NOT EXISTS idx_refunds_status ON refunds(status);
CREATE INDEX IF NOT EXISTS idx_refunds_created ON refunds(created_at);

DROP TRIGGER IF EXISTS update_refunds_updated_at ON refunds;
CREATE TRIGGER update_refunds_updated_at BEFORE UPDATE ON refunds
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
