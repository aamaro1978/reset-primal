# ════════════════════════════════════════════════════════════════
# Reset Primal - Production Dockerfile
# ════════════════════════════════════════════════════════════════
# Multi-stage build for optimal image size
# Build: 2026-01-29T15:35:00Z (cache busting)

# Stage 1: Build
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (--omit=dev excludes devDependencies, --ignore-scripts skips prepare)
RUN npm ci --omit=dev --ignore-scripts

# Copy source code
COPY . .

# Generate Prisma client (skip validation since DATABASE_URL not available during build)
RUN npx prisma generate --skip-validation || true

# ════════════════════════════════════════════════════════════════
# Stage 2: Runtime
FROM node:22-alpine

WORKDIR /app

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create app user (don't run as root)
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001

# Copy from builder
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/package*.json ./
COPY --from=builder --chown=nodejs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nodejs:nodejs /app/api ./api

# Switch to non-root user
USER nodejs

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Expose port
EXPOSE 3000

# Use dumb-init to handle signals properly
ENTRYPOINT ["/sbin/dumb-init", "--"]

# Start application
CMD ["node", "api/server.js"]
