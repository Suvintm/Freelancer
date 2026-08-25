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
import java.util.Optional;
import java.util.Set;

@Slf4j
@Component
@RequiredArgsConstructor
public class UsageSyncScheduler {

    private final StringRedisTemplate stringRedisTemplate;
    private final UsageTrackingRepository usageTrackingRepository;

    private static final String DIRTY_KEYS_SET = "usage:dirty:keys";

    /**
     * Write-Behind cache flusher: Syncs in-memory Redis usage counts to PostgreSQL every 5 minutes
     */
    @Scheduled(fixedRate = 300000, initialDelay = 60000) // Every 5 minutes
    @Transactional
    public void syncRedisUsageToDatabase() {
        Set<String> dirtyKeys = stringRedisTemplate.opsForSet().members(DIRTY_KEYS_SET);
        if (dirtyKeys == null || dirtyKeys.isEmpty()) {
            return;
        }

        log.info("Starting async DB usage sync for {} dirty keys", dirtyKeys.size());
        int syncedCount = 0;

        for (String key : dirtyKeys) {
            try {
                // Key format: usage:{userId}:{feature}:{period}
                String[] parts = key.split(":");
                if (parts.length < 4) {
                    stringRedisTemplate.opsForSet().remove(DIRTY_KEYS_SET, key);
                    continue;
                }

                String userId = parts[1];
                String featureName = parts[2];
                String period = parts[3];

                String val = stringRedisTemplate.opsForValue().get(key);
                if (val == null) {
                    stringRedisTemplate.opsForSet().remove(DIRTY_KEYS_SET, key);
                    continue;
                }

                int count = Integer.parseInt(val);

                Optional<UsageTracking> trackingOpt = usageTrackingRepository
                        .findByUserIdAndFeatureNameAndUsagePeriod(userId, featureName, period);

                if (trackingOpt.isPresent()) {
                    UsageTracking tracking = trackingOpt.get();
                    tracking.setUsageCount(count);
                    tracking.setLastUsedAt(Instant.now());
                    usageTrackingRepository.save(tracking);
                } else {
                    UsageTracking newTracking = UsageTracking.builder()
                            .userId(userId)
                            .featureName(featureName)
                            .usagePeriod(period)
                            .usageCount(count)
                            .lastUsedAt(Instant.now())
                            .build();
                    usageTrackingRepository.save(newTracking);
                }

                stringRedisTemplate.opsForSet().remove(DIRTY_KEYS_SET, key);
                syncedCount++;
            } catch (Exception e) {
                log.error("Failed to sync usage key [{}]: {}", key, e.getMessage());
            }
        }

        log.info("Successfully flushed {} usage counters to PostgreSQL", syncedCount);
    }
}