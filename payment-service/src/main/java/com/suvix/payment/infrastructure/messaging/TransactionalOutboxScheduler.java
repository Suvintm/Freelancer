package com.suvix.payment.infrastructure.messaging;

import com.suvix.payment.infrastructure.messaging.OutboxEvent;
import com.suvix.payment.infrastructure.messaging.OutboxEventRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class TransactionalOutboxScheduler {

    private final OutboxEventRepository outboxRepository;
    private final KafkaTemplate<String, String> kafkaTemplate;

    /**
     * Runs every 5 seconds to publish pending outbox events to Kafka (Saga Pattern)
     */
    @Scheduled(fixedDelay = 5000)
    public void publishPendingOutboxEvents() {
        List<OutboxEvent> pendingEvents = outboxRepository.findPendingEventsForPublishing();

        if (pendingEvents.isEmpty()) {
            return;
        }

        for (OutboxEvent event : pendingEvents) {
            try {
                kafkaTemplate.send(event.getTopic(), event.getPartitionKey(), event.getPayload());
                event.setStatus(OutboxEvent.OutboxStatus.published);
                event.setPublishedAt(Instant.now());
                outboxRepository.save(event);
                log.info("Published outbox event id={} to topic={}", event.getId(), event.getTopic());
            } catch (Exception e) {
                log.warn("Failed to publish outbox event id={}: {}", event.getId(), e.getMessage());
                event.setRetryCount(event.getRetryCount() + 1);
                event.setErrorMessage(e.getMessage());
                if (event.getRetryCount() >= 5) {
                    event.setStatus(OutboxEvent.OutboxStatus.failed);
                }
                outboxRepository.save(event);
            }
        }
    }
}
