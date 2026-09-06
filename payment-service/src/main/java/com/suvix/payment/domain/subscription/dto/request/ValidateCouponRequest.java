package com.suvix.payment.domain.subscription.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ValidateCouponRequest {

    @NotBlank(message = "Coupon code is required")
    private String code;

    private String planId;

    @Builder.Default
    private String billingCycle = "monthly"; // monthly | annual

    private String role;
}
