# ============================================================
# SUVIX API GATEWAY - DOCKER CONTAINER
# Based on Nginx Alpine (Ultra lightweight ~15MB RAM)
# ============================================================

FROM nginx:1.25-alpine

LABEL maintainer="Suvix Platform Engineering"
LABEL version="1.0.0"
LABEL description="Suvix API Gateway - Nginx Reverse Proxy & Load Balancer"

# Install wget, ca-certificates, openssl, and gettext (envsubst)
RUN apk add --no-cache wget ca-certificates openssl gettext

# Remove default nginx config
RUN rm -f /etc/nginx/conf.d/default.conf

# Create persistent directories for SSL and ACME
RUN mkdir -p /var/www/certbot /etc/ssl/gateway

# Generate fallback self-signed SSL certificate in dedicated /etc/ssl/gateway directory
RUN openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout /etc/ssl/gateway/key.pem \
    -out /etc/ssl/gateway/cert.pem \
    -subj "/CN=localhost"

# Copy template and static fallback config
COPY nginx.conf.template /etc/nginx/nginx.conf.template
COPY nginx.conf /etc/nginx/nginx.conf
COPY entrypoint.sh /entrypoint.sh

# Set permissions
RUN chown -R nginx:nginx /var/www/certbot /etc/ssl/gateway && \
    chmod 755 /var/www/certbot /entrypoint.sh

# Expose HTTP and HTTPS ports
EXPOSE 80 443

# Health check - verify nginx is responding
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost/health || exit 1

ENTRYPOINT ["/entrypoint.sh"]
