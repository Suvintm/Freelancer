package com.suvix.payment.domain.subscription.repository;

import com.suvix.payment.domain.subscription.entity.SubscriptionLedger;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface SubscriptionLedgerRepository extends JpaRepository<SubscriptionLedger, UUID> {
    List<SubscriptionLedger> findBySubscriptionIdOrderByCreatedAtDesc(UUID subscriptionId);
}