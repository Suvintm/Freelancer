-- V16: Fix Column Types and Parity for Ledger and Tracking
-- Author: SuviX Platform Team

DO $$
BEGIN
    -- 1. Alter subscription_ledger columns to UUID with USING cast
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'subscription_ledger' AND column_name = 'subscription_id' AND data_type != 'uuid'
    ) THEN
        ALTER TABLE subscription_ledger ALTER COLUMN subscription_id TYPE uuid USING subscription_id::uuid;
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'subscription_ledger' AND column_name = 'invoice_id' AND data_type != 'uuid'
    ) THEN
        ALTER TABLE subscription_ledger ALTER COLUMN invoice_id TYPE uuid USING invoice_id::uuid;
    END IF;

    -- 2. Alter subscription_status_history columns to UUID
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'subscription_status_history' AND column_name = 'subscription_id' AND data_type != 'uuid'
    ) THEN
        ALTER TABLE subscription_status_history ALTER COLUMN subscription_id TYPE uuid USING subscription_id::uuid;
    END IF;

    -- 3. Ensure usage_tracking has feature_name
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'usage_tracking' AND column_name = 'feature_name'
    ) THEN
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'usage_tracking' AND column_name = 'feature'
        ) THEN
            ALTER TABLE usage_tracking RENAME COLUMN feature TO feature_name;
        ELSE
            ALTER TABLE usage_tracking ADD COLUMN feature_name VARCHAR(100) NOT NULL DEFAULT 'default';
        END IF;
    END IF;
END $$;
