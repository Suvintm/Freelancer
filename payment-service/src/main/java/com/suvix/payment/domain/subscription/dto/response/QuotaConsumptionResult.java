package com.suvix.payment.domain.subscription.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QuotaConsumptionResult {

    private boolean allowed;
    private String featureName;
    private int consumedUnits;
    private int currentUsage;
    private int maxLimit;
    private int remainingQuota;
    private boolean isOverage;
    private int overageUnits;
    private String usagePeriod;
    private Instant periodResetAt;
    private String message;
}