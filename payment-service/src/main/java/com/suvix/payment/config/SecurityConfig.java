package com.suvix.payment.config;

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

    @Value("${service.secret}")
    private String serviceSecret;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(AbstractHttpConfigurer::disable)
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                // Render health check — must be public
                .requestMatchers("/actuator/health").permitAll()
                // Razorpay webhook — Razorpay calls this, not Node
                .requestMatchers("/api/v1/payments/webhook").permitAll()
                // All other requests require service secret
                .anyRequest().authenticated()
            )
            .addFilterBefore(
                new ServiceSecretFilter(serviceSecret),
                UsernamePasswordAuthenticationFilter.class
            );

        return http.build();
    }
}
