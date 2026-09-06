package com.suvix.payment.domain.subscription.dto.request;

import jakarta.validation.constraints.Min;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PauseSubscriptionRequest {

    @Builder.Default
    @Min(value = 1, message = "Pause duration must be at least 1 day")
    private int pauseDays = 30;

    private String reason;
}