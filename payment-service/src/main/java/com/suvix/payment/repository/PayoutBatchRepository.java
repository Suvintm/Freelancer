package com.suvix.payment.repository;

import com.suvix.payment.domain.PayoutBatch;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface PayoutBatchRepository extends JpaRepository<PayoutBatch, UUID> {
    Optional<PayoutBatch> findByProviderBatchId(String providerBatchId);
}
