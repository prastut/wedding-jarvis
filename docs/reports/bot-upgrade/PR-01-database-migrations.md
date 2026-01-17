# PR-01: Database Migrations + Types

## Summary

Added database migrations and TypeScript types for the multi-language, side selection, and RSVP features. This includes new columns for guest preferences (language, side, RSVP status/count), translation columns for events/venues/FAQs (Hindi and Punjabi), and side-specific filtering for events and coordinator contacts.

## Files Changed

- `src/db/migrations/005_multilang_rsvp.sql` - Created migration adding all new columns and indexes for multi-language and RSVP support
- `src/types/index.ts` - Updated TypeScript interfaces with new fields and added type aliases for language, side, and RSVP status

## Key Decisions

1. **Type Aliases**: Created separate type aliases (`UserLanguage`, `UserSide`, `ContentSide`, `RsvpStatus`) rather than inline unions for better reusability across the codebase
2. **Nullable Translations**: All translation fields (`_hi`, `_pa`) are nullable to allow graceful fallback to English when translations aren't available
3. **ContentSide vs UserSide**: Separate types for guest side selection (GROOM/BRIDE only) vs content filtering (GROOM/BRIDE/BOTH) to enforce correct usage
4. **Indexes**: Added indexes on frequently filtered columns (user_language, user_side, rsvp_status, side) for query performance

## Testing Notes

Run migration on Supabase:
```bash
# Via Supabase dashboard or CLI
psql -f src/db/migrations/005_multilang_rsvp.sql
```

Verify TypeScript compiles:
```bash
npm run build
```

## Dependencies for Future PRs

- **PR-02**: Can proceed in parallel - no dependencies on types from this PR
- **PR-03**: Will use the Guest type with new fields (user_language, user_side)
- **PR-04**: Will use translation fields for i18n system
- **PR-05-08**: Will use side filtering and translation fields
- **PR-09**: Will use rsvp_status and rsvp_guest_count fields
- **PR-12**: Will use new Guest columns for admin panel filters

## Known Limitations

- Migration uses `IF NOT EXISTS` for idempotency but doesn't handle column type changes
- No data migration for existing guests (new columns will be null until user interacts)
- Hindi/Punjabi name columns for events not added to venues table (events are typically what get translated names)

## Database Schema Summary

### New Guest Columns
| Column | Type | Values |
|--------|------|--------|
| user_language | VARCHAR(2) | EN, HI, PA |
| user_side | VARCHAR(10) | GROOM, BRIDE |
| rsvp_status | VARCHAR(10) | YES, NO |
| rsvp_guest_count | INTEGER | 1-10 |

### New Event Columns
| Column | Type | Notes |
|--------|------|-------|
| name_hi | VARCHAR(255) | Hindi translation |
| name_pa | VARCHAR(255) | Punjabi translation |
| dress_code_hi | VARCHAR(255) | Hindi translation |
| dress_code_pa | VARCHAR(255) | Punjabi translation |
| side | VARCHAR(10) | GROOM, BRIDE, or BOTH |

### New Venue Columns
| Column | Type | Notes |
|--------|------|-------|
| address_hi | TEXT | Hindi translation |
| address_pa | TEXT | Punjabi translation |
| parking_info_hi | TEXT | Hindi translation |
| parking_info_pa | TEXT | Punjabi translation |

### New FAQ Columns
| Column | Type | Notes |
|--------|------|-------|
| question_hi | TEXT | Hindi translation |
| question_pa | TEXT | Punjabi translation |
| answer_hi | TEXT | Hindi translation |
| answer_pa | TEXT | Punjabi translation |

### New Coordinator Contact Columns
| Column | Type | Notes |
|--------|------|-------|
| side | VARCHAR(10) | GROOM, BRIDE, or BOTH |
