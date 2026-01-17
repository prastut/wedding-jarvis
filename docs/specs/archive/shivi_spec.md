# Flow of the Bot

## Wedding WhatsApp Concierge – Engineering Flow Spec + Scope + Content Blocks (v1.0)

## 1. Overview

**Purpose:** A full concierge WhatsApp bot for all wedding-related queries.
**Audience:** ~400 invited guests.
**Languages:** English, Hindi, Punjabi (same flow; language can be selected later or shown as tri-language blocks).
**Platform:** Platform-agnostic (WATI / Interakt / Gupshup / Custom).

### 1.1 Design Principles

- Side-first personalization (Bride/Groom) to reduce confusion.
- One decision per screen/message (avoid long walls of text).
- Main Menu must be reachable from anywhere (Back/Menu keywords or persistent buttons).
- Human escalation available at every stage.
- Elder-friendly: short messages, clear labels, minimal slang.

## 2. Data Model (Engineer Notes)

Recommended session variables (names are illustrative):
- `user_side`: 'GROOM' | 'BRIDE'
- `user_language`: 'EN' | 'HI' | 'PA' (optional for now)
- `rsvp_status`: 'YES' | 'NO' | null
- `rsvp_guest_count`: integer | null
- `rsvp_dates`: text | null
- `last_state`: string (for back navigation)
- `handoff_required`: boolean

## 3. Master Flow (Text Spec)

```
START → WELCOME → SIDE_SELECTION → SIDE_CONFIRM → MAIN_MENU → (USER CHOOSES A MODULE) → MODULE_FLOW → MAIN_MENU/EXIT
```

Global: Fallback + Human Handoff available at all states.

## 4. State Machine / Screens

### 4.1 WELCOME (State: WELCOME)

**Trigger:** First inbound message OR 'start' keyword.

**Bot actions:**
- Show welcome message.
- Prompt for Side Selection (mandatory gate).

**Transitions:** WELCOME → SIDE_SELECTION

### 4.2 SIDE SELECTION (State: SIDE_SELECTION)

**User input (expected):**
- Groom's Side (Shreyas) OR keyword: groom, shreyas, ladke, var
- Bride's Side (Sanjoli) OR keyword: bride, sanjoli, ladki, vadhu

**Bot actions:**
- Set user_side accordingly.
- Confirm selection.

**Transitions:** SIDE_SELECTION → SIDE_CONFIRM

### 4.3 SIDE CONFIRM (State: SIDE_CONFIRM)

**Bot message:** Confirm selected side and provide: Continue / Change Side.

**Transitions:**
- Continue → MAIN_MENU
- Change Side → SIDE_SELECTION

### 4.4 MAIN MENU (State: MAIN_MENU)

**Menu options (fixed order):**
1. 📅 Event Schedule
2. 📍 Venue, Timings & Directions
3. 🏨 Travel & Stay Information
4. 📝 RSVP & Attendance
5. ☎️ Emergency & Help
6. ❓ FAQs & Other Information
7. 🔁 Change Side
8. ❌ Exit

**Transitions:** MAIN_MENU → MODULE_STATE based on selection.

## 5. Module Flows (Detailed)

### 5.1 Event Schedule (State: SCHEDULE)

**Purpose:** Show what's happening & when (no venue clutter).

**Logic:** Display schedule based on user_side.

**Post-actions:** View Venue Details / Back to Main Menu.

### 5.2 Venue, Timings & Directions (State: VENUE_MENU → VENUE_DETAIL)

**Purpose:** Where to go & when to report.

**Flow:**
- **VENUE_MENU:** Ask user to select event (Sangeet/Cocktail, Haldi, Mehndi, Baraat, Phere, etc.).
- **VENUE_DETAIL:** Reply with structured details: venue name, address, Google Maps link, reporting time, parking note, dress code.

**Post-actions:** Another Event / Back to Main Menu.

### 5.3 Travel & Stay (State: TRAVEL_MENU → TRAVEL_DETAIL)

**Purpose:** Reduce calls & coordinate arrivals.

**Sub-options:** Hotel Details, Airport/Station Pickup, Local Transport, Arrival Help.

**Post-actions:** Back / Main Menu.

**Note:** Content differs only if logistics differ by side; otherwise share common info.

### 5.4 RSVP & Attendance (State: RSVP_START → RSVP_YES_FLOW / RSVP_NO_FLOW)

**Purpose:** Capture structured RSVP data.

**Flow:**
- **RSVP_START:** Ask 'Are you attending?' YES / NO.
- **If YES:** Ask number of guests → ask dates attending → confirm.
- **If NO:** Thank and confirm recorded.

**Mandatory:** Confirmation message after submission.

### 5.5 Emergency & Help (State: HELP_MENU → HELP_DETAIL)

**Purpose:** Fast access to human support.

**Sub-options:** Family Coordinator, Travel/Hotel Helpdesk, Venue Help, Medical/Urgent.

**Return:** Name + phone number + escalation note.

### 5.6 FAQs & Other Info (State: FAQ_MENU → FAQ_DETAIL)

**Purpose:** Reduce repetitive queries.

**Topics:** Dress Code, Kids Policy, Gifts/Blessings, Weather, Timings & Etiquette, Misc.

**Return:** Short, polite answer; then Menu.

### 5.7 Change Side (State: CHANGE_SIDE)

**Logic:** Reset user_side and route to SIDE_SELECTION.

### 5.8 Exit (State: EXIT)

**Bot:** Thank you + warm close. End session.

## 6. Global Fallbacks & Safety Nets

### 6.1 Unrecognized Input (Fallback)

- Reply: 'I'm here to help. Please choose an option from the menu.'
- Route back to MAIN_MENU (or re-show current menu).

### 6.2 Human Escalation

- Trigger keywords: help, urgent, call, emergency, coordinator, contact, etc.
- Reply: 'Someone from the family coordination team will contact you shortly.'
- Set handoff_required = true (if platform supports).

## 7. Flowchart Diagram

```
START
  |
  v
WELCOME
  |
  v
SELECT SIDE? (GROOM / BRIDE)
  |
  v
CONFIRM SIDE
  |
  v
MAIN MENU
  |
  +--> EVENT SCHEDULE (SCHEDULE)
  |       |
  |       v
  |    SHOW SCHEDULE (side-specific)
  |       |
  |    BACK / MENU
  |
  +--> VENUE & DIRECTIONS (VENUE_MENU)
  |       |
  |    SELECT EVENT
  |       |
  |    VENUE DETAILS (VENUE_DETAIL)
  |       |
  |    ANOTHER EVENT / MENU
  |
  +--> TRAVEL & STAY (TRAVEL_MENU)
  |       |
  |    SELECT SUB-OPTION
  |       |
  |    INFO DISPLAY (TRAVEL_DETAIL)
  |       |
  |    BACK / MENU
  |
  +--> RSVP (RSVP_START)
  |       |
  |    YES / NO
  |       |
  |    IF YES -> GUEST COUNT -> DATES -> CONFIRM
  |    IF NO  -> THANK + CONFIRM
  |       |
  |    MENU
  |
  +--> EMERGENCY & HELP (HELP_MENU)
  |       |
  |    SELECT HELP TYPE
  |       |
  |    CONTACT DETAILS (HELP_DETAIL)
  |       |
  |    MENU
  |
  +--> FAQs (FAQ_MENU)
  |       |
  |    SELECT TOPIC
  |       |
  |    ANSWER (FAQ_DETAIL)
  |       |
  |    MENU
  |
  +--> CHANGE SIDE (CHANGE_SIDE)
  |       |
  |    SIDE SELECTION
  |
  +--> EXIT (EXIT)
          |
         END
```

## 8. Concierge Scope (Must Serve)

### 8.1 Core (Must-Have)

- Side identification (Bride/Groom)
- Event schedule (side-specific)
- Venue & directions (event-wise)
- RSVP collection (attendance, guest count, dates)
- Emergency contacts & human escalation
- FAQs
- Change side + exit

### 8.2 Logistics

- Hotel details (name, address, contact)
- Check-in / check-out guidance (if applicable)
- Pickup/drop guidance (airport/station)
- Local transport guidance (cabs, parking)
- Arrival coordination contact

### 8.3 Experience

- Dress codes (by event)
- Kids policy
- Gifts/blessings note
- Weather advisory
- Etiquette & punctuality (soft phrasing)

### 8.4 Communication

- Automated reminders (T-1 day, T-2 hours)
- Last-minute updates (venue gate change, delays)
- Post-wedding thank-you message

## 9. Content Blocks (To Be Filled – Same Flow for EN/HI/PA)

Note: Below are placeholders your team can fill with final venue names, addresses, Google Maps links, hotel names, and contacts.

### 9.1 Schedule Data (Side-Specific)

**GROOM SIDE (Shreyas):**
- 19 Feb – Sangeet/Cocktail – 7:00 PM
- 20 Feb – Haldi – 12:00 PM
- 20 Feb – Bhat – 5:00 PM
- 20 Feb – Mehndi – 7:00 PM
- 21 Feb – Nicrosi – 10:00 AM
- 21 Feb – Baraat – 1:00 PM
- 21 Feb – Phere – 5:00 PM

**BRIDE SIDE (Sanjoli):**
- 19 Feb – Sangeet/Cocktail – 7:00 PM
- 20 Feb – Haldi – 12:00 PM
- 20 Feb – Path – 5:00 PM
- 20 Feb – Mehndi – 7:00 PM
- 21 Feb – Phere – 5:00 PM

### 9.2 Venue Templates (Event-wise)

For each event, store and respond with:
- Venue Name:
- Address:
- Google Maps Link:
- Reporting Time:
- Parking Notes:
- Dress Code:

### 9.3 Travel & Stay Templates

**Hotel Details:**
- Hotel Name:
- Address:
- Contact:

**Pickup/Drop:**
- Pickup available? (Y/N)
- Time window:
- Coordinator contact:

**Local Transport:**
- Recommended cab apps:
- Parking guidance:

**Arrival Help:**
- Contact person + number:

### 9.4 RSVP Templates

**RSVP Questions:**
- Are you attending? (YES/NO)
- If YES: Number of guests
- If YES: Dates attending

**RSVP Confirmation:**
- Thank you. Your RSVP has been recorded.

### 9.5 Emergency Contacts Template

- Family Coordinator: Name – Phone
- Travel/Hotel Helpdesk: Name – Phone
- Venue Help: Name – Phone
- Medical/Urgent: Name – Phone

### 9.6 FAQ Topics (Suggested)

- Dress Code (by event)
- Kids Policy
- Gifts / Blessings note
- Weather & what to carry
- Reporting time guidance
- Misc: photography, seating, etc.

---

# Content of the Bot

## Wedding WhatsApp Concierge – Part 2: Guest-Facing Content (English & Hindi)

## 1. Welcome Message

**ENGLISH:**
> Hello 🌸
> Welcome to Sanjoli & Shreyas's Wedding Concierge.
>
> This WhatsApp assistant is the single point of contact for all wedding-related information including:
> - Event schedule
> - Venues & timings
> - Travel & stay details
> - RSVP & coordination
> - Emergency help
>
> To help you better, please tell us which side you are joining from.

**HINDI:**
> नमस्कार 🌸
> संजोली एवं श्रेयस के विवाह में आपका हार्दिक स्वागत है।
>
> यह व्हाट्सएप सहायक विवाह से जुड़ी सभी जानकारियों के लिए एक ही माध्यम है:
> - कार्यक्रम विवरण
> - स्थान एवं समय
> - यात्रा एवं ठहराव
> - RSVP सहायता
> - आपातकालीन संपर्क
>
> कृपया बताएं कि आप किस पक्ष से जुड़ रहे हैं।

## 2. Side Selection

**ENGLISH:**
> Please select one option:
> - Groom's Side (Shreyas)
> - Bride's Side (Sanjoli)

**HINDI:**
> कृपया एक विकल्प चुनें:
> - वर पक्ष (श्रेयस)
> - वधू पक्ष (संजोली)

## 3. Side Confirmation

**ENGLISH:**
> Thank you. You are viewing information for the selected side.
> Please choose:
> - Continue
> - Change Side

**HINDI:**
> धन्यवाद। आप चयनित पक्ष की जानकारी देख रहे हैं।
> कृपया चुनें:
> - आगे बढ़ें
> - पक्ष बदलें

## 4. Main Menu

**ENGLISH:**
> How can we assist you today?
> 1. Event Schedule
> 2. Venue, Timings & Directions
> 3. Travel & Stay Information
> 4. RSVP & Attendance
> 5. Emergency & Help
> 6. FAQs & Other Information
> 7. Change Side
> 8. Exit

**HINDI:**
> हम आपकी किस प्रकार सहायता कर सकते हैं?
> 1. कार्यक्रम सूची
> 2. स्थान, समय एवं दिशा-निर्देश
> 3. यात्रा एवं ठहराव
> 4. RSVP / उपस्थिति
> 5. आपातकालीन सहायता
> 6. सामान्य प्रश्न
> 7. पक्ष बदलें
> 8. बाहर निकलें

## 5. Event Schedule – Groom's Side

**ENGLISH:**
> - 19 Feb – Sangeet & Cocktail – 7:00 PM
> - 20 Feb – Haldi – 12:00 PM
> - 20 Feb – Bhat – 5:00 PM
> - 20 Feb – Mehndi – 7:00 PM
> - 21 Feb – Nicrosi – 10:00 AM
> - 21 Feb – Baraat – 1:00 PM
> - 21 Feb – Phere – 5:00 PM

**HINDI:**
> - 19 फरवरी – संगीत एवं कॉकटेल – शाम 7 बजे
> - 20 फरवरी – हल्दी – दोपहर 12 बजे
> - 20 फरवरी – भात – शाम 5 बजे
> - 20 फरवरी – मेहंदी – शाम 7 बजे
> - 21 फरवरी – निकासी – सुबह 10 बजे
> - 21 फरवरी – बारात – दोपहर 1 बजे
> - 21 फरवरी – फेरे – शाम 5 बजे

## 6. Event Schedule – Bride's Side

**ENGLISH:**
> - 19 Feb – Sangeet & Cocktail – 7:00 PM
> - 20 Feb – Haldi – 12:00 PM
> - 20 Feb – Path – 5:00 PM
> - 20 Feb – Mehndi – 7:00 PM
> - 21 Feb – Phere – 5:00 PM

**HINDI:**
> - 19 फरवरी – संगीत एवं कॉकटेल – शाम 7 बजे
> - 20 फरवरी – हल्दी – दोपहर 12 बजे
> - 20 फरवरी – पाठ – शाम 5 बजे
> - 20 फरवरी – मेहंदी – शाम 7 बजे
> - 21 फरवरी – फेरे – शाम 5 बजे

## 7. Venue, Timings & Directions (Template)

**ENGLISH:**
> - Venue Name:
> - Address:
> - Reporting Time:
> - Google Maps Link:
> - Parking:
> - Dress Code:

**HINDI:**
> - स्थान का नाम:
> - पता:
> - रिपोर्टिंग समय:
> - गूगल मैप लिंक:
> - पार्किंग:
> - ड्रेस कोड:

## 8. Travel & Stay Information

**ENGLISH:**
> Hotel details, pickup/drop information, local transport guidance and arrival help will be shared here.

**HINDI:**
> होटल विवरण, पिकअप/ड्रॉप जानकारी, स्थानीय परिवहन और आगमन सहायता की जानकारी यहाँ साझा की जाएगी।

## 9. RSVP & Attendance

**ENGLISH:**
> Please reply with:
> - YES – Attending
> - NO – Unable to attend
>
> If YES, please mention number of guests and dates.

**HINDI:**
> कृपया उत्तर दें:
> - YES – उपस्थित रहेंगे
> - NO – उपस्थित नहीं हो पाएंगे
>
> यदि उपस्थित होंगे, तो अतिथियों की संख्या और तिथियाँ बताएं।

## 10. Emergency & Help

**ENGLISH:**
> - Family Coordinator – Name & Phone
> - Travel/Hotel Helpdesk – Name & Phone

**HINDI:**
> - परिवार समन्वयक – नाम एवं फोन
> - यात्रा/होटल सहायता – नाम एवं फोन

## 11. FAQs

**Dress Code:**
> Each event has a specific dress code and color theme. Please follow the shared guidelines.

**Wedding Gifts:**
> A wedding gift registry has been created for those who wish to gift.

**Children:**
> Parents are requested to ensure close supervision of children during all events.

**Hindi equivalents:**
> - ड्रेस कोड – प्रत्येक कार्यक्रम के लिए निर्धारित ड्रेस कोड का पालन करें।
> - उपहार – विवाह उपहार सूची उपलब्ध है।
> - बच्चे – बच्चों की उचित देखरेख सुनिश्चित करें।

## 12. Fallback Message

**ENGLISH:**
> We're here to help. Please choose an option from the menu.

**HINDI:**
> हम आपकी सहायता के लिए यहाँ हैं। कृपया मेनू से विकल्प चुनें।
