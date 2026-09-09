package com.suvix.payment.domain.subscription.repository;

import com.suvix.payment.domain.subscription.entity.SubscriptionTransition;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface SubscriptionTransitionRepository extends JpaRepository<SubscriptionTransition, UUID> {
    List<SubscriptionTransition> findByUserIdOrderByCreatedAtDesc(String userId);
    List<SubscriptionTransition> findBySubscriptionIdOrderByCreatedAtDesc(UUID subscriptionId);
}
