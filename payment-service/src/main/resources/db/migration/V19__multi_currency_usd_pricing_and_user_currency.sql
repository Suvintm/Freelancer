-- V19: Multi-Currency USD Pricing, User Currency Preference, and PlanPrice Deduplication
-- Author: SuviX Platform Team

-- 1. Add preferred_currency to user_profiles table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_profiles' AND column_name = 'preferred_currency'
    ) THEN
        ALTER TABLE user_profiles ADD COLUMN preferred_currency VARCHAR(3) DEFAULT 'INR';
    END IF;
END $$;

-- 2. Add price_monthly_usd and price_annual_usd columns to subscription_plans
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'subscription_plans' AND column_name = 'price_monthly_usd'
    ) THEN
        ALTER TABLE subscription_plans ADD COLUMN price_monthly_usd NUMERIC(19, 4) DEFAULT 0.0000;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'subscription_plans' AND column_name = 'price_annual_usd'
    ) THEN
        ALTER TABLE subscription_plans ADD COLUMN price_annual_usd NUMERIC(19, 4) DEFAULT 0.0000;
    END IF;
END $$;

-- 3. Update subscription_plans with deliberate USD pricing
UPDATE subscription_plans SET price_monthly_usd = 0.0000, price_annual_usd = 0.0000 WHERE id = 'plan_creator_free';
UPDATE subscription_plans SET price_monthly_usd = 6.9900, price_annual_usd = 69.0000 WHERE id = 'plan_creator_pro';
UPDATE subscription_plans SET price_monthly_usd = 19.9900, price_annual_usd = 199.0000 WHERE id = 'plan_creator_elite';

UPDATE subscription_plans SET price_monthly_usd = 0.0000, price_annual_usd = 0.0000 WHERE id = 'plan_editor_free';
UPDATE subscription_plans SET price_monthly_usd = 4.9900, price_annual_usd = 49.0000 WHERE id = 'plan_editor_pro';
UPDATE subscription_plans SET price_monthly_usd = 15.9900, price_annual_usd = 159.0000 WHERE id = 'plan_editor_studio';

UPDATE subscription_plans SET price_monthly_usd = 0.0000, price_annual_usd = 0.0000 WHERE id = 'plan_brand_free';
UPDATE subscription_plans SET price_monthly_usd = 12.9900, price_annual_usd = 129.0000 WHERE id = 'plan_brand_starter';
UPDATE subscription_plans SET price_monthly_usd = 39.9900, price_annual_usd = 399.0000 WHERE id = 'plan_brand_scale';

UPDATE subscription_plans SET price_monthly_usd = 0.0000, price_annual_usd = 0.0000 WHERE id = 'plan_user_free';
UPDATE subscription_plans SET price_monthly_usd = 1.4900, price_annual_usd = 14.9900 WHERE id = 'plan_user_supporter';

-- 4. Clean up duplicate rows in plan_prices
DELETE FROM plan_prices a
USING plan_prices b
WHERE a.id > b.id
  AND a.plan_version_id = b.plan_version_id
  AND a.billing_interval = b.billing_interval
  AND a.currency = b.currency
  AND a.is_active = b.is_active;

-- 5. Seed fixed USD prices into plan_prices table for each latest plan version
-- Creator Plans
INSERT INTO plan_prices (plan_version_id, billing_interval, currency, amount, is_tax_inclusive, tax_rate, is_active, effective_from)
SELECT pv.id, 'month', 'USD', 0.0000, false, 0.00, true, NOW()
FROM plan_versions pv WHERE pv.plan_id = 'plan_creator_free' AND pv.is_latest = true
AND NOT EXISTS (SELECT 1 FROM plan_prices pr WHERE pr.plan_version_id = pv.id AND pr.billing_interval = 'month' AND pr.currency = 'USD');

INSERT INTO plan_prices (plan_version_id, billing_interval, currency, amount, is_tax_inclusive, tax_rate, is_active, effective_from)
SELECT pv.id, 'month', 'USD', 6.9900, false, 0.00, true, NOW()
FROM plan_versions pv WHERE pv.plan_id = 'plan_creator_pro' AND pv.is_latest = true
AND NOT EXISTS (SELECT 1 FROM plan_prices pr WHERE pr.plan_version_id = pv.id AND pr.billing_interval = 'month' AND pr.currency = 'USD');

INSERT INTO plan_prices (plan_version_id, billing_interval, currency, amount, is_tax_inclusive, tax_rate, is_active, effective_from)
SELECT pv.id, 'year', 'USD', 69.0000, false, 0.00, true, NOW()
FROM plan_versions pv WHERE pv.plan_id = 'plan_creator_pro' AND pv.is_latest = true
AND NOT EXISTS (SELECT 1 FROM plan_prices pr WHERE pr.plan_version_id = pv.id AND pr.billing_interval = 'year' AND pr.currency = 'USD');

INSERT INTO plan_prices (plan_version_id, billing_interval, currency, amount, is_tax_inclusive, tax_rate, is_active, effective_from)
SELECT pv.id, 'month', 'USD', 19.9900, false, 0.00, true, NOW()
FROM plan_versions pv WHERE pv.plan_id = 'plan_creator_elite' AND pv.is_latest = true
AND NOT EXISTS (SELECT 1 FROM plan_prices pr WHERE pr.plan_version_id = pv.id AND pr.billing_interval = 'month' AND pr.currency = 'USD');

INSERT INTO plan_prices (plan_version_id, billing_interval, currency, amount, is_tax_inclusive, tax_rate, is_active, effective_from)
SELECT pv.id, 'year', 'USD', 199.0000, false, 0.00, true, NOW()
FROM plan_versions pv WHERE pv.plan_id = 'plan_creator_elite' AND pv.is_latest = true
AND NOT EXISTS (SELECT 1 FROM plan_prices pr WHERE pr.plan_version_id = pv.id AND pr.billing_interval = 'year' AND pr.currency = 'USD');

-- Editor Plans
INSERT INTO plan_prices (plan_version_id, billing_interval, currency, amount, is_tax_inclusive, tax_rate, is_active, effective_from)
SELECT pv.id, 'month', 'USD', 0.0000, false, 0.00, true, NOW()
FROM plan_versions pv WHERE pv.plan_id = 'plan_editor_free' AND pv.is_latest = true
AND NOT EXISTS (SELECT 1 FROM plan_prices pr WHERE pr.plan_version_id = pv.id AND pr.billing_interval = 'month' AND pr.currency = 'USD');

INSERT INTO plan_prices (plan_version_id, billing_interval, currency, amount, is_tax_inclusive, tax_rate, is_active, effective_from)
SELECT pv.id, 'month', 'USD', 4.9900, false, 0.00, true, NOW()
FROM plan_versions pv WHERE pv.plan_id = 'plan_editor_pro' AND pv.is_latest = true
AND NOT EXISTS (SELECT 1 FROM plan_prices pr WHERE pr.plan_version_id = pv.id AND pr.billing_interval = 'month' AND pr.currency = 'USD');

INSERT INTO plan_prices (plan_version_id, billing_interval, currency, amount, is_tax_inclusive, tax_rate, is_active, effective_from)
SELECT pv.id, 'year', 'USD', 49.0000, false, 0.00, true, NOW()
FROM plan_versions pv WHERE pv.plan_id = 'plan_editor_pro' AND pv.is_latest = true
AND NOT EXISTS (SELECT 1 FROM plan_prices pr WHERE pr.plan_version_id = pv.id AND pr.billing_interval = 'year' AND pr.currency = 'USD');

INSERT INTO plan_prices (plan_version_id, billing_interval, currency, amount, is_tax_inclusive, tax_rate, is_active, effective_from)
SELECT pv.id, 'month', 'USD', 15.9900, false, 0.00, true, NOW()
FROM plan_versions pv WHERE pv.plan_id = 'plan_editor_studio' AND pv.is_latest = true
AND NOT EXISTS (SELECT 1 FROM plan_prices pr WHERE pr.plan_version_id = pv.id AND pr.billing_interval = 'month' AND pr.currency = 'USD');

INSERT INTO plan_prices (plan_version_id, billing_interval, currency, amount, is_tax_inclusive, tax_rate, is_active, effective_from)
SELECT pv.id, 'year', 'USD', 159.0000, false, 0.00, true, NOW()
FROM plan_versions pv WHERE pv.plan_id = 'plan_editor_studio' AND pv.is_latest = true
AND NOT EXISTS (SELECT 1 FROM plan_prices pr WHERE pr.plan_version_id = pv.id AND pr.billing_interval = 'year' AND pr.currency = 'USD');

-- Brand Plans
INSERT INTO plan_prices (plan_version_id, billing_interval, currency, amount, is_tax_inclusive, tax_rate, is_active, effective_from)
SELECT pv.id, 'month', 'USD', 0.0000, false, 0.00, true, NOW()
FROM plan_versions pv WHERE pv.plan_id = 'plan_brand_free' AND pv.is_latest = true
AND NOT EXISTS (SELECT 1 FROM plan_prices pr WHERE pr.plan_version_id = pv.id AND pr.billing_interval = 'month' AND pr.currency = 'USD');

INSERT INTO plan_prices (plan_version_id, billing_interval, currency, amount, is_tax_inclusive, tax_rate, is_active, effective_from)
SELECT pv.id, 'month', 'USD', 12.9900, false, 0.00, true, NOW()
FROM plan_versions pv WHERE pv.plan_id = 'plan_brand_starter' AND pv.is_latest = true
AND NOT EXISTS (SELECT 1 FROM plan_prices pr WHERE pr.plan_version_id = pv.id AND pr.billing_interval = 'month' AND pr.currency = 'USD');

INSERT INTO plan_prices (plan_version_id, billing_interval, currency, amount, is_tax_inclusive, tax_rate, is_active, effective_from)
SELECT pv.id, 'year', 'USD', 129.0000, false, 0.00, true, NOW()
FROM plan_versions pv WHERE pv.plan_id = 'plan_brand_starter' AND pv.is_latest = true
AND NOT EXISTS (SELECT 1 FROM plan_prices pr WHERE pr.plan_version_id = pv.id AND pr.billing_interval = 'year' AND pr.currency = 'USD');

INSERT INTO plan_prices (plan_version_id, billing_interval, currency, amount, is_tax_inclusive, tax_rate, is_active, effective_from)
SELECT pv.id, 'month', 'USD', 39.9900, false, 0.00, true, NOW()
FROM plan_versions pv WHERE pv.plan_id = 'plan_brand_scale' AND pv.is_latest = true
AND NOT EXISTS (SELECT 1 FROM plan_prices pr WHERE pr.plan_version_id = pv.id AND pr.billing_interval = 'month' AND pr.currency = 'USD');

INSERT INTO plan_prices (plan_version_id, billing_interval, currency, amount, is_tax_inclusive, tax_rate, is_active, effective_from)
SELECT pv.id, 'year', 'USD', 399.0000, false, 0.00, true, NOW()
FROM plan_versions pv WHERE pv.plan_id = 'plan_brand_scale' AND pv.is_latest = true
AND NOT EXISTS (SELECT 1 FROM plan_prices pr WHERE pr.plan_version_id = pv.id AND pr.billing_interval = 'year' AND pr.currency = 'USD');

-- User Plans
INSERT INTO plan_prices (plan_version_id, billing_interval, currency, amount, is_tax_inclusive, tax_rate, is_active, effective_from)
SELECT pv.id, 'month', 'USD', 0.0000, false, 0.00, true, NOW()
FROM plan_versions pv WHERE pv.plan_id = 'plan_user_free' AND pv.is_latest = true
AND NOT EXISTS (SELECT 1 FROM plan_prices pr WHERE pr.plan_version_id = pv.id AND pr.billing_interval = 'month' AND pr.currency = 'USD');

INSERT INTO plan_prices (plan_version_id, billing_interval, currency, amount, is_tax_inclusive, tax_rate, is_active, effective_from)
SELECT pv.id, 'month', 'USD', 1.4900, false, 0.00, true, NOW()
FROM plan_versions pv WHERE pv.plan_id = 'plan_user_supporter' AND pv.is_latest = true
AND NOT EXISTS (SELECT 1 FROM plan_prices pr WHERE pr.plan_version_id = pv.id AND pr.billing_interval = 'month' AND pr.currency = 'USD');

INSERT INTO plan_prices (plan_version_id, billing_interval, currency, amount, is_tax_inclusive, tax_rate, is_active, effective_from)
SELECT pv.id, 'year', 'USD', 14.9900, false, 0.00, true, NOW()
FROM plan_versions pv WHERE pv.plan_id = 'plan_user_supporter' AND pv.is_latest = true
AND NOT EXISTS (SELECT 1 FROM plan_prices pr WHERE pr.plan_version_id = pv.id AND pr.billing_interval = 'year' AND pr.currency = 'USD');
