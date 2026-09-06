package com.suvix.payment.domain.payout.repository;

import com.suvix.payment.domain.payout.entity.Payout;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface PayoutRepository extends JpaRepository<Payout, UUID> {

    List<Payout> findByUserIdOrderByCreatedAtDesc(String userId);

    List<Payout> findByStatus(Payout.PayoutStatus status);

    List<Payout> findByProviderBatchId(String providerBatchId);
}
