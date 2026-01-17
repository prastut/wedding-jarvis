# WhatsApp Cloud API Troubleshooting Guide

This document captures the complete troubleshooting process for setting up WhatsApp Cloud API for Wedding Jarvis. Use this as a reference if things break in the future.

---

## The Setup We Have

| Component | Value |
|-----------|-------|
| Business Number | +91 87662 95199 |
| Phone Number ID | `971050586088614` |
| WABA ID (WhatsApp Business Account) | `25620623184237264` |
| App Name | Wedding Jarvis App |
| App ID | `2669776300050926` |
| Webhook URL | `https://wedding-jarvis-production.up.railway.app/webhook` |
| Verify Token | `wedding-jarvis-verify-2024` |

---

## Problem 1: Phone Number Showing "Pending" Status

### Symptom
- Phone number was added to WhatsApp Manager
- Status showed "Pending" instead of "Connected"
- Number didn't appear in the "From" dropdown in API Testing

### Root Cause
The phone number was **verified** (ownership confirmed) but not **registered** with the Cloud API.

### Solution
Register the phone number via API:

```bash
curl 'https://graph.facebook.com/v18.0/PHONE_NUMBER_ID/register' \
-H 'Content-Type: application/json' \
-H 'Authorization: Bearer ACCESS_TOKEN' \
-d '{
  "messaging_product": "whatsapp",
  "pin": "123456"
}'
```

**Important**: The PIN you set here is your two-step verification PIN. Remember it!

### Result
```json
{"success": true}
```

After this, the phone number shows "Connected" status in WhatsApp Manager.

---

## Problem 2: Can Send Messages But Not Receive Webhooks

### Symptom
- Sending messages via API worked perfectly
- Messages sent FROM personal WhatsApp TO business number produced no webhook events
- Railway logs showed nothing when messaging the business number
- But testing from Meta's UI (with test number) DID show webhook events

### Root Cause
**Two separate WhatsApp Business Accounts existed:**

1. **Test WABA** (ID: `3636653569820468`) - Created automatically by Meta with test number +1 555 149 9717
2. **Real WABA** (ID: `25620623184237264`) - Contains the actual business number +91 87662 95199

The webhook in the Meta Developer Console was configured at the **App level**, but the app was only subscribed to receive webhooks from the **Test WABA**, not the **Real WABA**.

### How to Diagnose
1. Go to **developers.facebook.com** → Your App → WhatsApp → **API Testing**
2. Look at the "WhatsApp Business Account ID" shown - this is likely the TEST WABA
3. Compare with your real WABA ID (found in WhatsApp Manager URL)

### Solution
Subscribe the app to the real WABA's webhooks via API:

```bash
curl -X POST "https://graph.facebook.com/v18.0/WABA_ID/subscribed_apps" \
  -H "Authorization: Bearer ACCESS_TOKEN"
```

For our setup:
```bash
curl -X POST "https://graph.facebook.com/v18.0/25620623184237264/subscribed_apps" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Result
```json
{"success": true}
```

After this, webhooks start flowing for messages to the real business number.

---

## Problem 3: Finding the Correct WABA ID

### The Challenge
Meta's UI doesn't clearly show the WABA ID. Here's how to find it:

### Method 1: From WhatsApp Manager URL
1. Go to **business.facebook.com** → **WhatsApp Manager**
2. Click on your WhatsApp Business Account
3. Look at the URL - find `asset_id=XXXXX`
4. That's your WABA ID

Example URL:
```
https://business.facebook.com/latest/whatsapp_manager/phone_numbers?business_id=1749000426060259&asset_id=25620623184237264
                                                                                                        ^^^^^^^^^^^^^^^^
                                                                                                        This is your WABA ID
```

### Method 2: From Business Portfolio
1. Go to **business.facebook.com** → **Settings** → **WhatsApp accounts**
2. Click on your WhatsApp Business Account
3. The ID is shown in the panel (e.g., "ID: 25620623184237264")

---

## Problem 4: Access Token Issues

### Symptom
- API calls fail with permission errors
- Token works for some operations but not others

### Root Cause
The System User token needs access to the correct WABA.

### Solution
1. Go to **Business Portfolio** → **Users** → **System users**
2. Click on your system user
3. Under **Assigned assets**, ensure:
   - Your App (Wedding Jarvis App) has **Full control**
   - Your WhatsApp account (Wedding Jarvis Phone) has **Full control**
4. Generate a new token with these permissions:
   - `whatsapp_business_messaging`
   - `whatsapp_business_management`

---

## Environment Variables Checklist

### Local (.env)
```bash
PORT=3000
NODE_ENV=development
SUPABASE_URL=https://srtgjvgzhpgwvyrnopfd.supabase.co
SUPABASE_SERVICE_KEY=your_supabase_key
WHATSAPP_PHONE_NUMBER_ID=971050586088614
WHATSAPP_ACCESS_TOKEN=your_permanent_access_token
WHATSAPP_VERIFY_TOKEN=wedding-jarvis-verify-2024
WHATSAPP_APP_SECRET=
SESSION_SECRET=your_session_secret
BROADCAST_DELAY_MS=100
```

### Railway (Production)
Same variables, but:
- `NODE_ENV=production`
- Use the **same** access token as local
- **CRITICAL**: Update Railway whenever you regenerate the token!

---

## Testing Commands

### Test Sending a Message
```bash
curl 'https://graph.facebook.com/v18.0/971050586088614/messages' \
-H 'Content-Type: application/json' \
-H 'Authorization: Bearer YOUR_ACCESS_TOKEN' \
-d '{
  "messaging_product": "whatsapp",
  "to": "919940212530",
  "type": "text",
  "text": {
    "body": "Test message from Wedding Jarvis"
  }
}'
```

### Check Phone Number Info
```bash
curl "https://graph.facebook.com/v18.0/971050586088614?fields=id,display_phone_number,verified_name&access_token=YOUR_TOKEN"
```

### Debug Token Permissions
```bash
curl "https://graph.facebook.com/v18.0/debug_token?input_token=YOUR_TOKEN&access_token=YOUR_TOKEN"
```

### Subscribe App to WABA Webhooks
```bash
curl -X POST "https://graph.facebook.com/v18.0/25620623184237264/subscribed_apps" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Key Learnings

1. **Two-Step Process for Phone Numbers**
   - First: Verify ownership (SMS/call verification)
   - Second: Register with Cloud API (API call with PIN)

2. **Test WABA vs Real WABA**
   - Meta creates a test WABA automatically
   - Your real phone number goes into a separate WABA
   - Webhooks must be subscribed to EACH WABA you want to receive events from

3. **Webhook Subscription Levels**
   - App-level: Configure callback URL and verify token in Developer Console
   - WABA-level: Subscribe the app to specific WABAs via API (`WABA_ID/subscribed_apps`)

4. **Token Scope**
   - System User tokens inherit access from assigned assets
   - If you can't access a WABA, check System User → Assigned assets

5. **Where to Find IDs**
   - Phone Number ID: API Testing page or WhatsApp Manager
   - WABA ID: URL parameter `asset_id` in WhatsApp Manager
   - App ID: App Dashboard or debug_token response

---

## Quick Recovery Steps

If webhooks stop working:

1. **Check Railway logs** - is the server running?
2. **Check token expiry** - debug the token
3. **Re-subscribe to WABA**:
   ```bash
   curl -X POST "https://graph.facebook.com/v18.0/25620623184237264/subscribed_apps" \
     -H "Authorization: Bearer YOUR_TOKEN"
   ```
4. **Verify webhook URL** - Meta Developer Console → Configuration
5. **Check webhook fields** - ensure `messages` is subscribed

---

## Links

- Meta Developer Console: https://developers.facebook.com/apps/2669776300050926
- WhatsApp Manager: https://business.facebook.com/wa/manage/home/
- Business Portfolio: https://business.facebook.com/settings/
- Railway Dashboard: https://railway.app

---

*Document created: January 2026*
*After 2+ hours of troubleshooting Meta's confusing UI*
