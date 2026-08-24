package com.suvix.payment.domain.subscription.repository;

import com.suvix.payment.domain.subscription.entity.Subscription;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface SubscriptionRepository extends JpaRepository<Subscription, UUID> {

    Optional<Subscription> findFirstByUserIdAndStatusOrderByCreatedAtDesc(
        String userId, Subscription.SubscriptionStatus status
    );

    List<Subscription> findByUserIdOrderByCreatedAtDesc(String userId);

    @Query("SELECT s FROM Subscription s WHERE s.status = :status AND s.currentPeriodEnd <= :cutoff")
    List<Subscription> findDueForRenewal(
        @Param("status") Subscription.SubscriptionStatus status,
        @Param("cutoff") Instant cutoff
    );

    Optional<Subscription> findByProviderSubscriptionId(String providerSubscriptionId);
}
