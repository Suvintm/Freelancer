package com.suvix.payment.domain.subscription.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.suvix.payment.domain.subscription.dto.response.PlanEntitlements;
import com.suvix.payment.domain.subscription.entity.Subscription;
import com.suvix.payment.domain.subscription.entity.SubscriptionPlan;
import com.suvix.payment.domain.subscription.repository.SubscriptionPlanRepository;
import com.suvix.payment.domain.subscription.repository.SubscriptionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.Iterator;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.TimeUnit;

@Slf4j
@Service
@RequiredArgsConstructor
public class FeatureEntitlementService {

    private final StringRedisTemplate redisTemplate;
    private final SubscriptionRepository subscriptionRepository;
    private final SubscriptionPlanRepository planRepository;
    private final ObjectMapper objectMapper;

    private static final String ENTITLEMENTS_KEY = "subscription:%s:entitlements";
    private static final long CACHE_TTL_SECONDS = 300; // 5 minutes

    /**
     * Get user entitlements — sub-2ms when cached in Redis
     */
    public PlanEntitlements getEntitlements(String userId) {
        String key = String.format(ENTITLEMENTS_KEY, userId);

        // 1. Try Redis first
        try {
            String cached = redisTemplate.opsForValue().get(key);
            if (cached != null) {
                return objectMapper.readValue(cached, PlanEntitlements.class);
            }
        } catch (Exception e) {
            log.warn("Cache deserialization failed for user {}: {}", userId, e.getMessage());
            redisTemplate.delete(key);
        }

        // 2. Fallback to database
        PlanEntitlements entitlements = loadFromDatabase(userId);

        // 3. Write back to Redis
        try {
            String json = objectMapper.writeValueAsString(entitlements);
            redisTemplate.opsForValue().set(key, json, CACHE_TTL_SECONDS, TimeUnit.SECONDS);
        } catch (Exception e) {
            log.error("Failed to cache entitlements for user {}: {}", userId, e.getMessage());
        }

        return entitlements;
    }

    /**
     * Invalidate cache and publish Pub/Sub event when subscription changes
     */
    public void invalidateEntitlements(String userId) {
        String key = String.format(ENTITLEMENTS_KEY, userId);
        try {
            redisTemplate.delete(key);
            // Broadcast event so Node.js and peer services can clear in-memory caches
            String eventJson = String.format("{\"type\":\"ENTITLEMENTS_INVALIDATED\",\"userId\":\"%s\"}", userId);
            redisTemplate.convertAndSend("subscription:events", eventJson);
            log.info("Invalidated and broadcasted entitlements for user {}", userId);
        } catch (Exception e) {
            log.warn("Failed to invalidate entitlements for user {}: {}", userId, e.getMessage());
        }
    }

    /**
     * Check if user has a specific boolean feature
     */
    public boolean hasFeature(String userId, String featureName) {
        PlanEntitlements entitlements = getEntitlements(userId);
        if (entitlements == null || !entitlements.isHasActiveAccess()) {
            return false;
        }
        return Boolean.TRUE.equals(entitlements.getFeatures().get(featureName));
    }

    /**
     * Get remaining quota for a feature
     */
    public int getRemainingQuota(String userId, String featureName) {
        PlanEntitlements entitlements = getEntitlements(userId);
        if (entitlements == null) {
            return 0;
        }

        Integer limit = entitlements.getLimits().get(featureName);
        if (limit == null || limit == -1) {
            return Integer.MAX_VALUE; // Unlimited
        }

        String period = getCurrentPeriod();
        String usageKey = String.format("usage:%s:%s:%s", userId, featureName, period);

        try {
            String used = redisTemplate.opsForValue().get(usageKey);
            int usedCount = (used == null) ? 0 : Integer.parseInt(used);
            return Math.max(0, limit - usedCount);
        } catch (Exception e) {
            log.warn("Failed to read quota for user {} feature {}: {}", userId, featureName, e.getMessage());
            return limit;
        }
    }

    private PlanEntitlements loadFromDatabase(String userId) {
        Optional<Subscription> activeSubOpt = subscriptionRepository.findActiveByUserId(userId);

        if (activeSubOpt.isEmpty()) {
            // Default to Free Tier plan
            SubscriptionPlan freePlan = planRepository.findById("plan_free").orElse(null);
            return buildEntitlementsFromPlan(userId, freePlan, null, "free", 0, "active", true);
        }

        Subscription sub = activeSubOpt.get();
        SubscriptionPlan plan = sub.getPlan();
        boolean hasAccess = sub.hasActiveAccess();

        return buildEntitlementsFromPlan(
                userId,
                plan,
                sub,
                (plan != null) ? plan.getId() : "unknown",
                (plan != null) ? plan.getTierLevel() : 0,
                sub.getStatus().name(),
                hasAccess
        );
    }

    private PlanEntitlements buildEntitlementsFromPlan(
            String userId,
            SubscriptionPlan plan,
            Subscription sub,
            String tier,
            int tierLevel,
            String status,
            boolean hasAccess
    ) {
        Map<String, Boolean> featuresMap = new HashMap<>();
        Map<String, Integer> limitsMap = new HashMap<>();

        if (plan != null) {
            try {
                if (plan.getFeatures() != null && !plan.getFeatures().isBlank()) {
                    JsonNode fNode = objectMapper.readTree(plan.getFeatures());
                    flattenFeatures(fNode, "", featuresMap);
                }
                if (plan.getLimits() != null && !plan.getLimits().isBlank()) {
                    JsonNode lNode = objectMapper.readTree(plan.getLimits());
                    Iterator<Map.Entry<String, JsonNode>> fields = lNode.fields();
                    while (fields.hasNext()) {
                        Map.Entry<String, JsonNode> entry = fields.next();
                        if (entry.getValue().isInt() || entry.getValue().isLong()) {
                            limitsMap.put(entry.getKey(), entry.getValue().asInt());
                        }
                    }
                }
            } catch (Exception e) {
                log.warn("Error parsing features/limits for plan {}: {}", plan.getId(), e.getMessage());
            }
        }

        return PlanEntitlements.builder()
                .userId(userId)
                .tier(tier)
                .tierLevel(tierLevel)
                .status(status)
                .periodEnd(sub != null ? sub.getCurrentPeriodEnd() : null)
                .gracePeriodEndsAt(sub != null ? sub.getGracePeriodEndsAt() : null)
                .hasActiveAccess(hasAccess)
                .features(featuresMap)
                .limits(limitsMap)
                .build();
    }

    private void flattenFeatures(JsonNode node, String prefix, Map<String, Boolean> result) {
        if (node.isObject()) {
            Iterator<Map.Entry<String, JsonNode>> fields = node.fields();
            while (fields.hasNext()) {
                Map.Entry<String, JsonNode> entry = fields.next();
                String key = prefix.isEmpty() ? entry.getKey() : prefix + "." + entry.getKey();
                if (entry.getValue().isBoolean()) {
                    result.put(key, entry.getValue().asBoolean());
                    result.put(entry.getKey(), entry.getValue().asBoolean()); // also store unqualified key
                } else if (entry.getValue().isObject()) {
                    flattenFeatures(entry.getValue(), key, result);
                }
            }
        }
    }

    private String getCurrentPeriod() {
        return LocalDate.now().format(DateTimeFormatter.ofPattern("yyyy-MM"));
    }
}