package com.suvix.payment.controller;

import com.suvix.payment.dto.request.CreatePayoutRequest;
import com.suvix.payment.dto.response.PayoutResponse;
import com.suvix.payment.service.core.PayoutService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/api/v1/payouts")
@RequiredArgsConstructor
public class PayoutController {

    private final PayoutService payoutService;

    @PostMapping("/request")
    public ResponseEntity<PayoutResponse> requestPayout(
            @Valid @RequestBody CreatePayoutRequest request,
            @RequestHeader("X-User-Id") String userId
    ) {
        return ResponseEntity.ok(payoutService.requestPayout(request, userId));
    }
}
