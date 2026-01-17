# PR-12: Admin Guest Columns + Filters + Stats

## Summary

Enhanced the admin panel with comprehensive guest management features. The guest list now displays Language, Side, RSVP Status, and Guest Count columns with color-coded badges. Added filters for Side (Groom/Bride/Not Onboarded), Language (EN/HI/PA/Not Set), and RSVP Status (Attending/Not Attending/Pending). The dashboard now shows detailed statistics including onboarding percentage, RSVP breakdown, total headcount, and by-side/by-language distribution.

## Files Changed

### Backend

- `src/repositories/guests.ts` - Added `GuestFilters` interface with new filter options (language, side, rsvpStatus). Updated `getAllGuests()` to support filtering by language (including "not_set"), side (including "not_set"), and RSVP status (including "pending").

- `src/repositories/stats.ts` - Extended `DashboardStats` interface with new stat categories. Updated `getDashboardStats()` to fetch:
  - Onboarded count (guests with both language and side set)
  - RSVP breakdown (attending, not attending, pending)
  - Total headcount (sum of rsvp_guest_count for attending guests)
  - By-side breakdown (groom, bride, not onboarded)
  - By-language breakdown (english, hindi, punjabi, not set)

- `src/routes/admin/guests.ts` - Added new query parameter parsing for `language`, `side`, and `rsvp` filters. Updated both the guest list endpoint and CSV export endpoint to support all filters.

### Admin Panel

- `admin-panel/src/api/client.ts` - Added new types (`UserLanguage`, `UserSide`, `RsvpStatus`, `GuestFilters`). Extended `Stats` interface with new stat categories. Extended `Guest` interface with new fields. Updated `getGuests()` and `exportGuests()` methods to support new filters.

- `admin-panel/src/pages/Guests.tsx` - Complete rewrite with:
  - New columns: Language, Side, RSVP
  - Four new filter dropdowns (Status, Language, Side, RSVP)
  - Color-coded badges for RSVP status (green=attending, red=not attending, orange=pending)
  - Export respects current filter selections
  - Used `useCallback` for proper React hook dependency management

- `admin-panel/src/pages/Dashboard.tsx` - Added new stat cards:
  - "Onboarded" card with percentage
  - "RSVP Status" card (highlighted) with breakdown
  - "Total Headcount" card (highlighted)
  - "By Side" card with breakdown rows
  - "By Language" card with breakdown rows

- `admin-panel/src/App.css` - Added styles for new dashboard components:
  - `.stat-subtitle` for subtitle text
  - `.stat-card.highlight` for highlighted cards with gradient background
  - `.stat-breakdown` and `.breakdown-row` for breakdown displays
  - `.stat-detail .neutral` for warning-colored text

## Key Decisions

1. **Filter Values**: Used `'not_set'` as a special filter value to find guests without language/side set, and `'pending'` for guests without RSVP response. This allows admins to easily identify guests who haven't completed onboarding or RSVP.

2. **Badge Colors**: RSVP badges use intuitive colors - green for attending, red for not attending, orange for pending. This provides quick visual scanning of guest RSVP status.

3. **Headcount Calculation**: Total headcount is calculated by summing `rsvp_guest_count` for all guests with `rsvp_status = 'YES'`. This gives the actual expected attendance number.

4. **Export with Filters**: CSV export respects all active filters, allowing admins to export specific subsets of guests (e.g., "all Groom side guests who haven't RSVP'd").

5. **Highlighted Stats**: RSVP Status and Total Headcount cards use a highlight style (gradient background) since these are the most important stats for wedding planning.

## Testing Notes

### Manual Testing

1. **Dashboard Stats:**
   - Visit `/` (Dashboard)
   - Verify all stat cards display with correct values
   - Onboarded percentage should reflect guests with both language and side set
   - RSVP counts should match database
   - Total headcount should equal sum of guest_count for attending guests

2. **Guest List Columns:**
   - Visit `/guests`
   - Verify new columns: Language, Side, RSVP
   - Verify badges show correct colors

3. **Guest Filters:**
   - Test each filter dropdown individually
   - Test filter combinations (e.g., Groom + Hindi + Pending)
   - Verify page resets to 1 when filters change

4. **CSV Export:**
   - Apply filters and click Export
   - Verify exported CSV includes new columns
   - Verify export respects active filters

### Database Verification

```sql
-- Verify onboarding count
SELECT COUNT(*) FROM guests
WHERE user_language IS NOT NULL AND user_side IS NOT NULL;

-- Verify RSVP breakdown
SELECT rsvp_status, COUNT(*) FROM guests GROUP BY rsvp_status;

-- Verify total headcount
SELECT SUM(rsvp_guest_count) FROM guests WHERE rsvp_status = 'YES';
```

## Dependencies for Future PRs

- **PR-13 (Multi-Language Broadcasts)**: Will use the by-language stats to show message distribution
- **PR-14 (Content Management)**: Admin infrastructure is now in place for additional CRUD pages

## Acceptance Criteria Checklist

- [x] New columns visible (Language, Side, RSVP, Count)
- [x] Filters work and combine (Side, Language, RSVP)
- [x] Stats show onboarding %
- [x] Stats show RSVP breakdown
- [x] Stats show total headcount
- [x] Stats show by-side breakdown
- [x] Stats show by-language breakdown
- [x] Export includes new columns
- [x] Export respects active filters
- [x] TypeScript compiles without errors

## Known Limitations

1. **No Sorting**: New columns are not sortable. This could be added in a future enhancement.

2. **Pre-existing Lint Error**: There's an existing ESLint error in `AuthContext.tsx` (fast refresh warning) that predates this PR and is unrelated to these changes.

3. **Many Database Queries**: The stats endpoint makes multiple database queries. For a larger-scale application, these could be optimized with a single aggregation query or materialized view.
