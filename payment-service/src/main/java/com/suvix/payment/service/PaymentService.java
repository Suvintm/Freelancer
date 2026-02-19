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

import java.math.BigDecimal;
import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Core payment business logic.
 * Handles: create Razorpay order, verify payment HMAC, record payment, refund.
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

    /** Platform fee percentage (10%) — match your Node.js config */
    private static final double PLATFORM_FEE_PERCENT = 0.10;

    // ========================= CREATE ORDER =========================

    /**
     * Create a Razorpay order so the frontend can show the payment popup.
     * This is equivalent to your Node.js createPaymentOrder().
     */
    public Map<String, Object> createOrder(CreateOrderRequest request, String userId) throws Exception {
        log.info("Creating Razorpay order for suvixOrderId={}, amount={}", request.getOrderId(), request.getAmount());

        // Amount must be in paise (1 INR = 100 paise)
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

    /**
     * Verify the HMAC signature from Razorpay.
     * If valid, save the Payment record and publish Kafka event.
     * Equivalent to your Node.js verifyPayment().
     */
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
        BigDecimal totalAmount  = BigDecimal.valueOf(request.getAmount());
        BigDecimal platformFee  = totalAmount.multiply(BigDecimal.valueOf(PLATFORM_FEE_PERCENT));
        BigDecimal editorEarning = totalAmount.subtract(platformFee);

        // Step 3: Save Payment record to MongoDB
        Payment payment = Payment.builder()
                .orderId(request.getSuvixOrderId())
                .clientId(request.getClientId())
                .editorId(request.getEditorId())
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
        log.info("Payment saved to DB: _id={}", payment.getId());

        // Step 4: Publish Kafka event → other services react to this
        paymentProducer.publishPaymentVerified(
                payment.getId(),
                request.getSuvixOrderId(),
                request.getClientId(),
                request.getEditorId(),
                request.getAmount()
        );

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("paymentId", payment.getId());
        response.put("message", "Payment verified and recorded");
        return response;
    }

    // ========================= PAYMENT HISTORY =========================

    public List<Payment> getPaymentHistory(String userId) {
        // Returns history for both clients and editors
        List<Payment> payments = paymentRepository.findByClientIdOrderByCreatedAtDesc(userId);
        if (payments.isEmpty()) {
            payments = paymentRepository.findByEditorIdOrderByCreatedAtDesc(userId);
        }
        return payments;
    }

    public Payment getPaymentById(String paymentId) {
        return paymentRepository.findById(paymentId)
                .orElseThrow(() -> new RuntimeException("Payment not found: " + paymentId));
    }

    public List<Payment> getAllPayments() {
        return paymentRepository.findAll();
    }
}
