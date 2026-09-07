-- ==============================================================================
-- Migration V14: Partial Indexes for Plans Catalog and Active Subscriptions
-- ==============================================================================

-- 1. Partial Index for Active Plans by Role and Tier Level (Index-Only Scan)
CREATE INDEX IF NOT EXISTS idx_plans_active_role 
ON subscription_plans(target_role, tier_level) 
WHERE is_active = true;

-- 2. Partial Index for Active Subscriptions Lookups
CREATE INDEX IF NOT EXISTS idx_subscriptions_active_user 
ON subscriptions(user_id, status) 
WHERE status IN ('active', 'trialing', 'past_due', 'cancelling');

-- 3. BRIN Index for Usage Tracking Time-Series Telemetry
CREATE INDEX IF NOT EXISTS idx_usage_tracking_brin_time 
ON usage_tracking USING BRIN(last_used_at);
