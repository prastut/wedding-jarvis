# PR-06: Venue Details

## Summary

Implemented venue details display with full multi-language support. The `sendVenuesAndDirections` function fetches all venues from the database, displays translated addresses and parking information based on the guest's selected language, and includes clickable Google Maps links for directions. All venue content responses include a "Back to Menu" interactive button.

## Files Changed

- `src/services/botRouter.ts` - `sendVenuesAndDirections()` function (implemented in PR-03, uses i18n from PR-04)

## Key Decisions

1. **No Venue Repository**: Unlike events which required side-filtering logic, venues use a simple "fetch all" query directly in the botRouter. This keeps the code simple since there's no filtering needed.

2. **Translation Fallback Pattern**: Uses the same pattern as other content: check for language-specific translation (`address_hi`/`address_pa`), fall back to English (`address`) if translation is missing.

3. **Venue Name Not Translated**: Per the database schema from PR-01, venue names are not translated (only `address` and `parking_info` have translation columns). Venue names remain in English across all languages.

4. **Caching Strategy**: Venues are cached by language only (5-minute TTL) since venue data changes rarely and is the same for all guests regardless of side.

## Testing Notes

### Manual Testing

1. **Onboard as any guest** with language selection (EN/HI/PA) and side selection
2. **Select "Venue & Directions"** from the main menu
3. **Verify**:
   - All venues are listed
   - Address shows in selected language (or English fallback)
   - Parking info shows in selected language (if available)
   - Google Maps links are clickable
   - "Back to Menu" button works

### Test with Different Languages

```bash
# Start dev server
npm run dev

# Send messages via WhatsApp:
# 1. New user gets language selection → select Hindi
# 2. Side selection → select any
# 3. Menu → tap "Venue & Directions"
# Expected: Venue header and labels in Hindi, addresses in Hindi if translated
```

## Venue Display Format

```
*स्थान और दिशा-निर्देश*

*Venue Name*
123 Address Street, City
नक्शा: https://maps.google.com/...
पार्किंग: Parking information here

*Another Venue*
456 Another Address
नक्शा: https://maps.google.com/...

[मेनू पर वापस]
```

## i18n Keys Used

| Key | Purpose |
|-----|---------|
| `content.venue.header` | Section header ("Venue & Directions") |
| `content.venue.map` | Label for Maps link ("Map") |
| `content.venue.parking` | Label for parking info ("Parking") |
| `nav.backToMenu` | Back button text |

## Dependencies for Future PRs

- **PR-08 (Travel & Gifts)**: May reference venues in travel info
- **PR-14 (Admin Content Management)**: Will add CRUD for venues with translation fields

## Known Limitations

1. **Venue Name English Only**: Venue names don't have translation columns in the schema. If translated names are needed, a database migration would be required.

2. **No Venue Filtering**: All venues are shown to all guests. If side-specific venues are needed in the future, a `side` column would need to be added to the venues table.

3. **Order by Name**: Venues are sorted alphabetically by name. A `sort_order` column could be added for custom ordering.

## Acceptance Criteria Checklist

- [x] All venues displayed
- [x] Content in user's language (address, parking info with fallback)
- [x] Maps links work (clickable Google Maps URLs)
- [x] Back to Menu button
