package com.suvix.payment.domain.subscription.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "subscription_reconciliation_audit", indexes = {
    @Index(name = "idx_reconciliation_audit_sub", columnList = "subscription_id"),
    @Index(name = "idx_reconciliation_audit_user", columnList = "user_id"),
    @Index(name = "idx_reconciliation_audit_date", columnList = "reconciled_at")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SubscriptionReconciliationAudit {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(name = "subscription_id", nullable = false)
    private UUID subscriptionId;

    @Column(name = "user_id", nullable = false, length = 50)
    private String userId;

    @Column(nullable = false, length = 20)
    private String provider;

    @Column(name = "provider_subscription_id", length = 100)
    private String providerSubscriptionId;

    @Column(name = "db_status", nullable = false, length = 30)
    private String dbStatus;

    @Column(name = "gateway_status", nullable = false, length = 30)
    private String gatewayStatus;

    @Column(name = "discrepancy_type", nullable = false, length = 50)
    private String discrepancyType;

    @Column(name = "action_taken", nullable = false, length = 50)
    private String actionTaken;

    @CreationTimestamp
    @Column(name = "reconciled_at", nullable = false, updatable = false)
    private Instant reconciledAt;

    @Builder.Default
    @org.hibernate.annotations.JdbcTypeCode(org.hibernate.type.SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private String details = "{}";
}