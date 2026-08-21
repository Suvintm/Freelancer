#!/bin/bash
# ============================================================
# SUVIX PLATFORM - SSL CERTIFICATE SETUP (Let's Encrypt / FREE)
# Automates ACME validation and certificate generation
# ============================================================

set -e

# Configuration
DOMAIN="api.suvix.in"
EMAIL="admin@suvix.in"
CERT_DIR="$(pwd)/api-gateway/ssl"
WEBROOT="$(pwd)/certbot-www"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}===============================================${NC}"
echo -e "${GREEN}     SuviX API Gateway SSL Certificate Setup   ${NC}"
echo -e "${GREEN}===============================================${NC}"
echo ""

# 1. Create directories
echo -e "${YELLOW}[1/5] Creating SSL & Webroot challenge directories...${NC}"
mkdir -p "$CERT_DIR"
mkdir -p "$WEBROOT/.well-known/acme-challenge"

# 2. Check DNS Resolution
echo -e "${YELLOW}[2/5] Verifying DNS resolution for $DOMAIN...${NC}"
SERVER_IP=$(curl -s ifconfig.me || echo "UNKNOWN")
DOMAIN_IP=$(dig +short "$DOMAIN" || echo "UNRESOLVED")

echo "  Server IP: $SERVER_IP"
echo "  Domain resolves to: $DOMAIN_IP"

# 3. Start temporary Nginx for ACME verification
echo -e "${YELLOW}[3/5] Starting temporary Nginx for Let's Encrypt challenge...${NC}"
cat > /tmp/nginx-temp.conf <<EOF
events { worker_connections 1024; }
http {
    server {
        listen 80;
        server_name $DOMAIN localhost;
        location /.well-known/acme-challenge/ {
            root /var/www/certbot;
        }
        location /health {
            return 200 'ok';
        }
    }
}
EOF

docker run -d --rm \
    --name temp-nginx \
    -p 80:80 \
    -v "$WEBROOT:/var/www/certbot" \
    -v /tmp/nginx-temp.conf:/etc/nginx/nginx.conf:ro \
    nginx:1.25-alpine

sleep 2

# 4. Request certificate from Let's Encrypt
echo -e "${YELLOW}[4/5] Requesting certificate from Let's Encrypt...${NC}"
docker run -it --rm \
    -v "$CERT_DIR:/etc/letsencrypt" \
    -v "$WEBROOT:/var/www/certbot" \
    certbot/certbot certonly \
    --webroot \
    --webroot-path=/var/www/certbot \
    --email "$EMAIL" \
    --agree-tos \
    --no-eff-email \
    -d "$DOMAIN" \
    --non-interactive || true

# 5. Stop temporary Nginx
echo -e "${YELLOW}[5/5] Cleaning up temporary Nginx...${NC}"
docker stop temp-nginx || true

if [ -f "$CERT_DIR/live/$DOMAIN/fullchain.pem" ]; then
    echo -e "${GREEN}✓ SSL Certificate successfully generated at $CERT_DIR/live/$DOMAIN/${NC}"
else
    echo -e "${YELLOW}Notice: If DNS is not yet pointing to this IP, Let's Encrypt will succeed once DNS propagation completes.${NC}"
fi
