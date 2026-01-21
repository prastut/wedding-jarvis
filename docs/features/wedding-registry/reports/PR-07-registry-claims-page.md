# PR-07: Registry Claims Page

## Summary
Added a claims tab to the Registry admin page, allowing admins to view all guest claims and release them if needed. The page now has a tab system to switch between "Items" and "Claims" views, with counts shown in each tab.

## Files Changed
- `admin-panel/src/pages/Registry.tsx` - Added tab system, claims state, claims table, and release claim functionality
- `admin-panel/src/App.css` - Added registry tab styling

## Key Decisions
- **Tab-based navigation**: Used a simple tab system rather than a separate route, keeping all registry management in one place. This matches the UX pattern of managing related data together.
- **Parallel data loading**: Both items and claims are loaded on initial page load using `Promise.all()`, so switching tabs is instant without additional API calls.
- **Descriptive release confirmation**: The confirm dialog includes the item name to help admins confirm they're releasing the correct claim.
- **Tab counts**: Each tab shows the count of items/claims in parentheses for quick visibility without switching tabs.
- **"New Item" button visibility**: The button only shows when on the Items tab and the form is not open.

## Claims Table Columns
| Column | Description |
|--------|-------------|
| Item | Name of the claimed gift item |
| Guest Name | Name of the guest who claimed it (or "Unknown" if not set) |
| Guest Phone | Phone number of the guest |
| Claimed Date | Formatted date/time when the claim was made |
| Actions | Release button to remove the claim |

## CSS Added
- `.registry-tabs` - Container with bottom border
- `.registry-tab` - Individual tab button styling
- `.registry-tab:hover` - Hover state with background
- `.registry-tab.active` - Active state with primary color border

## Testing Notes
- Navigate to `/registry` and click the "Claims" tab
- Claims table shows all claims with guest details
- Click "Release" on a claim and confirm the dialog
- After release, the claims list refreshes automatically
- Tab counts update after release (items remain, claims decrease)

## Dependencies for Future PRs
- **PR-08 (CSV Import Feature)**: Can add import button to the Items tab

## Known Limitations
- No sorting or filtering on claims table (acceptable for expected claim counts)
- No pagination on claims (acceptable for expected claim counts ~20-50)
- Claims don't show the item price (could be added if needed)
