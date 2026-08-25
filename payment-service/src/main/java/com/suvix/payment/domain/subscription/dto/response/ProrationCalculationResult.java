package com.suvix.payment.domain.subscription.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProrationCalculationResult {

    private String currentPlanId;
    private String currentPlanName;
    private String targetPlanId;
    private String targetPlanName;

    private BigDecimal currentPlanPrice;
    private BigDecimal targetPlanPrice;
    private BigDecimal unusedCredit;
    private BigDecimal netSubtotal;
    private BigDecimal taxRate;
    private BigDecimal taxAmount;
    private BigDecimal totalAmount;

    private long remainingDays;
    private long remainingSeconds;
    private long totalPeriodSeconds;
    private Instant currentPeriodEnd;
}