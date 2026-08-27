package com.suvix.payment.domain.subscription.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.script.DefaultRedisScript;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.util.Collections;
import java.util.UUID;
import java.util.function.Supplier;

@Slf4j
@Component
@RequiredArgsConstructor
public class SubscriptionLock {

    private final StringRedisTemplate redisTemplate;

    private static final String RELEASE_LOCK_LUA =
            "if redis.call('get', KEYS[1]) == ARGV[1] then " +
            "return redis.call('del', KEYS[1]) else return 0 end";

    public static final long DEFAULT_LOCK_TIMEOUT_SECONDS = 15;

    public String acquireLock(String userId, String operation) {
        return acquireLock(userId, operation, DEFAULT_LOCK_TIMEOUT_SECONDS);
    }

    public String acquireLock(String userId, String operation, long timeoutSeconds) {
        String lockKey = String.format("lock:subscription:%s:%s", userId, operation);
        String lockValue = UUID.randomUUID().toString();

        Boolean acquired = redisTemplate.opsForValue()
                .setIfAbsent(lockKey, lockValue, Duration.ofSeconds(timeoutSeconds));

        if (Boolean.TRUE.equals(acquired)) {
            return lockValue;
        }
        return null;
    }

    public String acquireLockWithRetry(String userId, String operation, long timeoutSeconds, int maxRetries, long delayMs) {
        for (int i = 0; i < maxRetries; i++) {
            String lock = acquireLock(userId, operation, timeoutSeconds);
            if (lock != null) {
                return lock;
            }
            try {
                Thread.sleep(delayMs);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                break;
            }
        }
        return null;
    }

    public boolean releaseLock(String userId, String operation, String lockValue) {
        if (lockValue == null) {
            return false;
        }
        String lockKey = String.format("lock:subscription:%s:%s", userId, operation);
        try {
            DefaultRedisScript<Long> script = new DefaultRedisScript<>(RELEASE_LOCK_LUA, Long.class);
            Long result = redisTemplate.execute(script, Collections.singletonList(lockKey), lockValue);
            return result != null && result > 0;
        } catch (Exception e) {
            log.warn("Failed to release lock for key={}: {}", lockKey, e.getMessage());
            return false;
        }
    }

    public <T> T withLock(String userId, String operation, Supplier<T> action) {
        return withLock(userId, operation, DEFAULT_LOCK_TIMEOUT_SECONDS, action);
    }

    public <T> T withLock(String userId, String operation, long timeoutSeconds, Supplier<T> action) {
        String lockValue = acquireLock(userId, operation, timeoutSeconds);
        if (lockValue == null) {
            throw new IllegalStateException("Could not acquire lock for " + operation + " on user " + userId + ". Another operation is in progress.");
        }
        try {
            return action.get();
        } finally {
            releaseLock(userId, operation, lockValue);
        }
    }
}