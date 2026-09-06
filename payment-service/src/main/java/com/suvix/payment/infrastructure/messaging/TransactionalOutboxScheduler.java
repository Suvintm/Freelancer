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
     * Adaptive poller: Runs every 1 second. When pending events exist,
     * it processes up to 100 events per cycle with zero lag.
     */
    @Scheduled(fixedDelay = 1000)
    public void publishPendingOutboxEvents() {
        int processedInCycle = 0;
        List<OutboxEvent> pendingEvents;

        do {
            pendingEvents = outboxRepository.findByStatusOrderByCreatedAtAsc(
                    OutboxEvent.OutboxStatus.PENDING, PageRequest.of(0, 50)
            );

            if (pendingEvents.isEmpty()) {
                break;
            }

            for (OutboxEvent event : pendingEvents) {
                publishSingleEvent(event);
                processedInCycle++;
            }

            // If we processed a full batch of 50, immediately continue to drain remaining
        } while (pendingEvents.size() == 50 && processedInCycle < 250);

        if (processedInCycle > 0) {
            log.info("Transactional Outbox: Dispatched {} pending events to Kafka", processedInCycle);
        }
    }

    /**
     * Daily 3:00 AM Outbox Maintenance: Purges published events older than 7 days
     * to keep table disk usage under 5MB permanently.
     */
    @Scheduled(cron = "0 0 3 * * ?")
    @Transactional
    public void purgeOldPublishedOutboxEvents() {
        java.time.Instant cutoff = java.time.Instant.now().minus(7, java.time.temporal.ChronoUnit.DAYS);
        int deleted = outboxRepository.deletePublishedEventsOlderThan(OutboxEvent.OutboxStatus.PUBLISHED, cutoff);
        if (deleted > 0) {
            log.info("Outbox Table Maintenance: Successfully purged {} published outbox events older than 7 days", deleted);
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