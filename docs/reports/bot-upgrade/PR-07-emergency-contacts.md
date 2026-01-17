# PR-07: Emergency Contacts (Side-Specific)

## Summary

Implemented side-specific emergency contacts display. Created a new `coordinatorContacts` repository with side filtering that returns contacts for the guest's side plus shared contacts (BOTH). Updated the botRouter to display ALL matching contacts (not just one), with primary contacts shown first. Each contact shows their name, role, and clickable phone number.

## Files Changed

- `src/repositories/coordinatorContacts.ts` - **NEW** - Repository with `getContactsBySide()` and `getAllContacts()` functions
- `src/services/botRouter.ts` - Updated `sendCoordinatorContact()` to use repository and show all contacts; renamed `formatContactContent()` to `formatContactsContent()` for multiple contacts

## Key Decisions

1. **Repository Pattern**: Created a dedicated repository file following the same pattern as `events.ts`. This separates database logic from the bot router and makes the code more maintainable.

2. **Show All Contacts**: Changed from showing only one contact to showing ALL contacts that match the side filter. This ensures guests have multiple emergency options.

3. **Primary Contacts First**: The repository orders by `is_primary DESC` then `name ASC`, so primary contacts always appear at the top of the list.

4. **Bold Contact Names**: Each contact name is wrapped in `*asterisks*` for WhatsApp bold formatting, making it easier to scan the list.

5. **Clickable Phone Numbers**: Phone numbers are displayed as-is, and WhatsApp automatically makes them clickable for calling.

## Testing Notes

### Manual Testing

1. **Onboard as a guest** selecting any language and either Groom's or Bride's side
2. **Select "Emergency Contact"** from the main menu
3. **Verify**:
   - All contacts for your side + BOTH are shown
   - Primary contacts appear first
   - Each contact shows name, role (if set), and phone number
   - Phone numbers are clickable
   - "Back to Menu" button works

### Test Side Filtering

```bash
# Start dev server
npm run dev

# Test with Groom's side guest:
# - Should see contacts with side=GROOM and side=BOTH

# Test with Bride's side guest:
# - Should see contacts with side=BRIDE and side=BOTH
```

### Database Test Query

```sql
-- Verify side filtering works
SELECT name, role, phone_number, side, is_primary
FROM coordinator_contacts
WHERE side IN ('GROOM', 'BOTH')
ORDER BY is_primary DESC, name ASC;
```

## Contact Display Format

```
*Emergency Contact*

*Primary Contact Name* (Family Coordinator)
Phone: +1234567890

*Another Contact* (Venue Manager)
Phone: +0987654321

*Third Contact*
Phone: +1112223333

[Back to Menu]
```

## i18n Keys Used

| Key | Purpose |
|-----|---------|
| `content.emergency.header` | Section header ("Emergency Contact") |
| `content.contact.phone` | Label for phone number ("Phone") |
| `nav.backToMenu` | Back button text |
| `error.noData` | Error message when no contacts found |

## Repository Functions

| Function | Purpose |
|----------|---------|
| `getContactsBySide(side)` | Returns contacts for specified side + BOTH, ordered by is_primary DESC |
| `getAllContacts()` | Returns all contacts (for admin panel) |

## Dependencies for Future PRs

- **PR-12 (Admin Guest Management)**: May use `getAllContacts()` for stats
- **PR-14 (Admin Content Management)**: Will add CRUD for coordinator contacts with side assignment

## Known Limitations

1. **No Role Translation**: The `role` field is stored in English only. If translated roles are needed, new columns (`role_hi`, `role_pa`) would need to be added to the database.

2. **No Phone Formatting**: Phone numbers are displayed as stored in the database. No validation or formatting is applied.

3. **Cache by Side**: Contacts are cached by language + side. If contacts are updated in the database, guests may see stale data for up to 5 minutes.

## Acceptance Criteria Checklist

- [x] Side-specific contacts shown (guest's side + BOTH)
- [x] Phone numbers clickable (displayed as plain text, WhatsApp handles linking)
- [x] Primary contacts first (ordered by is_primary DESC)
- [x] Back to Menu button
