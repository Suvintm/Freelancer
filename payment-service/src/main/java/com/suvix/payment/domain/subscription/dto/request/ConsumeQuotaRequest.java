package com.suvix.payment.domain.subscription.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ConsumeQuotaRequest {

    @NotBlank(message = "Feature name is required")
    private String featureName;

    @Builder.Default
    @Min(value = 1, message = "Consumption units must be at least 1")
    private int units = 1;

    @Builder.Default
    private String mode = "HARD_LIMIT"; // HARD_LIMIT (reject if exceeded) or SOFT_OVERAGE (allow and track overage)

    private Map<String, Object> metadata;
}