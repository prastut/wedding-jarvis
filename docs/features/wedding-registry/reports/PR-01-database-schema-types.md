# PR-01: Database Schema & Types

## Summary
Added TypeScript types and database migration for the wedding registry feature. This establishes the data model for gift items and guest claims, following existing codebase patterns for multi-language fields and timestamps.

## Files Changed
- `src/types/index.ts` - Added RegistryItem, RegistryClaim, RegistryItemInput, and ClaimWithGuest interfaces
- `src/db/migrations/009_create_registry_tables.sql` - Created registry_items and registry_claims tables with indexes and triggers

## Key Decisions
- **UNIQUE constraint on item_id in registry_claims**: Each item can only be claimed by one guest (V1 scope - no group gifts). This simplifies claim logic and prevents race conditions.
- **ON DELETE CASCADE for foreign keys**: If a registry item is deleted, its claims are automatically removed. If a guest is deleted, their claims are removed.
- **show_price boolean field**: Allows per-item control over whether price is displayed to guests, rather than a global setting.
- **Guest name is nullable in ClaimWithGuest**: Matches Guest interface where name can be null (guest may not have provided their name yet).

## Testing Notes
- Run the migration against Supabase to create the tables
- Verify tables exist: `SELECT * FROM registry_items LIMIT 1;` and `SELECT * FROM registry_claims LIMIT 1;`
- TypeScript types can be verified with `npm run lint`

## Dependencies for Future PRs
- **PR-02 (Registry Repository)**: Can now implement data access functions using these types
- **PR-03 (Admin API Routes)**: Types are ready for request/response handling
- **PR-04 (Guest API Routes)**: Types include ClaimWithGuest for admin views and RegistryItemInput for mutations

## Known Limitations
- No category field on registry_items (V1 scope - flat list only)
- No quantity field (V1 scope - one claim per item, no group gifts)
- UPI address stored in environment variable rather than database (matches spec recommendation)
