package com.suvix.payment.domain.subscription.service;

import com.suvix.payment.domain.subscription.dto.request.ConsumeQuotaRequest;
import com.suvix.payment.domain.subscription.dto.response.PlanEntitlements;
import com.suvix.payment.domain.subscription.dto.response.QuotaConsumptionResult;
import com.suvix.payment.domain.subscription.dto.response.UsageSummaryResponse;
import com.suvix.payment.domain.subscription.entity.Subscription;
import com.suvix.payment.domain.subscription.entity.SubscriptionPlan;
import com.suvix.payment.domain.subscription.entity.UsageTracking;
import com.suvix.payment.domain.subscription.repository.SubscriptionRepository;
import com.suvix.payment.domain.subscription.repository.UsageTrackingRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.script.DefaultRedisScript;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.concurrent.TimeUnit;

@Slf4j
@Service
@RequiredArgsConstructor
public class UsageMeteringService {

    private final StringRedisTemplate stringRedisTemplate;
    private final UsageTrackingRepository usageTrackingRepository;
    private final SubscriptionRepository subscriptionRepository;
    private final FeatureEntitlementService entitlementService;

    private static final String USAGE_KEY_PATTERN = "usage:%s:%s:%s"; // usage:{userId}:{feature}:{period}
    private static final String DIRTY_KEYS_SET = "usage:dirty:keys";
    private static final DateTimeFormatter PERIOD_FORMAT = DateTimeFormatter.ofPattern("yyyy-MM");

    // Atomic Lua Script: Checks limit and increments atomically if allowed
    private static final String ATOMIC_CONSUME_LUA =
            "local usageKey = KEYS[1]\n" +
            "local dirtyKey = KEYS[2]\n" +
            "local cost = tonumber(ARGV[1])\n" +
            "local limit = tonumber(ARGV[2])\n" +
            "local allowOverage = tonumber(ARGV[3])\n" +
            "local current = tonumber(redis.call('get', usageKey) or '0')\n" +
            "if allowOverage == 1 or (current + cost <= limit) then\n" +
            "    local newUsage = redis.call('incrby', usageKey, cost)\n" +
            "    redis.call('sadd', dirtyKey, usageKey)\n" +
            "    return {1, newUsage}\n" +
            "else\n" +
            "    return {0, current}\n" +
            "end";

    /**
     * Atomically consumes quota for a feature in sub-2ms
     */
    public QuotaConsumptionResult consumeQuota(String userId, ConsumeQuotaRequest request) {
        String period = YearMonth.now().format(PERIOD_FORMAT);
        String feature = request.getFeatureName();
        int cost = Math.max(1, request.getUnits());
        boolean allowOverage = "SOFT_OVERAGE".equalsIgnoreCase(request.getMode());

        PlanEntitlements entitlements = entitlementService.getEntitlements(userId);
        Integer configuredLimit = (entitlements.getLimits() != null) ? entitlements.getLimits().get(feature) : null;

        // 1. Unlimited feature case (-1 or null limit)
        if (configuredLimit == null || configuredLimit < 0) {
            return QuotaConsumptionResult.builder()
                    .allowed(true)
                    .featureName(feature)
                    .consumedUnits(cost)
                    .currentUsage(0)
                    .maxLimit(-1)
                    .remainingQuota(-1)
                    .isOverage(false)
                    .overageUnits(0)
                    .usagePeriod(period)
                    .message("Unlimited feature access granted")
                    .build();
        }

        // 2. Feature not allowed on current plan (limit == 0)
        if (configuredLimit == 0) {
            return QuotaConsumptionResult.builder()
                    .allowed(false)
                    .featureName(feature)
                    .consumedUnits(0)
                    .currentUsage(0)
                    .maxLimit(0)
                    .remainingQuota(0)
                    .isOverage(false)
                    .overageUnits(0)
                    .usagePeriod(period)
                    .message("Feature [" + feature + "] is not included in your current plan (" + entitlements.getTier() + "). Upgrade to unlock.")
                    .build();
        }

        // 3. Atomic Redis Check-And-Consume via Lua Script
        String usageKey = String.format(USAGE_KEY_PATTERN, userId, feature, period);
        hydrateRedisIfKeyAbsent(userId, feature, period, usageKey);

        DefaultRedisScript<List> script = new DefaultRedisScript<>(ATOMIC_CONSUME_LUA, List.class);
        List<Object> result = stringRedisTemplate.execute(
                script,
                List.of(usageKey, DIRTY_KEYS_SET),
                String.valueOf(cost),
                String.valueOf(configuredLimit),
                allowOverage ? "1" : "0"
        );

        long allowedFlag = ((Number) result.get(0)).longValue();
        int currentUsage = ((Number) result.get(1)).intValue();

        boolean allowed = (allowedFlag == 1);
        int remainingQuota = Math.max(0, configuredLimit - currentUsage);
        boolean isOverage = (currentUsage > configuredLimit);
        int overageUnits = Math.max(0, currentUsage - configuredLimit);

        String message = allowed
                ? (isOverage ? "Quota consumed with overage applied" : "Quota consumed successfully")
                : "Quota limit reached (" + currentUsage + "/" + configuredLimit + " used). Upgrade your plan for higher limits.";

        return QuotaConsumptionResult.builder()
                .allowed(allowed)
                .featureName(feature)
                .consumedUnits(allowed ? cost : 0)
                .currentUsage(currentUsage)
                .maxLimit(configuredLimit)
                .remainingQuota(remainingQuota)
                .isOverage(isOverage)
                .overageUnits(overageUnits)
                .usagePeriod(period)
                .message(message)
                .build();
    }

    /**
     * Live usage summary dashboard data for user
     */
    public UsageSummaryResponse getUsageSummary(String userId) {
        String period = YearMonth.now().format(PERIOD_FORMAT);
        PlanEntitlements entitlements = entitlementService.getEntitlements(userId);
        Optional<Subscription> subOpt = subscriptionRepository.findActiveByUserId(userId);

        Instant periodResetAt = subOpt.map(Subscription::getCurrentPeriodEnd).orElse(null);

        Map<String, UsageSummaryResponse.FeatureUsageDetail> details = new HashMap<>();

        if (entitlements.getLimits() != null) {
            for (Map.Entry<String, Integer> entry : entitlements.getLimits().entrySet()) {
                String feat = entry.getKey();
                int limit = entry.getValue();

                int currentUsage = getCurrentUsageCount(userId, feat, period);
                boolean unlimited = (limit < 0);
                int remaining = unlimited ? -1 : Math.max(0, limit - currentUsage);
                double percentage = unlimited ? 0.0 : (limit > 0 ? ((double) currentUsage / limit) * 100.0 : 100.0);
                boolean isOverage = (limit > 0 && currentUsage > limit);
                int overageUnits = Math.max(0, currentUsage - limit);

                details.put(feat, UsageSummaryResponse.FeatureUsageDetail.builder()
                        .featureName(feat)
                        .currentUsage(currentUsage)
                        .maxLimit(limit)
                        .remainingQuota(remaining)
                        .usagePercentage(Math.min(100.0, Math.round(percentage * 10.0) / 10.0))
                        .isUnlimited(unlimited)
                        .isOverage(isOverage)
                        .overageUnits(overageUnits)
                        .build());
            }
        }

        return UsageSummaryResponse.builder()
                .userId(userId)
                .planId(entitlements.getTier())
                .planName(entitlements.getTier())
                .usagePeriod(period)
                .periodResetAt(periodResetAt)
                .featureUsages(details)
                .build();
    }

    private int getCurrentUsageCount(String userId, String feature, String period) {
        String usageKey = String.format(USAGE_KEY_PATTERN, userId, feature, period);
        String val = stringRedisTemplate.opsForValue().get(usageKey);
        if (val != null) {
            try {
                return Integer.parseInt(val);
            } catch (NumberFormatException ignored) {}
        }

        // Fallback to DB
        return usageTrackingRepository.findByUserIdAndFeatureNameAndUsagePeriod(userId, feature, period)
                .map(UsageTracking::getUsageCount)
                .orElse(0);
    }

    private void hydrateRedisIfKeyAbsent(String userId, String feature, String period, String usageKey) {
        if (Boolean.FALSE.equals(stringRedisTemplate.hasKey(usageKey))) {
            int dbCount = usageTrackingRepository.findByUserIdAndFeatureNameAndUsagePeriod(userId, feature, period)
                    .map(UsageTracking::getUsageCount)
                    .orElse(0);

            stringRedisTemplate.opsForValue().set(usageKey, String.valueOf(dbCount), 35, TimeUnit.DAYS);
        }
    }
}