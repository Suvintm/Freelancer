package com.suvix.payment.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreatePayoutRequest {

    @NotNull(message = "Amount is required")
    @DecimalMin(value = "100.00", message = "Minimum payout amount is 100.00")
    private BigDecimal amount;

    @NotBlank(message = "Destination type is required (bank_account / upi)")
    private String destinationType;

    @NotBlank(message = "Destination account details (bank account or UPI ID) required")
    private String destinationDetails;

    private String description;
}
