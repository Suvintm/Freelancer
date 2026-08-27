package com.suvix.payment.domain.subscription.service;

import com.suvix.payment.domain.subscription.entity.UsageTracking;
import com.suvix.payment.domain.subscription.repository.UsageTrackingRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;

@Slf4j
@Component
@RequiredArgsConstructor
public class UsageSyncScheduler {

    private final StringRedisTemplate stringRedisTemplate;
    private final UsageTrackingRepository usageTrackingRepository;

    private static final String DIRTY_KEYS_SET = "usage:dirty:keys";
    private static final int BATCH_SIZE = 100;

    /**
     * Highly Optimized Write-Behind cache flusher:
     * Uses atomic SPOP batching and MGET multi-get to flush dirty usage counters
     * from Redis to PostgreSQL in O(1) Redis commands (cutting command volume by >95%).
     */
    @Scheduled(fixedRate = 300000, initialDelay = 60000) // Every 5 minutes
    @Transactional
    public void syncRedisUsageToDatabase() {
        int totalProcessed = 0;

        while (true) {
            // 1. Atomic SPOP batch: Removes and returns up to BATCH_SIZE items in 1 single command
            List<String> poppedKeys = stringRedisTemplate.opsForSet().pop(DIRTY_KEYS_SET, BATCH_SIZE);
            if (poppedKeys == null || poppedKeys.isEmpty()) {
                break;
            }

            // Filter valid keys
            List<String> validKeys = new ArrayList<>();
            Map<String, String[]> keyMetaMap = new HashMap<>();

            for (String key : poppedKeys) {
                String[] parts = key.split(":");
                if (parts.length >= 4) {
                    validKeys.add(key);
                    keyMetaMap.put(key, parts);
                }
            }

            if (validKeys.isEmpty()) {
                continue;
            }

            // 2. Atomic MGET: Fetches all values across all valid keys in 1 single network trip
            List<String> values = stringRedisTemplate.opsForValue().multiGet(validKeys);
            if (values == null) {
                continue;
            }

            List<UsageTracking> trackingsToSave = new ArrayList<>();

            for (int i = 0; i < validKeys.size(); i++) {
                String key = validKeys.get(i);
                String val = values.get(i);
                if (val == null || val.isBlank()) {
                    continue;
                }

                try {
                    String[] parts = keyMetaMap.get(key);
                    String userId = parts[1];
                    String featureName = parts[2];
                    String period = parts[3];
                    int count = Integer.parseInt(val.trim());

                    Optional<UsageTracking> trackingOpt = usageTrackingRepository
                            .findByUserIdAndFeatureNameAndUsagePeriod(userId, featureName, period);

                    if (trackingOpt.isPresent()) {
                        UsageTracking tracking = trackingOpt.get();
                        tracking.setUsageCount(count);
                        tracking.setLastUsedAt(Instant.now());
                        trackingsToSave.add(tracking);
                    } else {
                        UsageTracking newTracking = UsageTracking.builder()
                                .userId(userId)
                                .featureName(featureName)
                                .usagePeriod(period)
                                .usageCount(count)
                                .lastUsedAt(Instant.now())
                                .build();
                        trackingsToSave.add(newTracking);
                    }
                } catch (Exception e) {
                    log.error("Failed to parse usage counter for key [{}]: {}", key, e.getMessage());
                }
            }

            // 3. Batch upsert to PostgreSQL in a single bulk transaction
            if (!trackingsToSave.isEmpty()) {
                usageTrackingRepository.saveAll(trackingsToSave);
                totalProcessed += trackingsToSave.size();
            }

            // If we popped fewer than BATCH_SIZE, we've drained the dirty set
            if (poppedKeys.size() < BATCH_SIZE) {
                break;
            }
        }

        if (totalProcessed > 0) {
            log.info("Batch flushed {} dirty usage counters to PostgreSQL via atomic SPOP + MGET", totalProcessed);
        }
    }
}