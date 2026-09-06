package com.suvix.payment.domain.subscription.service;

import com.suvix.payment.domain.subscription.dto.request.ValidateCouponRequest;
import com.suvix.payment.domain.subscription.dto.response.ValidateCouponResponse;
import com.suvix.payment.domain.subscription.entity.Coupon;
import com.suvix.payment.domain.subscription.entity.SubscriptionPlan;
import com.suvix.payment.domain.subscription.repository.CouponRepository;
import com.suvix.payment.domain.subscription.repository.SubscriptionPlanRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class CouponService {

    private final CouponRepository couponRepository;
    private final SubscriptionPlanRepository planRepository;

    public ValidateCouponResponse validateCoupon(ValidateCouponRequest request) {
        System.out.println("  ┌────────────────────────────────────────────────────────┐");
        System.out.println("  │ 🏷️  [CouponService] validateCoupon()                   │");
        System.out.println("  │ Code: " + String.format("%-15s", request.getCode()) + " | Plan: " + String.format("%-15s", request.getPlanId()) + " │");
        System.out.println("  └────────────────────────────────────────────────────────┘");

        if (request.getCode() == null || request.getCode().trim().isEmpty()) {
            System.out.println("  ❌ [Coupon Validation] Rejected: Coupon code is empty.");
            return ValidateCouponResponse.builder()
                    .valid(false)
                    .message("Coupon code cannot be empty")
                    .build();
        }

        String cleanCode = request.getCode().trim().toUpperCase();
        Optional<Coupon> couponOpt = couponRepository.findByCodeIgnoreCaseAndIsActiveTrue(cleanCode);

        if (couponOpt.isEmpty()) {
            System.out.println("  ❌ [Coupon Validation] Code '" + cleanCode + "' not found in DB or inactive.");
            return ValidateCouponResponse.builder()
                    .valid(false)
                    .code(cleanCode)
                    .message("Invalid or expired promo coupon")
                    .build();
        }

        Coupon coupon = couponOpt.get();
        Instant now = Instant.now();

        if (coupon.getStartsAt() != null && now.isBefore(coupon.getStartsAt())) {
            System.out.println("  ❌ [Coupon Validation] Code '" + cleanCode + "' has not started yet (Starts: " + coupon.getStartsAt() + ").");
            return ValidateCouponResponse.builder()
                    .valid(false)
                    .code(cleanCode)
                    .message("Promo coupon is not active yet")
                    .build();
        }

        if (coupon.getExpiresAt() != null && now.isAfter(coupon.getExpiresAt())) {
            System.out.println("  ❌ [Coupon Validation] Code '" + cleanCode + "' expired on " + coupon.getExpiresAt() + ".");
            return ValidateCouponResponse.builder()
                    .valid(false)
                    .code(cleanCode)
                    .message("Promo coupon has expired")
                    .build();
        }

        if (coupon.getMaxRedemptions() != null && coupon.getTimesRedeemed() >= coupon.getMaxRedemptions()) {
            System.out.println("  ❌ [Coupon Validation] Max redemptions reached (" + coupon.getTimesRedeemed() + "/" + coupon.getMaxRedemptions() + ").");
            return ValidateCouponResponse.builder()
                    .valid(false)
                    .code(cleanCode)
                    .message("Promo coupon has reached its maximum redemptions limit")
                    .build();
        }

        BigDecimal originalPrice = BigDecimal.ZERO;
        if (request.getPlanId() != null && !request.getPlanId().isBlank()) {
            Optional<SubscriptionPlan> planOpt = planRepository.findById(request.getPlanId());
            if (planOpt.isPresent()) {
                SubscriptionPlan plan = planOpt.get();
                boolean isAnnual = "annual".equalsIgnoreCase(request.getBillingCycle()) || "year".equalsIgnoreCase(request.getBillingCycle());
                originalPrice = isAnnual ? plan.getPriceAnnual() : plan.getPriceMonthly();
                if (isAnnual && (originalPrice == null || originalPrice.compareTo(BigDecimal.ZERO) == 0)) {
                    originalPrice = plan.getPriceMonthly().multiply(BigDecimal.valueOf(12)).multiply(BigDecimal.valueOf(0.8));
                }
            }
        }

        BigDecimal discountAmount = BigDecimal.ZERO;
        if (originalPrice.compareTo(BigDecimal.ZERO) > 0) {
            if ("percentage".equalsIgnoreCase(coupon.getDiscountType())) {
                discountAmount = originalPrice.multiply(coupon.getDiscountValue())
                        .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
            } else {
                discountAmount = coupon.getDiscountValue().min(originalPrice);
            }
        }

        BigDecimal finalPrice = originalPrice.subtract(discountAmount).max(BigDecimal.ZERO);

        System.out.println("  ✅ [Coupon Validated Successfully]");
        System.out.println("     • Code: " + coupon.getCode() + " (" + coupon.getDiscountValue() + ("percentage".equalsIgnoreCase(coupon.getDiscountType()) ? "%" : " FLAT") + ")");
        System.out.println("     • Original Subtotal: ₹" + originalPrice);
        System.out.println("     • Discount Amount:   ₹" + discountAmount);
        System.out.println("     • Net Subtotal:      ₹" + finalPrice);

        return ValidateCouponResponse.builder()
                .valid(true)
                .code(coupon.getCode())
                .discountType(coupon.getDiscountType())
                .discountValue(coupon.getDiscountValue())
                .discountAmount(discountAmount)
                .originalPrice(originalPrice)
                .finalPrice(finalPrice)
                .message("Coupon applied: " + coupon.getDiscountValue() +
                        ("percentage".equalsIgnoreCase(coupon.getDiscountType()) ? "% off" : " " + coupon.getCurrency() + " off"))
                .build();
    }

    @Transactional
    public void incrementRedemption(String code) {
        if (code == null || code.isBlank()) return;
        couponRepository.findByCodeIgnoreCase(code.trim()).ifPresent(c -> {
            c.setTimesRedeemed(c.getTimesRedeemed() + 1);
            couponRepository.save(c);
            System.out.println("  🎉 [Coupon Redeemed] Incremented count for '" + c.getCode() + "': " + c.getTimesRedeemed() + " total redemptions.");
            log.info("Incremented redemption count for coupon {}: new count={}", c.getCode(), c.getTimesRedeemed());
        });
    }
}
