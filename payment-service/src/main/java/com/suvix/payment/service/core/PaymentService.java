package com.suvix.payment.service.core;

import com.suvix.payment.domain.PaymentTransaction;
import com.suvix.payment.dto.request.CreateOrderRequest;
import com.suvix.payment.dto.request.VerifyPaymentRequest;
import com.suvix.payment.dto.response.PaymentResponse;
import com.suvix.payment.kafka.PaymentProducer;
import com.suvix.payment.repository.PaymentTransactionRepository;
import com.suvix.payment.service.provider.PaymentProvider;
import com.suvix.payment.service.provider.PaymentProviderFactory;
import com.suvix.payment.service.security.IdempotencyService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class PaymentService {

    private final PaymentTransactionRepository transactionRepository;
    private final PaymentProviderFactory providerFactory;
    private final PaymentProducer paymentProducer;
    private final IdempotencyService idempotencyService;
    private final WalletService walletService;

    private static final double PLATFORM_FEE_PERCENT = 0.10; // 10% platform fee

    public PaymentResponse createOrder(CreateOrderRequest request, String userId, String idempotencyKey) throws Exception {
        log.info("Creating order for userId={}, amount={}, idempotencyKey={}", userId, request.getAmount(), idempotencyKey);

        // Check Idempotency
        if (idempotencyKey != null && !idempotencyKey.isBlank()) {
            Optional<String> completed = idempotencyService.getCompletedResponse(idempotencyKey);
            if (completed.isPresent()) {
                log.info("Idempotency hit for key: {}", idempotencyKey);
                return PaymentResponse.builder()
                        .success(true)
                        .orderId(request.getOrderId())
                        .status("completed")
                        .message("Order returned from idempotency cache")
                        .build();
            }
        }

        PaymentProvider provider = providerFactory.getProvider(request.getProvider());
        PaymentResponse response = provider.createOrder(request, userId);

        // Create pending payment transaction record
        PaymentTransaction transaction = PaymentTransaction.builder()
                .userId(userId)
                .amount(request.getAmount())
                .currency(request.getCurrency() != null ? request.getCurrency() : "INR")
                .status(PaymentTransaction.PaymentStatus.pending)
                .provider(PaymentTransaction.PaymentProvider.valueOf(provider.getProviderName().toLowerCase()))
                .providerOrderId(response.getRazorpayOrderId())
                .idempotencyKey(idempotencyKey != null ? idempotencyKey : UUID.randomUUID().toString())
                .build();

        transactionRepository.save(transaction);
        response.setTransactionId(transaction.getId());

        return response;
    }

    @Transactional
    public PaymentResponse verifyPayment(VerifyPaymentRequest request, String idempotencyKey) {
        log.info("Verifying payment for orderId={}", request.getRazorpayOrderId());

        PaymentProvider provider = providerFactory.getProvider("razorpay");
        boolean valid = provider.verifySignature(request);

        if (!valid) {
            log.error("Payment signature verification failed for orderId={}", request.getRazorpayOrderId());
            throw new RuntimeException("Payment signature verification failed");
        }

        BigDecimal totalAmount = request.getAmount();
        BigDecimal platformFee = totalAmount.multiply(BigDecimal.valueOf(PLATFORM_FEE_PERCENT));
        BigDecimal editorEarnings = totalAmount.subtract(platformFee);

        PaymentTransaction transaction = transactionRepository.findByProviderOrderId(request.getRazorpayOrderId())
                .orElseGet(() -> PaymentTransaction.builder()
                        .userId(request.getClientId() != null ? request.getClientId() : "anonymous")
                        .amount(totalAmount)
                        .currency("INR")
                        .provider(PaymentTransaction.PaymentProvider.razorpay)
                        .idempotencyKey(idempotencyKey != null ? idempotencyKey : UUID.randomUUID().toString())
                        .build()
                );

        transaction.setProviderPaymentId(request.getRazorpayPaymentId());
        transaction.setProviderSignature(request.getRazorpaySignature());
        transaction.setPlatformFee(platformFee);
        transaction.setEditorEarnings(editorEarnings);
        transaction.setStatus(PaymentTransaction.PaymentStatus.completed);
        transaction.setCompletedAt(Instant.now());

        transaction = transactionRepository.save(transaction);

        // If editorId is present, credit the creator's wallet
        if (request.getEditorId() != null && !request.getEditorId().isBlank()) {
            walletService.creditEarnings(request.getEditorId(), editorEarnings);
        }

        // Publish to Kafka
        paymentProducer.publishPaymentVerified(
                transaction.getId().toString(),
                request.getSuvixOrderId(),
                request.getClientId(),
                request.getEditorId(),
                totalAmount.doubleValue()
        );

        return PaymentResponse.builder()
                .success(true)
                .transactionId(transaction.getId())
                .orderId(request.getSuvixOrderId())
                .status("completed")
                .amount(totalAmount)
                .message("Payment verified and recorded successfully")
                .build();
    }

    public List<PaymentTransaction> getPaymentHistory(String userId) {
        return transactionRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    public PaymentTransaction getPaymentById(UUID id) {
        return transactionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Payment not found: " + id));
    }
}
