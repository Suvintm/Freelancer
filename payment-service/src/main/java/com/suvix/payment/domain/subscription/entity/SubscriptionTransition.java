package com.suvix.payment.domain.subscription.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "subscription_transitions", indexes = {
    @Index(name = "idx_sub_transitions_user", columnList = "user_id, created_at"),
    @Index(name = "idx_sub_transitions_sub", columnList = "subscription_id")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SubscriptionTransition {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "subscription_id", nullable = false)
    private UUID subscriptionId;

    @Column(name = "user_id", nullable = false, length = 64)
    private String userId;

    @Column(name = "transition_type", nullable = false, length = 40)
    private String transitionType; // UPGRADE_COTERM, UPGRADE_INTERVAL_RESET, DOWNGRADE_SCHEDULED, DOWNGRADE_EXECUTED, CANCEL, PAUSE, RESUME, RENEWAL

    @Column(name = "from_plan_id", length = 64)
    private String fromPlanId;

    @Column(name = "to_plan_id", nullable = false, length = 64)
    private String toPlanId;

    @Builder.Default
    @Column(name = "proration_credit_calculated", precision = 19, scale = 4)
    private BigDecimal prorationCreditCalculated = BigDecimal.ZERO;

    @Builder.Default
    @Column(name = "proration_credit_applied", precision = 19, scale = 4)
    private BigDecimal prorationCreditApplied = BigDecimal.ZERO;

    @Builder.Default
    @Column(name = "leftover_credit_generated", precision = 19, scale = 4)
    private BigDecimal leftoverCreditGenerated = BigDecimal.ZERO;

    @Column(name = "gross_target_price", nullable = false, precision = 19, scale = 4)
    private BigDecimal grossTargetPrice;

    @Builder.Default
    @Column(name = "coupon_discount_applied", precision = 19, scale = 4)
    private BigDecimal couponDiscountApplied = BigDecimal.ZERO;

    @Column(name = "coupon_code", length = 50)
    private String couponCode;

    @Column(name = "net_amount_charged", nullable = false, precision = 19, scale = 4)
    private BigDecimal netAmountCharged;

    @Column(name = "amount_in_paise", nullable = false)
    private long amountInPaise;

    @Builder.Default
    @Column(nullable = false, length = 10)
    private String currency = "INR";

    @Column(name = "invoice_id")
    private UUID invoiceId;

    @Column(name = "previous_period_end")
    private Instant previousPeriodEnd;

    @Column(name = "new_period_end", nullable = false)
    private Instant newPeriodEnd;

    @org.hibernate.annotations.JdbcTypeCode(org.hibernate.type.SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private String metadata;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;
}
