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
    private final com.suvix.payment.domain.subscription.repository.SubscriptionTransitionRepository transitionRepository;
    private final com.suvix.payment.domain.subscription.repository.CustomerCreditBalanceRepository creditBalanceRepository;
    private final com.suvix.payment.domain.subscription.service.ProrationCalculator prorationCalculator;

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

        String targetCurrency = (request.getCurrency() != null && !request.getCurrency().isBlank()) 
                ? request.getCurrency().toUpperCase() 
                : "INR";
        boolean isUsd = "USD".equalsIgnoreCase(targetCurrency);
        String currencySymbol = isUsd ? "$" : "₹";

        BigDecimal monthlyPrice = plan.getMonthlyPriceForCurrency(targetCurrency);
        BigDecimal annualPrice = plan.getAnnualPriceForCurrency(targetCurrency);

        System.out.println("  📋 Plan Found: [" + plan.getId() + "] " + plan.getName() + " (Tier " + plan.getTierLevel() + ")");
        System.out.println("     • Target Role:       " + plan.getTargetRole());
        System.out.println("     • Target Currency:   " + targetCurrency);
        System.out.println("     • Billing Interval:  " + (isAnnual ? "ANNUAL (Yearly)" : "MONTHLY"));
        System.out.println("     • Base Monthly Price: " + currencySymbol + monthlyPrice);
        System.out.println("     • Base Annual Price:  " + currencySymbol + annualPrice);

        // Zero-Trust Server Calculation: Base Subtotal
        BigDecimal baseSubtotal;
        if (isAnnual) {
            if (annualPrice != null && annualPrice.compareTo(BigDecimal.ZERO) > 0) {
                baseSubtotal = annualPrice;
            } else {
                baseSubtotal = monthlyPrice.multiply(BigDecimal.valueOf(12)).multiply(BigDecimal.valueOf(0.8)).setScale(2, RoundingMode.HALF_UP);
            }
        } else {
            baseSubtotal = monthlyPrice;
        }

        System.out.println("     • Calculated Subtotal: " + currencySymbol + baseSubtotal);

        BigDecimal prorationCredit = BigDecimal.ZERO;
        String transitionType = "NEW_SUBSCRIPTION";
        String previousPlanName = null;
        BigDecimal previousPlanPrice = BigDecimal.ZERO;
        String previousPlanId = null;
        long remainingDays = 0;
        boolean isCoTerm = false;
        BigDecimal leftoverCredit = BigDecimal.ZERO;
        Instant calculatedNewPeriodEnd = null;
        Instant previousPeriodEnd = null;
        com.suvix.payment.domain.subscription.dto.response.ProrationCalculationResult upgradeQuote = null;

        // Enterprise Zero-Trust Guard & Upgrade/Proration Detection
        if (userId != null && !userId.isBlank()) {
            Optional<Subscription> existingActive = subscriptionRepository.findActiveByUserId(userId);
            if (existingActive.isPresent()) {
                Subscription activeSub = existingActive.get();
                if (activeSub.hasActiveAccess() && activeSub.getPlan() != null) {
                    SubscriptionPlan currentPlan = activeSub.getPlan();
                    boolean isSamePlan = currentPlan.getId().equalsIgnoreCase(plan.getId());
                    boolean currentIsAnnual = activeSub.getPlanSnapshot() != null && activeSub.getPlanSnapshot().contains("\"annual\"");

                    if (isSamePlan && currentIsAnnual == isAnnual) {
                        System.out.println("  ⚠️ [Duplicate Purchase Blocked] User " + userId + " already has active plan: " + plan.getName());
                        throw new IllegalStateException("You already have an active subscription for " + plan.getName()
                                + " valid until " + activeSub.getCurrentPeriodEnd() + ". You cannot purchase the same plan again.");
                    }

                    if (currentPlan.getTierLevel() > 0) {
                        if (plan.getTierLevel() > currentPlan.getTierLevel() || (isSamePlan && isAnnual && !currentIsAnnual)) {
                            // UPGRADE: Calculate second-precision proration with Co-Term delta math or interval switch
                            previousPlanId = currentPlan.getId();
                            previousPlanName = currentPlan.getName();
                            upgradeQuote = prorationCalculator.calculateUpgradeProration(activeSub, plan, isAnnual);
                            prorationCredit = upgradeQuote.getUnusedCredit();
                            previousPlanPrice = upgradeQuote.getCurrentPlanPrice();
                            remainingDays = upgradeQuote.getRemainingDays();
                            isCoTerm = upgradeQuote.isCoTerm();
                            leftoverCredit = upgradeQuote.getLeftoverCredit();
                            transitionType = upgradeQuote.getTransitionType();
                            calculatedNewPeriodEnd = upgradeQuote.getNewPeriodEnd();
                            previousPeriodEnd = activeSub.getCurrentPeriodEnd();
                            System.out.println("  📈 [Upgrade Proration Detected] Upgrading from " + previousPlanName
                                    + " to " + plan.getName() + " | Type: " + transitionType + " | Unused Credit: " + currencySymbol + prorationCredit + " (" + remainingDays + " days)");
                        } else if (plan.getTierLevel() < currentPlan.getTierLevel() || (isSamePlan && !isAnnual && currentIsAnnual)) {
                            System.out.println("  ⚠️ [Lower Tier Purchase Blocked] User " + userId + " is currently on higher tier: " + currentPlan.getName());
                            throw new IllegalStateException("You already have an active " + currentPlan.getName()
                                    + " subscription valid until " + activeSub.getCurrentPeriodEnd() + ". In our prepaid model, you can choose this plan after your current plan validity completes.");
                        }
                    }
                }
            }
        }

        // Handle Free Starter Tier Directly (0 Amount)
        if (baseSubtotal.compareTo(BigDecimal.ZERO) == 0 || plan.getTierLevel() == 0) {
            System.out.println("  🎁 [Free Starter Activation] No payment required. Activating immediately.");
            Instant now = Instant.now();
            Instant lifetimeEnd = now.plus(3650, ChronoUnit.DAYS); // 10 years free

            Subscription freeSub = Subscription.builder()
                    .userId(userId)
                    .plan(plan)
                    .currency(targetCurrency)
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
                            "currency", targetCurrency,
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
                    .currency(targetCurrency)
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
                System.out.println("  ✅ Coupon Validated: " + appliedCouponCode + " -> Discount: " + currencySymbol + couponDiscountAmount);
            } else {
                System.out.println("  ⚠️ Coupon Invalid: " + couponRes.getMessage());
            }
        }

        BigDecimal grossAfterCoupon = baseSubtotal.subtract(couponDiscountAmount).max(BigDecimal.ZERO);

        // Tax-Inclusive Pricing: Advertised price minus proration minus coupon is the EXACT final payable amount (MRP Standard)
        // Zero-Trust: If an upgrade quote exists, use the calculator's totalAmount as authoritative source
        BigDecimal totalAmount;
        if (upgradeQuote != null) {
            totalAmount = upgradeQuote.getTotalAmount()
                    .subtract(couponDiscountAmount)
                    .max(BigDecimal.ZERO)
                    .setScale(2, RoundingMode.HALF_UP);
        } else {
            totalAmount = grossAfterCoupon.subtract(prorationCredit).max(BigDecimal.ZERO).setScale(2, RoundingMode.HALF_UP);
        }
        BigDecimal gstAmount = BigDecimal.ZERO;
        BigDecimal cgst = BigDecimal.ZERO;
        BigDecimal sgst = BigDecimal.ZERO;
        BigDecimal taxableBase = totalAmount;

        if (!isUsd && totalAmount.compareTo(BigDecimal.ZERO) > 0) {
            BigDecimal divisor = new BigDecimal("1.18");
            taxableBase = totalAmount.divide(divisor, 2, RoundingMode.HALF_UP);
            gstAmount = totalAmount.subtract(taxableBase);
            cgst = gstAmount.divide(BigDecimal.valueOf(2), 2, RoundingMode.HALF_UP);
            sgst = gstAmount.subtract(cgst);
        }

        long amountInPaise = totalAmount.multiply(BigDecimal.valueOf(100)).longValue();

        String receiptId = "sub_" + (userId.length() > 6 ? userId.substring(userId.length() - 6) : userId)
                + "_" + (System.currentTimeMillis() % 100000000);

        System.out.println("  ┌────────────────────────────────────────────────────────┐");
        System.out.println("  │ 🧾 [Invoice Tax Breakdown - " + (isUsd ? "USD Export" : "SAC 998439 (Tax-Inclusive)") + "]        │");
        System.out.println("  │ Transition Type:      " + String.format("%-20s", transitionType) + "        │");
        System.out.println("  │ Gross Plan Price:     " + currencySymbol + String.format("%-10s", baseSubtotal) + "                      │");
        if (couponDiscountAmount.compareTo(BigDecimal.ZERO) > 0) {
            System.out.println("  │ Coupon Discount:    - " + currencySymbol + String.format("%-10s", couponDiscountAmount) + "                      │");
        }
        if (prorationCredit.compareTo(BigDecimal.ZERO) > 0) {
            System.out.println("  │ Proration Credit:   - " + currencySymbol + String.format("%-10s", prorationCredit) + " (" + previousPlanName + ")   │");
        }
        System.out.println("  │ Taxable Base (Net):   " + currencySymbol + String.format("%-10s", taxableBase) + "                      │");
        if (!isUsd) {
            System.out.println("  │ CGST (9% Included): + ₹" + String.format("%-10s", cgst) + "                      │");
            System.out.println("  │ SGST (9% Included): + ₹" + String.format("%-10s", sgst) + "                      │");
            System.out.println("  │ Total GST (18%):    + ₹" + String.format("%-10s", gstAmount) + "                      │");
        }
        System.out.println("  │ Total Payable:        " + currencySymbol + String.format("%-10s", totalAmount) + " (" + amountInPaise + " cents/paise) │");
        System.out.println("  └────────────────────────────────────────────────────────┘");

        // Override request with server-calculated amounts
        request.setAmount(totalAmount);
        request.setOrderId(receiptId);
        request.setCurrency(targetCurrency);

        PaymentProvider provider = (request.getProvider() != null && !request.getProvider().isBlank())
                ? providerFactory.getProvider(request.getProvider())
                : providerFactory.getProviderByCurrency(targetCurrency);
        PaymentResponse providerResponse = provider.createOrder(request, userId);

        // Build Immutable Plan Snapshot JSONB
        Map<String, Object> snapshotMap = new LinkedHashMap<>();
        snapshotMap.put("planId", plan.getId());
        snapshotMap.put("planName", plan.getName());
        snapshotMap.put("planTier", plan.getTierLevel());
        snapshotMap.put("currency", targetCurrency);
        snapshotMap.put("billingCycle", isAnnual ? "annual" : "monthly");
        snapshotMap.put("transitionType", transitionType);
        snapshotMap.put("isCoTerm", isCoTerm);
        snapshotMap.put("isProrated", prorationCredit.compareTo(BigDecimal.ZERO) > 0);
        snapshotMap.put("prorationCredit", prorationCredit);
        snapshotMap.put("leftoverCredit", leftoverCredit != null ? leftoverCredit : BigDecimal.ZERO);
        snapshotMap.put("previousPlanId", previousPlanId);
        snapshotMap.put("previousPlanName", previousPlanName);
        snapshotMap.put("previousPlanPrice", previousPlanPrice);
        snapshotMap.put("remainingDays", remainingDays);
        if (upgradeQuote != null) {
            snapshotMap.put("totalDays", upgradeQuote.getTotalDays());
            snapshotMap.put("usedDays", upgradeQuote.getUsedDays());
            if (upgradeQuote.getProratedTargetCharge() != null) {
                snapshotMap.put("proratedTargetCharge", upgradeQuote.getProratedTargetCharge());
            }
        }
        if (calculatedNewPeriodEnd != null) {
            snapshotMap.put("newPeriodEnd", calculatedNewPeriodEnd.toString());
        }
        if (previousPeriodEnd != null) {
            snapshotMap.put("previousPeriodEnd", previousPeriodEnd.toString());
        }
        snapshotMap.put("targetPlanPrice", baseSubtotal);
        snapshotMap.put("baseSubtotal", taxableBase);
        snapshotMap.put("grossPlanPrice", baseSubtotal);
        snapshotMap.put("couponDiscountAmount", couponDiscountAmount);
        snapshotMap.put("appliedCoupon", appliedCouponCode != null ? appliedCouponCode : "none");
        snapshotMap.put("taxInclusive", true);
        snapshotMap.put("gstRate", isUsd ? 0 : 18);
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
        Instant endDate = (calculatedNewPeriodEnd != null)
                ? calculatedNewPeriodEnd
                : (isAnnual ? startDate.plus(365, ChronoUnit.DAYS) : startDate.plus(1, ChronoUnit.DAYS));

        Subscription pendingSubscription = Subscription.builder()
                .userId(userId)
                .plan(plan)
                .currency(targetCurrency)
                .status(Subscription.SubscriptionStatus.payment_pending)
                .provider(Subscription.PaymentProvider.valueOf(provider.getProviderName().toLowerCase()))
                .providerSubscriptionId(providerResponse.getRazorpayOrderId() != null ? providerResponse.getRazorpayOrderId() : providerResponse.getOrderId())
                .currentPeriodStart(startDate)
                .currentPeriodEnd(endDate)
                .baseAmount(taxableBase)
                .taxAmount(gstAmount)
                .totalAmount(totalAmount)
                .prorationCredit(prorationCredit)
                .planSnapshot(planSnapshotJson)
                .build();

        pendingSubscription = subscriptionRepository.save(pendingSubscription);
        System.out.println("  💾 [PostgreSQL Save] Created pending subscription record: ID=" + pendingSubscription.getId()
                + " | Currency=" + targetCurrency + " | Status=payment_pending | ProviderOrderId=" + pendingSubscription.getProviderSubscriptionId());

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
        Map<String, Object> snapshot = new java.util.HashMap<>();
        if (subscription.getPlanSnapshot() != null) {
            try {
                snapshot = objectMapper.readValue(subscription.getPlanSnapshot(), Map.class);
            } catch (Exception ignored) {}
        }

        boolean isAnnual = snapshot.get("billingCycle") != null && "annual".equalsIgnoreCase((String) snapshot.get("billingCycle"));
        boolean isCoTerm = Boolean.TRUE.equals(snapshot.get("isCoTerm"));
        String newPeriodEndStr = (String) snapshot.get("newPeriodEnd");
        String previousPeriodEndStr = (String) snapshot.get("previousPeriodEnd");

        Instant periodEnd;
        if (newPeriodEndStr != null) {
            try {
                periodEnd = Instant.parse(newPeriodEndStr);
            } catch (Exception e) {
                periodEnd = isAnnual ? now.plus(365, ChronoUnit.DAYS) : now.plus(1, ChronoUnit.DAYS);
            }
        } else if (subscription.getCurrentPeriodEnd() != null && subscription.getCurrentPeriodEnd().isAfter(now)) {
            periodEnd = subscription.getCurrentPeriodEnd();
        } else {
            periodEnd = isAnnual ? now.plus(365, ChronoUnit.DAYS) : now.plus(1, ChronoUnit.DAYS);
        }

        subscription.setStatus(Subscription.SubscriptionStatus.active);
        subscription.setCurrentPeriodStart(now);
        subscription.setCurrentPeriodEnd(periodEnd);
        subscription.setStatusChangedAt(now);
        subscription.setStatusChangedBy("payment_verification");
        subscription = subscriptionRepository.save(subscription);

        System.out.println("  🎉 [Subscription Activated] State transitioned to ACTIVE. Valid until: " + periodEnd);

        // If coupon applied, increment redemption
        String appliedCoupon = (String) snapshot.get("appliedCoupon");
        if (appliedCoupon != null && !"none".equalsIgnoreCase(appliedCoupon)) {
            couponService.incrementRedemption(appliedCoupon);
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
            String transitionType = "NEW_SUBSCRIPTION";
            BigDecimal prorationCredit = BigDecimal.ZERO;
            BigDecimal couponDiscountAmount = BigDecimal.ZERO;
            String previousPlanName = null;
            Object remainingDays = null;
            BigDecimal targetPlanPrice = subscription.getTotalAmount();
            BigDecimal previousPlanPrice = null;
            BigDecimal proratedTargetCharge = null;

            if (!snapshot.isEmpty()) {
                if (snapshot.get("customerName") != null && !((String) snapshot.get("customerName")).isBlank()) {
                    customerName = (String) snapshot.get("customerName");
                }
                if (snapshot.get("customerEmail") != null && !((String) snapshot.get("customerEmail")).isBlank()) {
                    customerEmail = (String) snapshot.get("customerEmail");
                }
                if (snapshot.get("customerGstin") != null && !((String) snapshot.get("customerGstin")).isBlank()) {
                    customerGstin = (String) snapshot.get("customerGstin");
                }
                if (snapshot.get("planName") != null) {
                    planName = (String) snapshot.get("planName");
                }
                if (snapshot.get("billingCycle") != null) {
                    billingCycle = ((String) snapshot.get("billingCycle")).toUpperCase();
                }
                if (snapshot.get("transitionType") != null) {
                    transitionType = (String) snapshot.get("transitionType");
                }
                if (snapshot.get("prorationCredit") != null) {
                    prorationCredit = new BigDecimal(snapshot.get("prorationCredit").toString());
                }
                if (snapshot.get("couponDiscountAmount") != null) {
                    couponDiscountAmount = new BigDecimal(snapshot.get("couponDiscountAmount").toString());
                }
                if (snapshot.get("previousPlanName") != null) {
                    previousPlanName = (String) snapshot.get("previousPlanName");
                }
                if (snapshot.get("previousPlanPrice") != null) {
                    previousPlanPrice = new BigDecimal(snapshot.get("previousPlanPrice").toString());
                }
                if (snapshot.get("remainingDays") != null) {
                    remainingDays = snapshot.get("remainingDays");
                }
                if (snapshot.get("targetPlanPrice") != null) {
                    targetPlanPrice = new BigDecimal(snapshot.get("targetPlanPrice").toString());
                }
                if (snapshot.get("proratedTargetCharge") != null) {
                    proratedTargetCharge = new BigDecimal(snapshot.get("proratedTargetCharge").toString());
                }
            }

            if (customerName == null || customerName.isBlank() || "anonymous".equalsIgnoreCase(customerName)) {
                customerName = "SuviX Creator (" + subscription.getUserId().substring(0, Math.min(8, subscription.getUserId().length())) + ")";
            }
            if (customerEmail == null || customerEmail.isBlank() || "anonymous@suvix.in".equalsIgnoreCase(customerEmail)) {
                customerEmail = subscription.getUserId() + "@suvix.in";
            }

            boolean isSubscriptionUsd = "USD".equalsIgnoreCase(subscription.getCurrency());
            boolean isUpgradeInvoice = prorationCredit.compareTo(BigDecimal.ZERO) > 0 || "UPGRADE_COTERM".equalsIgnoreCase(transitionType);

            // Build structured multi-line item list
            List<Map<String, Object>> itemsList = new ArrayList<>();
            BigDecimal effectiveTargetCharge = (isUpgradeInvoice && proratedTargetCharge != null) ? proratedTargetCharge : targetPlanPrice;
            BigDecimal targetTaxable = isSubscriptionUsd
                    ? effectiveTargetCharge
                    : effectiveTargetCharge.divide(new BigDecimal("1.18"), 2, RoundingMode.HALF_UP);
            BigDecimal targetTax = effectiveTargetCharge.subtract(targetTaxable);

            // Item 1: Main / Upgraded Plan
            String planDescription = isUpgradeInvoice
                    ? "SuviX " + planName + " Access (Prorated for " + (remainingDays != null ? remainingDays : 29) + " days remaining)"
                    : "SuviX " + planName + " Subscription (" + billingCycle + " Access)";

            Map<String, Object> mainItem = new LinkedHashMap<>();
            mainItem.put("description", planDescription);
            mainItem.put("sacCode", "998439");
            mainItem.put("quantity", 1);
            mainItem.put("unitRate", effectiveTargetCharge);
            mainItem.put("taxableAmount", targetTaxable);
            mainItem.put("taxAmount", targetTax);
            mainItem.put("grossAmount", effectiveTargetCharge);
            mainItem.put("type", "PLAN");
            itemsList.add(mainItem);

            // Item 2: Proration Unused Balance Credit
            if (prorationCredit.compareTo(BigDecimal.ZERO) > 0) {
                String prevName = previousPlanName != null ? previousPlanName : "Previous Plan";
                String prorationDesc = "Less: Unused Credit for " + prevName
                        + " (Original: ₹" + (previousPlanPrice != null ? previousPlanPrice : "499.00")
                        + (remainingDays != null ? ", " + remainingDays + " days unused" : "") + ")";
                BigDecimal creditTaxable = isSubscriptionUsd
                        ? prorationCredit
                        : prorationCredit.divide(new BigDecimal("1.18"), 2, RoundingMode.HALF_UP);
                BigDecimal creditTax = prorationCredit.subtract(creditTaxable);

                Map<String, Object> prorationItem = new LinkedHashMap<>();
                prorationItem.put("description", prorationDesc);
                prorationItem.put("sacCode", "-");
                prorationItem.put("quantity", 1);
                prorationItem.put("unitRate", prorationCredit.negate());
                prorationItem.put("taxableAmount", creditTaxable.negate());
                prorationItem.put("taxAmount", creditTax.negate());
                prorationItem.put("grossAmount", prorationCredit.negate());
                prorationItem.put("type", "PRORATION");
                itemsList.add(prorationItem);
            }

            // Item 3: Promotional Coupon Discount
            if (couponDiscountAmount.compareTo(BigDecimal.ZERO) > 0) {
                String cCode = appliedCoupon != null ? appliedCoupon : "PROMO";
                BigDecimal couponTaxable = isSubscriptionUsd
                        ? couponDiscountAmount
                        : couponDiscountAmount.divide(new BigDecimal("1.18"), 2, RoundingMode.HALF_UP);
                BigDecimal couponTax = couponDiscountAmount.subtract(couponTaxable);

                Map<String, Object> couponItem = new LinkedHashMap<>();
                couponItem.put("description", "Promotional Coupon Discount (" + cCode + ")");
                couponItem.put("sacCode", "-");
                couponItem.put("quantity", 1);
                couponItem.put("unitRate", couponDiscountAmount.negate());
                couponItem.put("taxableAmount", couponTaxable.negate());
                couponItem.put("taxAmount", couponTax.negate());
                couponItem.put("grossAmount", couponDiscountAmount.negate());
                couponItem.put("type", "COUPON");
                itemsList.add(couponItem);
            }

            // Item 4: Upgrade Metadata Details
            if (isUpgradeInvoice) {
                Map<String, Object> upgradeMeta = new LinkedHashMap<>();
                upgradeMeta.put("type", "UPGRADE_METADATA");
                upgradeMeta.put("fromPlanName", previousPlanName != null ? previousPlanName : "Creator Pro");
                upgradeMeta.put("fromPlanPrice", previousPlanPrice != null ? previousPlanPrice : new BigDecimal("499.00"));
                upgradeMeta.put("toPlanName", planName);
                upgradeMeta.put("toPlanPrice", targetPlanPrice);
                upgradeMeta.put("proratedTargetCharge", effectiveTargetCharge);
                upgradeMeta.put("unusedCredit", prorationCredit);
                upgradeMeta.put("remainingDays", remainingDays != null ? remainingDays : 1);
                upgradeMeta.put("totalDays", snapshot.get("totalDays") != null ? snapshot.get("totalDays") : 1);
                upgradeMeta.put("usedDays", snapshot.get("usedDays") != null ? snapshot.get("usedDays") : 0);
                upgradeMeta.put("validUntil", periodEnd.toString());
                upgradeMeta.put("netCharged", subscription.getTotalAmount());
                itemsList.add(upgradeMeta);
            }

            String lineItemsJson = objectMapper.writeValueAsString(itemsList);

            Invoice invoice = Invoice.builder()
                    .invoiceNumber(invoiceNumber)
                    .userId(subscription.getUserId())
                    .customerName(customerName)
                    .customerEmail(customerEmail)
                    .customerGstin(customerGstin)
                    .subtotal(subscription.getBaseAmount())
                    .taxRate(isSubscriptionUsd ? BigDecimal.ZERO : new BigDecimal("18.00"))
                    .taxAmount(subscription.getTaxAmount())
                    .totalAmount(subscription.getTotalAmount())
                    .currency(subscription.getCurrency() != null ? subscription.getCurrency() : "INR")
                    .transactionId(transaction.getId())
                    .subscriptionId(subscription.getId())
                    .status(Invoice.InvoiceStatus.paid)
                    .invoiceDate(LocalDate.now())
                    .paidAt(now)
                    .isProrated(prorationCredit.compareTo(BigDecimal.ZERO) > 0)
                    .prorationCredit(prorationCredit)
                    .provider(subscription.getProvider() != null ? subscription.getProvider().name() : "razorpay")
                    .providerInvoiceId(providerPaymentId)
                    .lineItems(lineItemsJson)
                    .build();

            invoice = invoiceRepository.save(invoice);
            String displayCurr = isSubscriptionUsd ? "$" : "₹";
            System.out.println("  🧾 [GST Invoice Generated] Invoice No: " + invoice.getInvoiceNumber()
                    + " | Plan: " + planName
                    + " | Transition: " + transitionType
                    + " | Total: " + displayCurr + invoice.getTotalAmount());

            // Record Immutable Subscription Transition Audit Trail
            try {
                Instant prevEndInstant = null;
                if (previousPeriodEndStr != null) {
                    try {
                        prevEndInstant = Instant.parse(previousPeriodEndStr);
                    } catch (Exception ignored) {}
                }

                String prevPlanId = (String) snapshot.get("previousPlanId");
                BigDecimal leftoverCreditVal = snapshot.get("leftoverCredit") != null
                        ? new BigDecimal(snapshot.get("leftoverCredit").toString())
                        : BigDecimal.ZERO;

                com.suvix.payment.domain.subscription.entity.SubscriptionTransition transition =
                        com.suvix.payment.domain.subscription.entity.SubscriptionTransition.builder()
                                .subscriptionId(subscription.getId())
                                .userId(subscription.getUserId())
                                .transitionType(transitionType != null ? transitionType : "NEW_SUBSCRIPTION")
                                .fromPlanId(prevPlanId != null ? prevPlanId : "none")
                                .toPlanId(subscription.getPlan() != null ? subscription.getPlan().getId() : "unknown")
                                .prorationCreditCalculated(prorationCredit)
                                .prorationCreditApplied(prorationCredit)
                                .leftoverCreditGenerated(leftoverCreditVal)
                                .grossTargetPrice(targetPlanPrice)
                                .couponDiscountApplied(couponDiscountAmount)
                                .couponCode(appliedCoupon)
                                .netAmountCharged(subscription.getTotalAmount())
                                .amountInPaise(subscription.getTotalAmount().multiply(BigDecimal.valueOf(100)).longValue())
                                .currency(subscription.getCurrency() != null ? subscription.getCurrency() : "INR")
                                .invoiceId(invoice.getId())
                                .previousPeriodEnd(prevEndInstant)
                                .newPeriodEnd(periodEnd)
                                .metadata(subscription.getPlanSnapshot())
                                .build();

                transitionRepository.save(transition);
                System.out.println("  📋 [Transition Audit Logged] ID=" + transition.getId() + " | Type=" + transition.getTransitionType());

                // Handle Rollover Leftover Credit if credit exceeded target price
                if (leftoverCreditVal.compareTo(BigDecimal.ZERO) > 0) {
                    final String subUserId = subscription.getUserId();
                    com.suvix.payment.domain.subscription.entity.CustomerCreditBalance creditBalance =
                            creditBalanceRepository.findByUserId(subUserId)
                                    .orElseGet(() -> com.suvix.payment.domain.subscription.entity.CustomerCreditBalance.builder()
                                            .userId(subUserId)
                                            .balanceAmount(BigDecimal.ZERO)
                                            .currency("INR")
                                            .build());
                    creditBalance.setBalanceAmount(creditBalance.getBalanceAmount().add(leftoverCreditVal));
                    creditBalanceRepository.save(creditBalance);
                    log.info("Saved leftover proration credit of ₹{} to user {} credit balance", leftoverCreditVal, subUserId);
                }
            } catch (Exception e) {
                log.warn("Failed to record subscription transition audit: {}", e.getMessage());
            }

            // If upgrade, mark older active subscriptions as cancelled/superseded
            if ((transitionType != null && transitionType.startsWith("UPGRADE")) || prorationCredit.compareTo(BigDecimal.ZERO) > 0) {
                List<Subscription> userSubs = subscriptionRepository.findByUserIdOrderByCreatedAtDesc(subscription.getUserId());
                for (Subscription s : userSubs) {
                    if (!s.getId().equals(subscription.getId()) && s.getStatus() == Subscription.SubscriptionStatus.active) {
                        s.setStatus(Subscription.SubscriptionStatus.cancelled);
                        s.setStatusChangeReason("Upgraded to " + planName);
                        subscriptionRepository.save(s);
                        System.out.println("  🔄 [Subscription Replaced] Marked prior subscription " + s.getId() + " as CANCELLED (Upgraded to " + planName + ")");
                    }
                }
            }

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
