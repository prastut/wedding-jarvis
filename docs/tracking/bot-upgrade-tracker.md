# Wedding WhatsApp Concierge Upgrade — Project Tracker

## Agent Prompt

```
You are implementing the Wedding WhatsApp Concierge upgrade.

## Before Starting a PR

1. Read the CLAUDE.md file for codebase conventions
2. Read the master spec: `docs/specs/current/final-bot-spec-detailed.md`
3. Read the project tracker: `docs/tracking/bot-upgrade-tracker.md`
4. Read ALL completed reports in `docs/reports/bot-upgrade/` in sequential order
5. Create a new branch: `git checkout -b pr-XX-slug` (e.g., `pr-01-database-migrations`)

I want you to implement the next PR.

## During Implementation

Implement the PR according to its specification in the tracker. Follow the existing code patterns in the codebase (see CLAUDE.md for conventions).

## After Completing a PR

1. Generate a report file at `docs/reports/bot-upgrade/PR-{XX}-{slug}.md` using the template in the tracker
2. Update the Completion Log table in `docs/tracking/bot-upgrade-tracker.md`
3. Commit all changes with a descriptive message
4. Merge the branch to main: `git checkout main && git merge pr-XX-slug`
5. Delete the feature branch: `git branch -d pr-XX-slug`
```

---

## Overview

This tracker manages the upgrade of the Wedding Jarvis WhatsApp bot from a simple numeric text menu to a full-featured interactive concierge with:
- **Language selection** (English, Hindi, Punjabi)
- **Side selection** (Groom/Bride) for personalized content
- **RSVP flow** with guest count tracking
- **Interactive messages** (WhatsApp buttons and list messages)
- **Multi-language content** throughout

**Master Spec:** `docs/specs/current/final-bot-spec-detailed.md`
**Reports Directory:** `docs/reports/bot-upgrade/`

---

## Execution Strategy

### Parallel Execution

PRs within the same phase that share a "Parallel Group" letter (A, B, C...) can be executed simultaneously by different agents or in parallel branches.

### Testing First

**Phase 0 is critical** - we validate that WhatsApp interactive messages actually work before building the full bot logic. This prevents wasted effort if there are API issues.

---

## Pull Request Plan

### Phase 0: Validation Spike (DO THIS FIRST)

| PR | Title | Parallel | Status | Dependencies |
|----|-------|----------|--------|--------------|
| PR-00 | WhatsApp Interactive Message Spike | - | Pending | None |

**Purpose:** Validate that reply buttons and list messages work correctly with our WhatsApp setup before building the full bot.

---

### Phase 1: Foundation

| PR | Title | Parallel | Status | Dependencies |
|----|-------|----------|--------|--------------|
| PR-01 | Database Migrations + Types | - | Pending | PR-00 |
| PR-02 | Interactive Message Client + Constants | - | Pending | PR-00 |

*PR-01 and PR-02 can run in parallel after PR-00 is validated.*

---

### Phase 2: Core Onboarding Flow

| PR | Title | Parallel | Status | Dependencies |
|----|-------|----------|--------|--------------|
| PR-03 | Language → Side → Menu Flow | - | Pending | PR-01, PR-02 |
| PR-04 | i18n System + All Translations | - | Pending | PR-03 |

---

### Phase 3: Menu Features (ALL PARALLEL)

| PR | Title | Parallel | Status | Dependencies |
|----|-------|----------|--------|--------------|
| PR-05 | Event Schedule (Side-Filtered) | A | Pending | PR-04 |
| PR-06 | Venue Details | A | Pending | PR-04 |
| PR-07 | Emergency Contacts (Side-Specific) | A | Pending | PR-04 |
| PR-08 | FAQs + Travel + Gifts | A | Pending | PR-04 |
| PR-09 | RSVP Complete Flow | A | Pending | PR-04 |
| PR-10 | Reset Flow + Fallback Handler | A | Pending | PR-04 |

*All 6 PRs in Phase 3 can run in parallel - they only depend on the menu being in place.*

---

### Phase 4: Polish & Admin

| PR | Title | Parallel | Status | Dependencies |
|----|-------|----------|--------|--------------|
| PR-11 | Post-Wedding Behavior | B | Pending | Phase 3 complete |
| PR-12 | Admin: Guest Columns + Filters + Stats | B | Pending | PR-01 |
| PR-13 | Admin: Multi-Language Broadcasts | C | Pending | PR-12 |
| PR-14 | Admin: Content Management (Events/Venues/FAQs) | C | Pending | PR-12 |

*PR-11 and PR-12 can run in parallel. PR-13 and PR-14 can run in parallel after PR-12.*

---

## Total: 15 PRs (down from 27)

**Consolidated changes:**
- Merged DB migrations + types into PR-01
- Merged interactive client + constants into PR-02
- Merged language + side + menu flow into PR-03
- Merged all translations (EN/HI/PA) into PR-04
- Merged FAQs + Travel + Gifts into PR-08 (simple text responses)
- Merged complete RSVP flow into PR-09
- Merged Reset + Fallback into PR-10
- Merged all admin columns/filters/stats into PR-12
- Merged content management into PR-14

---

## Detailed PR Specifications

### PR-00: WhatsApp Interactive Message Spike

**Goal:** Validate that WhatsApp reply buttons and list messages work with our setup

**Scope:**
- Add temporary test endpoint `/test-interactive`
- Implement sendReplyButtons() with 3 test buttons
- Implement sendListMessage() with 5 test items
- Test receiving button_reply and list_reply webhook payloads
- Document any API quirks or limitations discovered

**Files to Create:**
- `src/routes/testInteractive.ts` (temporary, remove after validation)

**Files to Modify:**
- `src/services/whatsappClient.ts` (add interactive methods)
- `src/routes/webhook.ts` (log interactive reply payloads)
- `src/index.ts` (mount test route)

**Test Script:**
```bash
# Send test messages to your phone
curl -X POST http://localhost:3000/test-interactive/buttons?to=YOUR_PHONE
curl -X POST http://localhost:3000/test-interactive/list?to=YOUR_PHONE
```

**Acceptance Criteria:**
- [ ] Reply buttons render correctly on WhatsApp (iOS + Android)
- [ ] List message renders correctly with button to open
- [ ] Tapping a button sends webhook with `button_reply` type
- [ ] Tapping a list item sends webhook with `list_reply` type
- [ ] Button/list IDs are correctly passed back in webhook
- [ ] Document: character limits, emoji support, any quirks

**Validation Report:** Create `docs/reports/bot-upgrade/PR-00-spike-validation.md` documenting:
- Screenshots of messages on device
- Webhook payload samples
- Any API limitations discovered
- Go/No-Go decision for proceeding

---

### PR-01: Database Migrations + Types

**Goal:** Add all new database columns and update TypeScript types

**Scope:**
- Migration for guests: user_language, user_side, rsvp_status, rsvp_guest_count
- Migration for events: name_hi, name_pa, dress_code_hi, dress_code_pa, side
- Migration for venues: address_hi, address_pa, parking_info_hi, parking_info_pa
- Migration for coordinator_contacts: side
- Migration for faqs: question_hi, question_pa, answer_hi, answer_pa
- Update all TypeScript interfaces

**Files to Create:**
- `src/db/migrations/005_multilang_rsvp.sql`

**Files to Modify:**
- `src/types/index.ts`

**Acceptance Criteria:**
- [ ] All migrations run successfully on Supabase
- [ ] Guest type has user_language, user_side, rsvp_status, rsvp_guest_count
- [ ] Event type has translation fields and side
- [ ] Venue type has translation fields
- [ ] CoordinatorContact type has side
- [ ] FAQ type has translation fields
- [ ] TypeScript compiles without errors

---

### PR-02: Interactive Message Client + Constants

**Goal:** Production-ready interactive message support with all button/list IDs

**Scope:**
- Finalize sendReplyButtons() and sendListMessage() from spike
- Add proper TypeScript types for WhatsApp interactive messages
- Create constants file with all button and list IDs
- Add helper functions to extract language/side/count from IDs
- Handle interactive message parsing in webhook

**Files to Create:**
- `src/types/whatsapp.ts`
- `src/constants/buttonIds.ts`

**Files to Modify:**
- `src/services/whatsappClient.ts`
- `src/routes/webhook.ts` (parse interactive replies)

**Acceptance Criteria:**
- [ ] sendReplyButtons(to, body, buttons) works reliably
- [ ] sendListMessage(to, body, buttonText, sections) works reliably
- [ ] All button IDs defined as typed constants
- [ ] extractLanguage(), extractSide(), extractCount() helpers work
- [ ] Webhook correctly parses button_reply and list_reply messages
- [ ] Remove test route from PR-00

---

### PR-03: Language → Side → Menu Flow

**Goal:** Complete onboarding flow from first message to main menu

**Scope:**
- Show language selection (3 buttons) when user_language is null
- Show side selection (2 buttons) when user_side is null
- Show main menu (8-item list) when both are set
- Save selections to guest record
- Route menu selections to handlers (stub responses for now)

**Files to Modify:**
- `src/services/botRouter.ts` (major rewrite)
- `src/repositories/guests.ts` (add update methods)

**Acceptance Criteria:**
- [ ] New guest sees language selection buttons
- [ ] After language, sees side selection buttons
- [ ] After side, sees main menu list
- [ ] Selections saved to database
- [ ] Menu items route to stub handlers
- [ ] Back to menu from any stub response

---

### PR-04: i18n System + All Translations

**Goal:** Complete internationalization with EN/HI/PA translations

**Scope:**
- Create i18n message system with language fallback
- Add all bot messages in English, Hindi, Punjabi
- Update botRouter to use i18n for all messages
- Create dress code page routes for /hi and /pa

**Files to Create:**
- `src/i18n/index.ts` (main i18n system)
- `src/i18n/en.ts`
- `src/i18n/hi.ts`
- `src/i18n/pa.ts`

**Files to Modify:**
- `src/services/botRouter.ts` (use i18n)
- `src/routes/pages.ts` (dress code i18n routes)

**Messages to translate:**
- Welcome / language selection header
- Side selection prompt and buttons
- Main menu header and all 8 items
- RSVP prompts, confirmations
- All menu response texts
- Fallback / error messages

**Acceptance Criteria:**
- [ ] getMessage(key, language) returns correct translation
- [ ] Falls back to English if translation missing
- [ ] All bot messages use i18n system
- [ ] /dress-code, /dress-code/hi, /dress-code/pa work

---

### PR-05: Event Schedule (Side-Filtered)

**Goal:** Show events filtered by guest's side with translations

**Scope:**
- Fetch events where side = guest.user_side OR side = 'BOTH'
- Format with date, translated name, time, venue
- Content in user's language

**Files to Modify:**
- `src/services/botRouter.ts`
- `src/repositories/events.ts` (add getEventsBySide)

**Acceptance Criteria:**
- [ ] Groom side sees groom + shared events
- [ ] Bride side sees bride + shared events
- [ ] Event names in user's language
- [ ] Sorted by date/sort_order
- [ ] Includes "Back to Menu" button

---

### PR-06: Venue Details

**Goal:** Show venues with translations and directions

**Scope:**
- Fetch all venues
- Display translated name, address, parking info
- Include Google Maps links

**Files to Modify:**
- `src/services/botRouter.ts`

**Acceptance Criteria:**
- [ ] All venues displayed
- [ ] Content in user's language
- [ ] Maps links work
- [ ] Back to Menu button

---

### PR-07: Emergency Contacts (Side-Specific)

**Goal:** Show coordinator contacts filtered by side

**Scope:**
- Fetch contacts where side = guest.user_side OR side = 'BOTH'
- Display name, clickable phone, role
- Primary contacts first

**Files to Modify:**
- `src/services/botRouter.ts`
- `src/repositories/coordinatorContacts.ts` (add side filter)

**Acceptance Criteria:**
- [ ] Side-specific contacts shown
- [ ] Phone numbers clickable
- [ ] Primary contacts first
- [ ] Back to Menu button

---

### PR-08: FAQs + Travel + Gifts

**Goal:** Implement remaining simple menu handlers

**Scope:**
- FAQs: Fetch and display translated Q&A
- Travel: Display travel info (from system_settings or hardcoded)
- Gifts: Display gift registry message with link

**Files to Modify:**
- `src/services/botRouter.ts`

**Acceptance Criteria:**
- [ ] FAQs display in user's language
- [ ] Travel info displays
- [ ] Gift registry link works
- [ ] All have Back to Menu button

---

### PR-09: RSVP Complete Flow

**Goal:** Full RSVP flow with status tracking

**Scope:**
- First time: Show Yes/No buttons
- Yes → Show count list (1-10+)
- No → Save status, confirm
- Returning: Show status + Update button
- Update → Show count list again

**Files to Modify:**
- `src/services/botRouter.ts`
- `src/repositories/guests.ts` (RSVP update methods)

**Acceptance Criteria:**
- [ ] First-time RSVP shows Yes/No
- [ ] Yes leads to count list
- [ ] No saves status
- [ ] Returning guests see status
- [ ] Update allows changing RSVP
- [ ] 10+ shows "we'll be in touch"
- [ ] All messages in user's language

---

### PR-10: Reset Flow + Fallback Handler

**Goal:** Handle reset and unrecognized inputs

**Scope:**
- Reset: Clear language/side, keep RSVP, restart onboarding
- Fallback: Show menu with "please select" message
- Handle free text gracefully

**Files to Modify:**
- `src/services/botRouter.ts`
- `src/repositories/guests.ts` (reset method)

**Acceptance Criteria:**
- [ ] Reset clears language + side
- [ ] RSVP preserved after reset
- [ ] Language selection shown after reset
- [ ] Unknown inputs show fallback + menu
- [ ] Free text handled gracefully

---

### PR-11: Post-Wedding Behavior

**Goal:** Change bot behavior after wedding

**Scope:**
- Check date against wedding end (21 Feb)
- After wedding: Show thank you message
- Hide normal menu

**Files to Modify:**
- `src/services/botRouter.ts`

**Acceptance Criteria:**
- [ ] Date check works
- [ ] Thank you message after 21 Feb
- [ ] Can be easily toggled off

---

### PR-12: Admin Guest Columns + Filters + Stats

**Goal:** Enhanced admin panel guest management

**Scope:**
- Guest list: Add Language, Side, RSVP, Count columns
- Filters: Side, Language, RSVP status
- Dashboard stats: Onboarded %, RSVP breakdown, headcount, by-side

**Files to Modify:**
- `admin-panel/src/pages/Guests.tsx`
- `admin-panel/src/pages/Dashboard.tsx`
- `src/routes/admin.ts`
- `src/repositories/guests.ts` (filters)
- `src/repositories/stats.ts` (new stats)

**Acceptance Criteria:**
- [ ] New columns visible and sortable
- [ ] Filters work and combine
- [ ] Stats show onboarding %
- [ ] Stats show RSVP breakdown
- [ ] Stats show total headcount
- [ ] Stats show by-side breakdown

---

### PR-13: Admin Multi-Language Broadcasts

**Goal:** Send broadcasts in guest's preferred language

**Scope:**
- Broadcast form: EN/HI/PA message fields
- Send logic: Match to guest's user_language
- Null language → English

**Database:**
- Add message_hi, message_pa to broadcasts table

**Files to Modify:**
- `admin-panel/src/pages/Broadcasts.tsx`
- `src/services/broadcaster.ts`
- `src/types/index.ts`

**Acceptance Criteria:**
- [ ] Form has 3 language fields
- [ ] Guests receive correct language
- [ ] Null language gets English
- [ ] Preview shows all versions

---

### PR-14: Admin Content Management

**Goal:** CRUD forms for events, venues, FAQs, contacts

**Scope:**
- Events: CRUD with translations + side
- Venues: CRUD with translations
- FAQs: CRUD with translations
- Contacts: CRUD with side

**Files to Create:**
- `admin-panel/src/pages/Events.tsx`
- `admin-panel/src/pages/Venues.tsx`
- `admin-panel/src/pages/FAQs.tsx`
- `admin-panel/src/pages/Contacts.tsx`

**Files to Modify:**
- `src/routes/admin.ts` (CRUD endpoints)
- `admin-panel/src/App.tsx` (routes)

**Acceptance Criteria:**
- [ ] All CRUD operations work
- [ ] Translation fields editable
- [ ] Side assignment works
- [ ] Validation on required fields

---

## Completion Log

| PR | Completed | Report File | Notes |
|----|-----------|-------------|-------|
| PR-00 | 2026-01-17 | PR-00-spike-validation.md | SPIKE - Code complete, pending device testing |
| PR-01 | - | - | Can parallel with PR-02 |
| PR-02 | - | - | Can parallel with PR-01 |
| PR-03 | - | - | |
| PR-04 | - | - | |
| PR-05 | - | - | Parallel Group A |
| PR-06 | - | - | Parallel Group A |
| PR-07 | - | - | Parallel Group A |
| PR-08 | - | - | Parallel Group A |
| PR-09 | - | - | Parallel Group A |
| PR-10 | - | - | Parallel Group A |
| PR-11 | - | - | Parallel Group B |
| PR-12 | - | - | Parallel Group B |
| PR-13 | - | - | Parallel Group C |
| PR-14 | - | - | Parallel Group C |

---

## Dependency Graph

```
PR-00 (Spike)
   │
   ├──→ PR-01 (DB + Types) ──┐
   │                         ├──→ PR-03 (Onboarding Flow)
   └──→ PR-02 (Client + IDs) ┘           │
                                         ▼
                                    PR-04 (i18n)
                                         │
         ┌───────┬───────┬───────┬───────┼───────┐
         ▼       ▼       ▼       ▼       ▼       ▼
      PR-05   PR-06   PR-07   PR-08   PR-09   PR-10
      Events  Venues  Contacts FAQs   RSVP    Reset
         │       │       │       │       │       │
         └───────┴───────┴───────┴───────┴───────┘
                              │
                    Phase 3 Complete
                              │
              ┌───────────────┴───────────────┐
              ▼                               ▼
          PR-11                           PR-12
        Post-Wedding                   Admin Guests
                                           │
                              ┌────────────┴────────────┐
                              ▼                         ▼
                          PR-13                     PR-14
                      Broadcasts                 Content Mgmt
```

---

## Report Template

After completing a PR, generate `docs/reports/bot-upgrade/PR-{number}-{slug}.md`:

```markdown
# PR-{number}: {Title}

## Summary
{2-3 sentences describing what was built}

## Files Changed
- `path/to/file.ts` - {brief description}

## Key Decisions
- {Decision 1 and rationale}

## Testing Notes
- {How to test this feature}

## Dependencies for Future PRs
- {What this PR unlocks}

## Known Limitations
- {Intentional scope cuts}
```

---

## Quick Reference

### Button ID Reference

| Interaction | Type | IDs |
|-------------|------|-----|
| Language Selection | Reply Buttons (3) | `lang_en`, `lang_hi`, `lang_pa` |
| Side Selection | Reply Buttons (2) | `side_groom`, `side_bride` |
| Main Menu | List Message (8) | `menu_schedule`, `menu_venue`, `menu_travel`, `menu_rsvp`, `menu_emergency`, `menu_faq`, `menu_gifts`, `menu_reset` |
| RSVP Attendance | Reply Buttons (2) | `rsvp_yes`, `rsvp_no` |
| RSVP Update | Reply Buttons (2) | `rsvp_update`, `rsvp_back` |
| RSVP Count | List Message (10) | `count_1` through `count_9`, `count_10plus` |

### Guest State Machine

```
┌─────────────────────────────────────────────────────────────┐
│ 1. user_language = null   → Show Language Selection          │
│ 2. user_side = null       → Show Side Selection              │
│ 3. Both set               → Show Main Menu (Onboarded)       │
├─────────────────────────────────────────────────────────────┤
│ rsvp_status = null        → Show Yes/No Buttons              │
│ rsvp_status = 'NO'        → Show Status + Update Button      │
│ rsvp_status = 'YES'       → Show Status + Count + Update     │
└─────────────────────────────────────────────────────────────┘
```

### Language Codes

| Code | Language | Native |
|------|----------|--------|
| EN | English | English |
| HI | Hindi | हिंदी |
| PA | Punjabi | ਪੰਜਾਬੀ |

---

## Notes

### Testing
- Use TEST_PHONE_NUMBERS env var for testing
- PR-00 spike validates interactive messages work

### Wedding Date
- **19-21 February 2026**
- Post-wedding mode activates after 21 Feb
