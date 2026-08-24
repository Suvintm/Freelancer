package com.suvix.payment.domain.subscription.service;

import com.suvix.payment.domain.subscription.entity.Subscription;
import com.suvix.payment.domain.subscription.entity.SubscriptionPlan;
import com.suvix.payment.domain.subscription.dto.request.CancelSubscriptionRequest;
import com.suvix.payment.domain.subscription.dto.request.CreateSubscriptionRequest;
import com.suvix.payment.domain.subscription.dto.response.SubscriptionResponse;
import com.suvix.payment.domain.subscription.repository.SubscriptionPlanRepository;
import com.suvix.payment.domain.subscription.repository.SubscriptionRepository;
import com.suvix.payment.domain.payment.service.provider.PaymentProvider;
import com.suvix.payment.domain.payment.service.provider.PaymentProviderFactory;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class SubscriptionService {

    private final SubscriptionRepository subscriptionRepository;
    private final SubscriptionPlanRepository planRepository;
    private final PaymentProviderFactory providerFactory;

    public List<SubscriptionPlan> getAllActivePlans() {
        return planRepository.findByIsActiveTrueOrderByTierLevelAsc();
    }

    @Transactional
    public SubscriptionResponse createSubscription(CreateSubscriptionRequest request, String userId) throws Exception {
        SubscriptionPlan plan = planRepository.findById(request.getPlanId())
                .orElseThrow(() -> new IllegalArgumentException("Plan not found: " + request.getPlanId()));

        PaymentProvider provider = providerFactory.getProvider(request.getProvider());
        SubscriptionResponse providerResponse = provider.createSubscription(request, plan, userId);

        Subscription subscription = Subscription.builder()
                .userId(userId)
                .plan(plan)
                .status(Subscription.SubscriptionStatus.active)
                .provider(Subscription.PaymentProvider.valueOf(request.getProvider().toLowerCase()))
                .providerSubscriptionId(providerResponse.getProviderSubscriptionId())
                .currentPeriodStart(providerResponse.getCurrentPeriodStart())
                .currentPeriodEnd(providerResponse.getCurrentPeriodEnd())
                .build();

        subscription = subscriptionRepository.save(subscription);
        providerResponse.setSubscriptionId(subscription.getId());

        return providerResponse;
    }

    @Transactional
    public SubscriptionResponse cancelSubscription(CancelSubscriptionRequest request, String userId) throws Exception {
        Subscription subscription = subscriptionRepository.findById(request.getSubscriptionId())
                .orElseThrow(() -> new IllegalArgumentException("Subscription not found: " + request.getSubscriptionId()));

        if (!subscription.getUserId().equals(userId)) {
            throw new IllegalAccessException("Unauthorized to cancel this subscription");
        }

        PaymentProvider provider = providerFactory.getProvider(subscription.getProvider().name());
        provider.cancelSubscription(subscription.getProviderSubscriptionId());

        if (request.isImmediate()) {
            subscription.setStatus(Subscription.SubscriptionStatus.cancelled);
            subscription.setEndedAt(Instant.now());
        } else {
            subscription.setCancelAtPeriodEnd(true);
        }
        subscription.setCancelledAt(Instant.now());
        subscriptionRepository.save(subscription);

        return SubscriptionResponse.builder()
                .success(true)
                .subscriptionId(subscription.getId())
                .planId(subscription.getPlan().getId())
                .status(subscription.getStatus().name())
                .cancelAtPeriodEnd(subscription.isCancelAtPeriodEnd())
                .message("Subscription cancelled successfully")
                .build();
    }
}
