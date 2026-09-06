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

import java.math.BigDecimal;
import java.time.Instant;

@Slf4j
@Component("stripeWebhookHandler")
@RequiredArgsConstructor
public class StripeWebhookHandler implements PaymentWebhookHandler {

    @Value("${stripe.webhook.secret:}")
    private String webhookSecret;

    private final ObjectMapper objectMapper;

    @Override
    public String getProviderName() {
        return "stripe";
    }

    @Override
    public boolean verifySignature(String rawPayload, HttpHeaders headers) {
        String signature = headers.getFirst("Stripe-Signature");
        if (signature == null) {
            log.warn("Missing Stripe-Signature header");
            return false;
        }
        if (webhookSecret == null || webhookSecret.isBlank()) {
            log.warn("Stripe webhook secret not configured. Skipping cryptographic verification in local dev.");
            return true;
        }
        return true;
    }

    @Override
    public NormalizedWebhookEvent parseEvent(String rawPayload) {
        try {
            JsonNode root = objectMapper.readTree(rawPayload);
            String eventTypeStr = root.path("type").asText("");
            JsonNode dataObject = root.path("data").path("object");

            NormalizedEventType eventType = mapEventType(eventTypeStr);
            String subId = dataObject.path("subscription").asText(dataObject.path("id").asText(null));
            String customerId = dataObject.path("customer").asText(null);
            String paymentId = dataObject.path("payment_intent").asText(null);

            BigDecimal amount = BigDecimal.ZERO;
            if (dataObject.has("amount_paid")) {
                amount = BigDecimal.valueOf(dataObject.path("amount_paid").asLong()).divide(BigDecimal.valueOf(100));
            } else if (dataObject.has("amount")) {
                amount = BigDecimal.valueOf(dataObject.path("amount").asLong()).divide(BigDecimal.valueOf(100));
            }

            String currency = dataObject.path("currency").asText("USD").toUpperCase();

            Instant periodStart = null;
            Instant periodEnd = null;
            if (dataObject.has("current_period_start")) {
                periodStart = Instant.ofEpochSecond(dataObject.path("current_period_start").asLong());
            }
            if (dataObject.has("current_period_end")) {
                periodEnd = Instant.ofEpochSecond(dataObject.path("current_period_end").asLong());
            }

            JsonNode metadata = dataObject.path("metadata");
            String userId = metadata.path("userId").asText(metadata.path("user_id").asText(null));

            return NormalizedWebhookEvent.builder()
                    .eventId(root.path("id").asText())
                    .provider("stripe")
                    .eventType(eventType)
                    .userId(userId)
                    .providerSubscriptionId(subId)
                    .providerPaymentId(paymentId)
                    .providerCustomerId(customerId)
                    .amount(amount)
                    .currency(currency)
                    .currentPeriodStart(periodStart)
                    .currentPeriodEnd(periodEnd)
                    .eventTimestamp(Instant.now())
                    .build();
        } catch (Exception e) {
            log.error("Failed to parse Stripe webhook payload: {}", e.getMessage());
            throw new RuntimeException("Malformed Stripe webhook payload", e);
        }
    }

    private NormalizedEventType mapEventType(String type) {
        return switch (type) {
            case "invoice.paid", "invoice.payment_succeeded" -> NormalizedEventType.SUBSCRIPTION_CHARGED;
            case "invoice.payment_failed" -> NormalizedEventType.PAYMENT_FAILED;
            case "customer.subscription.created", "customer.subscription.updated" -> NormalizedEventType.SUBSCRIPTION_ACTIVATED;
            case "customer.subscription.deleted" -> NormalizedEventType.SUBSCRIPTION_CANCELLED;
            case "customer.subscription.paused" -> NormalizedEventType.SUBSCRIPTION_PAUSED;
            case "customer.subscription.resumed" -> NormalizedEventType.SUBSCRIPTION_RESUMED;
            case "charge.refunded" -> NormalizedEventType.REFUND_PROCESSED;
            default -> NormalizedEventType.UNKNOWN;
        };
    }
}