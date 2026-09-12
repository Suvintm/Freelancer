package com.suvix.payment.domain.billing.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;

@Entity
@Table(name = "company_billing_profiles")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CompanyBillingProfile {

    @Id
    @Column(length = 50)
    private String id;

    @Column(name = "legal_name", nullable = false)
    private String legalName;

    @Column(name = "trade_name")
    private String tradeName;

    @Column(length = 30)
    private String gstin;

    @Column(length = 30)
    private String cin;

    @Column(length = 30)
    private String pan;

    @Column(name = "address_line1")
    private String addressLine1;

    @Column(name = "address_line2")
    private String addressLine2;

    @Column(length = 100)
    private String city;

    @Column(name = "state_name", length = 100)
    private String stateName;

    @Column(name = "state_code", length = 20)
    private String stateCode;

    @Column(name = "postal_code", length = 20)
    private String postalCode;

    @Builder.Default
    @Column(length = 100)
    private String country = "India";

    @Column(name = "support_email", length = 100)
    private String supportEmail;

    @Column(name = "support_phone", length = 50)
    private String supportPhone;

    @Builder.Default
    @Column(name = "invoice_prefix", length = 20)
    private String invoicePrefix = "SVX-INV-";

    @Builder.Default
    @Column(name = "sac_code", length = 20)
    private String sacCode = "998314";

    @Builder.Default
    @Column(name = "hsn_description")
    private String hsnDescription = "Software-as-a-Service (SaaS) Subscription";

    @Builder.Default
    @Column(name = "is_default", nullable = false)
    private boolean isDefault = true;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private Instant updatedAt;
}
