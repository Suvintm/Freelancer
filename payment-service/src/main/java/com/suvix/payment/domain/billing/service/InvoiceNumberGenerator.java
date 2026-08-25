package com.suvix.payment.domain.billing.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.concurrent.TimeUnit;

@Slf4j
@Service
@RequiredArgsConstructor
public class InvoiceNumberGenerator {

    private final StringRedisTemplate redisTemplate;
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyyMMdd");

    /**
     * Generates a non-colliding sequential invoice number: INV-YYYYMMDD-000001
     */
    public String generateNextInvoiceNumber() {
        String datePrefix = LocalDate.now().format(DATE_FORMATTER);
        String counterKey = "invoice:counter:" + datePrefix;

        Long counter = redisTemplate.opsForValue().increment(counterKey);
        redisTemplate.expire(counterKey, 48, TimeUnit.HOURS);

        long sequence = (counter != null) ? counter : 1L;
        return String.format("INV-%s-%06d", datePrefix, sequence);
    }
}