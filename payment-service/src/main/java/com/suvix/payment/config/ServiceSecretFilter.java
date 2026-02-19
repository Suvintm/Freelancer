package com.suvix.payment.config;

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

        String providedSecret = request.getHeader("X-Service-Secret");

        if (serviceSecret.equals(providedSecret)) {
            // Valid internal call — mark as authenticated
            UsernamePasswordAuthenticationToken auth =
                new UsernamePasswordAuthenticationToken("core-api", null, Collections.emptyList());
            SecurityContextHolder.getContext().setAuthentication(auth);
        }
        // If invalid, request stays unauthenticated → Spring Security will block it

        filterChain.doFilter(request, response);
    }
}
