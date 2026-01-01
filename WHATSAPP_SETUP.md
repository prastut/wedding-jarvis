# WhatsApp Cloud API Setup Guide

This guide walks you through setting up Meta Business and WhatsApp Cloud API from scratch. Complete these steps before or in parallel with the code implementation.

---

## Phase A: Create Meta Business Account

### A1. Create Facebook Account (if needed)

- [ ] Go to facebook.com and create a personal Facebook account
- [ ] Verify your email address

### A2. Create Meta Business Account

- [ ] Go to **business.facebook.com**
- [ ] Click "Create Account"
- [ ] Enter business name (e.g., "Wedding Jarvis" or your name)
- [ ] Enter your name and business email
- [ ] Verify the email sent to you

### A3. Business Verification (IMPORTANT)

- [ ] In Business Settings → "Security Center" → "Start Verification"
- [ ] Upload documents: government ID, utility bill, or business registration
- [ ] Wait 1-5 business days for approval
- [ ] **Note**: You can use test numbers while waiting for verification

---

## Phase B: Create Meta App

### B1. Access Meta Developers

- [ ] Go to **developers.facebook.com**
- [ ] Log in with your Facebook account
- [ ] Click "My Apps" in top right

### B2. Create New App

- [ ] Click "Create App"
- [ ] Select **"Business"** as the app type
- [ ] Enter App Display Name: "Wedding Jarvis"
- [ ] Enter your email
- [ ] Select your Business Account
- [ ] Click "Create App"

### B3. Add WhatsApp Product

- [ ] On App Dashboard, find "Add Products to Your App"
- [ ] Find **WhatsApp** and click "Set Up"

---

## Phase C: WhatsApp Business Setup

### C1. Get Test Credentials

On the WhatsApp Getting Started page, note these values:

| Value                        | Where to Find               | Save As                             |
| ---------------------------- | --------------------------- | ----------------------------------- |
| Phone Number ID              | Under "From" dropdown       | `WHATSAPP_PHONE_NUMBER_ID`          |
| WhatsApp Business Account ID | Same page                   | For reference                       |
| Temporary Access Token       | Click to copy (expires 24h) | `WHATSAPP_ACCESS_TOKEN` (temporary) |

### C2. Add Test Phone Numbers

- [ ] In "To" field, click "Manage phone number list"
- [ ] Add your personal phone numbers (up to 5 for testing)
- [ ] Enter the verification code sent to each number
- [ ] **These are the only numbers that can receive messages initially**

### C3. Test Send a Message

- [ ] Use the "Send Message" button on Getting Started page
- [ ] Verify you receive the test message on your phone
- [ ] If it works, your basic setup is correct!

---

## Phase D: Production Phone Number

### D1. Get a Dedicated Phone Number

**Options:**
| Option | Pros | Cons |
|--------|------|------|
| New SIM card | Cheapest, most reliable | Need physical SIM |
| Virtual number (Twilio) | No physical SIM needed | Some don't work with WhatsApp |
| Business landline | Professional | Voice verification only |

**Requirements:**

- Number must NOT already be on WhatsApp or WhatsApp Business
- You must be able to receive SMS or voice call on it

### D2. Add Your Number

- [ ] In WhatsApp → Getting Started, click "Add phone number"
- [ ] Enter the phone number
- [ ] Choose verification method (SMS or Voice)
- [ ] Enter the verification code

### D3. Complete Profile

- [ ] Enter display name for your WhatsApp Business
- [ ] Select business category
- [ ] Add a profile picture (wedding photo?)
- [ ] Add description

---

## Phase E: Create Permanent Access Token

The temporary token expires in 24 hours. You need a permanent one.

### E1. Create System User

- [ ] Go to **business.facebook.com** → Business Settings
- [ ] Under "Users" → click "System Users"
- [ ] Click "Add"
- [ ] Name: "Wedding Jarvis Bot"
- [ ] Role: "Admin"
- [ ] Click "Create System User"

### E2. Assign Assets

- [ ] Click on the system user you created
- [ ] Click "Add Assets"
- [ ] Select "Apps" tab
- [ ] Find your "Wedding Jarvis" app
- [ ] Toggle "Full Control" ON
- [ ] Click "Save Changes"

### E3. Generate Token

- [ ] Click on your system user
- [ ] Click "Generate New Token"
- [ ] Select your app (Wedding Jarvis)
- [ ] Select permissions:
  - [ ] `whatsapp_business_messaging`
  - [ ] `whatsapp_business_management`
- [ ] Click "Generate Token"
- [ ] **COPY THIS TOKEN IMMEDIATELY** - store it securely
- [ ] This is your permanent access token (doesn't expire)

---

## Phase F: Configure Webhook

> **Prerequisite**: Your backend must be deployed first (see main spec)

### F1. Get Your Deployed URL

- [ ] Deploy your app to Railway
- [ ] Note your URL: `https://your-app.railway.app`

### F2. Configure Webhook in Meta

- [ ] In Meta Developers → your app → WhatsApp → Configuration
- [ ] Under "Webhook", click "Edit"
- [ ] Callback URL: `https://your-app.railway.app/webhook`
- [ ] Verify Token: create a random string (e.g., `wedding_jarvis_verify_abc123`)
- [ ] Save this token in your environment variables as `WHATSAPP_VERIFY_TOKEN`
- [ ] Click "Verify and Save"

### F3. Subscribe to Webhook Fields

- [ ] After verification, click "Manage" under Webhook fields
- [ ] Subscribe to:
  - [ ] **messages** (required - for receiving messages)
  - [ ] **message_template_status_update** (recommended)

---

## Phase G: Create Message Templates

Templates are required for sending messages outside the 24-hour session window (e.g., broadcasts).

### G1. Navigate to Templates

- [ ] Go to WhatsApp → Message Templates
- [ ] Or: business.facebook.com → WhatsApp Manager → Message Templates

### G2. Create `wedding_update` Template

- [ ] Click "Create Template"
- [ ] Category: **Utility**
- [ ] Name: `wedding_update` (lowercase, underscores only)
- [ ] Language: English

### G3. Design Template

```
Header (optional): Wedding Update

Body:
*{{1}}*

{{2}}

Reply MENU for options or STOP to unsubscribe.

Footer (optional): Wedding Jarvis
```

| Variable | Purpose      | Example                                            |
| -------- | ------------ | -------------------------------------------------- |
| `{{1}}`  | Topic/Title  | "Baraat Schedule Change"                           |
| `{{2}}`  | Message body | "The baraat will now arrive at 4pm instead of 3pm" |

- [ ] Click "Submit"
- [ ] Wait for approval (usually 24-48 hours)

---

## Phase H: Environment Variables Summary

Once you complete the above, you'll have these values to configure in Railway:

```bash
# WhatsApp (from this guide)
WHATSAPP_PHONE_NUMBER_ID=<from Phase C1>
WHATSAPP_ACCESS_TOKEN=<permanent token from Phase E3>
WHATSAPP_VERIFY_TOKEN=<your custom verify token from Phase F2>
WHATSAPP_APP_SECRET=<from App Dashboard → Settings → Basic → App Secret>

# Supabase (from Supabase dashboard)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=<service role key>

# Admin Auth
SESSION_SECRET=<random 32+ character string>
ADMIN_EMAIL=admin@wedding.com
ADMIN_PASSWORD_HASH=<bcrypt hash of your password>

# Server
PORT=3000
NODE_ENV=production
```

---

## Troubleshooting

### Webhook not receiving messages?

- [ ] Check Railway logs for incoming requests
- [ ] Verify URL is publicly accessible (try visiting it in browser)
- [ ] Ensure `messages` field is subscribed in webhook settings
- [ ] Check verify token matches between Meta and your env vars

### Messages not sending?

- [ ] Verify access token is valid (not the expired temporary one)
- [ ] Check phone number ID is correct
- [ ] For non-test numbers: business verification must be complete
- [ ] Outside 24-hour window? Must use template messages

### Template rejected?

- [ ] Avoid promotional language in Utility templates
- [ ] Ensure variable format is correct `{{1}}` not `{1}`
- [ ] Check Meta's template policy guidelines
- [ ] Try simpler wording and resubmit

---

## Quick Reference

### WhatsApp Messaging Rules

| Scenario                      | Message Type           | Cost |
| ----------------------------- | ---------------------- | ---- |
| User messaged you in last 24h | Free-form text         | Free |
| Outside 24h window            | Template messages only | Paid |
| Broadcast to opted-in users   | Template messages      | Paid |

### Rate Limits (by phone number quality)

| Quality           | Daily Limit       |
| ----------------- | ----------------- |
| New number        | 250 messages      |
| Good quality      | 1,000 messages    |
| High quality      | 10,000 messages   |
| Verified business | 100,000+ messages |

Maintain "Green" quality rating in WhatsApp Manager by avoiding blocks/reports.
