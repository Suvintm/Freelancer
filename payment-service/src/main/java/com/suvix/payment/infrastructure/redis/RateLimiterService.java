package com.suvix.payment.infrastructure.redis;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;

@Slf4j
@Service
@RequiredArgsConstructor
public class RateLimiterService {

    private final StringRedisTemplate redisTemplate;

    /**
     * Sliding counter rate limiter
     * Returns true if allowed, false if limit exceeded
     */
    public boolean isAllowed(String key, int maxRequests, int windowSeconds) {
        String rateKey = "rate_limit:" + key;
        try {
            Long current = redisTemplate.opsForValue().increment(rateKey);
            if (current != null && current == 1) {
                redisTemplate.expire(rateKey, Duration.ofSeconds(windowSeconds));
            }
            return current != null && current <= maxRequests;
        } catch (Exception e) {
            log.warn("Rate limiter check failed for key={}: {}. Failing open.", key, e.getMessage());
            return true; // Fail open
        }
    }
}