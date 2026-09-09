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
import java.time.temporal.ChronoUnit;

@Slf4j
@Component
public class ProrationCalculator {

    private static final BigDecimal GST_RATE = new BigDecimal("18.00");
    private static final long DEFAULT_CYCLE_SECONDS = 30L * 24 * 3600; // 30 days in seconds

    /**
     * Calculates exact second-precision proration for plan upgrade using Industry-Standard Co-Term or Interval-Reset
     */
    public ProrationCalculationResult calculateUpgradeProration(
            Subscription currentSub,
            SubscriptionPlan targetPlan
    ) {
        return calculateUpgradeProration(currentSub, targetPlan, false);
    }

    public ProrationCalculationResult calculateUpgradeProration(
            Subscription currentSub,
            SubscriptionPlan targetPlan,
            boolean isAnnualTarget
    ) {
        SubscriptionPlan currentPlan = currentSub.getPlan();
        boolean currentIsAnnual = (currentPlan != null && currentPlan.getBillingInterval() == SubscriptionPlan.BillingInterval.year)
                || (currentSub.getPlanSnapshot() != null && currentSub.getPlanSnapshot().toLowerCase().contains("\"annual\""));

        BigDecimal currentPrice = (currentPlan != null)
                ? (currentIsAnnual ? (currentPlan.getPriceAnnual() != null ? currentPlan.getPriceAnnual() : currentPlan.getPriceMonthly().multiply(BigDecimal.valueOf(12))) : currentPlan.getPriceMonthly())
                : BigDecimal.ZERO;

        BigDecimal targetPrice = isAnnualTarget
                ? (targetPlan.getPriceAnnual() != null ? targetPlan.getPriceAnnual() : targetPlan.getPriceMonthly().multiply(BigDecimal.valueOf(12)))
                : targetPlan.getPriceMonthly();

        Instant now = Instant.now();
        Instant periodStart = (currentSub.getCurrentPeriodStart() != null) ? currentSub.getCurrentPeriodStart() : now;
        Instant periodEnd = (currentSub.getCurrentPeriodEnd() != null && currentSub.getCurrentPeriodEnd().isAfter(now))
                ? currentSub.getCurrentPeriodEnd()
                : now.plusSeconds(DEFAULT_CYCLE_SECONDS);

        long totalPeriodSeconds = Math.max(1, Duration.between(periodStart, periodEnd).getSeconds());
        long remainingSeconds = Math.max(0, Duration.between(now, periodEnd).getSeconds());

        // Industry Standard: Day-Based Proration for stable, predictable pricing
        long totalDays = Math.max(1, (long) Math.ceil((double) totalPeriodSeconds / 86400.0));
        long remainingDays;
        if (remainingSeconds <= 0) {
            remainingDays = 0;
        } else {
            remainingDays = Math.max(1, Math.min(totalDays, (long) Math.ceil((double) remainingSeconds / 86400.0)));
        }
        long usedDays = Math.max(0, totalDays - remainingDays);

        boolean isSameInterval = (currentIsAnnual == isAnnualTarget) && currentPlan != null && currentPlan.getTierLevel() > 0;

        boolean isCoTerm = isSameInterval;
        String transitionType = isCoTerm ? "UPGRADE_COTERM" : "UPGRADE_INTERVAL_RESET";

        BigDecimal priceDelta = targetPrice.subtract(currentPrice).max(BigDecimal.ZERO);
        BigDecimal unusedCredit = BigDecimal.ZERO;
        BigDecimal leftoverCredit = BigDecimal.ZERO;
        BigDecimal proratedTargetCharge = BigDecimal.ZERO;
        BigDecimal totalAmount;
        Instant newPeriodEnd;

        BigDecimal timeRatio = (totalDays > 0 && remainingDays > 0)
                ? BigDecimal.valueOf(remainingDays).divide(BigDecimal.valueOf(totalDays), 8, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        if (isCoTerm) {
            // ─────────────────────────────────────────────────────────────────
            // 1. CO-TERM UPGRADE (Industry Standard: Stripe, GitHub, Netflix)
            // Renewal anchor date remains UNCHANGED. User pays prorated delta.
            // ─────────────────────────────────────────────────────────────────
            newPeriodEnd = periodEnd;
            if (remainingDays > 0) {
                unusedCredit = currentPrice.multiply(timeRatio).setScale(2, RoundingMode.HALF_UP);
                proratedTargetCharge = targetPrice.multiply(timeRatio).setScale(2, RoundingMode.HALF_UP);
                totalAmount = proratedTargetCharge.subtract(unusedCredit).max(BigDecimal.ZERO).setScale(2, RoundingMode.HALF_UP);
            } else {
                totalAmount = priceDelta.setScale(2, RoundingMode.HALF_UP);
                proratedTargetCharge = targetPrice.setScale(2, RoundingMode.HALF_UP);
            }
        } else {
            // ─────────────────────────────────────────────────────────────────
            // 2. INTERVAL SWITCH UPGRADE (e.g. Monthly -> Annual)
            // Fresh cycle starting today. Remaining monthly credit deducted from annual price.
            // ─────────────────────────────────────────────────────────────────
            newPeriodEnd = isAnnualTarget ? now.plus(365, ChronoUnit.DAYS) : now.plus(1, ChronoUnit.DAYS);
            proratedTargetCharge = targetPrice.setScale(2, RoundingMode.HALF_UP);
            if (currentPrice.compareTo(BigDecimal.ZERO) > 0 && remainingDays > 0) {
                unusedCredit = currentPrice.multiply(timeRatio).setScale(2, RoundingMode.HALF_UP);
            }

            if (unusedCredit.compareTo(targetPrice) > 0) {
                totalAmount = BigDecimal.ZERO;
                leftoverCredit = unusedCredit.subtract(targetPrice).setScale(2, RoundingMode.HALF_UP);
            } else {
                totalAmount = targetPrice.subtract(unusedCredit).max(BigDecimal.ZERO).setScale(2, RoundingMode.HALF_UP);
            }
        }

        // Integer paise financial precision
        long amountInPaise = totalAmount.multiply(BigDecimal.valueOf(100)).longValue();

        // Tax-Inclusive Base & GST back-calculation (Base = Gross / 1.18)
        BigDecimal divisor = new BigDecimal("1.18");
        BigDecimal netSubtotal = totalAmount.compareTo(BigDecimal.ZERO) > 0
                ? totalAmount.divide(divisor, 2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;
        BigDecimal taxAmount = totalAmount.subtract(netSubtotal).setScale(2, RoundingMode.HALF_UP);

        log.info("Proration computed for user {}: type={}, isCoTerm={}, targetPrice={}, currentPrice={}, delta={}, totalDays={}, remainingDays={}, charge={}, paise={}",
                currentSub.getUserId(), transitionType, isCoTerm, targetPrice, currentPrice, priceDelta, totalDays, remainingDays, totalAmount, amountInPaise);

        return ProrationCalculationResult.builder()
                .isCoTerm(isCoTerm)
                .transitionType(transitionType)
                .currentPlanId(currentPlan != null ? currentPlan.getId() : "none")
                .currentPlanName(currentPlan != null ? currentPlan.getName() : "Free")
                .targetPlanId(targetPlan.getId())
                .targetPlanName(targetPlan.getName())
                .currentPlanPrice(currentPrice)
                .targetPlanPrice(targetPrice)
                .proratedTargetCharge(proratedTargetCharge)
                .priceDelta(priceDelta)
                .unusedCredit(unusedCredit)
                .leftoverCredit(leftoverCredit)
                .netSubtotal(netSubtotal)
                .taxRate(GST_RATE)
                .taxAmount(taxAmount)
                .totalAmount(totalAmount)
                .amountInPaise(amountInPaise)
                .remainingDays(remainingDays)
                .remainingSeconds(remainingSeconds)
                .totalPeriodSeconds(totalPeriodSeconds)
                .totalDays(totalDays)
                .usedDays(usedDays)
                .currentPeriodStart(periodStart)
                .currentPeriodEnd(periodEnd)
                .newPeriodEnd(newPeriodEnd)
                .build();
    }
}
