# PR-12: Bot Personalized Link for Wedding Registry

## Summary
Updated the WhatsApp bot to send a personalized wishlist link that includes the guest's phone number as a URL parameter. This enables the wishlist page to identify the guest and show personalized content (e.g., pre-fill their claims, show items they've already selected). The link also includes the guest's language preference for proper localization.

## Files Changed
- `/Users/nfp/Dev/wedding-jarvis/src/services/botRouter.ts` - Replaced `getGiftsPageUrl()` with `getWishlistUrl()` that constructs a personalized URL with the guest's phone number and language preference

## Key Decisions
- Used `URLSearchParams` for proper URL encoding of the phone number - this handles special characters and international formats safely
- Added `lang` parameter alongside `phone` to allow the wishlist page to display in the guest's preferred language without requiring a separate lookup
- Changed the URL path from `/gifts` (language-based routes) to `/wishlist` (single route with query params) - simpler routing and better personalization support

## Testing Notes
- Send "MENU" to the bot and select "Gift Registry" option
- Verify the URL in the response contains `?phone=...&lang=...`
- Test with different language settings (EN, HI, PA) to confirm `lang` parameter changes accordingly
- Click the link and verify the wishlist page receives the parameters correctly
- Test with phone numbers containing special characters (e.g., `+` prefix) to ensure proper encoding

## Dependencies for Future PRs
- The wishlist frontend page (PR-09) should be updated to read the `phone` and `lang` query parameters
- Guest identification on the wishlist page can use the phone number to show personalized claim status

## Known Limitations
- Phone number is visible in the URL - this is acceptable for this use case since the link is sent privately via WhatsApp to the guest themselves
- No authentication on the wishlist page - guests can technically modify the phone parameter to see another guest's view, but this only affects display and doesn't grant any elevated permissions
