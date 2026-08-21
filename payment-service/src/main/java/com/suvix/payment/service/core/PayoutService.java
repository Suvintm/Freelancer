package com.suvix.payment.service.core;

import com.suvix.payment.domain.Payout;
import com.suvix.payment.domain.UserWallet;
import com.suvix.payment.dto.request.CreatePayoutRequest;
import com.suvix.payment.dto.response.PayoutResponse;
import com.suvix.payment.repository.PayoutRepository;
import com.suvix.payment.repository.UserWalletRepository;
import com.suvix.payment.util.EncryptionUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

@Slf4j
@Service
@RequiredArgsConstructor
public class PayoutService {

    private final PayoutRepository payoutRepository;
    private final UserWalletRepository walletRepository;
    private final EncryptionUtil encryptionUtil;

    @Transactional
    public PayoutResponse requestPayout(CreatePayoutRequest request, String userId) {
        UserWallet wallet = walletRepository.findByUserIdForUpdate(userId)
                .orElseThrow(() -> new IllegalArgumentException("Wallet not found for userId: " + userId));

        if (wallet.getAvailableBalance().compareTo(request.getAmount()) < 0) {
            throw new IllegalStateException("Insufficient available balance for payout");
        }

        // Deduct from wallet balance and place hold
        wallet.setBalance(wallet.getBalance().subtract(request.getAmount()));
        wallet.setTotalWithdrawn(wallet.getTotalWithdrawn().add(request.getAmount()));
        walletRepository.save(wallet);

        String destinationEncrypted = encryptionUtil.encrypt(request.getDestinationDetails());

        Payout payout = Payout.builder()
                .userId(userId)
                .amount(request.getAmount())
                .platformFee(BigDecimal.ZERO)
                .netAmount(request.getAmount())
                .currency("INR")
                .status(Payout.PayoutStatus.pending)
                .provider("razorpayx")
                .destinationType(Payout.DestinationType.valueOf(request.getDestinationType().toLowerCase()))
                .destinationEncrypted(destinationEncrypted)
                .description(request.getDescription())
                .build();

        payout = payoutRepository.save(payout);
        log.info("Payout requested: id={}, userId={}, amount={}", payout.getId(), userId, request.getAmount());

        return PayoutResponse.builder()
                .payoutId(payout.getId())
                .userId(userId)
                .amount(payout.getAmount())
                .netAmount(payout.getNetAmount())
                .currency("INR")
                .status(payout.getStatus().name())
                .destinationType(payout.getDestinationType().name())
                .createdAt(payout.getCreatedAt())
                .message("Payout queued for processing")
                .build();
    }
}
