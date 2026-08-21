package com.suvix.payment.repository;

import com.suvix.payment.domain.Refund;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface RefundRepository extends JpaRepository<Refund, UUID> {
    List<Refund> findByTransactionId(UUID transactionId);
    List<Refund> findByInitiatedByOrderByCreatedAtDesc(String initiatedBy);
}
