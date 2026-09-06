package com.suvix.payment.infrastructure.exception;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.LinkedHashMap;
import java.util.Map;

@Slf4j
@RestControllerAdvice
public class GlobalPaymentExceptionHandler {

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, Object>> handleIllegalArgument(IllegalArgumentException ex) {
        System.out.println("  ❌ [Payment Service Error - 400 Bad Request] " + ex.getMessage());
        log.warn("Invalid payment argument: {}", ex.getMessage());

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("success", false);
        body.put("error", "BAD_REQUEST");
        body.put("message", ex.getMessage());

        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(body);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleGenericException(Exception ex) {
        System.out.println("  ❌ [Payment Service Exception - 500 Internal Error] " + ex.getMessage());
        log.error("Unhandled payment service exception", ex);

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("success", false);
        body.put("error", "INTERNAL_PAYMENT_ERROR");
        body.put("message", ex.getMessage() != null ? ex.getMessage() : "Payment processing encountered an unexpected error.");

        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(body);
    }
}
