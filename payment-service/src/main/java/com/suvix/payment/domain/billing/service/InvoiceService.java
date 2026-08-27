package com.suvix.payment.domain.billing.service;

import com.suvix.payment.domain.billing.entity.Invoice;
import com.suvix.payment.domain.billing.repository.InvoiceRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

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
     * Get or render invoice PDF with Redis binary caching
     */
    public byte[] getInvoicePdf(UUID invoiceId) {
        String cacheKey = String.format(INVOICE_PDF_CACHE_KEY, invoiceId);

        try {
            String cachedBase64 = stringRedisTemplate.opsForValue().get(cacheKey);
            if (cachedBase64 != null && !cachedBase64.isBlank()) {
                log.debug("Served invoice PDF from Redis cache for invoiceId={}", invoiceId);
                return Base64.getDecoder().decode(cachedBase64);
            }
        } catch (Exception e) {
            log.warn("Redis PDF cache read error: {}", e.getMessage());
        }

        Invoice invoice = invoiceRepository.findById(invoiceId)
                .orElseThrow(() -> new IllegalArgumentException("Invoice not found: " + invoiceId));

        byte[] pdfBytes = invoicePdfService.generateInvoicePdf(invoice);

        try {
            String base64 = Base64.getEncoder().encodeToString(pdfBytes);
            stringRedisTemplate.opsForValue().set(cacheKey, base64, 1, TimeUnit.HOURS);
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