package com.suvix.payment.infrastructure.messaging;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class TransactionalOutboxScheduler {

    private final OutboxEventRepository outboxRepository;
    private final KafkaTemplate<String, String> kafkaTemplate;

    /**
     * Runs every 3 seconds to publish pending outbox events to Kafka
     * Guarantees at-least-once delivery (Transactional Outbox Pattern)
     */
    @Scheduled(fixedDelay = 3000)
    public void publishPendingOutboxEvents() {
        List<OutboxEvent> pendingEvents = outboxRepository.findByStatusOrderByCreatedAtAsc(
                OutboxEvent.OutboxStatus.PENDING, PageRequest.of(0, 50)
        );

        if (pendingEvents.isEmpty()) {
            return;
        }

        log.debug("Found {} pending outbox events to publish", pendingEvents.size());

        for (OutboxEvent event : pendingEvents) {
            publishSingleEvent(event);
        }
    }

    @Transactional
    public void publishSingleEvent(OutboxEvent event) {
        try {
            // Send to Kafka using aggregateId as the partition key to preserve ordering per entity
            kafkaTemplate.send(event.getTopic(), event.getAggregateId(), event.getPayload())
                    .whenComplete((result, ex) -> {
                        if (ex == null) {
                            event.setStatus(OutboxEvent.OutboxStatus.PUBLISHED);
                            event.setPublishedAt(Instant.now());
                            outboxRepository.save(event);
                            log.info("Published outbox event [{}] to topic [{}]", event.getEventType(), event.getTopic());
                        } else {
                            handlePublishFailure(event, ex);
                        }
                    });
        } catch (Exception e) {
            handlePublishFailure(event, e);
        }
    }

    private void handlePublishFailure(OutboxEvent event, Throwable ex) {
        log.warn("Failed to publish outbox event id={}: {}", event.getId(), ex.getMessage());
        event.setRetryCount(event.getRetryCount() + 1);
        event.setErrorMessage(ex.getMessage());
        if (event.getRetryCount() >= 3) {
            event.setStatus(OutboxEvent.OutboxStatus.FAILED);
            log.error("Outbox event id={} marked as FAILED after {} retries", event.getId(), event.getRetryCount());
        }
        outboxRepository.save(event);
    }
}