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
import com.suvix.payment.domain.subscription.entity.CustomerCreditBalance;
import com.suvix.payment.domain.subscription.entity.Subscription;
import com.suvix.payment.domain.subscription.entity.SubscriptionLedger;
import com.suvix.payment.domain.subscription.entity.SubscriptionPlan;
import com.suvix.payment.domain.subscription.entity.SubscriptionTransition;
import com.suvix.payment.domain.subscription.repository.CustomerCreditBalanceRepository;
import com.suvix.payment.domain.subscription.repository.SubscriptionLedgerRepository;
import com.suvix.payment.domain.subscription.repository.SubscriptionPlanRepository;
import com.suvix.payment.domain.subscription.repository.SubscriptionRepository;
import com.suvix.payment.domain.subscription.repository.SubscriptionTransitionRepository;
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
    private final SubscriptionTransitionRepository transitionRepository;
    private final CustomerCreditBalanceRepository creditBalanceRepository;
    private final InvoiceRepository invoiceRepository;
    private final InvoiceNumberGenerator invoiceNumberGenerator;
    private final ProrationCalculator prorationCalculator;
    private final FeatureEntitlementService entitlementService;
    private final SubscriptionLock subscriptionLock;
    private final OutboxEventRepository outboxRepository;
    private final InvoiceService invoiceService;
    private final ObjectMapper objectMapper;

    /**
     * Get upgrade preview quote with exact Co-Term or Interval-Reset proration calculations
     */
    public ProrationCalculationResult quoteUpgrade(String userId, String targetPlanId) {
        return quoteUpgrade(userId, targetPlanId, "monthly");
    }

    public ProrationCalculationResult quoteUpgrade(String userId, String targetPlanId, String billingCycle) {
        SubscriptionPlan targetPlan = planRepository.findById(targetPlanId)
                .orElseThrow(() -> new IllegalArgumentException("Target plan not found: " + targetPlanId));

        Subscription currentSub = getOrCreateActiveSubscription(userId);
        boolean isAnnual = "annual".equalsIgnoreCase(billingCycle);
        return prorationCalculator.calculateUpgradeProration(currentSub, targetPlan, isAnnual);
    }

    /**
     * Immediate upgrade flow with Co-Term anchor retention, proration credit and append-only audit trail
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

            // 1. Calculate Proration Quote (Co-Term or Interval-Reset)
            ProrationCalculationResult quote = prorationCalculator.calculateUpgradeProration(sub, targetPlan);

            Instant previousPeriodEnd = sub.getCurrentPeriodEnd();
            Instant newPeriodEnd = quote.getNewPeriodEnd();

            // 2. Update Subscription Record
            sub.setPlan(targetPlan);
            sub.setStatus(Subscription.SubscriptionStatus.active);
            sub.setStatusChangeReason("Upgraded from " + (currentPlan != null ? currentPlan.getName() : "Free") + " to " + targetPlan.getName());
            sub.setProrationCredit(quote.getUnusedCredit());
            sub.setRetryCount(0);
            sub.setGracePeriodEndsAt(null);
            sub.setCancelAtPeriodEnd(false);
            sub.setPlanVersionAtCreation(targetPlan.getVersion());
            sub.setTotalAmount(quote.getTotalAmount());
            sub.setBaseAmount(quote.getNetSubtotal());
            sub.setTaxAmount(quote.getTaxAmount());

            if (!quote.isCoTerm()) {
                sub.setCurrentPeriodStart(Instant.now());
            }
            sub.setCurrentPeriodEnd(newPeriodEnd);

            subscriptionRepository.save(sub);

            // 3. Generate Prorated GST Invoice
            String invoiceNumber = invoiceNumberGenerator.generateNextInvoiceNumber();
            String lineItemsJson = String.format(
                    "[{\"description\":\"%s Plan Upgrade (%s)\",\"amount\":%s},{\"description\":\"Proration Credit Applied\",\"amount\":-%s}]",
                    targetPlan.getName(), quote.isCoTerm() ? "Co-Term" : "Full Cycle", quote.getTargetPlanPrice(), quote.getUnusedCredit()
            );

            Invoice invoice = Invoice.builder()
                    .invoiceNumber(invoiceNumber)
                    .userId(userId)
                    .customerName("Customer " + userId)
                    .customerEmail(userId + "@suvix.in")
                    .subtotal(quote.getNetSubtotal())
                    .taxRate(quote.getTaxRate())
                    .taxAmount(quote.getTaxAmount())
                    .totalAmount(quote.getTotalAmount())
                    .currency("INR")
                    .subscriptionId(sub.getId())
                    .status(Invoice.InvoiceStatus.paid)
                    .invoiceDate(LocalDate.now())
                    .paidAt(Instant.now())
                    .isProrated(true)
                    .prorationCredit(quote.getUnusedCredit())
                    .lineItems(lineItemsJson)
                    .provider(request.getProvider() != null ? request.getProvider() : "internal")
                    .providerInvoiceId(request.getProviderPaymentId())
                    .build();

            invoiceRepository.save(invoice);
            invoiceService.prewarmInvoicePdfAsync(invoice.getId());

            // 4. Record Double-Entry Ledger Entry
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

            // 5. Append-Only Transition Audit Trail
            SubscriptionTransition transition = SubscriptionTransition.builder()
                    .subscriptionId(sub.getId())
                    .userId(userId)
                    .transitionType(quote.getTransitionType())
                    .fromPlanId(currentPlan != null ? currentPlan.getId() : "none")
                    .toPlanId(targetPlan.getId())
                    .prorationCreditCalculated(quote.getUnusedCredit())
                    .prorationCreditApplied(quote.getUnusedCredit())
                    .leftoverCreditGenerated(quote.getLeftoverCredit() != null ? quote.getLeftoverCredit() : BigDecimal.ZERO)
                    .grossTargetPrice(quote.getTargetPlanPrice())
                    .netAmountCharged(quote.getTotalAmount())
                    .amountInPaise(quote.getAmountInPaise())
                    .currency("INR")
                    .invoiceId(invoice.getId())
                    .previousPeriodEnd(previousPeriodEnd)
                    .newPeriodEnd(newPeriodEnd)
                    .build();

            transitionRepository.save(transition);

            // 6. Handle Rollover Leftover Credit if credit exceeded target price
            if (quote.getLeftoverCredit() != null && quote.getLeftoverCredit().compareTo(BigDecimal.ZERO) > 0) {
                CustomerCreditBalance creditBalance = creditBalanceRepository.findByUserId(userId)
                        .orElseGet(() -> CustomerCreditBalance.builder().userId(userId).balanceAmount(BigDecimal.ZERO).currency("INR").build());
                creditBalance.setBalanceAmount(creditBalance.getBalanceAmount().add(quote.getLeftoverCredit()));
                creditBalanceRepository.save(creditBalance);
                log.info("Saved leftover proration credit of ₹{} to user {} credit balance", quote.getLeftoverCredit(), userId);
            }

            // 7. Transactional Outbox Event for Kafka
            saveOutboxEvent("SUBSCRIPTION", sub.getId().toString(), "SUBSCRIPTION_UPGRADED", "subscription.events", Map.of(
                    "subscriptionId", sub.getId(),
                    "userId", userId,
                    "previousPlanId", (currentPlan != null) ? currentPlan.getId() : "free",
                    "newPlanId", targetPlan.getId(),
                    "transitionType", quote.getTransitionType(),
                    "invoiceNumber", invoiceNumber,
                    "netAmountPaid", quote.getTotalAmount(),
                    "prorationCredit", quote.getUnusedCredit(),
                    "isCoTerm", quote.isCoTerm()
            ));

            // 8. Invalidate Redis Entitlements Cache
            entitlementService.invalidateEntitlements(userId);

            log.info("Successfully upgraded user {} to plan {} via {}", userId, targetPlan.getId(), quote.getTransitionType());

            return SubscriptionResponse.fromEntity(sub);
        });
    }

    /**
     * Scheduled downgrade flow (takes effect at currentPeriodEnd with ₹0 charge today)
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

            // Log Transition Audit
            SubscriptionTransition transition = SubscriptionTransition.builder()
                    .subscriptionId(sub.getId())
                    .userId(userId)
                    .transitionType("DOWNGRADE_SCHEDULED")
                    .fromPlanId(sub.getPlan() != null ? sub.getPlan().getId() : "none")
                    .toPlanId(targetPlan.getId())
                    .grossTargetPrice(targetPlan.getPriceMonthly())
                    .netAmountCharged(BigDecimal.ZERO)
                    .amountInPaise(0L)
                    .currency("INR")
                    .previousPeriodEnd(sub.getCurrentPeriodEnd())
                    .newPeriodEnd(sub.getCurrentPeriodEnd() != null ? sub.getCurrentPeriodEnd() : Instant.now())
                    .metadata("{\"reason\":\"" + (request.getReason() != null ? request.getReason() : "") + "\"}")
                    .build();

            transitionRepository.save(transition);

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
     * Pause subscription (e.g. 15, 30, 60, or 90 days)
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

            SubscriptionTransition transition = SubscriptionTransition.builder()
                    .subscriptionId(sub.getId())
                    .userId(userId)
                    .transitionType("PAUSE")
                    .fromPlanId(sub.getPlan() != null ? sub.getPlan().getId() : "none")
                    .toPlanId(sub.getPlan() != null ? sub.getPlan().getId() : "none")
                    .grossTargetPrice(BigDecimal.ZERO)
                    .netAmountCharged(BigDecimal.ZERO)
                    .amountInPaise(0L)
                    .currency("INR")
                    .previousPeriodEnd(sub.getCurrentPeriodEnd())
                    .newPeriodEnd(resumesAt)
                    .metadata("{\"pauseDays\":" + request.getPauseDays() + "}")
                    .build();

            transitionRepository.save(transition);

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

            SubscriptionTransition transition = SubscriptionTransition.builder()
                    .subscriptionId(sub.getId())
                    .userId(userId)
                    .transitionType("RESUME")
                    .fromPlanId(sub.getPlan() != null ? sub.getPlan().getId() : "none")
                    .toPlanId(sub.getPlan() != null ? sub.getPlan().getId() : "none")
                    .grossTargetPrice(BigDecimal.ZERO)
                    .netAmountCharged(BigDecimal.ZERO)
                    .amountInPaise(0L)
                    .currency("INR")
                    .previousPeriodEnd(sub.getCurrentPeriodEnd())
                    .newPeriodEnd(sub.getCurrentPeriodEnd() != null ? sub.getCurrentPeriodEnd() : Instant.now())
                    .build();

            transitionRepository.save(transition);

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

        SubscriptionPlan freePlan = planRepository.findById("plan_creator_free")
                .or(() -> planRepository.findById("plan_free"))
                .orElseGet(() -> planRepository.findAll().stream().findFirst().orElseThrow());

        Subscription newSub = Subscription.builder()
                .userId(userId)
                .plan(freePlan)
                .status(Subscription.SubscriptionStatus.active)
                .provider(Subscription.PaymentProvider.free_starter)
                .currentPeriodStart(Instant.now())
                .currentPeriodEnd(Instant.now().plus(Duration.ofDays(3650))) // 10 years
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
