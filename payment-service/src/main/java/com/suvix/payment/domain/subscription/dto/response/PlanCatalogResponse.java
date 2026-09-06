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
public class PlanCatalogResponse {

    private boolean success;
    private String role;
    private String currency;
    private List<PlanPresenterDto> plans;
    private Map<String, Object> data;
    private Map<String, Object> meta;
}
