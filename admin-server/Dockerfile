# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files and prisma schema first for postinstall: prisma generate
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies (npm ci will run postinstall: prisma generate)
RUN npm ci

# Copy remaining source code
COPY . .

# Build the NestJS application
RUN npm run build

# Final runtime stage
FROM node:20-alpine

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5001

# Copy node_modules from builder
COPY --from=builder /app/node_modules ./node_modules
# Copy built files
COPY --from=builder /app/dist ./dist
# Copy prisma schema for runtime support
COPY --from=builder /app/prisma ./prisma
# Copy package.json
COPY --from=builder /app/package*.json ./

EXPOSE 5001

CMD ["node", "dist/main.js"]
