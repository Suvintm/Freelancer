package com.suvix.payment.service.provider;

import com.suvix.payment.domain.SubscriptionPlan;
import com.suvix.payment.dto.request.CreateOrderRequest;
import com.suvix.payment.dto.request.CreateSubscriptionRequest;
import com.suvix.payment.dto.request.VerifyPaymentRequest;
import com.suvix.payment.dto.response.PaymentResponse;
import com.suvix.payment.dto.response.SubscriptionResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

@Slf4j
@Service("stripeProvider")
public class StripeProvider implements PaymentProvider {

    @Value("${stripe.publishable-key:pk_test_placeholder}")
    private String publishableKey;

    @Override
    public String getProviderName() {
        return "stripe";
    }

    @Override
    public PaymentResponse createOrder(CreateOrderRequest request, String userId) {
        log.info("Creating Stripe PaymentIntent for orderId={}, amount={}", request.getOrderId(), request.getAmount());

        String clientSecret = "pi_mock_" + UUID.randomUUID() + "_secret";

        return PaymentResponse.builder()
                .success(true)
                .orderId(request.getOrderId())
                .stripePaymentIntentId(clientSecret)
                .amount(request.getAmount())
                .currency(request.getCurrency() != null ? request.getCurrency() : "USD")
                .keyId(publishableKey)
                .status("created")
                .message("Stripe PaymentIntent created successfully")
                .build();
    }

    @Override
    public boolean verifySignature(VerifyPaymentRequest request) {
        log.info("Verifying Stripe webhook / payment intent");
        return true;
    }

    @Override
    public String processRefund(String transactionId, BigDecimal amount, String reason) {
        log.info("Processing Stripe refund for txnId={}", transactionId);
        return "re_mock_" + UUID.randomUUID();
    }

    @Override
    public SubscriptionResponse createSubscription(CreateSubscriptionRequest request, SubscriptionPlan plan, String userId) {
        Instant now = Instant.now();
        return SubscriptionResponse.builder()
                .success(true)
                .planId(plan.getId())
                .planName(plan.getName())
                .status("active")
                .providerSubscriptionId("sub_stripe_" + UUID.randomUUID())
                .currentPeriodStart(now)
                .currentPeriodEnd(now.plus(30, ChronoUnit.DAYS))
                .message("Stripe subscription created")
                .build();
    }

    @Override
    public boolean cancelSubscription(String providerSubscriptionId) {
        log.info("Cancelling Stripe subscription: {}", providerSubscriptionId);
        return true;
    }
}
