package com.suvix.payment.kafka;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

/**
 * Kafka Producer — publishes payment events to Kafka topics.
 *
 * Other services (Notification Service, Analytics Service) will consume these events.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class PaymentProducer {

    private final KafkaTemplate<String, String> kafkaTemplate;
    private final ObjectMapper objectMapper;

    private static final String PAYMENT_EVENTS_TOPIC = "payment.events";

    /**
     * Publish event when payment is verified successfully.
     * Consumers: NotificationService (notify editor), AnalyticsService (update revenue stats)
     */
    public void publishPaymentVerified(String paymentId, String orderId, String clientId,
                                        String editorId, Double amount) {
        Map<String, Object> event = buildEvent("PAYMENT_VERIFIED", Map.of(
                "paymentId", paymentId,
                "orderId",   orderId,
                "clientId",  clientId,
                "editorId",  editorId,
                "amount",    amount
        ));
        publish(PAYMENT_EVENTS_TOPIC, event);
    }

    /**
     * Publish event when refund is processed.
     * Consumers: NotificationService, AnalyticsService
     */
    public void publishRefundProcessed(String orderId, String clientId, Double refundAmount, String refundId) {
        Map<String, Object> event = buildEvent("REFUND_PROCESSED", Map.of(
                "orderId",      orderId,
                "clientId",     clientId,
                "refundAmount", refundAmount,
                "refundId",     refundId
        ));
        publish(PAYMENT_EVENTS_TOPIC, event);
    }

    // ==================== HELPERS ====================

    private Map<String, Object> buildEvent(String type, Map<String, Object> payload) {
        Map<String, Object> event = new HashMap<>();
        event.put("eventId",   UUID.randomUUID().toString());
        event.put("type",      type);
        event.put("timestamp", Instant.now().toString());
        event.put("version",   "1.0");
        event.put("source",    "payment-service");
        event.put("payload",   payload);
        return event;
    }

    private void publish(String topic, Map<String, Object> event) {
        try {
            String json = objectMapper.writeValueAsString(event);
            kafkaTemplate.send(topic, json);
            log.info("Published Kafka event: type={} topic={}", event.get("type"), topic);
        } catch (Exception e) {
            // Log but don't throw — payment was already recorded in DB
            // TODO: Add a dead-letter retry mechanism for production
            log.error("Failed to publish Kafka event type={}: {}", event.get("type"), e.getMessage());
        }
    }
}
