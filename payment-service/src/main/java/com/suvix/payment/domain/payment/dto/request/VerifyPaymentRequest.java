package com.suvix.payment.domain.payment.dto.request;

import com.fasterxml.jackson.annotation.JsonAlias;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VerifyPaymentRequest {

    @NotBlank(message = "Razorpay Payment ID is required")
    @JsonAlias({"razorpayPaymentId", "razorpay_payment_id"})
    private String razorpayPaymentId;

    @NotBlank(message = "Razorpay Order ID is required")
    @JsonAlias({"razorpayOrderId", "razorpay_order_id"})
    private String razorpayOrderId;

    @NotBlank(message = "Razorpay Signature is required")
    @JsonAlias({"razorpaySignature", "razorpay_signature"})
    private String razorpaySignature;

    @JsonAlias({"suvixOrderId", "orderId", "order_id"})
    private String suvixOrderId;

    private BigDecimal amount;

    @JsonAlias({"subscriptionId", "subscription_id"})
    private String subscriptionId;

    @JsonAlias({"planId", "plan_id"})
    private String planId;

    @JsonAlias({"billingCycle", "billing_cycle"})
    private String billingCycle;

    @JsonAlias({"clientId", "client_id", "userId", "user_id"})
    private String clientId;

    @JsonAlias({"editorId", "editor_id"})
    private String editorId;

    @JsonAlias({"customerName", "customer_name", "userName", "user_name", "name"})
    private String customerName;

    @JsonAlias({"customerEmail", "customer_email", "userEmail", "user_email", "email"})
    private String customerEmail;

    @JsonAlias({"customerGstin", "customer_gstin", "gstin"})
    private String customerGstin;
}
