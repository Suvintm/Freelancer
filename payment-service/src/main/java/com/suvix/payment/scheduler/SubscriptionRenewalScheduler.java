package com.suvix.payment.scheduler;

import com.suvix.payment.domain.Subscription;
import com.suvix.payment.repository.SubscriptionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class SubscriptionRenewalScheduler {

    private final SubscriptionRepository subscriptionRepository;

    /**
     * Runs every hour to check subscriptions expiring within the next 24 hours
     */
    @Scheduled(cron = "0 0 * * * *")
    public void processUpcomingRenewals() {
        Instant cutoff = Instant.now().plus(24, ChronoUnit.HOURS);
        List<Subscription> dueSubscriptions = subscriptionRepository.findDueForRenewal(
                Subscription.SubscriptionStatus.active, cutoff
        );

        if (dueSubscriptions.isEmpty()) {
            return;
        }

        log.info("Found {} subscriptions due for renewal check", dueSubscriptions.size());
        for (Subscription sub : dueSubscriptions) {
            if (sub.isCancelAtPeriodEnd()) {
                log.info("Subscription {} cancelled at period end, expiring now", sub.getId());
                sub.setStatus(Subscription.SubscriptionStatus.expired);
                sub.setEndedAt(Instant.now());
                subscriptionRepository.save(sub);
            } else {
                log.info("Triggering renewal attempt for subscription {}", sub.getId());
            }
        }
    }
}
