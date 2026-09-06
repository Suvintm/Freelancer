package com.suvix.payment.domain.billing.service;

import com.suvix.payment.domain.billing.entity.Invoice;
import com.suvix.payment.domain.billing.repository.InvoiceRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import java.util.Base64;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

@Slf4j
@Service
@RequiredArgsConstructor
public class InvoiceService {

    private final InvoiceRepository invoiceRepository;
    private final InvoicePdfService invoicePdfService;
    private final StringRedisTemplate stringRedisTemplate;

    private static final String INVOICE_PDF_CACHE_KEY = "invoice:pdf:%s";

    /**
     * Local L1 PDF Cache (holds recently requested PDFs in JVM memory for 60s, 0 Redis trips)
     */
    private final Cache<UUID, byte[]> l1PdfCache = Caffeine.newBuilder()
            .expireAfterWrite(60, TimeUnit.SECONDS)
            .maximumSize(500)
            .build();

    public List<Invoice> getUserInvoices(String userId) {
        return invoiceRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    public Optional<Invoice> getInvoiceById(UUID invoiceId) {
        return invoiceRepository.findById(invoiceId);
    }

    public Optional<Invoice> getInvoiceByNumber(String invoiceNumber) {
        return invoiceRepository.findByInvoiceNumber(invoiceNumber);
    }

    /**
     * Get or render invoice PDF with Two-Tier (L1 JVM + L2 Redis) caching
     */
    public byte[] getInvoicePdf(UUID invoiceId) {
        // 1. Check L1 JVM Cache (0ms, 0 Redis ops)
        byte[] l1Bytes = l1PdfCache.getIfPresent(invoiceId);
        if (l1Bytes != null) {
            log.debug("Served invoice PDF from local JVM L1 cache for invoiceId={}", invoiceId);
            return l1Bytes;
        }

        String cacheKey = String.format(INVOICE_PDF_CACHE_KEY, invoiceId);

        // 2. Check L2 Redis Cache
        try {
            String cachedBase64 = stringRedisTemplate.opsForValue().get(cacheKey);
            if (cachedBase64 != null && !cachedBase64.isBlank()) {
                byte[] decoded = Base64.getDecoder().decode(cachedBase64);
                l1PdfCache.put(invoiceId, decoded);
                log.debug("Served invoice PDF from Redis cache for invoiceId={}", invoiceId);
                return decoded;
            }
        } catch (Exception e) {
            log.warn("Redis PDF cache read error: {}", e.getMessage());
        }

        // 3. Render PDF from database entity
        Invoice invoice = invoiceRepository.findById(invoiceId)
                .orElseThrow(() -> new IllegalArgumentException("Invoice not found: " + invoiceId));

        byte[] pdfBytes = invoicePdfService.generateInvoicePdf(invoice);
        l1PdfCache.put(invoiceId, pdfBytes);

        // 4. Cache in Redis with 15-minute TTL to keep RAM lean
        try {
            String base64 = Base64.getEncoder().encodeToString(pdfBytes);
            stringRedisTemplate.opsForValue().set(cacheKey, base64, 15, TimeUnit.MINUTES);
        } catch (Exception e) {
            log.warn("Failed to cache PDF in Redis: {}", e.getMessage());
        }

        return pdfBytes;
    }

    /**
     * Pre-warms invoice PDF asynchronously in Redis L2 cache
     */
    @org.springframework.scheduling.annotation.Async
    public void prewarmInvoicePdfAsync(UUID invoiceId) {
        try {
            getInvoicePdf(invoiceId);
            log.info("Asynchronously pre-warmed Redis PDF cache for invoiceId={}", invoiceId);
        } catch (Exception e) {
            log.warn("Failed to pre-warm invoice PDF for invoiceId={}: {}", invoiceId, e.getMessage());
        }
    }
}