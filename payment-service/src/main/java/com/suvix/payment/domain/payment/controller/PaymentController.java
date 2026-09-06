package com.suvix.payment.domain.payment.controller;

import com.suvix.payment.domain.payment.entity.PaymentTransaction;
import com.suvix.payment.domain.payment.dto.request.CreateOrderRequest;
import com.suvix.payment.domain.payment.dto.request.VerifyPaymentRequest;
import com.suvix.payment.domain.payment.dto.response.PaymentResponse;
import com.suvix.payment.domain.payment.service.PaymentService;
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
        System.out.println("\n=======================================================");
        System.out.println("  [JAVA PAYMENT-SERVICE] 💳 POST /api/v1/payments/create-order");
        System.out.println("  User ID: " + userId + " | Amount: ₹" + request.getAmount() + " | Provider: " + request.getProvider());
        System.out.println("=======================================================");
        log.info("Create order request from userId={}", userId);
        return ResponseEntity.ok(paymentService.createOrder(request, userId, idempotencyKey));
    }

    @PostMapping("/verify")
    public ResponseEntity<PaymentResponse> verifyPayment(
            @Valid @RequestBody VerifyPaymentRequest request,
            @RequestHeader(value = "Idempotency-Key", required = false) String idempotencyKey
    ) {
        System.out.println("\n=======================================================");
        System.out.println("  [JAVA PAYMENT-SERVICE] 🔐 POST /api/v1/payments/verify");
        System.out.println("  Razorpay Order ID: " + request.getRazorpayOrderId() + " | Payment ID: " + request.getRazorpayPaymentId());
        System.out.println("=======================================================");
        log.info("Verify payment request for orderId={}", request.getRazorpayOrderId());
        return ResponseEntity.ok(paymentService.verifyPayment(request, idempotencyKey));
    }

    @GetMapping("/history")
    public ResponseEntity<List<PaymentTransaction>> getPaymentHistory(
            @RequestHeader(value = "X-User-Id", required = false) String headerUserId,
            @RequestParam(value = "userId", required = false) String paramUserId
    ) {
        String userId = (headerUserId != null && !headerUserId.isBlank()) ? headerUserId : paramUserId;
        if (userId == null || userId.isBlank()) {
            return ResponseEntity.ok(List.of());
        }
        return ResponseEntity.ok(paymentService.getPaymentHistory(userId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<PaymentTransaction> getPaymentById(@PathVariable UUID id) {
        return ResponseEntity.ok(paymentService.getPaymentById(id));
    }

    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> getPaymentStatus(
            @RequestParam("orderId") String orderId
    ) {
        System.out.println("\n  [JAVA PAYMENT-SERVICE] 🔍 GET /api/v1/payments/status?orderId=" + orderId);
        log.info("Payment status check for orderId={}", orderId);
        return ResponseEntity.ok(paymentService.getPaymentStatusByOrderId(orderId));
    }

    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> health() {
        return ResponseEntity.ok(Map.of("status", "UP", "service", "payment-service"));
    }
}
