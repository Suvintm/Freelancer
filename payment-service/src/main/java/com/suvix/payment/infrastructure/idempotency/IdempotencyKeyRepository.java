package com.suvix.payment.infrastructure.idempotency;

import com.suvix.payment.infrastructure.idempotency.IdempotencyKeyRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.Optional;

@Repository
public interface IdempotencyKeyRepository extends JpaRepository<IdempotencyKeyRecord, String> {

    Optional<IdempotencyKeyRecord> findByIdAndExpiresAtAfter(String id, Instant now);

    @Modifying
    @Query("DELETE FROM IdempotencyKeyRecord i WHERE i.expiresAt < :now")
    int deleteExpiredKeys(@Param("now") Instant now);
}
