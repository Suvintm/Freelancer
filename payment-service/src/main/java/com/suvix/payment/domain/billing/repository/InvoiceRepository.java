package com.suvix.payment.domain.billing.repository;

import com.suvix.payment.domain.billing.entity.Invoice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface InvoiceRepository extends JpaRepository<Invoice, UUID> {
    List<Invoice> findByUserIdOrderByCreatedAtDesc(String userId);
    List<Invoice> findBySubscriptionIdOrderByCreatedAtDesc(UUID subscriptionId);
    Optional<Invoice> findByInvoiceNumber(String invoiceNumber);
}