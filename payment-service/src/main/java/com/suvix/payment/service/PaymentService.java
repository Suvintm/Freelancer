package com.suvix.payment.service;

import com.razorpay.Order;
import com.razorpay.RazorpayClient;
import com.suvix.payment.kafka.PaymentProducer;
import com.suvix.payment.model.Payment;
import com.suvix.payment.model.dto.CreateOrderRequest;
import com.suvix.payment.model.dto.VerifyPaymentRequest;
import com.suvix.payment.repository.PaymentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.codec.digest.HmacUtils;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Core payment business logic.
 * Handles: create Razorpay order, verify payment HMAC, record payment in PostgreSQL, refund.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class PaymentService {

    private final RazorpayClient razorpayClient;
    private final PaymentRepository paymentRepository;
    private final PaymentProducer paymentProducer;

    @Value("${razorpay.key-id}")
    private String razorpayKeyId;

    @Value("${razorpay.key-secret}")
    private String razorpayKeySecret;

    /** Platform fee percentage (10%) */
    private static final double PLATFORM_FEE_PERCENT = 0.10;

    // ========================= CREATE ORDER =========================

    public Map<String, Object> createOrder(CreateOrderRequest request, String userId) throws Exception {
        log.info("Creating Razorpay order for suvixOrderId={}, amount={}", request.getOrderId(), request.getAmount());

        int amountInPaise = (int) (request.getAmount() * 100);

        JSONObject orderRequest = new JSONObject();
        orderRequest.put("amount", amountInPaise);
        orderRequest.put("currency", request.getCurrency() != null ? request.getCurrency() : "INR");
        orderRequest.put("receipt", request.getOrderId());
        orderRequest.put("notes", new JSONObject().put("suvixOrderId", request.getOrderId()));

        Order razorpayOrder = razorpayClient.orders.create(orderRequest);

        log.info("Razorpay order created: {}", razorpayOrder.get("id").toString());

        Map<String, Object> response = new HashMap<>();
        response.put("razorpayOrderId", razorpayOrder.get("id").toString());
        response.put("amount", amountInPaise);
        response.put("currency", "INR");
        response.put("keyId", razorpayKeyId);
        return response;
    }

    // ========================= VERIFY PAYMENT =========================

    @Transactional
    public Map<String, Object> verifyPayment(VerifyPaymentRequest request) {
        log.info("Verifying payment: razorpayPaymentId={}", request.getRazorpayPaymentId());

        // Step 1: Verify HMAC signature
        String expectedSignature = new HmacUtils("HmacSHA256", razorpayKeySecret)
                .hmacHex(request.getRazorpayOrderId() + "|" + request.getRazorpayPaymentId());

        if (!expectedSignature.equals(request.getRazorpaySignature())) {
            log.warn("Payment signature verification FAILED for orderId={}", request.getRazorpayOrderId());
            throw new RuntimeException("Payment signature verification failed");
        }

        log.info("Payment signature verified ✓ for razorpayPaymentId={}", request.getRazorpayPaymentId());

        // Step 2: Calculate amounts
        BigDecimal totalAmount   = BigDecimal.valueOf(request.getAmount());
        BigDecimal platformFee   = totalAmount.multiply(BigDecimal.valueOf(PLATFORM_FEE_PERCENT));
        BigDecimal editorEarning = totalAmount.subtract(platformFee);

        // Step 3: Save Payment record to PostgreSQL
        Payment payment = Payment.builder()
                .orderId(request.getSuvixOrderId())
                .clientId(parseUuid(request.getClientId()))
                .editorId(parseUuid(request.getEditorId()))
                .amount(totalAmount)
                .platformFee(platformFee)
                .editorEarning(editorEarning)
                .razorpayPaymentId(request.getRazorpayPaymentId())
                .razorpayOrderId(request.getRazorpayOrderId())
                .status(Payment.PaymentStatus.COMPLETED)
                .type(Payment.PaymentType.GIG_PAYMENT)
                .currency("INR")
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();

        payment = paymentRepository.save(payment);
        log.info("Payment saved to PostgreSQL DB: id={}", payment.getId());

        // Step 4: Publish Kafka event → other services react to this
        paymentProducer.publishPaymentVerified(
                payment.getId().toString(),
                request.getSuvixOrderId(),
                request.getClientId(),
                request.getEditorId(),
                request.getAmount()
        );

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("paymentId", payment.getId().toString());
        response.put("message", "Payment verified and recorded");
        return response;
    }

    // ========================= PAYMENT HISTORY =========================

    public List<Payment> getPaymentHistory(String userId) {
        UUID userUuid = parseUuid(userId);
        List<Payment> payments = paymentRepository.findByClientIdOrderByCreatedAtDesc(userUuid);
        if (payments.isEmpty()) {
            payments = paymentRepository.findByEditorIdOrderByCreatedAtDesc(userUuid);
        }
        return payments;
    }

    public Payment getPaymentById(String paymentId) {
        UUID uuid = parseUuid(paymentId);
        return paymentRepository.findById(uuid)
                .orElseThrow(() -> new RuntimeException("Payment not found: " + paymentId));
    }

    public List<Payment> getAllPayments() {
        return paymentRepository.findAll();
    }

    private UUID parseUuid(String id) {
        if (id == null || id.isBlank()) return null;
        try {
            return UUID.fromString(id);
        } catch (IllegalArgumentException e) {
            // Generate deterministic UUID if string is not standard UUID
            return UUID.nameUUIDFromBytes(id.getBytes());
        }
    }
}
