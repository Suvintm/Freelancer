package com.suvix.payment.domain.subscription.controller;

import com.suvix.payment.domain.subscription.entity.SubscriptionPlan;
import com.suvix.payment.domain.subscription.dto.request.CancelSubscriptionRequest;
import com.suvix.payment.domain.subscription.dto.request.CreateSubscriptionRequest;
import com.suvix.payment.domain.subscription.dto.response.PlanFeatureResponse;
import com.suvix.payment.domain.subscription.dto.response.SubscriptionResponse;
import com.suvix.payment.domain.subscription.service.SubscriptionService;
import com.suvix.payment.domain.subscription.service.PlanFeatureResolver;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/v1/subscriptions")
@RequiredArgsConstructor
public class SubscriptionController {

    private final SubscriptionService subscriptionService;
    private final PlanFeatureResolver featureResolver;
    private final com.suvix.payment.domain.subscription.service.FeatureEntitlementService entitlementService;
    private final com.suvix.payment.domain.subscription.service.SubscriptionTierTransitionService transitionService;
    private final com.suvix.payment.domain.subscription.service.UsageMeteringService usageMeteringService;

    @GetMapping("/plans")
    public ResponseEntity<List<SubscriptionPlan>> getPlans(
            @RequestParam(value = "role", required = false) String role
    ) {
        return ResponseEntity.ok(subscriptionService.getPlansByRole(role));
    }

    @GetMapping("/entitlements")
    public ResponseEntity<com.suvix.payment.domain.subscription.dto.response.PlanEntitlements> getEntitlements(
            @RequestHeader(value = "X-User-Id", required = false) String headerUserId,
            @RequestParam(value = "userId", required = false) String paramUserId
    ) {
        String userId = (headerUserId != null && !headerUserId.isBlank()) ? headerUserId : paramUserId;
        if (userId == null || userId.isBlank()) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.ok(entitlementService.getEntitlements(userId));
    }

    @GetMapping("/quote-upgrade")
    public ResponseEntity<com.suvix.payment.domain.subscription.dto.response.ProrationCalculationResult> quoteUpgrade(
            @RequestParam("targetPlanId") String targetPlanId,
            @RequestHeader("X-User-Id") String userId
    ) {
        return ResponseEntity.ok(transitionService.quoteUpgrade(userId, targetPlanId));
    }

    @PostMapping("/upgrade")
    public ResponseEntity<SubscriptionResponse> upgradeSubscription(
            @Valid @RequestBody com.suvix.payment.domain.subscription.dto.request.UpgradeSubscriptionRequest request,
            @RequestHeader("X-User-Id") String userId
    ) {
        return ResponseEntity.ok(transitionService.upgradeSubscription(userId, request));
    }

    @PostMapping("/downgrade")
    public ResponseEntity<Map<String, Object>> downgradeSubscription(
            @Valid @RequestBody com.suvix.payment.domain.subscription.dto.request.DowngradeSubscriptionRequest request,
            @RequestHeader("X-User-Id") String userId
    ) {
        return ResponseEntity.ok(transitionService.scheduleDowngrade(userId, request));
    }

    @PostMapping("/pause")
    public ResponseEntity<Map<String, Object>> pauseSubscription(
            @Valid @RequestBody com.suvix.payment.domain.subscription.dto.request.PauseSubscriptionRequest request,
            @RequestHeader("X-User-Id") String userId
    ) {
        return ResponseEntity.ok(transitionService.pauseSubscription(userId, request));
    }

    @PostMapping("/resume")
    public ResponseEntity<SubscriptionResponse> resumeSubscription(
            @RequestHeader("X-User-Id") String userId
    ) {
        return ResponseEntity.ok(transitionService.resumeSubscription(userId));
    }

    @PostMapping("/consume-quota")
    public ResponseEntity<com.suvix.payment.domain.subscription.dto.response.QuotaConsumptionResult> consumeQuota(
            @Valid @RequestBody com.suvix.payment.domain.subscription.dto.request.ConsumeQuotaRequest request,
            @RequestHeader(value = "X-User-Id", required = false) String headerUserId,
            @RequestParam(value = "userId", required = false) String paramUserId
    ) {
        String userId = (headerUserId != null && !headerUserId.isBlank()) ? headerUserId : paramUserId;
        if (userId == null || userId.isBlank()) {
            return ResponseEntity.badRequest().build();
        }
        com.suvix.payment.domain.subscription.dto.response.QuotaConsumptionResult result =
                usageMeteringService.consumeQuota(userId, request);

        if (!result.isAllowed()) {
            return ResponseEntity.status(429).body(result);
        }
        return ResponseEntity.ok(result);
    }

    @GetMapping("/usage-summary")
    public ResponseEntity<com.suvix.payment.domain.subscription.dto.response.UsageSummaryResponse> getUsageSummary(
            @RequestHeader(value = "X-User-Id", required = false) String headerUserId,
            @RequestParam(value = "userId", required = false) String paramUserId
    ) {
        String userId = (headerUserId != null && !headerUserId.isBlank()) ? headerUserId : paramUserId;
        if (userId == null || userId.isBlank()) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.ok(usageMeteringService.getUsageSummary(userId));
    }

    @PostMapping("/create")
    public ResponseEntity<SubscriptionResponse> createSubscription(
            @Valid @RequestBody CreateSubscriptionRequest request,
            @RequestHeader("X-User-Id") String userId
    ) throws Exception {
        return ResponseEntity.ok(subscriptionService.createSubscription(request, userId));
    }

    @PostMapping("/cancel")
    public ResponseEntity<SubscriptionResponse> cancelSubscription(
            @Valid @RequestBody CancelSubscriptionRequest request,
            @RequestHeader("X-User-Id") String userId
    ) throws Exception {
        return ResponseEntity.ok(subscriptionService.cancelSubscription(request, userId));
    }

    /**
     * Sub-millisecond feature gate endpoint (called by Node.js or Gateway)
     */
    @GetMapping("/resolve-feature")
    public ResponseEntity<PlanFeatureResponse> resolveFeature(
            @RequestParam("userId") String userId,
            @RequestParam("feature") String feature
    ) {
        return ResponseEntity.ok(featureResolver.resolveFeature(userId, feature));
    }

    @GetMapping("/check-feature")
    public ResponseEntity<Map<String, Object>> checkFeature(
            @RequestParam("userId") String userId,
            @RequestParam("feature") String feature
    ) {
        boolean allowed = entitlementService.hasFeature(userId, feature);
        int remainingQuota = entitlementService.getRemainingQuota(userId, feature);
        return ResponseEntity.ok(Map.of(
                "userId", userId,
                "feature", feature,
                "allowed", allowed,
                "remainingQuota", remainingQuota
        ));
    }
}
