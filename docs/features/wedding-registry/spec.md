# Wedding Registry Feature Specification

---

# Part 1: What We're Building

This section explains the feature in plain language. Read this to understand what guests and admins will experience.

---

## The Big Picture

We're adding a **gift wishlist** to the wedding app. Guests can see what gifts the couple wants and claim items they plan to buy. The couple can see who claimed what.

**Two interfaces:**
1. **Guest-facing website** (`/wishlist`) - guests browse and claim gifts
2. **Admin panel** - bride/groom manage the gift list and see claims

---

## How It Works for Guests

### Accessing the Wishlist
- Guest messages the bot and selects "Gift Wishlist" from the menu
- Bot sends them a **personalized link** with their phone number embedded
- They tap the link and immediately see the gift list - **no login needed**

### Browsing & Claiming
- Guests see a list of gifts with name, description, price (if shown), and image (if added)
- Each gift has a "Claim" button
- **Claim Confirmation:** To prevent impulsive claiming, guests must type a confirmation phrase before claiming
  - UI shows: `Type this to confirm: I bought [FirstWord]` (e.g., "I bought KitchenAid")
  - Uses only the first word of the item name for easier mobile typing
  - Case-insensitive matching
  - Claim button stays disabled until exact phrase is entered
- Once claimed, the item shows as "taken" to other guests (but they don't see WHO claimed it)
- Guest can **unclaim** anytime if they change their mind
- Some items may have a link to where to buy it (Amazon, etc.)

### Cash Gifts
- At the bottom, there's a UPI address displayed for guests who prefer to give cash
- No tracking - just "here's the UPI if you want to send money"

### Language
- The wishlist shows in the guest's preferred language (English, Hindi, or Punjabi)
- Same language they selected when they first messaged the bot

---

## How It Works for Bride & Groom (Admin Panel)

### Setting Up the Wishlist
- Add gift items with:
  - Name and description (in all 3 languages)
  - Price (optional - choose whether to show it)
  - Image URL (paste a link to product image)
  - Purchase link (optional)
- Can **import gifts from a spreadsheet** (CSV) for quick setup
- Set the UPI address for cash gifts

### Viewing Claims
- See all claimed items with guest name, phone, and claim date
- **Release** a claim if someone isn't going to buy (puts item back as available)

### Registry Controls
- Open/close the wishlist manually

---

## Key Decisions

| Question | Decision |
|----------|----------|
| How do guests access it? | **Personalized link from bot** - phone number in URL |
| Can guests see who claimed items? | **No** - anonymous to guests, only admins see |
| What happens to claimed items? | **Stay visible** but marked as "taken" |
| Can someone unclaim? | **Yes, freely** |
| How is cash handled? | **Just show UPI address** - no tracking |
| How do admins know about claims? | **Check the admin panel** - no notifications |
| What languages? | **All 3** - English, Hindi, Punjabi (matches rest of app) |
| How to prevent impulsive claims? | **Type-to-confirm** - guest types "I bought [FirstWord]" before claiming |

---

## What Guests See

**Available Gift:**
- Name, description, price (if shown), image (if any)
- "Claim This Gift" button
- Link to buy (if provided)

**Claimed Gift (by someone else):**
- Same info but grayed out
- Shows "Claimed" badge
- No action available

**Claimed Gift (by current guest):**
- Shows "You claimed this"
- "Unclaim" button

**Cash Section:**
- UPI address with copy button
- QR code

---

## Starting Gift List (Mock Data)

We'll seed these items:

| Gift | Price | Notes |
|------|-------|-------|
| Dyson V15 Vacuum | ₹52,000 | |
| King Size Bedding Set | ₹8,500 | |
| Smart LED TV 55" | ₹45,000 | |
| Aromatherapy Diffuser | ₹2,500 | |
| KitchenAid Stand Mixer | ₹35,000 | |
| Instant Pot Duo | ₹9,500 | |
| Nespresso Machine | ₹15,000 | |
| Premium Cookware Set | ₹12,000 | |
| Air Fryer | ₹6,500 | |
| Cooking Class for Two | ₹5,000 | Experience |
| Spa Day Package | ₹8,000 | Experience |
| Weekend Getaway Voucher | ₹25,000 | Experience |

---

# V1 Scope (Simple Version)

This is what we're building first.

### Guest Features
- Personalized link from bot (phone in URL, no login)
- View flat list of gifts (no categories)
- Claim / unclaim gifts
- See which items are taken (but not by whom)
- View UPI address for cash gifts
- Multi-language support (EN/HI/PA)

### Admin Features
- Add/edit/delete gift items (with 3-language fields)
- Image via URL paste
- Optional price display per item
- Optional purchase links
- CSV import for bulk setup
- View all claims with guest details
- Release claims (put item back as available)
- Open/close registry toggle
- Set UPI address

### What's NOT in V1
- No image upload (URL paste only)
- No categories (flat list only)
- No group gifts / multiple contributors
- No fund contribution tracking
- No notifications (WhatsApp or email)
- No CSV export
- No claim limits or guidance messages

---

# V2 Scope (Future Upgrades)

Features to add after V1 is working.

### Image Upload
- Drag-drop or paste images directly
- Store in Supabase Storage
- Replaces URL-only approach

### Categories
- Organize gifts into sections (Kitchen, Home, Experiences, etc.)
- Drag-to-reorder categories
- Filter/tab navigation for guests

### Group Gifts
- Allow multiple people to contribute to expensive items
- Progress indicator ("3 of 5 contributors")
- Admin sees all contributor names

### Fund Tracking
- Guests can mark "I've contributed" after UPI transfer
- Optional amount field (self-reported)
- Progress bar toward target amount

### Notifications
- WhatsApp message to couple when someone claims
- Email notifications
- Configurable notification preferences

### Secure Authentication
- Token-based links instead of phone in URL
- OTP verification option

### Additional Admin Features
- CSV export (claims list for thank-you notes)
- Soft guidance message after 3+ claims
- Bulk delete / bulk edit

---

## Open Questions

1. What UPI address should be displayed?
2. Any specific gifts to add beyond the mock list?

---
---

# Part 2: Technical Specification

Implementation details for engineering. **Aligned with existing codebase patterns.**

---

## Data Model

### New Tables

#### `registry_items`

Follows same pattern as `events`, `faqs`, `venues` tables.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | Primary key, auto-generated |
| name | text | English name |
| name_hi | text | Hindi name |
| name_pa | text | Punjabi name |
| description | text | English description |
| description_hi | text | Hindi description |
| description_pa | text | Punjabi description |
| price | decimal | Price in INR, null if not shown |
| show_price | boolean | Whether to display price to guests |
| image_url | text | URL to product image |
| external_link | text | Optional link to purchase |
| sort_order | integer | Manual ordering |
| is_available | boolean | Admin can hide items |
| created_at | timestamp | Auto-generated |
| updated_at | timestamp | Auto-updated |

#### `registry_claims`

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | Primary key |
| item_id | uuid | FK to registry_items |
| guest_id | uuid | FK to guests |
| claimed_at | timestamp | |

No separate tokens table - guest identified by phone in URL, matched against `guests` table.

### Configuration

UPI address and registry status stored as environment variables (matches existing pattern):

```
REGISTRY_UPI_ADDRESS=name@upi
REGISTRY_OPEN=true
```

Or add to existing config file if preferred.

---

## Repository Layer

Create `src/repositories/registry.ts` following existing patterns:

```typescript
// Functions to implement:
export async function getAllRegistryItems(): Promise<RegistryItem[]>
export async function getRegistryItemById(id: string): Promise<RegistryItem | null>
export async function createRegistryItem(data: RegistryItemInput): Promise<RegistryItem>
export async function updateRegistryItem(id: string, data: Partial<RegistryItemInput>): Promise<RegistryItem>
export async function deleteRegistryItem(id: string): Promise<void>
export async function getClaimsByItemId(itemId: string): Promise<RegistryClaim[]>
export async function getClaimsByGuestId(guestId: string): Promise<RegistryClaim[]>
export async function createClaim(itemId: string, guestId: string): Promise<RegistryClaim>
export async function deleteClaim(itemId: string, guestId: string): Promise<void>
export async function getAllClaimsWithGuests(): Promise<ClaimWithGuest[]>
```

---

## API Endpoints

### Guest-Facing

Guest identified by `phone` query parameter, matched against `guests` table.

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/registry/items?phone=919xxx` | Get all items with claim status for this guest |
| POST | `/api/registry/claim?phone=919xxx` | Claim an item |
| DELETE | `/api/registry/claim/:itemId?phone=919xxx` | Unclaim an item |
| GET | `/api/registry/settings` | Get UPI address, registry open status |

**Guest validation:**
- Look up guest by phone number in `guests` table
- If not found, return 403 with message "Please message the wedding bot first"
- If registry closed, return 403 with message "Registry is currently closed"

### Admin (Requires Admin Session)

Following exact pattern of `events.ts`, `faqs.ts`, `venues.ts`:

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/registry/items` | List all items |
| GET | `/api/admin/registry/items/:id` | Get single item |
| POST | `/api/admin/registry/items` | Create item |
| PATCH | `/api/admin/registry/items/:id` | Update item |
| DELETE | `/api/admin/registry/items/:id` | Delete item (check no claims first) |
| POST | `/api/admin/registry/items/reorder` | Reorder items |
| POST | `/api/admin/registry/items/import` | Import from CSV |
| GET | `/api/admin/registry/claims` | Get all claims with guest info |
| DELETE | `/api/admin/registry/claims/:id` | Release a claim |

---

## WhatsApp Bot Integration

Modify existing `menu_gifts` handler in `src/services/botRouter.ts`:

**Current behavior:** Sends static link to `/gifts` page

**New behavior:** Sends personalized link with guest's phone

```typescript
async function sendGiftRegistry(guest: Guest) {
  const language = guest.user_language || 'EN';
  const wishlistUrl = `${config.publicUrl}/wishlist?phone=${encodeURIComponent(guest.phone_number)}`;

  const content = getMessageWithValues('gifts.info', language, {
    giftsLink: wishlistUrl
  });

  await sendContentWithBackButton(guest.phone_number, content, language);
}
```

Update i18n messages if needed for new copy.

---

## Admin Panel

Create `admin-panel/src/pages/Registry.tsx` following exact pattern of `Events.tsx`:

**State:**
```typescript
const [items, setItems] = useState<RegistryItem[]>([]);
const [claims, setClaims] = useState<ClaimWithGuest[]>([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState('');
const [showForm, setShowForm] = useState(false);
const [formData, setFormData] = useState<RegistryItemFormData>(EMPTY_FORM);
const [editingId, setEditingId] = useState<string | null>(null);
const [activeTab, setActiveTab] = useState<'items' | 'claims'>('items');
```

**Form fields:**
- name, name_hi, name_pa (text inputs)
- description, description_hi, description_pa (textareas)
- price (number input)
- show_price (checkbox)
- image_url (text input for URL)
- external_link (text input)
- sort_order (number input)

**Two tabs:**
1. **Items** - CRUD table for gift items
2. **Claims** - Read-only table showing who claimed what, with "Release" button

**Add to:**
- `admin-panel/src/App.tsx` - Add route
- `admin-panel/src/components/Sidebar.tsx` - Add nav item
- `admin-panel/src/api/client.ts` - Add API functions

---

## Guest Web Page

Create new guest-facing page at `/wishlist`.

**Note:** This is NEW infrastructure - currently no guest web pages exist (only admin panel). Options:

1. **Add to admin-panel build** - Create separate entry point/route that doesn't require admin auth
2. **Create separate static page** - Simple HTML/JS served from `/public`
3. **Create new Vite app** - Separate guest-facing SPA

Recommend option 1 or 2 for simplicity. The page needs:

- Read `phone` from URL query param
- Fetch registry items from API
- Display items with claim/unclaim buttons
- Show UPI section at bottom
- Mobile-friendly responsive design
- Support 3 languages (detect from guest's preference via API)

---

## CSV Import Format

Columns: `name,name_hi,name_pa,description,description_hi,description_pa,price,external_link`

```csv
name,name_hi,name_pa,description,description_hi,description_pa,price,external_link
KitchenAid Mixer,किचनएड मिक्सर,ਕਿਚਨਏਡ ਮਿਕਸਰ,Professional stand mixer,प्रोफेशनल स्टैंड मिक्सर,ਪ੍ਰੋਫੈਸ਼ਨਲ ਸਟੈਂਡ ਮਿਕਸਰ,35000,https://amazon.in/...
```

- Price empty = don't show price
- Hindi/Punjabi fields can be empty (will show English as fallback)

---

## Implementation Phases

### Phase 1: Backend
- Add types to `src/types/index.ts`
- Create `src/repositories/registry.ts`
- Create `src/routes/admin/registry.ts`
- Add guest-facing routes `src/routes/registry.ts`
- Database migration for new tables

### Phase 2: Admin Panel
- Create `Registry.tsx` page (items + claims tabs)
- Add to sidebar navigation
- Add API client functions
- CSV import functionality

### Phase 3: Guest Web Page
- Create `/wishlist` page
- Phone-based guest lookup
- Item display with claim/unclaim
- UPI display section
- Mobile-responsive design

### Phase 4: Bot Integration
- Update `sendGiftRegistry()` to include personalized link
- Update i18n messages if needed
