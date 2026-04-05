# Build stage
FROM node:20-slim AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies including devDependencies for build
RUN npm ci

# Copy source
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Final stage
FROM node:20-slim

WORKDIR /app

# Set environment
ENV NODE_ENV=production
ENV PORT=10000

# Copy node_modules and generated prisma client from builder
COPY --from=builder /app/node_modules ./node_modules
# Copy prisma schema for runtime support
COPY --from=builder /app/prisma ./prisma
# Copy only necessary files
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/server.js ./
COPY --from=builder /app/socket.js ./
COPY --from=builder /app/models ./models
COPY --from=builder /app/routes ./routes
COPY --from=builder /app/middleware ./middleware
COPY --from=builder /app/controllers ./controllers
COPY --from=builder /app/utils ./utils
COPY --from=builder /app/config ./config
COPY --from=builder /app/kafka ./kafka
COPY --from=builder /app/services ./services

# Clean up devDependencies (except those needed by Prisma internally)
RUN npm prune --production

EXPOSE 10000

CMD ["npm", "start"]
