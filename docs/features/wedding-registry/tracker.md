# Wedding Registry — Project Tracker

## Agent Prompt

```
You are implementing the Wedding Registry feature. Before writing any code:

1. Read the master spec: `docs/features/wedding-registry/spec.md`
2. Read the project tracker: `docs/features/wedding-registry/tracker.md`
3. Read ALL completed reports in `docs/features/wedding-registry/reports/` in sequential order
4. Read `CLAUDE.md` for codebase conventions

I want you to implement the next PR.

After reading the context, implement the PR according to its specification in the tracker. Follow the existing code patterns in the codebase.

When complete, generate a report file at `docs/features/wedding-registry/reports/PR-{XX}-{slug}.md` using the template in the tracker, then update the Completion Log table in `docs/features/wedding-registry/tracker.md`.
```

---

## Overview

This tracker manages the implementation of the Wedding Registry (Gift Wishlist) feature. Guests can browse gifts via a personalized link and claim items they plan to buy. Admins manage the gift list and see who claimed what.

**Master Spec:** `docs/features/wedding-registry/spec.md`
**Reports Directory:** `docs/features/wedding-registry/reports/`

---

## V1 Scope Summary

**Guest Features:**
- Personalized link from bot (phone in URL, no login)
- View flat list of gifts
- Claim / unclaim gifts
- See which items are taken (but not by whom)
- View UPI address for cash gifts
- Multi-language support (EN/HI/PA)

**Admin Features:**
- Add/edit/delete gift items (with 3-language fields)
- Image via URL paste
- Optional price display per item
- Optional purchase links
- CSV import for bulk setup
- View all claims with guest details
- Release claims
- Open/close registry toggle
- Set UPI address

**NOT in V1:** Image upload, categories, group gifts, notifications, CSV export

---

## How This Tracker Works

### For AI Agents Starting a New PR

1. Read `docs/features/wedding-registry/spec.md` (master spec)
2. Read this tracker to find your assigned PR
3. Read all completed reports in `docs/features/wedding-registry/reports/` (chronological order)
4. Implement the PR according to its scope
5. Generate a completion report using the template below

### Report Template

After completing a PR, generate `docs/features/wedding-registry/reports/PR-{number}-{slug}.md`:

```markdown
# PR-{number}: {Title}

## Summary
{2-3 sentences describing what was built}

## Files Changed
- `path/to/file.ts` - {brief description}
- `path/to/file.tsx` - {brief description}

## Key Decisions
- {Decision 1 and rationale}
- {Decision 2 and rationale}

## Testing Notes
- {How to test this feature}
- {Edge cases handled}

## Dependencies for Future PRs
- {What future PRs can now be built}
- {What this PR unlocks}

## Known Limitations
- {Intentional scope cuts}
- {Technical debt introduced}
```

---

## Current State Summary

**Codebase Status:**
- Gift registry menu option exists (`menu_gifts` in botRouter.ts)
- Currently sends static link to `/gifts` page
- No database tables for registry items
- No admin UI for registry management
- No guest-facing interactive web page

**Existing Patterns to Follow:**
- Repository layer: `src/repositories/*.ts`
- Admin routes: `src/routes/admin/*.ts`
- Admin pages: `admin-panel/src/pages/*.tsx`
- Types: `src/types/index.ts`
- Multi-language fields: `name`, `name_hi`, `name_pa` pattern
- API client: `admin-panel/src/api/client.ts`

---

## Pull Request Plan

### Phase 1: Backend Foundation

| PR | Title | Status | Dependencies | Est. Scope |
|----|-------|--------|--------------|------------|
| PR-01 | Database Schema & Types | Complete | None | Small |
| PR-02 | Registry Repository | Complete | PR-01 | Medium |
| PR-03 | Admin API Routes | Complete | PR-02 | Medium |
| PR-04 | Guest API Routes | Complete | PR-02 | Small |

### Phase 2: Admin Panel

| PR | Title | Status | Dependencies | Est. Scope |
|----|-------|--------|--------------|------------|
| PR-05 | Admin API Client | Complete | PR-03 | Small |
| PR-06 | Registry Items Page | Complete | PR-05 | Large |
| PR-07 | Registry Claims Page | Complete | PR-05 | Medium |
| PR-08 | CSV Import Feature | Complete | PR-06 | Medium |

### Phase 3: Guest Web Page

| PR | Title | Status | Dependencies | Est. Scope |
|----|-------|--------|--------------|------------|
| PR-09 | Guest Wishlist Page | Complete | PR-04 | Large |
| PR-10 | Claim/Unclaim Flow | Complete | PR-09 | Medium |
| PR-11 | UPI Display Section | Complete | PR-09 | Small |

### Phase 4: Bot Integration

| PR | Title | Status | Dependencies | Est. Scope |
|----|-------|--------|--------------|------------|
| PR-12 | Bot Personalized Link | Complete | PR-09 | Small |

### Phase 5: Seed Data & Polish

| PR | Title | Status | Dependencies | Est. Scope |
|----|-------|--------|--------------|------------|
| PR-13 | Seed Mock Registry Items | Complete | PR-03 | Small |

---

## Detailed PR Specifications

### PR-01: Database Schema & Types

**Goal:** Create database tables and TypeScript types for registry feature

**Scope:**
- Add types to `src/types/index.ts`
- Create Supabase migration for `registry_items` and `registry_claims` tables

**Types to Add:**
```typescript
export interface RegistryItem {
  id: string;
  name: string;
  name_hi: string | null;
  name_pa: string | null;
  description: string | null;
  description_hi: string | null;
  description_pa: string | null;
  price: number | null;
  show_price: boolean;
  image_url: string | null;
  external_link: string | null;
  sort_order: number;
  is_available: boolean;
  created_at: string;
  updated_at: string;
}

export interface RegistryClaim {
  id: string;
  item_id: string;
  guest_id: string;
  claimed_at: string;
}

export interface RegistryItemInput {
  name: string;
  name_hi?: string | null;
  name_pa?: string | null;
  description?: string | null;
  description_hi?: string | null;
  description_pa?: string | null;
  price?: number | null;
  show_price?: boolean;
  image_url?: string | null;
  external_link?: string | null;
  sort_order?: number;
  is_available?: boolean;
}

export interface ClaimWithGuest extends RegistryClaim {
  guest: {
    id: string;
    name: string;
    phone_number: string;
  };
  item: {
    id: string;
    name: string;
  };
}
```

**Migration SQL:**
```sql
-- registry_items table
CREATE TABLE registry_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  name_hi TEXT,
  name_pa TEXT,
  description TEXT,
  description_hi TEXT,
  description_pa TEXT,
  price DECIMAL(10,2),
  show_price BOOLEAN DEFAULT true,
  image_url TEXT,
  external_link TEXT,
  sort_order INTEGER DEFAULT 0,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- registry_claims table
CREATE TABLE registry_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES registry_items(id) ON DELETE CASCADE,
  guest_id UUID NOT NULL REFERENCES guests(id) ON DELETE CASCADE,
  claimed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(item_id, guest_id)
);

-- Indexes
CREATE INDEX idx_registry_items_sort ON registry_items(sort_order);
CREATE INDEX idx_registry_claims_item ON registry_claims(item_id);
CREATE INDEX idx_registry_claims_guest ON registry_claims(guest_id);
```

**Files to Create:**
- `src/db/migrations/XXX_create_registry_tables.sql`

**Files to Modify:**
- `src/types/index.ts`

**Acceptance Criteria:**
- [ ] RegistryItem type defined with all fields
- [ ] RegistryClaim type defined
- [ ] RegistryItemInput type defined for create/update
- [ ] ClaimWithGuest type defined for admin view
- [ ] Migration SQL file created
- [ ] Migration tested against Supabase

---

### PR-02: Registry Repository

**Goal:** Create data access layer for registry items and claims

**Scope:**
- Create `src/repositories/registry.ts`
- Follow existing repository patterns (see `events.ts`, `faqs.ts`)

**Functions to Implement:**
```typescript
// Items
export async function getAllRegistryItems(): Promise<RegistryItem[]>
export async function getAvailableRegistryItems(): Promise<RegistryItem[]>
export async function getRegistryItemById(id: string): Promise<RegistryItem | null>
export async function createRegistryItem(data: RegistryItemInput): Promise<RegistryItem>
export async function updateRegistryItem(id: string, data: Partial<RegistryItemInput>): Promise<RegistryItem>
export async function deleteRegistryItem(id: string): Promise<void>
export async function reorderRegistryItems(orderedIds: string[]): Promise<void>

// Claims
export async function getClaimsByItemId(itemId: string): Promise<RegistryClaim[]>
export async function getClaimsByGuestId(guestId: string): Promise<RegistryClaim[]>
export async function getClaimByItemAndGuest(itemId: string, guestId: string): Promise<RegistryClaim | null>
export async function createClaim(itemId: string, guestId: string): Promise<RegistryClaim>
export async function deleteClaim(claimId: string): Promise<void>
export async function deleteClaimByItemAndGuest(itemId: string, guestId: string): Promise<void>
export async function getAllClaimsWithGuests(): Promise<ClaimWithGuest[]>
export async function isItemClaimed(itemId: string): Promise<boolean>
```

**Files to Create:**
- `src/repositories/registry.ts`

**Acceptance Criteria:**
- [ ] All item CRUD functions implemented
- [ ] All claim functions implemented
- [ ] Uses Supabase client consistently
- [ ] Follows existing repository patterns
- [ ] Handles errors appropriately
- [ ] Includes proper TypeScript types

---

### PR-03: Admin API Routes

**Goal:** Create admin endpoints for managing registry items and claims

**Scope:**
- Create `src/routes/admin/registry.ts`
- Add to `src/routes/admin/index.ts`
- Follow existing admin route patterns

**Endpoints:**
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/registry/items` | List all items |
| GET | `/api/admin/registry/items/:id` | Get single item |
| POST | `/api/admin/registry/items` | Create item |
| PATCH | `/api/admin/registry/items/:id` | Update item |
| DELETE | `/api/admin/registry/items/:id` | Delete item |
| POST | `/api/admin/registry/items/reorder` | Reorder items |
| POST | `/api/admin/registry/items/import` | Import from CSV |
| GET | `/api/admin/registry/claims` | Get all claims with guest info |
| DELETE | `/api/admin/registry/claims/:id` | Release a claim |

**Files to Create:**
- `src/routes/admin/registry.ts`

**Files to Modify:**
- `src/routes/admin/index.ts`

**Acceptance Criteria:**
- [ ] All endpoints implemented
- [ ] Protected by requireAuth middleware
- [ ] Validation on required fields (name)
- [ ] 404 handling for missing items
- [ ] Check for existing claims before deleting item
- [ ] CSV import parses multi-language fields
- [ ] Follows existing route patterns

---

### PR-04: Guest API Routes

**Goal:** Create guest-facing endpoints for viewing and claiming items

**Scope:**
- Create `src/routes/registry.ts`
- Add to main Express app
- Guest identified by phone query parameter

**Endpoints:**
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/registry/items?phone=XXX` | Get items with claim status |
| POST | `/api/registry/claim?phone=XXX` | Claim an item |
| DELETE | `/api/registry/claim/:itemId?phone=XXX` | Unclaim an item |
| GET | `/api/registry/settings` | Get UPI address, open status |

**Guest Validation:**
- Look up guest by phone in `guests` table
- If not found, return 403: "Please message the wedding bot first"
- If registry closed (env var), return 403: "Registry is currently closed"

**Response Format for GET /items:**
```typescript
{
  items: Array<{
    id: string;
    name: string;
    name_hi: string | null;
    name_pa: string | null;
    description: string | null;
    description_hi: string | null;
    description_pa: string | null;
    price: number | null;
    show_price: boolean;
    image_url: string | null;
    external_link: string | null;
    is_claimed: boolean;
    claimed_by_me: boolean;
  }>;
  guest: {
    id: string;
    name: string;
    language: 'EN' | 'HI' | 'PA';
  };
}
```

**Files to Create:**
- `src/routes/registry.ts`

**Files to Modify:**
- `src/index.ts` (add route)

**Acceptance Criteria:**
- [ ] Guest lookup by phone number works
- [ ] Returns 403 for unknown guests
- [ ] Returns 403 when registry closed
- [ ] Items include claim status for current guest
- [ ] Claim creates record, unclaim deletes it
- [ ] Cannot claim already-claimed item (409)
- [ ] Settings endpoint returns UPI and open status

---

### PR-05: Admin API Client

**Goal:** Add registry API functions to admin panel client

**Scope:**
- Add types to admin panel
- Add API functions to client.ts

**Types to Add (admin-panel/src/types/):**
```typescript
export interface RegistryItem { ... }
export interface RegistryClaim { ... }
export interface ClaimWithGuest { ... }
export interface RegistryItemFormData { ... }
```

**API Functions to Add:**
```typescript
// Items
getRegistryItems(): Promise<RegistryItem[]>
getRegistryItem(id: string): Promise<RegistryItem>
createRegistryItem(data: RegistryItemFormData): Promise<RegistryItem>
updateRegistryItem(id: string, data: Partial<RegistryItemFormData>): Promise<RegistryItem>
deleteRegistryItem(id: string): Promise<void>
reorderRegistryItems(orderedIds: string[]): Promise<void>
importRegistryItems(csvFile: File): Promise<{ imported: number }>

// Claims
getRegistryClaims(): Promise<ClaimWithGuest[]>
releaseClaim(claimId: string): Promise<void>
```

**Files to Modify:**
- `admin-panel/src/api/client.ts`

**Files to Create (if types are separate):**
- `admin-panel/src/types/registry.ts`

**Acceptance Criteria:**
- [ ] All API functions added
- [ ] Types match backend
- [ ] Error handling consistent with existing functions
- [ ] CSV import uses FormData

---

### PR-06: Registry Items Page

**Goal:** Create admin page for managing registry items

**Scope:**
- Create `admin-panel/src/pages/Registry.tsx`
- Follow existing page patterns (Events.tsx)
- Add to sidebar navigation

**Page Features:**
- Items table with: sort order, name, price, image preview, status, actions
- Add/Edit form with all fields
- 3-language input groups (name, description)
- Delete with confirmation
- Drag to reorder (optional, can use sort_order input)

**Form Fields:**
- name, name_hi, name_pa (text)
- description, description_hi, description_pa (textarea)
- price (number, optional)
- show_price (checkbox)
- image_url (text)
- external_link (text)
- sort_order (number)
- is_available (checkbox)

**Files to Create:**
- `admin-panel/src/pages/Registry.tsx`
- `admin-panel/src/pages/Registry.css` (if needed)

**Files to Modify:**
- `admin-panel/src/App.tsx` (add route)
- `admin-panel/src/components/Sidebar.tsx` (add nav item)

**Acceptance Criteria:**
- [ ] Items table displays all items
- [ ] Add new item works
- [ ] Edit existing item works
- [ ] Delete with confirmation works
- [ ] 3-language fields displayed in logical groups
- [ ] Image URL shows preview if valid
- [ ] Sidebar shows "Registry" link
- [ ] Route `/registry` works

---

### PR-07: Registry Claims Page

**Goal:** Add claims tab/section to registry admin page

**Scope:**
- Add claims view to Registry.tsx (tab or separate section)
- Show claims with guest info
- Release claim action

**Claims Table Columns:**
- Item name
- Guest name
- Guest phone
- Claimed date
- Release button

**Files to Modify:**
- `admin-panel/src/pages/Registry.tsx`

**Acceptance Criteria:**
- [ ] Claims section/tab visible
- [ ] Shows all claims with guest details
- [ ] Release button removes claim
- [ ] Confirmation before release
- [ ] Refreshes list after release

---

### PR-08: CSV Import Feature

**Goal:** Add CSV import functionality for bulk item creation

**Scope:**
- Add import button to Registry items page
- File upload handling
- Parse CSV and create items

**CSV Format:**
```
name,name_hi,name_pa,description,description_hi,description_pa,price,external_link
```

**UI:**
- "Import CSV" button in toolbar
- File picker dialog
- Success/error feedback
- Refresh list after import

**Files to Modify:**
- `admin-panel/src/pages/Registry.tsx`

**Acceptance Criteria:**
- [ ] Import button visible in toolbar
- [ ] File picker accepts .csv files
- [ ] Parses all columns correctly
- [ ] Handles empty optional fields
- [ ] Shows success count after import
- [ ] Shows error if import fails
- [ ] Refreshes item list after import

---

### PR-09: Guest Wishlist Page

**Goal:** Create guest-facing wishlist web page

**Scope:**
- Create page at `/wishlist`
- Read phone from URL query param
- Fetch and display items
- Mobile-friendly responsive design
- Multi-language support

**Implementation Options:**
1. Add to admin-panel as public route (no auth)
2. Create separate static HTML/JS in `/public`

**Recommend Option 1:** Add to admin-panel with conditional auth

**Page Structure:**
- Header: "Wedding Wishlist" title
- Guest greeting: "Hi {name}!"
- Items list (cards or rows)
- Each item shows: image, name, description, price, claim button
- Claimed items show "Claimed" badge (grayed out)
- Own claims show "You claimed this" + Unclaim button

**Files to Create:**
- `admin-panel/src/pages/Wishlist.tsx`
- `admin-panel/src/pages/Wishlist.css`

**Files to Modify:**
- `admin-panel/src/App.tsx` (add public route)

**Acceptance Criteria:**
- [ ] Page loads at `/wishlist?phone=XXX`
- [ ] Shows error if phone not found
- [ ] Shows error if registry closed
- [ ] Displays items in guest's language
- [ ] Items show correct claim status
- [ ] Mobile responsive design
- [ ] No admin navigation shown

---

### PR-10: Claim/Unclaim Flow

**Goal:** Implement claim and unclaim functionality on guest page

**Scope:**
- Claim button on available items
- Unclaim button on own claims
- Optimistic UI updates
- Error handling

**Behavior:**
- Tap "Claim" → item immediately shows as "You claimed this"
- API call in background
- If fails, revert UI and show error
- Tap "Unclaim" → item returns to available
- Cannot claim already-claimed items

**Files to Modify:**
- `admin-panel/src/pages/Wishlist.tsx`

**Acceptance Criteria:**
- [ ] Claim button works
- [ ] Unclaim button works
- [ ] Optimistic UI update
- [ ] Error handling with revert
- [ ] 409 handling for race condition
- [ ] Loading state on buttons

---

### PR-11: UPI Display Section

**Goal:** Add UPI cash gift section to wishlist page

**Scope:**
- Section at bottom of wishlist
- Display UPI address
- Copy button
- QR code generation

**UI:**
- Divider line
- "Prefer to give cash?" heading
- UPI address with copy icon
- QR code (use library or static image)

**Files to Modify:**
- `admin-panel/src/pages/Wishlist.tsx`
- `admin-panel/src/pages/Wishlist.css`

**Acceptance Criteria:**
- [ ] UPI section visible at bottom
- [ ] UPI address displayed
- [ ] Copy button works
- [ ] QR code displays (if feasible)
- [ ] Only shows if UPI address configured

---

### PR-12: Bot Personalized Link

**Goal:** Update bot to send personalized wishlist link

**Scope:**
- Modify `sendGiftRegistry()` in botRouter.ts
- Include guest's phone in URL
- Update i18n messages if needed

**Current Code:**
```typescript
async function sendGiftRegistry(guest: Guest) {
  const language = guest.user_language || 'EN';
  const giftsLink = getGiftsPageUrl(language);
  // ...
}
```

**New Code:**
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

**Files to Modify:**
- `src/services/botRouter.ts`

**Acceptance Criteria:**
- [ ] Link includes guest's phone number
- [ ] Phone is URL encoded
- [ ] Message still uses i18n
- [ ] Back button still works

---

### PR-13: Seed Mock Registry Items

**Goal:** Create seed script with mock gift items

**Scope:**
- Add registry items to existing seed script
- Include variety of items with prices
- All 3 languages for some items

**Mock Items:**
| Name | Price | Category |
|------|-------|----------|
| Dyson V15 Vacuum | ₹52,000 | Home |
| King Size Bedding Set | ₹8,500 | Home |
| Smart LED TV 55" | ₹45,000 | Home |
| Aromatherapy Diffuser | ₹2,500 | Home |
| KitchenAid Stand Mixer | ₹35,000 | Kitchen |
| Instant Pot Duo | ₹9,500 | Kitchen |
| Nespresso Machine | ₹15,000 | Kitchen |
| Premium Cookware Set | ₹12,000 | Kitchen |
| Air Fryer | ₹6,500 | Kitchen |
| Cooking Class for Two | ₹5,000 | Experience |
| Spa Day Package | ₹8,000 | Experience |
| Weekend Getaway Voucher | ₹25,000 | Experience |

**Files to Modify:**
- `src/db/seed.ts` (or create `src/db/seedRegistry.ts`)

**Acceptance Criteria:**
- [ ] All 12 mock items seeded
- [ ] Some items have Hindi/Punjabi translations
- [ ] Prices set correctly
- [ ] Sort order set sequentially
- [ ] Can run seed without duplicating

---

## Completion Log

| PR | Completed | Report File |
|----|-----------|-------------|
| PR-01 | 2026-01-22 | [PR-01-database-schema-types.md](reports/PR-01-database-schema-types.md) |
| PR-02 | 2026-01-22 | [PR-02-registry-repository.md](reports/PR-02-registry-repository.md) |
| PR-03 | 2026-01-22 | [PR-03-admin-api-routes.md](reports/PR-03-admin-api-routes.md) |
| PR-04 | 2026-01-22 | [PR-04-guest-api-routes.md](reports/PR-04-guest-api-routes.md) |
| PR-05 | 2026-01-22 | [PR-05-admin-api-client.md](reports/PR-05-admin-api-client.md) |
| PR-06 | 2026-01-22 | [PR-06-registry-items-page.md](reports/PR-06-registry-items-page.md) |
| PR-07 | 2026-01-22 | [PR-07-registry-claims-page.md](reports/PR-07-registry-claims-page.md) |
| PR-08 | 2026-01-22 | [PR-08-csv-import-feature.md](reports/PR-08-csv-import-feature.md) |
| PR-09 | 2026-01-22 | [PR-09-guest-wishlist-page.md](reports/PR-09-guest-wishlist-page.md) |
| PR-10 | 2026-01-22 | [PR-10-claim-unclaim-flow.md](reports/PR-10-claim-unclaim-flow.md) |
| PR-11 | 2026-01-22 | [PR-11-upi-display-section.md](reports/PR-11-upi-display-section.md) |
| PR-12 | 2026-01-22 | [PR-12-bot-personalized-link.md](reports/PR-12-bot-personalized-link.md) |
| PR-13 | 2026-01-22 | [PR-13-seed-mock-registry-items.md](reports/PR-13-seed-mock-registry-items.md) |

---

## Quick Reference

### File Structure (After All PRs)

```
src/
├── types/
│   └── index.ts                    # PR-01 (modified)
├── repositories/
│   └── registry.ts                 # PR-02 (new)
├── routes/
│   ├── admin/
│   │   ├── index.ts                # PR-03 (modified)
│   │   └── registry.ts             # PR-03 (new)
│   └── registry.ts                 # PR-04 (new)
├── services/
│   └── botRouter.ts                # PR-12 (modified)
├── db/
│   ├── migrations/
│   │   └── XXX_create_registry.sql # PR-01 (new)
│   └── seed.ts                     # PR-13 (modified)
└── index.ts                        # PR-04 (modified)

admin-panel/src/
├── api/
│   └── client.ts                   # PR-05 (modified)
├── pages/
│   ├── Registry.tsx                # PR-06 (new)
│   ├── Registry.css                # PR-06 (new)
│   ├── Wishlist.tsx                # PR-09 (new)
│   └── Wishlist.css                # PR-09 (new)
├── components/
│   └── Sidebar.tsx                 # PR-06 (modified)
└── App.tsx                         # PR-06, PR-09 (modified)
```

### Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `REGISTRY_UPI_ADDRESS` | UPI address for cash gifts | `name@upi` |
| `REGISTRY_OPEN` | Whether registry accepts claims | `true` |

### API Endpoints Summary

**Admin (requires auth):**
- `GET/POST /api/admin/registry/items`
- `GET/PATCH/DELETE /api/admin/registry/items/:id`
- `POST /api/admin/registry/items/reorder`
- `POST /api/admin/registry/items/import`
- `GET /api/admin/registry/claims`
- `DELETE /api/admin/registry/claims/:id`

**Guest (phone in query):**
- `GET /api/registry/items?phone=XXX`
- `POST /api/registry/claim?phone=XXX`
- `DELETE /api/registry/claim/:itemId?phone=XXX`
- `GET /api/registry/settings`
