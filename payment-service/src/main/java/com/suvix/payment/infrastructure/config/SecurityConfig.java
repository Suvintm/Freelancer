package com.suvix.payment.infrastructure.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

/**
 * Security Configuration.
 *
 * This service is INTERNAL — it is never called directly by the browser.
 * It is only called by the Node.js core-api via service-to-service secret header.
 *
 * Security model:
 * - All requests must have header: X-Service-Secret: <secret>
 * - Webhook endpoint is public (Razorpay calls it directly)
 * - Actuator /health endpoint is public (for Render health checks)
 */
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Value("${service.secret:d7fddff0b3f4d37d6eb5675377526003d7e8dbe4eacaab3d5aec4567966ed543}")
    private String serviceSecret;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(AbstractHttpConfigurer::disable)
            .cors(AbstractHttpConfigurer::disable)
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/actuator/**", "/api/v1/payments/health", "/api/v1/payments/webhook", "/api/v1/webhooks/**").permitAll()
                .requestMatchers("/api/v1/subscriptions/**", "/api/v1/invoices/**", "/api/v1/payments/**", "/api/v1/wallet/**", "/api/v1/escrow/**", "/api/v1/payouts/**", "/api/v1/admin/**").permitAll()
                .anyRequest().authenticated()
            )
            .addFilterBefore(
                new ServiceSecretFilter(serviceSecret),
                UsernamePasswordAuthenticationFilter.class
            );

        return http.build();
    }
}
