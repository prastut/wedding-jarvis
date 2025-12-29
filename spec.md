# Wedding Jarvis

**Overall Spec Sheet (Backpropagated from User Requirements)**

---

## 0. Product Definition

A WhatsApp-based wedding assistant that supports:

- **Guest experience**: guests message a WhatsApp number and interact with a simple, menu-driven bot to get schedule, venue, and FAQ information.
- **Operator experience**: family members log into a simple admin panel to send broadcast updates and manage the system.

Single wedding, short-lived system, low scale.  
Optimize for **simplicity, correctness, and operational safety** over flexibility.

---

## 1. Major User Groups

### 1.1 Guests (Wedding Attendees)

**Who they are**

- Anyone invited to the wedding by the brother/fiancé/family.
- Non-technical, mixed age groups.

**How they enter the system**

- Receive a personal WhatsApp DM with a link to the bot.
- Opt in by sending the first message (“Hi”) to the bot.

**What they can do**

- View wedding schedule
- Get venue directions
- Check dress codes
- Read FAQs
- Contact a human coordinator if needed
- Opt out by sending “STOP”

**Guest success criteria**

- Can get correct information in 1–2 messages.
- Can always return to the main menu.
- Receives critical updates (delays, changes).
- Never receives spam or irrelevant messages.

---

### 1.2 Admin Panel Users (Operators)

**Who they are**

- Me
- Brother
- Brother’s fiancée
- A few trusted family members

**Technical profile**

- Except Me, rest are mon-technical
- Should not touch code, terminals, or configs

**Authentication**

- One shared login is acceptable for v1.
- Auth must be gated and non-public.

**What they need to do**

- Have an admin panel where they can see:
  - See how many guests have opted in
  - Send broadcast updates quickly and safely
  - Verify that messages were sent
- Avoid accidental double-sends or spam

**Operator success criteria**

- Can send a broadcast in under 60 seconds.
- Cannot violate WhatsApp rules accidentally.
- System works during wedding chaos without debugging.

---

## 2. Core Workflows

---

### 2.1 Inviting Guests to Opt In (Operator Workflow)

**Goal**
Convert a list of contacts into opted-in WhatsApp recipients.

**Mechanism**

- Operators send a personal WhatsApp DM containing a click-to-chat link:  
   https://wa.me/<BOT_NUMBER>?text=Hi
- **System behavior**
- When a guest sends any message to the bot:
- Store phone number in database
- Mark `opted_in = TRUE`
- Record timestamps
- Respond immediately with the main menu

**Admin visibility**

- Admin panel shows:
- Total guests
- Opted-in guests
- Recently active guests

---

### 2.2 Guest Uses Menu Bot (Guest Workflow)

**Goal**
Guests self-serve all routine wedding information.

**Main Menu (canonical)**
Welcome to <Wedding Name> Assistant.

1 - Event schedule
2 - Venues & directions
3 - Dress codes
4 - FAQs
0 - Main menu
5 - Contact coordinator

**Routing rules**

- Input `0` always resets to main menu.
- Invalid input:
  - Short error message
  - Re-display menu.
- All responses are deterministic and data-backed.

**Failure-safe rule**

- If information is missing or ambiguous:
  - Respond with “Details will be shared soon.”
  - Provide coordinator contact.

---

### 2.3 Sending a Broadcast Update (Operator Workflow)

**Goal**
Push time-sensitive updates (delays, venue changes) to guests.

**Constraints**

- Must comply with WhatsApp policy:
  - Outside a 24-hour user session, outbound messages must be **template messages**.
- Broadcasts always use approved templates.

**Admin panel flow**

1. Operator logs in.
2. Opens Broadcast page.
3. Enters:
   - Topic (e.g. “Baraat Update”)
   - Message body
   - Audience (default: all opted-in guests)
4. System shows preview.
5. Operator clicks **Send**.
6. System:
   - Sends messages in a controlled loop
   - Shows progress (sent / failed)
   - Stores logs

**Safety requirements**

- Confirmation step before sending
- Idempotency (prevent double-send)
- Rate limiting/throttling
- Optional test mode (send to 2–3 test numbers first)

---

### 2.4 Opt-Out and Re-Opt-In (Guest Workflow)

**Opt-out**

- Guest sends “STOP” (case-insensitive).
- System:
  - Sets `opted_in = FALSE`
  - Confirms unsubscription

**Re-opt-in**

- Guest sends “START”.
- System:
  - Sets `opted_in = TRUE`
  - Shows main menu

**Broadcast rule**

- Only `opted_in = TRUE` guests are eligible by default.

---

## 3. Data Requirements

### 3.1 System of Record

- Database is the single source of truth.
- No dependency on Google Sheets.

---

### 3.2 Core Entities

#### Guest

- phone_number (unique, E.164 without “+”)
- name (optional)
- opted_in (boolean)
- first_seen_at
- last_inbound_at
- notes (optional)
- tags (optional, for segmentation)

#### Content

- Events (schedule items)
- Venues
- FAQs
- Coordinator contacts

#### Broadcast

- broadcast_id
- created_by
- created_at
- topic
- message
- audience selector
- status: DRAFT / SENDING / SENT / FAILED
- sent_count
- failed_count

#### SendLog

- broadcast_id
- phone_number
- status
- error_code / error_message
- timestamp

---

## 4. Admin Panel Requirements

### 4.1 Authentication

- Simple gated access.
- Single shared login acceptable for v1.
- Must include:
  - Strong password
  - Session-based auth
  - Rate-limited login attempts

---

### 4.2 Admin Pages

#### Dashboard

- Total opted-in guests
- Opted-out guests
- Last inbound message timestamp
- Last broadcast status
- System health indicator

#### Guests

- Searchable list
- Filters:
  - opted-in
  - opted-out
  - tags
- Optional CSV export

#### Broadcast

- Create broadcast form
- Preview message
- Send button
- Live or near-live progress
- History of past broadcasts

#### Content Editor (Optional)

- Edit events
- Edit venues
- Edit FAQs
- Edit coordinator contacts

---

## 5. WhatsApp Integration Requirements

### 5.1 Inbound Messages

- Receive inbound messages via official WhatsApp Cloud API webhook.
- Extract sender number and message text.
- Update guest state.
- Route via menu logic.
- Send response via WhatsApp API.

### 5.2 Outbound Messages

- Session messages (inside 24 hours): free-form text for menus.
- Template messages (outside 24 hours): used for broadcasts.

### 5.3 Required Templates

Minimum:

- `wedding_update` (topic + message + optional link)

Optional:

- `wedding_welcome`
- `wedding_schedule_change`

---

## 6. Non-Functional Requirements

### Reliability

- No crashes on malformed input.
- Graceful degradation if data missing.
- Never send guessed or partial information.

### Observability

- Log inbound messages.
- Log outbound sends.
- Log broadcast results.

### Rate Limiting

- Throttle broadcast sends.
- Avoid WhatsApp quality degradation.

### Security

- Secrets stored securely.
- Admin endpoints protected.
- Basic CSRF protection.

---

## 7. Explicitly Out of Scope

- AI or NLP-based conversations
- Payments or RSVPs
- Gift registries
- Seat allocation
- Multi-tenant scaling
- High availability guarantees

---

## 8. Acceptance Criteria

### Guest Side

- “Hi” → main menu
- Menu options work correctly
- “0” always returns to menu
- “STOP” unsubscribes
- “START” re-subscribes

### Admin Side

- Login works
- Broadcast can be sent safely
- Broadcast logs visible
- No duplicate sends without intent

---

## 9. Operator SOP (Reality Check)

1. Send invite link to guests via personal WhatsApp.
2. Guests opt in by messaging bot.
3. Monitor opt-in count in admin panel.
4. When needed:
   - Open Broadcast page
   - Enter update
   - Preview
   - Send
5. Verify status is SENT.

This is the full operational loop.

---

## 10. Definition of Done

The system is complete when:

- Guests can self-serve information reliably.
- Operators can send updates safely.
- No WhatsApp policy violations occur.
- Non-technical users can run the system without support.
