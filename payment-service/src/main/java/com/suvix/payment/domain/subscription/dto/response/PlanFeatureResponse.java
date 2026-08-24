package com.suvix.payment.domain.subscription.dto.response;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PlanFeatureResponse {
    private String userId;
    private String planId;
    private String planName;
    private String feature;
    private boolean allowed;
    private int quotaRemaining;
    private String requiredPlan;
    private String upgradeUrl;
}
