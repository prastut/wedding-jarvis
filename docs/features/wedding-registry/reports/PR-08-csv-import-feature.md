# PR-08: CSV Import Feature

## Summary
Added CSV import functionality to the Registry admin page, allowing admins to bulk-create gift items from a CSV file. The feature includes a file picker, loading state, and success/error feedback with dismissible alerts.

## Files Changed
- `admin-panel/src/pages/Registry.tsx` - Added import button, file input ref, handleImportCSV function, and alert UI
- `admin-panel/src/App.css` - Added alert component styles (.alert, .alert-success, .alert-error, .alert-dismiss) and header-actions layout

## Key Decisions
- **Hidden file input pattern**: Used a hidden `<input type="file">` with a visible button trigger. This is a common pattern for custom file upload UIs that maintains accessibility while allowing custom styling.
- **File type validation**: Client-side validation checks `.csv` extension before attempting upload. The backend also validates CSV structure.
- **Input reset after selection**: The file input value is reset after file selection so users can re-select the same file if the first import failed.
- **Dismissible alerts**: Import success/error messages use a new alert component that can be dismissed by clicking the × button.
- **Loading state on button**: The Import CSV button shows "Importing..." and is disabled during import to prevent double-clicks.

## CSV Format Reference
```csv
name,name_hi,name_pa,description,description_hi,description_pa,price,external_link
KitchenAid Mixer,किचनएड मिक्सर,ਕਿਚਨਏਡ ਮਿਕਸਰ,Professional stand mixer,प्रोफेशनल स्टैंड मिक्सर,ਪ੍ਰੋਫੈਸ਼ਨਲ ਸਟੈਂਡ ਮਿਕਸਰ,35000,https://amazon.in/...
```

- `name` column is required
- Empty price = `show_price: false`
- Hindi/Punjabi fields can be empty (will show English as fallback)

## Testing Notes
- Navigate to `/registry` in the admin panel
- Click "Import CSV" button in the Items tab toolbar
- Select a valid CSV file
- Verify success message shows with item count
- Verify items table refreshes with new items
- Test error cases: select non-CSV file, malformed CSV

## Dependencies for Future PRs
- **PR-09 (Guest Wishlist Page)**: Admin can now bulk-populate registry items via CSV for testing
- **PR-13 (Seed Mock Registry Items)**: CSV import provides alternative to seeding via code

## Known Limitations
- No CSV template download (users need to know the format)
- No preview of items before import
- No progress indicator for large CSV files (single API call)
- File size not validated on client (server will reject very large files)
