-- V18: Subscription Schema Alignment, Enum Expansion, and Currency Support
-- Author: SuviX Platform Team

-- 1. Add currency column to subscriptions if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'subscriptions' AND column_name = 'currency'
    ) THEN
        ALTER TABLE subscriptions ADD COLUMN currency VARCHAR(3) DEFAULT 'INR' NOT NULL;
    END IF;
END $$;

-- 2. Expand SubscriptionStatus enum in PostgreSQL if the enum exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'SubscriptionStatus') THEN
        ALTER TYPE "SubscriptionStatus" ADD VALUE IF NOT EXISTS 'incomplete';
        ALTER TYPE "SubscriptionStatus" ADD VALUE IF NOT EXISTS 'trialing';
        ALTER TYPE "SubscriptionStatus" ADD VALUE IF NOT EXISTS 'active';
        ALTER TYPE "SubscriptionStatus" ADD VALUE IF NOT EXISTS 'past_due';
        ALTER TYPE "SubscriptionStatus" ADD VALUE IF NOT EXISTS 'unpaid';
        ALTER TYPE "SubscriptionStatus" ADD VALUE IF NOT EXISTS 'cancelling';
        ALTER TYPE "SubscriptionStatus" ADD VALUE IF NOT EXISTS 'paused';
        ALTER TYPE "SubscriptionStatus" ADD VALUE IF NOT EXISTS 'expired';
        ALTER TYPE "SubscriptionStatus" ADD VALUE IF NOT EXISTS 'disputed';
        ALTER TYPE "SubscriptionStatus" ADD VALUE IF NOT EXISTS 'cancelled';
        ALTER TYPE "SubscriptionStatus" ADD VALUE IF NOT EXISTS 'payment_pending';
    END IF;
END $$;

-- 3. Index subscriptions by user_id and currency
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_currency ON subscriptions (user_id, currency);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status_lifecycle ON subscriptions (status, current_period_end);
