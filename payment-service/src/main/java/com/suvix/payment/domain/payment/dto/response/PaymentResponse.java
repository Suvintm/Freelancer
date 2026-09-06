package com.suvix.payment.domain.payment.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Map;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class PaymentResponse {
    private boolean success;
    private UUID transactionId;
    private String orderId;
    private String razorpayOrderId;
    private String stripePaymentIntentId;
    private BigDecimal amount;
    private Long amountInPaise;
    private String currency;
    private String keyId;
    private String status;
    private String message;
    private Instant createdAt;

    // Enterprise Subscription Checkout metadata
    private UUID subscriptionId;
    private Map<String, Object> plan;
    private Map<String, Object> feeBreakdown;
}
