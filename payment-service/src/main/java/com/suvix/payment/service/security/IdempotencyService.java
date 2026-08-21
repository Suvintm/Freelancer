package com.suvix.payment.service.security;

import com.suvix.payment.domain.IdempotencyKeyRecord;
import com.suvix.payment.redis.RedisService;
import com.suvix.payment.repository.IdempotencyKeyRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class IdempotencyService {

    private final RedisService redisService;
    private final IdempotencyKeyRepository idempotencyRepository;

    private static final String REDIS_PREFIX = "idempotency:";

    public boolean isProcessing(String key) {
        String val = redisService.get(REDIS_PREFIX + key);
        return "PROCESSING".equals(val);
    }

    public Optional<String> getCompletedResponse(String key) {
        String redisVal = redisService.get(REDIS_PREFIX + key);
        if (redisVal != null && redisVal.startsWith("COMPLETED:")) {
            return Optional.of(redisVal.substring("COMPLETED:".length()));
        }

        // DB Fallback
        return idempotencyRepository.findByIdAndExpiresAtAfter(key, Instant.now())
                .filter(rec -> rec.getStatus() == IdempotencyKeyRecord.IdempotencyStatus.completed)
                .map(IdempotencyKeyRecord::getResponseBody);
    }

    public void markProcessing(String key, String requestHash, long ttlSeconds) {
        redisService.setex(REDIS_PREFIX + key, "PROCESSING", ttlSeconds);

        // Record in DB
        IdempotencyKeyRecord record = IdempotencyKeyRecord.builder()
                .id(key)
                .requestHash(requestHash)
                .status(IdempotencyKeyRecord.IdempotencyStatus.processing)
                .expiresAt(Instant.now().plus(24, ChronoUnit.HOURS))
                .build();
        try {
            idempotencyRepository.save(record);
        } catch (Exception e) {
            log.warn("Database idempotency insert warning: {}", e.getMessage());
        }
    }

    @Transactional
    public void markCompleted(String key, String responseBody, long ttlSeconds) {
        redisService.setex(REDIS_PREFIX + key, "COMPLETED:" + responseBody, ttlSeconds);

        idempotencyRepository.findById(key).ifPresent(rec -> {
            rec.setStatus(IdempotencyKeyRecord.IdempotencyStatus.completed);
            rec.setResponseBody(responseBody);
            idempotencyRepository.save(rec);
        });
    }

    public void clear(String key) {
        redisService.delete(REDIS_PREFIX + key);
        idempotencyRepository.deleteById(key);
    }
}
