package com.suvix.payment.domain.subscription.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.suvix.payment.domain.billing.entity.Invoice;
import com.suvix.payment.domain.billing.repository.InvoiceRepository;
import com.suvix.payment.domain.billing.service.InvoiceNumberGenerator;
import com.suvix.payment.domain.billing.service.InvoiceService;
import com.suvix.payment.domain.payment.webhook.NormalizedWebhookEvent;
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
import java.math.RoundingMode;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class SubscriptionLifecycleBillingService {

    private final SubscriptionRepository subscriptionRepository;
    private final SubscriptionPlanRepository planRepository;
    private final SubscriptionLedgerRepository ledgerRepository;
    private final InvoiceRepository invoiceRepository;
    private final InvoiceNumberGenerator invoiceNumberGenerator;
    private final InvoiceService invoiceService;
    private final FeatureEntitlementService entitlementService;
    private final OutboxEventRepository outboxRepository;
    private final ObjectMapper objectMapper;

    private static final BigDecimal GST_RATE = new BigDecimal("18.00");
    private static final long GRACE_PERIOD_DAYS = 7;

    @Transactional
    public void processNormalizedWebhook(NormalizedWebhookEvent event) {
        log.info("Processing webhook event [{}] for providerSubId={}", event.getEventType(), event.getProviderSubscriptionId());

        Optional<Subscription> subOpt = findSubscription(event);
        if (subOpt.isEmpty()) {
            log.warn("No subscription found for providerSubId={} userId={}", event.getProviderSubscriptionId(), event.getUserId());
            return;
        }

        Subscription sub = subOpt.get();

        switch (event.getEventType()) {
            case SUBSCRIPTION_CHARGED, SUBSCRIPTION_ACTIVATED -> handleSubscriptionCharged(sub, event);
            case PAYMENT_FAILED, SUBSCRIPTION_PENDING -> handlePaymentFailed(sub, event);
            case SUBSCRIPTION_HALTED -> handleSubscriptionHalted(sub, event);
            case SUBSCRIPTION_CANCELLED -> handleSubscriptionCancelled(sub, event);
            case SUBSCRIPTION_PAUSED -> handleSubscriptionPaused(sub, event);
            case SUBSCRIPTION_RESUMED -> handleSubscriptionResumed(sub, event);
            default -> log.info("Unhandled webhook event type: {}", event.getEventType());
        }
    }

    private void handleSubscriptionCharged(Subscription sub, NormalizedWebhookEvent event) {
        sub.setStatus(Subscription.SubscriptionStatus.active);
        sub.setStatusChangeReason("Payment charged successfully via " + event.getProvider());
        sub.setRetryCount(0);
        sub.setGracePeriodEndsAt(null);

        if (event.getCurrentPeriodStart() != null) {
            sub.setCurrentPeriodStart(event.getCurrentPeriodStart());
        }
        if (event.getCurrentPeriodEnd() != null) {
            sub.setCurrentPeriodEnd(event.getCurrentPeriodEnd());
        } else if (sub.getCurrentPeriodEnd() == null || sub.getCurrentPeriodEnd().isBefore(Instant.now())) {
            sub.setCurrentPeriodStart(Instant.now());
            sub.setCurrentPeriodEnd(Instant.now().plus(Duration.ofDays(30)));
        }

        subscriptionRepository.save(sub);

        // 1. Generate GST Compliant Invoice
        BigDecimal totalAmount = (event.getAmount() != null && event.getAmount().compareTo(BigDecimal.ZERO) > 0)
                ? event.getAmount()
                : sub.getPlan().getPriceMonthly();

        BigDecimal subtotal = totalAmount.divide(BigDecimal.ONE.add(GST_RATE.divide(BigDecimal.valueOf(100), 4, RoundingMode.HALF_UP)), 4, RoundingMode.HALF_UP);
        BigDecimal taxAmount = totalAmount.subtract(subtotal);

        String invoiceNumber = invoiceNumberGenerator.generateNextInvoiceNumber();
        String lineItemsJson = String.format("[{\"description\":\"%s Subscription\",\"amount\":%s,\"tax_rate\":18.0}]",
                sub.getPlan().getName(), totalAmount);

        Invoice invoice = Invoice.builder()
                .invoiceNumber(invoiceNumber)
                .userId(sub.getUserId())
                .customerName("Customer " + sub.getUserId())
                .customerEmail(sub.getUserId() + "@suvix.com")
                .subtotal(subtotal)
                .taxRate(GST_RATE)
                .taxAmount(taxAmount)
                .totalAmount(totalAmount)
                .currency(event.getCurrency() != null ? event.getCurrency() : "INR")
                .subscriptionId(sub.getId())
                .status(Invoice.InvoiceStatus.paid)
                .invoiceDate(LocalDate.now())
                .paidAt(Instant.now())
                .provider(event.getProvider())
                .providerInvoiceId(event.getProviderPaymentId())
                .lineItems(lineItemsJson)
                .build();

        invoiceRepository.save(invoice);
        invoiceService.prewarmInvoicePdfAsync(invoice.getId());

        // 2. Double-Entry Ledger Entry
        SubscriptionLedger ledgerEntry = SubscriptionLedger.builder()
                .subscriptionId(sub.getId())
                .entryType("charge")
                .description("Successful recurring subscription charge")
                .credit(totalAmount)
                .debit(BigDecimal.ZERO)
                .currency(event.getCurrency() != null ? event.getCurrency() : "INR")
                .balance(totalAmount)
                .invoiceId(invoice.getId())
                .build();

        ledgerRepository.save(ledgerEntry);

        // 3. Transactional Outbox Event (Guaranteed Kafka publishing)
        saveOutboxEvent("SUBSCRIPTION", sub.getId().toString(), "SUBSCRIPTION_CHARGED", "subscription.events", Map.of(
                "subscriptionId", sub.getId(),
                "userId", sub.getUserId(),
                "planId", sub.getPlan().getId(),
                "amount", totalAmount,
                "invoiceNumber", invoiceNumber,
                "currentPeriodEnd", sub.getCurrentPeriodEnd()
        ));

        // 4. Invalidate Redis entitlement cache
        entitlementService.invalidateEntitlements(sub.getUserId());
    }

    private void handlePaymentFailed(Subscription sub, NormalizedWebhookEvent event) {
        if (sub.getStatus() == Subscription.SubscriptionStatus.active) {
            sub.setStatus(Subscription.SubscriptionStatus.past_due);
            sub.setStatusChangeReason("Payment renewal failed: " + event.getFailureReason());
            sub.setGracePeriodEndsAt(Instant.now().plus(Duration.ofDays(GRACE_PERIOD_DAYS)));
        }

        sub.setRetryCount(sub.getRetryCount() + 1);
        sub.setLastRetryAt(Instant.now());
        // Schedule next retry according to Dunning curve (Day 1 -> 3 -> 5 -> 7)
        long nextDays = switch (sub.getRetryCount()) {
            case 1 -> 2;
            case 2 -> 2;
            case 3 -> 2;
            default -> 1;
        };
        sub.setNextRetryAt(Instant.now().plus(Duration.ofDays(nextDays)));

        subscriptionRepository.save(sub);

        // Record failed charge in ledger
        SubscriptionLedger ledgerEntry = SubscriptionLedger.builder()
                .subscriptionId(sub.getId())
                .entryType("charge_failed")
                .description("Failed subscription charge attempt #" + sub.getRetryCount())
                .currency(event.getCurrency() != null ? event.getCurrency() : "INR")
                .build();
        ledgerRepository.save(ledgerEntry);

        // Outbox notification for Dunning email & alert
        saveOutboxEvent("SUBSCRIPTION", sub.getId().toString(), "SUBSCRIPTION_PAYMENT_FAILED", "subscription.events", Map.of(
                "subscriptionId", sub.getId(),
                "userId", sub.getUserId(),
                "retryCount", sub.getRetryCount(),
                "gracePeriodEndsAt", sub.getGracePeriodEndsAt() != null ? sub.getGracePeriodEndsAt() : "",
                "failureReason", event.getFailureReason() != null ? event.getFailureReason() : "Card declined"
        ));

        entitlementService.invalidateEntitlements(sub.getUserId());
    }

    private void handleSubscriptionHalted(Subscription sub, NormalizedWebhookEvent event) {
        sub.setStatus(Subscription.SubscriptionStatus.unpaid);
        sub.setStatusChangeReason("Grace period expired and all retry attempts exhausted.");
        subscriptionRepository.save(sub);

        saveOutboxEvent("SUBSCRIPTION", sub.getId().toString(), "SUBSCRIPTION_UNPAID", "subscription.events", Map.of(
                "subscriptionId", sub.getId(),
                "userId", sub.getUserId()
        ));

        entitlementService.invalidateEntitlements(sub.getUserId());
    }

    private void handleSubscriptionCancelled(Subscription sub, NormalizedWebhookEvent event) {
        sub.setStatus(Subscription.SubscriptionStatus.cancelled);
        sub.setStatusChangeReason("Cancelled via provider " + event.getProvider());
        sub.setCancelledAt(Instant.now());
        sub.setEndedAt(Instant.now());
        subscriptionRepository.save(sub);

        saveOutboxEvent("SUBSCRIPTION", sub.getId().toString(), "SUBSCRIPTION_CANCELLED", "subscription.events", Map.of(
                "subscriptionId", sub.getId(),
                "userId", sub.getUserId()
        ));

        entitlementService.invalidateEntitlements(sub.getUserId());
    }

    private void handleSubscriptionPaused(Subscription sub, NormalizedWebhookEvent event) {
        sub.setStatus(Subscription.SubscriptionStatus.paused);
        sub.setStatusChangeReason("Subscription paused");
        sub.setPausedAt(Instant.now());
        subscriptionRepository.save(sub);

        entitlementService.invalidateEntitlements(sub.getUserId());
    }

    private void handleSubscriptionResumed(Subscription sub, NormalizedWebhookEvent event) {
        sub.setStatus(Subscription.SubscriptionStatus.active);
        sub.setStatusChangeReason("Subscription resumed");
        sub.setPausedAt(null);
        subscriptionRepository.save(sub);

        entitlementService.invalidateEntitlements(sub.getUserId());
    }

    private Optional<Subscription> findSubscription(NormalizedWebhookEvent event) {
        if (event.getProviderSubscriptionId() != null && !event.getProviderSubscriptionId().isBlank()) {
            Optional<Subscription> byProvider = subscriptionRepository.findByProviderSubscriptionId(event.getProviderSubscriptionId());
            if (byProvider.isPresent()) {
                return byProvider;
            }
        }

        if (event.getUserId() != null && !event.getUserId().isBlank()) {
            return subscriptionRepository.findActiveByUserId(event.getUserId());
        }

        return Optional.empty();
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