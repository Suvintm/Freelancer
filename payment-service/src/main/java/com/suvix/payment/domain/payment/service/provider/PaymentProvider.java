package com.suvix.payment.domain.payment.service.provider;

import com.suvix.payment.domain.subscription.entity.SubscriptionPlan;
import com.suvix.payment.domain.payment.dto.request.CreateOrderRequest;
import com.suvix.payment.domain.subscription.dto.request.CreateSubscriptionRequest;
import com.suvix.payment.domain.payment.dto.request.VerifyPaymentRequest;
import com.suvix.payment.domain.payment.dto.response.PaymentResponse;
import com.suvix.payment.domain.subscription.dto.response.SubscriptionResponse;

import java.math.BigDecimal;

public interface PaymentProvider {

    String getProviderName();

    PaymentResponse createOrder(CreateOrderRequest request, String userId) throws Exception;

    boolean verifySignature(VerifyPaymentRequest request);

    String processRefund(String transactionId, BigDecimal amount, String reason) throws Exception;

    SubscriptionResponse createSubscription(CreateSubscriptionRequest request, SubscriptionPlan plan, String userId) throws Exception;

    boolean cancelSubscription(String providerSubscriptionId) throws Exception;
}
