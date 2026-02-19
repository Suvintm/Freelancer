package com.suvix.payment.model.dto;

import lombok.Data;

/**
 * Request body for POST /api/v1/payments/verify
 * Sent after Razorpay checkout completes on the frontend
 */
@Data
public class VerifyPaymentRequest {
    private String razorpayOrderId;     // order_xxx from Razorpay
    private String razorpayPaymentId;   // pay_xxx from Razorpay
    private String razorpaySignature;   // HMAC signature to verify
    private String suvixOrderId;        // Our internal Order ID
    private String clientId;            // User who paid
    private String editorId;            // Editor who receives
    private Double amount;              // Must match what was charged
}
