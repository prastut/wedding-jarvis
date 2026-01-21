# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Run Commands

```bash
npm run dev          # Start backend with nodemon (auto-reload on save)
npm run build        # Compile TS and build admin panel
npm start            # Run production server (dist/index.js)
npm run lint         # ESLint on src/**/*.ts
npm run format       # Prettier format src/**/*.ts
npm run seed         # Populate database with test data
```

Admin panel (run in separate terminal):
```bash
cd admin-panel && npm run dev    # Vite dev server with HMR
cd admin-panel && npm run lint   # ESLint on admin panel
```

## Architecture

Wedding Jarvis is a WhatsApp-based wedding guest assistant with two main components:

1. **Backend (Express/TypeScript)**: Handles WhatsApp webhooks and serves admin API
2. **Admin Panel (React/Vite SPA)**: Web interface for operators to send broadcasts

### Tech Stack
- **Backend**: Node.js + Express 5 + TypeScript
- **Database**: Supabase (PostgreSQL)
- **Frontend**: React 19 + Vite + React Router
- **Hosting**: Railway (Docker)
- **Messaging**: Meta WhatsApp Cloud API

### Key Directories
- `src/routes/webhook.ts` - WhatsApp webhook handler (GET verification, POST messages)
- `src/services/botRouter.ts` - Bot menu logic and response generation
- `src/services/whatsappClient.ts` - WhatsApp API wrapper
- `src/repositories/` - Database access layer
- `admin-panel/src/` - React admin interface (built to `admin-panel/dist/`, served at `/`)

### Request Flow

**Inbound messages**: WhatsApp → POST /webhook → `processWebhook()` → `handleMessage()` → reply via `sendTextMessage()`

**Broadcasts**: Admin UI → POST /api/admin/broadcasts/:id/send → loop guests → `sendTextMessage()` with delay

### Bot Menu Options
Users text a number to navigate:
- `1` → Event Schedule
- `2` → Venues (with Google Maps)
- `3` → Dress Code
- `4` → FAQs
- `5` → Emergency Contact
- `STOP/START` → Unsubscribe/resubscribe
- `0/MENU` → Return to main menu

### Multi-language & Side Filtering
- **Languages**: EN (English), HI (Hindi), PA (Punjabi) - stored in `user_language`
- **Sides**: Guests are GROOM or BRIDE side - stored in `user_side`
- Content entities (events, contacts) have a `side` field: GROOM, BRIDE, or BOTH
- Translatable fields use `_hi` and `_pa` suffixes (e.g., `name`, `name_hi`, `name_pa`)
- i18n strings are in `src/i18n/` with one file per language

## Code Style

**Prettier**: Semi-colons, single quotes, trailing commas (ES5), 100 char width, 2-space indent

**ESLint rules**:
- Unused vars must start with `_` prefix
- `@typescript-eslint/no-explicit-any`: warn (not error)
- Ignores: `dist/`, `node_modules/`, `admin-panel/`

## Environment Variables

Required in `.env`:
```
SUPABASE_URL, SUPABASE_SERVICE_KEY
WHATSAPP_PHONE_NUMBER_ID, WHATSAPP_ACCESS_TOKEN, WHATSAPP_VERIFY_TOKEN
SESSION_SECRET
```

Optional:
```
WHATSAPP_APP_SECRET (webhook signature validation)
TEST_PHONE_NUMBERS, BROADCAST_DELAY_MS
```

## Database Tables

Core: `guests`, `events`, `venues`, `faqs`, `coordinator_contacts`
Operations: `broadcasts`, `send_logs`, `message_logs`, `admin_users`, `system_settings`

Migrations are in `src/db/migrations/`. Types in `src/types/index.ts`.

## Admin API Routes

All admin routes require session auth (`requireAuth` middleware):
- GET/POST/PATCH/DELETE `/api/admin/broadcasts`
- POST `/api/admin/broadcasts/:id/send`
- GET `/api/admin/guests?page=0&limit=50`
- GET `/api/admin/stats`

Auth routes (rate limited 10/15min):
- POST `/api/auth/login`, `/api/auth/logout`
- GET `/api/auth/me`
