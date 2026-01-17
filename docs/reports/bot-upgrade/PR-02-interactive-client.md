# PR-02: Interactive Message Client + Constants

## Summary

Implemented production-ready WhatsApp interactive message support with proper TypeScript types and all button/list ID constants. Created helper functions to extract language, side, and count values from interactive message IDs. Updated the webhook handler to use centralized constants for parsing interactive replies, and removed the temporary test route from PR-00.

## Files Changed

- `src/types/whatsapp.ts` - **NEW** - Comprehensive TypeScript types for WhatsApp interactive messages (reply buttons, list messages, webhook payloads, API limits)
- `src/constants/buttonIds.ts` - **NEW** - All button/list IDs as typed constants with helper functions (`extractLanguage`, `extractSide`, `extractCount`, `parseInteractiveMessage`)
- `src/services/whatsappClient.ts` - Updated to import types from `whatsapp.ts`, added internal `sendInteractiveMessage` helper, improved validation and documentation
- `src/routes/webhook.ts` - Updated to use `INTERACTIVE_PREFIXES` constants for parsing interactive replies
- `src/services/botRouter.ts` - Updated to use `parseInteractiveMessage` helper and button ID constants, removed TEST commands
- `src/index.ts` - Removed test interactive route
- `src/routes/testInteractive.ts` - **DELETED** - Temporary test route no longer needed

## Key Decisions

1. **Separate Types File**: Created `src/types/whatsapp.ts` specifically for WhatsApp interactive message types to keep them organized and reusable. The main `src/types/index.ts` keeps the general application types.

2. **Typed ID Constants**: All button/list IDs defined as `const` objects with corresponding type aliases (e.g., `LanguageId`, `MenuId`). This enables type safety when checking button IDs.

3. **Helper Function Pattern**: Created helper functions that:
   - Type guards (`isLanguageId`, `isSideId`, etc.) for checking ID categories
   - Extractors (`extractLanguage`, `extractSide`, `extractCount`) for parsing values from IDs
   - `parseInteractiveMessage` for parsing the prefixed message format from webhooks

4. **Centralized Prefixes**: The `INTERACTIVE_PREFIXES` constant ensures webhook.ts and botRouter.ts use the same format for identifying interactive message types.

5. **Re-export Pattern**: `whatsappClient.ts` re-exports the types it uses for convenience, allowing imports from either the types file or the client module.

## Testing Notes

Build verification:
```bash
npm run build  # TypeScript compiles successfully
```

The interactive message functions were validated in PR-00 and remain unchanged. The new constants and helpers are used by:
- `webhook.ts` - parsing incoming interactive replies
- `botRouter.ts` - routing based on button ID categories

## Button ID Reference

| Category | IDs | Helper Functions |
|----------|-----|------------------|
| Language | `lang_en`, `lang_hi`, `lang_pa` | `isLanguageId()`, `extractLanguage()` |
| Side | `side_groom`, `side_bride` | `isSideId()`, `extractSide()` |
| Menu | `menu_schedule`, `menu_venue`, `menu_travel`, `menu_rsvp`, `menu_emergency`, `menu_faq`, `menu_gifts`, `menu_reset` | `isMenuId()` |
| RSVP | `rsvp_yes`, `rsvp_no`, `rsvp_update`, `rsvp_back` | `isRsvpId()` |
| Count | `count_1` through `count_9`, `count_10plus` | `isCountId()`, `extractCount()` |
| Navigation | `nav_back_menu` | `isNavId()` |

## Dependencies for Future PRs

- **PR-03**: Will use `extractLanguage()` and `extractSide()` to save guest preferences
- **PR-04**: Can use the ID constants for building i18n-aware interactive messages
- **PR-05-08**: Will use `MENU_IDS` constants for routing
- **PR-09**: Will use `RSVP_IDS` and `COUNT_IDS` for RSVP flow
- **PR-10**: Will use `MENU_IDS.RESET` for reset flow

## Known Limitations

- ESLint has a pre-existing configuration issue (`typescript-eslint` package missing) - unrelated to this PR
- The botRouter.ts still uses placeholder responses for features not yet implemented (marked with TODO comments)
- Interactive message content (button titles, list descriptions) will be internationalized in PR-04
