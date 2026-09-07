-- ==============================================================================
-- Migration V11: Enterprise Subscription Plans, Versioning, Partitioning & RLS
-- ==============================================================================

-- 1. ROOT PLAN DEFINITIONS
CREATE TABLE IF NOT EXISTS plans (
    id VARCHAR(50) PRIMARY KEY,
    slug VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    target_role VARCHAR(50) DEFAULT 'all' NOT NULL, -- creator | editor | brand | user | all
    category VARCHAR(50) DEFAULT 'main' NOT NULL,
    icon VARCHAR(50),
    sort_order INT DEFAULT 0 NOT NULL,
    is_public BOOLEAN DEFAULT true NOT NULL,
    is_beta BOOLEAN DEFAULT false NOT NULL,
    rollout_percentage INT DEFAULT 100 NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_plans_role_public ON plans(target_role, is_public);

-- 2. STRUCTURED FEATURES
CREATE TABLE IF NOT EXISTS plan_features (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    verified_badge BOOLEAN DEFAULT false NOT NULL,
    custom_domain BOOLEAN DEFAULT false NOT NULL,
    analytics_dashboard BOOLEAN DEFAULT false NOT NULL,
    priority_support BOOLEAN DEFAULT false NOT NULL,
    api_access BOOLEAN DEFAULT false NOT NULL,
    white_label BOOLEAN DEFAULT false NOT NULL,
    team_collaboration BOOLEAN DEFAULT false NOT NULL,
    advanced_seo BOOLEAN DEFAULT false NOT NULL,
    monetization_tools BOOLEAN DEFAULT false NOT NULL,
    brand_deal_crm BOOLEAN DEFAULT false NOT NULL,
    custom_integrations BOOLEAN DEFAULT false NOT NULL,
    extra JSONB DEFAULT '{}'::jsonb NOT NULL
);

-- 3. STRUCTURED LIMITS
CREATE TABLE IF NOT EXISTS plan_limits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    max_storage_gb INT DEFAULT 1 NOT NULL,
    max_team_members INT DEFAULT 1 NOT NULL,
    max_projects INT DEFAULT 5 NOT NULL,
    max_ai_generations INT DEFAULT 10 NOT NULL,
    max_monthly_uploads INT DEFAULT 50 NOT NULL,
    max_bio_pages INT DEFAULT 1 NOT NULL,
    max_communities INT DEFAULT 1 NOT NULL,
    api_rate_limit_rpm INT DEFAULT 60 NOT NULL,
    support_response_hours INT DEFAULT 72 NOT NULL,
    extra JSONB DEFAULT '{}'::jsonb NOT NULL
);

-- 4. IMMUTABLE PLAN VERSIONS
CREATE TABLE IF NOT EXISTS plan_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_id VARCHAR(50) NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
    version_number INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    tier_level INT DEFAULT 1 NOT NULL,
    effective_from TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    effective_to TIMESTAMPTZ,
    is_latest BOOLEAN DEFAULT false NOT NULL,
    features_id UUID UNIQUE NOT NULL REFERENCES plan_features(id),
    limits_id UUID UNIQUE NOT NULL REFERENCES plan_limits(id),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    created_by VARCHAR(50),
    CONSTRAINT uq_plan_version UNIQUE (plan_id, version_number)
);

-- PARTIAL INDEX: Only active latest versions
CREATE INDEX IF NOT EXISTS idx_plan_versions_active 
ON plan_versions(plan_id, is_latest) 
WHERE is_latest = true AND effective_to IS NULL;

CREATE INDEX IF NOT EXISTS idx_plan_versions_effective 
ON plan_versions(effective_from, effective_to);

-- 5. PLAN PRICES (Multi-interval & Multi-currency)
CREATE TABLE IF NOT EXISTS plan_prices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_version_id UUID NOT NULL REFERENCES plan_versions(id) ON DELETE CASCADE,
    billing_interval VARCHAR(20) NOT NULL, -- month | year | quarter
    currency VARCHAR(3) DEFAULT 'INR' NOT NULL,
    amount NUMERIC(19, 4) NOT NULL,
    is_tax_inclusive BOOLEAN DEFAULT false NOT NULL,
    tax_rate NUMERIC(5, 2) DEFAULT 18.00 NOT NULL,
    display_amount NUMERIC(19, 4),
    trial_days INT DEFAULT 0 NOT NULL,
    is_active BOOLEAN DEFAULT true NOT NULL,
    effective_from TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    effective_to TIMESTAMPTZ
);

-- COVERING INDEX: Index-only scan for pricing lookups
CREATE INDEX IF NOT EXISTS idx_plan_prices_lookup 
ON plan_prices(plan_version_id, billing_interval, currency, is_active) 
INCLUDE (amount, tax_rate, is_tax_inclusive)
WHERE is_active = true AND effective_to IS NULL;

-- 6. PLAN ENTITLEMENTS
CREATE TABLE IF NOT EXISTS plan_entitlements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_id VARCHAR(50) NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
    feature_key VARCHAR(50) NOT NULL,
    is_enabled BOOLEAN DEFAULT true NOT NULL,
    limit_value INT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT uq_plan_entitlement UNIQUE (plan_id, feature_key)
);

-- 7. COUPONS ENGINE
CREATE TABLE IF NOT EXISTS coupons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    discount_type VARCHAR(20) NOT NULL, -- percentage | fixed
    discount_value NUMERIC(10, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'INR' NOT NULL,
    max_redemptions INT,
    times_redeemed INT DEFAULT 0 NOT NULL,
    applicable_roles JSONB DEFAULT '["all"]'::jsonb NOT NULL,
    applicable_plans JSONB DEFAULT '["all"]'::jsonb NOT NULL,
    starts_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    expires_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_coupons_code_active ON coupons(code, is_active);

-- 8. SUBSCRIPTION CHANGE AUDIT LOG
CREATE TABLE IF NOT EXISTS subscription_change_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subscription_id VARCHAR(50) NOT NULL,
    user_id VARCHAR(50) NOT NULL,
    change_type VARCHAR(20) NOT NULL, -- upgrade | downgrade | pause | resume | cancel | prorate
    from_plan_version_id UUID,
    to_plan_version_id UUID,
    from_price NUMERIC(19, 4),
    to_price NUMERIC(19, 4),
    proration_amount NUMERIC(19, 4),
    refund_amount NUMERIC(19, 4),
    charge_amount NUMERIC(19, 4),
    reason TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_change_logs_sub ON subscription_change_logs(subscription_id, created_at);
CREATE INDEX IF NOT EXISTS idx_change_logs_user ON subscription_change_logs(user_id);

-- 9. EXTEND SUBSCRIPTIONS TABLE WITH ENTERPRISE SNAPSHOT FIELDS
ALTER TABLE subscriptions 
ADD COLUMN IF NOT EXISTS plan_version_id UUID,
ADD COLUMN IF NOT EXISTS enterprise_plan_id VARCHAR(50),
ADD COLUMN IF NOT EXISTS plan_snapshot JSONB,
ADD COLUMN IF NOT EXISTS base_amount NUMERIC(19, 4) DEFAULT 0,
ADD COLUMN IF NOT EXISTS tax_amount NUMERIC(19, 4) DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_amount NUMERIC(19, 4) DEFAULT 0,
ADD COLUMN IF NOT EXISTS cancellation_reason TEXT,
ADD COLUMN IF NOT EXISTS previous_subscription_id VARCHAR(50),
ADD COLUMN IF NOT EXISTS change_type VARCHAR(20),
ADD COLUMN IF NOT EXISTS proration_amount NUMERIC(19, 4);

-- PARTIAL INDEX ON ACTIVE SUBSCRIPTIONS
CREATE INDEX IF NOT EXISTS idx_subscriptions_active_entitlements 
ON subscriptions(user_id, plan_version_id, current_period_end)
WHERE status = 'active';

-- 10. MONTHLY PARTITIONED USAGE TRACKING TABLE
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_tables WHERE tablename = 'usage_tracking' AND schemaname = 'public'
    ) AND NOT EXISTS (
        SELECT 1 FROM pg_partitioned_table pt JOIN pg_class c ON pt.partrelid = c.oid WHERE c.relname = 'usage_tracking'
    ) THEN
        DROP TABLE usage_tracking CASCADE;
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS usage_tracking (
    id BIGSERIAL,
    user_id VARCHAR(50) NOT NULL,
    subscription_id VARCHAR(50),
    feature_key VARCHAR(50) NOT NULL,
    usage_period VARCHAR(7) NOT NULL, -- 'YYYY-MM'
    usage_count INT DEFAULT 0 NOT NULL,
    usage_limit INT,
    last_used_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    PRIMARY KEY (id, usage_period)
) PARTITION BY LIST (usage_period);

-- Create 2026-08 through 2026-12 monthly partitions
CREATE TABLE IF NOT EXISTS usage_tracking_2026_08 PARTITION OF usage_tracking FOR VALUES IN ('2026-08');
CREATE TABLE IF NOT EXISTS usage_tracking_2026_09 PARTITION OF usage_tracking FOR VALUES IN ('2026-09');
CREATE TABLE IF NOT EXISTS usage_tracking_2026_10 PARTITION OF usage_tracking FOR VALUES IN ('2026-10');
CREATE TABLE IF NOT EXISTS usage_tracking_2026_11 PARTITION OF usage_tracking FOR VALUES IN ('2026-11');
CREATE TABLE IF NOT EXISTS usage_tracking_2026_12 PARTITION OF usage_tracking FOR VALUES IN ('2026-12');

CREATE INDEX IF NOT EXISTS idx_usage_2026_09 ON usage_tracking_2026_09(user_id, feature_key);
CREATE INDEX IF NOT EXISTS idx_usage_2026_10 ON usage_tracking_2026_10(user_id, feature_key);

-- 11. ROW-LEVEL SECURITY (RLS) POLICIES
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'subscriptions' AND policyname = 'subscription_user_isolation'
    ) THEN
        CREATE POLICY subscription_user_isolation ON subscriptions
        FOR SELECT USING (user_id = current_setting('app.current_user_id', true) OR current_setting('app.current_user_id', true) IS NULL);
    END IF;
END $$;

-- 12. SEED ENTERPRISE PLANS, VERSIONS, FEATURES, LIMITS & PRICES
-- ── A. Creator Plans ──
INSERT INTO plans (id, slug, name, description, target_role, category, icon, sort_order, is_public)
VALUES
('plan_creator_free', 'creator_free', 'Creator Starter', 'Kickstart your creator journey', 'creator', 'main', 'Send', 1, true),
('plan_creator_pro', 'creator_pro', 'Creator Pro', 'Unlock verified badge, custom link-in-bio & AI growth tools', 'creator', 'main', 'Rocket', 2, true),
('plan_creator_elite', 'creator_elite', 'Creator Elite', 'Full custom domain, brand deal CRM & dedicated manager', 'creator', 'main', 'Crown', 3, true)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, target_role = EXCLUDED.target_role, is_public = EXCLUDED.is_public;

-- ── B. Editor Plans ──
INSERT INTO plans (id, slug, name, description, target_role, category, icon, sort_order, is_public)
VALUES
('plan_editor_free', 'editor_free', 'Freelancer Basic', 'Start offering your editing & creative services', 'editor', 'main', 'Scissors', 1, true),
('plan_editor_pro', 'editor_pro', 'Freelancer Pro', 'Reduced 5% platform fee, verified badge & priority bids', 'editor', 'main', 'Zap', 2, true),
('plan_editor_studio', 'editor_studio', 'Studio Agency', '0% platform commission on all escrow earnings & agency team seats', 'editor', 'main', 'Briefcase', 3, true)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, target_role = EXCLUDED.target_role, is_public = EXCLUDED.is_public;

-- ── C. Brand Plans ──
INSERT INTO plans (id, slug, name, description, target_role, category, icon, sort_order, is_public)
VALUES
('plan_brand_starter', 'brand_starter', 'Brand Starter', 'Discover creators and hire for campaigns easily', 'brand', 'main', 'Building2', 1, true),
('plan_brand_scale', 'brand_scale', 'Brand Scale', 'Unlimited creator discovery, analytics CRM & team collaboration', 'brand', 'main', 'Sparkles', 2, true)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, target_role = EXCLUDED.target_role, is_public = EXCLUDED.is_public;

-- ── D. User / Community Plans ──
INSERT INTO plans (id, slug, name, description, target_role, category, icon, sort_order, is_public)
VALUES
('plan_user_free', 'user_free', 'Member Free', 'Explore, follow and connect with creators', 'user', 'main', 'User', 1, true),
('plan_user_supporter', 'user_supporter', 'SuviX Supporter Pass', 'Ad-free experience, supporter badge & exclusive community chats', 'user', 'main', 'Crown', 2, true)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, target_role = EXCLUDED.target_role, is_public = EXCLUDED.is_public;

-- ── E. Seed Canonical Coupons ──
INSERT INTO coupons (code, discount_type, discount_value, max_redemptions, applicable_roles, is_active)
VALUES
('CREATOR20', 'percentage', 20.00, 10000, '["all"]'::jsonb, true),
('SUVI20', 'percentage', 20.00, 10000, '["all"]'::jsonb, true),
('LAUNCH50', 'percentage', 50.00, 1000, '["all"]'::jsonb, true),
('SUVIPRO', 'percentage', 15.00, 5000, '["all"]'::jsonb, true)
ON CONFLICT (code) DO NOTHING;

-- 13. ASYNC BACKFILL PROCEDURE FOR HISTORICAL SUBSCRIBERS
UPDATE subscriptions s
SET 
    plan_snapshot = jsonb_build_object(
        'planId', s.plan_id,
        'status', s.status,
        'migratedAt', NOW(),
        'legacyGrandfathered', true
    ),
    base_amount = COALESCE(s.base_amount, 0),
    total_amount = COALESCE(s.total_amount, 0)
WHERE s.plan_snapshot IS NULL;
