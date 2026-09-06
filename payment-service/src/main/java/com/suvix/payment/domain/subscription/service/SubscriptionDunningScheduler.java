package com.suvix.payment.domain.subscription.service;

import com.suvix.payment.domain.subscription.entity.Subscription;
import com.suvix.payment.domain.subscription.repository.SubscriptionRepository;
import com.suvix.payment.infrastructure.messaging.OutboxEvent;
import com.suvix.payment.infrastructure.messaging.OutboxEventRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class SubscriptionDunningScheduler {

    private final SubscriptionRepository subscriptionRepository;
    private final OutboxEventRepository outboxRepository;
    private final FeatureEntitlementService entitlementService;

    /**
     * Runs every 10 minutes to find past_due subscriptions where the 7-day grace period has expired
     * Transitions them to 'unpaid' and revokes access.
     */
    @Scheduled(fixedDelay = 600000)
    @Transactional
    public void processExpiredGracePeriods() {
        List<Subscription> pastDueSubs = subscriptionRepository.findAll().stream()
                .filter(s -> s.getStatus() == Subscription.SubscriptionStatus.past_due)
                .filter(s -> s.getGracePeriodEndsAt() != null && s.getGracePeriodEndsAt().isBefore(Instant.now()))
                .toList();

        if (pastDueSubs.isEmpty()) {
            return;
        }

        log.info("Found {} subscriptions with expired grace periods to transition to unpaid", pastDueSubs.size());

        for (Subscription sub : pastDueSubs) {
            sub.setStatus(Subscription.SubscriptionStatus.unpaid);
            sub.setStatusChangeReason("Grace period expired. Maximum dunning retries exhausted.");
            subscriptionRepository.save(sub);

            // Invalidate Redis entitlement cache
            entitlementService.invalidateEntitlements(sub.getUserId());

            // Save Outbox Event for account downgrade / notification
            OutboxEvent event = OutboxEvent.builder()
                    .aggregateType("SUBSCRIPTION")
                    .aggregateId(sub.getId().toString())
                    .eventType("SUBSCRIPTION_UNPAID")
                    .topic("subscription.events")
                    .payload(String.format("{\"subscriptionId\":\"%s\",\"userId\":\"%s\",\"reason\":\"Grace period expired\"}",
                            sub.getId(), sub.getUserId()))
                    .status(OutboxEvent.OutboxStatus.PENDING)
                    .build();
            outboxRepository.save(event);

            log.info("Subscription id={} transitioned to UNPAID after grace period expiry", sub.getId());
        }
    }
}