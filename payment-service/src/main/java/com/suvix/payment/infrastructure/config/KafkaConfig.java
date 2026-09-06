package com.suvix.payment.infrastructure.config;

import lombok.extern.slf4j.Slf4j;
import org.apache.kafka.clients.consumer.ConsumerConfig;
import org.apache.kafka.clients.producer.ProducerConfig;
import org.apache.kafka.common.serialization.StringDeserializer;
import org.apache.kafka.common.serialization.StringSerializer;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.config.ConcurrentKafkaListenerContainerFactory;
import org.springframework.kafka.core.*;
import org.springframework.kafka.listener.ContainerProperties;

import java.net.InetAddress;
import java.util.HashMap;
import java.util.Map;

/**
 * Kafka Configuration — profile-aware & fault-tolerant.
 * local profile   → PLAINTEXT, no auth
 * upstash profile → SASL_SSL + SCRAM-SHA-256
 * cloud profile   → SASL_SSL + PLAIN (Confluent)
 *
 * Fault Tolerance:
 * If Kafka bootstrap servers are unavailable, misconfigured, or DNS-unresolvable
 * on deployment platforms (e.g. Render), listener auto-startup is safely disabled
 * so the HTTP REST API and Tomcat web server boot up immediately with 100% availability.
 */
@Slf4j
@Configuration
public class KafkaConfig {

    @Value("${spring.kafka.bootstrap-servers:localhost:9092}")
    private String bootstrapServers;

    @Value("${spring.kafka.listener.auto-startup:false}")
    private boolean autoStartup;

    // Optional — only present in upstash/cloud profiles, empty for local
    @Value("${spring.kafka.properties.security.protocol:PLAINTEXT}")
    private String securityProtocol;

    @Value("${spring.kafka.properties.sasl.mechanism:NONE}")
    private String saslMechanism;

    @Value("${spring.kafka.properties.sasl.jaas.config:}")
    private String saslJaasConfig;

    /**
     * Checks if at least one Kafka bootstrap server hostname can be resolved via DNS.
     */
    private boolean isKafkaResolvable(String servers) {
        if (servers == null || servers.isBlank() || servers.equalsIgnoreCase("none") || servers.equalsIgnoreCase("disabled")) {
            return false;
        }
        for (String server : servers.split(",")) {
            String trimmed = server.trim();
            if (trimmed.isEmpty()) continue;
            String host = trimmed.contains(":") ? trimmed.split(":")[0] : trimmed;
            try {
                InetAddress.getByName(host);
                return true;
            } catch (Exception ignored) {
                // Host not resolvable
            }
        }
        return false;
    }

    private String getEffectiveBootstrapServers() {
        return (bootstrapServers == null || bootstrapServers.isBlank()) ? "localhost:9092" : bootstrapServers;
    }

    // ==================== PRODUCER ====================

    private void addSaslConfig(Map<String, Object> config) {
        config.put("security.protocol", securityProtocol);
        if (!"PLAINTEXT".equals(securityProtocol) && !"NONE".equals(saslMechanism)) {
            config.put("sasl.mechanism", saslMechanism);
            if (saslJaasConfig != null && !saslJaasConfig.isBlank()) {
                config.put("sasl.jaas.config", saslJaasConfig);
            }
        }
    }

    @Bean
    public ProducerFactory<String, String> producerFactory() {
        Map<String, Object> config = new HashMap<>();
        config.put(ProducerConfig.BOOTSTRAP_SERVERS_CONFIG, getEffectiveBootstrapServers());
        config.put(ProducerConfig.KEY_SERIALIZER_CLASS_CONFIG, StringSerializer.class);
        config.put(ProducerConfig.VALUE_SERIALIZER_CLASS_CONFIG, StringSerializer.class);
        config.put(ProducerConfig.ACKS_CONFIG, "all");
        config.put(ProducerConfig.RETRIES_CONFIG, 3);
        config.put(ProducerConfig.ENABLE_IDEMPOTENCE_CONFIG, true);
        addSaslConfig(config); // no-op for local profile
        return new DefaultKafkaProducerFactory<>(config);
    }

    @Bean
    public KafkaTemplate<String, String> kafkaTemplate() {
        return new KafkaTemplate<>(producerFactory());
    }

    // ==================== CONSUMER ====================

    @Bean
    public ConsumerFactory<String, String> consumerFactory() {
        Map<String, Object> config = new HashMap<>();
        config.put(ConsumerConfig.BOOTSTRAP_SERVERS_CONFIG, getEffectiveBootstrapServers());
        config.put(ConsumerConfig.KEY_DESERIALIZER_CLASS_CONFIG, StringDeserializer.class);
        config.put(ConsumerConfig.VALUE_DESERIALIZER_CLASS_CONFIG, StringDeserializer.class);
        config.put(ConsumerConfig.GROUP_ID_CONFIG, "payment-service-group");
        config.put(ConsumerConfig.AUTO_OFFSET_RESET_CONFIG, "earliest");
        config.put(ConsumerConfig.ENABLE_AUTO_COMMIT_CONFIG, false);
        addSaslConfig(config); // no-op for local profile
        return new DefaultKafkaConsumerFactory<>(config);
    }

    @Bean
    public ConcurrentKafkaListenerContainerFactory<String, String> kafkaListenerContainerFactory(KafkaTemplate<String, String> kafkaTemplate) {
        ConcurrentKafkaListenerContainerFactory<String, String> factory = new ConcurrentKafkaListenerContainerFactory<>();
        factory.setConsumerFactory(consumerFactory());
        // Manual acknowledgment — we confirm only after successful processing
        factory.getContainerProperties().setAckMode(ContainerProperties.AckMode.MANUAL);
        factory.getContainerProperties().setMissingTopicsFatal(false);

        boolean resolvable = isKafkaResolvable(bootstrapServers);
        boolean shouldStart = autoStartup && resolvable;

        if (autoStartup && !resolvable) {
            log.warn("⚠️ [KafkaConfig] Kafka bootstrap servers [{}] cannot be resolved via DNS. Disabling listener auto-startup to ensure zero-downtime HTTP service boot.", bootstrapServers);
        } else if (shouldStart) {
            log.info("✅ [KafkaConfig] Kafka listeners auto-startup enabled for [{}]", bootstrapServers);
        } else {
            log.info("ℹ️ [KafkaConfig] Kafka listeners auto-startup is disabled (autoStartup={}, resolvable={})", autoStartup, resolvable);
        }

        factory.setAutoStartup(shouldStart);

        // Dead Letter Queue (DLQ) recoverer: routes to {topic}.DLQ after retries
        org.springframework.kafka.listener.DeadLetterPublishingRecoverer recoverer =
                new org.springframework.kafka.listener.DeadLetterPublishingRecoverer(kafkaTemplate);

        // 3 retry attempts with exponential backoff (1000ms, 2000ms, 4000ms)
        org.springframework.kafka.support.ExponentialBackOffWithMaxRetries backOff =
                new org.springframework.kafka.support.ExponentialBackOffWithMaxRetries(3);
        backOff.setInitialInterval(1000L);
        backOff.setMultiplier(2.0);
        backOff.setMaxInterval(10000L);

        org.springframework.kafka.listener.DefaultErrorHandler errorHandler =
                new org.springframework.kafka.listener.DefaultErrorHandler(recoverer, backOff);

        factory.setCommonErrorHandler(errorHandler);
        return factory;
    }
}

