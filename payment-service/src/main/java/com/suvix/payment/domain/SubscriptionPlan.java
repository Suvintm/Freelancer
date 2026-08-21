package com.suvix.payment.domain;

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

    @Column(name = "tier_level", nullable = false)
    private int tierLevel = 0;

    @Enumerated(EnumType.STRING)
    @Column(name = "billing_interval", nullable = false, length = 20)
    private BillingInterval billingInterval;

    @Column(name = "price_monthly", nullable = false, precision = 19, scale = 4)
    private BigDecimal priceMonthly = BigDecimal.ZERO;

    @Column(name = "price_annual", nullable = false, precision = 19, scale = 4)
    private BigDecimal priceAnnual = BigDecimal.ZERO;

    @Column(columnDefinition = "jsonb", nullable = false)
    private String features = "{}";

    @Column(columnDefinition = "jsonb", nullable = false)
    private String limits = "{}";

    @Column(name = "is_active", nullable = false)
    private boolean isActive = true;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private Instant updatedAt;

    public enum BillingInterval {
        month, year, week
    }
}
