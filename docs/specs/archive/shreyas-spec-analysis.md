# Shreyas Spec Analysis

## Objective

Shreyas wants a full-service WhatsApp concierge bot that:

1. **Knows who the guest is** (Bride's side vs Groom's side) to show relevant events
2. **Speaks their language** (English, Hindi, or Punjabi) so elders can use it
3. **Answers common questions** (schedule, venue, travel, dress code) to reduce phone calls
4. **Collects RSVPs** to help with headcount planning
5. **Provides emergency escalation** when the bot can't help

**The spec he provided is a detailed technical design, but he's not an engineer.** We need to extract the *actual needs* and find the simplest implementation.

### What He Really Wants vs What He Wrote

| What He Wrote | What He Actually Wants |
|---------------|------------------------|
| Full state machine with 15+ states | Bot remembers who you are |
| Multi-step RSVP flow with state tracking | Know who's coming and headcount |
| Travel & Stay module with 4 sub-menus | Share hotel info without phone calls |
| EN/HI/PA tri-language blocks | Elders can read in their language |
| Human escalation with handoff flags | Safety net when bot fails |
| Venue sub-menu per event | Guests know where to go |

### Key Insight: WhatsApp Interactive Messages

WhatsApp Cloud API supports **interactive buttons and list menus** (no template approval needed within 24-hour conversation window):

| Component | Capability | Use Case |
|-----------|------------|----------|
| **Reply Buttons** | Up to 3 tappable buttons | Language selection, side selection, RSVP |
| **List Messages** | Up to 10 selectable items in dropdown | Main menu, venue selection |

This means we can implement Shreyas's vision with **clean tap-to-select UX** instead of "reply with a number."

### Key Insight: Self-Identifying Language Buttons

Instead of cramming multiple languages into every message, we ask once upfront:

```
[English]  [हिंदी]  [ਪੰਜਾਬੀ]
```

A guest who can't read English will still recognize their own script. One tap, and all future messages are in their language.

---

## Detailed Diff

### Current vs Proposed

| Feature | Current State | Shreyas Wants | Our Plan | Status |
|---------|---------------|---------------|----------|--------|
| Language Selection | None | EN + HI + PA | Self-identifying buttons `[English] [हिंदी] [ਪੰਜਾਬੀ]` | **New** |
| Side Selection | None | Groom/Bride gate | Buttons after language selection | **New** |
| Event Schedule | Same for all | Side-specific | Filter by `user_side` | **Modify** |
| Menu Style | Text numbers (1-5) | 8 options | Interactive List Message | **Restructure** |
| RSVP | Not implemented | Multi-step flow | Buttons + count list (no text) | **New** |
| Travel/Stay | Not implemented | Sub-menu module | Single message with all info | **Simplify** |
| Escalation | Shows contact only | Keyword detection | Menu option (no keywords) | **Simplify** |

### Menu Structure Comparison

**Current:**
```
1. Wedding Location Guide
2. Dress Code Information
3. Event Schedule
4. FAQ
5. Emergency Contact
```

**Shreyas Wants:**
```
1. Event Schedule
2. Venue, Timings & Directions
3. Travel & Stay Information
4. RSVP & Attendance
5. Emergency & Help
6. FAQs & Other Information
7. Change Side
8. Exit
```

### Side-Specific Events

| Event | Groom Side (Shreyas) | Bride Side (Sanjoli) |
|-------|----------------------|----------------------|
| Sangeet/Cocktail | 19 Feb 7PM | 19 Feb 7PM |
| Haldi | 20 Feb 12PM | 20 Feb 12PM |
| **Bhat** | 20 Feb 5PM | - |
| **Path** | - | 20 Feb 5PM |
| Mehndi | 20 Feb 7PM | 20 Feb 7PM |
| **Nicrosi** | 21 Feb 10AM | - |
| **Baraat** | 21 Feb 1PM | - |
| Phere | 21 Feb 5PM | 21 Feb 5PM |

**This is the core reason for side selection** - 4 events differ between sides.

### Database Changes Required

```sql
-- Guests table
ALTER TABLE guests ADD COLUMN user_language VARCHAR(5); -- 'EN' | 'HI' | 'PA'
ALTER TABLE guests ADD COLUMN user_side VARCHAR(10); -- 'GROOM' | 'BRIDE'
ALTER TABLE guests ADD COLUMN rsvp_status VARCHAR(10); -- 'YES' | 'NO'
ALTER TABLE guests ADD COLUMN rsvp_guest_count INTEGER;

-- Events table
ALTER TABLE events ADD COLUMN side VARCHAR(10) DEFAULT 'BOTH'; -- 'GROOM' | 'BRIDE' | 'BOTH'
```

---

## Proposed Path Forward

### Phase 1: Onboarding Flow (Language + Side Selection)

**Goal:** Bot knows your language and which side you're on before anything else

**Onboarding Flow:**

```
Guest sends first message (anything)
            ↓
┌─────────────────────────────────────────────────────────┐
│  Welcome to Sanjoli & Shreyas's Wedding! 🌸             │
│                                                         │
│  Please select your language:                           │
│                                                         │
│  [English]  [हिंदी]  [ਪੰਜਾਬੀ]                           │
└─────────────────────────────────────────────────────────┘
            ↓
Guest taps [हिंदी]
            ↓
┌─────────────────────────────────────────────────────────┐
│  धन्यवाद! 🙏                                            │
│                                                         │
│  कृपया अपना पक्ष चुनें:                                  │
│                                                         │
│  [वर पक्ष (श्रेयस)]  [वधू पक्ष (संजोली)]                  │
└─────────────────────────────────────────────────────────┘
            ↓
Guest taps [वर पक्ष]
            ↓
┌─────────────────────────────────────────────────────────┐
│  स्वागत है! 🎉                                          │
│                                                         │
│  आप वर पक्ष (श्रेयस) की जानकारी देख रहे हैं।              │
│                                                         │
│  [मुख्य मेनू ▼]                                          │
│   ├─ कार्यक्रम सूची                                      │
│   ├─ स्थान और दिशा-निर्देश                               │
│   ├─ यात्रा और ठहराव                                     │
│   ├─ RSVP                                               │
│   ├─ आपातकालीन संपर्क                                    │
│   ├─ अक्सर पूछे जाने वाले प्रश्न                          │
│   └─ भाषा / पक्ष बदलें                                   │
└─────────────────────────────────────────────────────────┘
```

**Guest record after onboarding:**
```json
{
  "user_language": "HI",
  "user_side": "GROOM"
}
```

**Now every response is personalized** - correct language, correct events, no clutter.

**Implementation Logic (No State Machine):**
```
if (guest.user_language === null) → Show language buttons
else if (guest.user_side === null) → Show side buttons (in their language)
else → Show main menu / handle request (in their language)
```

**Database:** Add `user_language` and `user_side` columns to guests, add `side` column to events

### Phase 2: RSVP Collection

**Goal:** Capture attendance and headcount

**Simplified Flow (all taps, no free text):**
```
User taps "RSVP"
    ↓
Bot sends Reply Buttons: [Yes, I'm attending] [No, can't make it]
    ↓
If YES → Bot sends List Message:
    ┌─────────────────────────────┐
    │  How many guests?           │
    │                             │
    │  [Select number ▼]          │
    │   ├─ 1 guest                │
    │   ├─ 2 guests               │
    │   ├─ 3 guests               │
    │   ├─ 4 guests               │
    │   ├─ 5 guests               │
    │   ├─ 6 guests               │
    │   ├─ 7 guests               │
    │   ├─ 8 guests               │
    │   ├─ 9 guests               │
    │   └─ 10+ (we'll contact you)│
    └─────────────────────────────┘
    ↓
User taps "4 guests"
    ↓
Bot: "Thanks! RSVP recorded: 4 guests. See you there!"
```

**Why List Message instead of free text:**
- No parsing logic needed ("3 people" vs "3" vs "three")
- No validation errors
- "10+" handles large families gracefully
- Consistent tap-to-select UX throughout

**Database:** Add `rsvp_status`, `rsvp_guest_count` to guests

**State needed?** None! Every interaction is a button/list tap with a unique ID. No ambiguous text input.

### Phase 3: Content & Polish

**Travel & Stay:** Single menu option → returns all info in one message (in guest's language):

*English version:*
```
🏨 *Hotel Accommodation*
Hotel Leaf 9 INN
[Address]
[Google Maps link]
Check-in: 2 PM | Check-out: 11 AM

🚗 *Getting There*
From Airport: ~45 min by cab (Uber/Ola available)
Parking: Available at venue

📞 *Travel Coordinator*
[Name]: [Phone]
```

*Hindi version:*
```
🏨 *होटल आवास*
Hotel Leaf 9 INN
[पता]
[Google Maps लिंक]
चेक-इन: दोपहर 2 बजे | चेक-आउट: सुबह 11 बजे

🚗 *यहाँ कैसे पहुँचें*
हवाई अड्डे से: कैब से ~45 मिनट (Uber/Ola उपलब्ध)
पार्किंग: स्थल पर उपलब्ध

📞 *यात्रा समन्वयक*
[नाम]: [फ़ोन]
```

**No sub-menus needed.** One message covers it. Language already known from onboarding.

**Change Language/Side:** Add as menu option. Resets `user_language` and `user_side` to null, triggering onboarding flow again.

**Content Localization:** All bot responses need 3 versions (EN/HI/PA). This is a content task, not a code task. Can be done in a spreadsheet and loaded into the system.

### What NOT to Build

| Feature | Why Skip |
|---------|----------|
| Full state machine | Overkill - just null checks on guest fields |
| Keyword detection | Unnecessary - everything is button/list taps, fallback shows menu |
| Venue sub-menu per event | Friction - show all venues in one message |
| Automated reminders | Out of scope - use broadcast feature instead |
| Exit option | Unnecessary - bot is always available |
| Free text parsing | Error-prone - use buttons/lists for all input |

### Summary

| Phase | Features | Effort |
|-------|----------|--------|
| **Phase 1** | Language selection, Side selection, Interactive list menu, Side-specific schedule | 1.5 days |
| **Phase 2** | RSVP with buttons + count list | 0.5 day |
| **Phase 3** | Travel info, Change Language/Side option, content localization (EN/HI/PA) | 1 day |

**Total: ~3 days of development + content translation work**

### Content Work (Non-Engineering)

All bot messages need to be written in 3 languages. This can be prepared in a spreadsheet:

| Key | English | Hindi | Punjabi |
|-----|---------|-------|---------|
| `welcome` | Welcome to... | स्वागत है... | ਜੀ ਆਇਆਂ ਨੂੰ... |
| `select_side` | Please select your side | कृपया अपना पक्ष चुनें | ਕਿਰਪਾ ਕਰਕੇ ਆਪਣਾ ਪੱਖ ਚੁਣੋ |
| `menu_schedule` | Event Schedule | कार्यक्रम सूची | ਸਮਾਗਮ ਸੂਚੀ |
| ... | ... | ... | ... |

**Shreyas or family can help with Hindi/Punjabi translations.**

### Architecture Decision

**Fully stateless - every interaction is a button/list tap:**

```
if (guest.user_language === null) → Show language buttons
else if (guest.user_side === null) → Show side buttons (in their language)
else → Route based on button/list tap ID (in their language)
```

No `conversation_state` column. No state machine. No free text parsing.

**Why this works:**
- Language selection → 3 buttons with IDs: `lang_en`, `lang_hi`, `lang_pa`
- Side selection → 2 buttons with IDs: `side_groom`, `side_bride`
- Main menu → List with IDs: `menu_schedule`, `menu_venue`, `menu_rsvp`, `menu_reset`, etc.
- RSVP attendance → 2 buttons with IDs: `rsvp_yes`, `rsvp_no`
- RSVP count → List with IDs: `count_1`, `count_2`, ... `count_10plus`
- Reset → `menu_reset` clears `user_language` and `user_side`, restarts onboarding

Every tap has a unique ID. Route by ID, not by parsing text.

### Data Model After Implementation

```
Guest {
  phone_number: string
  name: string
  user_language: 'EN' | 'HI' | 'PA' | null    // Set after language selection
  user_side: 'GROOM' | 'BRIDE' | null         // Set after side selection
  rsvp_status: 'YES' | 'NO' | null            // Set after RSVP response
  rsvp_guest_count: number | null             // Set after count response (if YES)
  opted_in: boolean
  ...
}
```

Once `user_language` and `user_side` are set, the guest is "onboarded" and gets the full menu experience in their language with their relevant events.

---

## Appendix: State Machine

### Overall Flow Diagram

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
                │ → Show side selection │  │  Show 2 buttons   │  │  Route by message:  │
                └───────────────────────┘  └─────────┬─────────┘  │                     │
                                                     │            │  • Menu request     │
                                                     │ User taps  │  • Menu option      │
                                                     ▼            │  • RSVP count       │
                                           ┌─────────────────┐    │  • Keyword          │
                                           │ Save user_side  │    │  • Fallback         │
                                           │ → Show menu     │    └──────────┬──────────┘
                                           └─────────────────┘               │
                                                                             ▼
                                                                    ┌────────────────┐
                                                                    │  MAIN ROUTER   │
                                                                    └────────┬───────┘
                     ┌──────────────┬──────────────┬──────────────┬─────────┴────────┬──────────────┐
                     ▼              ▼              ▼              ▼                  ▼              ▼
              ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐     ┌───────────┐  ┌───────────┐
              │ Schedule  │  │  Venues   │  │  Travel   │  │   RSVP    │     │ Emergency │  │   FAQs    │
              └───────────┘  └───────────┘  └───────────┘  └─────┬─────┘     └───────────┘  └───────────┘
                                                                 │
                                                                 ▼
                                                    ┌─────────────────────────┐
                                                    │  rsvp_status = null?    │
                                                    └────────────┬────────────┘
                                                                 │
                                                ┌────────────────┴────────────────┐
                                                │ YES                             │ NO
                                                ▼                                 ▼
                                    ┌───────────────────────┐       ┌────────────────────┐
                                    │  Show YES/NO buttons  │       │ Already submitted  │
                                    └───────────┬───────────┘       │ Show status        │
                                                │                   └────────────────────┘
                                                │ User taps button
                                    ┌───────────┴───────────┐
                                    │ YES                   │ NO
                                    ▼                       ▼
                        ┌─────────────────────┐   ┌─────────────────────┐
                        │ Show guest count    │   │ Save rsvp_status=NO │
                        │ List (1-10+)        │   │ Show confirmation   │
                        └─────────┬───────────┘   └─────────────────────┘
                                  │
                                  │ User taps number
                                  ▼
                        ┌─────────────────────┐
                        │ Save rsvp_status=YES│
                        │ Save rsvp_count     │
                        │ Show confirmation   │
                        └─────────────────────┘
```

### Message Flow Examples

#### Example 1: New Guest (English, Groom's Side)

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ GUEST                           │ BOT                                           │
├─────────────────────────────────┼───────────────────────────────────────────────┤
│                                 │                                               │
│ "Hi"                            │                                               │
│ ─────────────────────────────▶  │                                               │
│                                 │                                               │
│                                 │  Welcome to Sanjoli & Shreyas's Wedding! 🌸   │
│                                 │                                               │
│                                 │  Please select your language:                 │
│                                 │                                               │
│                                 │  [English]  [हिंदी]  [ਪੰਜਾਬੀ]                 │
│                                 │ ◀─────────────────────────────────────────── │
│                                 │                                               │
│ Taps [English]                  │                                               │
│ ─────────────────────────────▶  │                                               │
│                                 │                                               │
│                                 │  Thank you! 🙏                                │
│                                 │                                               │
│                                 │  Please select your side:                     │
│                                 │                                               │
│                                 │  [Groom's Side (Shreyas)]                     │
│                                 │  [Bride's Side (Sanjoli)]                     │
│                                 │ ◀─────────────────────────────────────────── │
│                                 │                                               │
│ Taps [Groom's Side]             │                                               │
│ ─────────────────────────────▶  │                                               │
│                                 │                                               │
│                                 │  Welcome! 🎉                                  │
│                                 │                                               │
│                                 │  You're viewing info for Groom's Side.        │
│                                 │                                               │
│                                 │  [Main Menu ▼]                                │
│                                 │   ├─ Event Schedule                           │
│                                 │   ├─ Venue & Directions                       │
│                                 │   ├─ Travel & Stay                            │
│                                 │   ├─ RSVP                                     │
│                                 │   ├─ Emergency Contact                        │
│                                 │   ├─ FAQs                                     │
│                                 │   └─ Change Language / Side                   │
│                                 │ ◀─────────────────────────────────────────── │
│                                 │                                               │
│ Taps [Event Schedule]           │                                               │
│ ─────────────────────────────▶  │                                               │
│                                 │                                               │
│                                 │  📅 *Event Schedule (Groom's Side)*           │
│                                 │                                               │
│                                 │  • 19 Feb - Sangeet & Cocktail - 7:00 PM     │
│                                 │  • 20 Feb - Haldi - 12:00 PM                  │
│                                 │  • 20 Feb - Bhat - 5:00 PM                    │
│                                 │  • 20 Feb - Mehndi - 7:00 PM                  │
│                                 │  • 21 Feb - Nicrosi - 10:00 AM                │
│                                 │  • 21 Feb - Baraat - 1:00 PM                  │
│                                 │  • 21 Feb - Phere - 5:00 PM                   │
│                                 │                                               │
│                                 │  [Main Menu ▼]                                │
│                                 │ ◀─────────────────────────────────────────── │
└─────────────────────────────────┴───────────────────────────────────────────────┘

Guest record: { user_language: 'EN', user_side: 'GROOM', rsvp_status: null }
```

#### Example 2: New Guest (Hindi, Bride's Side, with RSVP)

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ GUEST                           │ BOT                                           │
├─────────────────────────────────┼───────────────────────────────────────────────┤
│                                 │                                               │
│ "Namaste"                       │                                               │
│ ─────────────────────────────▶  │                                               │
│                                 │                                               │
│                                 │  Welcome to Sanjoli & Shreyas's Wedding! 🌸   │
│                                 │                                               │
│                                 │  Please select your language:                 │
│                                 │                                               │
│                                 │  [English]  [हिंदी]  [ਪੰਜਾਬੀ]                 │
│                                 │ ◀─────────────────────────────────────────── │
│                                 │                                               │
│ Taps [हिंदी]                     │                                               │
│ ─────────────────────────────▶  │                                               │
│                                 │                                               │
│                                 │  धन्यवाद! 🙏                                  │
│                                 │                                               │
│                                 │  कृपया अपना पक्ष चुनें:                        │
│                                 │                                               │
│                                 │  [वर पक्ष (श्रेयस)]                            │
│                                 │  [वधू पक्ष (संजोली)]                           │
│                                 │ ◀─────────────────────────────────────────── │
│                                 │                                               │
│ Taps [वधू पक्ष]                  │                                               │
│ ─────────────────────────────▶  │                                               │
│                                 │                                               │
│                                 │  स्वागत है! 🎉                                │
│                                 │                                               │
│                                 │  आप वधू पक्ष (संजोली) की जानकारी देख रहे हैं।  │
│                                 │                                               │
│                                 │  [मुख्य मेनू ▼]                                │
│                                 │   ├─ कार्यक्रम सूची                            │
│                                 │   ├─ स्थान और दिशा-निर्देश                     │
│                                 │   ├─ यात्रा और ठहराव                           │
│                                 │   ├─ RSVP                                     │
│                                 │   ├─ आपातकालीन संपर्क                          │
│                                 │   ├─ अक्सर पूछे जाने वाले प्रश्न                │
│                                 │   └─ भाषा / पक्ष बदलें                         │
│                                 │ ◀─────────────────────────────────────────── │
│                                 │                                               │
│ Taps [RSVP]                     │                                               │
│ ─────────────────────────────▶  │                                               │
│                                 │                                               │
│                                 │  क्या आप विवाह में शामिल हो रहे हैं?           │
│                                 │                                               │
│                                 │  [हाँ, आ रहे हैं]  [नहीं आ पाएंगे]             │
│                                 │ ◀─────────────────────────────────────────── │
│                                 │                                               │
│ Taps [हाँ, आ रहे हैं]            │                                               │
│ ─────────────────────────────▶  │                                               │
│                                 │                                               │
│                                 │  बहुत अच्छा! 🎊                               │
│                                 │                                               │
│                                 │  आप सहित कुल कितने अतिथि आ रहे हैं?           │
│                                 │                                               │
│                                 │  [संख्या चुनें ▼]                              │
│                                 │   ├─ 1 अतिथि                                  │
│                                 │   ├─ 2 अतिथि                                  │
│                                 │   ├─ 3 अतिथि                                  │
│                                 │   ├─ 4 अतिथि                                  │
│                                 │   ├─ 5 अतिथि                                  │
│                                 │   ├─ 6 अतिथि                                  │
│                                 │   ├─ 7 अतिथि                                  │
│                                 │   ├─ 8 अतिथि                                  │
│                                 │   ├─ 9 अतिथि                                  │
│                                 │   └─ 10+ (हम संपर्क करेंगे)                    │
│                                 │ ◀─────────────────────────────────────────── │
│                                 │                                               │
│ Taps [4 अतिथि]                  │                                               │
│ ─────────────────────────────▶  │                                               │
│                                 │                                               │
│                                 │  धन्यवाद! आपका RSVP दर्ज हो गया। ✅           │
│                                 │                                               │
│                                 │  अतिथि: 4                                     │
│                                 │                                               │
│                                 │  हम आपसे मिलने के लिए उत्सुक हैं!              │
│                                 │                                               │
│                                 │  [मुख्य मेनू ▼]                                │
│                                 │ ◀─────────────────────────────────────────── │
└─────────────────────────────────┴───────────────────────────────────────────────┘

Guest record: { user_language: 'HI', user_side: 'BRIDE', rsvp_status: 'YES', rsvp_guest_count: 4 }
```

#### Example 3: Returning Guest (Already Onboarded)

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ GUEST                           │ BOT                                           │
├─────────────────────────────────┼───────────────────────────────────────────────┤
│                                 │                                               │
│ "Hi"                            │  (Guest already has: language=EN, side=GROOM) │
│ ─────────────────────────────▶  │                                               │
│                                 │                                               │
│                                 │  Welcome back! 👋                             │
│                                 │                                               │
│                                 │  [Main Menu ▼]                                │
│                                 │   ├─ Event Schedule                           │
│                                 │   ├─ Venue & Directions                       │
│                                 │   ├─ Travel & Stay                            │
│                                 │   ├─ RSVP                                     │
│                                 │   ├─ Emergency Contact                        │
│                                 │   ├─ FAQs                                     │
│                                 │   └─ Change Language / Side                   │
│                                 │ ◀─────────────────────────────────────────── │
└─────────────────────────────────┴───────────────────────────────────────────────┘

No onboarding needed - goes straight to menu.
```

#### Example 4: Fallback (Unknown Input)

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ GUEST                           │ BOT                                           │
├─────────────────────────────────┼───────────────────────────────────────────────┤
│                                 │                                               │
│ "What time is the wedding?"     │  (No button ID, just text)                    │
│ ─────────────────────────────▶  │                                               │
│                                 │                                               │
│                                 │  Please select an option from the menu:       │
│                                 │                                               │
│                                 │  [Main Menu ▼]                                │
│                                 │   ├─ Event Schedule                           │
│                                 │   ├─ Venue & Directions                       │
│                                 │   ├─ Travel & Stay                            │
│                                 │   ├─ RSVP                                     │
│                                 │   ├─ Emergency Contact                        │
│                                 │   ├─ FAQs                                     │
│                                 │   └─ Change Language / Side                   │
│                                 │ ◀─────────────────────────────────────────── │
└─────────────────────────────────┴───────────────────────────────────────────────┘

Any text input → show menu. No keyword parsing needed.
```
