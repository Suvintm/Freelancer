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

    @Builder.Default
    private boolean isCoTerm = true;

    private String transitionType; // UPGRADE_COTERM | UPGRADE_INTERVAL_RESET

    private String currentPlanId;
    private String currentPlanName;
    private String targetPlanId;
    private String targetPlanName;

    private BigDecimal currentPlanPrice;
    private BigDecimal targetPlanPrice;
    private BigDecimal proratedTargetCharge;
    private BigDecimal priceDelta;

    private BigDecimal unusedCredit;
    private BigDecimal leftoverCredit;
    private BigDecimal netSubtotal;
    private BigDecimal taxRate;
    private BigDecimal taxAmount;
    private BigDecimal totalAmount;
    private long amountInPaise;

    private long remainingDays;
    private long remainingSeconds;
    private long totalPeriodSeconds;
    private long totalDays;
    private long usedDays;
    private Instant currentPeriodStart;
    private Instant currentPeriodEnd;
    private Instant newPeriodEnd;
}
