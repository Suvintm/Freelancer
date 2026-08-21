package com.suvix.payment.repository;

import com.suvix.payment.model.Payment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, UUID> {

    List<Payment> findByClientIdOrderByCreatedAtDesc(UUID clientId);

    List<Payment> findByEditorIdOrderByCreatedAtDesc(UUID editorId);

    Optional<Payment> findByRazorpayPaymentId(String razorpayPaymentId);

    Optional<Payment> findByOrderId(String orderId);

    List<Payment> findByStatus(Payment.PaymentStatus status);
}
