# Dockerfile for SuviX Node.js Server
# Production-Grade Alpine Image (Ultra-Lightweight)

FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies first (better caching)
COPY package*.json ./
RUN npm ci

# Copy source and build (if needed, though server is usually raw JS)
COPY . .

# Final stage: Runner
FROM node:20-alpine

WORKDIR /app
COPY --from=builder /app ./

# Production environment
ENV NODE_ENV=production

EXPOSE 5000

CMD ["node", "server.js"]
