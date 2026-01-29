# 🚂 Railway.app Deployment Guide

**Status:** Ready to Deploy
**Cost:** $0/month (free tier with $5 credit)
**Environment:** Production-ready PostgreSQL + Node.js

---

## ✅ What Changed (Build Fix)

We fixed the Railway build failure with these changes:

### 1. **Procfile** (NEW)
- Tells Railway how to start the application
- Contains: `web: node api/server.js`

### 2. **railway.json** (NEW)
- Railway-specific configuration
- Specifies nixpacks builder
- Configures auto-restart on failure

### 3. **api/server.js** (FIXED)
- Moved `validateEnv()` from module load to runtime
- Prevents build failures due to missing env variables during build
- Variables now only validated when server actually starts

### 4. **.env.example** (UPDATED)
- Added `JWT_SECRET` documentation
- Added `DATABASE_URL` with Railway PostgreSQL format
- Added comments for Railway users

### 5. **config/railway-database.js** (NEW)
- Reference configuration for Railway PostgreSQL
- Connection pool settings
- SSL configuration for Railway databases

---

## 🚀 Step-by-Step Deployment to Railway

### Step 1: Connect GitHub Repository (Already Done)
✅ Repository is connected. Railway watches main branch for deployments.

### Step 2: Add PostgreSQL Database

1. Go to **railway.app** → Select your project
2. Click **"New Service"** → **Database** → **PostgreSQL**
3. Wait for deployment (2-3 minutes)
4. Railway automatically creates `DATABASE_URL` environment variable

### Step 3: Add Required Environment Variables

1. Go to **Project Settings** → **Variables**
2. Add these variables (copy values from your actual services):

```
NODE_ENV=production
PORT=3000
JWT_SECRET=your_actual_jwt_secret_here (min 32 chars)
HOTMART_WEBHOOK_SECRET=your_actual_webhook_secret
SENDGRID_API_KEY=your_actual_sendgrid_key
SENDGRID_FROM_EMAIL=noreply@resetprimal.com.br
GOOGLE_ANALYTICS_PROPERTY_ID=your_ga4_property_id (optional)
GOOGLE_ANALYTICS_API_SECRET=your_ga4_api_secret (optional)
FACEBOOK_PIXEL_ID=your_fb_pixel_id (optional)
FACEBOOK_PIXEL_TOKEN=your_fb_pixel_token (optional)
```

**Note:** `DATABASE_URL` is automatically added by Railway when PostgreSQL service is created.

### Step 4: Deploy Application

1. Commit and push the Railway configuration files:
   ```bash
   git push origin main
   ```

2. Railway automatically detects the push and starts build:
   - Detects Node.js project (via package.json)
   - Runs `npm install`
   - Uses Procfile: `node api/server.js`
   - Deploys automatically

3. Monitor deployment:
   - Go to **Deployments** tab
   - Click latest deployment to view logs
   - Wait for green checkmark

### Step 5: Run Database Migrations

After deployment completes, run Prisma migrations:

1. Open **Railway Shell** (Command terminal icon in dashboard)
2. Run: `npx prisma migrate deploy`
3. Or create seed data: `npm run prisma:seed`

### Step 6: Verify Deployment

1. Get your Railway application URL:
   - Go to **Service** → **Reset Primal** → **Settings**
   - Copy **Railway Domain** (e.g., `reset-primal-prod-123.railway.app`)

2. Test health check:
   ```bash
   curl https://reset-primal-prod-123.railway.app/health
   ```

3. Expected response:
   ```json
   {
     "status": "ok",
     "database": "connected",
     "uptime": 45.2,
     "timestamp": "2026-01-29T..."
   }
   ```

---

## 📊 Cost Breakdown

| Component | Cost | Notes |
|-----------|------|-------|
| PostgreSQL Database | Included | 5GB storage free |
| Node.js Service | $5 credit/month | Included in Railway account |
| Custom Domain | Optional | $3-4/month if wanted |
| **Total Monthly** | **$0** | Free forever! |

---

## 🔧 Troubleshooting

### Build Failed: "Failed to build an image"

**Cause:** Environment variables missing during build
**Fix:** Already applied! `validateEnv()` now only runs at runtime

If you still see this:
- Check Railway logs (click deployment)
- Verify `Procfile` exists
- Verify `railway.json` exists
- Ensure package.json is valid: `npm install` works locally

### "Database connection refused"

**Cause:** DATABASE_URL not injected yet
**Fix:**
1. Verify PostgreSQL service is running (green status)
2. Go to PostgreSQL service → Variables
3. Copy `DATABASE_URL` value
4. Paste into Node.js service variables
5. Redeploy Node.js service

### "Migrations failed"

**Cause:** Database schema not initialized
**Fix:**
```bash
# Via Railway Shell:
npx prisma migrate deploy
npx prisma db seed
```

### "Webhook not receiving requests"

**Cause:** Railway URL is different
**Fix:**
1. Update Hotmart webhook settings
2. New URL: `https://your-railway-url.railway.app/webhook/hotmart`
3. Re-test webhook in Hotmart dashboard

---

## 🌐 Configure Custom Domain (Optional)

To use `api.resetprimal.com.br` instead of Railway subdomain:

1. Go to **Service Settings** → **Domains**
2. Click **"Add Domain"** → **Custom Domain**
3. Enter: `api.resetprimal.com.br`
4. Update your DNS records (CNAME):
   ```
   api.resetprimal.com.br CNAME → your-railway-domain.railway.app
   ```
5. Wait 5-10 minutes for DNS propagation

---

## 📈 Monitoring & Logs

### View Real-time Logs
1. Go to **Deployments** → Latest deployment
2. Click **View Logs** tab
3. See all application output in real-time

### Database Connection Logs
1. Go to **PostgreSQL service** → **Logs**
2. See connection events and queries

### Set up Alerts (Optional)
1. Go to **Project Settings** → **Alerts**
2. Configure email alerts for deployment failures

---

## 🔄 Environment Variables Reference

### Required Variables
- `NODE_ENV` - Set to `production`
- `PORT` - Set to `3000` (Railway will bind to internal port)
- `DATABASE_URL` - Auto-injected by Railway PostgreSQL service
- `JWT_SECRET` - Your JWT signing key (min 32 characters)
- `HOTMART_WEBHOOK_SECRET` - Hotmart webhook secret
- `SENDGRID_API_KEY` - SendGrid email service key
- `SENDGRID_FROM_EMAIL` - Sender email address

### Optional Variables
- `GOOGLE_ANALYTICS_PROPERTY_ID` - GA4 property ID
- `GOOGLE_ANALYTICS_API_SECRET` - GA4 API secret
- `FACEBOOK_PIXEL_ID` - Facebook Pixel ID
- `FACEBOOK_PIXEL_TOKEN` - Facebook Pixel token

---

## 🆚 Why Railway Over Others?

| Feature | Railway | DigitalOcean | AWS |
|---------|---------|--------------|-----|
| PostgreSQL | ✅ Free | $15/month | $0 (12m free) |
| Compute | ✅ $5 credit | $6/month | $0 (12m free) |
| Storage | ✅ Included | $5/month | $0 |
| Setup | ⚡ 5 minutes | 20 minutes | 30+ minutes |
| Auto-deploy | ✅ GitHub | Manual | Manual |
| **Total Cost** | **$0/month** | **$26/month** | **$0 (then $$)** |

---

## 📝 Next Steps

1. ✅ Push changes to GitHub:
   ```bash
   git push origin main
   ```

2. ✅ Watch Railway deployment in real-time
3. ✅ Run database migrations in Railway Shell
4. ✅ Test health check endpoint
5. ✅ Update webhook URL in Hotmart settings
6. ✅ Monitor logs for errors

---

## 🆘 Getting Help

- **Railway Docs:** https://docs.railway.app
- **Railway Community:** https://discord.gg/railway
- **Your Dashboard:** https://railway.app/dashboard

---

**Status:** Ready to Deploy ✅
**Last Updated:** 29 January 2026
**Deployment Time:** ~10 minutes (first time includes migrations)
