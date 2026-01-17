# PR-11: Post-Wedding Behavior

## Summary

Implemented post-wedding behavior that can switch the bot to a thank you mode when enabled. When post-wedding mode is active, the bot responds to any message with a localized thank you message instead of showing the main menu. The feature is controlled via environment variable, allowing the bot to run normally by default and be switched to post-wedding mode when ready.

## Files Changed

- `src/services/botRouter.ts` - Added post-wedding functionality:
  - `isPostWedding()` function that checks `POST_WEDDING_MODE` environment variable
  - `sendPostWeddingMessage()` function to send localized thank you messages
  - Modified `handleMessage()` to check post-wedding status after STOP/START handling

## Key Decisions

1. **Environment Variable Control**: Added `POST_WEDDING_MODE` environment variable:
   - `enabled`: Activate post-wedding mode (show thank you, hide menu)
   - unset/any other value: Bot runs normally (default)

2. **Manual Activation Only**: Post-wedding mode must be explicitly enabled via environment variable. This allows the bot to remain fully functional after the wedding for things like photo sharing, help requests, etc.

3. **STOP/START Still Work**: The post-wedding check happens after STOP/START handling, so guests can still unsubscribe/resubscribe even after the wedding.

4. **Localized Messages**: Uses the guest's saved language preference for the thank you message. Falls back to English for guests who never completed onboarding.

5. **Simple Text Response**: Post-wedding messages are sent as plain text (no interactive elements) since there's no menu to show.

## Testing Notes

### Manual Testing

1. **Test with environment variable:**
   ```bash
   # Enable post-wedding mode
   POST_WEDDING_MODE=enabled npm run dev

   # Send any message to the bot
   # Expected: Thank you message in your language (or English if not onboarded)

   # Normal mode (default - no env var needed)
   npm run dev
   ```

2. **STOP/START after wedding:**
   - Set `POST_WEDDING_MODE=enabled`
   - Send "STOP" → Should receive unsubscribe confirmation
   - Send "START" → Should receive language selection (if not onboarded) or menu

3. **Multi-language:**
   - Test with guests who selected Hindi or Punjabi
   - Verify thank you message appears in their language

### Test Script

```bash
# Build and start with post-wedding mode enabled
npm run build
POST_WEDDING_MODE=enabled npm run dev

# In another terminal, send test webhook (or use WhatsApp)
```

## i18n Keys Used

| Key | Purpose |
|-----|---------|
| `postWedding.thankYou` | Thank you message shown after wedding (available in EN, HI, PA) |

## Environment Variable Reference

| Variable | Values | Description |
|----------|--------|-------------|
| `POST_WEDDING_MODE` | `enabled` | Activate post-wedding mode |
| | unset/other | Bot runs normally (default) |

## Dependencies for Future PRs

- **PR-12 (Admin)**: No dependencies - this is standalone functionality
- Future: Could add admin UI toggle for POST_WEDDING_MODE

## Known Limitations

1. **No Partial Access**: Once post-wedding mode is active, ALL features are hidden. Guests cannot view venues or contacts even if they might need them for post-wedding queries. Future enhancement: Add post-wedding menu with photos, contacts, etc.

2. **No Gradual Transition**: The switch is immediate - there's no "winding down" period where some features remain available.

## Acceptance Criteria Checklist

- [x] Post-wedding mode activates when `POST_WEDDING_MODE=enabled`
- [x] Thank you message shown in post-wedding mode
- [x] Can be easily toggled (via environment variable)
- [x] Messages in user's language with English fallback
- [x] STOP/START commands still work
- [x] TypeScript compiles without errors
- [x] ESLint passes
