package com.suvix.payment.domain.subscription.service;

import com.suvix.payment.domain.subscription.entity.Subscription;
import com.suvix.payment.domain.subscription.repository.SubscriptionReconciliationAuditRepository;
import com.suvix.payment.domain.subscription.repository.SubscriptionRepository;
import io.micrometer.core.instrument.Gauge;
import io.micrometer.core.instrument.MeterRegistry;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class SubscriptionMetricsService {

    private final MeterRegistry meterRegistry;
    private final SubscriptionRepository subscriptionRepository;
    private final SubscriptionReconciliationAuditRepository auditRepository;

    @PostConstruct
    public void registerSubscriptionMetrics() {
        log.info("Registering Prometheus Subscription Micrometer Gauges...");

        // 1. Total Active Subscribers
        Gauge.builder("subscription.active.total", this, SubscriptionMetricsService::countActiveSubscriptions)
                .description("Total number of active subscribers across all roles")
                .register(meterRegistry);

        // 2. Monthly Recurring Revenue (MRR in INR)
        Gauge.builder("subscription.mrr.inr", this, SubscriptionMetricsService::calculateTotalMrr)
                .description("Current platform Monthly Recurring Revenue in INR")
                .register(meterRegistry);

        // 3. Total Reconciliation Discrepancies
        Gauge.builder("subscription.reconciliation.discrepancies.total", this, SubscriptionMetricsService::countTotalDiscrepancies)
                .description("Total number of subscription state discrepancies detected")
                .register(meterRegistry);
    }

    private double countActiveSubscriptions() {
        return subscriptionRepository.countByStatus(Subscription.SubscriptionStatus.active);
    }

    private double calculateTotalMrr() {
        List<Subscription> activeSubs = subscriptionRepository.findByStatus(Subscription.SubscriptionStatus.active);
        BigDecimal totalMrr = BigDecimal.ZERO;

        for (Subscription s : activeSubs) {
            if (s.getPlan() != null && s.getPlan().getPriceMonthly() != null) {
                totalMrr = totalMrr.add(s.getPlan().getPriceMonthly());
            }
        }
        return totalMrr.doubleValue();
    }

    private double countTotalDiscrepancies() {
        return auditRepository.count();
    }
}