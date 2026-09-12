package com.suvix.payment.domain.subscription.controller;

import com.suvix.payment.domain.payment.dto.request.CreateOrderRequest;
import com.suvix.payment.domain.payment.dto.request.VerifyPaymentRequest;
import com.suvix.payment.domain.payment.dto.response.PaymentResponse;
import com.suvix.payment.domain.payment.service.PaymentService;
import com.suvix.payment.domain.subscription.dto.request.*;
import com.suvix.payment.domain.subscription.dto.response.*;
import com.suvix.payment.domain.subscription.entity.Subscription;
import com.suvix.payment.domain.subscription.entity.SubscriptionPlan;
import com.suvix.payment.domain.subscription.repository.SubscriptionRepository;
import com.suvix.payment.domain.subscription.service.*;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.CacheControl;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.concurrent.TimeUnit;

@Slf4j
@RestController
@RequestMapping("/api/v1/subscriptions")
@RequiredArgsConstructor
public class SubscriptionController {

    private final SubscriptionService subscriptionService;
    private final SubscriptionRepository subscriptionRepository;
    private final PlanFeatureResolver featureResolver;
    private final FeatureEntitlementService entitlementService;
    private final SubscriptionTierTransitionService transitionService;
    private final UsageMeteringService usageMeteringService;
    private final CouponService couponService;
    private final PaymentService paymentService;

    /**
     * 1. Public Plan Catalog with RFC 7234 Edge CDN Caching
     * Cache-Control: public, max-age=60, s-maxage=300, stale-while-revalidate=86400
     */
    @GetMapping("/plans")
    public ResponseEntity<PlanCatalogResponse> getPlans(
            @RequestParam(value = "role", required = false) String role,
            @RequestParam(value = "currency", required = false, defaultValue = "INR") String currency
    ) {
        System.out.println("\n=======================================================");
        System.out.println("  [JAVA PAYMENT-SERVICE] 📡 GET /api/v1/subscriptions/plans");
        System.out.println("  Target Role: " + (role != null ? role : "ALL") + " | Currency: " + currency);
        System.out.println("=======================================================");

        PlanCatalogResponse catalog = subscriptionService.getPlanCatalog(role, currency);

        System.out.println("  -> Returned " + (catalog != null && catalog.getPlans() != null ? catalog.getPlans().size() : 0) + " subscription plans successfully.");
        System.out.println("=======================================================\n");

        return ResponseEntity.ok()
                .header("Cache-Control", "public, max-age=60, s-maxage=300, stale-while-revalidate=86400")
                .body(catalog);
    }

    /**
     * Ultra-Lightweight Public Pricing Summary (Zero DB hit on cached reads)
     * For high-traffic landing / welcome page pricing table
     */
    @GetMapping("/public/pricing-summary")
    public ResponseEntity<PublicPricingSummaryResponse> getPublicPricingSummary(
            @RequestParam(value = "currency", required = false, defaultValue = "USD") String currency
    ) {
        PublicPricingSummaryResponse summary = subscriptionService.getPublicPricingSummary(currency);
        return ResponseEntity.ok()
                .header("Cache-Control", "public, max-age=300, s-maxage=600, stale-while-revalidate=86400")
                .body(summary);
    }

    /**
     * Single-Roundtrip Consolidated Subscription Dashboard Bootstrap
     * Returns: Plan Catalog + Active Subscription + Usage Summary in 1 Request
     */
    @GetMapping("/dashboard")
    public ResponseEntity<SubscriptionDashboardResponse> getDashboard(
            @RequestParam(value = "role", required = false) String role,
            @RequestParam(value = "currency", required = false, defaultValue = "INR") String currency,
            @RequestHeader(value = "X-User-Id", required = false) String headerUserId,
            @RequestParam(value = "userId", required = false) String paramUserId
    ) {
        String userId = (headerUserId != null && !headerUserId.isBlank()) ? headerUserId : paramUserId;
        System.out.println("\n=======================================================");
        System.out.println("  [JAVA PAYMENT-SERVICE] 📊 GET /api/v1/subscriptions/dashboard");
        System.out.println("  User ID: " + userId + " | Role: " + role + " | Currency: " + currency);
        System.out.println("=======================================================");

        SubscriptionDashboardResponse dashboard = subscriptionService.getDashboard(userId, role, currency);

        System.out.println("  -> Dashboard assembled: Active Sub = " + (dashboard.getActiveSubscription() != null ? "YES (" + dashboard.getActiveSubscription().getStatus() + ")" : "NONE"));
        System.out.println("=======================================================\n");

        return ResponseEntity.ok()
                .header("Cache-Control", "private, no-cache")
                .body(dashboard);
    }

    /**
     * 2. Promotional Coupon Validation
     */
    @PostMapping("/coupon/validate")
    public ResponseEntity<ValidateCouponResponse> validateCoupon(
            @Valid @RequestBody ValidateCouponRequest request
    ) {
        System.out.println("\n=======================================================");
        System.out.println("  [JAVA PAYMENT-SERVICE] 🏷️ POST /api/v1/subscriptions/coupon/validate");
        System.out.println("  Coupon Code: " + request.getCode() + " | Plan ID: " + request.getPlanId() + " | Cycle: " + request.getBillingCycle());
        System.out.println("=======================================================");

        ValidateCouponResponse response = couponService.validateCoupon(request);

        System.out.println("  -> Coupon Valid: " + response.isValid() + " | Discount: " + response.getDiscountValue() + " (₹" + response.getDiscountAmount() + ") | Message: " + response.getMessage());
        System.out.println("=======================================================\n");

        return ResponseEntity.ok(response);
    }

    /**
     * 3. Zero-Trust Subscription Checkout / Order Creation
     */
    @PostMapping("/create-order")
    public ResponseEntity<PaymentResponse> createSubscriptionOrder(
            @Valid @RequestBody CreateOrderRequest request,
            @RequestHeader(value = "X-User-Id", required = false, defaultValue = "anonymous") String userId,
            @RequestHeader(value = "Idempotency-Key", required = false) String idempotencyKey
    ) throws Exception {
        System.out.println("\n=======================================================");
        System.out.println("  [JAVA PAYMENT-SERVICE] 💳 POST /api/v1/subscriptions/create-order");
        System.out.println("  User ID: " + userId + " | Plan ID: " + request.getPlanId());
        System.out.println("  Billing Cycle: " + request.getBillingCycle() + " | Coupon: " + (request.getCouponCode() != null ? request.getCouponCode() : "NONE"));
        System.out.println("  Idempotency-Key: " + (idempotencyKey != null ? idempotencyKey : "N/A"));
        System.out.println("=======================================================");

        PaymentResponse response = paymentService.createOrder(request, userId, idempotencyKey);

        System.out.println("  -> Order Generated: OrderId = " + response.getOrderId() + " | RazorpayOrderId = " + response.getRazorpayOrderId());
        System.out.println("  -> Amount: INR " + response.getAmount() + " (" + response.getAmountInPaise() + " paise) | KeyId: " + response.getKeyId());
        System.out.println("  -> Status: " + response.getStatus());
        System.out.println("=======================================================\n");

        return ResponseEntity.ok(response);
    }

    /**
     * 4. Subscription Payment Verification & Activation
     */
    @PostMapping("/verify")
    public ResponseEntity<PaymentResponse> verifySubscriptionPayment(
            @Valid @RequestBody VerifyPaymentRequest request,
            @RequestHeader(value = "Idempotency-Key", required = false) String idempotencyKey
    ) {
        System.out.println("\n=======================================================");
        System.out.println("  [JAVA PAYMENT-SERVICE] 🔐 POST /api/v1/subscriptions/verify");
        System.out.println("  Razorpay Order ID: " + request.getRazorpayOrderId());
        System.out.println("  Razorpay Payment ID: " + request.getRazorpayPaymentId());
        System.out.println("  Plan ID: " + request.getPlanId() + " | Cycle: " + request.getBillingCycle());
        System.out.println("=======================================================");

        PaymentResponse response = paymentService.verifyPayment(request, idempotencyKey);

        System.out.println("  -> Verification Success: " + response.isSuccess() + " | Status: " + response.getStatus());
        System.out.println("  -> Message: " + response.getMessage());
        System.out.println("=======================================================\n");

        return ResponseEntity.ok(response);
    }

    /**
     * 5. User Active Subscription Status
     */
    @GetMapping("/active")
    public ResponseEntity<Subscription> getActiveSubscription(
            @RequestHeader(value = "X-User-Id", required = false) String headerUserId,
            @RequestParam(value = "userId", required = false) String paramUserId
    ) {
        String userId = (headerUserId != null && !headerUserId.isBlank()) ? headerUserId : paramUserId;
        if (userId == null || userId.isBlank()) {
            return ResponseEntity.badRequest().build();
        }
        return subscriptionRepository.findActiveByUserId(userId)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.noContent().build());
    }

    /**
     * 6. Live Payment & Subscription Status Check (Recovery & Reconcile)
     */
    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> getSubscriptionStatus(
            @RequestParam("orderId") String orderId
    ) {
        System.out.println("\n=======================================================");
        System.out.println("  [JAVA PAYMENT-SERVICE] 🔍 GET /api/v1/subscriptions/status");
        System.out.println("  Order ID: " + orderId);
        System.out.println("=======================================================");

        Map<String, Object> result = paymentService.getPaymentStatusByOrderId(orderId);

        System.out.println("  -> Status Check Result: " + result.get("status") + " | Active: " + result.get("subscriptionActive"));
        System.out.println("=======================================================\n");

        return ResponseEntity.ok(result);
    }

    @GetMapping("/entitlements")
    public ResponseEntity<PlanEntitlements> getEntitlements(
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
    public ResponseEntity<ProrationCalculationResult> quoteUpgrade(
            @RequestParam("targetPlanId") String targetPlanId,
            @RequestParam(value = "billingCycle", required = false, defaultValue = "monthly") String billingCycle,
            @RequestHeader(value = "X-User-Id", required = false, defaultValue = "anonymous") String userId
    ) {
        return ResponseEntity.ok(transitionService.quoteUpgrade(userId, targetPlanId, billingCycle));
    }

    @PostMapping("/upgrade")
    public ResponseEntity<SubscriptionResponse> upgradeSubscription(
            @Valid @RequestBody UpgradeSubscriptionRequest request,
            @RequestHeader(value = "X-User-Id", required = false, defaultValue = "anonymous") String userId
    ) {
        return ResponseEntity.ok(transitionService.upgradeSubscription(userId, request));
    }

    @PostMapping("/downgrade")
    public ResponseEntity<Map<String, Object>> downgradeSubscription(
            @Valid @RequestBody DowngradeSubscriptionRequest request,
            @RequestHeader(value = "X-User-Id", required = false, defaultValue = "anonymous") String userId
    ) {
        return ResponseEntity.ok(transitionService.scheduleDowngrade(userId, request));
    }

    @PostMapping("/pause")
    public ResponseEntity<Map<String, Object>> pauseSubscription(
            @Valid @RequestBody PauseSubscriptionRequest request,
            @RequestHeader(value = "X-User-Id", required = false, defaultValue = "anonymous") String userId
    ) {
        return ResponseEntity.ok(transitionService.pauseSubscription(userId, request));
    }

    @PostMapping("/resume")
    public ResponseEntity<SubscriptionResponse> resumeSubscription(
            @RequestHeader(value = "X-User-Id", required = false, defaultValue = "anonymous") String userId
    ) {
        return ResponseEntity.ok(transitionService.resumeSubscription(userId));
    }

    @PostMapping("/consume-quota")
    public ResponseEntity<QuotaConsumptionResult> consumeQuota(
            @Valid @RequestBody ConsumeQuotaRequest request,
            @RequestHeader(value = "X-User-Id", required = false) String headerUserId,
            @RequestParam(value = "userId", required = false) String paramUserId
    ) {
        String userId = (headerUserId != null && !headerUserId.isBlank()) ? headerUserId : paramUserId;
        if (userId == null || userId.isBlank()) {
            return ResponseEntity.badRequest().build();
        }
        QuotaConsumptionResult result = usageMeteringService.consumeQuota(userId, request);
        if (!result.isAllowed()) {
            return ResponseEntity.status(429).body(result);
        }
        return ResponseEntity.ok(result);
    }

    @GetMapping("/usage-summary")
    public ResponseEntity<UsageSummaryResponse> getUsageSummary(
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
            @RequestHeader(value = "X-User-Id", required = false, defaultValue = "anonymous") String userId
    ) throws Exception {
        return ResponseEntity.ok(subscriptionService.createSubscription(request, userId));
    }

    @PostMapping("/cancel")
    public ResponseEntity<SubscriptionResponse> cancelSubscription(
            @Valid @RequestBody CancelSubscriptionRequest request,
            @RequestHeader(value = "X-User-Id", required = false, defaultValue = "anonymous") String userId
    ) throws Exception {
        return ResponseEntity.ok(subscriptionService.cancelSubscription(request, userId));
    }

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
