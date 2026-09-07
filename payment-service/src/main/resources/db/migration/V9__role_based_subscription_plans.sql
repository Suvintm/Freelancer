-- Migration V9: Role-Based Subscription Plans and Target Role Metadata

ALTER TABLE subscription_plans 
ADD COLUMN IF NOT EXISTS target_role VARCHAR(50) DEFAULT 'all';

CREATE INDEX IF NOT EXISTS idx_subscription_plans_role ON subscription_plans(target_role);

-- Seed/Update Role-Specific Enterprise Subscription Plans
INSERT INTO subscription_plans (
    id, name, description, tier_level, billing_interval, price_monthly, price_annual,
    features, limits, is_active, version, is_latest_version, target_role
) VALUES 
-- 1. Creator Plans
(
    'plan_creator_free', 'Creator Starter', 'Kickstart your creator journey',
    1, 'month', 0.00, 0.00,
    '{"verified_badge": false, "link_in_bio_custom_theme": false, "custom_domain": false, "priority_ai_scripts": false, "brand_deal_crm": false}'::jsonb,
    '{"max_active_gigs": 3, "max_storage_gb": 5, "max_daily_messages": 50, "ai_generation": 5}'::jsonb,
    true, 1, true, 'creator'
),
(
    'plan_creator_pro', 'Creator Pro', 'Unlock verified badge, custom link-in-bio & AI growth tools',
    2, 'month', 499.00, 4790.00,
    '{"verified_badge": true, "link_in_bio_custom_theme": true, "custom_domain": false, "priority_ai_scripts": true, "brand_deal_crm": false}'::jsonb,
    '{"max_active_gigs": 15, "max_storage_gb": 50, "max_daily_messages": 500, "ai_generation": 100}'::jsonb,
    true, 1, true, 'creator'
),
(
    'plan_creator_elite', 'Creator Elite', 'Full custom domain, brand deal CRM & dedicated manager',
    3, 'month', 1499.00, 14390.00,
    '{"verified_badge": true, "link_in_bio_custom_theme": true, "custom_domain": true, "priority_ai_scripts": true, "brand_deal_crm": true}'::jsonb,
    '{"max_active_gigs": 50, "max_storage_gb": 500, "max_daily_messages": -1, "ai_generation": 1000}'::jsonb,
    true, 1, true, 'creator'
),

-- 2. Freelancer / Video Editor Plans
(
    'plan_editor_free', 'Freelancer Basic', 'Start offering your editing & creative services',
    1, 'month', 0.00, 0.00,
    '{"verified_freelancer_badge": false, "zero_commission_escrow": false, "priority_job_bids": false, "client_contract_invoicing": false}'::jsonb,
    '{"max_active_gigs": 3, "max_storage_gb": 10, "max_monthly_bids": 5, "platform_commission_pct": 10}'::jsonb,
    true, 1, true, 'editor'
),
(
    'plan_editor_pro', 'Freelancer Pro', 'Reduced 5% platform fee, verified badge & priority bids',
    2, 'month', 399.00, 3790.00,
    '{"verified_freelancer_badge": true, "zero_commission_escrow": false, "priority_job_bids": true, "client_contract_invoicing": true}'::jsonb,
    '{"max_active_gigs": 15, "max_storage_gb": 100, "max_monthly_bids": 25, "platform_commission_pct": 5}'::jsonb,
    true, 1, true, 'editor'
),
(
    'plan_editor_studio', 'Studio Agency', '0% platform commission on all escrow earnings & agency team seats',
    3, 'month', 1199.00, 11490.00,
    '{"verified_freelancer_badge": true, "zero_commission_escrow": true, "priority_job_bids": true, "client_contract_invoicing": true}'::jsonb,
    '{"max_active_gigs": 50, "max_storage_gb": 1000, "max_monthly_bids": -1, "platform_commission_pct": 0}'::jsonb,
    true, 1, true, 'editor'
),

-- 3. Brand & Agency Hiring Plans
(
    'plan_brand_starter', 'Brand Starter', 'Discover creators and hire for campaigns easily',
    2, 'month', 999.00, 9590.00,
    '{"creator_discovery_search": true, "bulk_campaign_postings": false, "fraud_detection_analytics": false, "dedicated_account_manager": false}'::jsonb,
    '{"max_open_campaigns": 5, "max_creator_searches_monthly": 500, "team_seats": 3}'::jsonb,
    true, 1, true, 'brand'
),
(
    'plan_brand_scale', 'Brand Scale', 'Unlimited creator discovery, analytics CRM & team collaboration',
    3, 'month', 2999.00, 28790.00,
    '{"creator_discovery_search": true, "bulk_campaign_postings": true, "fraud_detection_analytics": true, "dedicated_account_manager": true}'::jsonb,
    '{"max_open_campaigns": -1, "max_creator_searches_monthly": -1, "team_seats": 15}'::jsonb,
    true, 1, true, 'brand'
),

-- 4. Normal Community / Supporter Plans
(
    'plan_user_free', 'Member Free', 'Explore, follow and connect with creators',
    1, 'month', 0.00, 0.00,
    '{"ad_free_browsing": false, "exclusive_community_access": false, "supporter_badge": false}'::jsonb,
    '{"max_daily_messages": 50, "max_following": 200}'::jsonb,
    true, 1, true, 'user'
),
(
    'plan_user_supporter', 'SuviX Supporter Pass', 'Ad-free experience, supporter badge & exclusive community chats',
    2, 'month', 99.00, 950.00,
    '{"ad_free_browsing": true, "exclusive_community_access": true, "supporter_badge": true}'::jsonb,
    '{"max_daily_messages": 500, "max_following": 1000}'::jsonb,
    true, 1, true, 'user'
)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    tier_level = EXCLUDED.tier_level,
    price_monthly = EXCLUDED.price_monthly,
    price_annual = EXCLUDED.price_annual,
    features = EXCLUDED.features,
    limits = EXCLUDED.limits,
    target_role = EXCLUDED.target_role;
