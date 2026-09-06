package com.suvix.payment.domain.subscription.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class ReconciliationScheduler {

    private final ReconciliationService reconciliationService;

    /**
     * Daily 2:00 AM Auto-Reconciliation Cron Job
     */
    @Scheduled(cron = "0 0 2 * * ?")
    public void runScheduled2AmReconciliation() {
        log.info("Triggering Daily 2:00 AM Auto-Reconciliation Job...");
        reconciliationService.runDailyReconciliation();
    }
}