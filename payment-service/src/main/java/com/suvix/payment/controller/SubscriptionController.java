package com.suvix.payment.controller;

import com.suvix.payment.domain.SubscriptionPlan;
import com.suvix.payment.dto.request.CancelSubscriptionRequest;
import com.suvix.payment.dto.request.CreateSubscriptionRequest;
import com.suvix.payment.dto.response.PlanFeatureResponse;
import com.suvix.payment.dto.response.SubscriptionResponse;
import com.suvix.payment.service.core.SubscriptionService;
import com.suvix.payment.service.subscription.PlanFeatureResolver;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/v1/subscriptions")
@RequiredArgsConstructor
public class SubscriptionController {

    private final SubscriptionService subscriptionService;
    private final PlanFeatureResolver featureResolver;

    @GetMapping("/plans")
    public ResponseEntity<List<SubscriptionPlan>> getPlans() {
        return ResponseEntity.ok(subscriptionService.getAllActivePlans());
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
}
