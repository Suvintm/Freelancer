package com.suvix.payment.domain.subscription.dto.response;

import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SubscriptionResponse {
    private boolean success;
    private UUID subscriptionId;
    private String planId;
    private String planName;
    private Integer tierLevel;
    private String role;
    private String billingCycle;
    private String status;
    private String providerSubscriptionId;
    private Instant currentPeriodStart;
    private Instant currentPeriodEnd;
    private Instant periodStart;
    private Instant periodEnd;
    private boolean cancelAtPeriodEnd;
    private String message;

    public static SubscriptionResponse fromEntity(com.suvix.payment.domain.subscription.entity.Subscription sub) {
        if (sub == null) return null;
        com.suvix.payment.domain.subscription.entity.SubscriptionPlan plan = sub.getPlan();
        return SubscriptionResponse.builder()
                .success(true)
                .subscriptionId(sub.getId())
                .planId(plan != null ? plan.getId() : null)
                .planName(plan != null ? plan.getName() : null)
                .tierLevel(plan != null ? plan.getTierLevel() : 0)
                .role(plan != null ? plan.getTargetRole() : null)
                .billingCycle(plan != null && plan.getBillingInterval() != null ? plan.getBillingInterval().name().toLowerCase() : "monthly")
                .status(sub.getStatus() != null ? sub.getStatus().name() : null)
                .providerSubscriptionId(sub.getProviderSubscriptionId())
                .currentPeriodStart(sub.getCurrentPeriodStart())
                .currentPeriodEnd(sub.getCurrentPeriodEnd())
                .periodStart(sub.getCurrentPeriodStart())
                .periodEnd(sub.getCurrentPeriodEnd())
                .cancelAtPeriodEnd(sub.isCancelAtPeriodEnd())
                .message("Subscription retrieved successfully")
                .build();
    }
}
