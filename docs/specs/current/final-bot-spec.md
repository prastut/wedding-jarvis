# Wedding WhatsApp Concierge - Final Specification

## 1. Overview

**Purpose:** WhatsApp concierge bot for Sanjoli & Shreyas's wedding
**Audience:** ~400 invited guests
**Languages:** English, Hindi, Punjabi
**Platform:** WhatsApp Cloud API with Interactive Messages

### 1.1 Design Principles

- **Language-first onboarding** - Self-identifying buttons let non-English readers select their language
- **Side-specific content** - Groom/Bride side determines which events are shown
- **Zero free text** - All interactions are button/list taps (no parsing, no validation errors)
- **Stateless architecture** - No conversation state tracking, just null checks on guest fields
- **Elder-friendly** - Short messages, clear labels, tap-to-select UX

---

## 2. Data Model

### 2.1 Guest Record

```typescript
interface Guest {
  phone_number: string;           // WhatsApp phone number
  name: string | null;            // From contact profile
  user_language: 'EN' | 'HI' | 'PA' | null;  // Set after language selection
  user_side: 'GROOM' | 'BRIDE' | null;       // Set after side selection
  rsvp_status: 'YES' | 'NO' | null;          // Set after RSVP response
  rsvp_guest_count: number | null;           // Set after count selection (if YES)
  opted_in: boolean;              // STOP/START subscription
  first_seen_at: timestamp;
  last_inbound_at: timestamp;
}
```

### 2.2 Event Record

```typescript
interface Event {
  id: string;
  name: string;
  start_time: timestamp;
  venue_id: string;
  dress_code: string;
  side: 'GROOM' | 'BRIDE' | 'BOTH';  // Which side sees this event
  sort_order: number;
}
```

### 2.3 Database Changes Required

```sql
-- Guests table
ALTER TABLE guests ADD COLUMN user_language VARCHAR(5);
ALTER TABLE guests ADD COLUMN user_side VARCHAR(10);
ALTER TABLE guests ADD COLUMN rsvp_status VARCHAR(10);
ALTER TABLE guests ADD COLUMN rsvp_guest_count INTEGER;

-- Events table
ALTER TABLE events ADD COLUMN side VARCHAR(10) DEFAULT 'BOTH';
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
                     ┌───────────┬───────────┬───────────┬───────────┬──────┴─────┬───────────┐
                     ▼           ▼           ▼           ▼           ▼            ▼           ▼
              ┌──────────┐┌──────────┐┌──────────┐┌──────────┐┌──────────┐┌──────────┐┌──────────┐
              │ Schedule ││ Venues   ││ Travel   ││  RSVP    ││Emergency ││  FAQs    ││  Reset   │
              └──────────┘└──────────┘└──────────┘└────┬─────┘└──────────┘└──────────┘└────┬─────┘
                                                       │                                   │
                                                       ▼                                   ▼
                                          ┌────────────────────┐              ┌────────────────────┐
                                          │ rsvp_status=null?  │              │ Clear user_language│
                                          └─────────┬──────────┘              │ Clear user_side    │
                                                    │                         │ → Language select  │
                                       ┌────────────┴────────────┐            └────────────────────┘
                                       │ YES                     │ NO
                                       ▼                         ▼
                           ┌───────────────────┐     ┌───────────────────┐
                           │ Show YES/NO btns  │     │ Show RSVP status  │
                           └─────────┬─────────┘     └───────────────────┘
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

### 3.2 Routing Logic (Pseudocode)

```javascript
function handleMessage(guest, message) {
  // Step 1: Language selection
  if (guest.user_language === null) {
    if (message.button_id?.startsWith('lang_')) {
      guest.user_language = message.button_id.replace('lang_', '').toUpperCase();
      return showSideSelection(guest.user_language);
    }
    return showLanguageSelection();
  }

  // Step 2: Side selection
  if (guest.user_side === null) {
    if (message.button_id?.startsWith('side_')) {
      guest.user_side = message.button_id.replace('side_', '').toUpperCase();
      return showMainMenu(guest);
    }
    return showSideSelection(guest.user_language);
  }

  // Step 3: Route by button/list ID
  switch (message.button_id || message.list_id) {
    case 'menu_schedule':  return showSchedule(guest);
    case 'menu_venue':     return showVenues(guest);
    case 'menu_travel':    return showTravel(guest);
    case 'menu_rsvp':      return handleRSVP(guest);
    case 'menu_emergency': return showEmergency(guest);
    case 'menu_faq':       return showFAQs(guest);
    case 'menu_reset':     return resetAndShowLanguage(guest);
    case 'rsvp_yes':       return showGuestCountList(guest);
    case 'rsvp_no':        return confirmRSVPNo(guest);
    case /^count_\d+/:     return confirmRSVPYes(guest, message.list_id);
    default:               return showMainMenu(guest); // Fallback
  }
}
```

---

## 4. Button & List IDs

| Interaction | Type | IDs |
|-------------|------|-----|
| Language Selection | Reply Buttons | `lang_en`, `lang_hi`, `lang_pa` |
| Side Selection | Reply Buttons | `side_groom`, `side_bride` |
| Main Menu | List Message | `menu_schedule`, `menu_venue`, `menu_travel`, `menu_rsvp`, `menu_emergency`, `menu_faq`, `menu_reset` |
| RSVP Attendance | Reply Buttons | `rsvp_yes`, `rsvp_no` |
| RSVP Count | List Message | `count_1`, `count_2`, ... `count_9`, `count_10plus` |

---

## 5. Event Schedule

### 5.1 Groom Side (Shreyas)

| Date | Event | Time |
|------|-------|------|
| 19 Feb | Sangeet & Cocktail | 7:00 PM |
| 20 Feb | Haldi | 12:00 PM |
| 20 Feb | Bhat | 5:00 PM |
| 20 Feb | Mehndi | 7:00 PM |
| 21 Feb | Nicrosi | 10:00 AM |
| 21 Feb | Baraat | 1:00 PM |
| 21 Feb | Phere | 5:00 PM |

### 5.2 Bride Side (Sanjoli)

| Date | Event | Time |
|------|-------|------|
| 19 Feb | Sangeet & Cocktail | 7:00 PM |
| 20 Feb | Haldi | 12:00 PM |
| 20 Feb | Path | 5:00 PM |
| 20 Feb | Mehndi | 7:00 PM |
| 21 Feb | Phere | 5:00 PM |

---

## 6. Message Content (All Languages)

### 6.1 Welcome Message

**Message ID:** `welcome`

```
ENGLISH:
Welcome to Sanjoli & Shreyas's Wedding! 🌸

Please select your language:

[English] [हिंदी] [ਪੰਜਾਬੀ]
```

*(Note: Welcome is always in English since language is not yet known. Buttons are self-identifying.)*

---

### 6.2 Side Selection

**Message ID:** `side_selection`

| Language | Text | Button 1 | Button 2 |
|----------|------|----------|----------|
| English | Thank you! 🙏<br><br>Please select your side: | Groom's Side (Shreyas) | Bride's Side (Sanjoli) |
| Hindi | धन्यवाद! 🙏<br><br>कृपया अपना पक्ष चुनें: | वर पक्ष (श्रेयस) | वधू पक्ष (संजोली) |
| Punjabi | ਧੰਨਵਾਦ! 🙏<br><br>ਕਿਰਪਾ ਕਰਕੇ ਆਪਣਾ ਪੱਖ ਚੁਣੋ: | ਲਾੜੇ ਵਾਲੇ (ਸ਼੍ਰੇਯਸ) | ਲਾੜੀ ਵਾਲੇ (ਸੰਜੋਲੀ) |

---

### 6.3 Welcome Confirmed + Main Menu

**Message ID:** `main_menu`

| Language | Welcome Text | Menu Items |
|----------|--------------|------------|
| English | Welcome! 🎉<br><br>You're viewing info for {SIDE}. | Event Schedule<br>Venue & Directions<br>Travel & Stay<br>RSVP<br>Emergency Contact<br>FAQs<br>Change Language / Side |
| Hindi | स्वागत है! 🎉<br><br>आप {SIDE} की जानकारी देख रहे हैं। | कार्यक्रम सूची<br>स्थान और दिशा-निर्देश<br>यात्रा और ठहराव<br>RSVP<br>आपातकालीन संपर्क<br>अक्सर पूछे जाने वाले प्रश्न<br>भाषा / पक्ष बदलें |
| Punjabi | ਜੀ ਆਇਆਂ ਨੂੰ! 🎉<br><br>ਤੁਸੀਂ {SIDE} ਦੀ ਜਾਣਕਾਰੀ ਦੇਖ ਰਹੇ ਹੋ। | ਸਮਾਗਮ ਸੂਚੀ<br>ਸਥਾਨ ਅਤੇ ਦਿਸ਼ਾ-ਨਿਰਦੇਸ਼<br>ਯਾਤਰਾ ਅਤੇ ਠਹਿਰਾਅ<br>RSVP<br>ਐਮਰਜੈਂਸੀ ਸੰਪਰਕ<br>ਅਕਸਰ ਪੁੱਛੇ ਜਾਣ ਵਾਲੇ ਸਵਾਲ<br>ਭਾਸ਼ਾ / ਪੱਖ ਬਦਲੋ |

**{SIDE} replacements:**
- English: "Groom's Side" / "Bride's Side"
- Hindi: "वर पक्ष (श्रेयस)" / "वधू पक्ष (संजोली)"
- Punjabi: "ਲਾੜੇ ਵਾਲੇ" / "ਲਾੜੀ ਵਾਲੇ"

---

### 6.4 Event Schedule

**Message ID:** `schedule_groom` / `schedule_bride`

| Language | Header | Events (Groom) | Events (Bride) |
|----------|--------|----------------|----------------|
| English | 📅 *Event Schedule*<br>({SIDE}) | • 19 Feb - Sangeet & Cocktail - 7:00 PM<br>• 20 Feb - Haldi - 12:00 PM<br>• 20 Feb - Bhat - 5:00 PM<br>• 20 Feb - Mehndi - 7:00 PM<br>• 21 Feb - Nicrosi - 10:00 AM<br>• 21 Feb - Baraat - 1:00 PM<br>• 21 Feb - Phere - 5:00 PM | • 19 Feb - Sangeet & Cocktail - 7:00 PM<br>• 20 Feb - Haldi - 12:00 PM<br>• 20 Feb - Path - 5:00 PM<br>• 20 Feb - Mehndi - 7:00 PM<br>• 21 Feb - Phere - 5:00 PM |
| Hindi | 📅 *कार्यक्रम सूची*<br>({SIDE}) | • 19 फरवरी - संगीत एवं कॉकटेल - शाम 7 बजे<br>• 20 फरवरी - हल्दी - दोपहर 12 बजे<br>• 20 फरवरी - भात - शाम 5 बजे<br>• 20 फरवरी - मेहंदी - शाम 7 बजे<br>• 21 फरवरी - निकासी - सुबह 10 बजे<br>• 21 फरवरी - बारात - दोपहर 1 बजे<br>• 21 फरवरी - फेरे - शाम 5 बजे | • 19 फरवरी - संगीत एवं कॉकटेल - शाम 7 बजे<br>• 20 फरवरी - हल्दी - दोपहर 12 बजे<br>• 20 फरवरी - पाठ - शाम 5 बजे<br>• 20 फरवरी - मेहंदी - शाम 7 बजे<br>• 21 फरवरी - फेरे - शाम 5 बजे |
| Punjabi | 📅 *ਸਮਾਗਮ ਸੂਚੀ*<br>({SIDE}) | *(Same events in Punjabi)* | *(Same events in Punjabi)* |

---

### 6.5 Venue & Directions

**Message ID:** `venues`

Template per event:
```
📍 *{EVENT_NAME}*
📅 {DATE}, {TIME}
🏠 {VENUE_NAME}
📫 {ADDRESS}
🗺️ {GOOGLE_MAPS_LINK}
👗 {DRESS_CODE}
🅿️ {PARKING_INFO}
```

| Language | Labels |
|----------|--------|
| English | Venue, Address, Dress Code, Parking |
| Hindi | स्थान, पता, ड्रेस कोड, पार्किंग |
| Punjabi | ਸਥਾਨ, ਪਤਾ, ਡ੍ਰੈਸ ਕੋਡ, ਪਾਰਕਿੰਗ |

---

### 6.6 Travel & Stay

**Message ID:** `travel`

| Language | Content |
|----------|---------|
| English | 🏨 *Hotel Accommodation*<br>{HOTEL_NAME}<br>{ADDRESS}<br>{GOOGLE_MAPS}<br>Check-in: 2 PM \| Check-out: 11 AM<br><br>🚗 *Getting There*<br>From Airport: ~45 min by cab (Uber/Ola available)<br>Parking: Available at venue<br><br>📞 *Travel Coordinator*<br>{NAME}: {PHONE} |
| Hindi | 🏨 *होटल आवास*<br>{HOTEL_NAME}<br>{पता}<br>{GOOGLE_MAPS}<br>चेक-इन: दोपहर 2 बजे \| चेक-आउट: सुबह 11 बजे<br><br>🚗 *यहाँ कैसे पहुँचें*<br>हवाई अड्डे से: कैब से ~45 मिनट (Uber/Ola उपलब्ध)<br>पार्किंग: स्थल पर उपलब्ध<br><br>📞 *यात्रा समन्वयक*<br>{NAME}: {PHONE} |
| Punjabi | 🏨 *ਹੋਟਲ ਰਿਹਾਇਸ਼*<br>... |

---

### 6.7 RSVP Flow

**Message ID:** `rsvp_ask`

| Language | Question | Button Yes | Button No |
|----------|----------|------------|-----------|
| English | Will you be attending the wedding? 💒 | Yes, I'll be there! | Sorry, can't make it |
| Hindi | क्या आप विवाह में शामिल हो रहे हैं? 💒 | हाँ, आ रहे हैं | नहीं आ पाएंगे |
| Punjabi | ਕੀ ਤੁਸੀਂ ਵਿਆਹ ਵਿੱਚ ਸ਼ਾਮਲ ਹੋ ਰਹੇ ਹੋ? 💒 | ਹਾਂ, ਆ ਰਹੇ ਹਾਂ | ਨਹੀਂ ਆ ਸਕਦੇ |

**Message ID:** `rsvp_count`

| Language | Question | List Items |
|----------|----------|------------|
| English | Wonderful! 🎊<br><br>How many guests including yourself? | 1 guest, 2 guests, ... 9 guests, 10+ (we'll contact you) |
| Hindi | बहुत अच्छा! 🎊<br><br>आप सहित कुल कितने अतिथि आ रहे हैं? | 1 अतिथि, 2 अतिथि, ... 9 अतिथि, 10+ (हम संपर्क करेंगे) |
| Punjabi | ਬਹੁਤ ਵਧੀਆ! 🎊<br><br>ਤੁਹਾਡੇ ਸਮੇਤ ਕੁੱਲ ਕਿੰਨੇ ਮਹਿਮਾਨ ਆ ਰਹੇ ਹਨ? | 1 ਮਹਿਮਾਨ, 2 ਮਹਿਮਾਨ, ... |

**Message ID:** `rsvp_confirmed_yes`

| Language | Confirmation |
|----------|--------------|
| English | Thank you! Your RSVP has been recorded. ✅<br><br>📋 *RSVP Summary*<br>Status: Attending<br>Guests: {COUNT}<br><br>We look forward to celebrating with you! 🎉 |
| Hindi | धन्यवाद! आपका RSVP दर्ज हो गया। ✅<br><br>📋 *RSVP सारांश*<br>स्थिति: उपस्थित<br>अतिथि: {COUNT}<br><br>हम आपसे मिलने के लिए उत्सुक हैं! 🎉 |
| Punjabi | ਧੰਨਵਾਦ! ਤੁਹਾਡਾ RSVP ਦਰਜ ਹੋ ਗਿਆ। ✅<br><br>📋 *RSVP ਸਾਰ*<br>ਸਥਿਤੀ: ਹਾਜ਼ਰ<br>ਮਹਿਮਾਨ: {COUNT}<br><br>ਅਸੀਂ ਤੁਹਾਨੂੰ ਮਿਲਣ ਲਈ ਉਤਸੁਕ ਹਾਂ! 🎉 |

**Message ID:** `rsvp_confirmed_no`

| Language | Confirmation |
|----------|--------------|
| English | Thank you for letting us know. We'll miss you! 💐<br><br>Your response has been recorded. |
| Hindi | हमें बताने के लिए धन्यवाद। हम आपको याद करेंगे! 💐<br><br>आपका उत्तर दर्ज हो गया है। |
| Punjabi | ਸਾਨੂੰ ਦੱਸਣ ਲਈ ਧੰਨਵਾਦ। ਅਸੀਂ ਤੁਹਾਨੂੰ ਯਾਦ ਕਰਾਂਗੇ! 💐 |

---

### 6.8 Emergency Contact

**Message ID:** `emergency`

| Language | Content |
|----------|---------|
| English | 🆘 *Emergency Contacts*<br><br>📞 Family Coordinator<br>{NAME}: {PHONE}<br><br>📞 Travel/Hotel Help<br>{NAME}: {PHONE} |
| Hindi | 🆘 *आपातकालीन संपर्क*<br><br>📞 परिवार समन्वयक<br>{NAME}: {PHONE}<br><br>📞 यात्रा/होटल सहायता<br>{NAME}: {PHONE} |
| Punjabi | 🆘 *ਐਮਰਜੈਂਸੀ ਸੰਪਰਕ*<br><br>📞 ਪਰਿਵਾਰਕ ਤਾਲਮੇਲਕਾਰ<br>{NAME}: {PHONE} |

---

### 6.9 FAQs

**Message ID:** `faqs`

| Topic | English | Hindi |
|-------|---------|-------|
| Dress Code | Each event has a specific dress code and color theme. Please follow the shared guidelines. | प्रत्येक कार्यक्रम के लिए निर्धारित ड्रेस कोड का पालन करें। |
| Gifts | A wedding gift registry has been created for those who wish to gift. | विवाह उपहार सूची उपलब्ध है। |
| Children | Parents are requested to ensure close supervision of children during all events. | बच्चों की उचित देखरेख सुनिश्चित करें। |

---

### 6.10 Fallback

**Message ID:** `fallback`

| Language | Text |
|----------|------|
| English | Please select an option from the menu: |
| Hindi | कृपया मेनू से विकल्प चुनें: |
| Punjabi | ਕਿਰਪਾ ਕਰਕੇ ਮੇਨੂ ਤੋਂ ਵਿਕਲਪ ਚੁਣੋ: |

---

### 6.11 Welcome Back (Returning Guest)

**Message ID:** `welcome_back`

| Language | Text |
|----------|------|
| English | Welcome back! 👋 |
| Hindi | फिर से स्वागत है! 👋 |
| Punjabi | ਮੁੜ ਸਵਾਗਤ ਹੈ! 👋 |

---

## 7. WhatsApp Message Types

### 7.1 Reply Buttons (max 3)

Used for:
- Language selection (3 buttons)
- Side selection (2 buttons)
- RSVP yes/no (2 buttons)

```json
{
  "type": "button",
  "body": { "text": "Question text here" },
  "action": {
    "buttons": [
      { "type": "reply", "reply": { "id": "lang_en", "title": "English" } },
      { "type": "reply", "reply": { "id": "lang_hi", "title": "हिंदी" } },
      { "type": "reply", "reply": { "id": "lang_pa", "title": "ਪੰਜਾਬੀ" } }
    ]
  }
}
```

### 7.2 List Messages (max 10 items)

Used for:
- Main menu (7 items)
- RSVP guest count (10 items)

```json
{
  "type": "list",
  "body": { "text": "How can we help?" },
  "action": {
    "button": "Main Menu",
    "sections": [{
      "rows": [
        { "id": "menu_schedule", "title": "Event Schedule" },
        { "id": "menu_venue", "title": "Venue & Directions" },
        { "id": "menu_travel", "title": "Travel & Stay" },
        { "id": "menu_rsvp", "title": "RSVP" },
        { "id": "menu_emergency", "title": "Emergency Contact" },
        { "id": "menu_faq", "title": "FAQs" },
        { "id": "menu_reset", "title": "Change Language / Side" }
      ]
    }]
  }
}
```

---

## 8. Implementation Summary

### 8.1 What to Build

| Feature | Implementation |
|---------|----------------|
| Language selection | 3 reply buttons (self-identifying scripts) |
| Side selection | 2 reply buttons (in selected language) |
| Main menu | List message with 7 options |
| Event schedule | Text message filtered by `user_side` |
| Venues | Text message with all venue details |
| Travel & Stay | Single text message with all info |
| RSVP | Reply buttons (yes/no) → List (count) → confirmation |
| Emergency | Text message with contacts |
| FAQs | Text message with common answers |
| Change Language/Side | Reset fields, restart onboarding |
| Fallback | Show main menu |

### 8.2 What NOT to Build

| Feature | Reason |
|---------|--------|
| State machine | Unnecessary - null checks on fields are sufficient |
| Keyword detection | Everything is button/list taps |
| Free text parsing | Use lists for all input (no validation needed) |
| Venue sub-menus | Show all venues in one message |
| Exit option | Bot is always available |
| Automated reminders | Use broadcast feature instead |

### 8.3 Effort Estimate

| Phase | Scope | Effort |
|-------|-------|--------|
| Phase 1 | Language + Side selection, Interactive menu, Side-specific schedule | 1.5 days |
| Phase 2 | RSVP with buttons + count list | 0.5 day |
| Phase 3 | Travel info, FAQs, content localization | 1 day |
| **Total** | | **~3 days** |

**Plus:** Content translation work (can be done by family in spreadsheet)
