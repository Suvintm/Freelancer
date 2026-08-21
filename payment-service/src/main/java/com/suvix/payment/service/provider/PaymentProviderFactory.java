package com.suvix.payment.service.provider;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.Map;

@Component
@RequiredArgsConstructor
public class PaymentProviderFactory {

    private final Map<String, PaymentProvider> providers;

    public PaymentProvider getProvider(String providerName) {
        if (providerName == null || providerName.isBlank()) {
            return providers.get("razorpayProvider");
        }

        String beanName = providerName.toLowerCase() + "Provider";
        PaymentProvider provider = providers.get(beanName);

        if (provider == null) {
            throw new IllegalArgumentException("Unsupported payment provider: " + providerName);
        }

        return provider;
    }
}
