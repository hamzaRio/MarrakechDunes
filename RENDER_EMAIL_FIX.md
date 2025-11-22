# Fix Email Sending on Render

## Problem
**Render changed their policy on September 26, 2025**: Free tier services now block outbound SMTP connections (ports 25, 465, and 587). This is a platform restriction, not a code issue.

## Solutions (Choose One)

### Option 1: Upgrade Render to Paid Plan ⭐ (SMTP Works)
If you upgrade to any paid Render plan, SMTP will work normally:
- Starter plan: $7/month
- SMTP ports are unblocked on paid plans
- Your current SMTP configuration will work immediately

### Option 2: Use Resend API (Free, Works on Free Tier)
Resend uses HTTPS (not blocked) and works on free tier.

#### Quick Setup (5 minutes)

1. **Sign up for Resend** (Free tier: 3,000 emails/month)
   - Go to: https://resend.com/signup
   - Create account with your email

2. **Get API Key**
   - Dashboard → API Keys → Create API Key
   - Copy the key (starts with `re_`)

3. **Add to Render**
   - Go to Render Dashboard → Your Service → Environment
   - Click "+ Add" button
   - Add these variables:
     ```
     Key: RESEND_API_KEY
     Value: re_xxxxxxxxxxxxx (your key from Resend)
     ```
   - Click "Save" (auto-redeploys)

4. **Test**
   - After deployment, try sending email from admin dashboard
   - Should work immediately!

### How It Works

- Code tries SMTP first (your current config stays)
- If SMTP fails (blocked by Render), automatically uses Resend
- You keep SMTP configured - if Render ever unblocks it, SMTP will work
- Resend is just a fallback that works NOW

### Option 3: Use Another Email API Service
- SendGrid (free tier: 100 emails/day)
- Mailgun (free tier: 5,000 emails/month)
- AWS SES (pay-as-you-go, very cheap)

All use HTTPS APIs, so they work on Render's free tier.

---

## Recommendation

**For Free Tier**: Use Resend (Option 2) - it's free, works immediately, and you get 3,000 emails/month.

**For SMTP Only**: Upgrade to Render paid plan (Option 1) - SMTP will work normally.

### Why Resend Works

- ✅ Uses HTTPS (port 443) - not blocked by Render
- ✅ Free tier: 3,000 emails/month
- ✅ Better deliverability than SMTP
- ✅ Works immediately
- ✅ No code changes needed (already implemented)

