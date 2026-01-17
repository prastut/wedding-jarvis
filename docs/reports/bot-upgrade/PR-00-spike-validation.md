# PR-00: WhatsApp Interactive Message Spike

## Summary

Implemented WhatsApp interactive message support (reply buttons and list messages) as a validation spike. Added `sendReplyButtons()` and `sendListMessage()` functions to the WhatsApp client, created test endpoints for manual validation, and updated the webhook handler to parse interactive message replies.

## Files Changed

- `src/services/whatsappClient.ts` - Added `sendReplyButtons()` and `sendListMessage()` functions with TypeScript interfaces for `ReplyButton`, `ListRow`, and `ListSection`
- `src/routes/testInteractive.ts` - Created temporary test endpoints for sending interactive messages
- `src/routes/webhook.ts` - Added handling for `interactive` message type with `button_reply` and `list_reply` parsing
- `src/types/index.ts` - Added `WhatsAppInteractiveReply` and `WhatsAppMessage` interfaces
- `src/index.ts` - Mounted test interactive route at `/test-interactive`

## Key Decisions

1. **Button/List ID Prefixes**: Interactive IDs passed through the system prefixed with `BUTTON:` or `LIST:` for logging clarity while the actual ID is passed separately as `interactiveId`
2. **Character Limit Enforcement**: Functions automatically truncate titles to WhatsApp limits (20 chars for buttons, 24 chars for list items) to prevent API errors
3. **Consistent Error Handling**: Interactive message errors logged with distinct markers (`[INTERACTIVE]`) for easy debugging

## Testing Notes

### Test Endpoints

```bash
# Send language selection buttons (3 buttons)
curl -X POST "http://localhost:3000/test-interactive/buttons?to=YOUR_PHONE"

# Send main menu list (5 items)
curl -X POST "http://localhost:3000/test-interactive/list?to=YOUR_PHONE"

# Send side selection buttons (2 buttons)
curl -X POST "http://localhost:3000/test-interactive/side-selection?to=YOUR_PHONE"
```

### Expected Webhook Payloads

**Button Reply:**
```json
{
  "type": "interactive",
  "interactive": {
    "type": "button_reply",
    "button_reply": {
      "id": "lang_en",
      "title": "English"
    }
  }
}
```

**List Reply:**
```json
{
  "type": "interactive",
  "interactive": {
    "type": "list_reply",
    "list_reply": {
      "id": "menu_schedule",
      "title": "Event Schedule",
      "description": "View all wedding events"
    }
  }
}
```

## WhatsApp Interactive Message Limits

| Component | Limit |
|-----------|-------|
| Reply Buttons | Max 3 buttons |
| Button Title | Max 20 characters |
| List Items | Max 10 total across all sections |
| List Section Title | Max 24 characters |
| List Row Title | Max 24 characters |
| List Row Description | Max 72 characters |
| Body Text | Max 1024 characters |
| Header Text | Max 60 characters |

## Dependencies for Future PRs

- **PR-01**: Can proceed - database migrations don't depend on this
- **PR-02**: Should use the functions created here - finalize and clean up the test route
- **PR-03**: Will use the button/list parsing added to webhook.ts

## Known Limitations

- Test route is temporary and should be removed in PR-02
- Emoji support verified only through test - recommend full device testing
- Hindi/Punjabi character rendering depends on device font support

## Validation Status

**PENDING** - This spike requires manual testing with a real WhatsApp phone before marking as validated. The code structure is complete and TypeScript compiles successfully.

### Validation Checklist

- [ ] Reply buttons render correctly on WhatsApp (iOS)
- [ ] Reply buttons render correctly on WhatsApp (Android)
- [ ] List message renders correctly with "View Options" button
- [ ] Tapping a button sends webhook with `button_reply` type
- [ ] Tapping a list item sends webhook with `list_reply` type
- [ ] Button/list IDs correctly passed back in webhook
- [ ] Hindi text (हिंदी) renders correctly
- [ ] Punjabi text (ਪੰਜਾਬੀ) renders correctly

### Go/No-Go Decision

**Pending validation testing**

Once the above checklist is verified, update this section with:
- Screenshots of messages on device
- Sample webhook payloads received
- Any API quirks discovered
- Final Go/No-Go decision
