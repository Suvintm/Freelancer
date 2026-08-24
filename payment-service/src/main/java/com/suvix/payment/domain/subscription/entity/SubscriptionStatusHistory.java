package com.suvix.payment.domain.subscription.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "subscription_status_history", indexes = {
    @Index(name = "idx_sub_status_hist_sub", columnList = "subscription_id, created_at")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SubscriptionStatusHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "subscription_id", nullable = false)
    private UUID subscriptionId;

    @Column(name = "from_status", nullable = false, length = 20)
    private String fromStatus;

    @Column(name = "to_status", nullable = false, length = 20)
    private String toStatus;

    @Column(columnDefinition = "TEXT")
    private String reason;

    @Column(name = "triggered_by", length = 50)
    private String triggeredBy;

    @org.hibernate.annotations.JdbcTypeCode(org.hibernate.type.SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private String metadata;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;
}