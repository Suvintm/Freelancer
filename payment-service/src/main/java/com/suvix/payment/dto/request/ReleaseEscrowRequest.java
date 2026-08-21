package com.suvix.payment.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReleaseEscrowRequest {

    @NotNull(message = "Escrow ID is required")
    private UUID escrowId;

    private String approvalNotes;
}
