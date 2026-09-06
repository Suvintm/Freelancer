package com.suvix.payment.domain.payment.webhook;

import com.suvix.payment.domain.subscription.service.SubscriptionLifecycleBillingService;
import com.suvix.payment.infrastructure.redis.RedisService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
public class WebhookDispatcherService {

    private final Map<String, PaymentWebhookHandler> handlerMap;
    private final SubscriptionLifecycleBillingService billingService;
    private final RedisService redisService;

    public WebhookDispatcherService(
            List<PaymentWebhookHandler> handlers,
            SubscriptionLifecycleBillingService billingService,
            RedisService redisService
    ) {
        this.handlerMap = handlers.stream()
                .collect(Collectors.toMap(h -> h.getProviderName().toLowerCase(), h -> h));
        this.billingService = billingService;
        this.redisService = redisService;
    }

    public boolean dispatchWebhook(String provider, String rawPayload, HttpHeaders headers) {
        PaymentWebhookHandler handler = handlerMap.get(provider.toLowerCase());
        if (handler == null) {
            log.warn("No webhook handler registered for provider: {}", provider);
            return false;
        }

        // 1. Verify cryptographic signature
        boolean isValidSignature = handler.verifySignature(rawPayload, headers);
        if (!isValidSignature) {
            log.warn("Invalid webhook signature from provider: {}", provider);
            return false;
        }

        // 2. Parse normalized event
        NormalizedWebhookEvent event = handler.parseEvent(rawPayload);

        // 3. Deduplication check via Redis (12-hour optimal TTL to minimize RAM footprint)
        String deduplicationKey = String.format("webhook:processed:%s:%s", provider, event.getEventId());
        if (redisService.hasKey(deduplicationKey)) {
            log.info("Duplicate webhook event skipped: key={}", deduplicationKey);
            return true;
        }

        // 4. Mark processed in Redis (12 hours TTL is sufficient for Razorpay/Stripe retry windows)
        redisService.setex(deduplicationKey, "processed", 43200); // 12 hours

        // 5. Delegate to Core Subscription Lifecycle Billing Service
        billingService.processNormalizedWebhook(event);

        return true;
    }
}