package com.suvix.payment.domain.payment.entity;

import com.suvix.payment.domain.subscription.entity.Subscription;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "payment_transactions", indexes = {
    @Index(name = "idx_payment_transactions_user_id", columnList = "user_id"),
    @Index(name = "idx_payment_transactions_status", columnList = "status"),
    @Index(name = "idx_payment_transactions_provider", columnList = "provider_order_id"),
    @Index(name = "idx_payment_transactions_created", columnList = "created_at")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PaymentTransaction {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "user_id", nullable = false, length = 50)
    private String userId;

    @Column(nullable = false, precision = 19, scale = 4)
    private BigDecimal amount;

    @Builder.Default
    @Column(nullable = false, length = 3)
    private String currency = "INR";

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private PaymentStatus status = PaymentStatus.pending;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private PaymentProvider provider = PaymentProvider.razorpay;

    @Column(name = "provider_order_id", length = 100)
    private String providerOrderId;

    @Column(name = "provider_payment_id", length = 100)
    private String providerPaymentId;

    @Column(name = "provider_signature", length = 255)
    private String providerSignature;

    @Builder.Default
    @Column(name = "platform_fee", nullable = false, precision = 19, scale = 4)
    private BigDecimal platformFee = BigDecimal.ZERO;

    @Builder.Default
    @Column(name = "editor_earnings", nullable = false, precision = 19, scale = 4)
    private BigDecimal editorEarnings = BigDecimal.ZERO;

    @Builder.Default
    @Column(name = "tax_amount", nullable = false, precision = 19, scale = 4)
    private BigDecimal taxAmount = BigDecimal.ZERO;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "subscription_id")
    private Subscription subscription;

    @Column(name = "escrow_id")
    private UUID escrowId;

    @Column(name = "payout_id")
    private UUID payoutId;

    @Column(name = "idempotency_key", nullable = false, unique = true, length = 64)
    private String idempotencyKey;

    @Column(name = "correlation_id", length = 64)
    private String correlationId;

    @Column(columnDefinition = "TEXT")
    private String description;

    @org.hibernate.annotations.JdbcTypeCode(org.hibernate.type.SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private String metadata;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private Instant updatedAt;

    @Column(name = "completed_at")
    private Instant completedAt;

    public enum PaymentStatus {
        pending, processing, completed, failed, refunded, disputed
    }

    public enum PaymentProvider {
        razorpay, stripe, internal
    }
}
