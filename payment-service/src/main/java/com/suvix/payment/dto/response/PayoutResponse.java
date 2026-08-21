package com.suvix.payment.dto.response;

import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PayoutResponse {
    private UUID payoutId;
    private String userId;
    private BigDecimal amount;
    private BigDecimal platformFee;
    private BigDecimal netAmount;
    private String currency;
    private String status;
    private String destinationType;
    private Instant createdAt;
    private String message;
}
