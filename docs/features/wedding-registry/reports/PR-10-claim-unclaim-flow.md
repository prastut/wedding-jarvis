# PR-10: Claim/Unclaim Flow

## Summary
The claim/unclaim functionality was implemented as part of PR-09 (Guest Wishlist Page). This PR formalizes the completion, documenting the implemented features: optimistic UI updates, error handling with rollback, 409 conflict handling for race conditions, and loading states on buttons.

## Files Changed
- `admin-panel/src/pages/Wishlist.tsx` - Contains `handleClaim()` and `handleUnclaim()` functions with optimistic updates (implemented in PR-09)

## Key Decisions
- **Optimistic UI updates**: The UI updates immediately on claim/unclaim, before the API call completes. If the API fails, the UI reverts to the previous state.
- **Single claiming state**: The `claimingItemId` state tracks which item is being processed, preventing multiple simultaneous operations and showing loading state only on the affected button.
- **Error display via alert()**: API errors are shown using browser `alert()` for simplicity. The error message from the backend (e.g., "Item is already claimed" for 409) is displayed directly.
- **Silent unclaim revert**: If unclaiming fails, the UI reverts to showing the item as claimed by the user, which is the correct state.

## Implementation Details

### Claim Flow
```typescript
async function handleClaim(itemId: string) {
  if (!phone || claimingItemId) return;
  setClaimingItemId(itemId);

  // Optimistic update
  setItems((prev) =>
    prev.map((item) =>
      item.id === itemId ? { ...item, is_claimed: true, claimed_by_me: true } : item
    )
  );

  try {
    await guestApi.claimItem(phone, itemId);
  } catch (err) {
    // Revert on error
    setItems((prev) =>
      prev.map((item) =>
        item.id === itemId ? { ...item, is_claimed: false, claimed_by_me: false } : item
      )
    );
    alert(err.message); // Shows "Item is already claimed" for 409
  } finally {
    setClaimingItemId(null);
  }
}
```

### 409 Conflict Handling
When a guest tries to claim an item that was just claimed by someone else, the backend returns a 409 with `{ error: "Item is already claimed" }`. This message is shown to the user via alert, and the UI reverts to show the item as unclaimed (which will be corrected on next page refresh or re-fetch).

### Loading State
- Buttons show "..." text when their item is being processed
- Buttons are disabled during processing via `disabled={claimingItemId === item.id}`
- CSS styles reduce opacity and change cursor on disabled state

## Testing Notes
- Claim an available item → button shows "...", then changes to "You claimed this" badge + Unclaim button
- Unclaim an item → button shows "...", then changes back to "Claim This Gift"
- Open two browser windows, claim same item from both → second one shows error and reverts
- Test with network throttling to observe loading states

## Dependencies for Future PRs
- **PR-11 (UPI Display Section)**: Claim flow is complete, UPI QR code can now be added
- **PR-12 (Bot Personalized Link)**: Guest page is fully functional for claim/unclaim

## Known Limitations
- Alert uses browser native `alert()` instead of custom toast component
- After 409 error, the item shows as available until page refresh (could auto-refresh items)
- No animation on state transitions
