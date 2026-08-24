package com.suvix.payment.domain.escrow.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateEscrowRequest {

    @NotNull(message = "Transaction ID is required")
    private UUID transactionId;

    @NotBlank(message = "Payee User ID is required")
    private String payeeUserId;

    @NotNull(message = "Amount is required")
    @DecimalMin(value = "1.00")
    private BigDecimal amount;

    private String releaseCondition = "content_delivered";

    private int expirationDays = 30;
}
