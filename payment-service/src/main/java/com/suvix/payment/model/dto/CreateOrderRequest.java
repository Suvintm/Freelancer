package com.suvix.payment.model.dto;

import lombok.Data;

/**
 * Request body for POST /api/v1/payments/create-order
 * Sent from Node.js (proxied from frontend)
 */
@Data
public class CreateOrderRequest {
    private String orderId;       // SuviX order ID
    private Double amount;        // Amount in INR (e.g., 500.00)
    private String currency;      // "INR"
    private String description;   // e.g., "Payment for gig: Logo Design"
}
