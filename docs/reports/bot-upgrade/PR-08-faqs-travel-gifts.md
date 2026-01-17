# PR-08: FAQs + Travel + Gifts

## Summary

Implemented the remaining simple menu handlers for FAQs, Travel, and Gifts. FAQs was already fully implemented (database fetch + translations). Travel info displays localized placeholder content. Created a new `/gifts` page with language variants (EN, HI, PA) following the dress-code page pattern, and updated the gifts bot message to include a link to this page.

## Files Changed

- `src/routes/pages.ts` - Added gift registry pages (`/gifts`, `/gifts/hi`, `/gifts/pa`) with:
  - `renderGiftsPage()` function with responsive HTML design
  - Three sections: Your Presence, Blessings & Shagun, Contact Us
  - Language switcher navigation matching dress-code pattern
  - Routes for all three languages

- `src/services/botRouter.ts` - Updated gift registry handler:
  - Removed TODO comment for Travel handler (was already functional)
  - Created `sendGiftRegistry()` function with language-specific link
  - Added `getGiftsPageUrl()` helper for language-based URL construction

- `src/i18n/en.ts` - Added 8 new i18n keys:
  - `gifts.info` - Updated to include `{giftsLink}` placeholder
  - `gifts.page.title`, `gifts.page.description`
  - `gifts.page.presenceTitle`, `gifts.page.presenceText`
  - `gifts.page.blessingTitle`, `gifts.page.blessingText`
  - `gifts.page.contactTitle`, `gifts.page.contactText`

- `src/i18n/hi.ts` - Added Hindi translations for all 8 new keys

- `src/i18n/pa.ts` - Added Punjabi translations for all 8 new keys

## Key Decisions

1. **Page-Based Gift Registry**: Created a dedicated `/gifts` page rather than just a WhatsApp text message. This allows for richer content presentation and can be easily updated with registry links or payment info later.

2. **Three Content Sections**: Organized gift registry page into three meaningful sections:
   - "Your Presence" - Emphasizing presence as the best gift
   - "Blessings & Shagun" - Cultural context for monetary blessings
   - "Contact Us" - Directing to emergency contacts for questions

3. **Environment Variable for URL**: Used `PUBLIC_URL` environment variable with fallback to production URL, allowing flexibility between environments.

4. **Consistent Design**: Reused the dress-code page styling patterns (same color scheme, card layout, fonts) for visual consistency.

5. **FAQs Already Complete**: The `sendFAQs()` function was already fully implemented in previous PRs with database fetch and translations, meeting acceptance criteria.

## Testing Notes

### Manual Testing

1. **FAQs**:
   - Onboard as any guest
   - Select "FAQs" from menu
   - Verify: Questions and answers display in selected language
   - Verify: Back to Menu button works

2. **Travel & Stay**:
   - Select "Travel & Stay" from menu
   - Verify: Placeholder message displays in selected language
   - Verify: Back to Menu button works

3. **Gift Registry**:
   - Select "Gift Registry" from menu
   - Verify: Message includes link to `/gifts` page (or language variant)
   - Verify: Clicking link opens the gifts page
   - Verify: Page displays in correct language
   - Verify: Language switcher works on the page
   - Verify: Back to Menu button works in bot

### Test Pages Directly

```bash
# Start dev server
npm run dev

# Visit in browser:
# http://localhost:3000/gifts       - English
# http://localhost:3000/gifts/hi    - Hindi
# http://localhost:3000/gifts/pa    - Punjabi
```

## Gift Registry Page Structure

```
*Gift Registry*

[Language Switcher: English | हिंदी | ਪੰਜਾਬੀ]

[Header Card]
Gift Registry
Blessing the couple on their new journey

[Your Presence Card]
Your presence at our wedding is the greatest gift...

[Blessings & Shagun Card]
If you wish to bless us, your love and good wishes...

[Contact Us Card]
For any questions about gifts or contributions...

[Footer]
Sanjoli & Shreyas • February 2026
```

## i18n Keys Added

| Key | Purpose |
|-----|---------|
| `gifts.info` | Bot message with `{giftsLink}` placeholder |
| `gifts.page.title` | Page header title |
| `gifts.page.description` | Page header subtitle |
| `gifts.page.presenceTitle` | "Your Presence" section title |
| `gifts.page.presenceText` | "Your Presence" section content |
| `gifts.page.blessingTitle` | "Blessings & Shagun" section title |
| `gifts.page.blessingText` | "Blessings & Shagun" section content |
| `gifts.page.contactTitle` | "Contact Us" section title |
| `gifts.page.contactText` | "Contact Us" section content |

## Dependencies for Future PRs

- **PR-14 (Admin Content Management)**: May want to add admin interface to update gift registry content dynamically

## Known Limitations

1. **Static Page Content**: Gift registry page content is compiled into the i18n files. For dynamic content (like Amazon wishlist links, bank details), the page would need database integration.

2. **No Registry Links Yet**: Per the spec, "details pending from family" - the page provides cultural context but doesn't include specific registry links or payment methods yet.

3. **Travel Info Placeholder**: Travel & Stay content remains a placeholder message directing guests to emergency contacts. Can be enhanced later with actual hotel/travel details.

## Acceptance Criteria Checklist

- [x] FAQs display in user's language (database fetch + translations)
- [x] Travel info displays (i18n message with emergency contact reference)
- [x] Gift registry link works (links to language-specific `/gifts` page)
- [x] All have Back to Menu button
