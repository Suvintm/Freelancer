package com.suvix.payment.infrastructure.audit;

import com.suvix.payment.infrastructure.audit.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {
    List<AuditLog> findByTableNameAndRecordIdOrderByChangedAtDesc(String tableName, String recordId);
}
