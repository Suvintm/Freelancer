# Dockerfile for SuviX Node.js Core Server
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files and prisma schema first for postinstall: prisma generate
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies (runs prisma generate during postinstall)
RUN npm ci

# Copy remaining source files
COPY . .

# Final stage: Runner
FROM node:20-alpine

WORKDIR /app

COPY --from=builder /app ./

ENV NODE_ENV=production
ENV PORT=5000

EXPOSE 5000

CMD ["node", "src/server.js"]
