package com.suvix.payment.domain.payment.webhook.provider;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.suvix.payment.domain.payment.webhook.NormalizedEventType;
import com.suvix.payment.domain.payment.webhook.NormalizedWebhookEvent;
import com.suvix.payment.domain.payment.webhook.PaymentWebhookHandler;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Component;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.Instant;

@Slf4j
@Component("razorpayWebhookHandler")
@RequiredArgsConstructor
public class RazorpayWebhookHandler implements PaymentWebhookHandler {

    @Value("${razorpay.webhook.secret:${razorpay.key.secret:}}")
    private String webhookSecret;

    private final ObjectMapper objectMapper;

    @Override
    public String getProviderName() {
        return "razorpay";
    }

    @Override
    public boolean verifySignature(String rawPayload, HttpHeaders headers) {
        String signature = headers.getFirst("X-Razorpay-Signature");
        if (signature == null) {
            log.warn("Missing Razorpay webhook signature header");
            return false;
        }

        if (webhookSecret == null || webhookSecret.isBlank()) {
            log.warn("Razorpay webhook secret not configured. Skipping cryptographic verification in local dev.");
            return true;
        }

        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            SecretKeySpec secretKey = new SecretKeySpec(webhookSecret.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
            mac.init(secretKey);
            byte[] hash = mac.doFinal(rawPayload.getBytes(StandardCharsets.UTF_8));
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            return hexString.toString().equalsIgnoreCase(signature);
        } catch (Exception e) {
            log.error("Error verifying Razorpay webhook signature: {}", e.getMessage());
            return false;
        }
    }

    @Override
    public NormalizedWebhookEvent parseEvent(String rawPayload) {
        try {
            JsonNode root = objectMapper.readTree(rawPayload);
            String eventName = root.path("event").asText("");
            JsonNode payloadNode = root.path("payload");

            NormalizedEventType eventType = mapEventType(eventName);
            JsonNode subEntity = payloadNode.path("subscription").path("entity");
            JsonNode paymentEntity = payloadNode.path("payment").path("entity");

            String subId = subEntity.path("id").asText(null);
            String paymentId = paymentEntity.path("id").asText(null);
            String customerId = subEntity.path("customer_id").asText(paymentEntity.path("customer_id").asText(null));
            String planId = subEntity.path("plan_id").asText(null);

            BigDecimal amount = BigDecimal.ZERO;
            if (paymentEntity.has("amount")) {
                amount = BigDecimal.valueOf(paymentEntity.path("amount").asLong()).divide(BigDecimal.valueOf(100));
            }

            String currency = paymentEntity.path("currency").asText("INR");
            String failureReason = paymentEntity.path("error_description").asText(null);

            Instant periodStart = null;
            Instant periodEnd = null;
            if (subEntity.has("current_start") && subEntity.path("current_start").asLong() > 0) {
                periodStart = Instant.ofEpochSecond(subEntity.path("current_start").asLong());
            }
            if (subEntity.has("current_end") && subEntity.path("current_end").asLong() > 0) {
                periodEnd = Instant.ofEpochSecond(subEntity.path("current_end").asLong());
            }

            JsonNode notesNode = subEntity.has("notes") ? subEntity.path("notes") : paymentEntity.path("notes");
            String userId = notesNode.path("userId").asText(notesNode.path("user_id").asText(null));

            return NormalizedWebhookEvent.builder()
                    .eventId(root.path("id").asText(subId + "_" + eventName))
                    .provider("razorpay")
                    .eventType(eventType)
                    .userId(userId)
                    .planId(planId)
                    .providerSubscriptionId(subId)
                    .providerPaymentId(paymentId)
                    .providerCustomerId(customerId)
                    .amount(amount)
                    .currency(currency)
                    .currentPeriodStart(periodStart)
                    .currentPeriodEnd(periodEnd)
                    .failureReason(failureReason)
                    .eventTimestamp(Instant.now())
                    .build();
        } catch (Exception e) {
            log.error("Failed to parse Razorpay webhook payload: {}", e.getMessage());
            throw new RuntimeException("Malformed Razorpay webhook payload", e);
        }
    }

    private NormalizedEventType mapEventType(String event) {
        return switch (event) {
            case "subscription.authenticated" -> NormalizedEventType.SUBSCRIPTION_AUTHENTICATED;
            case "subscription.activated" -> NormalizedEventType.SUBSCRIPTION_ACTIVATED;
            case "subscription.charged" -> NormalizedEventType.SUBSCRIPTION_CHARGED;
            case "subscription.pending" -> NormalizedEventType.SUBSCRIPTION_PENDING;
            case "subscription.halted" -> NormalizedEventType.SUBSCRIPTION_HALTED;
            case "subscription.cancelled" -> NormalizedEventType.SUBSCRIPTION_CANCELLED;
            case "subscription.paused" -> NormalizedEventType.SUBSCRIPTION_PAUSED;
            case "subscription.resumed" -> NormalizedEventType.SUBSCRIPTION_RESUMED;
            case "payment.authorized", "payment.captured" -> NormalizedEventType.PAYMENT_AUTHORIZED;
            case "payment.failed" -> NormalizedEventType.PAYMENT_FAILED;
            case "refund.processed" -> NormalizedEventType.REFUND_PROCESSED;
            default -> NormalizedEventType.UNKNOWN;
        };
    }
}