package com.suvix.payment.domain.subscription.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.*;

import java.util.List;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class SubscriptionDashboardResponse {

    private boolean success;
    private String role;
    private String currency;
    private List<PlanPresenterDto> plans;
    private SubscriptionResponse activeSubscription;
    private Map<String, Object> usageSummary;
    private Map<String, Object> meta;
}
