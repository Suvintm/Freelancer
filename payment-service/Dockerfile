# ========================
# Stage 1: Build
# ========================
FROM eclipse-temurin:21-jdk-alpine AS builder

WORKDIR /app
COPY pom.xml .
COPY src ./src

# Download dependencies first (Docker layer cache)
RUN apk add --no-cache maven && mvn dependency:go-offline -B

# Build the JAR
RUN mvn clean package -DskipTests

# ========================
# Stage 2: Run (slim image)
# ========================
FROM eclipse-temurin:21-jre-alpine

WORKDIR /app

# Copy only the compiled JAR
COPY --from=builder /app/target/payment-service-*.jar app.jar

# Render uses PORT env var
EXPOSE 8080

# Health check for Render
HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
  CMD wget -q -O - http://localhost:8080/actuator/health || exit 1

# Run the application
ENTRYPOINT ["java", "-jar", "app.jar"]
