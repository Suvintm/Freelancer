package com.suvix.payment.domain.payment.webhook;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NormalizedWebhookEvent {

    private String eventId;
    private String provider;
    private NormalizedEventType eventType;
    private String userId;
    private String planId;
    private String providerSubscriptionId;
    private String providerPaymentId;
    private String providerCustomerId;
    private String providerInvoiceId;

    private BigDecimal amount;
    private String currency;

    private Instant currentPeriodStart;
    private Instant currentPeriodEnd;

    private String failureReason;
    private Instant eventTimestamp;

    @Builder.Default
    private Map<String, Object> rawData = new HashMap<>();
}