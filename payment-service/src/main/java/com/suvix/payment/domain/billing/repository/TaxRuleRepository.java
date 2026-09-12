package com.suvix.payment.domain.billing.repository;

import com.suvix.payment.domain.billing.entity.TaxRule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TaxRuleRepository extends JpaRepository<TaxRule, String> {

    @Query("SELECT t FROM TaxRule t WHERE t.countryCode = :countryCode AND t.isActive = true ORDER BY (CASE WHEN t.stateCode = :stateCode THEN 0 WHEN t.stateCode = 'ALL' THEN 1 ELSE 2 END) ASC")
    List<TaxRule> findMatchingRules(@Param("countryCode") String countryCode, @Param("stateCode") String stateCode);

    default Optional<TaxRule> findActiveRule(String countryCode, String stateCode) {
        List<TaxRule> list = findMatchingRules(countryCode, stateCode != null ? stateCode : "ALL");
        return list.isEmpty() ? Optional.empty() : Optional.of(list.get(0));
    }

    Optional<TaxRule> findFirstByIsActiveTrue();
}
