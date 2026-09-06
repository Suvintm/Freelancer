package com.suvix.payment.domain.payment.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.razorpay.Order;
import com.razorpay.Payment;
import com.razorpay.RazorpayClient;
import com.suvix.payment.domain.billing.entity.Invoice;
import com.suvix.payment.domain.billing.repository.InvoiceRepository;
import com.suvix.payment.domain.billing.service.InvoiceNumberGenerator;
import com.suvix.payment.domain.billing.service.InvoiceService;
import com.suvix.payment.domain.payment.dto.request.CreateOrderRequest;
import com.suvix.payment.domain.payment.dto.request.VerifyPaymentRequest;
import com.suvix.payment.domain.payment.dto.response.PaymentResponse;
import com.suvix.payment.domain.payment.entity.PaymentTransaction;
import com.suvix.payment.domain.payment.repository.PaymentTransactionRepository;
import com.suvix.payment.domain.payment.service.provider.PaymentProvider;
import com.suvix.payment.domain.payment.service.provider.PaymentProviderFactory;
import com.suvix.payment.domain.subscription.dto.request.ValidateCouponRequest;
import com.suvix.payment.domain.subscription.dto.response.ValidateCouponResponse;
import com.suvix.payment.domain.subscription.entity.Subscription;
import com.suvix.payment.domain.subscription.entity.SubscriptionPlan;
import com.suvix.payment.domain.subscription.repository.SubscriptionPlanRepository;
import com.suvix.payment.domain.subscription.repository.SubscriptionRepository;
import com.suvix.payment.domain.subscription.service.CouponService;
import com.suvix.payment.domain.wallet.service.WalletService;
import com.suvix.payment.infrastructure.idempotency.IdempotencyService;
import com.suvix.payment.infrastructure.messaging.PaymentProducer;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class PaymentService {

    private final PaymentTransactionRepository transactionRepository;
    private final SubscriptionRepository subscriptionRepository;
    private final SubscriptionPlanRepository planRepository;
    private final CouponService couponService;
    private final InvoiceRepository invoiceRepository;
    private final InvoiceNumberGenerator invoiceNumberGenerator;
    private final InvoiceService invoiceService;
    private final PaymentProviderFactory providerFactory;
    private final PaymentProducer paymentProducer;
    private final IdempotencyService idempotencyService;
    private final WalletService walletService;
    private final ObjectMapper objectMapper;
    private final RazorpayClient razorpayClient;

    @Value("${razorpay.key-id:rzp_test_SuviXPlatformKey}")
    private String razorpayKeyId;

    private static final double PLATFORM_FEE_PERCENT = 0.10; // 10% platform fee
    private static final BigDecimal GST_RATE = new BigDecimal("0.18"); // 18% Indian GST (SAC 998439)

    public PaymentResponse createOrder(CreateOrderRequest request, String userId, String idempotencyKey) throws Exception {
        String effectiveUserId = (userId != null && !userId.isBlank() && !"anonymous".equalsIgnoreCase(userId))
                ? userId
                : (request.getUserId() != null && !request.getUserId().isBlank() && !"anonymous".equalsIgnoreCase(request.getUserId()))
                        ? request.getUserId()
                        : (request.getClientId() != null && !request.getClientId().isBlank() && !"anonymous".equalsIgnoreCase(request.getClientId()))
                                ? request.getClientId()
                                : "anonymous";

        System.out.println("\n  ┌────────────────────────────────────────────────────────┐");
        System.out.println("  │ 🛒 [PaymentService] createOrder()                       │");
        System.out.println("  │ User ID: " + String.format("%-15s", effectiveUserId) + " | Plan ID: " + String.format("%-15s", (request.getPlanId() != null ? request.getPlanId() : "N/A")) + " │");
        System.out.println("  │ Amount:  " + String.format("%-15s", request.getAmount()) + " | Provider: " + String.format("%-14s", request.getProvider()) + " │");
        System.out.println("  └────────────────────────────────────────────────────────┘");

        log.info("Create order request from userId={}, planId={}, amount={}, idempotencyKey={}",
                effectiveUserId, request.getPlanId(), request.getAmount(), idempotencyKey);

        // 1. Idempotency Guard
        if (idempotencyKey != null && !idempotencyKey.isBlank()) {
            Optional<String> completed = idempotencyService.getCompletedResponse(idempotencyKey);
            if (completed.isPresent()) {
                System.out.println("  ⚡ [Idempotency HIT] Returning cached order response for key: " + idempotencyKey);
                log.info("Idempotency hit for key: {}", idempotencyKey);
                try {
                    return objectMapper.readValue(completed.get(), PaymentResponse.class);
                } catch (Exception ignored) {
                    return PaymentResponse.builder()
                            .success(true)
                            .orderId(request.getOrderId())
                            .status("completed")
                            .message("Order returned from idempotency cache")
                            .build();
                }
            }
        }

        // 2. ZERO-TRUST SUBSCRIPTION CHECKOUT FLOW
        if (request.getPlanId() != null && !request.getPlanId().isBlank()) {
            return createSubscriptionOrder(request, effectiveUserId, idempotencyKey);
        }

        // 3. STANDARD PAYMENT ORDER FLOW (Projects, Escrow, Wallet, Tip)
        PaymentProvider provider = providerFactory.getProvider(request.getProvider());
        PaymentResponse response = provider.createOrder(request, effectiveUserId);

        PaymentTransaction transaction = PaymentTransaction.builder()
                .userId(effectiveUserId)
                .amount(request.getAmount())
                .currency(request.getCurrency() != null ? request.getCurrency() : "INR")
                .status(PaymentTransaction.PaymentStatus.pending)
                .provider(PaymentTransaction.PaymentProvider.valueOf(provider.getProviderName().toLowerCase()))
                .providerOrderId(response.getRazorpayOrderId())
                .platformFee(BigDecimal.ZERO)
                .editorEarnings(BigDecimal.ZERO)
                .taxAmount(BigDecimal.ZERO)
                .metadata("{}")
                .idempotencyKey(idempotencyKey != null ? idempotencyKey : UUID.randomUUID().toString())
                .build();

        transactionRepository.save(transaction);
        response.setTransactionId(transaction.getId());

        if (idempotencyKey != null && !idempotencyKey.isBlank()) {
            try {
                idempotencyService.markCompleted(idempotencyKey, objectMapper.writeValueAsString(response), 86400);
            } catch (Exception e) {
                log.warn("Failed to cache idempotency response: {}", e.getMessage());
            }
        }

        return response;
    }

    private PaymentResponse createSubscriptionOrder(CreateOrderRequest request, String userId, String idempotencyKey) throws Exception {
        System.out.println("  ┌────────────────────────────────────────────────────────┐");
        System.out.println("  │ 🛡️  [Zero-Trust Engine] Calculating Subscription Price   │");
        System.out.println("  └────────────────────────────────────────────────────────┘");

        SubscriptionPlan plan = planRepository.findById(request.getPlanId())
                .orElseThrow(() -> new IllegalArgumentException("Subscription plan not found: " + request.getPlanId()));

        boolean isAnnual = "annual".equalsIgnoreCase(request.getBillingCycle()) ||
                "year".equalsIgnoreCase(request.getBillingInterval());

        System.out.println("  📋 Plan Found: [" + plan.getId() + "] " + plan.getName() + " (Tier " + plan.getTierLevel() + ")");
        System.out.println("     • Target Role:       " + plan.getTargetRole());
        System.out.println("     • Billing Interval:  " + (isAnnual ? "ANNUAL (Yearly)" : "MONTHLY"));
        System.out.println("     • Base Monthly Price: ₹" + plan.getPriceMonthly());
        System.out.println("     • Base Annual Price:  ₹" + plan.getPriceAnnual());

        // Zero-Trust Server Calculation: Base Subtotal
        BigDecimal baseSubtotal;
        if (isAnnual) {
            if (plan.getPriceAnnual() != null && plan.getPriceAnnual().compareTo(BigDecimal.ZERO) > 0) {
                baseSubtotal = plan.getPriceAnnual();
            } else {
                baseSubtotal = plan.getPriceMonthly().multiply(BigDecimal.valueOf(12)).multiply(BigDecimal.valueOf(0.8));
            }
        } else {
            baseSubtotal = plan.getPriceMonthly();
        }

        System.out.println("     • Calculated Subtotal: ₹" + baseSubtotal);

        // Enterprise Zero-Trust Guard: Prevent duplicate purchases of the same active plan
        if (userId != null && !userId.isBlank()) {
            Optional<Subscription> existingActive = subscriptionRepository.findActiveByUserId(userId);
            if (existingActive.isPresent()) {
                Subscription activeSub = existingActive.get();
                if (activeSub.hasActiveAccess() && activeSub.getPlan() != null && activeSub.getPlan().getId().equalsIgnoreCase(plan.getId())) {
                    System.out.println("  ⚠️ [Duplicate Purchase Blocked] User " + userId + " already has active plan: " + plan.getName());
                    throw new IllegalStateException("You already have an active subscription for " + plan.getName() 
                            + " valid until " + activeSub.getCurrentPeriodEnd() + ". You cannot purchase the same plan again.");
                }
            }
        }

        // Handle Free Starter Tier Directly (0 INR)
        if (baseSubtotal.compareTo(BigDecimal.ZERO) == 0 || plan.getTierLevel() == 0) {
            System.out.println("  🎁 [Free Starter Activation] No payment required. Activating immediately.");
            Instant now = Instant.now();
            Instant lifetimeEnd = now.plus(3650, ChronoUnit.DAYS); // 10 years free

            Subscription freeSub = Subscription.builder()
                    .userId(userId)
                    .plan(plan)
                    .status(Subscription.SubscriptionStatus.active)
                    .provider(Subscription.PaymentProvider.free_starter)
                    .currentPeriodStart(now)
                    .currentPeriodEnd(lifetimeEnd)
                    .baseAmount(BigDecimal.ZERO)
                    .taxAmount(BigDecimal.ZERO)
                    .totalAmount(BigDecimal.ZERO)
                    .planSnapshot(objectMapper.writeValueAsString(Map.of(
                            "planId", plan.getId(),
                            "planName", plan.getName(),
                            "tierLevel", plan.getTierLevel(),
                            "billingCycle", "lifetime",
                            "activatedAt", now.toString()
                    )))
                    .build();

            freeSub = subscriptionRepository.save(freeSub);

            return PaymentResponse.builder()
                    .success(true)
                    .subscriptionId(freeSub.getId())
                    .amount(BigDecimal.ZERO)
                    .amountInPaise(0L)
                    .currency(request.getCurrency() != null ? request.getCurrency() : "INR")
                    .status("active")
                    .message("Free Starter tier activated successfully")
                    .build();
        }

        // Server-Side Promotional Coupon Validation
        BigDecimal couponDiscountAmount = BigDecimal.ZERO;
        String appliedCouponCode = null;

        if (request.getCouponCode() != null && !request.getCouponCode().isBlank()) {
            System.out.println("  🏷️  Applying Promo Coupon: " + request.getCouponCode());
            ValidateCouponResponse couponRes = couponService.validateCoupon(
                    ValidateCouponRequest.builder()
                            .code(request.getCouponCode())
                            .planId(plan.getId())
                            .billingCycle(isAnnual ? "annual" : "monthly")
                            .role(request.getTargetRole())
                            .build()
            );

            if (couponRes.isValid()) {
                appliedCouponCode = couponRes.getCode();
                couponDiscountAmount = couponRes.getDiscountAmount();
                System.out.println("  ✅ Coupon Validated: " + appliedCouponCode + " -> Discount: ₹" + couponDiscountAmount);
            } else {
                System.out.println("  ⚠️ Coupon Invalid: " + couponRes.getMessage());
            }
        }

        BigDecimal discountedSubtotal = baseSubtotal.subtract(couponDiscountAmount).max(BigDecimal.ZERO);

        // Indian GST 18% (SAC 998439) with CGST 9% and SGST 9%
        BigDecimal gstAmount = discountedSubtotal.multiply(GST_RATE).setScale(2, RoundingMode.HALF_UP);
        BigDecimal cgst = gstAmount.divide(BigDecimal.valueOf(2), 2, RoundingMode.HALF_UP);
        BigDecimal sgst = gstAmount.subtract(cgst);
        BigDecimal totalAmount = discountedSubtotal.add(gstAmount).setScale(2, RoundingMode.HALF_UP);
        long amountInPaise = totalAmount.multiply(BigDecimal.valueOf(100)).longValue();

        String receiptId = "sub_" + (userId.length() > 6 ? userId.substring(userId.length() - 6) : userId)
                + "_" + (System.currentTimeMillis() % 100000000);

        System.out.println("  ┌────────────────────────────────────────────────────────┐");
        System.out.println("  │ 🧾 [Invoice Tax Breakdown - SAC 998439]                │");
        System.out.println("  │ Base Subtotal:        ₹" + String.format("%-10s", baseSubtotal) + "                      │");
        System.out.println("  │ Coupon Discount:    - ₹" + String.format("%-10s", couponDiscountAmount) + "                      │");
        System.out.println("  │ Taxable Amount:       ₹" + String.format("%-10s", discountedSubtotal) + "                      │");
        System.out.println("  │ CGST (9%):          + ₹" + String.format("%-10s", cgst) + "                      │");
        System.out.println("  │ SGST (9%):          + ₹" + String.format("%-10s", sgst) + "                      │");
        System.out.println("  │ Total GST (18%):    + ₹" + String.format("%-10s", gstAmount) + "                      │");
        System.out.println("  │ Total Payable:        ₹" + String.format("%-10s", totalAmount) + " (" + amountInPaise + " paise)       │");
        System.out.println("  └────────────────────────────────────────────────────────┘");

        // Override request with server-calculated amounts
        request.setAmount(totalAmount);
        request.setOrderId(receiptId);
        request.setCurrency("INR");

        PaymentProvider provider = providerFactory.getProvider(request.getProvider());
        PaymentResponse providerResponse = provider.createOrder(request, userId);

        // Build Immutable Plan Snapshot JSONB
        Map<String, Object> snapshotMap = new LinkedHashMap<>();
        snapshotMap.put("planId", plan.getId());
        snapshotMap.put("planName", plan.getName());
        snapshotMap.put("planTier", plan.getTierLevel());
        snapshotMap.put("billingCycle", isAnnual ? "annual" : "monthly");
        snapshotMap.put("baseSubtotal", baseSubtotal);
        snapshotMap.put("couponDiscountAmount", couponDiscountAmount);
        snapshotMap.put("appliedCoupon", appliedCouponCode != null ? appliedCouponCode : "none");
        snapshotMap.put("gstRate", 18);
        snapshotMap.put("gstAmount", gstAmount);
        snapshotMap.put("cgst", cgst);
        snapshotMap.put("sgst", sgst);
        snapshotMap.put("totalAmount", totalAmount);
        if (request.getCustomerName() != null && !request.getCustomerName().isBlank()) {
            snapshotMap.put("customerName", request.getCustomerName());
        }
        if (request.getCustomerEmail() != null && !request.getCustomerEmail().isBlank()) {
            snapshotMap.put("customerEmail", request.getCustomerEmail());
        }
        if (request.getCustomerGstin() != null && !request.getCustomerGstin().isBlank()) {
            snapshotMap.put("customerGstin", request.getCustomerGstin());
        }
        snapshotMap.put("features", plan.getFeatures());
        snapshotMap.put("limits", plan.getLimits());
        snapshotMap.put("snapshotAt", Instant.now().toString());

        String planSnapshotJson = objectMapper.writeValueAsString(snapshotMap);

        // Persist Pending Subscription
        Instant startDate = Instant.now();
        Instant endDate = isAnnual ? startDate.plus(365, ChronoUnit.DAYS) : startDate.plus(30, ChronoUnit.DAYS);

        Subscription pendingSubscription = Subscription.builder()
                .userId(userId)
                .plan(plan)
                .status(Subscription.SubscriptionStatus.payment_pending)
                .provider(Subscription.PaymentProvider.razorpay)
                .providerSubscriptionId(providerResponse.getRazorpayOrderId())
                .currentPeriodStart(startDate)
                .currentPeriodEnd(endDate)
                .baseAmount(baseSubtotal)
                .taxAmount(gstAmount)
                .totalAmount(totalAmount)
                .planSnapshot(planSnapshotJson)
                .build();

        pendingSubscription = subscriptionRepository.save(pendingSubscription);
        System.out.println("  💾 [PostgreSQL Save] Created pending subscription record: ID=" + pendingSubscription.getId()
                + " | Status=payment_pending | RazorpayOrderId=" + providerResponse.getRazorpayOrderId());

        // Build response
        Map<String, Object> planInfo = Map.of(
                "id", plan.getId(),
                "name", plan.getName(),
                "tierLevel", plan.getTierLevel(),
                "billingCycle", isAnnual ? "annual" : "monthly"
        );

        Map<String, Object> feeBreakdown = new LinkedHashMap<>();
        feeBreakdown.put("baseSubtotal", baseSubtotal);
        feeBreakdown.put("couponDiscountAmount", couponDiscountAmount);
        feeBreakdown.put("appliedCoupon", appliedCouponCode != null ? appliedCouponCode : "none");
        feeBreakdown.put("gstRate", 18);
        feeBreakdown.put("gstAmount", gstAmount);
        feeBreakdown.put("cgst", cgst);
        feeBreakdown.put("sgst", sgst);
        feeBreakdown.put("totalPayable", totalAmount);

        PaymentResponse response = PaymentResponse.builder()
                .success(true)
                .orderId(providerResponse.getRazorpayOrderId())
                .razorpayOrderId(providerResponse.getRazorpayOrderId())
                .amount(totalAmount)
                .amountInPaise(amountInPaise)
                .currency("INR")
                .keyId(razorpayKeyId)
                .subscriptionId(pendingSubscription.getId())
                .status("created")
                .plan(planInfo)
                .feeBreakdown(feeBreakdown)
                .message("Razorpay order generated with Zero-Trust pricing")
                .build();

        if (idempotencyKey != null && !idempotencyKey.isBlank()) {
            try {
                idempotencyService.markCompleted(idempotencyKey, objectMapper.writeValueAsString(response), 86400);
            } catch (Exception e) {
                log.warn("Failed to cache idempotency response: {}", e.getMessage());
            }
        }

        return response;
    }

    @Transactional
    public PaymentResponse verifyPayment(VerifyPaymentRequest request, String idempotencyKey) {
        System.out.println("\n  ┌────────────────────────────────────────────────────────┐");
        System.out.println("  │ 🔐 [PaymentService] verifyPayment()                     │");
        System.out.println("  │ Razorpay Order ID:   " + request.getRazorpayOrderId());
        System.out.println("  │ Razorpay Payment ID: " + request.getRazorpayPaymentId());
        System.out.println("  │ Subscription ID:     " + (request.getSubscriptionId() != null ? request.getSubscriptionId() : "N/A"));
        System.out.println("  └────────────────────────────────────────────────────────┘");

        log.info("Verifying payment for razorpayOrderId={}, subscriptionId={}",
                request.getRazorpayOrderId(), request.getSubscriptionId());

        PaymentProvider provider = providerFactory.getProvider("razorpay");
        boolean valid = provider.verifySignature(request);

        if (!valid) {
            System.out.println("  ❌ [Payment Verification FAILED] Signature mismatch for order: " + request.getRazorpayOrderId());
            log.error("Payment signature verification failed for orderId={}", request.getRazorpayOrderId());
            throw new RuntimeException("Payment signature verification failed");
        }

        System.out.println("  ✅ [Payment Signature Verified] Cryptographic verification passed.");

        // 1. Look for Pending Subscription
        Subscription subscription = null;
        if (request.getSubscriptionId() != null && !request.getSubscriptionId().isBlank()) {
            try {
                subscription = subscriptionRepository.findById(UUID.fromString(request.getSubscriptionId())).orElse(null);
            } catch (Exception ignored) {}
        }
        if (subscription == null && request.getRazorpayOrderId() != null) {
            subscription = subscriptionRepository.findByProviderSubscriptionId(request.getRazorpayOrderId()).orElse(null);
        }

        // 2. Process Subscription Activation if found
        if (subscription != null) {
            if ((request.getCustomerName() != null && !request.getCustomerName().isBlank()) ||
                (request.getCustomerEmail() != null && !request.getCustomerEmail().isBlank()) ||
                (request.getCustomerGstin() != null && !request.getCustomerGstin().isBlank())) {
                try {
                    java.util.Map<String, Object> snapshot = subscription.getPlanSnapshot() != null
                            ? objectMapper.readValue(subscription.getPlanSnapshot(), java.util.Map.class)
                            : new java.util.HashMap<>();
                    if (request.getCustomerName() != null && !request.getCustomerName().isBlank()) {
                        snapshot.put("customerName", request.getCustomerName());
                    }
                    if (request.getCustomerEmail() != null && !request.getCustomerEmail().isBlank()) {
                        snapshot.put("customerEmail", request.getCustomerEmail());
                    }
                    if (request.getCustomerGstin() != null && !request.getCustomerGstin().isBlank()) {
                        snapshot.put("customerGstin", request.getCustomerGstin());
                    }
                    subscription.setPlanSnapshot(objectMapper.writeValueAsString(snapshot));
                } catch (Exception ignored) {}
            }

            PaymentTransaction transaction = activateSubscriptionInternal(
                    subscription,
                    request.getRazorpayOrderId(),
                    request.getRazorpayPaymentId(),
                    request.getRazorpaySignature(),
                    idempotencyKey
            );

            return PaymentResponse.builder()
                    .success(true)
                    .transactionId(transaction.getId())
                    .orderId(request.getRazorpayOrderId())
                    .subscriptionId(subscription.getId())
                    .status("completed")
                    .amount(subscription.getTotalAmount())
                    .message("Subscription activated and verified successfully")
                    .build();
        }

        // 3. Standard Non-Subscription Payment Verification
        BigDecimal totalAmount = request.getAmount() != null ? request.getAmount() : BigDecimal.ZERO;
        BigDecimal platformFee = totalAmount.multiply(BigDecimal.valueOf(PLATFORM_FEE_PERCENT));
        BigDecimal editorEarnings = totalAmount.subtract(platformFee);

        PaymentTransaction transaction = transactionRepository.findByProviderOrderId(request.getRazorpayOrderId())
                .orElseGet(() -> PaymentTransaction.builder()
                        .userId(request.getClientId() != null ? request.getClientId() : "anonymous")
                        .amount(totalAmount)
                        .currency("INR")
                        .provider(PaymentTransaction.PaymentProvider.razorpay)
                        .idempotencyKey(idempotencyKey != null ? idempotencyKey : UUID.randomUUID().toString())
                        .build()
                );

        transaction.setProviderPaymentId(request.getRazorpayPaymentId());
        transaction.setProviderSignature(request.getRazorpaySignature());
        transaction.setPlatformFee(platformFee);
        transaction.setEditorEarnings(editorEarnings);
        transaction.setStatus(PaymentTransaction.PaymentStatus.completed);
        transaction.setCompletedAt(Instant.now());

        transaction = transactionRepository.save(transaction);

        if (request.getEditorId() != null && !request.getEditorId().isBlank()) {
            walletService.creditEarnings(request.getEditorId(), editorEarnings);
        }

        try {
            paymentProducer.publishPaymentVerified(
                    transaction.getId().toString(),
                    request.getSuvixOrderId() != null ? request.getSuvixOrderId() : request.getRazorpayOrderId(),
                    request.getClientId(),
                    request.getEditorId(),
                    totalAmount.doubleValue()
            );
        } catch (Exception e) {
            log.warn("Kafka event publishing skipped: {}", e.getMessage());
        }

        return PaymentResponse.builder()
                .success(true)
                .transactionId(transaction.getId())
                .orderId(request.getSuvixOrderId() != null ? request.getSuvixOrderId() : request.getRazorpayOrderId())
                .status("completed")
                .amount(totalAmount)
                .message("Payment verified and recorded successfully")
                .build();
    }

    @Transactional
    public PaymentTransaction activateSubscriptionInternal(
            Subscription subscription,
            String providerOrderId,
            String providerPaymentId,
            String providerSignature,
            String idempotencyKey
    ) {
        System.out.println("  🔍 [Subscription Record Located] ID=" + subscription.getId() + " | Current Status=" + subscription.getStatus());
        Instant now = Instant.now();
        boolean isAnnual = subscription.getPlanSnapshot() != null && subscription.getPlanSnapshot().contains("\"annual\"");
        Instant periodEnd = isAnnual ? now.plus(365, ChronoUnit.DAYS) : now.plus(30, ChronoUnit.DAYS);

        subscription.setStatus(Subscription.SubscriptionStatus.active);
        subscription.setCurrentPeriodStart(now);
        subscription.setCurrentPeriodEnd(periodEnd);
        subscription.setStatusChangedAt(now);
        subscription.setStatusChangedBy("payment_verification");
        subscription = subscriptionRepository.save(subscription);

        System.out.println("  🎉 [Subscription Activated] State transitioned to ACTIVE. Valid until: " + periodEnd);

        // If coupon applied, increment redemption
        if (subscription.getPlanSnapshot() != null) {
            try {
                Map<String, Object> snapshot = objectMapper.readValue(subscription.getPlanSnapshot(), Map.class);
                String appliedCoupon = (String) snapshot.get("appliedCoupon");
                if (appliedCoupon != null && !"none".equalsIgnoreCase(appliedCoupon)) {
                    couponService.incrementRedemption(appliedCoupon);
                }
            } catch (Exception ignored) {}
        }

        // Check if transaction already exists for this orderId to avoid duplicate insert
        Optional<PaymentTransaction> existingTx = transactionRepository.findByProviderOrderId(providerOrderId);
        PaymentTransaction transaction;
        if (existingTx.isPresent()) {
            transaction = existingTx.get();
        } else {
            transaction = PaymentTransaction.builder()
                    .userId(subscription.getUserId())
                    .amount(subscription.getTotalAmount())
                    .currency("INR")
                    .provider(PaymentTransaction.PaymentProvider.razorpay)
                    .providerOrderId(providerOrderId)
                    .platformFee(BigDecimal.ZERO)
                    .editorEarnings(BigDecimal.ZERO)
                    .taxAmount(subscription.getTaxAmount())
                    .metadata(subscription.getPlanSnapshot())
                    .idempotencyKey(idempotencyKey != null ? idempotencyKey : UUID.randomUUID().toString())
                    .build();
        }

        transaction.setProviderPaymentId(providerPaymentId);
        transaction.setProviderSignature(providerSignature);
        transaction.setStatus(PaymentTransaction.PaymentStatus.completed);
        transaction.setCompletedAt(now);

        transaction = transactionRepository.save(transaction);
        System.out.println("  💾 [Transaction Recorded] ID=" + transaction.getId() + " | Amount=₹" + transaction.getAmount() + " | Status=completed");

        // Generate Compliant GST Tax Invoice (SAC 998439)
        try {
            String invoiceNumber = invoiceNumberGenerator.generateNextInvoiceNumber();

            // Extract accurate plan and customer details from planSnapshot
            String customerName = null;
            String customerEmail = null;
            String customerGstin = null;
            String planName = subscription.getPlan() != null ? subscription.getPlan().getName() : "Creator Pro";
            String billingCycle = "Monthly";

            if (subscription.getPlanSnapshot() != null) {
                try {
                    Map<String, Object> snapshot = objectMapper.readValue(subscription.getPlanSnapshot(), Map.class);
                    if ((customerName == null || customerName.isBlank()) && snapshot.get("customerName") != null) {
                        customerName = (String) snapshot.get("customerName");
                    }
                    if ((customerEmail == null || customerEmail.isBlank()) && snapshot.get("customerEmail") != null) {
                        customerEmail = (String) snapshot.get("customerEmail");
                    }
                    if ((customerGstin == null || customerGstin.isBlank()) && snapshot.get("customerGstin") != null) {
                        customerGstin = (String) snapshot.get("customerGstin");
                    }
                    if (snapshot.get("planName") != null) {
                        planName = (String) snapshot.get("planName");
                    }
                    if (snapshot.get("billingCycle") != null) {
                        billingCycle = ((String) snapshot.get("billingCycle")).toUpperCase();
                    }
                } catch (Exception ignored) {}
            }

            if (customerName == null || customerName.isBlank() || "anonymous".equalsIgnoreCase(customerName)) {
                customerName = "SuviX Creator (" + subscription.getUserId().substring(0, Math.min(8, subscription.getUserId().length())) + ")";
            }
            if (customerEmail == null || customerEmail.isBlank() || "anonymous@suvix.in".equalsIgnoreCase(customerEmail)) {
                customerEmail = subscription.getUserId() + "@suvix.in";
            }

            String lineItemDescription = "SuviX " + planName + " Subscription (" + billingCycle + " Tier)";

            Invoice invoice = Invoice.builder()
                    .invoiceNumber(invoiceNumber)
                    .userId(subscription.getUserId())
                    .customerName(customerName)
                    .customerEmail(customerEmail)
                    .customerGstin(customerGstin)
                    .subtotal(subscription.getBaseAmount())
                    .taxRate(new BigDecimal("18.00"))
                    .taxAmount(subscription.getTaxAmount())
                    .totalAmount(subscription.getTotalAmount())
                    .currency("INR")
                    .transactionId(transaction.getId())
                    .subscriptionId(subscription.getId())
                    .status(Invoice.InvoiceStatus.paid)
                    .invoiceDate(LocalDate.now())
                    .paidAt(now)
                    .provider("razorpay")
                    .providerInvoiceId(providerPaymentId)
                    .lineItems("[{\"description\":\"" + lineItemDescription +
                            "\",\"sacCode\":\"998439\",\"amount\":" + subscription.getBaseAmount() +
                            ",\"taxAmount\":" + subscription.getTaxAmount() + "}]")
                    .build();

            invoice = invoiceRepository.save(invoice);
            System.out.println("  🧾 [GST Invoice Generated] Invoice No: " + invoice.getInvoiceNumber()
                    + " | Plan: " + planName
                    + " | Customer: " + customerName + " <" + customerEmail + ">"
                    + " | Total: ₹" + invoice.getTotalAmount());
            invoiceService.prewarmInvoicePdfAsync(invoice.getId());
        } catch (Exception e) {
            log.warn("Failed to create invoice during subscription activation: {}", e.getMessage());
        }

        // Publish to Kafka
        try {
            paymentProducer.publishPaymentVerified(
                    transaction.getId().toString(),
                    providerOrderId,
                    subscription.getUserId(),
                    null,
                    subscription.getTotalAmount().doubleValue()
            );
            System.out.println("  📡 [Kafka Event Published] payment.verified event dispatched.");
        } catch (Exception e) {
            log.warn("Kafka event publishing skipped: {}", e.getMessage());
        }

        return transaction;
    }

    public List<PaymentTransaction> getPaymentHistory(String userId) {
        return transactionRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    public PaymentTransaction getPaymentById(UUID id) {
        return transactionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Payment not found: " + id));
    }

    @Transactional
    public Map<String, Object> getPaymentStatusByOrderId(String orderId) {
        System.out.println("\n  ┌────────────────────────────────────────────────────────┐");
        System.out.println("  │ 🔍 [PaymentService] getPaymentStatusByOrderId()        │");
        System.out.println("  │ Order ID: " + orderId);
        System.out.println("  └────────────────────────────────────────────────────────┘");
        log.info("Checking payment status for orderId={}", orderId);

        // 1. Check if a completed transaction already exists
        Optional<PaymentTransaction> txOpt = transactionRepository.findByProviderOrderId(orderId);
        if (txOpt.isPresent()) {
            PaymentTransaction tx = txOpt.get();
            if (tx.getStatus() == PaymentTransaction.PaymentStatus.completed) {
                System.out.println("  ✅ [Transaction Found] Status: COMPLETED | Amount: ₹" + tx.getAmount());
                Map<String, Object> result = new LinkedHashMap<>();
                result.put("success", true);
                result.put("status", "completed");
                result.put("subscriptionActive", true);
                result.put("orderId", orderId);
                result.put("paymentId", tx.getProviderPaymentId());
                result.put("amount", tx.getAmount());
                result.put("currency", tx.getCurrency());
                result.put("userId", tx.getUserId());
                return result;
            }
        }

        // 2. Check subscription record
        Optional<Subscription> subOpt = subscriptionRepository.findByProviderSubscriptionId(orderId);
        if (subOpt.isPresent()) {
            Subscription sub = subOpt.get();
            if (sub.getStatus() == Subscription.SubscriptionStatus.active) {
                System.out.println("  ✅ [Subscription Found] Status: ACTIVE | Plan: " + (sub.getPlan() != null ? sub.getPlan().getName() : "N/A"));
                Map<String, Object> result = new LinkedHashMap<>();
                result.put("success", true);
                result.put("status", "completed");
                result.put("subscriptionActive", true);
                result.put("subscriptionId", sub.getId().toString());
                result.put("planId", sub.getPlan() != null ? sub.getPlan().getId() : null);
                result.put("userId", sub.getUserId());
                return result;
            }
        }

        // 3. Proactive Live Razorpay API Reconciliation (Netbanking / UPI / Polling Recovery)
        try {
            System.out.println("  🌐 [Razorpay Live Reconciliation] Querying Razorpay API for order: " + orderId);
            Order rzpOrder = razorpayClient.orders.fetch(orderId);
            String rzpStatus = rzpOrder.has("status") ? rzpOrder.get("status").toString() : "";
            System.out.println("  📡 [Razorpay Live Status] Order Status: " + rzpStatus);

            List<Payment> payments = razorpayClient.orders.fetchPayments(orderId);
            Payment successfulPayment = null;
            if (payments != null) {
                for (Payment p : payments) {
                    String pStatus = p.has("status") ? p.get("status").toString() : "";
                    System.out.println("     • Payment ID: " + p.get("id") + " | Status: " + pStatus + " | Method: " + (p.has("method") ? p.get("method") : "N/A"));
                    if ("captured".equalsIgnoreCase(pStatus) || "authorized".equalsIgnoreCase(pStatus)) {
                        successfulPayment = p;
                        break;
                    }
                }
            }

            if ("paid".equalsIgnoreCase(rzpStatus) || successfulPayment != null) {
                String paymentId = successfulPayment != null ? successfulPayment.get("id").toString() : "pay_" + System.currentTimeMillis();
                System.out.println("  🎉 [Razorpay Payment Confirmed] Auto-activating subscription for order " + orderId + " with Payment ID: " + paymentId);

                Subscription subToActivate = subOpt.orElse(null);
                if (subToActivate != null) {
                    activateSubscriptionInternal(subToActivate, orderId, paymentId, "razorpay_live_reconciled", null);
                    Map<String, Object> result = new LinkedHashMap<>();
                    result.put("success", true);
                    result.put("status", "completed");
                    result.put("subscriptionActive", true);
                    result.put("subscriptionId", subToActivate.getId().toString());
                    result.put("planId", subToActivate.getPlan() != null ? subToActivate.getPlan().getId() : null);
                    result.put("userId", subToActivate.getUserId());
                    result.put("paymentId", paymentId);
                    result.put("message", "Subscription verified and activated via live bank reconciliation");
                    return result;
                }
            }
        } catch (Exception e) {
            System.out.println("  ⚠️ [Razorpay Live Check Warning] " + e.getMessage());
            log.warn("Razorpay API status check for orderId {}: {}", orderId, e.getMessage());
        }

        // 4. Fallback Pending Response
        System.out.println("  ⏳ [Status] Payment is still pending/processing...");
        return Map.of(
            "success", true,
            "status", "pending",
            "subscriptionActive", false,
            "orderId", orderId,
            "message", "Payment is being processed or awaiting verification"
        );
    }
}
