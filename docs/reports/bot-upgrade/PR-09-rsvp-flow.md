# PR-09: RSVP Complete Flow

## Summary

Implemented the complete RSVP flow for wedding guests. First-time guests see Yes/No attendance buttons. If they select "Yes", they're shown a list to select their guest count (1-9 or 10+). Returning guests see their current RSVP status with an option to update. All messages are displayed in the guest's preferred language, and special messaging is shown for large groups (10+ guests).

## Files Changed

- `src/repositories/guests.ts` - Added two new functions:
  - `updateGuestRsvpYes(guestId, guestCount)` - Save RSVP as attending with guest count
  - `updateGuestRsvpNo(guestId)` - Save RSVP as not attending (clears guest count)

- `src/services/botRouter.ts` - Major additions for RSVP flow:
  - Updated imports to include RSVP and Count button ID helpers and constants
  - Added RSVP button handling in `handleOnboardedState()` (isRsvpId, isCountId)
  - Updated `MENU_IDS.RSVP` case to call `handleRsvp()` instead of stub
  - Added `handleRsvp()` - Entry point that routes to prompt or status
  - Added `handleRsvpButton()` - Handles rsvp_yes, rsvp_no, rsvp_update, rsvp_back
  - Added `handleCountSelection()` - Processes count selection and saves RSVP
  - Added `showRsvpPrompt()` - Displays Yes/No attendance buttons
  - Added `showRsvpStatus()` - Displays current status with Update/Back buttons
  - Added `showGuestCountList()` - Displays 1-10+ guest count selection list

## Key Decisions

1. **Stateless Flow**: The RSVP flow is completely stateless - we determine what to show based on the guest's `rsvp_status` field. No additional state columns needed.

2. **10+ Guest Handling**: When a guest selects "10+" from the count list, we store `rsvp_guest_count = 10` as specified in the spec. The confirmation message indicates the team will follow up for large groups.

3. **Update Flow**: Returning guests (with existing RSVP) can update their response by tapping "Update RSVP", which takes them directly to the count list. This allows changing from "No" to "Yes" or updating the guest count.

4. **Button ID Categories**: Leveraged existing button ID helpers (`isRsvpId`, `isCountId`, `extractCount`) from PR-02 to cleanly route RSVP and count button presses.

5. **Clear Logging**: Added `[RSVP]` prefixed log messages for all RSVP operations to aid debugging.

## RSVP Flow Diagram

```
                    ┌─────────────────┐
                    │ User taps RSVP  │
                    └────────┬────────┘
                             │
                             ▼
                ┌────────────────────────┐
                │  rsvp_status = null?   │
                └────────────┬───────────┘
                             │
             ┌───────────────┴───────────────┐
             │ YES                           │ NO
             ▼                               ▼
  ┌─────────────────────┐     ┌──────────────────────────┐
  │  Show Yes/No        │     │  Show current status +   │
  │  attendance buttons │     │  Update/Back buttons     │
  └──────────┬──────────┘     └────────────┬─────────────┘
             │                              │
      ┌──────┴──────┐           ┌───────────┴───────────┐
      ▼             ▼           ▼                       ▼
┌──────────┐  ┌──────────┐ ┌──────────┐          ┌──────────┐
│  rsvp_no │  │ rsvp_yes │ │rsvp_update│          │rsvp_back │
└────┬─────┘  └────┬─────┘ └────┬──────┘          └────┬─────┘
     │             │            │                      │
     ▼             │            │                      ▼
┌──────────┐       └─────┬──────┘               ┌──────────┐
│ Save NO  │             ▼                      │ Main Menu│
│ Show     │    ┌───────────────────┐           └──────────┘
│ thank you│    │ Show count list   │
└──────────┘    │ (1-9, 10+)        │
                └─────────┬─────────┘
                          │
                          ▼ User selects count
                ┌───────────────────┐
                │ Save YES + count  │
                │ Show thank you    │
                │ (special msg for  │
                │  10+ guests)      │
                └───────────────────┘
```

## i18n Keys Used

| Key | Purpose |
|-----|---------|
| `rsvp.prompt` | "Will you be attending?" prompt |
| `rsvp.button.yes` | Yes button text |
| `rsvp.button.no` | No button text |
| `rsvp.countPrompt` | "How many guests..." prompt |
| `rsvp.countButton` | "Select Count" button text |
| `rsvp.count.10plus` | "10+ guests" list item text |
| `rsvp.confirmed.yes` | Status message when attending with `{count}` placeholder |
| `rsvp.confirmed.no` | Status message when not attending |
| `rsvp.thankYou.yes` | Thank you message after confirming attendance |
| `rsvp.thankYou.no` | Thank you message after declining |
| `rsvp.thankYou.10plus` | Special thank you for large groups |
| `rsvp.button.update` | "Update RSVP" button text |
| `rsvp.button.back` | "Back to Menu" button text |

## Testing Notes

### Manual Testing Flow

1. **First-time RSVP (Yes):**
   - Onboard as a new guest
   - Select "RSVP" from main menu
   - See Yes/No buttons → tap "Yes"
   - See count list (1-10+) → select a number
   - See thank you confirmation + Back to Menu button

2. **First-time RSVP (No):**
   - Onboard as a new guest
   - Select "RSVP" from main menu
   - See Yes/No buttons → tap "No"
   - See "We'll miss you" message + Back to Menu button

3. **Returning Guest (Update):**
   - RSVP first as above
   - Select "RSVP" again from menu
   - See current status (attending/not attending, guest count)
   - Tap "Update RSVP" → see count list
   - Select new count → see thank you

4. **10+ Guests:**
   - Go through RSVP flow
   - Select "10+ guests" from count list
   - See special message about team follow-up

5. **Multi-language:**
   - Test with Hindi and Punjabi language selections
   - Verify all RSVP messages in correct language

### Database Verification

```sql
-- Check RSVP status after testing
SELECT phone_number, rsvp_status, rsvp_guest_count
FROM guests
WHERE phone_number = 'YOUR_TEST_NUMBER';
```

## Dependencies for Future PRs

- **PR-10 (Reset Flow)**: Reset already preserves RSVP data - no changes needed
- **PR-11 (Post-Wedding)**: May want to hide RSVP option after wedding
- **PR-12 (Admin)**: Will use `rsvp_status` and `rsvp_guest_count` for filtering and stats

## Known Limitations

1. **No RSVP Deadline**: Currently no cutoff date for RSVP. Could be added via system_settings if needed.

2. **No Re-RSVP from No→No**: If a guest already declined, tapping "Update RSVP" shows the count list (assumes they want to change to Yes). A guest changing their mind to decline would need to go through count selection first, then later update again.

3. **No Notification on 10+**: The spec mentions "we'll be in touch" but there's no automatic notification to coordinators. This would need to be added if required.

4. **Guest Count Display**: For returning guests who selected 10+, we display "10+" in the status. The database stores this as integer 10.

## Acceptance Criteria Checklist

- [x] First-time RSVP shows Yes/No buttons
- [x] Yes leads to count list (1-10+)
- [x] No saves status and shows confirmation
- [x] Returning guests see current status
- [x] Update allows changing RSVP (shows count list)
- [x] 10+ shows "we'll be in touch" message
- [x] All messages in user's language
- [x] TypeScript compiles without errors
