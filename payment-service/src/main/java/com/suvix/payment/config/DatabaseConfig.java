package com.suvix.payment.config;

import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

import javax.sql.DataSource;

/**
 * Robust PostgreSQL Database Configuration.
 * Handles passwords containing special characters (like '@') without URL encoding issues.
 */
@Slf4j
@Configuration
public class DatabaseConfig {

    @Value("${DATABASE_URL:${DIRECT_URL:${POSTGRES_URL:}}}")
    private String databaseUrl;

    @Value("${DB_HOST:localhost}")
    private String dbHost;

    @Value("${DB_PORT:5432}")
    private String dbPort;

    @Value("${DB_NAME:suvix_prod}")
    private String dbName;

    @Value("${DB_USER:postgres}")
    private String dbUser;

    @Value("${DB_PASSWORD:postgres}")
    private String dbPassword;

    @Bean
    @Primary
    public DataSource dataSource() {
        HikariConfig config = new HikariConfig();

        if (databaseUrl != null && !databaseUrl.isBlank()) {
            log.info("Configuring PostgreSQL from DATABASE_URL...");
            String raw = databaseUrl.trim();

            // Strip protocol prefix
            if (raw.startsWith("jdbc:postgresql://")) {
                raw = raw.substring("jdbc:postgresql://".length());
            } else if (raw.startsWith("postgresql://")) {
                raw = raw.substring("postgresql://".length());
            } else if (raw.startsWith("postgres://")) {
                raw = raw.substring("postgres://".length());
            }

            int lastAtIndex = raw.lastIndexOf('@');
            if (lastAtIndex != -1) {
                // Contains credentials (user:password)
                String credentials = raw.substring(0, lastAtIndex);
                String hostAndDb = raw.substring(lastAtIndex + 1);

                int firstColonIndex = credentials.indexOf(':');
                if (firstColonIndex != -1) {
                    String username = credentials.substring(0, firstColonIndex);
                    String password = credentials.substring(firstColonIndex + 1);
                    config.setUsername(username);
                    config.setPassword(password);
                } else {
                    config.setUsername(credentials);
                }

                config.setJdbcUrl("jdbc:postgresql://" + hostAndDb);
            } else {
                config.setJdbcUrl("jdbc:postgresql://" + raw);
            }
        } else {
            String jdbcUrl = String.format("jdbc:postgresql://%s:%s/%s", dbHost, dbPort, dbName);
            log.info("Configuring PostgreSQL using host: {}:{} db: {}", dbHost, dbPort, dbName);
            config.setJdbcUrl(jdbcUrl);
            config.setUsername(dbUser);
            config.setPassword(dbPassword);
        }

        config.setDriverClassName("org.postgresql.Driver");
        config.setMaximumPoolSize(10);
        config.setMinimumIdle(2);
        config.setIdleTimeout(30000);
        config.setConnectionTimeout(30000);
        config.setMaxLifetime(1800000);

        return new HikariDataSource(config);
    }
}
