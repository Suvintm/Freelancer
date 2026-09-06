package com.suvix.payment.domain.subscription.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UsageSummaryResponse {

    private String userId;
    private String planId;
    private String planName;
    private String usagePeriod;
    private Instant periodResetAt;
    private Map<String, FeatureUsageDetail> featureUsages;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class FeatureUsageDetail {
        private String featureName;
        private int currentUsage;
        private int maxLimit;
        private int remainingQuota;
        private double usagePercentage;
        private boolean isUnlimited;
        private boolean isOverage;
        private int overageUnits;
    }
}