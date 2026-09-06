package com.suvix.payment.domain.escrow.service;

import com.suvix.payment.domain.escrow.entity.Escrow;
import com.suvix.payment.domain.escrow.dto.request.ReleaseEscrowRequest;
import com.suvix.payment.domain.escrow.repository.EscrowRepository;
import com.suvix.payment.domain.escrow.service.EscrowService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class EscrowAutoReleaseScheduler {

    private final EscrowRepository escrowRepository;
    private final EscrowService escrowService;

    /**
     * Runs every 12 hours to auto-release held escrows after expiration (e.g. 7-30 days)
     */
    @Scheduled(cron = "0 0 */12 * * *")
    public void autoReleaseExpiredEscrows() {
        List<Escrow> expiredEscrows = escrowRepository.findExpiredEscrows(
                Escrow.EscrowStatus.held, Instant.now()
        );

        if (expiredEscrows.isEmpty()) {
            return;
        }

        log.info("Found {} expired escrows eligible for automatic release", expiredEscrows.size());
        for (Escrow escrow : expiredEscrows) {
            try {
                ReleaseEscrowRequest request = ReleaseEscrowRequest.builder()
                        .escrowId(escrow.getId())
                        .approvalNotes("Automated release after dispute window expiration")
                        .build();
                escrowService.releaseEscrow(request, "system-auto-release");
                log.info("Successfully auto-released escrow {}", escrow.getId());
            } catch (Exception e) {
                log.error("Failed to auto-release escrow {}: {}", escrow.getId(), e.getMessage());
            }
        }
    }
}
