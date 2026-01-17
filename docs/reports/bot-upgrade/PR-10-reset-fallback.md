# PR-10: Reset Flow + Fallback Handler

## Summary

Implemented the reset flow and improved fallback handling for the Wedding WhatsApp Concierge. When guests select "Change Language/Side" from the menu, their language and side preferences are cleared while preserving their RSVP data, then they are shown the language selection to restart onboarding. Unknown inputs (free text, unrecognized commands) now show the main menu with a "please select" message integrated into the menu body.

## Files Changed

- `src/repositories/guests.ts` - Added `resetGuestPreferences(guestId)` function that clears `user_language` and `user_side` while preserving RSVP data
- `src/services/botRouter.ts` - Added `handleReset()` function and updated fallback handling to include the fallback message in the menu body instead of sending a separate text message

## Key Decisions

1. **RSVP Preservation**: The `resetGuestPreferences` function explicitly only clears `user_language` and `user_side`, leaving `rsvp_status` and `rsvp_guest_count` untouched. This ensures guests don't lose their RSVP when they want to change their language preference.

2. **Combined Reset Message**: After resetting, the bot sends a single interactive message containing:
   - The reset confirmation in the guest's previous language
   - The welcome title (always in English since language is now unknown)
   - Language selection buttons
   This provides a smooth transition without multiple message fragments.

3. **Integrated Fallback Message**: Changed the fallback handling to include the "I didn't understand that" message as part of the menu body (using the existing `welcomePrefix` parameter) instead of sending it as a separate text message. This ensures messages arrive in the correct order and reduces message spam.

4. **Graceful Unknown Input Handling**: All unrecognized inputs (free text, random numbers, emojis) show the menu with the fallback message, providing clear guidance to guests.

## Testing Notes

### Manual Testing Flow

1. **Reset Flow:**
   - Complete onboarding (select language → select side)
   - From main menu, tap "Change Language/Side"
   - Verify: See confirmation message + language selection
   - Select new language → verify side selection shown
   - Select new side → verify menu shown
   - Tap RSVP → verify previous RSVP data still exists

2. **Fallback Handler:**
   - Onboard completely, then send random text like "hello"
   - Verify: Menu shown with "I didn't understand that" message
   - Send a number that's not in legacy commands (e.g., "99")
   - Verify: Same behavior - menu with fallback message

3. **Non-text Messages:**
   - Send an image or sticker to the bot
   - Verify: Menu shown (webhook treats as "MENU" command)

### Test Commands

```bash
npm run build    # TypeScript compiles successfully
npm run dev      # Start dev server and test via WhatsApp
```

## Implementation Details

### Reset Flow

```
Guest taps "Change Language/Side"
         │
         ▼
┌──────────────────────────────────────┐
│ resetGuestPreferences(guest.id)      │
│   - user_language = null             │
│   - user_side = null                 │
│   - RSVP preserved                   │
└──────────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────┐
│ Send combined message:               │
│   "[Reset confirmation in prev lang] │
│                                      │
│   Welcome to the wedding! 🌸         │
│                                      │
│   Please select your language:"      │
│                                      │
│   [English] [हिंदी] [ਪੰਜਾਬੀ]         │
└──────────────────────────────────────┘
         │
         ▼
   Guest selects language → continues normal onboarding
```

### Fallback Handling

```
Guest sends unknown input
         │
         ▼
┌──────────────────────────────────────┐
│ showMainMenu with fallback prefix:   │
│                                      │
│ "I didn't understand that.           │
│  Please select an option:            │
│                                      │
│  How can I help you today?"          │
│                                      │
│  [View Options] → 8 menu items       │
└──────────────────────────────────────┘
```

## Dependencies for Future PRs

- **PR-11 (Post-Wedding)**: May want to disable reset after wedding
- **PR-12 (Admin)**: Could add reset count to guest stats

## Known Limitations

1. **Reset Confirmation Language**: The confirmation message is shown in the guest's previous language before reset. If the guest didn't understand that language (hence wanting to change), they may not understand the confirmation. However, the language buttons are self-identifying so navigation remains clear.

2. **No Undo**: There's no way to undo a reset. The guest must go through onboarding again.

3. **Cache Not Cleared**: After reset, cached content may still be keyed by the old language/side until TTL expires (5 minutes).

## Acceptance Criteria Checklist

- [x] Reset clears language + side
- [x] RSVP preserved after reset
- [x] Language selection shown after reset
- [x] Unknown inputs show fallback + menu
- [x] Free text handled gracefully
- [x] TypeScript compiles without errors
