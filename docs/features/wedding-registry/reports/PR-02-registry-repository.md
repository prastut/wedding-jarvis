# PR-02: Registry Repository

## Summary
Created the data access layer for registry items and claims. The repository provides full CRUD operations for items and claims, following the existing patterns in `broadcasts.ts` and `guests.ts`. All functions use the shared Supabase client and consistent error handling.

## Files Changed
- `src/repositories/registry.ts` - New file with 15 exported functions for items and claims

## Key Decisions
- **Separate functions for admin vs guest queries**: `getAllRegistryItems()` returns all items for admin, while `getAvailableRegistryItems()` filters by `is_available=true` for guests.
- **Unique constraint error handling**: `createClaim()` catches PostgreSQL error code `23505` (unique violation) and throws a descriptive "Item is already claimed" error for better API responses.
- **Batch reorder via Promise.all**: `reorderRegistryItems()` updates all items in parallel for efficiency, with error handling if any update fails.
- **Joined queries for admin view**: `getAllClaimsWithGuests()` uses Supabase's nested select syntax to join guest and item data in a single query.

## Functions Implemented

### Items (7 functions)
| Function | Description |
|----------|-------------|
| `getAllRegistryItems()` | Get all items ordered by sort_order |
| `getAvailableRegistryItems()` | Get only available items (for guests) |
| `getRegistryItemById(id)` | Get single item, returns null if not found |
| `createRegistryItem(input)` | Create new item with defaults |
| `updateRegistryItem(id, updates)` | Partial update |
| `deleteRegistryItem(id)` | Delete item (cascades to claims) |
| `reorderRegistryItems(orderedIds)` | Batch update sort_order |

### Claims (8 functions)
| Function | Description |
|----------|-------------|
| `getClaimsByItemId(itemId)` | Get all claims for an item |
| `getClaimsByGuestId(guestId)` | Get all claims by a guest |
| `getClaimByItemAndGuest(itemId, guestId)` | Get specific claim |
| `createClaim(itemId, guestId)` | Create claim, throws if already claimed |
| `deleteClaim(claimId)` | Delete by claim ID |
| `deleteClaimByItemAndGuest(itemId, guestId)` | Delete by item+guest |
| `getAllClaimsWithGuests()` | Get claims with joined guest/item data |
| `isItemClaimed(itemId)` | Check if item has any claim |

## Testing Notes
- All functions can be tested via the Supabase client
- `createClaim()` should return error when item already has a claim (UNIQUE constraint on item_id)
- `deleteRegistryItem()` cascades to delete associated claims (ON DELETE CASCADE)

## Dependencies for Future PRs
- **PR-03 (Admin API Routes)**: Can now build endpoints using these repository functions
- **PR-04 (Guest API Routes)**: Can use `getAvailableRegistryItems()`, `createClaim()`, `deleteClaimByItemAndGuest()`

## Known Limitations
- No transaction support for `reorderRegistryItems()` - if one update fails, others may have already succeeded
- `getAllClaimsWithGuests()` returns all claims without pagination (acceptable for V1 scope)
