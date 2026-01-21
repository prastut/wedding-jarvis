# PR-04: Guest API Routes

## Summary
Created guest-facing API routes for viewing registry items and claiming/unclaiming gifts. Guests are identified by phone number in query params, validated against the guests table. Added registry configuration options for UPI address and open/closed status.

## Files Changed
- `src/routes/registry.ts` - New file with 4 guest-facing endpoints
- `src/config/index.ts` - Added `registry.upiAddress` and `registry.isOpen` config options
- `src/index.ts` - Registered registry router at `/api/registry`

## Endpoints Implemented

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/registry/items?phone=XXX` | Get items with claim status for guest |
| POST | `/api/registry/claim?phone=XXX` | Claim an item (body: `{ itemId }`) |
| DELETE | `/api/registry/claim/:itemId?phone=XXX` | Unclaim an item |
| GET | `/api/registry/settings` | Get UPI address and open status (public) |

## Response Format

### GET /api/registry/items
```json
{
  "items": [
    {
      "id": "uuid",
      "name": "Item Name",
      "name_hi": "हिंदी नाम",
      "name_pa": "ਪੰਜਾਬੀ ਨਾਮ",
      "description": "...",
      "price": 1000,
      "show_price": true,
      "image_url": "https://...",
      "external_link": "https://...",
      "is_claimed": false,
      "claimed_by_me": false
    }
  ],
  "guest": {
    "id": "uuid",
    "name": "Guest Name",
    "language": "EN"
  }
}
```

## Key Decisions
- **Phone in query param**: Simple approach for V1 - phone number passed as `?phone=919XXXXXXXXX`. No tokens or authentication required.
- **validateGuest middleware pattern**: Reusable validation that checks registry open status and guest existence before processing requests.
- **Price hiding**: If `show_price` is false, `price` is returned as `null` to guests (even if set in database).
- **409 for already claimed**: Returns conflict status when trying to claim an item that's already taken.
- **Settings endpoint is public**: No phone validation needed - anyone can check if registry is open and get UPI address.

## Environment Variables Added

| Variable | Description | Default |
|----------|-------------|---------|
| `REGISTRY_UPI_ADDRESS` | UPI address for cash gifts | `""` (empty) |
| `REGISTRY_OPEN` | Whether registry accepts claims | `"true"` |

## Testing Notes
- Test with valid phone that exists in guests table
- Test with invalid/unknown phone (should 403)
- Test with `REGISTRY_OPEN=false` (should 403 on all item/claim routes)
- Test claiming already-claimed item (should 409)
- Test unclaiming item you didn't claim (silently succeeds - no error)

## Dependencies for Future PRs
- **PR-09 (Guest Wishlist Page)**: Can now fetch items and make claim/unclaim calls
- **PR-10 (Claim/Unclaim Flow)**: API is ready for frontend integration
- **PR-11 (UPI Display)**: Settings endpoint returns UPI address

## Known Limitations
- No rate limiting specific to claim operations (uses general API limiter)
- Phone number in URL is not secure - acceptable for V1 wedding guest list
- Unclaiming non-existent claim silently succeeds (no 404)
