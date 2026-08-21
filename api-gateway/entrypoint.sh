#!/bin/sh
set -e

# Default upstream hostnames if not provided via environment variables
export NODE_BACKEND_HOST=${NODE_BACKEND_HOST:-node-server-1:5000}
export PAYMENT_BACKEND_HOST=${PAYMENT_BACKEND_HOST:-payment-service:8080}
export PORT=${PORT:-80}

# Determine protocol scheme & default ports for external vs internal hosts
if echo "$NODE_BACKEND_HOST" | grep -q "\.com"; then
    export NODE_SCHEME="https"
    case "$NODE_BACKEND_HOST" in
        *:*) ;;
        *) export NODE_BACKEND_HOST="${NODE_BACKEND_HOST}:443" ;;
    esac
else
    export NODE_SCHEME="http"
fi

if echo "$PAYMENT_BACKEND_HOST" | grep -q "\.com"; then
    export PAYMENT_SCHEME="https"
    case "$PAYMENT_BACKEND_HOST" in
        *:*) ;;
        *) export PAYMENT_BACKEND_HOST="${PAYMENT_BACKEND_HOST}:443" ;;
    esac
else
    export PAYMENT_SCHEME="http"
fi

echo "🛡️ SuviX Gateway starting..."
echo "👉 Node.js Backend:    ${NODE_SCHEME}://${NODE_BACKEND_HOST}"
echo "👉 Java Payment:       ${PAYMENT_SCHEME}://${PAYMENT_BACKEND_HOST}"
echo "👉 Listening Port:      ${PORT}"

# Substitute environment variables into nginx.conf
if [ -f /etc/nginx/nginx.conf.template ]; then
    envsubst '${NODE_BACKEND_HOST} ${PAYMENT_BACKEND_HOST} ${NODE_SCHEME} ${PAYMENT_SCHEME} ${PORT}' < /etc/nginx/nginx.conf.template > /etc/nginx/nginx.conf
fi

# If specific command arguments are passed (e.g. during CI testing), execute them
if [ "$#" -gt 0 ]; then
    exec "$@"
else
    exec nginx -g "daemon off;"
fi
