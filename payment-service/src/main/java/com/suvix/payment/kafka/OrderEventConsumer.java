package com.suvix.payment.kafka;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.support.Acknowledgment;
import org.springframework.stereotype.Component;

/**
 * Kafka Consumer — listens to order.events topic.
 *
 * When Node.js publishes ORDER_COMPLETED (after order is finalised),
 * this service can handle any payment-related logic needed.
 *
 * Consumer group: payment-service-group
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class OrderEventConsumer {

    private final ObjectMapper objectMapper;

    @KafkaListener(
        topics = "order.events",
        groupId = "payment-service-group",
        containerFactory = "kafkaListenerContainerFactory"
    )
    public void handleOrderEvent(String message, Acknowledgment ack) {
        try {
            JsonNode event = objectMapper.readTree(message);
            String type    = event.get("type").asText();
            JsonNode payload = event.get("payload");

            log.info("Received order event: type={}", type);

            switch (type) {
                case "ORDER_COMPLETED" -> handleOrderCompleted(payload);
                case "ORDER_DISPUTED"  -> handleOrderDisputed(payload);
                case "ORDER_CANCELLED" -> handleOrderCancelled(payload);
                default -> log.debug("Ignored unhandled event type: {}", type);
            }

            // Manual commit — only acknowledge if processing succeeded
            ack.acknowledge();

        } catch (Exception e) {
            log.error("Failed to process order event: {}", e.getMessage(), e);
            // Do NOT acknowledge → Kafka will retry this message
        }
    }

    private void handleOrderCompleted(JsonNode payload) {
        String orderId  = payload.get("orderId").asText();
        String editorId = payload.get("editorId").asText();
        log.info("Order completed: orderId={}, editorId={}. Escrow now eligible for release.", orderId, editorId);
        // TODO Phase 2: Update Payment record status, trigger payout schedule
    }

    private void handleOrderDisputed(JsonNode payload) {
        String orderId = payload.get("orderId").asText();
        log.warn("Order disputed: orderId={}. Freezing escrow payment.", orderId);
        // TODO Phase 2: Freeze payment, flag for admin review
    }

    private void handleOrderCancelled(JsonNode payload) {
        String orderId = payload.get("orderId").asText();
        log.info("Order cancelled: orderId={}. Processing refund automatically.", orderId);
        // TODO Phase 2: Trigger refund processing logic
    }
}
