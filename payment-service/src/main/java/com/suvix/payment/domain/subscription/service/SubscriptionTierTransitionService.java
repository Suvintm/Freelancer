package com.suvix.payment.domain.subscription.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.suvix.payment.domain.billing.entity.Invoice;
import com.suvix.payment.domain.billing.repository.InvoiceRepository;
import com.suvix.payment.domain.billing.service.InvoiceNumberGenerator;
import com.suvix.payment.domain.billing.service.InvoiceService;
import com.suvix.payment.domain.subscription.dto.request.DowngradeSubscriptionRequest;
import com.suvix.payment.domain.subscription.dto.request.PauseSubscriptionRequest;
import com.suvix.payment.domain.subscription.dto.request.UpgradeSubscriptionRequest;
import com.suvix.payment.domain.subscription.dto.response.ProrationCalculationResult;
import com.suvix.payment.domain.subscription.dto.response.SubscriptionResponse;
import com.suvix.payment.domain.subscription.entity.Subscription;
import com.suvix.payment.domain.subscription.entity.SubscriptionLedger;
import com.suvix.payment.domain.subscription.entity.SubscriptionPlan;
import com.suvix.payment.domain.subscription.repository.SubscriptionLedgerRepository;
import com.suvix.payment.domain.subscription.repository.SubscriptionPlanRepository;
import com.suvix.payment.domain.subscription.repository.SubscriptionRepository;
import com.suvix.payment.infrastructure.messaging.OutboxEvent;
import com.suvix.payment.infrastructure.messaging.OutboxEventRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.util.Map;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class SubscriptionTierTransitionService {

    private final SubscriptionRepository subscriptionRepository;
    private final SubscriptionPlanRepository planRepository;
    private final SubscriptionLedgerRepository ledgerRepository;
    private final InvoiceRepository invoiceRepository;
    private final InvoiceNumberGenerator invoiceNumberGenerator;
    private final ProrationCalculator prorationCalculator;
    private final FeatureEntitlementService entitlementService;
    private final SubscriptionLock subscriptionLock;
    private final OutboxEventRepository outboxRepository;
    private final InvoiceService invoiceService;
    private final ObjectMapper objectMapper;

    /**
     * Get upgrade preview quote with exact proration calculations
     */
    public ProrationCalculationResult quoteUpgrade(String userId, String targetPlanId) {
        SubscriptionPlan targetPlan = planRepository.findById(targetPlanId)
                .orElseThrow(() -> new IllegalArgumentException("Target plan not found: " + targetPlanId));

        Subscription currentSub = getOrCreateActiveSubscription(userId);
        return prorationCalculator.calculateUpgradeProration(currentSub, targetPlan);
    }

    /**
     * Immediate upgrade flow with proration credit and concurrency locking
     */
    @Transactional
    public SubscriptionResponse upgradeSubscription(String userId, UpgradeSubscriptionRequest request) {
        return subscriptionLock.withLock(userId, "upgrade", 30, () -> {
            SubscriptionPlan targetPlan = planRepository.findById(request.getTargetPlanId())
                    .orElseThrow(() -> new IllegalArgumentException("Target plan not found: " + request.getTargetPlanId()));

            Subscription sub = getOrCreateActiveSubscription(userId);
            SubscriptionPlan currentPlan = sub.getPlan();

            if (currentPlan != null && targetPlan.getTierLevel() <= currentPlan.getTierLevel()) {
                throw new IllegalArgumentException("Target plan tier must be higher than current plan for upgrade. For lower tier, use downgrade.");
            }

            // 1. Calculate Proration Quote
            ProrationCalculationResult quote = prorationCalculator.calculateUpgradeProration(sub, targetPlan);

            // 2. Update Subscription
            sub.setPlan(targetPlan);
            sub.setStatus(Subscription.SubscriptionStatus.active);
            sub.setStatusChangeReason("Upgraded from " + (currentPlan != null ? currentPlan.getName() : "Free") + " to " + targetPlan.getName());
            sub.setProrationCredit(quote.getUnusedCredit());
            sub.setRetryCount(0);
            sub.setGracePeriodEndsAt(null);
            sub.setCancelAtPeriodEnd(false);
            sub.setPlanVersionAtCreation(targetPlan.getVersion());

            Instant now = Instant.now();
            sub.setCurrentPeriodStart(now);
            sub.setCurrentPeriodEnd(now.plus(Duration.ofDays(30)));

            subscriptionRepository.save(sub);

            // 3. Generate Prorated GST Invoice
            String invoiceNumber = invoiceNumberGenerator.generateNextInvoiceNumber();
            String lineItemsJson = String.format(
                    "[{\"description\":\"%s Plan Upgrade\",\"amount\":%s},{\"description\":\"Proration Credit Applied\",\"amount\":-%s}]",
                    targetPlan.getName(), quote.getTargetPlanPrice(), quote.getUnusedCredit()
            );

            Invoice invoice = Invoice.builder()
                    .invoiceNumber(invoiceNumber)
                    .userId(userId)
                    .customerName("Customer " + userId)
                    .customerEmail(userId + "@suvix.com")
                    .subtotal(quote.getNetSubtotal())
                    .taxRate(quote.getTaxRate())
                    .taxAmount(quote.getTaxAmount())
                    .totalAmount(quote.getTotalAmount())
                    .currency("INR")
                    .subscriptionId(sub.getId())
                    .status(Invoice.InvoiceStatus.paid)
                    .invoiceDate(LocalDate.now())
                    .paidAt(now)
                    .isProrated(true)
                    .prorationCredit(quote.getUnusedCredit())
                    .lineItems(lineItemsJson)
                    .provider(request.getProvider() != null ? request.getProvider() : "internal")
                    .providerInvoiceId(request.getProviderPaymentId())
                    .build();

            invoiceRepository.save(invoice);
            invoiceService.prewarmInvoicePdfAsync(invoice.getId());

            // 4. Double-Entry Ledger Entry
            SubscriptionLedger ledgerEntry = SubscriptionLedger.builder()
                    .subscriptionId(sub.getId())
                    .entryType("upgrade_prorated_charge")
                    .description("Upgraded to " + targetPlan.getName() + " with proration credit of " + quote.getUnusedCredit())
                    .credit(quote.getTotalAmount())
                    .debit(BigDecimal.ZERO)
                    .balance(quote.getTotalAmount())
                    .invoiceId(invoice.getId())
                    .build();

            ledgerRepository.save(ledgerEntry);

            // 5. Transactional Outbox Event for Kafka
            saveOutboxEvent("SUBSCRIPTION", sub.getId().toString(), "SUBSCRIPTION_UPGRADED", "subscription.events", Map.of(
                    "subscriptionId", sub.getId(),
                    "userId", userId,
                    "previousPlanId", (currentPlan != null) ? currentPlan.getId() : "free",
                    "newPlanId", targetPlan.getId(),
                    "invoiceNumber", invoiceNumber,
                    "netAmountPaid", quote.getTotalAmount(),
                    "prorationCredit", quote.getUnusedCredit()
            ));

            // 6. Invalidate Redis Entitlements Cache
            entitlementService.invalidateEntitlements(userId);

            log.info("Successfully upgraded user {} to plan {}", userId, targetPlan.getId());

            return SubscriptionResponse.fromEntity(sub);
        });
    }

    /**
     * Scheduled downgrade flow (takes effect at currentPeriodEnd)
     */
    @Transactional
    public Map<String, Object> scheduleDowngrade(String userId, DowngradeSubscriptionRequest request) {
        return subscriptionLock.withLock(userId, "downgrade", 30, () -> {
            Subscription sub = getOrCreateActiveSubscription(userId);
            SubscriptionPlan targetPlan = planRepository.findById(request.getTargetPlanId())
                    .orElseThrow(() -> new IllegalArgumentException("Target plan not found: " + request.getTargetPlanId()));

            sub.setStatus(Subscription.SubscriptionStatus.cancelling);
            sub.setCancelAtPeriodEnd(true);
            sub.setStatusChangeReason("Scheduled downgrade to " + targetPlan.getName() + " at period end");
            sub.setCancellationReason(request.getReason());
            sub.setCancellationFeedback(request.getFeedback());

            subscriptionRepository.save(sub);

            saveOutboxEvent("SUBSCRIPTION", sub.getId().toString(), "SUBSCRIPTION_DOWNGRADE_SCHEDULED", "subscription.events", Map.of(
                    "subscriptionId", sub.getId(),
                    "userId", userId,
                    "targetPlanId", targetPlan.getId(),
                    "effectiveAt", sub.getCurrentPeriodEnd() != null ? sub.getCurrentPeriodEnd() : Instant.now()
            ));

            return Map.of(
                    "status", "SCHEDULED",
                    "message", "Your downgrade to " + targetPlan.getName() + " will take effect on " + sub.getCurrentPeriodEnd(),
                    "currentPlan", sub.getPlan().getName(),
                    "targetPlan", targetPlan.getName(),
                    "effectiveDate", sub.getCurrentPeriodEnd() != null ? sub.getCurrentPeriodEnd() : Instant.now()
            );
        });
    }

    /**
     * Pause subscription (e.g. 30, 60, or 90 days)
     */
    @Transactional
    public Map<String, Object> pauseSubscription(String userId, PauseSubscriptionRequest request) {
        return subscriptionLock.withLock(userId, "pause", 30, () -> {
            Subscription sub = getOrCreateActiveSubscription(userId);
            Instant now = Instant.now();
            Instant resumesAt = now.plus(Duration.ofDays(request.getPauseDays()));

            sub.setStatus(Subscription.SubscriptionStatus.paused);
            sub.setStatusChangeReason("Paused by user: " + request.getReason());
            sub.setPausedAt(now);
            sub.setPauseResumesAt(resumesAt);

            subscriptionRepository.save(sub);

            saveOutboxEvent("SUBSCRIPTION", sub.getId().toString(), "SUBSCRIPTION_PAUSED", "subscription.events", Map.of(
                    "subscriptionId", sub.getId(),
                    "userId", userId,
                    "pausedAt", now,
                    "resumesAt", resumesAt
            ));

            entitlementService.invalidateEntitlements(userId);

            return Map.of(
                    "status", "PAUSED",
                    "message", "Subscription paused successfully until " + resumesAt,
                    "resumesAt", resumesAt
            );
        });
    }

    /**
     * Resume paused subscription
     */
    @Transactional
    public SubscriptionResponse resumeSubscription(String userId) {
        return subscriptionLock.withLock(userId, "resume", 30, () -> {
            Subscription sub = getOrCreateActiveSubscription(userId);
            sub.setStatus(Subscription.SubscriptionStatus.active);
            sub.setStatusChangeReason("Resumed by user");
            sub.setPausedAt(null);
            sub.setPauseResumesAt(null);

            subscriptionRepository.save(sub);

            saveOutboxEvent("SUBSCRIPTION", sub.getId().toString(), "SUBSCRIPTION_RESUMED", "subscription.events", Map.of(
                    "subscriptionId", sub.getId(),
                    "userId", userId
            ));

            entitlementService.invalidateEntitlements(userId);

            return SubscriptionResponse.fromEntity(sub);
        });
    }

    private Subscription getOrCreateActiveSubscription(String userId) {
        Optional<Subscription> subOpt = subscriptionRepository.findActiveByUserId(userId);
        if (subOpt.isPresent()) {
            return subOpt.get();
        }

        // Auto-provision Free Tier subscription
        SubscriptionPlan freePlan = planRepository.findById("plan_free")
                .orElseGet(() -> planRepository.findAll().stream().findFirst().orElseThrow());

        Subscription newSub = Subscription.builder()
                .userId(userId)
                .plan(freePlan)
                .status(Subscription.SubscriptionStatus.active)
                .provider(Subscription.PaymentProvider.internal)
                .currentPeriodStart(Instant.now())
                .currentPeriodEnd(Instant.now().plus(Duration.ofDays(30)))
                .build();

        return subscriptionRepository.save(newSub);
    }

    private void saveOutboxEvent(String aggregateType, String aggregateId, String eventType, String topic, Map<String, Object> payload) {
        try {
            String payloadJson = objectMapper.writeValueAsString(payload);
            OutboxEvent outboxEvent = OutboxEvent.builder()
                    .aggregateType(aggregateType)
                    .aggregateId(aggregateId)
                    .eventType(eventType)
                    .topic(topic)
                    .payload(payloadJson)
                    .status(OutboxEvent.OutboxStatus.PENDING)
                    .build();
            outboxRepository.save(outboxEvent);
        } catch (Exception e) {
            log.error("Failed to save Outbox event [{}]: {}", eventType, e.getMessage());
        }
    }
}