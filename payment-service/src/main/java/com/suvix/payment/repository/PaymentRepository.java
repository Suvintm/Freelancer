package com.suvix.payment.repository;

import com.suvix.payment.model.Payment;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PaymentRepository extends MongoRepository<Payment, String> {

    List<Payment> findByClientIdOrderByCreatedAtDesc(String clientId);

    List<Payment> findByEditorIdOrderByCreatedAtDesc(String editorId);

    Optional<Payment> findByRazorpayPaymentId(String razorpayPaymentId);

    Optional<Payment> findByOrderId(String orderId);

    List<Payment> findByStatus(Payment.PaymentStatus status);
}
