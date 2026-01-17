# PR-03: Language → Side → Menu Flow

## Summary

Implemented the complete guest onboarding flow for the Wedding WhatsApp Concierge. New guests are now guided through language selection (English/Hindi/Punjabi), then side selection (Groom's/Bride's family), and finally see an 8-item interactive menu list. All selections are saved to the database and the bot responds in the guest's chosen language.

## Files Changed

- `src/services/botRouter.ts` - Major rewrite implementing the state-machine based onboarding flow:
  - `handleMessage()` now accepts `Guest` object instead of phone number
  - State machine routes based on `user_language` and `user_side` null checks
  - `showLanguageSelection()` - Sends 3-button language picker
  - `showSideSelection()` - Sends 2-button side picker (in user's language)
  - `showMainMenu()` - Sends 8-item list message (all menu options)
  - All content fetchers updated to use guest's language for translations
  - Side-filtered event schedule and coordinator contacts
  - Fallback handler for unknown inputs

- `src/repositories/guests.ts` - Added guest update methods:
  - `updateGuestLanguage(guestId, language)` - Save language preference
  - `updateGuestSide(guestId, side)` - Save side preference
  - `updateGuestOptIn(phoneNumber, optedIn)` - Refactored opt-in update

- `src/routes/webhook.ts` - Updated to pass `Guest` object to `handleMessage()` instead of just phone number

## Key Decisions

1. **Guest Object Passing**: Changed `handleMessage()` to accept the full `Guest` object instead of just phone number. This allows the bot router to make decisions based on guest state without additional database queries.

2. **State Machine Pattern**: Used simple null checks on `guest.user_language` and `guest.user_side` to determine onboarding state, as specified in the design. No additional state columns needed.

3. **Direct Interactive Message Sending**: Interactive messages (language/side/menu) are sent directly from the bot router and return `null` to indicate no text response needed. Text responses are returned as strings for the webhook to send.

4. **Language-Aware Content**: All content fetchers now accept the `Guest` object and select appropriate translations based on `user_language`, falling back to English if translations are missing.

5. **Side-Filtered Content**: Event schedule, dress codes, and coordinator contacts are now filtered by the guest's side (showing their side + BOTH events).

6. **Legacy Support**: Numeric text commands (1-5) and text commands (MENU, HI, HELLO) still work for onboarded guests, maintaining backwards compatibility.

## Testing Notes

### Manual Testing Flow

1. **New Guest Onboarding:**
   - Send any message → Should see language selection (3 buttons)
   - Tap "English" → Should see side selection (2 buttons in English)
   - Tap "Groom's Side" → Should see main menu (8-item list) + welcome message

2. **Returning Guest:**
   - Send "hi" or "0" → Should see main menu (no onboarding prompts)
   - Menu items should respond in guest's saved language

3. **STOP/START:**
   - Send "STOP" → Unsubscribe message (always English)
   - Send "START" → Resume at appropriate onboarding step or menu

4. **Side-Specific Content:**
   - Groom side: See groom-only + shared events
   - Bride side: See bride-only + shared events

### Test Commands

```bash
# Build and start dev server
npm run build
npm run dev

# The bot will respond to WhatsApp messages automatically
```

## Dependencies for Future PRs

- **PR-04 (i18n)**: Will refactor inline translation objects into a proper i18n system
- **PR-05**: Event schedule handler is ready but needs PR-04 for complete translations
- **PR-06**: Venue handler is ready, using translation fields from PR-01
- **PR-07**: Emergency contacts handler is ready with side filtering
- **PR-08**: FAQs handler is ready, Travel & Gifts return stub responses
- **PR-09**: RSVP returns stub response, needs full implementation
- **PR-10**: Reset returns stub response, needs implementation

## Known Limitations

1. **Inline Translations**: All translations are currently inline in `botRouter.ts`. PR-04 will extract these into a proper i18n system for better maintainability.

2. **Stub Features**: The following menu items return stub responses pending future PRs:
   - Travel & Stay (PR-08)
   - RSVP (PR-09)
   - Gift Registry (PR-08)
   - Reset/Change Language (PR-10)

3. **No i18n for Content Fetchers**: Content fetcher headers and labels are hardcoded per language. PR-04 will centralize these.

4. **Cache Keys**: Cache keys include language and side, but cache is cleared after 5 minutes. Fine for current scale.

## State Machine Reference

```
┌─────────────────────────────────────────────────────────────┐
│ user_language = null → Show Language Selection (3 buttons)  │
│ user_side = null     → Show Side Selection (2 buttons)      │
│ Both set             → Show Main Menu (8-item list)         │
└─────────────────────────────────────────────────────────────┘
```

## Menu Items Implemented

| Menu Item | Status | Handler |
|-----------|--------|---------|
| Event Schedule | Working | `getEventSchedule()` - side filtered |
| Venue & Directions | Working | `getVenuesAndDirections()` - translated |
| Travel & Stay | Stub | Returns "coming soon" message |
| RSVP | Stub | Returns "coming soon" message |
| Emergency Contact | Working | `getCoordinatorContact()` - side filtered |
| FAQs | Working | `getFAQs()` - translated |
| Gift Registry | Stub | Returns "coming soon" message |
| Change Language/Side | Stub | Returns "coming soon" message |
