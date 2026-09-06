package com.suvix.payment.domain.wallet.service;

import com.suvix.payment.domain.wallet.entity.UserWallet;
import com.suvix.payment.domain.wallet.dto.response.WalletBalanceResponse;
import com.suvix.payment.domain.wallet.repository.UserWalletRepository;
import com.suvix.payment.infrastructure.util.EncryptionUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;

@Slf4j
@Service
@RequiredArgsConstructor
public class WalletService {

    private final UserWalletRepository walletRepository;
    private final EncryptionUtil encryptionUtil;

    @Transactional
    public UserWallet getOrCreateWallet(String userId) {
        return walletRepository.findByUserId(userId).orElseGet(() -> {
            UserWallet wallet = UserWallet.builder()
                    .userId(userId)
                    .balance(BigDecimal.ZERO)
                    .holdBalance(BigDecimal.ZERO)
                    .totalEarned(BigDecimal.ZERO)
                    .totalWithdrawn(BigDecimal.ZERO)
                    .currency("INR")
                    .kycStatus(UserWallet.KycStatus.pending)
                    .build();
            return walletRepository.save(wallet);
        });
    }

    public WalletBalanceResponse getWalletBalance(String userId) {
        UserWallet wallet = getOrCreateWallet(userId);
        return WalletBalanceResponse.builder()
                .userId(userId)
                .totalBalance(wallet.getBalance())
                .holdBalance(wallet.getHoldBalance())
                .availableBalance(wallet.getAvailableBalance())
                .totalEarned(wallet.getTotalEarned())
                .totalWithdrawn(wallet.getTotalWithdrawn())
                .currency(wallet.getCurrency())
                .kycStatus(wallet.getKycStatus().name())
                .build();
    }

    @Transactional
    public void creditEarnings(String userId, BigDecimal amount) {
        UserWallet wallet = walletRepository.findByUserIdForUpdate(userId)
                .orElseGet(() -> getOrCreateWallet(userId));

        wallet.setBalance(wallet.getBalance().add(amount));
        wallet.setTotalEarned(wallet.getTotalEarned().add(amount));
        walletRepository.save(wallet);
        log.info("Credited wallet for userId={}, amount={}", userId, amount);
    }

    @Transactional
    public void placeHold(String userId, BigDecimal amount) {
        UserWallet wallet = walletRepository.findByUserIdForUpdate(userId)
                .orElseThrow(() -> new RuntimeException("Wallet not found: " + userId));

        wallet.setHoldBalance(wallet.getHoldBalance().add(amount));
        walletRepository.save(wallet);
    }

    @Transactional
    public void releaseHold(String userId, BigDecimal amount) {
        UserWallet wallet = walletRepository.findByUserIdForUpdate(userId)
                .orElseThrow(() -> new RuntimeException("Wallet not found: " + userId));

        wallet.setHoldBalance(wallet.getHoldBalance().subtract(amount).max(BigDecimal.ZERO));
        walletRepository.save(wallet);
    }
}
