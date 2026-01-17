# Plan: Add Image + Text Support to Broadcasts

## Summary

Add the ability to send broadcasts with an image and caption (text). When `image_url` is provided, send an image message with the text as caption; otherwise, send text-only as before.

## API Confirmation

WhatsApp Cloud API supports image messages with captions via the same endpoint:

```json
POST https://graph.facebook.com/v18.0/{phoneNumberId}/messages
{
  "messaging_product": "whatsapp",
  "recipient_type": "individual",
  "to": "PHONE_NUMBER",
  "type": "image",
  "image": {
    "link": "https://example.com/image.jpg",
    "caption": "Message text"
  }
}
```

**Constraints:**
- Supported formats: JPEG, PNG, WEBP
- Max size: 5MB
- Caption: 1-3000 characters
- Image URL must be publicly accessible (HTTPS)

## Changes Required

### 1. WhatsApp Client - Add `sendImageMessage()`

**File:** `src/services/whatsappClient.ts`

Add new function to send image with caption using WhatsApp Cloud API:

```typescript
export interface SendImageMessageOptions {
  to: string;
  imageUrl: string;
  caption?: string;
}

export async function sendImageMessage(options: SendImageMessageOptions): Promise<WhatsAppSendResponse> {
  // POST to WhatsApp API with type: 'image', image: { link, caption }
}
```

### 2. Database Migration - Add `image_url` Column

**File:** `src/db/migrations/008_broadcast_image.sql`

```sql
ALTER TABLE broadcasts ADD COLUMN image_url TEXT;
```

### 3. Update Broadcast Type

**File:** `src/types/index.ts` (line ~85)

Add `image_url: string | null` to Broadcast interface.

### 4. Update Broadcaster Service

**File:** `src/services/broadcaster.ts`

- Import `sendImageMessage` from whatsappClient
- In `sendBroadcast()`, check if `broadcast.image_url` exists:
  - If yes: call `sendImageMessage({ to, imageUrl, caption: messageText })`
  - If no: call `sendTextMessage({ to, text: messageText })` (current behavior)

### 5. Update Admin API

**File:** `src/routes/admin/broadcasts.ts`

- **POST `/api/admin/broadcasts`** (line 66): Accept `image_url` in request body, save to DB
- **PATCH `/api/admin/broadcasts/:id`** (line 102): Accept `image_url` updates

### 6. Update Admin Panel

**File:** `admin-panel/src/api/client.ts`
- Add `image_url?: string` to `BroadcastFormData` interface (line 105)

**File:** `admin-panel/src/pages/Broadcasts.tsx`
- Add `image_url` field to `formData` state (line 18)
- Add image URL input field in the form (after topic input, ~line 288)
- Update `startEdit()` to include `image_url` (line 199)
- Update `cancelEdit()` to reset `image_url` (line 211)
- Show image preview in broadcast list/preview modal

## Files to Modify

| File | Change |
|------|--------|
| `src/services/whatsappClient.ts` | Add `sendImageMessage()` function |
| `src/db/migrations/008_broadcast_image.sql` | New file - add column |
| `src/types/index.ts` | Add `image_url` to Broadcast type |
| `src/services/broadcaster.ts` | Use image message when URL present |
| `src/routes/admin/broadcasts.ts` | Accept `image_url` in API |
| `admin-panel/src/api/client.ts` | Add `image_url` to form type |
| `admin-panel/src/pages/Broadcasts.tsx` | Add image URL input |

## Verification

1. Run `npx tsc --noEmit` to verify TypeScript compiles
2. Run `npm run lint` to check for lint errors
3. Run the migration on Supabase
4. Test in admin panel:
   - Create broadcast with image URL
   - Send to test phone number
   - Verify image + caption received on WhatsApp
