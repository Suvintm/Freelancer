package com.suvix.payment.domain.billing.controller;

import com.suvix.payment.domain.billing.entity.Invoice;
import com.suvix.payment.domain.billing.service.InvoiceService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/api/v1/invoices")
@RequiredArgsConstructor
public class InvoiceController {

    private final InvoiceService invoiceService;

    @GetMapping
    public ResponseEntity<List<Invoice>> getUserInvoices(
            @RequestHeader(value = "X-User-Id", required = false) String headerUserId,
            @RequestParam(value = "userId", required = false) String paramUserId
    ) {
        String userId = (headerUserId != null && !headerUserId.isBlank()) ? headerUserId : paramUserId;
        System.out.println("  [JAVA PAYMENT-SERVICE] 🧾 GET /api/v1/invoices for user: " + userId);
        if (userId == null || userId.isBlank()) {
            return ResponseEntity.ok(List.of());
        }
        return ResponseEntity.ok(invoiceService.getUserInvoices(userId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Invoice> getInvoice(
            @PathVariable("id") UUID id
    ) {
        return invoiceService.getInvoiceById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/{id}/pdf")
    public ResponseEntity<byte[]> downloadInvoicePdf(
            @PathVariable("id") UUID id
    ) {
        byte[] pdfBytes = invoiceService.getInvoicePdf(id);

        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"Invoice-" + id + ".pdf\"")
                .body(pdfBytes);
    }
}