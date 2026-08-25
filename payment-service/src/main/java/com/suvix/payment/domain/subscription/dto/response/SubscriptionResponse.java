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
    private String status;
    private String providerSubscriptionId;
    private Instant currentPeriodStart;
    private Instant currentPeriodEnd;
    private boolean cancelAtPeriodEnd;
    private String message;

    public static SubscriptionResponse fromEntity(com.suvix.payment.domain.subscription.entity.Subscription sub) {
        if (sub == null) return null;
        return SubscriptionResponse.builder()
                .success(true)
                .subscriptionId(sub.getId())
                .planId(sub.getPlan() != null ? sub.getPlan().getId() : null)
                .planName(sub.getPlan() != null ? sub.getPlan().getName() : null)
                .status(sub.getStatus() != null ? sub.getStatus().name() : null)
                .providerSubscriptionId(sub.getProviderSubscriptionId())
                .currentPeriodStart(sub.getCurrentPeriodStart())
                .currentPeriodEnd(sub.getCurrentPeriodEnd())
                .cancelAtPeriodEnd(sub.isCancelAtPeriodEnd())
                .message("Subscription updated successfully")
                .build();
    }
}
