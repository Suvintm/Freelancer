package com.suvix.payment.domain.escrow.service;

import com.suvix.payment.domain.escrow.entity.Escrow;
import com.suvix.payment.domain.escrow.dto.request.CreateEscrowRequest;
import com.suvix.payment.domain.escrow.dto.request.ReleaseEscrowRequest;
import com.suvix.payment.domain.escrow.dto.response.EscrowResponse;
import com.suvix.payment.domain.escrow.repository.EscrowRepository;
import com.suvix.payment.domain.wallet.service.WalletService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class EscrowService {

    private final EscrowRepository escrowRepository;
    private final WalletService walletService;

    private static final double PLATFORM_FEE_PERCENT = 0.05; // 5% fee for gig escrow

    @Transactional
    public EscrowResponse createEscrow(CreateEscrowRequest request, String payerUserId) {
        BigDecimal platformFee = request.getAmount().multiply(BigDecimal.valueOf(PLATFORM_FEE_PERCENT));

        Escrow escrow = Escrow.builder()
                .transactionId(request.getTransactionId())
                .payerUserId(payerUserId)
                .payeeUserId(request.getPayeeUserId())
                .amount(request.getAmount())
                .platformFee(platformFee)
                .status(Escrow.EscrowStatus.held)
                .releaseCondition(request.getReleaseCondition())
                .expiresAt(Instant.now().plus(request.getExpirationDays(), ChronoUnit.DAYS))
                .build();

        escrow = escrowRepository.save(escrow);
        log.info("Escrow created: id={}, payer={}, payee={}, amount={}", escrow.getId(), payerUserId, request.getPayeeUserId(), request.getAmount());

        return mapToResponse(escrow, "Escrow funds held securely");
    }

    @Transactional
    public EscrowResponse releaseEscrow(ReleaseEscrowRequest request, String callerUserId) {
        Escrow escrow = escrowRepository.findById(request.getEscrowId())
                .orElseThrow(() -> new IllegalArgumentException("Escrow not found: " + request.getEscrowId()));

        if (escrow.getStatus() != Escrow.EscrowStatus.held) {
            throw new IllegalStateException("Escrow is not in HELD state: " + escrow.getStatus());
        }

        BigDecimal netPayeeEarnings = escrow.getAmount().subtract(escrow.getPlatformFee());

        // Credit payee's wallet
        walletService.creditEarnings(escrow.getPayeeUserId(), netPayeeEarnings);

        escrow.setStatus(Escrow.EscrowStatus.released);
        escrow.setReleasedAt(Instant.now());
        escrow.setResolvedBy(callerUserId);
        escrow.setResolutionNotes(request.getApprovalNotes());
        escrowRepository.save(escrow);

        log.info("Escrow released: id={}, payee={}, creditedAmount={}", escrow.getId(), escrow.getPayeeUserId(), netPayeeEarnings);

        return mapToResponse(escrow, "Escrow released successfully to creator wallet");
    }

    private EscrowResponse mapToResponse(Escrow escrow, String message) {
        return EscrowResponse.builder()
                .escrowId(escrow.getId())
                .transactionId(escrow.getTransactionId())
                .payerUserId(escrow.getPayerUserId())
                .payeeUserId(escrow.getPayeeUserId())
                .amount(escrow.getAmount())
                .platformFee(escrow.getPlatformFee())
                .status(escrow.getStatus().name())
                .releaseCondition(escrow.getReleaseCondition())
                .heldAt(escrow.getHeldAt())
                .releasedAt(escrow.getReleasedAt())
                .expiresAt(escrow.getExpiresAt())
                .message(message)
                .build();
    }
}
