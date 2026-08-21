package com.suvix.payment.repository;

import com.suvix.payment.domain.UsageTracking;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UsageTrackingRepository extends JpaRepository<UsageTracking, Long> {

    Optional<UsageTracking> findByUserIdAndFeatureNameAndUsagePeriod(
        String userId, String featureName, String usagePeriod
    );

    @Modifying
    @Query("UPDATE UsageTracking u SET u.usageCount = u.usageCount + :increment, u.lastUsedAt = CURRENT_TIMESTAMP " +
           "WHERE u.userId = :userId AND u.featureName = :featureName AND u.usagePeriod = :usagePeriod")
    int incrementUsage(
        @Param("userId") String userId,
        @Param("featureName") String featureName,
        @Param("usagePeriod") String usagePeriod,
        @Param("increment") int increment
    );
}
