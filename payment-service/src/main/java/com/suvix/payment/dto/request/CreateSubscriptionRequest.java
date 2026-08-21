package com.suvix.payment.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateSubscriptionRequest {

    @NotBlank(message = "Plan ID is required")
    private String planId;

    private String provider = "razorpay";

    private String customerEmail;

    private String customerPhone;
}
