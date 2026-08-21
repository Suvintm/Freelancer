package com.suvix.payment.controller;

import com.suvix.payment.domain.PaymentTransaction;
import com.suvix.payment.dto.request.CreateOrderRequest;
import com.suvix.payment.dto.request.VerifyPaymentRequest;
import com.suvix.payment.dto.response.PaymentResponse;
import com.suvix.payment.service.core.PaymentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/api/v1/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;

    @PostMapping("/create-order")
    public ResponseEntity<PaymentResponse> createOrder(
            @Valid @RequestBody CreateOrderRequest request,
            @RequestHeader(value = "X-User-Id", required = false, defaultValue = "anonymous") String userId,
            @RequestHeader(value = "Idempotency-Key", required = false) String idempotencyKey
    ) throws Exception {
        log.info("Create order request from userId={}", userId);
        return ResponseEntity.ok(paymentService.createOrder(request, userId, idempotencyKey));
    }

    @PostMapping("/verify")
    public ResponseEntity<PaymentResponse> verifyPayment(
            @Valid @RequestBody VerifyPaymentRequest request,
            @RequestHeader(value = "Idempotency-Key", required = false) String idempotencyKey
    ) {
        log.info("Verify payment request for orderId={}", request.getRazorpayOrderId());
        return ResponseEntity.ok(paymentService.verifyPayment(request, idempotencyKey));
    }

    @GetMapping("/history")
    public ResponseEntity<List<PaymentTransaction>> getPaymentHistory(
            @RequestHeader("X-User-Id") String userId
    ) {
        return ResponseEntity.ok(paymentService.getPaymentHistory(userId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<PaymentTransaction> getPaymentById(@PathVariable UUID id) {
        return ResponseEntity.ok(paymentService.getPaymentById(id));
    }

    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> health() {
        return ResponseEntity.ok(Map.of("status", "UP", "service", "payment-service"));
    }
}
