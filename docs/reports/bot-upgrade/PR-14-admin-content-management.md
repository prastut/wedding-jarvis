# PR-14: Admin Content Management

## Summary

Implemented full CRUD (Create, Read, Update, Delete) interfaces for all wedding content in the admin panel. This includes management pages for Events (with translations and side assignment), Venues (with translations), FAQs (with translations), and Coordinator Contacts (with side assignment). Each page follows the same pattern as the existing Broadcasts page with inline forms, data tables, and validation.

## Files Changed

### Backend (API Routes)

- `src/routes/admin/events.ts` - **NEW** - Full CRUD endpoints for events with venue selection, side assignment, translations (Hindi/Punjabi), and sort order
- `src/routes/admin/venues.ts` - **NEW** - Full CRUD endpoints for venues with translations and Google Maps links; includes validation to prevent deletion when venue is in use
- `src/routes/admin/faqs.ts` - **NEW** - Full CRUD endpoints for FAQs with translations and category/sort order
- `src/routes/admin/contacts.ts` - **NEW** - Full CRUD endpoints for coordinator contacts with side assignment and primary flag
- `src/routes/admin/index.ts` - Mounted new routers: `/events`, `/venues`, `/faqs`, `/contacts`

### Admin Panel (Frontend)

- `admin-panel/src/api/client.ts` - Added types and API methods for all content entities (Event, Venue, FAQ, Contact with corresponding FormData interfaces)
- `admin-panel/src/pages/Events.tsx` - **NEW** - Events management page with venue dropdown, side selection, and translation fields for name and dress code
- `admin-panel/src/pages/Venues.tsx` - **NEW** - Venues management page with address translations, Google Maps link, and parking info translations
- `admin-panel/src/pages/FAQs.tsx` - **NEW** - FAQs management page with question/answer translations, category, and sort order
- `admin-panel/src/pages/Contacts.tsx` - **NEW** - Contacts management page with side selection and primary contact toggle
- `admin-panel/src/App.tsx` - Added imports and routes for new pages
- `admin-panel/src/components/Layout.tsx` - Added navigation links with "Content" section divider
- `admin-panel/src/App.css` - Added styles for navigation divider, content forms, and form layout

## Key Decisions

1. **Consistent Page Pattern**: All four content pages follow the same pattern as Broadcasts: inline form toggle, data table with actions, and edit/delete functionality. This provides a consistent admin experience.

2. **Translation Fields Side-by-Side**: Multi-language fields (EN/HI/PA) are displayed in a 3-column grid layout for easy comparison and editing. On mobile, they stack vertically.

3. **Venue Deletion Protection**: The venues API checks if a venue is in use by any events before allowing deletion, preventing orphaned foreign key references.

4. **Side Badges**: Events and Contacts show color-coded badges for side assignment (blue for Groom, orange/yellow for Bride, gray for Both) for quick visual scanning.

5. **Navigation Section Divider**: Added a "Content" section divider in the sidebar to visually separate content management from other admin functions.

6. **Form Validation**: Required fields are validated on both frontend (HTML5 required attribute) and backend (explicit validation with descriptive error messages).

## Testing Notes

### Manual Testing

1. **Events:**
   - Create a new event with all fields
   - Verify venue dropdown shows existing venues
   - Verify side selection works (GROOM/BRIDE/BOTH)
   - Edit an event and update translations
   - Delete an event

2. **Venues:**
   - Create a venue with Google Maps link
   - Verify "View Map" link opens in new tab
   - Try to delete a venue that's used by an event (should fail with error)
   - Delete an unused venue

3. **FAQs:**
   - Create FAQ with category and sort order
   - Verify questions sorted by sort_order
   - Edit translations for question and answer
   - Delete a FAQ

4. **Contacts:**
   - Create contact with primary flag
   - Verify primary contacts show "Primary" badge
   - Verify side assignment shows correct badge
   - Delete a contact

### Build Verification

```bash
npm run build  # TypeScript compiles successfully
```

## API Endpoints Added

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/events` | List all events with venue data |
| GET | `/api/admin/events/:id` | Get single event |
| POST | `/api/admin/events` | Create event |
| PATCH | `/api/admin/events/:id` | Update event |
| DELETE | `/api/admin/events/:id` | Delete event |
| GET | `/api/admin/venues` | List all venues |
| GET | `/api/admin/venues/:id` | Get single venue |
| POST | `/api/admin/venues` | Create venue |
| PATCH | `/api/admin/venues/:id` | Update venue |
| DELETE | `/api/admin/venues/:id` | Delete venue (if not in use) |
| GET | `/api/admin/faqs` | List all FAQs |
| GET | `/api/admin/faqs/:id` | Get single FAQ |
| POST | `/api/admin/faqs` | Create FAQ |
| PATCH | `/api/admin/faqs/:id` | Update FAQ |
| DELETE | `/api/admin/faqs/:id` | Delete FAQ |
| GET | `/api/admin/contacts` | List all contacts |
| GET | `/api/admin/contacts/:id` | Get single contact |
| POST | `/api/admin/contacts` | Create contact |
| PATCH | `/api/admin/contacts/:id` | Update contact |
| DELETE | `/api/admin/contacts/:id` | Delete contact |

## Dependencies for Future PRs

- This is the final PR in the project - all content is now manageable via the admin panel.

## Known Limitations

1. **No Bulk Operations**: Content must be managed one item at a time. Bulk import/export could be added later.

2. **No Translation Auto-Generation**: Translations must be manually entered. Could integrate with a translation API in the future.

3. **No Image Upload**: Venues and events don't support image attachments. Would require file storage integration.

4. **No Audit Log**: Changes to content are not tracked. Could add change history in the future.

5. **No Sorting UI**: Tables are sorted by default (events by sort_order, venues by name, etc.) but don't have clickable column headers for sorting.

## Acceptance Criteria Checklist

- [x] All CRUD operations work for Events
- [x] All CRUD operations work for Venues
- [x] All CRUD operations work for FAQs
- [x] All CRUD operations work for Contacts
- [x] Translation fields editable (EN/HI/PA)
- [x] Side assignment works (GROOM/BRIDE/BOTH)
- [x] Validation on required fields
- [x] Navigation links added to admin sidebar
- [x] TypeScript compiles without errors
