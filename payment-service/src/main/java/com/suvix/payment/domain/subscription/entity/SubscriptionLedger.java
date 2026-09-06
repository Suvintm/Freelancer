package com.suvix.payment.domain.subscription.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "subscription_ledger", indexes = {
    @Index(name = "idx_subscription_ledger_sub", columnList = "subscription_id, created_at")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SubscriptionLedger {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "subscription_id", nullable = false)
    private UUID subscriptionId;

    @Column(name = "entry_type", nullable = false, length = 30)
    private String entryType; // charge, refund, proration_credit, proration_debit, tax

    @Column(nullable = false, length = 255)
    private String description;

    @Builder.Default
    @Column(nullable = false, precision = 19, scale = 4)
    private BigDecimal debit = BigDecimal.ZERO;

    @Builder.Default
    @Column(nullable = false, precision = 19, scale = 4)
    private BigDecimal credit = BigDecimal.ZERO;

    @Builder.Default
    @Column(nullable = false, length = 3)
    private String currency = "INR";

    @Builder.Default
    @Column(nullable = false, precision = 19, scale = 4)
    private BigDecimal balance = BigDecimal.ZERO;

    @Column(name = "invoice_id")
    private UUID invoiceId;

    @Column(name = "transaction_id")
    private UUID transactionId;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;
}