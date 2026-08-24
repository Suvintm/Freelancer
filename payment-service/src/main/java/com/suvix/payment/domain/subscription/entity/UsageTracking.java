package com.suvix.payment.domain.subscription.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;

@Entity
@Table(name = "usage_tracking", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"user_id", "feature_name", "usage_period"})
}, indexes = {
    @Index(name = "idx_usage_tracking_user", columnList = "user_id"),
    @Index(name = "idx_usage_tracking_feature", columnList = "feature_name"),
    @Index(name = "idx_usage_tracking_period", columnList = "usage_period")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UsageTracking {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false, length = 50)
    private String userId;

    @Column(name = "feature_name", nullable = false, length = 100)
    private String featureName;

    @Column(name = "usage_period", nullable = false, length = 20)
    private String usagePeriod;

    @Column(name = "usage_count", nullable = false)
    private int usageCount = 0;

    @Column(name = "usage_limit")
    private Integer usageLimit;

    @Column(name = "last_used_at")
    private Instant lastUsedAt;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private Instant updatedAt;
}
