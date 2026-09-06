package com.suvix.payment.domain.billing.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.UUID;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicLong;

@Slf4j
@Service
@RequiredArgsConstructor
public class InvoiceNumberGenerator {

    private final StringRedisTemplate redisTemplate;
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyyMMdd");
    private final AtomicLong fallbackSequence = new AtomicLong(1);

    /**
     * Generates a non-colliding sequential invoice number: INV-YYYYMMDD-000001
     * Falls back to memory sequence + unique entropy if Redis is disconnected.
     */
    public String generateNextInvoiceNumber() {
        String datePrefix = LocalDate.now().format(DATE_FORMATTER);
        String counterKey = "invoice:counter:" + datePrefix;

        try {
            if (redisTemplate != null) {
                Long counter = redisTemplate.opsForValue().increment(counterKey);
                redisTemplate.expire(counterKey, 48, TimeUnit.HOURS);
                long sequence = (counter != null) ? counter : 1L;
                return String.format("INV-%s-%06d", datePrefix, sequence);
            }
        } catch (Exception e) {
            log.warn("Redis unavailable for invoice counter, using resilient fallback generator: {}", e.getMessage());
        }

        long seq = fallbackSequence.getAndIncrement();
        String randomSuffix = UUID.randomUUID().toString().substring(0, 4).toUpperCase();
        return String.format("INV-%s-%04d-%s", datePrefix, seq % 10000, randomSuffix);
    }
}