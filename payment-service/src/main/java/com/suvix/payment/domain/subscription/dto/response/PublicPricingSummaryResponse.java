package com.suvix.payment.domain.subscription.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.*;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class PublicPricingSummaryResponse {

    private boolean success;
    private List<String> availableRoles;
    private String currency;
    private int maxSavingsPercent;
    private List<PublicPlanSummaryDto> plans;
}
