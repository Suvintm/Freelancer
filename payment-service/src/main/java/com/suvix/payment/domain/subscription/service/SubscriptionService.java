package com.suvix.payment.domain.subscription.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.suvix.payment.domain.subscription.dto.request.CancelSubscriptionRequest;
import com.suvix.payment.domain.subscription.dto.request.CreateSubscriptionRequest;
import com.suvix.payment.domain.subscription.dto.response.PlanCatalogResponse;
import com.suvix.payment.domain.subscription.dto.response.PlanPresenterDto;
import com.suvix.payment.domain.subscription.dto.response.SubscriptionDashboardResponse;
import com.suvix.payment.domain.subscription.dto.response.SubscriptionResponse;
import com.suvix.payment.domain.subscription.entity.Subscription;
import com.suvix.payment.domain.subscription.entity.SubscriptionPlan;
import com.suvix.payment.domain.subscription.repository.SubscriptionPlanRepository;
import com.suvix.payment.domain.subscription.repository.SubscriptionRepository;
import com.suvix.payment.domain.payment.service.provider.PaymentProvider;
import com.suvix.payment.domain.payment.service.provider.PaymentProviderFactory;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.*;
import org.springframework.data.redis.core.StringRedisTemplate;
import java.time.Duration;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class SubscriptionService {

    private final SubscriptionRepository subscriptionRepository;
    private final SubscriptionPlanRepository planRepository;
    private final PaymentProviderFactory providerFactory;
    private final ObjectMapper objectMapper;
    private final StringRedisTemplate redisTemplate;

    public List<SubscriptionPlan> getAllActivePlans() {
        return planRepository.findByIsActiveTrueOrderByTierLevelAsc();
    }

    public List<SubscriptionPlan> getPlansByRole(String role) {
        if (role == null || role.isBlank() || "all".equalsIgnoreCase(role)) {
            return planRepository.findByIsActiveTrueOrderByTierLevelAsc();
        }
        List<String> roles = List.of(role.toLowerCase(), "all");
        List<SubscriptionPlan> rolePlans = planRepository.findByIsActiveTrueAndTargetRoleInOrderByTierLevelAsc(roles);
        if (rolePlans.isEmpty()) {
            return planRepository.findByIsActiveTrueOrderByTierLevelAsc();
        }
        return rolePlans;
    }

    /**
     * Enterprise Server-Driven UI (SDUI) Plan Presentation Catalog with multi-tier Redis caching
     */
    public PlanCatalogResponse getPlanCatalog(String role, String currency) {
        String targetRole = (role != null && !role.isBlank()) ? role.toLowerCase() : "all";
        String targetCurrency = (currency != null && !currency.isBlank()) ? currency.toUpperCase() : "INR";

        System.out.println("  ┌────────────────────────────────────────────────────────┐");
        System.out.println("  │ 📦 [SubscriptionService] getPlanCatalog()               │");
        System.out.println("  │ Target Role: " + String.format("%-10s", targetRole) + " | Currency: " + String.format("%-4s", targetCurrency) + "            │");
        System.out.println("  └────────────────────────────────────────────────────────┘");

        String cacheKey = "plans:catalog:" + targetRole + ":" + targetCurrency;
        if (redisTemplate != null) {
            try {
                String cachedJson = redisTemplate.opsForValue().get(cacheKey);
                if (cachedJson != null && !cachedJson.isBlank()) {
                    System.out.println("  ⚡ [Redis Cache HIT] Key: " + cacheKey);
                    return objectMapper.readValue(cachedJson, PlanCatalogResponse.class);
                } else {
                    System.out.println("  🔄 [Redis Cache MISS] Key: " + cacheKey + " -> Querying Database");
                }
            } catch (Exception e) {
                log.warn("Redis catalog cache read failed: {}", e.getMessage());
                System.out.println("  ⚠️ [Redis Cache Offline] Proceeding with direct DB query");
            }
        }

        List<SubscriptionPlan> plans = getPlansByRole(targetRole);
        System.out.println("  📋 [Database Query] Retrieved " + plans.size() + " active plans from 'subscription_plans' table.");

        List<PlanPresenterDto> presenterDtos = plans.stream().map(plan -> {
            List<String> featureList = new ArrayList<>();
            List<Map<String, String>> quotaList = new ArrayList<>();
            Map<String, Object> featureFlagsMap = new HashMap<>();
            Map<String, Object> limitValuesMap = new HashMap<>();
            String icon = plan.getTierLevel() == 1 ? "Send" : (plan.getTierLevel() == 2 ? "Rocket" : "Crown");
            String buttonText = plan.getTierLevel() == 1 ? "Get Started Free" : "Start Free Trial";

            try {
                if (plan.getFeatures() != null && !plan.getFeatures().isBlank()) {
                    JsonNode rootFeatures = objectMapper.readTree(plan.getFeatures());
                    if (rootFeatures.isObject()) {
                        // Check if rich SDUI manifest format { list: [...], flags: {...}, icon: "...", buttonText: "..." }
                        if (rootFeatures.has("list") && rootFeatures.get("list").isArray()) {
                            for (JsonNode item : rootFeatures.get("list")) {
                                featureList.add(item.asText());
                            }
                        }
                        if (rootFeatures.has("icon") && !rootFeatures.get("icon").asText().isBlank()) {
                            icon = rootFeatures.get("icon").asText();
                        }
                        if (rootFeatures.has("buttonText") && !rootFeatures.get("buttonText").asText().isBlank()) {
                            buttonText = rootFeatures.get("buttonText").asText();
                        }
                        if (rootFeatures.has("flags") && rootFeatures.get("flags").isObject()) {
                            featureFlagsMap = objectMapper.convertValue(rootFeatures.get("flags"), Map.class);
                        } else {
                            featureFlagsMap = objectMapper.convertValue(rootFeatures, Map.class);
                        }
                    } else if (rootFeatures.isArray()) {
                        for (JsonNode item : rootFeatures) {
                            featureList.add(item.asText());
                        }
                    }
                }
            } catch (Exception e) {
                log.warn("Failed to parse features for plan {}: {}", plan.getId(), e.getMessage());
            }

            try {
                if (plan.getLimits() != null && !plan.getLimits().isBlank()) {
                    JsonNode rootLimits = objectMapper.readTree(plan.getLimits());
                    if (rootLimits.isObject()) {
                        if (rootLimits.has("quotas") && rootLimits.get("quotas").isArray()) {
                            for (JsonNode qNode : rootLimits.get("quotas")) {
                                if (qNode.has("label") && qNode.has("value")) {
                                    quotaList.add(Map.of(
                                            "label", qNode.get("label").asText(),
                                            "value", qNode.get("value").asText()
                                    ));
                                }
                            }
                        }
                        if (rootLimits.has("raw") && rootLimits.get("raw").isObject()) {
                            limitValuesMap = objectMapper.convertValue(rootLimits.get("raw"), Map.class);
                        } else {
                            limitValuesMap = objectMapper.convertValue(rootLimits, Map.class);
                        }
                    }
                }
            } catch (Exception e) {
                log.warn("Failed to parse limits for plan {}: {}", plan.getId(), e.getMessage());
            }

            // Fallback for button text based on price
            if (plan.getPriceMonthly().compareTo(BigDecimal.valueOf(2500)) >= 0) {
                buttonText = "Contact Sales";
            } else if (plan.getTierLevel() == 1) {
                buttonText = "user".equalsIgnoreCase(plan.getTargetRole()) ? "Join Free" : "Get Started Free";
            }

            BigDecimal monthlyAmount = plan.getMonthlyPriceForCurrency(targetCurrency);
            BigDecimal annualAmount = plan.getAnnualPriceForCurrency(targetCurrency);
            if (annualAmount == null || annualAmount.compareTo(BigDecimal.ZERO) <= 0) {
                if (monthlyAmount.compareTo(BigDecimal.ZERO) > 0) {
                    annualAmount = monthlyAmount.multiply(BigDecimal.valueOf(12)).multiply(BigDecimal.valueOf(0.8)).setScale(2, RoundingMode.HALF_UP);
                } else {
                    annualAmount = BigDecimal.ZERO;
                }
            }

            boolean isUsd = "USD".equalsIgnoreCase(targetCurrency);
            BigDecimal gstRate = isUsd ? BigDecimal.ZERO : new BigDecimal("18.00");
            BigDecimal monthlyTotalWithTax = isUsd ? monthlyAmount : monthlyAmount.multiply(new BigDecimal("1.18")).setScale(2, RoundingMode.HALF_UP);
            BigDecimal annualTotalWithTax = isUsd ? annualAmount : annualAmount.multiply(new BigDecimal("1.18")).setScale(2, RoundingMode.HALF_UP);
            BigDecimal monthlyEquivalent = annualAmount.compareTo(BigDecimal.ZERO) > 0
                    ? annualAmount.divide(BigDecimal.valueOf(12), 2, RoundingMode.HALF_UP)
                    : BigDecimal.ZERO;

            Map<String, Object> monthlyPricing = Map.of(
                    "amount", monthlyAmount,
                    "currency", targetCurrency,
                    "taxRate", gstRate,
                    "taxInclusive", isUsd,
                    "totalWithTax", monthlyTotalWithTax
            );

            Map<String, Object> annualPricing = Map.of(
                    "amount", annualAmount,
                    "monthlyEquivalent", monthlyEquivalent,
                    "savingsPercent", 20,
                    "currency", targetCurrency,
                    "taxRate", gstRate,
                    "taxInclusive", isUsd,
                    "totalWithTax", annualTotalWithTax
            );

            Map<String, Object> pricing = Map.of(
                    "monthly", monthlyPricing,
                    "annual", annualPricing
            );

            String currencySymbol = isUsd ? "$" : "₹";
            System.out.println("     • Plan: [" + plan.getId() + "] " + plan.getName()
                    + " | Monthly: " + currencySymbol + monthlyAmount + " (" + currencySymbol + monthlyTotalWithTax + (isUsd ? "" : " incl. GST") + ")"
                    + " | Annual: " + currencySymbol + annualAmount + " (" + currencySymbol + annualTotalWithTax + (isUsd ? "" : " incl. GST") + ")"
                    + " | Features: " + featureList.size());

            return PlanPresenterDto.builder()
                    .id(plan.getId())
                    .name(plan.getName())
                    .slug(plan.getId())
                    .description(plan.getDescription())
                    .subtitle(plan.getDescription())
                    .targetRole(plan.getTargetRole())
                    .tierLevel(plan.getTierLevel())
                    .version(plan.getVersion())
                    .priceMonthly(monthlyAmount)
                    .priceAnnual(annualAmount)
                    .currency(targetCurrency)
                    .trialDays(plan.getTrialDays())
                    .isPopular(plan.isPopular())
                    .badge(plan.getBadge())
                    .icon(icon)
                    .buttonText(buttonText)
                    .isActive(plan.isActive())
                    .displayOrder(plan.getDisplayOrder())
                    .features(featureList)
                    .quotas(quotaList)
                    .featureFlags(featureFlagsMap)
                    .limitValues(limitValuesMap)
                    .pricing(pricing)
                    .build();
        }).collect(Collectors.toList());

        Map<String, Object> dataMap = Map.of(
                "role", targetRole,
                "currency", targetCurrency,
                "plans", presenterDtos
        );

        Map<String, Object> metaMap = Map.of(
                "cachedAt", Instant.now().toString(),
                "cacheTtl", 300
        );

        PlanCatalogResponse response = PlanCatalogResponse.builder()
                .success(true)
                .role(targetRole)
                .currency(targetCurrency)
                .plans(presenterDtos)
                .data(dataMap)
                .meta(metaMap)
                .build();

        if (redisTemplate != null) {
            try {
                redisTemplate.opsForValue().set(cacheKey, objectMapper.writeValueAsString(response), Duration.ofSeconds(300));
                System.out.println("  💾 [Redis Cache SET] Cached catalog for 300s under key: " + cacheKey);
            } catch (Exception e) {
                log.warn("Redis catalog cache write failed: {}", e.getMessage());
            }
        }

        return response;
    }

    /**
     * Single-Roundtrip Consolidated Subscription Dashboard Bootstrap
     * Aggregates Plan Catalog, Active Subscription, and Resource Telemetry
     */
    public SubscriptionDashboardResponse getDashboard(String userId, String role, String currency) {
        System.out.println("  ┌────────────────────────────────────────────────────────┐");
        System.out.println("  │ 📊 [SubscriptionService] getDashboard()                 │");
        System.out.println("  │ User: " + (userId != null ? userId : "Anonymous") + " | Role: " + role + " | Currency: " + currency);
        System.out.println("  └────────────────────────────────────────────────────────┘");

        PlanCatalogResponse catalog = getPlanCatalog(role, currency);
        SubscriptionResponse activeSub = null;
        Map<String, Object> usageSummary = new HashMap<>();

        if (userId != null && !userId.isBlank()) {
            try {
                Optional<Subscription> subOpt = subscriptionRepository.findActiveByUserId(userId);
                if (subOpt.isPresent()) {
                    activeSub = SubscriptionResponse.fromEntity(subOpt.get());
                    System.out.println("  ✅ Active Subscription Found: Plan=" + activeSub.getPlanId()
                            + " | Status=" + activeSub.getStatus()
                            + " | ValidUntil=" + activeSub.getCurrentPeriodEnd());
                } else {
                    System.out.println("  ℹ️ No active paid subscription found for user: " + userId + " (Defaulting to Free Tier)");
                }
            } catch (Exception e) {
                log.warn("Failed to fetch active subscription for dashboard: {}", e.getMessage());
            }
        }

        return SubscriptionDashboardResponse.builder()
                .success(true)
                .role(catalog.getRole())
                .currency(catalog.getCurrency())
                .plans(catalog.getPlans())
                .activeSubscription(activeSub)
                .usageSummary(usageSummary)
                .meta(Map.of("cachedAt", Instant.now().toString()))
                .build();
    }

    @Transactional
    public SubscriptionResponse createSubscription(CreateSubscriptionRequest request, String userId) throws Exception {
        SubscriptionPlan plan = planRepository.findById(request.getPlanId())
                .orElseThrow(() -> new IllegalArgumentException("Plan not found: " + request.getPlanId()));

        PaymentProvider provider = providerFactory.getProvider(request.getProvider());
        SubscriptionResponse providerResponse = provider.createSubscription(request, plan, userId);

        Subscription subscription = Subscription.builder()
                .userId(userId)
                .plan(plan)
                .status(Subscription.SubscriptionStatus.active)
                .provider(Subscription.PaymentProvider.valueOf(request.getProvider().toLowerCase()))
                .providerSubscriptionId(providerResponse.getProviderSubscriptionId())
                .currentPeriodStart(providerResponse.getCurrentPeriodStart())
                .currentPeriodEnd(providerResponse.getCurrentPeriodEnd())
                .build();

        subscription = subscriptionRepository.save(subscription);
        providerResponse.setSubscriptionId(subscription.getId());

        return providerResponse;
    }

    @Transactional
    public SubscriptionResponse cancelSubscription(CancelSubscriptionRequest request, String userId) throws Exception {
        Subscription subscription = subscriptionRepository.findById(request.getSubscriptionId())
                .orElseThrow(() -> new IllegalArgumentException("Subscription not found: " + request.getSubscriptionId()));

        if (!subscription.getUserId().equals(userId)) {
            throw new IllegalAccessException("Unauthorized to cancel this subscription");
        }

        PaymentProvider provider = providerFactory.getProvider(subscription.getProvider().name());
        provider.cancelSubscription(subscription.getProviderSubscriptionId());

        if (request.isImmediate()) {
            subscription.setStatus(Subscription.SubscriptionStatus.cancelled);
            subscription.setEndedAt(Instant.now());
        } else {
            subscription.setCancelAtPeriodEnd(true);
        }
        subscription.setCancelledAt(Instant.now());
        subscriptionRepository.save(subscription);

        return SubscriptionResponse.builder()
                .success(true)
                .subscriptionId(subscription.getId())
                .planId(subscription.getPlan().getId())
                .status(subscription.getStatus().name())
                .cancelAtPeriodEnd(subscription.isCancelAtPeriodEnd())
                .message("Subscription cancelled successfully")
                .build();
    }
}
