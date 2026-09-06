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
public class DowngradeSubscriptionRequest {

    @NotBlank(message = "Target plan ID is required")
    private String targetPlanId;

    private String reason;
    private String feedback;
}