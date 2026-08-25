package com.suvix.payment.domain.subscription.controller;

import com.suvix.payment.domain.subscription.dto.response.ReconciliationSummary;
import com.suvix.payment.domain.subscription.entity.SubscriptionReconciliationAudit;
import com.suvix.payment.domain.subscription.repository.SubscriptionReconciliationAuditRepository;
import com.suvix.payment.domain.subscription.service.ReconciliationService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/admin")
@RequiredArgsConstructor
public class ReconciliationController {

    private final ReconciliationService reconciliationService;
    private final SubscriptionReconciliationAuditRepository auditRepository;

    @PostMapping("/reconcile-now")
    public ResponseEntity<ReconciliationSummary> triggerManualReconciliation() {
        return ResponseEntity.ok(reconciliationService.runDailyReconciliation());
    }

    @GetMapping("/reconciliation-history")
    public ResponseEntity<Page<SubscriptionReconciliationAudit>> getReconciliationHistory(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        return ResponseEntity.ok(auditRepository.findAllByOrderByReconciledAtDesc(PageRequest.of(page, size)));
    }
}