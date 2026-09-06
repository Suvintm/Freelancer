package com.suvix.payment.domain.subscription.service;

import com.suvix.payment.domain.subscription.dto.response.ProrationCalculationResult;
import com.suvix.payment.domain.subscription.entity.Subscription;
import com.suvix.payment.domain.subscription.entity.SubscriptionPlan;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.Instant;

@Slf4j
@Component
public class ProrationCalculator {

    private static final BigDecimal GST_RATE = new BigDecimal("18.00");
    private static final long DEFAULT_CYCLE_SECONDS = 30L * 24 * 3600; // 30 days in seconds

    /**
     * Calculates exact second-level proration credit for plan upgrade
     */
    public ProrationCalculationResult calculateUpgradeProration(
            Subscription currentSub,
            SubscriptionPlan targetPlan
    ) {
        SubscriptionPlan currentPlan = currentSub.getPlan();

        BigDecimal currentPrice = (currentPlan != null) ? currentPlan.getPriceMonthly() : BigDecimal.ZERO;
        BigDecimal targetPrice = (targetPlan != null) ? targetPlan.getPriceMonthly() : BigDecimal.ZERO;

        Instant now = Instant.now();
        Instant periodStart = (currentSub.getCurrentPeriodStart() != null) ? currentSub.getCurrentPeriodStart() : now;
        Instant periodEnd = (currentSub.getCurrentPeriodEnd() != null) ? currentSub.getCurrentPeriodEnd() : now.plusSeconds(DEFAULT_CYCLE_SECONDS);

        long totalPeriodSeconds = Math.max(1, Duration.between(periodStart, periodEnd).getSeconds());
        long remainingSeconds = Math.max(0, Duration.between(now, periodEnd).getSeconds());
        long remainingDays = remainingSeconds / 86400;

        BigDecimal unusedCredit = BigDecimal.ZERO;

        if (currentPrice.compareTo(BigDecimal.ZERO) > 0 && remainingSeconds > 0) {
            BigDecimal timeRatio = BigDecimal.valueOf(remainingSeconds)
                    .divide(BigDecimal.valueOf(totalPeriodSeconds), 6, RoundingMode.HALF_UP);
            unusedCredit = currentPrice.multiply(timeRatio).setScale(4, RoundingMode.HALF_UP);
        }

        // Net amount payable before tax
        BigDecimal netSubtotal = targetPrice.subtract(unusedCredit).max(BigDecimal.ZERO).setScale(4, RoundingMode.HALF_UP);

        // 18% GST calculation
        BigDecimal taxAmount = netSubtotal.multiply(GST_RATE)
                .divide(BigDecimal.valueOf(100), 4, RoundingMode.HALF_UP);

        BigDecimal totalAmount = netSubtotal.add(taxAmount).setScale(4, RoundingMode.HALF_UP);

        log.info("Calculated proration for user {}: currentPlan={}, targetPlan={}, remainingDays={}, unusedCredit={}, netSubtotal={}, totalAmount={}",
                currentSub.getUserId(),
                (currentPlan != null) ? currentPlan.getId() : "none",
                targetPlan.getId(),
                remainingDays,
                unusedCredit,
                netSubtotal,
                totalAmount
        );

        return ProrationCalculationResult.builder()
                .currentPlanId(currentPlan != null ? currentPlan.getId() : "none")
                .currentPlanName(currentPlan != null ? currentPlan.getName() : "Free")
                .targetPlanId(targetPlan.getId())
                .targetPlanName(targetPlan.getName())
                .currentPlanPrice(currentPrice)
                .targetPlanPrice(targetPrice)
                .unusedCredit(unusedCredit)
                .netSubtotal(netSubtotal)
                .taxRate(GST_RATE)
                .taxAmount(taxAmount)
                .totalAmount(totalAmount)
                .remainingDays(remainingDays)
                .remainingSeconds(remainingSeconds)
                .totalPeriodSeconds(totalPeriodSeconds)
                .currentPeriodEnd(periodEnd)
                .build();
    }
}