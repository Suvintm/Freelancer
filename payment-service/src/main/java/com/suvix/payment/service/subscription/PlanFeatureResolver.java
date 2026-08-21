package com.suvix.payment.service.subscription;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.suvix.payment.domain.Subscription;
import com.suvix.payment.domain.SubscriptionPlan;
import com.suvix.payment.dto.response.PlanFeatureResponse;
import com.suvix.payment.redis.RedisService;
import com.suvix.payment.repository.SubscriptionPlanRepository;
import com.suvix.payment.repository.SubscriptionRepository;
import com.suvix.payment.repository.UsageTrackingRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class PlanFeatureResolver {

    private final RedisService redisService;
    private final SubscriptionRepository subscriptionRepository;
    private final SubscriptionPlanRepository planRepository;
    private final UsageTrackingRepository usageRepository;
    private final ObjectMapper objectMapper;

    public PlanFeatureResponse resolveFeature(String userId, String feature) {
        String cacheKey = "user:" + userId + ":feature:" + feature;
        String cached = redisService.get(cacheKey);

        if (cached != null) {
            boolean allowed = "true".equalsIgnoreCase(cached);
            return PlanFeatureResponse.builder()
                    .userId(userId)
                    .feature(feature)
                    .allowed(allowed)
                    .quotaRemaining(allowed ? 100 : 0)
                    .build();
        }

        // Fetch active user subscription or default to Free Plan
        Optional<Subscription> activeSub = subscriptionRepository.findFirstByUserIdAndStatusOrderByCreatedAtDesc(
                userId, Subscription.SubscriptionStatus.active
        );

        SubscriptionPlan plan = activeSub
                .map(Subscription::getPlan)
                .orElseGet(() -> planRepository.findById("plan_free").orElse(null));

        if (plan == null) {
            return PlanFeatureResponse.builder()
                    .userId(userId)
                    .feature(feature)
                    .allowed(false)
                    .quotaRemaining(0)
                    .requiredPlan("plan_pro_monthly")
                    .upgradeUrl("/pricing")
                    .build();
        }

        boolean allowed = checkFeatureInPlan(plan, feature);
        int quotaRemaining = calculateQuota(userId, plan, feature);

        // Cache in Redis for 5 minutes (300 seconds)
        redisService.setex(cacheKey, allowed ? "true" : "false", 300);

        return PlanFeatureResponse.builder()
                .userId(userId)
                .planId(plan.getId())
                .planName(plan.getName())
                .feature(feature)
                .allowed(allowed && quotaRemaining > 0)
                .quotaRemaining(quotaRemaining)
                .requiredPlan(allowed ? plan.getId() : "plan_pro_monthly")
                .upgradeUrl("/pricing")
                .build();
    }

    private boolean checkFeatureInPlan(SubscriptionPlan plan, String feature) {
        try {
            JsonNode root = objectMapper.readTree(plan.getFeatures());
            // Check top level or nested feature nodes
            if (root.has(feature) && root.get(feature).asBoolean(false)) {
                return true;
            }
            for (JsonNode section : root) {
                if (section.has(feature) && section.get(feature).asBoolean(false)) {
                    return true;
                }
            }
            return false;
        } catch (Exception e) {
            log.error("Failed to parse plan features JSON", e);
            return false;
        }
    }

    private int calculateQuota(String userId, SubscriptionPlan plan, String feature) {
        String currentMonth = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyy-MM"));
        int used = usageRepository.findByUserIdAndFeatureNameAndUsagePeriod(userId, feature, currentMonth)
                .map(u -> u.getUsageCount())
                .orElse(0);

        try {
            JsonNode root = objectMapper.readTree(plan.getFeatures());
            for (JsonNode section : root) {
                if (section.has("max_" + feature + "_per_month")) {
                    int max = section.get("max_" + feature + "_per_month").asInt(100);
                    return Math.max(0, max - used);
                }
            }
        } catch (Exception ignored) {}

        return 999; // Default unlimited
    }
}
