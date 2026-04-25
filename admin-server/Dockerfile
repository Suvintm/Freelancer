# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build the NestJS application
RUN npm run build

# Final stage
FROM node:20-alpine

WORKDIR /app

# Set environment
ENV NODE_ENV=production
ENV PORT=10000

# Copy node_modules from builder (or reinstall production only)
COPY --from=builder /app/node_modules ./node_modules
# Copy built files
COPY --from=builder /app/dist ./dist
# Copy prisma schema for runtime support
COPY --from=builder /app/prisma ./prisma
# Copy package.json
COPY --from=builder /app/package*.json ./

# Expose port
EXPOSE 10000

# Start the application
CMD ["node", "dist/main.js"]
