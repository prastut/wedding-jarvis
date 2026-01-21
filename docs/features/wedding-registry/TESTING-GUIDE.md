# Wedding Registry - Visual Testing Guide

This guide walks you through testing the registry feature as a user. Follow along to see everything that was built!

---

## Prerequisites

### 1. Start the Backend Server
```bash
npm run dev
```
This starts the Express server on `http://localhost:3000`

### 2. Start the Admin Panel (separate terminal)
```bash
cd admin-panel && npm run dev
```
This starts the Vite dev server on `http://localhost:5173`

### 3. Make sure the database migration has been run
The migration file is at `src/db/migrations/009_create_registry_tables.sql`. Run it against your Supabase database if not already done.

---

## Visual Tour: Admin Panel

### Step 1: Login to Admin Panel

1. Open `http://localhost:5173` in your browser
2. Login with your admin credentials
3. You should see the Dashboard

### Step 2: Find the Gift Registry in Sidebar

Look at the left sidebar under "Edit Content" section:

```
Edit Content
├── Events
├── Venues
├── FAQs
├── Contacts
├── Dress Code
└── Gift Registry  ← NEW! Click this
```

### Step 3: Registry Items Tab (Default View)

You'll see the Registry page with two tabs:

```
┌─────────────────────────────────────────────────────────┐
│  Gift Registry                         [New Item]       │
├─────────────────────────────────────────────────────────┤
│  [Items (0)]  [Claims (0)]                              │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │ Order │ Image │ Name │ Price │ Status │ Actions │   │
│  ├─────────────────────────────────────────────────┤   │
│  │              No items yet                        │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Step 4: Add Your First Gift Item

1. Click **[New Item]** button
2. A form appears with these fields:

```
┌─────────────────────────────────────────────────────────┐
│  New Item                                               │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐       │
│  │Name (EN) *  │ │Name (Hindi) │ │Name (Punjabi)│       │
│  │[KitchenAid ]│ │[किचनएड     ]│ │[ਕਿਚਨਏਡ     ]│       │
│  └─────────────┘ └─────────────┘ └─────────────┘       │
│                                                         │
│  ┌───────────────────────────────────────────────┐     │
│  │ Description (English)                          │     │
│  │ [Professional stand mixer for baking lovers  ]│     │
│  └───────────────────────────────────────────────┘     │
│                                                         │
│  ┌─────────────────┐ ┌─────────────────┐               │
│  │ Description (HI) │ │ Description (PA) │               │
│  └─────────────────┘ └─────────────────┘               │
│                                                         │
│  ┌─────────────┐ ┌─────────────┐                       │
│  │Price (INR)  │ │Sort Order   │                       │
│  │[35000      ]│ │[1          ]│                       │
│  └─────────────┘ └─────────────┘                       │
│                                                         │
│  [✓] Show price to guests                              │
│  [✓] Available (visible to guests)                     │
│                                                         │
│  ┌─────────────────────────────────────────────┐       │
│  │ Image URL                                    │       │
│  │ [https://example.com/kitchenaid.jpg        ]│       │
│  └─────────────────────────────────────────────┘       │
│                                                         │
│  ┌─────────────────────────────────────────────┐       │
│  │ Purchase Link                                │       │
│  │ [https://amazon.in/kitchenaid-mixer        ]│       │
│  └─────────────────────────────────────────────┘       │
│                                                         │
│  ┌──────────────────┐                                  │
│  │ Image Preview    │  ← Shows if URL is valid!       │
│  │ ┌──────────────┐ │                                  │
│  │ │   [IMAGE]    │ │                                  │
│  │ └──────────────┘ │                                  │
│  └──────────────────┘                                  │
│                                                         │
│              [Cancel]  [Create Item]                    │
└─────────────────────────────────────────────────────────┘
```

3. Fill in the details and click **[Create Item]**

### Step 5: View Items in Table

After adding items, the table shows:

```
┌───────┬───────┬──────────────────────┬─────────┬───────────┬─────────────┐
│ Order │ Image │ Name                 │ Price   │ Status    │ Actions     │
├───────┼───────┼──────────────────────┼─────────┼───────────┼─────────────┤
│   1   │ [img] │ KitchenAid Mixer     │ ₹35,000 │ Available │ [Edit][Del] │
│       │       │ किचनएड मिक्सर         │         │   ●       │             │
│       │       │ Professional stand...│         │           │             │
├───────┼───────┼──────────────────────┼─────────┼───────────┼─────────────┤
│   2   │ [img] │ Dyson Vacuum         │ ₹52,000 │ Available │ [Edit][Del] │
│       │       │ डायसन वैक्यूम          │         │   ●       │             │
├───────┼───────┼──────────────────────┼─────────┼───────────┼─────────────┤
│   3   │   -   │ Spa Day Package      │ Hidden  │ Available │ [Edit][Del] │
│       │       │ Relaxing spa day...  │         │   ●       │             │
└───────┴───────┴──────────────────────┴─────────┴───────────┴─────────────┘
```

**What you see:**
- **Order**: Sort order number
- **Image**: Thumbnail (50x50) or "-" if no image
- **Name**: English name + Hindi translation + description preview
- **Price**: Formatted as ₹XX,XXX or "Hidden" if show_price is off
- **Status**: Green "Available" badge or gray "Hidden" badge
- **Actions**: Edit and Delete buttons

### Step 6: Edit an Item

1. Click **[Edit]** on any row
2. The form opens pre-filled with that item's data
3. Make changes and click **[Update Item]**

### Step 7: Delete an Item

1. Click **[Delete]** on any row
2. Confirm in the dialog: "Are you sure you want to delete this item?"
3. Item is removed (unless it has claims - then it's blocked!)

---

## Visual Tour: Claims Tab

### Step 1: Switch to Claims Tab

Click the **[Claims (X)]** tab to see claims:

```
┌─────────────────────────────────────────────────────────┐
│  Gift Registry                                          │
├─────────────────────────────────────────────────────────┤
│  [Items (5)]  [Claims (2)]  ← Click Claims              │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌────────────────┬────────────┬──────────────┬───────┐│
│  │ Item           │ Guest Name │ Guest Phone  │Claimed││
│  ├────────────────┼────────────┼──────────────┼───────┤│
│  │ KitchenAid     │ Rahul S.   │ 919876543210 │ Jan 22││
│  │ Mixer          │            │              │ 2:30pm││
│  ├────────────────┼────────────┼──────────────┼───────┤│
│  │ Dyson Vacuum   │ Unknown    │ 919123456789 │ Jan 21││
│  │                │ (gray)     │              │ 5:45pm││
│  └────────────────┴────────────┴──────────────┴───────┘│
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**What you see:**
- **Item**: Name of the claimed gift
- **Guest Name**: Name from guests table (or "Unknown" in gray if not set)
- **Guest Phone**: Full phone number
- **Claimed Date**: When they claimed it
- **Actions**: Release button

### Step 2: Release a Claim

1. Click **[Release]** on a claim
2. Confirm: "Are you sure you want to release the claim on "KitchenAid Mixer"? This will make the item available again."
3. Claim is removed, item becomes available for others

---

## Testing the Full Flow (End-to-End)

### Backend API Testing (with curl)

**1. Check registry settings:**
```bash
curl http://localhost:3000/api/registry/settings
```
Response:
```json
{
  "isOpen": true,
  "upiAddress": "name@upi"
}
```

**2. Get items as a guest (need a valid phone in guests table):**
```bash
curl "http://localhost:3000/api/registry/items?phone=919876543210"
```
Response:
```json
{
  "items": [
    {
      "id": "uuid-here",
      "name": "KitchenAid Mixer",
      "name_hi": "किचनएड मिक्सर",
      "price": 35000,
      "show_price": true,
      "is_claimed": false,
      "claimed_by_me": false
    }
  ],
  "guest": {
    "id": "guest-uuid",
    "name": "Rahul",
    "language": "EN"
  }
}
```

**3. Claim an item:**
```bash
curl -X POST "http://localhost:3000/api/registry/claim?phone=919876543210" \
  -H "Content-Type: application/json" \
  -d '{"itemId": "uuid-here"}'
```

**4. Unclaim an item:**
```bash
curl -X DELETE "http://localhost:3000/api/registry/claim/uuid-here?phone=919876543210"
```

---

## What's Been Built So Far

### Backend (PRs 01-04)
- ✅ Database tables: `registry_items`, `registry_claims`
- ✅ Repository layer with all CRUD operations
- ✅ Admin API: `/api/admin/registry/items`, `/api/admin/registry/claims`
- ✅ Guest API: `/api/registry/items`, `/api/registry/claim`
- ✅ Registry settings via environment variables

### Admin Panel (PRs 05-07)
- ✅ API client functions for registry
- ✅ Items management page with CRUD
- ✅ Claims tab with release functionality
- ✅ Tab-based navigation with counts

### Still To Come (PRs 08-13)
- PR-08: CSV import for bulk item creation
- PR-09: Guest wishlist page (`/wishlist?phone=XXX`)
- PR-10: Claim/unclaim UI on guest page
- PR-11: UPI display section
- PR-12: Bot sends personalized wishlist link
- PR-13: Seed data with mock gift items

---

## Quick Test Checklist

### Admin Items Tab
- [ ] Can add new item with all fields
- [ ] Image preview shows when URL entered
- [ ] Can edit existing item
- [ ] Can delete item (if no claims)
- [ ] Hidden items show with faded row
- [ ] Price shows "Hidden" when show_price is off

### Admin Claims Tab
- [ ] Tab shows claim count
- [ ] Claims table shows guest info
- [ ] "Unknown" shows for guests without name
- [ ] Release button removes claim with confirmation
- [ ] List refreshes after release

### API Endpoints
- [ ] `GET /api/registry/settings` returns UPI and status
- [ ] `GET /api/registry/items?phone=XXX` returns items
- [ ] `POST /api/registry/claim` creates claim
- [ ] `DELETE /api/registry/claim/:id` removes claim
- [ ] Returns 403 for unknown phone numbers
