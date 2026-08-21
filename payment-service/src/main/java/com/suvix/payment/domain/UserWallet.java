package com.suvix.payment.domain;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "user_wallets", indexes = {
    @Index(name = "idx_user_wallets_user_id", columnList = "user_id"),
    @Index(name = "idx_user_wallets_kyc", columnList = "kyc_status")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserWallet {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "user_id", nullable = false, unique = true, length = 50)
    private String userId;

    @Column(nullable = false, precision = 19, scale = 4)
    private BigDecimal balance = BigDecimal.ZERO;

    @Column(name = "hold_balance", nullable = false, precision = 19, scale = 4)
    private BigDecimal holdBalance = BigDecimal.ZERO;

    @Column(name = "total_earned", nullable = false, precision = 19, scale = 4)
    private BigDecimal totalEarned = BigDecimal.ZERO;

    @Column(name = "total_withdrawn", nullable = false, precision = 19, scale = 4)
    private BigDecimal totalWithdrawn = BigDecimal.ZERO;

    @Column(nullable = false, length = 3)
    private String currency = "INR";

    @Enumerated(EnumType.STRING)
    @Column(name = "kyc_status", nullable = false, length = 20)
    private KycStatus kycStatus = KycStatus.pending;

    @Column(name = "kyc_verified_at")
    private Instant kycVerifiedAt;

    @Column(name = "bank_account_encrypted", columnDefinition = "TEXT")
    private String bankAccountEncrypted;

    @Column(name = "upi_id_encrypted", columnDefinition = "TEXT")
    private String upiIdEncrypted;

    @Column(name = "pan_encrypted", columnDefinition = "TEXT")
    private String panEncrypted;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private Instant updatedAt;

    public BigDecimal getAvailableBalance() {
        return balance.subtract(holdBalance);
    }

    public enum KycStatus {
        pending, submitted, verified, rejected
    }
}
