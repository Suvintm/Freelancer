package com.suvix.payment.domain.escrow.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "escrows", indexes = {
    @Index(name = "idx_escrows_payer", columnList = "payer_user_id"),
    @Index(name = "idx_escrows_payee", columnList = "payee_user_id"),
    @Index(name = "idx_escrows_status", columnList = "status"),
    @Index(name = "idx_escrows_expires", columnList = "expires_at")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Escrow {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "transaction_id", nullable = false)
    private UUID transactionId;

    @Column(name = "payer_user_id", nullable = false, length = 50)
    private String payerUserId;

    @Column(name = "payee_user_id", nullable = false, length = 50)
    private String payeeUserId;

    @Column(nullable = false, precision = 19, scale = 4)
    private BigDecimal amount;

    @Column(nullable = false, length = 3)
    private String currency = "INR";

    @Column(name = "platform_fee", nullable = false, precision = 19, scale = 4)
    private BigDecimal platformFee = BigDecimal.ZERO;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private EscrowStatus status = EscrowStatus.held;

    @Column(name = "release_condition", nullable = false, length = 50)
    private String releaseCondition = "manual_approval";

    @org.hibernate.annotations.JdbcTypeCode(org.hibernate.type.SqlTypes.JSON)
    @Column(name = "release_metadata", columnDefinition = "jsonb")
    private String releaseMetadata;

    @CreationTimestamp
    @Column(name = "held_at", nullable = false)
    private Instant heldAt;

    @Column(name = "released_at")
    private Instant releasedAt;

    @Column(name = "disputed_at")
    private Instant disputedAt;

    @Column(name = "expires_at", nullable = false)
    private Instant expiresAt;

    @Column(name = "dispute_reason", columnDefinition = "TEXT")
    private String disputeReason;

    @Column(name = "resolved_by", length = 50)
    private String resolvedBy;

    @Column(name = "resolution_notes", columnDefinition = "TEXT")
    private String resolutionNotes;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private Instant updatedAt;

    public enum EscrowStatus {
        held, released, disputed, refunded, expired
    }
}
