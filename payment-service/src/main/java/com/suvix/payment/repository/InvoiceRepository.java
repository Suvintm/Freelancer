package com.suvix.payment.repository;

import com.suvix.payment.domain.Invoice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface InvoiceRepository extends JpaRepository<Invoice, UUID> {
    Optional<Invoice> findByInvoiceNumber(String invoiceNumber);
    List<Invoice> findByUserIdOrderByInvoiceDateDesc(String userId);
    Optional<Invoice> findByTransactionId(UUID transactionId);
}
