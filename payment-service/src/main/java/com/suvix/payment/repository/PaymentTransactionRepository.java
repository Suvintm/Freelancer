package com.suvix.payment.repository;

import com.suvix.payment.domain.PaymentTransaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PaymentTransactionRepository extends JpaRepository<PaymentTransaction, UUID> {

    Optional<PaymentTransaction> findByIdempotencyKey(String idempotencyKey);

    Optional<PaymentTransaction> findByProviderOrderId(String providerOrderId);

    Optional<PaymentTransaction> findByProviderPaymentId(String providerPaymentId);

    List<PaymentTransaction> findByUserIdOrderByCreatedAtDesc(String userId);

    List<PaymentTransaction> findByUserIdAndStatusOrderByCreatedAtDesc(
        String userId, PaymentTransaction.PaymentStatus status
    );
}
