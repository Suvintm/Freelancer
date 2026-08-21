package com.suvix.payment.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CancelSubscriptionRequest {

    @NotNull(message = "Subscription ID is required")
    private UUID subscriptionId;

    private String reason;

    private boolean immediate = false;
}
