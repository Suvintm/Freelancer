package com.suvix.payment.domain.payment.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VerifyPaymentRequest {

    @NotBlank(message = "Razorpay Payment ID is required")
    private String razorpayPaymentId;

    @NotBlank(message = "Razorpay Order ID is required")
    private String razorpayOrderId;

    @NotBlank(message = "Razorpay Signature is required")
    private String razorpaySignature;

    @NotBlank(message = "SuviX Order ID is required")
    private String suvixOrderId;

    @NotNull(message = "Amount is required")
    @DecimalMin(value = "1.00")
    private BigDecimal amount;

    private String clientId;

    private String editorId;
}
