package com.suvix.payment.domain.payment.webhook;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/api/v1/webhooks")
@RequiredArgsConstructor
public class WebhookDispatcherController {

    private final WebhookDispatcherService webhookDispatcherService;

    @PostMapping("/{provider}")
    public ResponseEntity<String> handleIncomingWebhook(
            @PathVariable("provider") String provider,
            @RequestBody String rawPayload,
            @RequestHeader HttpHeaders headers
    ) {
        log.info("Received incoming webhook for provider={}", provider);
        boolean processed = webhookDispatcherService.dispatchWebhook(provider, rawPayload, headers);

        if (!processed) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Webhook validation failed or unsupported provider");
        }

        return ResponseEntity.ok("Webhook processed successfully");
    }
}