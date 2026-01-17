# Wedding WhatsApp Concierge - Detailed Specification

*This document extends the base spec with detailed decisions from stakeholder interview.*

---

## 1. Overview

**Purpose:** WhatsApp concierge bot for Sanjoli & Shreyas's wedding
**Audience:** ~400 invited guests
**Languages:** English, Hindi, Punjabi (all from launch)
**Platform:** WhatsApp Cloud API with Interactive Messages
**Phone:** Existing WhatsApp Business number
**Launch:** Flexible - as soon as ready (wedding: 19-21 Feb)

### 1.1 Design Principles

- **Language-first onboarding** - Self-identifying buttons `[English] [हिंदी] [ਪੰਜਾਬੀ]`
- **Side-specific content** - Groom/Bride side determines events shown
- **Zero free text** - All interactions are button/list taps
- **Stateless architecture** - No conversation state, just null checks on guest fields
- **Database-driven content** - All content stored in DB, editable via admin panel
- **Reactive only** - Bot responds to guests; proactive messages via broadcast feature

---

## 2. Data Model

### 2.1 Guest Record

```typescript
interface Guest {
  phone_number: string;
  name: string | null;                        // From WhatsApp profile (not asked)
  user_language: 'EN' | 'HI' | 'PA' | null;
  user_side: 'GROOM' | 'BRIDE' | null;
  rsvp_status: 'YES' | 'NO' | null;
  rsvp_guest_count: number | null;            // 1-9 or 10 for "10+"
  opted_in: boolean;
  first_seen_at: timestamp;
  last_inbound_at: timestamp;
}
```

### 2.2 Event Record

```typescript
interface Event {
  id: string;
  name: string;
  name_hi: string;                            // Hindi translation
  name_pa: string;                            // Punjabi translation
  start_time: timestamp;
  venue_id: string;
  dress_code: string;
  dress_code_hi: string;
  dress_code_pa: string;
  side: 'GROOM' | 'BRIDE' | 'BOTH';
  sort_order: number;
}
```

### 2.3 Venue Record

```typescript
interface Venue {
  id: string;
  name: string;
  address: string;
  address_hi: string;
  address_pa: string;
  google_maps_link: string;
  parking_info: string;
  parking_info_hi: string;
  parking_info_pa: string;
}
```

### 2.4 Coordinator Contact Record

```typescript
interface CoordinatorContact {
  id: string;
  name: string;
  phone_number: string;
  role: string;                               // 'family' | 'travel' | 'venue' | 'medical'
  side: 'GROOM' | 'BRIDE' | 'BOTH';           // Side-specific contacts
  is_primary: boolean;
}
```

### 2.5 Database Changes

```sql
-- Guests table
ALTER TABLE guests ADD COLUMN user_language VARCHAR(5);
ALTER TABLE guests ADD COLUMN user_side VARCHAR(10);
ALTER TABLE guests ADD COLUMN rsvp_status VARCHAR(10);
ALTER TABLE guests ADD COLUMN rsvp_guest_count INTEGER;

-- Events table
ALTER TABLE events ADD COLUMN name_hi VARCHAR(255);
ALTER TABLE events ADD COLUMN name_pa VARCHAR(255);
ALTER TABLE events ADD COLUMN dress_code_hi VARCHAR(255);
ALTER TABLE events ADD COLUMN dress_code_pa VARCHAR(255);
ALTER TABLE events ADD COLUMN side VARCHAR(10) DEFAULT 'BOTH';

-- Venues table
ALTER TABLE venues ADD COLUMN address_hi TEXT;
ALTER TABLE venues ADD COLUMN address_pa TEXT;
ALTER TABLE venues ADD COLUMN parking_info_hi TEXT;
ALTER TABLE venues ADD COLUMN parking_info_pa TEXT;

-- Coordinator contacts table
ALTER TABLE coordinator_contacts ADD COLUMN side VARCHAR(10) DEFAULT 'BOTH';
```

---

## 3. State Machine

### 3.1 Flow Diagram

```
                                    ┌─────────────────┐
                                    │  Guest sends    │
                                    │  any message    │
                                    └────────┬────────┘
                                             │
                                             ▼
                                ┌────────────────────────┐
                                │  user_language = null? │
                                └────────────┬───────────┘
                                             │
                            ┌────────────────┴────────────────┐
                            │ YES                             │ NO
                            ▼                                 ▼
                ┌───────────────────────┐       ┌────────────────────────┐
                │  LANGUAGE SELECTION   │       │   user_side = null?    │
                │  Show 3 buttons       │       └────────────┬───────────┘
                └───────────┬───────────┘                    │
                            │                   ┌────────────┴────────────────┐
                            │ User taps button  │ YES                         │ NO
                            ▼                   ▼                             ▼
                ┌───────────────────────┐  ┌───────────────────┐  ┌─────────────────────┐
                │ Save user_language    │  │  SIDE SELECTION   │  │  ONBOARDED GUEST    │
                │ → Show side selection │  │  Show 2 buttons   │  │  Route by button ID │
                └───────────────────────┘  └─────────┬─────────┘  └──────────┬──────────┘
                                                     │                       │
                                                     │ User taps             ▼
                                                     ▼              ┌────────────────┐
                                           ┌─────────────────┐      │  MAIN ROUTER   │
                                           │ Save user_side  │      └────────┬───────┘
                                           │ → Show menu     │               │
                                           └─────────────────┘               │
              ┌───────────┬───────────┬───────────┬───────────┬──────┴─────┬───────────┬───────────┐
              ▼           ▼           ▼           ▼           ▼            ▼           ▼           ▼
       ┌──────────┐┌──────────┐┌──────────┐┌──────────┐┌──────────┐┌──────────┐┌──────────┐┌──────────┐
       │ Schedule ││ Venues   ││ Travel   ││  RSVP    ││Emergency ││  FAQs    ││  Gifts   ││  Reset   │
       └──────────┘└──────────┘└──────────┘└────┬─────┘└──────────┘└──────────┘└──────────┘└────┬─────┘
                                                │                                               │
                                                ▼                                               ▼
                                   ┌────────────────────┐                          ┌────────────────────┐
                                   │ rsvp_status=null?  │                          │ Clear user_language│
                                   └─────────┬──────────┘                          │ Clear user_side    │
                                             │                                     │ Keep RSVP intact   │
                                ┌────────────┴────────────┐                        │ → Language select  │
                                │ YES                     │ NO                     └────────────────────┘
                                ▼                         ▼
                    ┌───────────────────┐     ┌─────────────────────────┐
                    │ Show YES/NO btns  │     │ Show status + Update btn│
                    └─────────┬─────────┘     └─────────────────────────┘
                              │
                   ┌──────────┴──────────┐
                   │ YES                 │ NO
                   ▼                     ▼
       ┌─────────────────────┐  ┌─────────────────────┐
       │ Show count list     │  │ Save rsvp_status=NO │
       │ (1-10+)             │  │ Show confirmation   │
       └─────────┬───────────┘  └─────────────────────┘
                 │
                 │ User taps number
                 ▼
       ┌─────────────────────┐
       │ Save rsvp_status=YES│
       │ Save rsvp_count     │
       │ Show confirmation   │
       └─────────────────────┘
```

### 3.2 Routing Logic

```javascript
function handleMessage(guest, message) {
  // Step 1: Language selection (not set)
  if (guest.user_language === null) {
    if (message.button_id?.startsWith('lang_')) {
      guest.user_language = extractLanguage(message.button_id);
      return showSideSelection(guest.user_language);
    }
    return showLanguageSelection();
  }

  // Step 2: Side selection (not set)
  if (guest.user_side === null) {
    if (message.button_id?.startsWith('side_')) {
      guest.user_side = extractSide(message.button_id);
      return showMainMenu(guest);
    }
    return showSideSelection(guest.user_language);
  }

  // Step 3: Onboarded - route by button/list ID
  const id = message.button_id || message.list_id;

  switch (id) {
    case 'menu_schedule':   return showSchedule(guest);
    case 'menu_venue':      return showVenues(guest);
    case 'menu_travel':     return showTravel(guest);
    case 'menu_rsvp':       return handleRSVP(guest);
    case 'menu_emergency':  return showEmergency(guest);  // Side-specific contacts
    case 'menu_faq':        return showFAQs(guest);
    case 'menu_gifts':      return showGiftRegistry(guest);
    case 'menu_reset':      return resetPreferences(guest);  // Keeps RSVP

    // RSVP sub-flow
    case 'rsvp_yes':        return showGuestCountList(guest);
    case 'rsvp_no':         return confirmRSVPNo(guest);
    case 'rsvp_update':     return showGuestCountList(guest);  // Allow re-RSVP

    // Count selection
    case /^count_\d+/:      return confirmRSVPYes(guest, id);

    default:                return showMainMenu(guest);  // Fallback
  }
}
```

---

## 4. Button & List IDs

| Interaction | Type | IDs |
|-------------|------|-----|
| Language Selection | Reply Buttons (3) | `lang_en`, `lang_hi`, `lang_pa` |
| Side Selection | Reply Buttons (2) | `side_groom`, `side_bride` |
| Main Menu | List Message (8) | `menu_schedule`, `menu_venue`, `menu_travel`, `menu_rsvp`, `menu_emergency`, `menu_faq`, `menu_gifts`, `menu_reset` |
| RSVP Attendance | Reply Buttons (2) | `rsvp_yes`, `rsvp_no` |
| RSVP Already Done | Reply Buttons (2) | `rsvp_update`, `rsvp_back` |
| RSVP Count | List Message (10) | `count_1` through `count_9`, `count_10plus` |

---

## 5. Detailed Behaviors

### 5.1 RSVP Flow

**First-time RSVP:**
1. Guest taps RSVP → Show YES/NO buttons
2. If YES → Show count list (1-10+)
3. If NO → Show confirmation, save status

**Returning guest (already RSVP'd):**
1. Guest taps RSVP → Show current status + "Update RSVP" button
2. If Update → Show count list again (overwrites previous)

**10+ guests:**
- Store as `rsvp_guest_count = 10`
- No special handling/flags needed
- Message says "we'll be in touch" but no auto-notification

**Partial RSVP (API timeout):**
- If guest tapped YES but never selected count, next message shows main menu
- Guest can tap RSVP again to complete

### 5.2 Reset Flow (Change Language/Side)

When guest taps "Change Language / Side":
- Clear `user_language` → null
- Clear `user_side` → null
- **Keep RSVP intact** (status and count preserved)
- Show language selection to restart onboarding

### 5.3 Emergency Contacts

Contacts are **side-specific**:
- Groom side guests see Groom's family coordinators
- Bride side guests see Bride's family coordinators

Database has `side` field on coordinator_contacts table.

### 5.4 Post-Wedding Behavior

After 21 Feb (if simple to implement):
- Bot responds with thank you message
- Hides main menu

Otherwise, leave bot running normally.

### 5.5 RSVP Deadline

**Currently: No deadline** - guests can RSVP anytime.

*Question to ask Shreyas: Should there be a cutoff date (e.g., 17 Feb) after which RSVP is closed?*

---

## 6. Main Menu Structure

| # | English | Hindi | Punjabi | ID |
|---|---------|-------|---------|-----|
| 1 | Event Schedule | कार्यक्रम सूची | ਸਮਾਗਮ ਸੂਚੀ | `menu_schedule` |
| 2 | Venue & Directions | स्थान और दिशा-निर्देश | ਸਥਾਨ ਅਤੇ ਦਿਸ਼ਾ-ਨਿਰਦੇਸ਼ | `menu_venue` |
| 3 | Travel & Stay | यात्रा और ठहराव | ਯਾਤਰਾ ਅਤੇ ਠਹਿਰਾਅ | `menu_travel` |
| 4 | RSVP | RSVP | RSVP | `menu_rsvp` |
| 5 | Emergency Contact | आपातकालीन संपर्क | ਐਮਰਜੈਂਸੀ ਸੰਪਰਕ | `menu_emergency` |
| 6 | FAQs | अक्सर पूछे जाने वाले प्रश्न | ਅਕਸਰ ਪੁੱਛੇ ਜਾਣ ਵਾਲੇ ਸਵਾਲ | `menu_faq` |
| 7 | Gift Registry | उपहार सूची | ਤੋਹਫ਼ਾ ਸੂਚੀ | `menu_gifts` |
| 8 | Change Language / Side | भाषा / पक्ष बदलें | ਭਾਸ਼ਾ / ਪੱਖ ਬਦਲੋ | `menu_reset` |

---

## 7. Event Schedule

### 7.1 Groom Side (Shreyas)

| Date | Event | Hindi | Time |
|------|-------|-------|------|
| 19 Feb | Sangeet & Cocktail | संगीत एवं कॉकटेल | 7:00 PM |
| 20 Feb | Haldi | हल्दी | 12:00 PM |
| 20 Feb | Bhat | भात | 5:00 PM |
| 20 Feb | Mehndi | मेहंदी | 7:00 PM |
| 21 Feb | Nicrosi | निकासी | 10:00 AM |
| 21 Feb | Baraat | बारात | 1:00 PM |
| 21 Feb | Phere | फेरे | 5:00 PM |

### 7.2 Bride Side (Sanjoli)

| Date | Event | Hindi | Time |
|------|-------|-------|------|
| 19 Feb | Sangeet & Cocktail | संगीत एवं कॉकटेल | 7:00 PM |
| 20 Feb | Haldi | हल्दी | 12:00 PM |
| 20 Feb | Path | पाठ | 5:00 PM |
| 20 Feb | Mehndi | मेहंदी | 7:00 PM |
| 21 Feb | Phere | फेरे | 5:00 PM |

---

## 8. Admin Panel Updates

### 8.1 Guest List Enhancements

**New columns:**
- Language (EN/HI/PA)
- Side (Groom/Bride)
- RSVP Status (Yes/No/-)
- Guest Count

**Filters:**
- By Side: All | Groom | Bride | Not Onboarded
- By Language: All | English | Hindi | Punjabi
- By RSVP: All | Attending | Not Attending | No Response

**Summary stats at top:**
- Total guests: X
- Onboarded: X (Y%)
- RSVP'd: X attending, Y not attending, Z pending
- Total headcount: X guests
- By side: Groom X, Bride Y

### 8.2 Broadcast Enhancements

**Multi-language broadcasts:**
1. Admin types message in English
2. System shows auto-translated previews for Hindi and Punjabi
3. Admin can edit translations before sending
4. Each guest receives message in their preferred language
5. Guests without language preference (not onboarded) receive English

### 8.3 Content Management

**Admin panel forms to manage:**
- Events (with translations)
- Venues (with translations)
- FAQs (with translations)
- Coordinator contacts (with side assignment)

All content database-driven, no deploy required to update.

---

## 9. Dress Code Integration

### 9.1 Bot Behavior

Dress code info shown in two places:
1. **Inline in Venue details** - Each event shows its dress code
2. **Link in FAQs** - Points to full dress code page

### 9.2 Dress Code Page

Create language-specific URLs:
- `/dress-code` - English (existing)
- `/dress-code/hi` - Hindi version
- `/dress-code/pa` - Punjabi version

Bot links to appropriate version based on guest's language.

---

## 10. Gift Registry

### 10.1 Behavior

- Separate menu item in main menu
- Links to gift registry page (to be built)
- Same page linked for all guests regardless of side

### 10.2 Page to Build

Create `/gifts` page with:
- Wedding gift suggestions/registry
- Blessing/Shagun information
- Payment/contribution methods if applicable

*Details pending from family.*

---

## 11. Message Content

### 11.1 Welcome (Language Selection)

```
Welcome to Sanjoli & Shreyas's Wedding! 🌸

Please select your language:

[English] [हिंदी] [ਪੰਜਾਬੀ]
```

*Always in English - language not yet known. Buttons self-identify.*

### 11.2 Side Selection

| Language | Message | Button 1 | Button 2 |
|----------|---------|----------|----------|
| EN | Thank you! 🙏<br><br>Please select your side: | Groom's Side (Shreyas) | Bride's Side (Sanjoli) |
| HI | धन्यवाद! 🙏<br><br>कृपया अपना पक्ष चुनें: | वर पक्ष (श्रेयस) | वधू पक्ष (संजोली) |
| PA | ਧੰਨਵਾਦ! 🙏<br><br>ਕਿਰਪਾ ਕਰਕੇ ਆਪਣਾ ਪੱਖ ਚੁਣੋ: | ਲਾੜੇ ਵਾਲੇ (ਸ਼੍ਰੇਯਸ) | ਲਾੜੀ ਵਾਲੇ (ਸੰਜੋਲੀ) |

### 11.3 RSVP - Already Submitted

| Language | Message |
|----------|---------|
| EN | 📋 *Your RSVP*<br><br>Status: Attending ✅<br>Guests: {COUNT}<br><br>Need to make changes? |
| HI | 📋 *आपका RSVP*<br><br>स्थिति: उपस्थित ✅<br>अतिथि: {COUNT}<br><br>बदलाव करना है? |

Buttons: `[Update RSVP]` `[Back to Menu]`

### 11.4 FAQs

| Topic | English | Hindi |
|-------|---------|-------|
| Dress Code | Each event has a specific dress code. View details: {LINK} | प्रत्येक कार्यक्रम के लिए ड्रेस कोड है। विवरण देखें: {LINK} |
| Gifts | View our gift registry: {LINK} | उपहार सूची देखें: {LINK} |
| Children | Parents are requested to supervise children during all events. | सभी कार्यक्रमों में बच्चों की देखरेख करें। |
| Parking | Parking available at all venues. | सभी स्थानों पर पार्किंग उपलब्ध है। |

### 11.5 Welcome Back

| Language | Message |
|----------|---------|
| EN | Welcome back! 👋 |
| HI | फिर से स्वागत है! 👋 |
| PA | ਮੁੜ ਸਵਾਗਤ ਹੈ! 👋 |

### 11.6 Fallback

| Language | Message |
|----------|---------|
| EN | Please select an option from the menu: |
| HI | कृपया मेनू से विकल्प चुनें: |
| PA | ਕਿਰਪਾ ਕਰਕੇ ਮੇਨੂ ਤੋਂ ਵਿਕਲਪ ਚੁਣੋ: |

---

## 12. Implementation Phases

### Phase 1: Core Bot (1.5 days)

- [ ] Database migrations (new columns)
- [ ] Language selection with 3 buttons
- [ ] Side selection with 2 buttons
- [ ] Main menu as list message (8 items)
- [ ] Event schedule (side-filtered)
- [ ] Venue details
- [ ] Basic routing logic
- [ ] Fallback handler

### Phase 2: RSVP (0.5 day)

- [ ] RSVP yes/no buttons
- [ ] Guest count list (1-10+)
- [ ] RSVP confirmation messages
- [ ] RSVP status display for returning guests
- [ ] Update RSVP flow

### Phase 3: Content & Polish (1 day)

- [ ] Travel & Stay info
- [ ] Emergency contacts (side-specific)
- [ ] FAQs
- [ ] Reset flow (language/side only)
- [ ] Dress code page translations (/hi, /pa)
- [ ] Gift registry page

### Phase 4: Admin Panel (1 day)

- [ ] Guest list columns (language, side, RSVP, count)
- [ ] Filters (side, language, RSVP status)
- [ ] Summary stats
- [ ] Multi-language broadcast (auto-translate)
- [ ] "Not Onboarded" filter
- [ ] Content management forms (events, venues, FAQs)

**Total: ~4 days**

---

## 13. Open Questions for Shreyas

1. **RSVP Deadline:** Should there be a cutoff date after which guests can no longer RSVP? (e.g., 17 Feb)

2. **Gift Registry:** What should the gift registry page contain? Links to Amazon wishlist, bank details for Shagun, or something else?

3. **Punjabi Translations:** Who will provide/verify the Punjabi content?

4. **Post-Wedding Message:** What should the thank you message say?

---

## 14. Technical Notes

### 14.1 WhatsApp Button Limits

- Reply buttons: Max 3 buttons, 20 chars per button title
- List messages: Max 10 items, 24 chars per item title
- Current button text fits within limits (verified)

### 14.2 Content Storage

All translatable content in database with `_hi` and `_pa` suffix columns:
- `name`, `name_hi`, `name_pa`
- `address`, `address_hi`, `address_pa`
- etc.

Fallback: If translation missing, show English.

### 14.3 Broadcast Translation

Using translation API (or manual entry) for broadcast messages:
1. Admin enters English text
2. System generates Hindi/Punjabi previews
3. Admin reviews/edits
4. Messages sent based on `user_language`
5. Null language → English

### 14.4 Error Handling

- If interactive message fails, fall back to text message
- If API timeout, guest sees fallback menu on next message
- No partial state persisted (stateless design)
