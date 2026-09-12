-- ==============================================================================
-- Migration V22: Dynamic Tax Rules, Company Billing Profiles & Enterprise Plan Seeds
-- ==============================================================================

-- 1. DYNAMIC TAX RULES TABLE
CREATE TABLE IF NOT EXISTS tax_rules (
    id VARCHAR(50) PRIMARY KEY,
    country_code VARCHAR(10) NOT NULL, -- IN, US, GB, EU, etc.
    state_code VARCHAR(50) DEFAULT 'ALL' NOT NULL, -- 29 (Karnataka), ALL
    tax_name VARCHAR(50) DEFAULT 'GST' NOT NULL,
    tax_rate NUMERIC(5, 2) DEFAULT 18.00 NOT NULL,
    cgst_rate NUMERIC(5, 2) DEFAULT 9.00,
    sgst_rate NUMERIC(5, 2) DEFAULT 9.00,
    igst_rate NUMERIC(5, 2) DEFAULT 18.00,
    sac_code VARCHAR(20) DEFAULT '998314',
    is_inclusive BOOLEAN DEFAULT true NOT NULL,
    is_active BOOLEAN DEFAULT true NOT NULL,
    effective_from TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    effective_to TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_tax_rules_lookup 
ON tax_rules(country_code, state_code, is_active);

-- Seed Default India GST Rule (18% inclusive)
INSERT INTO tax_rules (
    id, country_code, state_code, tax_name, tax_rate, cgst_rate, sgst_rate, igst_rate, sac_code, is_inclusive, is_active
) VALUES (
    'tax_rule_in_gst_18', 'IN', 'ALL', 'GST', 18.00, 9.00, 9.00, 18.00, '998314', true, true
) ON CONFLICT (id) DO UPDATE SET 
    tax_rate = EXCLUDED.tax_rate,
    cgst_rate = EXCLUDED.cgst_rate,
    sgst_rate = EXCLUDED.sgst_rate,
    igst_rate = EXCLUDED.igst_rate,
    is_inclusive = EXCLUDED.is_inclusive;

-- Seed Default International 0% Export / Reverse Charge Rule
INSERT INTO tax_rules (
    id, country_code, state_code, tax_name, tax_rate, cgst_rate, sgst_rate, igst_rate, sac_code, is_inclusive, is_active
) VALUES (
    'tax_rule_intl_export_0', 'US', 'ALL', 'Export/LUT', 0.00, 0.00, 0.00, 0.00, '998314', false, true
) ON CONFLICT (id) DO UPDATE SET 
    tax_rate = EXCLUDED.tax_rate;


-- 2. COMPANY BILLING & LEGAL INVOICING PROFILES TABLE
CREATE TABLE IF NOT EXISTS company_billing_profiles (
    id VARCHAR(50) PRIMARY KEY,
    legal_name VARCHAR(255) NOT NULL,
    trade_name VARCHAR(255),
    gstin VARCHAR(30),
    cin VARCHAR(30),
    pan VARCHAR(30),
    address_line1 VARCHAR(255),
    address_line2 VARCHAR(255),
    city VARCHAR(100),
    state_name VARCHAR(100),
    state_code VARCHAR(20),
    postal_code VARCHAR(20),
    country VARCHAR(100) DEFAULT 'India',
    support_email VARCHAR(100),
    support_phone VARCHAR(50),
    invoice_prefix VARCHAR(20) DEFAULT 'SVX-INV-',
    sac_code VARCHAR(20) DEFAULT '998314',
    hsn_description VARCHAR(255) DEFAULT 'Software-as-a-Service (SaaS) Subscription',
    is_default BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Seed Official SuviX Company Invoicing Profile
INSERT INTO company_billing_profiles (
    id, legal_name, trade_name, gstin, cin, pan, 
    address_line1, address_line2, city, state_name, state_code, postal_code, country,
    support_email, invoice_prefix, sac_code, hsn_description, is_default
) VALUES (
    'comp_suvix_india',
    'SuviX Technologies Private Limited',
    'SuviX Inc.',
    '29ABCDE1234F1Z5',
    'U72900KA2026PTC123456',
    'ABCDE1234F',
    'Tower B, 4th Floor, Tech Park',
    'Outer Ring Road, Kadubeesanahalli',
    'Bengaluru',
    'Karnataka',
    '29 - Karnataka',
    '560103',
    'India',
    'billing@suvix.in',
    'SVX-INV-',
    '998314',
    'Software-as-a-Service (SaaS) Subscription',
    true
) ON CONFLICT (id) DO UPDATE SET
    legal_name = EXCLUDED.legal_name,
    gstin = EXCLUDED.gstin,
    cin = EXCLUDED.cin,
    support_email = EXCLUDED.support_email;
