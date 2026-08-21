#!/bin/sh
set -e

# Default upstream hostnames if not provided via environment variables
export NODE_BACKEND_HOST=${NODE_BACKEND_HOST:-node-server-1:5000}
export PAYMENT_BACKEND_HOST=${PAYMENT_BACKEND_HOST:-payment-service:8080}
export PORT=${PORT:-80}

echo "🛡️ SuviX Gateway starting..."
echo "👉 Node.js Backend Host: ${NODE_BACKEND_HOST}"
echo "👉 Java Payment Host:   ${PAYMENT_BACKEND_HOST}"
echo "👉 Listening Port:       ${PORT}"

# Substitute only specific environment variables into nginx.conf
envsubst '${NODE_BACKEND_HOST} ${PAYMENT_BACKEND_HOST} ${PORT}' < /etc/nginx/nginx.conf.template > /etc/nginx/nginx.conf

# Start Nginx
exec nginx -g "daemon off;"
