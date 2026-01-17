# PR-04: i18n System + All Translations

## Summary

Implemented a complete internationalization (i18n) system for the Wedding WhatsApp Concierge with support for English, Hindi, and Punjabi. All bot messages have been extracted from inline translations in botRouter.ts into a centralized i18n system with type-safe message keys and automatic English fallback. Additionally, created language-specific dress code pages with a modern, responsive design.

## Files Changed

- `src/i18n/index.ts` - **NEW** - Core i18n system with `getMessage()`, `getMessageWithValues()`, `getSideName()`, `getSideWithName()`, and `getMenuItems()` helper functions
- `src/i18n/en.ts` - **NEW** - Complete English translations (60+ message keys covering all bot interactions)
- `src/i18n/hi.ts` - **NEW** - Complete Hindi translations for all message keys
- `src/i18n/pa.ts` - **NEW** - Complete Punjabi translations for all message keys
- `src/services/botRouter.ts` - Refactored to use i18n system; removed all inline translation objects
- `src/routes/pages.ts` - **NEW** - Dress code page routes for EN, HI, PA with responsive HTML rendering
- `src/index.ts` - Added pages router mount

## Key Decisions

1. **Type-Safe Message Keys**: Used TypeScript's `keyof typeof` to derive the `MessageKey` type from the English messages object. This ensures all translations have the same keys and provides autocomplete in editors.

2. **Fallback Strategy**: The `getMessage()` function automatically falls back to English if a translation is missing, with console warnings for missing translations. This ensures the bot never shows raw message keys to users.

3. **Helper Functions**: Created specialized helpers:
   - `getMessageWithValues()` - For interpolation with `{placeholders}`
   - `getSideName()` / `getSideWithName()` - For side-specific labels
   - `getMenuItems()` - Returns fully translated menu items array

4. **Dress Code Page Design**: Created standalone HTML pages (not SPA routes) with:
   - Language switcher navigation
   - Modern, responsive design with Google Fonts for Devanagari and Gurmukhi scripts
   - Server-side rendered content from events database

5. **Message Organization**: Messages are organized by category in each translation file:
   - Welcome / Language Selection
   - Side Selection
   - Onboarding Complete
   - Main Menu (header + 8 items with descriptions)
   - Navigation
   - Content Headers and Labels
   - RSVP Flow (for PR-09)
   - Reset Flow (for PR-10)
   - Fallback / Errors
   - Common phrases
   - Dress Code Page
   - Travel & Gifts info
   - Post-Wedding messages
   - Opt-out/Opt-in

## Testing Notes

### Build Verification
```bash
npm run build  # TypeScript compiles successfully
```

### Test i18n System
The i18n functions can be tested by importing and calling:
```typescript
import { getMessage, getMessageWithValues, getMenuItems } from './i18n';

getMessage('welcome.title', 'HI');
// → "संजोली और श्रेयस की शादी में आपका स्वागत है! 🌸"

getMessageWithValues('onboarding.welcome', 'EN', { sideName: "Groom's family" });
// → "Welcome, Groom's family! 🎉\n\nYou're all set!"

getMenuItems('PA');
// → Array of 8 menu items with Punjabi titles and descriptions
```

### Test Dress Code Pages
Start the dev server and visit:
- `http://localhost:3000/dress-code` - English
- `http://localhost:3000/dress-code/hi` - Hindi
- `http://localhost:3000/dress-code/pa` - Punjabi

## Translation Keys Reference

| Category | Keys | Example |
|----------|------|---------|
| Welcome | `welcome.*` | `welcome.title`, `welcome.selectLanguage` |
| Side Selection | `side.*` | `side.thankYou`, `side.button.groom` |
| Onboarding | `onboarding.*` | `onboarding.welcome`, `onboarding.welcomeBack` |
| Main Menu | `menu.*` | `menu.header`, `menu.items.schedule.title` |
| Navigation | `nav.*` | `nav.backToMenu` |
| Content Headers | `content.*.header` | `content.schedule.header` |
| Content Labels | `content.*.*` | `content.venue.map`, `content.contact.phone` |
| RSVP | `rsvp.*` | `rsvp.prompt`, `rsvp.confirmed.yes` |
| Reset | `reset.*` | `reset.confirm` |
| Common | `common.*` | `common.side.groom` |
| Errors | `error.*`, `fallback.*` | `error.noData`, `fallback.unknown` |
| Dress Code | `dressCode.*` | `dressCode.title` |
| Travel/Gifts | `travel.info`, `gifts.info` | - |

## Dependencies for Future PRs

- **PR-05 (Events)**: Can use `getMessage('content.schedule.header', language)` and other content labels
- **PR-06 (Venues)**: Can use venue-related labels from i18n
- **PR-07 (Contacts)**: Can use `content.emergency.header`, `content.contact.phone`
- **PR-08 (FAQs/Travel/Gifts)**: Travel and gift messages already translated, FAQs use content headers
- **PR-09 (RSVP)**: Full RSVP flow messages translated and ready (`rsvp.*`)
- **PR-10 (Reset)**: Reset confirmation message ready (`reset.confirm`)

## Known Limitations

1. **No Runtime Language Detection**: Languages are explicitly set by user selection, not auto-detected
2. **Static Translations**: Translations are compile-time; no runtime loading from database
3. **Dress Code Page Content**: Currently pulls dress code from events table; if dress codes are null, shows empty cards
4. **No Translation Validation**: Missing translations only produce console warnings, not errors

## Acceptance Criteria Checklist

- [x] `getMessage(key, language)` returns correct translation
- [x] Falls back to English if translation missing (with warning)
- [x] All bot messages use i18n system
- [x] `/dress-code`, `/dress-code/hi`, `/dress-code/pa` routes work
- [x] TypeScript compiles without errors
- [x] All 60+ message keys translated in EN, HI, PA
