package com.suvix.payment.domain.escrow.repository;

import com.suvix.payment.domain.escrow.entity.Escrow;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface EscrowRepository extends JpaRepository<Escrow, UUID> {

    List<Escrow> findByPayerUserIdOrderByCreatedAtDesc(String payerUserId);

    List<Escrow> findByPayeeUserIdOrderByCreatedAtDesc(String payeeUserId);

    Optional<Escrow> findByTransactionId(UUID transactionId);

    @Query("SELECT e FROM Escrow e WHERE e.status = :status AND e.expiresAt <= :cutoff")
    List<Escrow> findExpiredEscrows(
        @Param("status") Escrow.EscrowStatus status,
        @Param("cutoff") Instant cutoff
    );
}
