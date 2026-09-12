package com.suvix.payment.domain.billing.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "tax_rules", indexes = {
    @Index(name = "idx_tax_rules_lookup", columnList = "country_code, state_code, is_active")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TaxRule {

    @Id
    @Column(length = 50)
    private String id;

    @Column(name = "country_code", nullable = false, length = 10)
    private String countryCode;

    @Builder.Default
    @Column(name = "state_code", nullable = false, length = 50)
    private String stateCode = "ALL";

    @Builder.Default
    @Column(name = "tax_name", nullable = false, length = 50)
    private String taxName = "GST";

    @Builder.Default
    @Column(name = "tax_rate", nullable = false, precision = 5, scale = 2)
    private BigDecimal taxRate = new BigDecimal("18.00");

    @Builder.Default
    @Column(name = "cgst_rate", precision = 5, scale = 2)
    private BigDecimal cgstRate = new BigDecimal("9.00");

    @Builder.Default
    @Column(name = "sgst_rate", precision = 5, scale = 2)
    private BigDecimal sgstRate = new BigDecimal("9.00");

    @Builder.Default
    @Column(name = "igst_rate", precision = 5, scale = 2)
    private BigDecimal igstRate = new BigDecimal("18.00");

    @Builder.Default
    @Column(name = "sac_code", length = 20)
    private String sacCode = "998314";

    @Builder.Default
    @Column(name = "is_inclusive", nullable = false)
    private boolean isInclusive = true;

    @Builder.Default
    @Column(name = "is_active", nullable = false)
    private boolean isActive = true;

    @Builder.Default
    @Column(name = "effective_from", nullable = false)
    private Instant effectiveFrom = Instant.now();

    @Column(name = "effective_to")
    private Instant effectiveTo;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private Instant updatedAt;
}
