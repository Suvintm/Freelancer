package com.suvix.payment.domain.payment.service;

import io.github.resilience4j.bulkhead.annotation.Bulkhead;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import io.github.resilience4j.retry.annotation.Retry;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.function.Supplier;

@Slf4j
@Service
public class PaymentResilienceService {

    /**
     * Executes payment gateway calls protected by Resilience4j CircuitBreaker, Bulkhead, and Retry
     */
    @CircuitBreaker(name = "paymentProvider", fallbackMethod = "gatewayFallback")
    @Bulkhead(name = "paymentBulkhead")
    @Retry(name = "paymentRetry")
    public <T> T executeWithResilience(String providerName, Supplier<T> operation) {
        return operation.get();
    }

    /**
     * Fallback handler when primary payment provider circuit breaker is OPEN or fails
     */
    public <T> T gatewayFallback(String providerName, Supplier<T> operation, Throwable t) {
        log.error("Payment gateway [{}] Circuit Breaker tripped or call failed: {}", providerName, t.getMessage());
        throw new IllegalStateException("Payment Gateway [" + providerName + "] is currently experiencing high latency or downtime. Please try again or use an alternative payment method.", t);
    }
}