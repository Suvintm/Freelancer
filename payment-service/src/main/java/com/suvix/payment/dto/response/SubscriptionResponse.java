package com.suvix.payment.dto.response;

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
}
