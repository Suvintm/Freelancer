package com.suvix.payment.domain.subscription.repository;

import com.suvix.payment.domain.subscription.entity.CustomerCreditBalance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface CustomerCreditBalanceRepository extends JpaRepository<CustomerCreditBalance, UUID> {
    Optional<CustomerCreditBalance> findByUserId(String userId);
}
