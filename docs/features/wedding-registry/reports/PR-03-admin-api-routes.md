# PR-03: Admin API Routes

## Summary
Created admin API routes for managing registry items and claims. All endpoints are protected by the existing `requireAuth` middleware. The routes use the repository layer from PR-02 and follow the patterns established in `events.ts` and `broadcasts.ts`.

## Files Changed
- `src/routes/admin/registry.ts` - New file with 9 endpoints for items and claims
- `src/routes/admin/index.ts` - Added registry router import and mount

## Endpoints Implemented

### Registry Items
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/registry/items` | List all items |
| GET | `/api/admin/registry/items/:id` | Get single item |
| POST | `/api/admin/registry/items` | Create item |
| PATCH | `/api/admin/registry/items/:id` | Update item |
| DELETE | `/api/admin/registry/items/:id` | Delete item (blocked if claimed) |
| POST | `/api/admin/registry/items/reorder` | Reorder items by ID array |
| POST | `/api/admin/registry/items/import` | Import from CSV string |

### Registry Claims
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/registry/claims` | List claims with guest/item info |
| DELETE | `/api/admin/registry/claims/:id` | Release a claim |

## Key Decisions
- **Delete protection**: Cannot delete items with existing claims - admin must release claim first. This prevents accidental data loss.
- **CSV import via request body**: CSV data is sent as a string in `{ csv: "..." }` rather than multipart file upload. Simpler for the frontend and sufficient for the expected data size.
- **Inline CSV parser**: Implemented a simple CSV parser that handles quoted values and escaped quotes, avoiding external dependencies.
- **Auto-increment sort_order on import**: New imported items get sort_order starting from max existing + 1.

## CSV Import Format
```csv
name,name_hi,name_pa,description,description_hi,description_pa,price,external_link
Item Name,हिंदी नाम,ਪੰਜਾਬੀ ਨਾਮ,Description,विवरण,ਵਰਣਨ,1000,https://example.com
```

- `name` column is required
- Empty price = `show_price: false`
- All other columns are optional

## Testing Notes
- All endpoints require admin session (test with authenticated client)
- Test delete protection: create item, claim it via guest API, try to delete (should 400)
- Test CSV import with various formats: quoted values, empty fields, missing columns

## Dependencies for Future PRs
- **PR-04 (Guest API Routes)**: Admin endpoints are ready, guest endpoints can now be built
- **PR-05 (Admin API Client)**: Frontend client can now call these endpoints
- **PR-06 (Registry Items Page)**: Can build UI using these endpoints

## Known Limitations
- No pagination on items list (acceptable for expected registry size ~20-50 items)
- CSV import returns all errors at once rather than failing fast
- No bulk delete endpoint
