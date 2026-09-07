-- V17: Widen Idempotency Key and Correlation ID Lengths
-- Author: SuviX Platform Team

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'payment_transactions' AND column_name = 'idempotency_key'
    ) THEN
        ALTER TABLE payment_transactions ALTER COLUMN idempotency_key TYPE VARCHAR(255);
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'payment_transactions' AND column_name = 'correlation_id'
    ) THEN
        ALTER TABLE payment_transactions ALTER COLUMN correlation_id TYPE VARCHAR(255);
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'idempotency_keys' AND column_name = 'id'
    ) THEN
        ALTER TABLE idempotency_keys ALTER COLUMN id TYPE VARCHAR(255);
    END IF;
END $$;
