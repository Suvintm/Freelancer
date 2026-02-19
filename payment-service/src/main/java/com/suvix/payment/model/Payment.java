package com.suvix.payment.model;

import lombok.Data;
import lombok.Builder;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.index.Indexed;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * Payment document — mirrors the Node.js Payment.js model in MongoDB.
 * This service OWNS the payments collection.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "payments")
public class Payment {

    @Id
    private String id;

    /** Reference to Order (as String ObjectId, read from orders collection) */
    @Indexed
    private String orderId;

    /** Client who paid */
    @Indexed
    private String clientId;

    /** Editor who receives payment */
    @Indexed
    private String editorId;

    /** Total amount paid by client (in INR) */
    private BigDecimal amount;

    /** Platform fee deducted (e.g., 10%) */
    private BigDecimal platformFee;

    /** What editor actually earns after fee */
    private BigDecimal editorEarning;

    /** Razorpay payment ID (pay_xxx) */
    @Indexed(unique = true, sparse = true)
    private String razorpayPaymentId;

    /** Razorpay order ID (order_xxx) */
    @Indexed
    private String razorpayOrderId;

    /** Payment status */
    private PaymentStatus status;

    /** Type of payment */
    private PaymentType type;

    /** Razorpay refund ID if refunded */
    private String razorpayRefundId;

    /** Timestamps */
    private Instant createdAt;
    private Instant updatedAt;
    private Instant refundedAt;

    /** Metadata */
    private String currency;
    private String description;

    public enum PaymentStatus {
        PENDING, COMPLETED, FAILED, REFUNDED
    }

    public enum PaymentType {
        GIG_PAYMENT, SUBSCRIPTION, REFUND, PROPOSAL_PAYMENT
    }
}
