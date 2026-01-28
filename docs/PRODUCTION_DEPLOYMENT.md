# Production Deployment Guide

## Overview

Este documento descreve como fazer deploy do Reset Primal em produção usando Docker e Nginx.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Internet                             │
└──────────────────────────────┬──────────────────────────┘
                               │
                        HTTPS/SSL (443)
                               │
┌──────────────────────────────▼──────────────────────────┐
│              Nginx Reverse Proxy                         │
│              (Rate Limiting, SSL/TLS)                   │
└──────────────────────────────┬──────────────────────────┘
                               │
                        HTTP (3000)
                               │
┌──────────────────────────────▼──────────────────────────┐
│         Node.js Backend (Docker Container)              │
│              Port: 3000                                  │
│              Health Check: /health                      │
└──────────────────────────────┬──────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────┐
│      PostgreSQL Database (Docker Container)             │
│              Port: 5432 (internal only)                 │
│              Data: Persistent Volume                    │
└─────────────────────────────────────────────────────────┘
```

## Prerequisites

- **Linux Server**: Ubuntu 20.04+ or similar
- **Docker**: v20.10+
- **Docker Compose**: v2.0+
- **SSL Certificate**: Let's Encrypt or similar (for HTTPS)
- **Domain**: resetprimal.com.br pointing to server IP
- **4GB RAM Minimum**: For comfortable operation

## Step 1: Server Setup

### 1.1 Install Docker

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add current user to docker group
sudo usermod -aG docker $USER
newgrp docker

# Verify installation
docker --version
docker-compose --version
```

### 1.2 Create Application Directory

```bash
# Create app directory
sudo mkdir -p /opt/reset-primal
cd /opt/reset-primal

# Clone repository (or upload files)
git clone https://github.com/aamaro1978/reset-primal.git .

# Or upload manually:
# scp -r /path/to/reset-primal/* user@server:/opt/reset-primal/
```

### 1.3 Create Directory Structure

```bash
# Create necessary directories
sudo mkdir -p /var/www/reset-primal/ebook
sudo mkdir -p /opt/reset-primal/backups
sudo mkdir -p /opt/reset-primal/logs

# Set permissions
sudo chown -R $USER:$USER /opt/reset-primal
sudo chown -R $USER:$USER /var/www/reset-primal
```

## Step 2: SSL Certificate Setup

### 2.1 Install Certbot

```bash
sudo apt install -y certbot python3-certbot-nginx
```

### 2.2 Generate Certificate

```bash
sudo certbot certonly --standalone \
  -d resetprimal.com.br \
  -d www.resetprimal.com.br \
  --agree-tos \
  --email admin@resetprimal.com.br \
  --non-interactive
```

Certificate will be at:
- `/etc/letsencrypt/live/resetprimal.com.br/fullchain.pem`
- `/etc/letsencrypt/live/resetprimal.com.br/privkey.pem`

### 2.3 Auto-Renewal

```bash
# Enable auto-renewal
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer

# Test renewal
sudo certbot renew --dry-run
```

## Step 3: Environment Configuration

### 3.1 Create .env.production

```bash
cd /opt/reset-primal

# Copy template
cp .env.production.example .env.production

# Edit with production values
nano .env.production
```

**Critical values to set:**

```bash
NODE_ENV=production
DATABASE_URL="postgresql://reset_primal_user:STRONG_PASSWORD@postgres:5432/reset_primal?schema=public"
JWT_SECRET="$(openssl rand -base64 32)"
SENDGRID_API_KEY="SG.your_key_here"
SENDGRID_FROM_EMAIL="noreply@resetprimal.com.br"
HOTMART_WEBHOOK_SECRET="your_webhook_secret"
CORS_ORIGIN="https://resetprimal.com.br"
```

### 3.2 Set Permissions

```bash
# Make .env.production only readable by owner
chmod 600 /opt/reset-primal/.env.production
```

## Step 4: Database Setup

### 4.1 Create Init Script (Optional)

```bash
mkdir -p /opt/reset-primal/scripts

cat > /opt/reset-primal/scripts/init-db.sql << 'EOF'
-- Create necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Set timezone
SET timezone TO 'UTC';

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_purchases_user_id ON purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_purchases_product_id ON purchases(product_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);

-- Log initialization
SELECT 'Database initialized at ' || NOW();
EOF
```

## Step 5: Deploy

### 5.1 Make Deploy Script Executable

```bash
chmod +x /opt/reset-primal/scripts/deploy.sh
```

### 5.2 Run Deployment

```bash
cd /opt/reset-primal
./scripts/deploy.sh production
```

This script will:
1. ✅ Check prerequisites
2. ✅ Backup database (if exists)
3. ✅ Stop old containers
4. ✅ Build Docker images
5. ✅ Start new containers
6. ✅ Run migrations
7. ✅ Run health checks
8. ✅ Show deployment summary

### 5.3 Manual Deployment (if script fails)

```bash
cd /opt/reset-primal

# Build images
docker-compose -f docker-compose.production.yml build

# Start services
docker-compose -f docker-compose.production.yml up -d

# Wait for DB to start
sleep 30

# Run migrations
docker-compose -f docker-compose.production.yml run --rm backend npx prisma migrate deploy

# Check status
docker-compose -f docker-compose.production.yml ps
```

## Step 6: Verification

### 6.1 Check Services

```bash
# View running containers
docker-compose -f docker-compose.production.yml ps

# View logs
docker-compose -f docker-compose.production.yml logs -f
```

### 6.2 Test Endpoints

```bash
# Health check
curl https://resetprimal.com.br/health

# Register user
curl -X POST https://resetprimal.com.br/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password","name":"Test User"}'

# Login
curl -X POST https://resetprimal.com.br/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'
```

### 6.3 Monitor Logs

```bash
# Real-time logs
docker-compose -f docker-compose.production.yml logs -f backend

# Backend errors only
docker-compose -f docker-compose.production.yml logs backend | grep ERROR

# Database logs
docker-compose -f docker-compose.production.yml logs postgres
```

## Step 7: Backup & Recovery

### 7.1 Manual Database Backup

```bash
# Backup to file
docker-compose -f docker-compose.production.yml exec postgres \
  pg_dump -U reset_primal_user -d reset_primal -F c \
  > backups/reset_primal_$(date +%Y%m%d_%H%M%S).dump
```

### 7.2 Restore from Backup

```bash
# Stop container
docker-compose -f docker-compose.production.yml down

# Restore
docker-compose -f docker-compose.production.yml exec postgres \
  pg_restore -U reset_primal_user -d reset_primal -c \
  < backups/reset_primal_20260128_143000.dump

# Start again
docker-compose -f docker-compose.production.yml up -d
```

### 7.3 Automated Backups

```bash
# Create backup script
cat > /opt/reset-primal/scripts/backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/opt/reset-primal/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
docker-compose -f /opt/reset-primal/docker-compose.production.yml exec postgres \
  pg_dump -U reset_primal_user -d reset_primal -F c \
  > "$BACKUP_DIR/reset_primal_$TIMESTAMP.dump"
echo "Backup completed: reset_primal_$TIMESTAMP.dump"
EOF

chmod +x /opt/reset-primal/scripts/backup.sh

# Add to crontab (daily at 2 AM)
0 2 * * * /opt/reset-primal/scripts/backup.sh
```

## Monitoring & Maintenance

### Monitor Resource Usage

```bash
# CPU and Memory
docker stats

# Disk space
df -h

# Database size
docker-compose -f docker-compose.production.yml exec postgres \
  psql -U reset_primal_user -d reset_primal -c "\l+"
```

### Update Application

```bash
# Pull latest code
git pull origin main

# Rebuild and deploy
cd /opt/reset-primal
./scripts/deploy.sh production
```

### Scale Resources

Edit `docker-compose.production.yml` to adjust:

```yaml
# Increase memory limit
services:
  backend:
    deploy:
      resources:
        limits:
          memory: 1G  # Increase from default
```

Then redeploy:

```bash
docker-compose -f docker-compose.production.yml up -d
```

## Troubleshooting

### Backend not starting

```bash
# Check logs
docker-compose -f docker-compose.production.yml logs backend

# Check if port is in use
sudo lsof -i :3000

# Restart container
docker-compose -f docker-compose.production.yml restart backend
```

### Database connection failed

```bash
# Check database is running
docker-compose -f docker-compose.production.yml ps postgres

# Check logs
docker-compose -f docker-compose.production.yml logs postgres

# Verify DATABASE_URL in .env.production
# Format: postgresql://user:password@postgres:5432/reset_primal?schema=public
```

### Certificate renewal failed

```bash
# Manual renewal
sudo certbot renew --force-renewal

# Check certificate expiry
sudo certbot certificates

# Nginx needs reload after renewal
sudo systemctl reload nginx
```

## Security Checklist

- [ ] SSL certificate installed and auto-renewing
- [ ] .env.production has strong JWT_SECRET (32+ chars)
- [ ] Database password is strong (20+ chars)
- [ ] Nginx rate limiting enabled
- [ ] CORS_ORIGIN points to correct domain
- [ ] Firewall blocks unused ports
- [ ] Regular backups scheduled
- [ ] Log rotation configured
- [ ] Health checks running
- [ ] 2FA enabled for admin accounts

## Performance Tuning

### PostgreSQL

```bash
# Connection pooling (PgBouncer)
docker pull edoburu/pgbouncer
# Configure and add to docker-compose.yml
```

### Node.js

```bash
# Add to Dockerfile for clustering
NODE_ENV=production node --cluster api/server.js
```

### Nginx

```bash
# Enable gzip compression
gzip on;
gzip_types text/plain text/css application/json;
gzip_min_length 1000;
```

## Scaling to Multiple Servers

For high traffic, use:

1. **Load Balancer**: AWS ELB, HAProxy, or Nginx
2. **Multiple Backend Instances**: Docker Swarm or Kubernetes
3. **Database Replication**: PostgreSQL streaming replication
4. **Cache Layer**: Redis for session/data caching
5. **CDN**: Cloudflare for static assets

## Support & Contact

For issues, create GitHub issue: https://github.com/aamaro1978/reset-primal/issues

## Changelog

### v1.0.0 (2026-01-28)
- Initial production deployment guide
- Docker and Nginx configuration
- Backup and recovery procedures
