package com.suvix.payment.domain.subscription.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PlanEntitlements {

    private String userId;
    private String tier;
    private int tierLevel;
    private String status;
    private Instant periodEnd;
    private Instant gracePeriodEndsAt;
    private boolean hasActiveAccess;

    @Builder.Default
    private Map<String, Boolean> features = new HashMap<>();

    @Builder.Default
    private Map<String, Integer> limits = new HashMap<>();

    @Builder.Default
    private Map<String, Object> usage = new HashMap<>();
}