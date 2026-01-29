# GA4 Setup - Quick Start (5 minutes)

## TL;DR

Run this command, paste your GA4 secret, done:

```bash
cd /Users/acacioamaro/Projects/reset-primal
./setup-ga4.sh
```

---

## Before You Start

Get your **GA4 API Secret** from Google Analytics:

1. Go to https://analytics.google.com/
2. Click **"Reset Primal"** property
3. **Admin** (⚙️ icon) → **Data Streams**
4. Click your **web stream** (resetprimal.com.br)
5. Scroll down → **"Measurement Protocol"** section
6. Click **"Create"** (if not already created)
7. **Copy the secret** that appears

**You should have something like:** `abc123XYZ_def456GHI789`

---

## Run the Setup Script

```bash
cd /Users/acacioamaro/Projects/reset-primal
./setup-ga4.sh
```

The script will:

1. ✅ Ask for your GA4 API Secret
2. ✅ Update your **local** `.env` file
3. ✅ Ask if you want to update **production** `.env` (via SSH)
4. ✅ Optionally restart the webhook on production
5. ✅ Test the GA4 connection
6. ✅ Show you what was configured

---

## What It Does

### Local Machine
- Backs up your `.env` file before editing
- Adds `GOOGLE_ANALYTICS_PROPERTY_ID=G-KKTGW6BEJP`
- Adds `GOOGLE_ANALYTICS_API_SECRET=your_secret_here`

### Production Server (Optional)
- Backs up production `.env` before editing
- Adds the same GA4 variables
- Restarts the webhook server
- Verifies the changes

---

## After Setup

### Test Locally
```bash
# Start webhook locally
npm start

# In another terminal, test GA4
curl "http://localhost:3000/test-ga4?email=test@example.com&value=97"
```

Expected response:
```json
{
  "success": true,
  "message": "Evento de teste enviado para GA4",
  "details": {
    "measurement_id": "G-KKTGW6BEJP",
    ...
  }
}
```

### Check Production
```bash
# Test on production server
curl "http://64.225.44.199:3001/test-ga4?email=test@example.com&value=97"

# Or check logs
ssh root@64.225.44.199 "tail -20 /var/www/reset-primal/api/logs/webhook-hotmart.log"
```

### Verify in GA4
1. Go to https://analytics.google.com/
2. Click **Reports** → **Realtime**
3. You should see "purchase" events appearing within seconds

---

## Troubleshooting

### "Command not found: ./setup-ga4.sh"
Make sure you're in the reset-primal directory:
```bash
cd /Users/acacioamaro/Projects/reset-primal
./setup-ga4.sh
```

### "Permission denied"
Run this first:
```bash
chmod +x setup-ga4.sh
```

### "Cannot connect to production server"
Make sure:
1. You have SSH access to `root@64.225.44.199`
2. Your SSH key is loaded: `ssh-add ~/.ssh/id_rsa`
3. Run the script again and choose "no" for production setup

You can update production manually:
```bash
ssh root@64.225.44.199
nano /var/www/reset-primal/api/.env
# Add/update the GA4 variables
```

### Test Shows "GA4_API_SECRET não configurado"
The secret wasn't saved. Run the script again or manually check your `.env` file:
```bash
grep GOOGLE_ANALYTICS .env
```

---

## Files Modified

```
.env                  (local) - GA4 variables added
.env.backup-XXXXX    (local) - backup of original .env
.env (production)     (remote) - GA4 variables added via SSH
.env.backup-XXXXX    (remote) - backup on production
```

---

## Security Notes

✅ Your GA4 API Secret is **never** logged or displayed in full
✅ Backups are created before any changes
✅ SSH connection verified before remote changes
✅ Changes are reversible (backups are saved)

---

## What Happens Next

**In your webhook** (`api/webhook-hotmart.js`):

When someone purchases via Hotmart:
```
1. Hotmart sends webhook
2. Our code validates the signature
3. Sends confirmation email
4. Sends purchase event to GA4 ← YOUR SECRET ENABLES THIS
5. Event appears in GA4 Reports
```

**In GA4:**
- Realtime: Events visible within seconds
- Reports: Full data visible within 24-48 hours
- BigQuery: Exported if connected

---

## Next: Test Purchase Flow

Tomorrow morning:
1. Complete a real purchase flow via landing page
2. Check your email for confirmation
3. Watch GA4 Realtime for the "purchase" event
4. Verify it shows in GA4 Reports

---

**Need help?** See `GA4-SETUP-GUIDE.md` for detailed instructions.
