package com.suvix.payment.domain.payment.webhook;

import org.springframework.http.HttpHeaders;

public interface PaymentWebhookHandler {

    String getProviderName();

    boolean verifySignature(String rawPayload, HttpHeaders headers);

    NormalizedWebhookEvent parseEvent(String rawPayload);
}