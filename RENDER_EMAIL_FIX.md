# Fix Email Sending on Render

## Problem
Render blocks outbound SMTP connections (ports 465 and 587) at the firewall level. This is a security measure to prevent spam.

## Solution: Use Resend API

Resend uses HTTPS (not blocked) and works immediately.

### Quick Setup (5 minutes)

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

### Alternative: Contact Render Support

If you want SMTP only:
1. Contact Render support: support@render.com
2. Ask them to unblock outbound SMTP ports (465/587)
3. They may require justification and may not allow it on free plans

**Note:** This may take days/weeks and may not be approved.

### Why Resend Works

- ✅ Uses HTTPS (port 443) - not blocked by Render
- ✅ Free tier: 3,000 emails/month
- ✅ Better deliverability than SMTP
- ✅ Works immediately
- ✅ No code changes needed (already implemented)

