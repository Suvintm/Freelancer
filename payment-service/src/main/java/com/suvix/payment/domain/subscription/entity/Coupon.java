package com.suvix.payment.domain.subscription.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "coupons", indexes = {
    @Index(name = "idx_coupons_code_active", columnList = "code, is_active")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Coupon {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, unique = true, length = 50)
    private String code;

    @Builder.Default
    @Column(name = "discount_type", nullable = false, length = 20)
    private String discountType = "percentage"; // percentage | fixed

    @Builder.Default
    @Column(name = "discount_value", nullable = false, precision = 10, scale = 2)
    private BigDecimal discountValue = BigDecimal.ZERO;

    @Builder.Default
    @Column(nullable = false, length = 3)
    private String currency = "INR";

    @Column(name = "max_redemptions")
    private Integer maxRedemptions;

    @Builder.Default
    @Column(name = "times_redeemed", nullable = false)
    private int timesRedeemed = 0;

    @Builder.Default
    @Column(name = "applicable_roles", columnDefinition = "jsonb", nullable = false)
    private String applicableRoles = "[\"all\"]";

    @Builder.Default
    @Column(name = "applicable_plans", columnDefinition = "jsonb", nullable = false)
    private String applicablePlans = "[\"all\"]";

    @Builder.Default
    @Column(name = "starts_at", nullable = false)
    private Instant startsAt = Instant.now();

    @Column(name = "expires_at")
    private Instant expiresAt;

    @Builder.Default
    @Column(name = "is_active", nullable = false)
    private boolean isActive = true;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;
}
