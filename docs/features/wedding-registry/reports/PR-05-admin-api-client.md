# PR-05: Admin API Client

## Summary
Added registry types and API client functions to the admin panel for managing gift items and claims. The client provides full CRUD operations for registry items, reordering, CSV import, and claim management. All functions follow the existing patterns in `client.ts`.

## Files Changed
- `admin-panel/src/api/client.ts` - Added RegistryItem, RegistryClaim, ClaimWithGuest, and RegistryItemFormData types; added 9 API functions for registry operations

## Key Decisions
- **Types in client.ts, not separate file**: Following the existing pattern where all types are defined alongside API functions in `client.ts`. This keeps related code together and avoids import complexity.
- **FormData uses optional fields with string**: The `RegistryItemFormData` type uses optional fields (e.g., `name_hi?: string`) to allow partial updates, matching how other form data types like `EventFormData` work.
- **CSV import via string body**: The `importRegistryItems()` function sends CSV as a string in the request body (`{ csv: "..." }`) rather than FormData with file upload. This matches the backend implementation from PR-03.
- **Consistent response wrapping**: All responses follow the pattern of wrapping data in named properties (e.g., `{ items: RegistryItem[] }`, `{ claims: ClaimWithGuest[] }`) for consistency with existing endpoints.

## API Functions Added

### Registry Items (7 functions)
| Function | Description |
|----------|-------------|
| `getRegistryItems()` | Get all registry items |
| `getRegistryItem(id)` | Get single item by ID |
| `createRegistryItem(data)` | Create new item |
| `updateRegistryItem(id, data)` | Update existing item |
| `deleteRegistryItem(id)` | Delete item |
| `reorderRegistryItems(orderedIds)` | Batch reorder items |
| `importRegistryItems(csv)` | Import items from CSV string |

### Registry Claims (2 functions)
| Function | Description |
|----------|-------------|
| `getRegistryClaims()` | Get all claims with guest/item info |
| `releaseClaim(claimId)` | Delete a claim (release item) |

## Testing Notes
- Functions can be tested by importing from `client.ts` and calling with admin auth
- All functions use the shared `api()` helper which handles auth cookies and error responses
- Build and lint pass successfully

## Dependencies for Future PRs
- **PR-06 (Registry Items Page)**: Can now build the items management UI using these API functions
- **PR-07 (Registry Claims Page)**: Can use `getRegistryClaims()` and `releaseClaim()` functions
- **PR-08 (CSV Import Feature)**: Can use `importRegistryItems()` function

## Known Limitations
- No pagination support for items or claims (acceptable for expected registry size)
- CSV import returns all items created, not streaming/progress (acceptable for expected import size)
