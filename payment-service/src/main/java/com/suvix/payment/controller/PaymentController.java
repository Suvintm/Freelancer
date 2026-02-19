package com.suvix.payment.controller;

import com.suvix.payment.model.Payment;
import com.suvix.payment.model.dto.CreateOrderRequest;
import com.suvix.payment.model.dto.VerifyPaymentRequest;
import com.suvix.payment.service.PaymentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * REST Controller — exposes payment endpoints.
 *
 * ALL requests come from Node.js (core-api) via internal proxy.
 * These endpoints are NOT directly called by the browser.
 *
 * The X-User-Id header is forwarded by Node.js after JWT validation.
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;

    /**
     * POST /api/v1/payments/create-order
     * Creates a Razorpay order and returns orderId + key for frontend.
     * Node forwards the authenticated user's id in X-User-Id header.
     */
    @PostMapping("/create-order")
    public ResponseEntity<Map<String, Object>> createOrder(
            @RequestBody CreateOrderRequest request,
            @RequestHeader("X-User-Id") String userId
    ) throws Exception {
        log.info("Create order request from userId={}", userId);
        Map<String, Object> response = paymentService.createOrder(request, userId);
        return ResponseEntity.ok(response);
    }

    /**
     * POST /api/v1/payments/verify
     * Verifies Razorpay payment HMAC signature, saves payment, fires Kafka event.
     */
    @PostMapping("/verify")
    public ResponseEntity<Map<String, Object>> verifyPayment(
            @RequestBody VerifyPaymentRequest request
    ) {
        Map<String, Object> response = paymentService.verifyPayment(request);
        return ResponseEntity.ok(response);
    }

    /**
     * GET /api/v1/payments/history
     * Get payment history for a user.
     */
    @GetMapping("/history")
    public ResponseEntity<List<Payment>> getPaymentHistory(
            @RequestHeader("X-User-Id") String userId
    ) {
        return ResponseEntity.ok(paymentService.getPaymentHistory(userId));
    }

    /**
     * GET /api/v1/payments/{id}
     * Get single payment by ID.
     */
    @GetMapping("/{id}")
    public ResponseEntity<Payment> getPaymentById(@PathVariable String id) {
        return ResponseEntity.ok(paymentService.getPaymentById(id));
    }

    /**
     * GET /api/v1/payments/admin/all
     * Get all payments (Admin only — Node validates admin token before proxying).
     */
    @GetMapping("/admin/all")
    public ResponseEntity<List<Payment>> getAllPayments() {
        return ResponseEntity.ok(paymentService.getAllPayments());
    }

    /**
     * Health check (also available via /actuator/health)
     */
    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> health() {
        return ResponseEntity.ok(Map.of("status", "UP", "service", "payment-service"));
    }
}
