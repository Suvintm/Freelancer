package com.suvix.payment.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.Builder;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/**
 * Payment Entity — maps directly to PostgreSQL 'payments' table.
 * Fully synchronized with SuviX Prisma PostgreSQL schema.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "payments", indexes = {
    @Index(name = "idx_payments_order", columnList = "order_id"),
    @Index(name = "idx_payments_client_id", columnList = "client_id"),
    @Index(name = "idx_payments_editor_id", columnList = "editor_id")
})
public class Payment {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    /** Reference to Order */
    @Column(name = "order_id", nullable = false)
    private String orderId;

    /** Client who paid */
    @Column(name = "client_id")
    private UUID clientId;

    /** Editor who receives payment */
    @Column(name = "editor_id")
    private UUID editorId;

    /** Total amount paid by client (in INR) */
    @Column(name = "amount", precision = 12, scale = 2, nullable = false)
    private BigDecimal amount;

    /** Platform fee deducted (e.g., 10%) */
    @Column(name = "platform_fee", precision = 12, scale = 2)
    private BigDecimal platformFee;

    /** What editor actually earns after fee */
    @Column(name = "editor_earning", precision = 12, scale = 2)
    private BigDecimal editorEarning;

    /** Razorpay payment ID (pay_xxx) */
    @Column(name = "razorpay_payment_id", unique = true)
    private String razorpayPaymentId;

    /** Razorpay order ID (order_xxx) */
    @Column(name = "razorpay_order_id")
    private String razorpayOrderId;

    /** Payment status */
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private PaymentStatus status;

    /** Type of payment */
    @Enumerated(EnumType.STRING)
    @Column(name = "type")
    private PaymentType type;

    /** Razorpay refund ID if refunded */
    @Column(name = "razorpay_refund_id")
    private String razorpayRefundId;

    /** Timestamps */
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at")
    private Instant updatedAt;

    @Column(name = "refunded_at")
    private Instant refundedAt;

    /** Metadata */
    @Column(name = "currency")
    private String currency;

    @Column(name = "description")
    private String description;

    @PrePersist
    protected void onCreate() {
        this.createdAt = Instant.now();
        this.updatedAt = Instant.now();
        if (this.currency == null) {
            this.currency = "INR";
        }
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = Instant.now();
    }

    public enum PaymentStatus {
        PENDING, COMPLETED, FAILED, REFUNDED
    }

    public enum PaymentType {
        GIG_PAYMENT, SUBSCRIPTION, REFUND, PROPOSAL_PAYMENT
    }
}
