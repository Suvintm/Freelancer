package com.suvix.payment.dto.response;

import lombok.*;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WalletBalanceResponse {
    private String userId;
    private BigDecimal totalBalance;
    private BigDecimal holdBalance;
    private BigDecimal availableBalance;
    private BigDecimal totalEarned;
    private BigDecimal totalWithdrawn;
    private String currency;
    private String kycStatus;
}
