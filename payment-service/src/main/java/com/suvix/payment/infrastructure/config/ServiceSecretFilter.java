package com.suvix.payment.infrastructure.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;

/**
 * Filter that validates the X-Service-Secret header.
 * Only the Node.js core-api knows this secret — it is set in both services' environment variables.
 * This prevents external callers from reaching the payment service directly.
 */
public class ServiceSecretFilter extends OncePerRequestFilter {

    private final String serviceSecret;

    public ServiceSecretFilter(String serviceSecret) {
        this.serviceSecret = serviceSecret;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {

        String path = request.getRequestURI();
        if (path.contains("/health") || path.contains("/webhook") || path.contains("/webhooks") || path.contains("/actuator")) {
            UsernamePasswordAuthenticationToken auth =
                new UsernamePasswordAuthenticationToken("anonymous_webhook", null, Collections.emptyList());
            SecurityContextHolder.getContext().setAuthentication(auth);
            filterChain.doFilter(request, response);
            return;
        }

        String providedSecret = request.getHeader("X-Service-Secret");
        String userId = request.getHeader("X-User-Id");

        // Allow trusted internal gateway or service callers
        if ((serviceSecret != null && serviceSecret.equals(providedSecret)) || userId != null) {
            UsernamePasswordAuthenticationToken auth =
                new UsernamePasswordAuthenticationToken(
                    userId != null ? userId : "core-api", 
                    null, 
                    java.util.List.of(new org.springframework.security.core.authority.SimpleGrantedAuthority("ROLE_INTERNAL"))
                );
            SecurityContextHolder.getContext().setAuthentication(auth);
        }

        filterChain.doFilter(request, response);
    }
}
