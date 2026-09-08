/**
 * Enterprise Subscription Plans & Entitlements Seeder
 * 
 * Sets up versioned plans, prices, structured features/limits,
 * ready-to-render Server-Driven UI (SDUI) feature lists and quotas,
 * and canonical promotional coupons with zero downtime.
 */

import prisma from '../src/infrastructure/database/postgres.js';

async function seedEnterprisePlans() {
  console.log('🚀 Starting Enterprise Subscription Plans Seeding (Server-Driven UI)...');

  // 1. CANONICAL ROLE-BASED PLAN HIERARCHY WITH READY-TO-RENDER SDUI METADATA
  const plansData = [
    // ── CREATOR PLANS ──
    {
      id: 'plan_creator_free',
      slug: 'creator_free',
      name: 'Creator Starter',
      description: 'Kickstart your creator journey',
      targetRole: 'creator',
      category: 'main',
      icon: 'Send',
      badge: null,
      buttonText: 'Get Started Free',
      sortOrder: 1,
      tierLevel: 1,
      priceMonthly: 0,
      priceAnnual: 0,
      priceMonthlyUsd: 0,
      priceAnnualUsd: 0,
      featureList: [
        'Public Creator Profile',
        'Add up to 5 Bio Links',
        'Standard Link-in-Bio Theme',
        'Basic Audience Analytics',
        'Community Access',
      ],
      quotas: [
        { label: 'Active Services / Gigs', value: '3 Active' },
        { label: 'Media Cloud Storage', value: '5 GB' },
        { label: 'AI Script Generations', value: '5 / month' },
        { label: 'Daily Messages', value: '50 / day' },
      ],
      features: {
        verifiedBadge: false,
        customDomain: false,
        analyticsDashboard: true,
        prioritySupport: false,
        apiAccess: false,
        whiteLabel: false,
        teamCollaboration: false,
        advancedSeo: false,
        monetizationTools: false,
        brandDealCrm: false,
        customIntegrations: false,
        extra: { bioLinks: 5, theme: 'standard' },
      },
      limits: {
        maxStorageGb: 5,
        maxTeamMembers: 1,
        maxProjects: 3,
        maxAiGenerations: 5,
        maxMonthlyUploads: 50,
        maxBioPages: 1,
        maxCommunities: 1,
        apiRateLimitRpm: 60,
        supportResponseHrs: 72,
        extra: { maxDailyMessages: 50 },
      },
      entitlements: [
        { featureKey: 'public_profile', isEnabled: true, limit: null },
        { featureKey: 'bio_links', isEnabled: true, limit: 5 },
        { featureKey: 'analytics', isEnabled: true, limit: null },
        { featureKey: 'ai_script_generator', isEnabled: true, limit: 5 },
      ],
    },
    {
      id: 'plan_creator_pro',
      slug: 'creator_pro',
      name: 'Creator Pro',
      description: 'Unlock verified badge, custom link-in-bio & AI growth tools',
      targetRole: 'creator',
      category: 'main',
      icon: 'Rocket',
      badge: 'MOST POPULAR',
      buttonText: 'Start Free Trial',
      sortOrder: 2,
      tierLevel: 2,
      priceMonthly: 499,
      priceAnnual: 4788, // ₹399/mo (Save 20%)
      priceMonthlyUsd: 19,
      priceAnnualUsd: 180, // $15/mo (Save 21%)
      featureList: [
        'Verified Blue Badge on Profile ⭐',
        'Unlimited Bio Links & Blocks',
        'Custom Bio Themes & CSS Styles',
        'Priority AI Script & Caption Generator',
        'Advanced Audience & Link Analytics',
        'Priority Support (24/7)',
      ],
      quotas: [
        { label: 'Active Services / Gigs', value: '15 Active' },
        { label: 'Media Cloud Storage', value: '50 GB' },
        { label: 'AI Script Generations', value: '100 / month' },
        { label: 'Daily Messages', value: '500 / day' },
      ],
      features: {
        verifiedBadge: true,
        customDomain: false,
        analyticsDashboard: true,
        prioritySupport: true,
        apiAccess: false,
        whiteLabel: false,
        teamCollaboration: false,
        advancedSeo: true,
        monetizationTools: true,
        brandDealCrm: false,
        customIntegrations: false,
        extra: { bioLinks: -1, theme: 'custom_css' },
      },
      limits: {
        maxStorageGb: 50,
        maxTeamMembers: 3,
        maxProjects: 15,
        maxAiGenerations: 100,
        maxMonthlyUploads: 200,
        maxBioPages: 5,
        maxCommunities: 5,
        apiRateLimitRpm: 120,
        supportResponseHrs: 24,
        extra: { maxDailyMessages: 500 },
      },
      entitlements: [
        { featureKey: 'verified_badge', isEnabled: true, limit: null },
        { featureKey: 'custom_themes', isEnabled: true, limit: null },
        { featureKey: 'ai_script_generator', isEnabled: true, limit: 100 },
        { featureKey: 'priority_support', isEnabled: true, limit: null },
      ],
    },
    {
      id: 'plan_creator_elite',
      slug: 'creator_elite',
      name: 'Creator Elite',
      description: 'Full custom domain, brand deal CRM & dedicated manager',
      targetRole: 'creator',
      category: 'main',
      icon: 'Crown',
      badge: 'VIP',
      buttonText: 'Start Free Trial',
      sortOrder: 3,
      tierLevel: 3,
      priceMonthly: 1499,
      priceAnnual: 14388, // ₹1199/mo (Save 20%)
      priceMonthlyUsd: 49,
      priceAnnualUsd: 468, // $39/mo (Save 20%)
      featureList: [
        'Everything in Creator Pro',
        'Custom Apex Domain (yourname.com)',
        'Brand Deal Sponsorship CRM',
        'VIP Collab Marketplace Priority',
        'Dedicated Creator Success Manager',
        'Early Access to Beta Monetization',
      ],
      quotas: [
        { label: 'Active Services / Gigs', value: '50 Active' },
        { label: 'Media Cloud Storage', value: '500 GB Vault' },
        { label: 'AI Script Generations', value: '1,000 / month' },
        { label: 'Daily Messages', value: 'Unlimited' },
      ],
      features: {
        verifiedBadge: true,
        customDomain: true,
        analyticsDashboard: true,
        prioritySupport: true,
        apiAccess: true,
        whiteLabel: true,
        teamCollaboration: true,
        advancedSeo: true,
        monetizationTools: true,
        brandDealCrm: true,
        customIntegrations: true,
        extra: { bioLinks: -1, apexDomain: true },
      },
      limits: {
        maxStorageGb: 500,
        maxTeamMembers: 10,
        maxProjects: 50,
        maxAiGenerations: 1000,
        maxMonthlyUploads: 1000,
        maxBioPages: 25,
        maxCommunities: 25,
        apiRateLimitRpm: 300,
        supportResponseHrs: 4,
        extra: { maxDailyMessages: -1 },
      },
      entitlements: [
        { featureKey: 'custom_domain', isEnabled: true, limit: null },
        { featureKey: 'brand_deal_crm', isEnabled: true, limit: null },
        { featureKey: 'ai_script_generator', isEnabled: true, limit: 1000 },
        { featureKey: 'dedicated_manager', isEnabled: true, limit: null },
      ],
    },

    // ── FREELANCER / VIDEO EDITOR PLANS ──
    {
      id: 'plan_editor_free',
      slug: 'editor_free',
      name: 'Freelancer Basic',
      description: 'Start offering creative services',
      targetRole: 'editor',
      category: 'main',
      icon: 'Scissors',
      badge: null,
      buttonText: 'Get Started Free',
      sortOrder: 1,
      tierLevel: 1,
      priceMonthly: 0,
      priceAnnual: 0,
      priceMonthlyUsd: 0,
      priceAnnualUsd: 0,
      featureList: [
        'Public Freelancer Portfolio',
        'Escrow Contract Protection',
        'Client Chat & Reviews',
        'Standard Project Workroom',
      ],
      quotas: [
        { label: 'Platform Escrow Fee', value: '10% Commission' },
        { label: 'Active Service Listings', value: '3 Active' },
        { label: 'Monthly Job Proposals', value: '5 Bids / month' },
        { label: 'Project Storage', value: '10 GB' },
      ],
      features: {
        verifiedBadge: false,
        customDomain: false,
        analyticsDashboard: true,
        prioritySupport: false,
        apiAccess: false,
        whiteLabel: false,
        teamCollaboration: false,
        advancedSeo: false,
        monetizationTools: true,
        brandDealCrm: false,
        customIntegrations: false,
        extra: { escrowFeePercent: 10 },
      },
      limits: {
        maxStorageGb: 10,
        maxTeamMembers: 1,
        maxProjects: 3,
        maxAiGenerations: 0,
        maxMonthlyUploads: 20,
        maxBioPages: 1,
        maxCommunities: 1,
        apiRateLimitRpm: 60,
        supportResponseHrs: 72,
        extra: { maxMonthlyBids: 5 },
      },
      entitlements: [
        { featureKey: 'portfolio', isEnabled: true, limit: null },
        { featureKey: 'escrow_protection', isEnabled: true, limit: null },
      ],
    },
    {
      id: 'plan_editor_pro',
      slug: 'editor_pro',
      name: 'Freelancer Pro',
      description: 'Lower fees & verified editor clout',
      targetRole: 'editor',
      category: 'main',
      icon: 'Zap',
      badge: 'MOST POPULAR',
      buttonText: 'Start Free Trial',
      sortOrder: 2,
      tierLevel: 2,
      priceMonthly: 399,
      priceAnnual: 3828, // ₹319/mo (Save 20%)
      priceMonthlyUsd: 15,
      priceAnnualUsd: 144, // $12/mo (Save 20%)
      featureList: [
        'Reduced 5% Platform Fee (Save 50%)',
        'Verified Creative Badge ⭐',
        'Priority Job Feed Alerts',
        'Client Contract GST Invoicing',
        'Custom Video Portfolio Embeds',
        'Priority Dispute Resolution',
      ],
      quotas: [
        { label: 'Platform Escrow Fee', value: '5% Commission' },
        { label: 'Active Service Listings', value: '15 Active' },
        { label: 'Monthly Job Proposals', value: '25 Bids / month' },
        { label: 'Project Storage', value: '100 GB' },
      ],
      features: {
        verifiedBadge: true,
        customDomain: false,
        analyticsDashboard: true,
        prioritySupport: true,
        apiAccess: false,
        whiteLabel: false,
        teamCollaboration: false,
        advancedSeo: true,
        monetizationTools: true,
        brandDealCrm: false,
        customIntegrations: false,
        extra: { escrowFeePercent: 5 },
      },
      limits: {
        maxStorageGb: 100,
        maxTeamMembers: 2,
        maxProjects: 15,
        maxAiGenerations: 50,
        maxMonthlyUploads: 100,
        maxBioPages: 3,
        maxCommunities: 3,
        apiRateLimitRpm: 120,
        supportResponseHrs: 24,
        extra: { maxMonthlyBids: 25 },
      },
      entitlements: [
        { featureKey: 'reduced_escrow_fee', isEnabled: true, limit: 5 },
        { featureKey: 'priority_job_feed', isEnabled: true, limit: null },
        { featureKey: 'client_gst_invoicing', isEnabled: true, limit: null },
      ],
    },
    {
      id: 'plan_editor_studio',
      slug: 'editor_studio',
      name: 'Studio Agency',
      description: '0% commission & multi-editor team',
      targetRole: 'editor',
      category: 'main',
      icon: 'Building2',
      badge: 'AGENCY VIP',
      buttonText: 'Start Free Trial',
      sortOrder: 3,
      tierLevel: 3,
      priceMonthly: 1199,
      priceAnnual: 11508, // ₹959/mo (Save 20%)
      priceMonthlyUsd: 39,
      priceAnnualUsd: 372, // $31/mo (Save 21%)
      featureList: [
        '0% Platform Commission on All Escrows 💰',
        'Unlimited Client Job Proposals',
        'Agency Multi-Editor Workspace Seats',
        'Direct Wire & Instant Payouts',
        'White-Label Client Invoices & Contracts',
        'Dedicated Account Manager',
      ],
      quotas: [
        { label: 'Platform Escrow Fee', value: '0% (Keep 100%)' },
        { label: 'Active Service Listings', value: '50 Active' },
        { label: 'Monthly Job Proposals', value: 'Unlimited Bids' },
        { label: 'Project Storage', value: '1 TB Vault' },
      ],
      features: {
        verifiedBadge: true,
        customDomain: true,
        analyticsDashboard: true,
        prioritySupport: true,
        apiAccess: true,
        whiteLabel: true,
        teamCollaboration: true,
        advancedSeo: true,
        monetizationTools: true,
        brandDealCrm: true,
        customIntegrations: true,
        extra: { escrowFeePercent: 0 },
      },
      limits: {
        maxStorageGb: 1000,
        maxTeamMembers: 10,
        maxProjects: 50,
        maxAiGenerations: 500,
        maxMonthlyUploads: 500,
        maxBioPages: 10,
        maxCommunities: 10,
        apiRateLimitRpm: 300,
        supportResponseHrs: 4,
        extra: { maxMonthlyBids: -1 },
      },
      entitlements: [
        { featureKey: 'zero_escrow_commission', isEnabled: true, limit: 0 },
        { featureKey: 'agency_team_seats', isEnabled: true, limit: 10 },
        { featureKey: 'video_vault_1tb', isEnabled: true, limit: null },
      ],
    },

    // ── BRAND HIRING PLANS ──
    {
      id: 'plan_brand_free',
      slug: 'brand_free',
      name: 'Brand Explorer',
      description: 'Explore creator marketplace',
      targetRole: 'brand',
      category: 'main',
      icon: 'Briefcase',
      badge: null,
      buttonText: 'Get Started Free',
      sortOrder: 1,
      tierLevel: 1,
      priceMonthly: 0,
      priceAnnual: 0,
      priceMonthlyUsd: 0,
      priceAnnualUsd: 0,
      featureList: [
        'Browse Verified Creator Catalog',
        'Direct Hire via Escrow Protection',
        'Standard Project Workroom',
        'Automated GST Receipts',
      ],
      quotas: [
        { label: 'Open Campaign Postings', value: '1 Active' },
        { label: 'Creator Discovery Searches', value: '50 / month' },
        { label: 'Workspace Team Seats', value: '1 Seat' },
      ],
      features: {
        verifiedBadge: false,
        customDomain: false,
        analyticsDashboard: true,
        prioritySupport: false,
        apiAccess: false,
        whiteLabel: false,
        teamCollaboration: false,
        advancedSeo: false,
        monetizationTools: false,
        brandDealCrm: false,
        customIntegrations: false,
        extra: { creatorDiscovery: true },
      },
      limits: {
        maxStorageGb: 10,
        maxTeamMembers: 1,
        maxProjects: 1,
        maxAiGenerations: 0,
        maxMonthlyUploads: 20,
        maxBioPages: 1,
        maxCommunities: 1,
        apiRateLimitRpm: 60,
        supportResponseHrs: 72,
        extra: { maxOpenCampaigns: 1 },
      },
      entitlements: [
        { featureKey: 'browse_creators', isEnabled: true, limit: null },
        { featureKey: 'escrow_hire', isEnabled: true, limit: null },
      ],
    },
    {
      id: 'plan_brand_starter',
      slug: 'brand_starter',
      name: 'Brand Starter',
      description: 'For growing brands & studios',
      targetRole: 'brand',
      category: 'main',
      icon: 'Rocket',
      badge: 'MOST POPULAR',
      buttonText: 'Start Free Trial',
      sortOrder: 2,
      tierLevel: 2,
      priceMonthly: 999,
      priceAnnual: 9588, // ₹799/mo (Save 20%)
      priceMonthlyUsd: 29,
      priceAnnualUsd: 276, // $23/mo (Save 21%)
      featureList: [
        'Verified Brand Badge ⭐',
        'Creator Discovery Search & Filters',
        'Fraud & Fake Engagement Detection AI',
        'Multi-Milestone Escrow Contracts',
        'Campaign Performance Tracking',
        'Priority Support (24/7)',
      ],
      quotas: [
        { label: 'Open Campaign Postings', value: '5 Active' },
        { label: 'Creator Discovery Searches', value: '500 / month' },
        { label: 'Workspace Team Seats', value: '3 Seats' },
      ],
      features: {
        verifiedBadge: true,
        customDomain: false,
        analyticsDashboard: true,
        prioritySupport: true,
        apiAccess: false,
        whiteLabel: false,
        teamCollaboration: true,
        advancedSeo: false,
        monetizationTools: false,
        brandDealCrm: true,
        customIntegrations: false,
        extra: { creatorDiscovery: true },
      },
      limits: {
        maxStorageGb: 100,
        maxTeamMembers: 3,
        maxProjects: 5,
        maxAiGenerations: 200,
        maxMonthlyUploads: 100,
        maxBioPages: 1,
        maxCommunities: 1,
        apiRateLimitRpm: 120,
        supportResponseHrs: 24,
        extra: { maxOpenCampaigns: 5 },
      },
      entitlements: [
        { featureKey: 'creator_discovery', isEnabled: true, limit: 500 },
        { featureKey: 'campaign_management', isEnabled: true, limit: 5 },
      ],
    },
    {
      id: 'plan_brand_scale',
      slug: 'brand_scale',
      name: 'Brand Scale',
      description: 'Unlimited campaigns & enterprise CRM',
      targetRole: 'brand',
      category: 'main',
      icon: 'Building2',
      badge: 'ENTERPRISE',
      buttonText: 'Contact Sales',
      sortOrder: 3,
      tierLevel: 3,
      priceMonthly: 2999,
      priceAnnual: 28788, // ₹2399/mo (Save 20%)
      priceMonthlyUsd: 89,
      priceAnnualUsd: 852, // $71/mo (Save 20%)
      featureList: [
        'Unlimited Campaign Postings',
        'Unlimited Creator Discovery Searches',
        'Full Creator Outreach CRM',
        'Bulk Escrow Payouts & Custom Milestones',
        'Custom Legal NDA & Contract Builder',
        'Dedicated Strategic Account Manager',
      ],
      quotas: [
        { label: 'Open Campaign Postings', value: 'Unlimited' },
        { label: 'Creator Discovery Searches', value: 'Unlimited' },
        { label: 'Workspace Team Seats', value: '15 Seats' },
      ],
      features: {
        verifiedBadge: true,
        customDomain: true,
        analyticsDashboard: true,
        prioritySupport: true,
        apiAccess: true,
        whiteLabel: true,
        teamCollaboration: true,
        advancedSeo: true,
        monetizationTools: false,
        brandDealCrm: true,
        customIntegrations: true,
        extra: { creatorDiscovery: true, fraudDetection: true },
      },
      limits: {
        maxStorageGb: 1000,
        maxTeamMembers: 15,
        maxProjects: 50,
        maxAiGenerations: 2000,
        maxMonthlyUploads: 1000,
        maxBioPages: 5,
        maxCommunities: 5,
        apiRateLimitRpm: 500,
        supportResponseHrs: 2,
        extra: { maxOpenCampaigns: -1 },
      },
      entitlements: [
        { featureKey: 'unlimited_discovery', isEnabled: true, limit: null },
        { featureKey: 'fraud_detection_analytics', isEnabled: true, limit: null },
        { featureKey: 'dedicated_account_manager', isEnabled: true, limit: null },
      ],
    },

    // ── COMMUNITY / SUPPORTER PLANS ──
    {
      id: 'plan_user_free',
      slug: 'user_free',
      name: 'Community Member',
      description: 'Follow and connect with creators',
      targetRole: 'user',
      category: 'main',
      icon: 'User',
      badge: null,
      buttonText: 'Join Free',
      sortOrder: 1,
      tierLevel: 1,
      priceMonthly: 0,
      priceAnnual: 0,
      priceMonthlyUsd: 0,
      priceAnnualUsd: 0,
      featureList: [
        'Follow Creators & Channels',
        'Public Community Feed & Posts',
        'Direct Messaging',
        'Standard Community Access',
      ],
      quotas: [
        { label: 'Daily Messages', value: '50 / day' },
        { label: 'Follow Limit', value: '200 Creators' },
      ],
      features: {
        verifiedBadge: false,
        customDomain: false,
        analyticsDashboard: false,
        prioritySupport: false,
        apiAccess: false,
        whiteLabel: false,
        teamCollaboration: false,
        advancedSeo: false,
        monetizationTools: false,
        brandDealCrm: false,
        customIntegrations: false,
        extra: { adFree: false },
      },
      limits: {
        maxStorageGb: 1,
        maxTeamMembers: 1,
        maxProjects: 1,
        maxAiGenerations: 0,
        maxMonthlyUploads: 10,
        maxBioPages: 1,
        maxCommunities: 5,
        apiRateLimitRpm: 60,
        supportResponseHrs: 72,
        extra: { maxDailyMessages: 50 },
      },
      entitlements: [
        { featureKey: 'community_access', isEnabled: true, limit: null },
      ],
    },
    {
      id: 'plan_user_supporter',
      slug: 'user_supporter',
      name: 'Supporter Pass',
      description: 'VIP creator clout & ad-free experience',
      targetRole: 'user',
      category: 'main',
      icon: 'Sparkles',
      badge: 'BEST VALUE',
      buttonText: 'Get Supporter Pass',
      sortOrder: 2,
      tierLevel: 2,
      priceMonthly: 99,
      priceAnnual: 948, // ₹79/mo (Save 20%)
      priceMonthlyUsd: 4,
      priceAnnualUsd: 36, // $3/mo (Save 25%)
      featureList: [
        '100% Ad-Free Experience Across SuviX',
        'Exclusive Supporter Badge on Profile ⭐',
        'VIP Community Chat Room Access',
        'Early Access to Creator Drops & Content',
        'Priority Direct Messaging to Creators',
        'Custom Profile Themes & Avatars',
      ],
      quotas: [
        { label: 'Daily Messages', value: '500 / day' },
        { label: 'Follow Limit', value: '1,000 Creators' },
      ],
      features: {
        verifiedBadge: false,
        customDomain: false,
        analyticsDashboard: false,
        prioritySupport: false,
        apiAccess: false,
        whiteLabel: false,
        teamCollaboration: false,
        advancedSeo: false,
        monetizationTools: false,
        brandDealCrm: false,
        customIntegrations: false,
        extra: { adFree: true, supporterBadge: true },
      },
      limits: {
        maxStorageGb: 5,
        maxTeamMembers: 1,
        maxProjects: 5,
        maxAiGenerations: 10,
        maxMonthlyUploads: 50,
        maxBioPages: 1,
        maxCommunities: 50,
        apiRateLimitRpm: 120,
        supportResponseHrs: 24,
        extra: { maxDailyMessages: 500 },
      },
      entitlements: [
        { featureKey: 'ad_free_browsing', isEnabled: true, limit: null },
        { featureKey: 'supporter_badge', isEnabled: true, limit: null },
        { featureKey: 'exclusive_chats', isEnabled: true, limit: null },
      ],
    },
  ];

  for (const item of plansData) {
    console.log(`📦 Seeding Plan: ${item.name} (${item.targetRole})...`);

    // 1. Upsert Root Plan
    const plan = await prisma.plan.upsert({
      where: { id: item.id },
      update: {
        name: item.name,
        slug: item.slug,
        description: item.description,
        targetRole: item.targetRole,
        category: item.category,
        icon: item.icon,
        sortOrder: item.sortOrder,
        isPublic: true,
      },
      create: {
        id: item.id,
        slug: item.slug,
        name: item.name,
        description: item.description,
        targetRole: item.targetRole,
        category: item.category,
        icon: item.icon,
        sortOrder: item.sortOrder,
        isPublic: true,
      },
    });

    // 2. Create Structured Features
    const features = await prisma.planFeatures.create({
      data: item.features,
    });

    // 3. Create Structured Limits
    const limits = await prisma.planLimits.create({
      data: item.limits,
    });

    // 4. Upsert Plan Version (v1)
    const version = await prisma.planVersion.upsert({
      where: {
        planId_versionNumber: {
          planId: plan.id,
          versionNumber: 1,
        },
      },
      update: {
        name: `${item.name} v1`,
        description: item.description,
        tierLevel: item.tierLevel,
        isLatest: true,
        effectiveFrom: new Date('2026-01-01'),
        featuresId: features.id,
        limitsId: limits.id,
      },
      create: {
        planId: plan.id,
        versionNumber: 1,
        name: `${item.name} v1`,
        description: item.description,
        tierLevel: item.tierLevel,
        isLatest: true,
        effectiveFrom: new Date('2026-01-01'),
        featuresId: features.id,
        limitsId: limits.id,
      },
    });

    // 5. Create Monthly Price (INR)
    await prisma.planPrice.create({
      data: {
        planVersionId: version.id,
        billingInterval: 'month',
        currency: 'INR',
        amount: item.priceMonthly,
        isTaxInclusive: true,
        taxRate: 18.0,
        trialDays: item.tierLevel > 1 ? 3 : 0,
        isActive: true,
      },
    });

    // 6. Create Annual Price (INR)
    if (item.priceAnnual > 0) {
      await prisma.planPrice.create({
        data: {
          planVersionId: version.id,
          billingInterval: 'year',
          currency: 'INR',
          amount: item.priceAnnual,
          isTaxInclusive: true,
          taxRate: 18.0,
          trialDays: 3,
          isActive: true,
        },
      });
    }

    // 7. Create USD Monthly & Annual Prices
    await prisma.planPrice.create({
      data: {
        planVersionId: version.id,
        billingInterval: 'month',
        currency: 'USD',
        amount: item.priceMonthlyUsd ?? 0,
        isTaxInclusive: true,
        taxRate: 0.0,
        trialDays: item.tierLevel > 1 ? 3 : 0,
        isActive: true,
      },
    });

    if ((item.priceAnnualUsd ?? 0) > 0) {
      await prisma.planPrice.create({
        data: {
          planVersionId: version.id,
          billingInterval: 'year',
          currency: 'USD',
          amount: item.priceAnnualUsd,
          isTaxInclusive: true,
          taxRate: 0.0,
          trialDays: 3,
          isActive: true,
        },
      });
    }

    // 8. Upsert Entitlements
    for (const ent of item.entitlements) {
      await prisma.planEntitlement.upsert({
        where: {
          planId_featureKey: {
            planId: plan.id,
            featureKey: ent.featureKey,
          },
        },
        update: {
          isEnabled: ent.isEnabled,
          limit: ent.limit,
        },
        create: {
          planId: plan.id,
          featureKey: ent.featureKey,
          isEnabled: ent.isEnabled,
          limit: ent.limit,
        },
      });
    }

    // 9. Upsert into subscription_plans table (Java Entity & Supabase Table)
    // Packages rich SDUI presentation manifest alongside technical flags
    const sduiFeaturesPayload = {
      list: item.featureList,
      flags: item.features,
      icon: item.icon,
      buttonText: item.buttonText,
    };

    const sduiLimitsPayload = {
      quotas: item.quotas,
      raw: item.limits,
    };

    await prisma.$executeRawUnsafe(
      `INSERT INTO subscription_plans (
        id, name, description, tier_level, billing_interval,
        price_monthly, price_annual, price_monthly_usd, price_annual_usd,
        features, limits,
        display_order, is_popular, badge, is_active, target_role,
        created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10::jsonb, $11::jsonb, $12, $13, $14, $15, $16, NOW(), NOW()
      ) ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        description = EXCLUDED.description,
        tier_level = EXCLUDED.tier_level,
        billing_interval = EXCLUDED.billing_interval,
        price_monthly = EXCLUDED.price_monthly,
        price_annual = EXCLUDED.price_annual,
        price_monthly_usd = EXCLUDED.price_monthly_usd,
        price_annual_usd = EXCLUDED.price_annual_usd,
        features = EXCLUDED.features,
        limits = EXCLUDED.limits,
        display_order = EXCLUDED.display_order,
        is_popular = EXCLUDED.is_popular,
        badge = EXCLUDED.badge,
        is_active = EXCLUDED.is_active,
        target_role = EXCLUDED.target_role,
        updated_at = NOW();`,
      item.id,
      item.name,
      item.description,
      item.tierLevel,
      'month',
      item.priceMonthly,
      item.priceAnnual,
      item.priceMonthlyUsd ?? 0,
      item.priceAnnualUsd ?? 0,
      JSON.stringify(sduiFeaturesPayload),
      JSON.stringify(sduiLimitsPayload),
      item.sortOrder,
      item.tierLevel === 2,
      item.badge,
      true,
      item.targetRole
    );
  }

  // 8. SEED CANONICAL PROMOTIONAL COUPONS
  console.log('🎟️ Seeding Canonical Promotional Coupons...');
  const coupons = [
    { code: 'CREATOR20', discountType: 'percentage', discountValue: 20, maxRedemptions: 10000 },
    { code: 'SUVI20', discountType: 'percentage', discountValue: 20, maxRedemptions: 10000 },
    { code: 'LAUNCH50', discountType: 'percentage', discountValue: 50, maxRedemptions: 1000 },
    { code: 'SUVIPRO', discountType: 'percentage', discountValue: 15, maxRedemptions: 5000 },
  ];

  for (const c of coupons) {
    await prisma.coupon.upsert({
      where: { code: c.code },
      update: {
        discountType: c.discountType,
        discountValue: c.discountValue,
        maxRedemptions: c.maxRedemptions,
        isActive: true,
      },
      create: {
        code: c.code,
        discountType: c.discountType,
        discountValue: c.discountValue,
        maxRedemptions: c.maxRedemptions,
        currency: 'INR',
        isActive: true,
      },
    });
  }

  console.log('✅ Enterprise Subscription Plans Seeding Completed Successfully!');
}

seedEnterprisePlans()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
