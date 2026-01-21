# PR-11: UPI Display Section

## Summary
Added a QR code to the UPI cash gift section on the guest wishlist page. The QR code encodes a UPI deep link that allows guests to scan and pay directly using any UPI app. The section now includes both QR code and copy-able UPI address with an "or" divider between them, fully translated into all three languages.

## Files Changed
- `admin-panel/src/pages/Wishlist.tsx` - Added QR code image, "scan to pay" text, and "or" divider with translations
- `admin-panel/src/pages/Wishlist.css` - Added styles for QR code container, image, scan text, and "or" divider

## Key Decisions
- **QR Server API for QR generation**: Used `api.qrserver.com` to generate QR codes dynamically, avoiding the need for additional npm dependencies. The API is reliable and free for this use case.
- **UPI deep link format**: Generated standard UPI deep links in the format `upi://pay?pa=VPA&pn=Wedding%20Gift` which is compatible with all major UPI apps (Google Pay, PhonePe, Paytm, etc.).
- **Error handling for QR code**: If the QR code fails to load (network error or API unavailable), the image hides and the UPI address copy functionality remains available.
- **"Or" divider pattern**: Added a styled divider between QR code and UPI address to clearly separate the two payment options, following common UX patterns.
- **Full multi-language support**: All new text (description, "scan to pay", "or") is translated to Hindi and Punjabi.

## Implementation Details

### QR Code Generation
```typescript
src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
  `upi://pay?pa=${settings.upiAddress}&pn=Wedding%20Gift`
)}`}
```

The QR code is generated on-demand using the guest's configured UPI address. The `pn` (payee name) parameter is set to "Wedding Gift" to provide context when the guest scans the code.

### CSS Additions
- `.upi-qr-container` - Flex container for QR code and text
- `.upi-qr-code` - 180x180px QR code image with white background and rounded corners
- `.upi-scan-text` - Subtle instruction text below QR code
- `.upi-or-divider` - Horizontal line with centered "or" text

## Testing Notes
- Set `REGISTRY_UPI_ADDRESS` environment variable to a valid UPI ID
- Navigate to `/wishlist?phone=VALID_PHONE`
- Verify QR code displays below "Prefer to give cash?" heading
- Scan QR code with a UPI app (Google Pay, PhonePe, etc.) to verify it opens payment flow
- Test with network disconnected to verify graceful degradation (QR hides, copy still works)
- Test in all three languages to verify translations

## Dependencies for Future PRs
- **PR-12 (Bot Personalized Link)**: UPI section is now complete with QR code
- **PR-13 (Seed Mock Registry Items)**: Guest page is feature-complete

## Known Limitations
- QR code is generated via external API (qrserver.com) - no offline support
- QR code size is fixed at 180x180px (adequate for mobile scanning)
- Payee name in UPI link is hardcoded to "Wedding Gift" (could be configurable)
- No amount pre-filled in UPI link (guests enter their own amount)
