# PR-06: Registry Items Page

## Summary
Created the admin page for managing gift registry items. The page follows the existing Events.tsx pattern with a data table for listing items and a form for creating/editing items. Includes all multi-language fields, image URL preview, and status indicators.

## Files Changed
- `admin-panel/src/pages/Registry.tsx` - New page with items table and CRUD form
- `admin-panel/src/App.tsx` - Added Registry import and route
- `admin-panel/src/components/Layout.tsx` - Added "Gift Registry" nav item to sidebar
- `admin-panel/src/App.css` - Added styles for checkbox groups, table images, image preview, and disabled rows

## Key Decisions
- **Single page component**: Following the Events.tsx pattern, all items CRUD functionality is in one component with state management for form visibility and editing mode.
- **Nullable price handling**: Price field uses `null` for empty values, and the form handles the conversion between empty string and null for proper UX.
- **Image preview in form**: When an image URL is entered, a preview is shown below the input with error handling for invalid URLs.
- **Status badge system**: Items show "Available" (green) or "Hidden" (gray) badges, and hidden items have reduced opacity in the table.
- **Price display logic**: Shows "Hidden" in muted text when `show_price` is false, otherwise formats as INR currency.
- **Nav placement**: Added "Gift Registry" link at the end of the "Edit Content" section in the sidebar.

## Page Features

### Items Table
| Column | Description |
|--------|-------------|
| Order | Sort order number |
| Image | 50x50px thumbnail preview, fallback for broken images |
| Name | English name, Hindi translation below, truncated description |
| Price | INR formatted price or "Hidden" if show_price is false |
| Status | "Available" or "Hidden" badge |
| Actions | Edit and Delete buttons |

### Form Fields
| Field | Type | Required |
|-------|------|----------|
| name, name_hi, name_pa | text | name required |
| description, description_hi, description_pa | textarea | optional |
| price | number | optional |
| show_price | checkbox | defaults to true |
| is_available | checkbox | defaults to true |
| image_url | url | optional |
| external_link | url | optional |
| sort_order | number | optional (defaults to 0) |

## CSS Added
- `.text-muted` - Muted text color
- `.checkbox-group` - Inline checkbox with label
- `.table-image` - 50x50 image thumbnail
- `.no-image` - Placeholder text styling
- `.image-preview` - Form image preview container
- `.row-disabled` - Reduced opacity for hidden items

## Testing Notes
- Navigate to `/registry` to view the page
- Add new items with the "New Item" button
- Edit existing items by clicking "Edit" in the table
- Delete items with confirmation dialog
- Image URLs show preview in the form
- Hidden items (is_available=false) appear faded in the table

## Dependencies for Future PRs
- **PR-07 (Registry Claims Page)**: Can add claims tab/section to this page
- **PR-08 (CSV Import Feature)**: Can add import button to the page header

## Known Limitations
- No drag-to-reorder (uses sort_order input instead)
- No pagination (acceptable for expected registry size ~20-50 items)
- Image preview doesn't validate URL before attempting to load
