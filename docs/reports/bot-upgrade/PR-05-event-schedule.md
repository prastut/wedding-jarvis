# PR-05: Event Schedule (Side-Filtered)

## Summary

Implemented a proper repository layer for event schedule functionality. Created a new `events.ts` repository with `getEventsBySide()` function that fetches events filtered by the guest's side (GROOM, BRIDE, or BOTH). Refactored the `sendEventSchedule()` function in botRouter to use this repository instead of direct database queries, improving code organization and separation of concerns.

## Files Changed

- `src/repositories/events.ts` - **NEW** - Events repository with:
  - `EventWithVenue` type for events joined with venue data
  - `getEventsBySide(side)` - Fetches side-filtered events with venue names
  - `getAllEvents()` - Fetches all events (for future admin panel use)

- `src/services/botRouter.ts` - Refactored `sendEventSchedule()`:
  - Removed direct Supabase query
  - Now uses `getEventsBySide()` from events repository
  - Added proper try/catch error handling
  - Updated imports to use `EventWithVenue` type

## Key Decisions

1. **Repository Pattern**: Created a dedicated events repository following the existing pattern from `guests.ts`. This separates data access logic from business logic in the bot router.

2. **EventWithVenue Type**: Defined a custom type that extends `Event` with optional venue data, providing proper TypeScript typing for joined queries.

3. **Error Handling**: Wrapped the event fetch in a try/catch block with proper logging, ensuring graceful error handling if the database query fails.

4. **getAllEvents() Helper**: Added for future admin panel use (PR-14), anticipating the need to list all events regardless of side.

## Testing Notes

### Manual Testing Flow

1. **Groom Side Guest:**
   - Complete onboarding selecting "Groom's Side"
   - Tap "Event Schedule" from menu
   - Verify: See groom-specific events + shared (BOTH) events
   - Verify: Events displayed in user's language
   - Verify: Back to Menu button present

2. **Bride Side Guest:**
   - Complete onboarding selecting "Bride's Side"
   - Tap "Event Schedule" from menu
   - Verify: See bride-specific events + shared (BOTH) events
   - Verify: Different events than groom side for side-specific items

3. **Language Verification:**
   - Switch language to Hindi (via reset flow when implemented)
   - Verify: Event names shown in Hindi (name_hi column)
   - Verify: Dates and times formatted for Hindi locale

### Test Commands

```bash
npm run build    # TypeScript compiles successfully
npm run dev      # Start dev server and test via WhatsApp
```

## Dependencies for Future PRs

- **PR-12 (Admin)**: `getAllEvents()` ready for admin event listing
- **PR-14 (Content Management)**: Repository provides foundation for event CRUD operations

## Known Limitations

1. **Venue Name Only**: Currently only fetches the venue name in the join. Full venue details are fetched separately via the Venue menu option.

2. **No Event CRUD**: Repository only has read operations. Write operations will be added in PR-14 when admin content management is implemented.

3. **Cache Key Includes Side**: Events are cached per side to ensure guests see only their relevant events. Cache expires after 5 minutes.

## Acceptance Criteria Checklist

- [x] Groom side sees groom + shared events
- [x] Bride side sees bride + shared events
- [x] Event names in user's language (with English fallback)
- [x] Sorted by sort_order
- [x] Includes "Back to Menu" button
- [x] TypeScript compiles without errors
