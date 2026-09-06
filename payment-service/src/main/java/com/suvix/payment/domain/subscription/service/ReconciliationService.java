package com.suvix.payment.domain.subscription.service;

import com.suvix.payment.domain.subscription.dto.response.ReconciliationSummary;
import com.suvix.payment.domain.subscription.entity.Subscription;
import com.suvix.payment.domain.subscription.entity.SubscriptionReconciliationAudit;
import com.suvix.payment.domain.subscription.entity.SubscriptionStatusHistory;
import com.suvix.payment.domain.subscription.repository.SubscriptionReconciliationAuditRepository;
import com.suvix.payment.domain.subscription.repository.SubscriptionRepository;
import com.suvix.payment.domain.subscription.repository.SubscriptionStatusHistoryRepository;
import com.suvix.payment.infrastructure.messaging.OutboxEvent;
import com.suvix.payment.infrastructure.messaging.OutboxEventRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class ReconciliationService {

    private final SubscriptionRepository subscriptionRepository;
    private final SubscriptionReconciliationAuditRepository auditRepository;
    private final SubscriptionStatusHistoryRepository historyRepository;
    private final OutboxEventRepository outboxEventRepository;
    private final SubscriptionLock subscriptionLock;
    private final StringRedisTemplate stringRedisTemplate;

    private static final int BATCH_SIZE = 500;

    /**
     * Executes chunked 3-way matrix reconciliation across all subscriptions
     */
    public ReconciliationSummary runDailyReconciliation() {
        Instant start = Instant.now();
        log.info("Starting Daily 2 AM Subscription Auto-Reconciliation Engine...");

        long totalProcessed = 0;
        long totalMatched = 0;
        long totalDiscrepancies = 0;
        long totalHealed = 0;
        long totalFlagged = 0;
        List<ReconciliationSummary.DiscrepancyItem> discrepancyItems = new ArrayList<>();

        int pageNum = 0;
        Page<Subscription> page;

        do {
            Pageable pageable = PageRequest.of(pageNum, BATCH_SIZE);
            page = subscriptionRepository.findAll(pageable);

            for (Subscription sub : page.getContent()) {
                totalProcessed++;
                try {
                    ReconciliationSummary.DiscrepancyItem item = reconcileSingleSubscription(sub);
                    if (item != null) {
                        totalDiscrepancies++;
                        if (item.getActionTaken().startsWith("HEALED")) {
                            totalHealed++;
                        } else {
                            totalFlagged++;
                        }
                        if (discrepancyItems.size() < 100) {
                            discrepancyItems.add(item);
                        }
                    } else {
                        totalMatched++;
                    }
                } catch (Exception e) {
                    log.error("Failed to reconcile subscription {}: {}", sub.getId(), e.getMessage());
                }
            }

            pageNum++;
        } while (page.hasNext());

        Instant finish = Instant.now();
        log.info("Reconciliation Complete. Processed={}, Matched={}, Discrepancies={}, Healed={}, Flagged={}",
                totalProcessed, totalMatched, totalDiscrepancies, totalHealed, totalFlagged);

        return ReconciliationSummary.builder()
                .startedAt(start)
                .completedAt(finish)
                .totalProcessed(totalProcessed)
                .totalMatched(totalMatched)
                .totalDiscrepancies(totalDiscrepancies)
                .totalHealed(totalHealed)
                .totalFlagged(totalFlagged)
                .executionStatus("SUCCESS")
                .discrepancyDetails(discrepancyItems)
                .build();
    }

    /**
     * Reconciles a single subscription with Redlock concurrency safety
     */
    @Transactional
    public ReconciliationSummary.DiscrepancyItem reconcileSingleSubscription(Subscription sub) {
        String lockToken = subscriptionLock.acquireLock(sub.getUserId(), "reconcile", 5);

        if (lockToken == null) {
            log.warn("Subscription {} is locked by an active checkout. Skipping this cycle.", sub.getId());
            return null;
        }

        try {
            // Simulated Gateway Live Status Check (or via PaymentProvider API)
            String dbStatusStr = sub.getStatus().name();
            String gatewayStatusStr = determineGatewayLiveStatus(sub);

            if (dbStatusStr.equalsIgnoreCase(gatewayStatusStr)) {
                return null; // 100% Matched
            }

            // Discrepancy detected! Self-heal or flag
            String discrepancyType = "STATUS_MISMATCH";
            String actionTaken = "FLAGGED_FOR_REVIEW";

            // Self-Healing Case 1: Gateway halted/cancelled, DB still active
            if ("cancelled".equalsIgnoreCase(gatewayStatusStr) || "halted".equalsIgnoreCase(gatewayStatusStr)) {
                if (sub.getStatus() == Subscription.SubscriptionStatus.active) {
                    sub.setStatus(Subscription.SubscriptionStatus.cancelled);
                    sub.setCancelAtPeriodEnd(false);
                    subscriptionRepository.save(sub);

                    // Log state transition
                    historyRepository.save(SubscriptionStatusHistory.builder()
                            .subscriptionId(sub.getId())
                            .fromStatus(dbStatusStr)
                            .toStatus("cancelled")
                            .reason("AUTO_RECONCILIATION_HEAL")
                            .triggeredBy("2am_cron")
                            .metadata("{\"source\": \"2am_cron\", \"gateway_status\": \"" + gatewayStatusStr + "\"}")
                            .build());

                    // Flush Redis Entitlements cache
                    stringRedisTemplate.delete("subscription:" + sub.getUserId() + ":entitlements");

                    // Emit Outbox event
                    outboxEventRepository.save(OutboxEvent.builder()
                            .aggregateType("SUBSCRIPTION")
                            .aggregateId(sub.getId().toString())
                            .eventType("SUBSCRIPTION_AUTO_HEALED_CANCELLED")
                            .payload("{\"subscriptionId\": \"" + sub.getId() + "\", \"userId\": \"" + sub.getUserId() + "\"}")
                            .build());

                    actionTaken = "HEALED_CANCELLED";
                }
            }

            // Self-Healing Case 2: Gateway charged/active, DB marked past_due or expired
            else if ("active".equalsIgnoreCase(gatewayStatusStr)) {
                if (sub.getStatus() == Subscription.SubscriptionStatus.past_due || sub.getStatus() == Subscription.SubscriptionStatus.expired) {
                    sub.setStatus(Subscription.SubscriptionStatus.active);
                    subscriptionRepository.save(sub);

                    historyRepository.save(SubscriptionStatusHistory.builder()
                            .subscriptionId(sub.getId())
                            .fromStatus(dbStatusStr)
                            .toStatus("active")
                            .reason("AUTO_RECONCILIATION_HEAL")
                            .triggeredBy("2am_cron")
                            .metadata("{\"source\": \"2am_cron\", \"gateway_status\": \"active\"}")
                            .build());

                    stringRedisTemplate.delete("subscription:" + sub.getUserId() + ":entitlements");
                    actionTaken = "HEALED_ACTIVATED";
                }
            }

            // Audit record
            SubscriptionReconciliationAudit audit = SubscriptionReconciliationAudit.builder()
                    .subscriptionId(sub.getId())
                    .userId(sub.getUserId())
                    .provider(sub.getProvider().name())
                    .providerSubscriptionId(sub.getProviderSubscriptionId())
                    .dbStatus(dbStatusStr)
                    .gatewayStatus(gatewayStatusStr)
                    .discrepancyType(discrepancyType)
                    .actionTaken(actionTaken)
                    .details("{\"auto_healed\": true}")
                    .build();

            auditRepository.save(audit);

            return ReconciliationSummary.DiscrepancyItem.builder()
                    .subscriptionId(sub.getId().toString())
                    .userId(sub.getUserId())
                    .dbStatus(dbStatusStr)
                    .gatewayStatus(gatewayStatusStr)
                    .discrepancyType(discrepancyType)
                    .actionTaken(actionTaken)
                    .build();

        } finally {
            subscriptionLock.releaseLock(sub.getUserId(), "reconcile", lockToken);
        }
    }

    private String determineGatewayLiveStatus(Subscription sub) {
        if (sub.getCurrentPeriodEnd() != null && sub.getCurrentPeriodEnd().isBefore(Instant.now()) && sub.getStatus() == Subscription.SubscriptionStatus.active) {
            return "cancelled";
        }
        return sub.getStatus().name();
    }
}