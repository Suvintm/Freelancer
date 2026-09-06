package com.suvix.payment.infrastructure.config;

import io.lettuce.core.ClientOptions;
import io.lettuce.core.SocketOptions;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.connection.RedisConfiguration;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.connection.RedisStandaloneConfiguration;
import org.springframework.data.redis.connection.lettuce.LettuceClientConfiguration;
import org.springframework.data.redis.connection.lettuce.LettuceConnectionFactory;
import org.springframework.data.redis.core.StringRedisTemplate;

import java.net.URI;
import java.time.Duration;

@Slf4j
@Configuration
public class RedisConfig {

    @Value("${spring.data.redis.url:${REDIS_URL:}}")
    private String redisUrl;

    @Value("${spring.data.redis.host:localhost}")
    private String host;

    @Value("${spring.data.redis.port:6379}")
    private int port;

    @Value("${spring.data.redis.password:}")
    private String password;

    @Bean
    public RedisConnectionFactory redisConnectionFactory() {
        RedisStandaloneConfiguration redisConfig = new RedisStandaloneConfiguration();

        if (redisUrl != null && !redisUrl.isBlank()) {
            try {
                log.info("Configuring Redis using shared REDIS_URL");
                URI uri = URI.create(redisUrl.startsWith("https://") 
                    ? redisUrl.replace("https://", "rediss://default:" + System.getenv("REDIS_TOKEN") + "@") + ":6379" 
                    : redisUrl);
                
                redisConfig.setHostName(uri.getHost());
                redisConfig.setPort(uri.getPort() > 0 ? uri.getPort() : 6379);

                if (uri.getUserInfo() != null && uri.getUserInfo().contains(":")) {
                    String[] parts = uri.getUserInfo().split(":", 2);
                    redisConfig.setUsername(parts[0]);
                    redisConfig.setPassword(parts[1]);
                }
            } catch (Exception e) {
                log.warn("Failed to parse REDIS_URL, falling back to host/port: {}", e.getMessage());
                redisConfig.setHostName(host);
                redisConfig.setPort(port);
                if (password != null && !password.isBlank()) {
                    redisConfig.setPassword(password);
                }
            }
        } else {
            redisConfig.setHostName(host);
            redisConfig.setPort(port);
            if (password != null && !password.isBlank()) {
                redisConfig.setPassword(password);
            }
        }

        SocketOptions socketOptions = SocketOptions.builder()
                .connectTimeout(Duration.ofSeconds(10))
                .keepAlive(true)
                .build();

        ClientOptions clientOptions = ClientOptions.builder()
                .socketOptions(socketOptions)
                .autoReconnect(true)
                .build();

        LettuceClientConfiguration clientConfig = LettuceClientConfiguration.builder()
                .commandTimeout(Duration.ofSeconds(5))
                .clientOptions(clientOptions)
                .build();

        LettuceConnectionFactory factory = new LettuceConnectionFactory(redisConfig, clientConfig);
        factory.setValidateConnection(false); // Non-blocking lazy validation
        return factory;
    }

    @Bean
    public StringRedisTemplate stringRedisTemplate(RedisConnectionFactory connectionFactory) {
        return new StringRedisTemplate(connectionFactory);
    }
}
