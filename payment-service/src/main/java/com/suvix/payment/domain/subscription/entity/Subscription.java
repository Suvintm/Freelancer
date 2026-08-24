package com.suvix.payment.domain.subscription.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "subscriptions", indexes = {
    @Index(name = "idx_subscriptions_user_id", columnList = "user_id"),
    @Index(name = "idx_subscriptions_status", columnList = "status"),
    @Index(name = "idx_subscriptions_period_end", columnList = "current_period_end")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Subscription {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "user_id", nullable = false, length = 50)
    private String userId;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "plan_id", nullable = false)
    private SubscriptionPlan plan;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private SubscriptionStatus status = SubscriptionStatus.incomplete;

    @Column(name = "previous_status", length = 20)
    private String previousStatus;

    @Column(name = "status_change_reason")
    private String statusChangeReason;

    @Column(name = "status_changed_at")
    private Instant statusChangedAt;

    @Column(name = "status_changed_by", length = 50)
    private String statusChangedBy;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private PaymentProvider provider = PaymentProvider.razorpay;

    @Column(name = "provider_subscription_id", length = 100)
    private String providerSubscriptionId;

    @Column(name = "provider_customer_id", length = 100)
    private String providerCustomerId;

    @Column(name = "current_period_start")
    private Instant currentPeriodStart;

    @Column(name = "current_period_end")
    private Instant currentPeriodEnd;

    @Builder.Default
    @Column(name = "cancel_at_period_end", nullable = false)
    private boolean cancelAtPeriodEnd = false;

    @Column(name = "cancelled_at")
    private Instant cancelledAt;

    @Column(name = "cancellation_reason", length = 50)
    private String cancellationReason;

    @Column(name = "cancellation_feedback")
    private String cancellationFeedback;

    @Column(name = "paused_at")
    private Instant pausedAt;

    @Column(name = "pause_resumes_at")
    private Instant pauseResumesAt;

    @Column(name = "ended_at")
    private Instant endedAt;

    @Column(name = "payment_method_id", length = 100)
    private String paymentMethodId;

    @Column(name = "payment_method_type", length = 20)
    private String paymentMethodType;

    @Builder.Default
    @Column(name = "proration_credit", nullable = false, precision = 19, scale = 4)
    private BigDecimal prorationCredit = BigDecimal.ZERO;

    @Column(name = "grace_period_ends_at")
    private Instant gracePeriodEndsAt;

    @Builder.Default
    @Column(name = "retry_count", nullable = false)
    private int retryCount = 0;

    @Column(name = "last_retry_at")
    private Instant lastRetryAt;

    @Column(name = "next_retry_at")
    private Instant nextRetryAt;

    @Builder.Default
    @Column(name = "plan_version_at_creation", nullable = false)
    private int planVersionAtCreation = 1;

    @Column(name = "trial_start")
    private Instant trialStart;

    @Column(name = "trial_end")
    private Instant trialEnd;

    @org.hibernate.annotations.JdbcTypeCode(org.hibernate.type.SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private String metadata;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private Instant updatedAt;

    @Column(name = "deleted_at")
    private Instant deletedAt;

    public boolean hasActiveAccess() {
        if (status == SubscriptionStatus.active || status == SubscriptionStatus.trialing) {
            return true;
        }
        if (status == SubscriptionStatus.past_due) {
            return gracePeriodEndsAt != null && Instant.now().isBefore(gracePeriodEndsAt);
        }
        if (status == SubscriptionStatus.cancelling) {
            return currentPeriodEnd != null && Instant.now().isBefore(currentPeriodEnd);
        }
        return false;
    }

    public boolean isExpired() {
        return currentPeriodEnd != null && Instant.now().isAfter(currentPeriodEnd);
    }

    public enum SubscriptionStatus {
        incomplete, trialing, active, past_due, unpaid, cancelling, paused, expired, disputed, cancelled
    }

    public enum PaymentProvider {
        razorpay, stripe, internal
    }
}

