-- V20: Clean Integer Pricing & Exact 12-Month Multiples for 100% Financial Precision
-- Author: SuviX Platform Team

-- 1. Update subscription_plans with clean integer INR & USD prices (exact 12-month multiples for annual)
-- Creator Plans
UPDATE subscription_plans SET 
    price_monthly = 499.0000, 
    price_annual = 4788.0000, 
    price_monthly_usd = 19.0000, 
    price_annual_usd = 180.0000 
WHERE id = 'plan_creator_pro';

UPDATE subscription_plans SET 
    price_monthly = 1499.0000, 
    price_annual = 14388.0000, 
    price_monthly_usd = 49.0000, 
    price_annual_usd = 468.0000 
WHERE id = 'plan_creator_elite';

-- Editor Plans
UPDATE subscription_plans SET 
    price_monthly = 399.0000, 
    price_annual = 3828.0000, 
    price_monthly_usd = 15.0000, 
    price_annual_usd = 144.0000 
WHERE id = 'plan_editor_pro';

UPDATE subscription_plans SET 
    price_monthly = 1199.0000, 
    price_annual = 11508.0000, 
    price_monthly_usd = 39.0000, 
    price_annual_usd = 372.0000 
WHERE id = 'plan_editor_studio';

-- Brand Plans
UPDATE subscription_plans SET 
    price_monthly = 999.0000, 
    price_annual = 9588.0000, 
    price_monthly_usd = 29.0000, 
    price_annual_usd = 276.0000 
WHERE id = 'plan_brand_starter';

UPDATE subscription_plans SET 
    price_monthly = 2999.0000, 
    price_annual = 28788.0000, 
    price_monthly_usd = 89.0000, 
    price_annual_usd = 852.0000 
WHERE id = 'plan_brand_scale';

-- User Plans
UPDATE subscription_plans SET 
    price_monthly = 99.0000, 
    price_annual = 948.0000, 
    price_monthly_usd = 4.0000, 
    price_annual_usd = 36.0000 
WHERE id = 'plan_user_supporter';

-- 2. Clean and synchronize plan_prices table
-- Creator
UPDATE plan_prices SET amount = 499.0000 WHERE billing_interval = 'month' AND currency = 'INR' AND plan_version_id IN (SELECT id FROM plan_versions WHERE plan_id = 'plan_creator_pro');
UPDATE plan_prices SET amount = 4788.0000 WHERE billing_interval = 'year' AND currency = 'INR' AND plan_version_id IN (SELECT id FROM plan_versions WHERE plan_id = 'plan_creator_pro');
UPDATE plan_prices SET amount = 19.0000 WHERE billing_interval = 'month' AND currency = 'USD' AND plan_version_id IN (SELECT id FROM plan_versions WHERE plan_id = 'plan_creator_pro');
UPDATE plan_prices SET amount = 180.0000 WHERE billing_interval = 'year' AND currency = 'USD' AND plan_version_id IN (SELECT id FROM plan_versions WHERE plan_id = 'plan_creator_pro');

UPDATE plan_prices SET amount = 1499.0000 WHERE billing_interval = 'month' AND currency = 'INR' AND plan_version_id IN (SELECT id FROM plan_versions WHERE plan_id = 'plan_creator_elite');
UPDATE plan_prices SET amount = 14388.0000 WHERE billing_interval = 'year' AND currency = 'INR' AND plan_version_id IN (SELECT id FROM plan_versions WHERE plan_id = 'plan_creator_elite');
UPDATE plan_prices SET amount = 49.0000 WHERE billing_interval = 'month' AND currency = 'USD' AND plan_version_id IN (SELECT id FROM plan_versions WHERE plan_id = 'plan_creator_elite');
UPDATE plan_prices SET amount = 468.0000 WHERE billing_interval = 'year' AND currency = 'USD' AND plan_version_id IN (SELECT id FROM plan_versions WHERE plan_id = 'plan_creator_elite');

-- Editor
UPDATE plan_prices SET amount = 399.0000 WHERE billing_interval = 'month' AND currency = 'INR' AND plan_version_id IN (SELECT id FROM plan_versions WHERE plan_id = 'plan_editor_pro');
UPDATE plan_prices SET amount = 3828.0000 WHERE billing_interval = 'year' AND currency = 'INR' AND plan_version_id IN (SELECT id FROM plan_versions WHERE plan_id = 'plan_editor_pro');
UPDATE plan_prices SET amount = 15.0000 WHERE billing_interval = 'month' AND currency = 'USD' AND plan_version_id IN (SELECT id FROM plan_versions WHERE plan_id = 'plan_editor_pro');
UPDATE plan_prices SET amount = 144.0000 WHERE billing_interval = 'year' AND currency = 'USD' AND plan_version_id IN (SELECT id FROM plan_versions WHERE plan_id = 'plan_editor_pro');

UPDATE plan_prices SET amount = 1199.0000 WHERE billing_interval = 'month' AND currency = 'INR' AND plan_version_id IN (SELECT id FROM plan_versions WHERE plan_id = 'plan_editor_studio');
UPDATE plan_prices SET amount = 11508.0000 WHERE billing_interval = 'year' AND currency = 'INR' AND plan_version_id IN (SELECT id FROM plan_versions WHERE plan_id = 'plan_editor_studio');
UPDATE plan_prices SET amount = 39.0000 WHERE billing_interval = 'month' AND currency = 'USD' AND plan_version_id IN (SELECT id FROM plan_versions WHERE plan_id = 'plan_editor_studio');
UPDATE plan_prices SET amount = 372.0000 WHERE billing_interval = 'year' AND currency = 'USD' AND plan_version_id IN (SELECT id FROM plan_versions WHERE plan_id = 'plan_editor_studio');

-- Brand
UPDATE plan_prices SET amount = 999.0000 WHERE billing_interval = 'month' AND currency = 'INR' AND plan_version_id IN (SELECT id FROM plan_versions WHERE plan_id = 'plan_brand_starter');
UPDATE plan_prices SET amount = 9588.0000 WHERE billing_interval = 'year' AND currency = 'INR' AND plan_version_id IN (SELECT id FROM plan_versions WHERE plan_id = 'plan_brand_starter');
UPDATE plan_prices SET amount = 29.0000 WHERE billing_interval = 'month' AND currency = 'USD' AND plan_version_id IN (SELECT id FROM plan_versions WHERE plan_id = 'plan_brand_starter');
UPDATE plan_prices SET amount = 276.0000 WHERE billing_interval = 'year' AND currency = 'USD' AND plan_version_id IN (SELECT id FROM plan_versions WHERE plan_id = 'plan_brand_starter');

UPDATE plan_prices SET amount = 2999.0000 WHERE billing_interval = 'month' AND currency = 'INR' AND plan_version_id IN (SELECT id FROM plan_versions WHERE plan_id = 'plan_brand_scale');
UPDATE plan_prices SET amount = 28788.0000 WHERE billing_interval = 'year' AND currency = 'INR' AND plan_version_id IN (SELECT id FROM plan_versions WHERE plan_id = 'plan_brand_scale');
UPDATE plan_prices SET amount = 89.0000 WHERE billing_interval = 'month' AND currency = 'USD' AND plan_version_id IN (SELECT id FROM plan_versions WHERE plan_id = 'plan_brand_scale');
UPDATE plan_prices SET amount = 852.0000 WHERE billing_interval = 'year' AND currency = 'USD' AND plan_version_id IN (SELECT id FROM plan_versions WHERE plan_id = 'plan_brand_scale');

-- User
UPDATE plan_prices SET amount = 99.0000 WHERE billing_interval = 'month' AND currency = 'INR' AND plan_version_id IN (SELECT id FROM plan_versions WHERE plan_id = 'plan_user_supporter');
UPDATE plan_prices SET amount = 948.0000 WHERE billing_interval = 'year' AND currency = 'INR' AND plan_version_id IN (SELECT id FROM plan_versions WHERE plan_id = 'plan_user_supporter');
UPDATE plan_prices SET amount = 4.0000 WHERE billing_interval = 'month' AND currency = 'USD' AND plan_version_id IN (SELECT id FROM plan_versions WHERE plan_id = 'plan_user_supporter');
UPDATE plan_prices SET amount = 36.0000 WHERE billing_interval = 'year' AND currency = 'USD' AND plan_version_id IN (SELECT id FROM plan_versions WHERE plan_id = 'plan_user_supporter');

-- 3. Ensure all plan prices are marked as tax-inclusive for clean integer MRP pricing
UPDATE plan_prices SET is_tax_inclusive = true;

