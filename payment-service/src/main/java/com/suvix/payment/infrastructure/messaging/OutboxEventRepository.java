package com.suvix.payment.infrastructure.messaging;

import com.suvix.payment.infrastructure.messaging.OutboxEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OutboxEventRepository extends JpaRepository<OutboxEvent, Long> {

    @Query("SELECT o FROM OutboxEvent o WHERE o.status = 'pending' AND o.retryCount < 5 ORDER BY o.createdAt ASC")
    List<OutboxEvent> findPendingEventsForPublishing();
}
