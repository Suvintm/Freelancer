package com.suvix.payment.controller;

import com.suvix.payment.dto.response.WalletBalanceResponse;
import com.suvix.payment.service.core.WalletService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/api/v1/wallet")
@RequiredArgsConstructor
public class WalletController {

    private final WalletService walletService;

    @GetMapping("/balance")
    public ResponseEntity<WalletBalanceResponse> getBalance(@RequestHeader("X-User-Id") String userId) {
        return ResponseEntity.ok(walletService.getWalletBalance(userId));
    }
}
