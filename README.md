# WHOP License Validator - Deployment Instructions

## ✅ You're Ready to Deploy!

This folder contains everything you need. Just follow these steps:

### Step 1: Deploy to Vercel (1 minute)

1. Go to: https://vercel.com/new
2. Sign up with GitHub (free, takes 30 seconds)
3. Click "Add New..." → "Project"
4. Drag and drop THIS ENTIRE FOLDER onto the page
5. Click "Deploy"
6. Wait 30 seconds - you'll get a URL like: `https://whop-license-validator-abc123.vercel.app`

### Step 2: Get Your WHOP Webhook Secret

1. Go to WHOP Dashboard
2. Click "Developer" → "Webhooks"
3. Click "Create Webhook"
4. URL: `https://YOUR-VERCEL-URL.vercel.app/api/webhook` (use URL from Step 1)
5. Select these events:
   - membership.activated
   - membership.deactivated
   - membership.cancel_at_period_end_changed
6. Click "Create"
7. **COPY the Webhook Secret** that appears

### Step 3: Add Webhook Secret to Vercel

1. In Vercel dashboard, go to your project
2. Click "Settings" → "Environment Variables"
3. Add variable:
   - Name: `WHOP_WEBHOOK_SECRET`
   - Value: (paste the webhook secret from WHOP)
4. Click "Save"
5. Go to "Deployments" tab → Click "..." → "Redeploy"

### Step 4: Configure Your ATAS Indicator

In your indicator settings:
- Validation Server URL: `https://YOUR-VERCEL-URL.vercel.app/api/validate`

## 🎉 Done!

Your license system is now live! When customers:
- Buy → WHOP sends webhook → license activated
- Cancel → WHOP sends webhook → license deactivated
- Try to use indicator → checks your server → works if license valid

## ⚠️ Important Note

This uses in-memory storage. If you restart the server, licenses will be lost.

For production, upgrade to a database (optional):
- Vercel KV (Redis) - has free tier
- Upstash Redis - has free tier

But for testing and small scale, this works perfectly!

## Need Help?

If anything doesn't work, check:
1. Webhook secret is correctly added to Vercel
2. Webhook URL in WHOP matches your Vercel URL
3. Indicator has correct validation URL
