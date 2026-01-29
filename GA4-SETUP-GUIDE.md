# GA4 Server-Side Conversion Tracking Setup

**Updated:** 28 Jan 2026
**Purpose:** Configure GA4 to receive purchase events from the Hotmart webhook
**Status:** Ready for implementation

---

## Overview

Reset Primal now has **server-side conversion tracking** implemented. When customers purchase via Hotmart, the webhook automatically sends a `purchase` event to Google Analytics 4.

**Benefits:**
- ✅ More reliable than client-side pixels (can't be blocked)
- ✅ Tracks offline/API conversions
- ✅ Better data quality and attribution
- ✅ Integrates with GA4 Reports and BigQuery

---

## Step-by-Step Setup

### Step 1: Get Your Measurement ID ✓ ALREADY DONE

You already have: `G-KKTGW6BEJP`

Verify it's in your landing page:
```bash
grep "G-KKTGW6BEJP" /var/www/reset-primal/landing-page/index.html
```

### Step 2: Create Measurement Protocol Secret (5 min)

**Location:** Google Analytics 4 Admin

1. Go to [Google Analytics](https://analytics.google.com/)
2. **Select your property:** "Reset Primal"
3. Click **Admin** (⚙️ gear icon, bottom-left)
4. Under "Data Collection and Modification":
   - Click **Data Streams**
5. Click your **Web stream** (resetprimal.com.br)
6. Scroll down to **"Measurement Protocol"** section
7. Click **"Create"** next to "Measurement Protocol secret"
8. A secret will be generated, **copy it**

**Example secret:** `abc123XYZ_def456-ghi789_jkl`

### Step 3: Add to .env File (PRODUCTION)

SSH into production server:
```bash
ssh root@64.225.44.199
nano /var/www/reset-primal/api/.env
```

Add these lines:
```env
GOOGLE_ANALYTICS_PROPERTY_ID=G-KKTGW6BEJP
GOOGLE_ANALYTICS_API_SECRET=YOUR_SECRET_HERE_REPLACE_THIS
```

**Save:** Press `CTRL+X` → `Y` → `Enter`

### Step 4: Add to .env File (LOCAL DEVELOPMENT)

Update your local `.env` file:
```bash
nano /Users/acacioamaro/Projects/reset-primal/.env
```

Add the same lines:
```env
GOOGLE_ANALYTICS_PROPERTY_ID=G-KKTGW6BEJP
GOOGLE_ANALYTICS_API_SECRET=YOUR_SECRET_HERE_REPLACE_THIS
```

### Step 5: Test the Integration

**Test locally:**
```bash
# Start webhook (if not running)
cd /Users/acacioamaro/Projects/reset-primal
npm start

# In another terminal, test GA4
curl "http://localhost:3000/test-ga4?email=test@example.com&value=97"
```

**Expected response:**
```json
{
  "success": true,
  "message": "Evento de teste enviado para GA4",
  "details": {
    "measurement_id": "G-KKTGW6BEJP",
    "client_id": "a1b2c3d4e5f6",
    "event_name": "purchase",
    "value": 97,
    "currency": "BRL"
  }
}
```

**Test on production:**
```bash
curl "http://64.225.44.199:3001/test-ga4?email=teste@example.com&value=97"
```

### Step 6: Verify in GA4 Dashboard

1. Go to [Google Analytics](https://analytics.google.com/)
2. Click **Reports** → **Realtime**
3. You should see events appearing
4. Click on an event to see details

**Note:** It takes 24-48 hours for historical data to appear. Real-time shows within seconds.

---

## What Happens When Someone Purchases

### Webhook Flow:
```
1. Customer purchases on Hotmart (hotmart.com)
2. Hotmart sends webhook to Reset Primal API:
   POST /webhook/hotmart

3. Our webhook processes:
   ✅ Validates Hotmart signature (HMAC-SHA256)
   ✅ Sends email with e-book link (SendGrid)
   ✅ Tracks conversion in GA4 (Measurement Protocol)
   ✅ Tracks in Facebook Pixel (if configured)

4. GA4 receives event:
   {
     "client_id": "hash_of_email",
     "events": [{
       "name": "purchase",
       "params": {
         "value": 97,
         "currency": "BRL",
         "transaction_id": "hotmart-123456789",
         "items": [{
           "item_id": "reset-primal-protocol",
           "item_name": "Reset Primal Protocol",
           "price": 97
         }]
       }
     }]
   }

5. Event appears in:
   - GA4 → Reports → Realtime (within seconds)
   - GA4 → Reports → Conversions (within 24-48h)
   - GA4 → BigQuery (if connected)
```

---

## Troubleshooting

### Problem: "GA4_API_SECRET não configurado"

**Solution:**
1. Check `.env` file has the secret
2. Restart the webhook server
3. Test again

```bash
# SSH to server
ssh root@64.225.44.199

# Check .env
cat /var/www/reset-primal/api/.env | grep GA4

# Restart (if using PM2)
pm2 restart webhook-hotmart

# Or just curl the test endpoint
curl http://64.225.44.199:3001/test-ga4
```

### Problem: GA4 Test Returns 400 Error

**Check:**
```bash
# Verify GA4_PROPERTY_ID is correct (should start with G-)
echo $GOOGLE_ANALYTICS_PROPERTY_ID

# Verify secret is not empty
echo $GOOGLE_ANALYTICS_API_SECRET | wc -c
```

### Problem: Test Returns 500 Error

**Check the logs:**
```bash
ssh root@64.225.44.199
tail -50 /var/www/reset-primal/api/logs/webhook-hotmart.log | grep -i "ga4\|error"
```

### Problem: Real Purchase Not Showing in GA4

**Wait 24-48h**, then check:
1. GA4 → Reports → Conversions
2. Filter by date (today)
3. Should show "purchase" events

**If still not showing:**
1. Check webhook logs: `tail logs/webhook-hotmart.log`
2. Check if purchase triggered webhook (Hotmart dashboard)
3. Verify Hotmart → API webhook settings

---

## Files Modified

| File | Change | Status |
|------|--------|--------|
| `api/webhook-hotmart.js` | Added GA4 tracking + test endpoint | ✅ Done |
| `.env.example` | Added GA4 setup instructions | ✅ Done |
| `GA4-SETUP-GUIDE.md` | This file | ✅ Done |

---

## Next Steps

1. **Today:** Get GA4 API Secret and add to `.env`
2. **Test:** Run `/test-ga4` endpoint
3. **Tomorrow:** Make a test purchase to verify webhook flow
4. **Monitor:** Watch GA4 Realtime during test purchase

---

## Support

### GA4 Resources
- [GA4 Measurement Protocol](https://developers.google.com/analytics/devguides/collection/protocol/ga4)
- [GA4 API Secret Setup](https://support.google.com/analytics/answer/12970820)
- [GA4 Events Guide](https://developers.google.com/analytics/devguides/collection/protocol/ga4/sending-events)

### Reset Primal
- Webhook: `POST /webhook/hotmart`
- Test endpoint: `GET /test-ga4`
- Logs: `logs/webhook-hotmart.log`

---

**Setup by:** Uma (UX Designer)
**Date:** 28 Jan 2026
**Estimated time:** 10-15 minutes (including GA4 admin setup)
