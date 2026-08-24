package com.suvix.payment.domain.payment.service;

import com.suvix.payment.domain.payment.entity.PaymentTransaction;
import com.suvix.payment.domain.payment.entity.Refund;
import com.suvix.payment.domain.payment.repository.PaymentTransactionRepository;
import com.suvix.payment.domain.payment.repository.RefundRepository;
import com.suvix.payment.domain.payment.service.provider.PaymentProvider;
import com.suvix.payment.domain.payment.service.provider.PaymentProviderFactory;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class RefundService {

    private final RefundRepository refundRepository;
    private final PaymentTransactionRepository transactionRepository;
    private final PaymentProviderFactory providerFactory;

    @Transactional
    public Refund processRefund(UUID transactionId, BigDecimal amount, String reason, String initiatedBy) throws Exception {
        PaymentTransaction transaction = transactionRepository.findById(transactionId)
                .orElseThrow(() -> new IllegalArgumentException("Transaction not found: " + transactionId));

        PaymentProvider provider = providerFactory.getProvider(transaction.getProvider().name());
        String providerRefundId = provider.processRefund(transaction.getProviderPaymentId(), amount, reason);

        Refund refund = Refund.builder()
                .transactionId(transactionId)
                .amount(amount)
                .currency(transaction.getCurrency())
                .status(Refund.RefundStatus.completed)
                .provider(transaction.getProvider().name())
                .providerRefundId(providerRefundId)
                .reason(reason)
                .initiatedBy(initiatedBy)
                .initiatedByType("user")
                .completedAt(Instant.now())
                .build();

        refund = refundRepository.save(refund);

        transaction.setStatus(PaymentTransaction.PaymentStatus.refunded);
        transactionRepository.save(transaction);

        log.info("Refund processed: id={}, txnId={}, amount={}", refund.getId(), transactionId, amount);
        return refund;
    }
}
