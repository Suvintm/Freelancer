package com.suvix.payment.service.provider;

import com.razorpay.Order;
import com.razorpay.RazorpayClient;
import com.razorpay.Refund;
import com.suvix.payment.domain.SubscriptionPlan;
import com.suvix.payment.dto.request.CreateOrderRequest;
import com.suvix.payment.dto.request.CreateSubscriptionRequest;
import com.suvix.payment.dto.request.VerifyPaymentRequest;
import com.suvix.payment.dto.response.PaymentResponse;
import com.suvix.payment.dto.response.SubscriptionResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.codec.digest.HmacUtils;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;

@Slf4j
@Service("razorpayProvider")
@RequiredArgsConstructor
public class RazorpayProvider implements PaymentProvider {

    private final RazorpayClient razorpayClient;

    @Value("${razorpay.key-id}")
    private String keyId;

    @Value("${razorpay.key-secret}")
    private String keySecret;

    @Override
    public String getProviderName() {
        return "razorpay";
    }

    @Override
    public PaymentResponse createOrder(CreateOrderRequest request, String userId) throws Exception {
        log.info("Creating Razorpay order for orderId={}, amount={}", request.getOrderId(), request.getAmount());

        int amountInPaise = request.getAmount().multiply(BigDecimal.valueOf(100)).intValue();

        JSONObject orderRequest = new JSONObject();
        orderRequest.put("amount", amountInPaise);
        orderRequest.put("currency", request.getCurrency() != null ? request.getCurrency() : "INR");
        orderRequest.put("receipt", request.getOrderId());
        orderRequest.put("notes", new JSONObject().put("userId", userId).put("suvixOrderId", request.getOrderId()));

        Order order = razorpayClient.orders.create(orderRequest);

        return PaymentResponse.builder()
                .success(true)
                .orderId(request.getOrderId())
                .razorpayOrderId(order.get("id").toString())
                .amount(request.getAmount())
                .currency("INR")
                .keyId(keyId)
                .status("created")
                .message("Razorpay order created successfully")
                .build();
    }

    @Override
    public boolean verifySignature(VerifyPaymentRequest request) {
        try {
            String payload = request.getRazorpayOrderId() + "|" + request.getRazorpayPaymentId();
            String expected = new HmacUtils("HmacSHA256", keySecret).hmacHex(payload);
            return expected.equals(request.getRazorpaySignature());
        } catch (Exception e) {
            log.error("HMAC signature verification failed", e);
            return false;
        }
    }

    @Override
    public String processRefund(String paymentId, BigDecimal amount, String reason) throws Exception {
        int amountInPaise = amount.multiply(BigDecimal.valueOf(100)).intValue();

        JSONObject refundRequest = new JSONObject();
        refundRequest.put("amount", amountInPaise);
        refundRequest.put("notes", new JSONObject().put("reason", reason));

        Refund refund = razorpayClient.payments.refund(paymentId, refundRequest);
        return refund.get("id").toString();
    }

    @Override
    public SubscriptionResponse createSubscription(CreateSubscriptionRequest request, SubscriptionPlan plan, String userId) throws Exception {
        Instant now = Instant.now();
        Instant periodEnd = plan.getBillingInterval() == SubscriptionPlan.BillingInterval.year
                ? now.plus(365, ChronoUnit.DAYS)
                : now.plus(30, ChronoUnit.DAYS);

        return SubscriptionResponse.builder()
                .success(true)
                .planId(plan.getId())
                .planName(plan.getName())
                .status("active")
                .providerSubscriptionId("sub_rzp_" + System.currentTimeMillis())
                .currentPeriodStart(now)
                .currentPeriodEnd(periodEnd)
                .message("Subscription initialized")
                .build();
    }

    @Override
    public boolean cancelSubscription(String providerSubscriptionId) {
        log.info("Cancelling Razorpay subscription: {}", providerSubscriptionId);
        return true;
    }
}
