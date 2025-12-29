# Wedding Jarvis - Implementation Plan

## Tech Stack
- **Backend**: Node.js/TypeScript + Express
- **Database**: Supabase (hosted PostgreSQL)
- **Hosting**: Railway
- **Frontend**: React + Vite (admin panel)
- **WhatsApp**: Meta Cloud API

> **Manual Setup**: See [WHATSAPP_SETUP.md](./WHATSAPP_SETUP.md) for Meta Business / WhatsApp API configuration steps.

---

## Project Structure

```
wedding-jarvis/
├── src/
│   ├── index.ts                    # Entry point
│   ├── config/                     # Config & constants
│   ├── db/
│   │   ├── client.ts               # Supabase client
│   │   └── migrations/             # SQL schemas
│   ├── routes/
│   │   ├── webhook.ts              # WhatsApp webhook
│   │   ├── admin.ts                # Admin API
│   │   └── auth.ts                 # Authentication
│   ├── services/
│   │   ├── whatsapp/               # WhatsApp API client
│   │   ├── bot/                    # Menu logic, responses
│   │   └── broadcast/              # Broadcast engine
│   ├── repositories/               # Database operations
│   ├── middleware/                 # Auth, rate-limit, webhook-verify
│   └── types/                      # TypeScript types
├── admin-panel/                    # React admin UI
│   └── src/pages/                  # Dashboard, Guests, Broadcast
├── railway.toml
├── Dockerfile
└── package.json
```

---

## Database Schema (Supabase)

### Core Tables
1. **guests** - phone_number, name, opted_in, first_seen_at, last_inbound_at, tags
2. **events** - name, description, start_time, venue_id, dress_code, sort_order
3. **venues** - name, address, google_maps_link, parking_info
4. **faqs** - question, answer, category, sort_order
5. **coordinator_contacts** - name, phone_number, role, is_primary
6. **broadcasts** - topic, message, template_name, status, sent_count, failed_count, idempotency_key
7. **send_logs** - broadcast_id, guest_id, status, error_code, whatsapp_message_id
8. **message_logs** - phone_number, direction, message_text, raw_payload
9. **admin_users** - email, password_hash
10. **system_settings** - key/value config (wedding_name, welcome_message, etc.)

---

## API Endpoints

### WhatsApp Webhook
- `GET /webhook` - Meta verification challenge
- `POST /webhook` - Receive inbound messages

### Admin API
- `POST /api/auth/login` | `POST /api/auth/logout` | `GET /api/auth/me`
- `GET /api/admin/stats` - Dashboard data
- `GET /api/admin/guests` - List guests (paginated, filterable)
- `GET/POST/PATCH/DELETE /api/admin/broadcasts` - Broadcast CRUD
- `POST /api/admin/broadcasts/:id/send` - Execute broadcast
- `GET/POST/PATCH/DELETE /api/admin/{events|venues|faqs|contacts}` - Content CRUD

---

## Bot Menu Flow

```
User sends "Hi" → Main Menu displayed

Main Menu:
1 - Event Schedule → Fetch events, display formatted
2 - Venues & Directions → Fetch venues with Google Maps links
3 - Dress Codes → Fetch dress codes per event
4 - FAQs → Fetch and display FAQs
5 - Contact Coordinator → Show primary coordinator info
0 - Return to menu (always available)

Special commands:
- "STOP" → Set opted_in=false, confirm unsubscribe
- "START" → Set opted_in=true, show menu
- Invalid input → Error message + menu
```

---

## Implementation Phases

### Phase 1: Foundation
- [ ] Initialize Node.js/TypeScript project with Express
- [ ] Create Supabase project and run migrations (guests table only for now)
- [ ] Set up project structure, ESLint, Prettier
- [ ] Basic Express server with health check endpoint
- [ ] Deploy to Railway (get public URL)

### Phase 2: Minimal WhatsApp Integration
- [ ] Implement `GET /webhook` (verification challenge)
- [ ] Implement `POST /webhook` (receive messages, log to console)
- [ ] Create WhatsApp API client (send text message function)
- [ ] Configure webhook in Meta (see WHATSAPP_SETUP.md Phase F)

### Phase 3: Loop Test (Validate Core Flow)
**Goal**: Prove the end-to-end flow works before building everything else.

#### Test A: Inbound → Response
- [ ] Send "Hi" to bot from test phone
- [ ] Webhook receives message (check logs)
- [ ] Bot responds with simple menu text
- [ ] Verify message received on phone

#### Test B: Outbound Broadcast
- [ ] Manually insert a test guest in Supabase (your phone number, opted_in=true)
- [ ] Create simple `/api/test/broadcast` endpoint that:
  - Fetches all opted_in guests
  - Sends a hardcoded message to each
- [ ] Hit endpoint, verify you receive the message
- [ ] Remove test endpoint after validation

**Exit criteria**: Both tests pass. Core WhatsApp integration is working.

---

### Phase 4: Full Bot Logic
- [ ] Implement main menu display with all options
- [ ] Implement menu option handlers:
  - [ ] 1 - Event schedule (fetch from DB)
  - [ ] 2 - Venues with Google Maps links
  - [ ] 3 - Dress codes per event
  - [ ] 4 - FAQs
  - [ ] 5 - Contact coordinator
- [ ] Implement STOP/START opt-out handling
- [ ] Add message logging (inbound + outbound to message_logs table)
- [ ] Handle invalid inputs gracefully (show menu again)

### Phase 5: Admin Backend
- [ ] Session-based authentication (express-session)
- [ ] Login/logout endpoints
- [ ] Dashboard stats endpoint (guest counts, last activity)
- [ ] Guest list endpoint with filters and pagination
- [ ] CSV export endpoint
- [ ] Broadcast CRUD endpoints
- [ ] Broadcast execution with:
  - [ ] Rate limiting (configurable delay between sends)
  - [ ] Idempotency key to prevent double-sends
  - [ ] Progress tracking (sent/failed counts)

### Phase 6: Admin Frontend (React)
- [ ] Login page
- [ ] Dashboard with stats cards
- [ ] Guests page with table, filters, search
- [ ] Broadcast page:
  - [ ] Create broadcast form
  - [ ] Preview before send
  - [ ] Confirmation modal ("Send to X guests?")
  - [ ] Progress display during send
  - [ ] Broadcast history
- [ ] Optional: Content editor for events/venues/FAQs

### Phase 7: Production Hardening
- [ ] Webhook signature validation (security)
- [ ] Rate limiting on all endpoints
- [ ] Error handling and graceful degradation
- [ ] Template message support for broadcasts (outside 24h window)
- [ ] Complete Meta Business verification
- [ ] Get message templates approved

### Phase 8: Go-Live
- [ ] Add real wedding content (events, venues, FAQs, contacts)
- [ ] End-to-end testing of all flows
- [ ] Test broadcast to small group
- [ ] Train operators on admin panel
- [ ] Share wa.me link with guests

---

## Critical Files

| File | Purpose |
|------|---------|
| `src/routes/webhook.ts` | WhatsApp webhook handlers |
| `src/services/whatsapp/client.ts` | WhatsApp API client (send messages) |
| `src/services/bot/menu-router.ts` | Menu navigation and response logic |
| `src/services/broadcast/broadcaster.ts` | Broadcast engine with rate limiting |
| `src/db/migrations/001_initial_schema.sql` | Database schema |
| `admin-panel/src/pages/Broadcast.tsx` | Admin broadcast UI |

---

## Environment Variables

```bash
# Server
PORT=3000
NODE_ENV=production

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=<service role key>

# WhatsApp (see WHATSAPP_SETUP.md)
WHATSAPP_PHONE_NUMBER_ID=<from Meta>
WHATSAPP_ACCESS_TOKEN=<permanent token>
WHATSAPP_VERIFY_TOKEN=<your custom string>
WHATSAPP_APP_SECRET=<from Meta app settings>

# Admin Auth
SESSION_SECRET=<random 32+ char string>
ADMIN_EMAIL=admin@wedding.com
ADMIN_PASSWORD_HASH=<bcrypt hash>

# Optional
TEST_PHONE_NUMBERS=919876543210,919876543211
BROADCAST_DELAY_MS=100
```

---

## Key Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Auth approach | Session-based | Simpler than JWT for admin panel |
| Admin panel | Same repo, React SPA | Shared types, single deployment |
| Broadcast safety | Idempotency key + confirmation | Prevent accidental double-sends |
| Error philosophy | Never crash, always respond | Wedding day reliability |
| Message logging | Log everything | Debugging and audit trail |
