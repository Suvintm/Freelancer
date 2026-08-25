package com.suvix.payment.domain.subscription.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpgradeSubscriptionRequest {

    @NotBlank(message = "Target plan ID is required")
    private String targetPlanId;

    private String paymentMethodId;
    private String provider; // razorpay, stripe, internal
    private String providerPaymentId;
}