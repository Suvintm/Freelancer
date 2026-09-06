package com.suvix.payment.domain.subscription.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class PlanPresenterDto {

    private String id;
    private String name;
    private String slug;
    private String description;
    private String subtitle;
    private String targetRole;
    private int tierLevel;
    private int version;
    private BigDecimal priceMonthly;
    private BigDecimal priceAnnual;
    private String currency;
    private int trialDays;
    private boolean isPopular;
    private String badge;
    private String icon;
    private String buttonText;
    private boolean isActive;
    private int displayOrder;

    // Server-Driven UI (SDUI): Ready-to-render feature strings & quota pills directly from database
    private List<String> features;
    private List<Map<String, String>> quotas;

    // Technical feature flags & limit numbers for runtime gating & meters
    private Map<String, Object> featureFlags;
    private Map<String, Object> limitValues;

    // Server-side Enterprise Pricing Structure (SAC 998439)
    private Map<String, Object> pricing;
}
