package com.suvix.payment.domain.payment.dto.request;

import com.fasterxml.jackson.annotation.JsonAlias;
import lombok.*;

import java.math.BigDecimal;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateOrderRequest {

    @JsonAlias({"orderId", "order_id"})
    private String orderId;

    private BigDecimal amount;

    @Builder.Default
    private String currency = "INR";

    @JsonAlias({"clientId", "client_id", "userId", "user_id"})
    private String clientId;

    @JsonAlias({"userId", "user_id"})
    private String userId;

    @JsonAlias({"editorId", "editor_id"})
    private String editorId;

    @Builder.Default
    private String provider = "razorpay";

    // Enterprise Zero-Trust Subscription Fields
    @JsonAlias({"planId", "plan_id"})
    private String planId;

    @JsonAlias({"billingCycle", "billing_cycle"})
    private String billingCycle; // monthly | annual

    @JsonAlias({"billingInterval", "billing_interval"})
    private String billingInterval; // month | year

    @JsonAlias({"couponCode", "coupon_code", "coupon"})
    private String couponCode;

    @JsonAlias({"targetRole", "target_role", "role"})
    private String targetRole;

    @JsonAlias({"customerName", "customer_name", "userName", "user_name", "name"})
    private String customerName;

    @JsonAlias({"customerEmail", "customer_email", "userEmail", "user_email", "email"})
    private String customerEmail;

    @JsonAlias({"customerGstin", "customer_gstin", "gstin"})
    private String customerGstin;

    private Map<String, Object> metadata;
}
