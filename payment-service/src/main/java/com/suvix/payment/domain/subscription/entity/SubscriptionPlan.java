package com.suvix.payment.domain.subscription.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "subscription_plans", indexes = {
    @Index(name = "idx_subscription_plans_active", columnList = "is_active"),
    @Index(name = "idx_subscription_plans_tier", columnList = "tier_level")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SubscriptionPlan {

    @Id
    @Column(length = 50)
    private String id;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Builder.Default
    @Column(name = "tier_level", nullable = false)
    private int tierLevel = 0;

    @Builder.Default
    @Column(name = "version", nullable = false)
    private int version = 1;

    @Builder.Default
    @Column(name = "is_latest_version", nullable = false)
    private boolean isLatestVersion = true;

    @Column(name = "replaced_by_id", length = 50)
    private String replacedById;

    @Enumerated(EnumType.STRING)
    @Column(name = "billing_interval", nullable = false, length = 20)
    private BillingInterval billingInterval;

    @Builder.Default
    @Column(name = "price_monthly", nullable = false, precision = 19, scale = 4)
    private BigDecimal priceMonthly = BigDecimal.ZERO;

    @Builder.Default
    @Column(name = "price_annual", nullable = false, precision = 19, scale = 4)
    private BigDecimal priceAnnual = BigDecimal.ZERO;

    @Builder.Default
    @Column(name = "trial_days", nullable = false)
    private int trialDays = 0;

    @Builder.Default
    @org.hibernate.annotations.JdbcTypeCode(org.hibernate.type.SqlTypes.JSON)
    @Column(columnDefinition = "jsonb", nullable = false)
    private String features = "{}";

    @Builder.Default
    @org.hibernate.annotations.JdbcTypeCode(org.hibernate.type.SqlTypes.JSON)
    @Column(columnDefinition = "jsonb", nullable = false)
    private String limits = "{}";

    @Builder.Default
    @Column(name = "quota_reset_period", nullable = false, length = 20)
    private String quotaResetPeriod = "billing_cycle";

    @Builder.Default
    @Column(name = "display_order", nullable = false)
    private int displayOrder = 0;

    @Builder.Default
    @Column(name = "is_popular", nullable = false)
    private boolean isPopular = false;

    @Column(length = 50)
    private String badge;

    @Builder.Default
    @Column(name = "is_active", nullable = false)
    private boolean isActive = true;

    @Column(name = "available_from")
    private Instant availableFrom;

    @Column(name = "available_until")
    private Instant availableUntil;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private Instant updatedAt;

    @Column(name = "deleted_at")
    private Instant deletedAt;

    public enum BillingInterval {
        month, year, week
    }
}

