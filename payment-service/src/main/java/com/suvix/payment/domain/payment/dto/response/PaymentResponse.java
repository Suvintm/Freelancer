package com.suvix.payment.domain.payment.dto.response;

import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PaymentResponse {
    private boolean success;
    private UUID transactionId;
    private String orderId;
    private String razorpayOrderId;
    private String stripePaymentIntentId;
    private BigDecimal amount;
    private String currency;
    private String keyId;
    private String status;
    private String message;
    private Instant createdAt;
}
