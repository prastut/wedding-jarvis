# PR-09: Guest Wishlist Page

## Summary
Created the guest-facing wishlist web page at `/wishlist`. Guests access this page via a personalized link (with their phone number in the URL) sent by the WhatsApp bot. The page displays gift items with claim/unclaim functionality, supports three languages (English, Hindi, Punjabi), and includes a UPI section for cash gifts. The design is mobile-first and responsive.

## Files Changed
- `admin-panel/src/pages/Wishlist.tsx` - New guest-facing wishlist page component
- `admin-panel/src/pages/Wishlist.css` - Styles for the wishlist page (mobile-first, responsive)
- `admin-panel/src/api/client.ts` - Added guest API types and functions (GuestRegistryItem, GuestInfo, RegistrySettings, guestApi)
- `admin-panel/src/App.tsx` - Added public route for `/wishlist`

## Key Decisions
- **Public route pattern**: The `/wishlist` route is placed outside the ProtectedRoute wrapper, making it accessible without admin authentication. Guest validation happens at the API level using the phone number.
- **Inline translations**: Instead of creating separate i18n files, translations are defined inline in the component. This keeps the guest page self-contained and avoids complexity for a single page.
- **Optimistic UI updates**: Claim/unclaim operations update the UI immediately, then call the API. If the API fails, the UI reverts and shows an alert.
- **Mobile-first design**: CSS is written mobile-first with responsive breakpoints for tablets (640px) and desktops (1024px). Cards stack on mobile, 2-column on tablet, 3-column on desktop.
- **Pink/rose color scheme**: The design uses a warm pink/rose gradient to differentiate from the admin panel's blue/indigo theme.
- **UPI section included**: Although PR-11 specifies the UPI section, it was natural to include basic UPI display with copy functionality as part of the page structure.

## Page Features
- **Header**: Wedding Wishlist title, personalized greeting ("Hi {name}!"), subtitle
- **Item grid**: Responsive card layout with image, name, description, price
- **Claim states**:
  - Available: "Claim This Gift" button (pink gradient)
  - Claimed by others: "Claimed" badge (grayed out, reduced opacity)
  - Claimed by me: "You claimed this" badge + "Unclaim" button
- **Buy link**: External purchase links shown on available items
- **UPI section**: Displays UPI address with copy button (only if configured)
- **Multi-language**: All UI text translated (EN/HI/PA), item names/descriptions use localized versions

## Testing Notes
- Access `/wishlist` without phone param → shows "Please use the link sent to you via WhatsApp"
- Access `/wishlist?phone=INVALID` → shows "Please message the wedding bot first"
- Access with valid phone → shows items with correct claim status
- Set `REGISTRY_OPEN=false` → shows "Registry is currently closed"
- Test claim/unclaim → optimistic UI update, API call in background
- Test on mobile viewport → cards stack vertically, buttons full-width

## Dependencies for Future PRs
- **PR-10 (Claim/Unclaim Flow)**: Already implemented with optimistic updates - this PR is effectively complete
- **PR-11 (UPI Display Section)**: Basic UPI display is included; PR-11 can add QR code if needed
- **PR-12 (Bot Personalized Link)**: Guest page is ready to receive traffic from personalized bot links

## Known Limitations
- No QR code for UPI (can be added in PR-11)
- No offline support / PWA features
- Alert messages use browser `alert()` instead of custom toast component
- Item order follows backend sort_order (no client-side sorting options)
