package com.suvix.payment.domain.subscription.repository;

import com.suvix.payment.domain.subscription.entity.SubscriptionPlan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SubscriptionPlanRepository extends JpaRepository<SubscriptionPlan, String> {
    List<SubscriptionPlan> findByIsActiveTrueOrderByTierLevelAsc();
}
