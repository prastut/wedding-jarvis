-- Multi-language Broadcast Support Migration
-- PR-13: Admin Multi-Language Broadcasts

-- =============================================================================
-- BROADCASTS TABLE
-- Add Hindi/Punjabi message translations
-- =============================================================================

ALTER TABLE broadcasts ADD COLUMN IF NOT EXISTS message_hi TEXT;
-- Hindi translation of the broadcast message

ALTER TABLE broadcasts ADD COLUMN IF NOT EXISTS message_pa TEXT;
-- Punjabi translation of the broadcast message

-- Note: When sending, the broadcaster service will:
-- - Use message_hi for guests with user_language = 'HI'
-- - Use message_pa for guests with user_language = 'PA'
-- - Use message (English) for guests with user_language = 'EN' or NULL
