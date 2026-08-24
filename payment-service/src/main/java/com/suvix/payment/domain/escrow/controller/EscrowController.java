package com.suvix.payment.domain.escrow.controller;

import com.suvix.payment.domain.escrow.dto.request.CreateEscrowRequest;
import com.suvix.payment.domain.escrow.dto.request.ReleaseEscrowRequest;
import com.suvix.payment.domain.escrow.dto.response.EscrowResponse;
import com.suvix.payment.domain.escrow.service.EscrowService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/api/v1/escrow")
@RequiredArgsConstructor
public class EscrowController {

    private final EscrowService escrowService;

    @PostMapping("/create")
    public ResponseEntity<EscrowResponse> createEscrow(
            @Valid @RequestBody CreateEscrowRequest request,
            @RequestHeader("X-User-Id") String userId
    ) {
        return ResponseEntity.ok(escrowService.createEscrow(request, userId));
    }

    @PostMapping("/release")
    public ResponseEntity<EscrowResponse> releaseEscrow(
            @Valid @RequestBody ReleaseEscrowRequest request,
            @RequestHeader("X-User-Id") String userId
    ) {
        return ResponseEntity.ok(escrowService.releaseEscrow(request, userId));
    }
}
