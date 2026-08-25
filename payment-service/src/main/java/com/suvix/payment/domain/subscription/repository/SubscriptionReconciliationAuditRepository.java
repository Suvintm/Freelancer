package com.suvix.payment.domain.subscription.repository;

import com.suvix.payment.domain.subscription.entity.SubscriptionReconciliationAudit;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface SubscriptionReconciliationAuditRepository extends JpaRepository<SubscriptionReconciliationAudit, UUID> {
    Page<SubscriptionReconciliationAudit> findAllByOrderByReconciledAtDesc(Pageable pageable);
}