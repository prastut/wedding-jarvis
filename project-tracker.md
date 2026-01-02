# Wedding Jarvis - Project Tracker

> Last updated: 2025-01-02

## Quick Status

| Phase | Description | Status |
|-------|-------------|--------|
| 1 | Foundation | ✅ Complete |
| 2 | Minimal WhatsApp Integration | ✅ Complete |
| 3 | Loop Test | ✅ Complete |
| 4 | Full Bot Logic | ✅ Complete |
| 5 | Admin Backend | ✅ Complete |
| 6 | Admin Frontend (React) | 🔄 In Progress |
| 7 | Production Hardening | ⏳ Pending |
| 8 | Go-Live | ⏳ Pending |

---

## Phase 1: Foundation ✅

- [x] Initialize Node.js/TypeScript project with Express
- [x] Create Supabase project and run migrations
- [x] Set up project structure, ESLint, Prettier
- [x] Basic Express server with health check endpoint
- [x] Deploy to Railway (got public URL)

---

## Phase 2: Minimal WhatsApp Integration ✅

- [x] Implement `GET /webhook` (verification challenge)
- [x] Implement `POST /webhook` (receive messages)
- [x] Create WhatsApp API client (send text message function)
- [x] Configure webhook in Meta

---

## Phase 3: Loop Test ✅

### Test A: Inbound → Response ✅
- [x] Send "Hi" to bot from test phone
- [x] Webhook receives message
- [x] Bot responds with message
- [x] Message received on phone

### Test B: Outbound Broadcast ✅
- [x] Test guest in Supabase (opted_in=true)
- [x] `/api/test/broadcast` endpoint created
- [x] Hit endpoint, verified message received (2 guests, 0 failures)
- [x] Remove test endpoint after validation

**Exit criteria**: Both tests pass → Core WhatsApp integration validated ✅

---

## Phase 4: Full Bot Logic ✅

- [x] Main menu display with all options
- [x] Option 1: Event schedule (fetch from DB)
- [x] Option 2: Venues with Google Maps links
- [x] Option 3: Dress codes per event
- [x] Option 4: FAQs
- [x] Option 5: Contact coordinator
- [x] STOP/START opt-out handling
- [x] Message logging (inbound + outbound)
- [x] Invalid input handling

---

## Phase 5: Admin Backend ✅

- [x] Session-based authentication
- [x] Login/logout endpoints
- [x] Dashboard stats endpoint
- [x] Guest list endpoint (filters, pagination)
- [x] CSV export endpoint
- [x] Broadcast CRUD endpoints
- [x] Broadcast execution with rate limiting

---

## Phase 6: Admin Frontend 🔄

- [ ] Login page
- [ ] Dashboard with stats
- [ ] Guests table with filters
- [ ] Broadcast page (create, preview, send, history)
- [ ] Content editor (events/venues/FAQs)

---

## Phase 7: Production Hardening ⏳

- [ ] Webhook signature validation
- [ ] Rate limiting on all endpoints
- [ ] Error handling
- [ ] Template message support (24h window)
- [ ] Meta Business verification
- [ ] Message templates approved

---

## Phase 8: Go-Live ⏳

- [ ] Add real wedding content
- [ ] End-to-end testing
- [ ] Test broadcast to small group
- [ ] Train operators
- [ ] Share wa.me link with guests

---

## Notes & Blockers

_None currently_

---

## Infrastructure

| Service | Status | URL/Details |
|---------|--------|-------------|
| Railway | ✅ Deployed | wedding-jarvis-production.up.railway.app |
| Supabase | ✅ Running | _add project URL here_ |
| Meta WABA | ✅ Configured | Webhooks verified |
