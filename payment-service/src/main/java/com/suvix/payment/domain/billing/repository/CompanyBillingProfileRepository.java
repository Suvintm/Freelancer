package com.suvix.payment.domain.billing.repository;

import com.suvix.payment.domain.billing.entity.CompanyBillingProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CompanyBillingProfileRepository extends JpaRepository<CompanyBillingProfile, String> {

    Optional<CompanyBillingProfile> findFirstByIsDefaultTrue();
}
