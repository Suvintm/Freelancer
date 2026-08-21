package com.suvix.payment.dto.response;

import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EscrowResponse {
    private UUID escrowId;
    private UUID transactionId;
    private String payerUserId;
    private String payeeUserId;
    private BigDecimal amount;
    private BigDecimal platformFee;
    private String status;
    private String releaseCondition;
    private Instant heldAt;
    private Instant releasedAt;
    private Instant expiresAt;
    private String message;
}
