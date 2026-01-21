# PR-13: Seed Mock Registry Items

## Summary
Added 12 mock registry items to the existing seed script for the Wedding Registry feature. The items span three categories (Home, Kitchen, Experience) with varying price points from Rs 2,500 to Rs 52,000. Multi-language translations (Hindi and Punjabi) are provided for most items to demonstrate the i18n capability.

## Files Changed
- `/Users/nfp/Dev/wedding-jarvis/src/db/seed.ts` - Added registry_claims and registry_items deletion in cleanup section; added 12 mock registry items with names, descriptions, prices, and translations

## Key Decisions
- **Delete before insert pattern**: Added deletion of `registry_claims` before `registry_items` (due to foreign key constraint) to ensure clean re-seeding without duplicates
- **Translations for majority of items**: Provided Hindi and Punjabi translations for 10 of 12 items to demonstrate i18n support while leaving 2 items (Aromatherapy Diffuser, Nespresso Machine) with English only to show that translations are optional
- **Descriptions added**: Added meaningful descriptions for all items even though they weren't required, to make the seed data more useful for testing

## Testing Notes
- Run `npm run seed` from the project root to populate the database with mock data
- Verify via Supabase dashboard or admin panel that 12 registry items appear
- Check that items display correctly in both English and Hindi/Punjabi languages
- Verify prices are stored as integers (rupees without decimal)

## Dependencies for Future PRs
- PR-14 (Admin Panel UI) can use this seed data to test the registry management interface
- PR-15 (Guest Claiming) can use these items to test the claim workflow
- PR-16 (WhatsApp Integration) can use these items to test the bot menu responses

## Known Limitations
- No category field in database schema - categories are used for organizational reference only
- No external links or image URLs set for mock items (can be added later via admin panel)
- All items seeded with `is_available: true` and `show_price: true` for testing convenience
