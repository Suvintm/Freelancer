package com.suvix.payment.domain.subscription.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.*;

import java.math.BigDecimal;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class PublicPlanSummaryDto {

    private String id;
    private String name;
    private String slug;
    private String subtitle;
    private String targetRole;
    private int tierLevel;
    private BigDecimal priceMonthly;
    private BigDecimal priceAnnual;
    private String currency;
    private boolean isPopular;
    private String badge;
    private String icon;
    private String buttonText;
    private int savingsPercent;
    private List<String> features;
}
