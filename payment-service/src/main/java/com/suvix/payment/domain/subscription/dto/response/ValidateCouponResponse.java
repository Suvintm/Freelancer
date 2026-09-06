package com.suvix.payment.domain.subscription.dto.response;

import lombok.*;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ValidateCouponResponse {

    private boolean valid;
    private String code;
    private String discountType; // percentage | fixed
    private BigDecimal discountValue;
    private BigDecimal discountAmount;
    private BigDecimal originalPrice;
    private BigDecimal finalPrice;
    private String message;
}
