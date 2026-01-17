# PR-13: Admin Multi-Language Broadcasts

## Summary

Implemented multi-language broadcast support allowing admins to compose messages in English, Hindi, and Punjabi. When a broadcast is sent, each guest receives the message in their preferred language. Guests without a language preference (not yet onboarded) receive the English version as a fallback.

## Files Changed

### Database

- `src/db/migrations/006_broadcast_multilang.sql` - Added `message_hi` and `message_pa` columns to the broadcasts table for storing Hindi and Punjabi translations.

### Backend

- `src/types/index.ts` - Added `message_hi` and `message_pa` fields to the `Broadcast` interface.

- `src/services/broadcaster.ts` - Added `getMessageForLanguage()` helper function that selects the appropriate message based on guest's `user_language`. Falls back to English if translation is missing or guest has no language preference.

- `src/routes/admin/broadcasts.ts` - Updated POST (create) and PATCH (update) endpoints to accept and store `message_hi` and `message_pa` fields.

### Admin Panel

- `admin-panel/src/api/client.ts` - Added `message_hi` and `message_pa` fields to `Broadcast` interface. Created `BroadcastFormData` interface for create/update operations.

- `admin-panel/src/pages/Broadcasts.tsx` - Complete rewrite with:
  - Language tabs (English/Hindi/Punjabi) for message composition
  - Visual indicators showing which translations are complete
  - Preview modal displaying all language versions side-by-side
  - "Languages" column showing which translations exist (EN, HI, PA)
  - Send confirmation showing language distribution and warnings for missing translations
  - Fetches stats to show recipient counts by language

- `admin-panel/src/App.css` - Added styles for language tabs, form hints, and preview modal.

## Key Decisions

1. **English Required, Others Optional**: The English message is required (as indicated by the `*` on the tab), while Hindi and Punjabi translations are optional. If a translation is missing, guests with that language preference receive English.

2. **Language Fallback Logic**: The `getMessageForLanguage()` function implements a simple fallback:
   - HI → `message_hi` || `message` (English)
   - PA → `message_pa` || `message` (English)
   - EN or null → `message` (English)

3. **Visual Translation Status**: Tabs show a checkmark when a translation is filled in, making it easy to see completion status at a glance.

4. **Send Confirmation Enhancement**: Before sending, the dialog now shows:
   - Total recipient count
   - Breakdown by language (English, Hindi, Punjabi)
   - Warning if translations are missing for languages that have guests

5. **Preview All Languages**: A new "Preview" button allows admins to see all three language versions side-by-side before sending.

## Testing Notes

### Manual Testing

1. **Create Broadcast with Translations:**
   - Go to `/broadcasts`
   - Click "New Broadcast"
   - Enter topic and English message
   - Switch to Hindi tab, enter Hindi translation
   - Switch to Punjabi tab, enter Punjabi translation
   - Click "Create Broadcast"
   - Verify broadcast appears in list with "EN, HI, PA" in Languages column

2. **Preview Functionality:**
   - Click "Preview" on any broadcast
   - Verify all three language versions are displayed
   - Verify missing translations show "(Will use English)"
   - Click outside modal or "Close" to dismiss

3. **Edit Broadcast Translations:**
   - Click "Edit" on a draft broadcast
   - Verify all translations load correctly
   - Modify a translation
   - Click "Update Broadcast"
   - Verify changes are saved

4. **Send with Language-Aware Delivery:**
   - Create a broadcast with translations
   - Click "Send"
   - Verify confirmation shows language breakdown
   - Confirm send
   - Check send logs or message logs to verify correct language was sent

5. **Missing Translation Warning:**
   - Create a broadcast with only English message
   - Click "Send"
   - Verify warning appears about missing translations (if there are Hindi/Punjabi guests)

### Database Verification

```sql
-- Run migration
-- Verify new columns exist
SELECT column_name FROM information_schema.columns
WHERE table_name = 'broadcasts'
AND column_name IN ('message_hi', 'message_pa');

-- Verify data is stored correctly
SELECT topic, message, message_hi, message_pa FROM broadcasts;
```

## Dependencies for Future PRs

- **PR-14 (Content Management)**: This PR establishes the pattern for multi-language content editing with tabs. The same UI pattern can be reused for events, venues, FAQs, and contacts.

## Acceptance Criteria Checklist

- [x] Form has 3 language fields (EN/HI/PA with tabs)
- [x] Guests receive correct language based on user_language
- [x] Null language gets English (fallback)
- [x] Preview shows all versions
- [x] TypeScript compiles without errors
- [x] ESLint passes
- [x] Build succeeds

## Known Limitations

1. **No Auto-Translation**: The system does not automatically translate messages. Admins must manually enter translations or copy from an external translation service.

2. **No Translation Memory**: Each broadcast's translations are independent. There's no system to reuse or suggest translations from previous broadcasts.

3. **Character Limits Not Enforced**: WhatsApp has message length limits, but the UI doesn't currently warn about or enforce them for any language.
