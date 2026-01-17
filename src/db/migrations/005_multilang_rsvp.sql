-- Multi-language and RSVP Support Migration
-- PR-01: Database Migrations + Types

-- =============================================================================
-- GUESTS TABLE
-- Add language preference, side selection, and RSVP tracking
-- =============================================================================

ALTER TABLE guests ADD COLUMN IF NOT EXISTS user_language VARCHAR(2);
-- Values: 'EN' (English), 'HI' (Hindi), 'PA' (Punjabi)

ALTER TABLE guests ADD COLUMN IF NOT EXISTS user_side VARCHAR(10);
-- Values: 'GROOM', 'BRIDE'

ALTER TABLE guests ADD COLUMN IF NOT EXISTS rsvp_status VARCHAR(10);
-- Values: 'YES', 'NO'

ALTER TABLE guests ADD COLUMN IF NOT EXISTS rsvp_guest_count INTEGER;
-- Values: 1-9, or 10 for "10+"

-- Indexes for filtering guests
CREATE INDEX IF NOT EXISTS idx_guests_language ON guests(user_language);
CREATE INDEX IF NOT EXISTS idx_guests_side ON guests(user_side);
CREATE INDEX IF NOT EXISTS idx_guests_rsvp ON guests(rsvp_status);

-- =============================================================================
-- EVENTS TABLE
-- Add Hindi/Punjabi translations and side-specific events
-- =============================================================================

ALTER TABLE events ADD COLUMN IF NOT EXISTS name_hi VARCHAR(255);
ALTER TABLE events ADD COLUMN IF NOT EXISTS name_pa VARCHAR(255);
ALTER TABLE events ADD COLUMN IF NOT EXISTS dress_code_hi VARCHAR(255);
ALTER TABLE events ADD COLUMN IF NOT EXISTS dress_code_pa VARCHAR(255);
ALTER TABLE events ADD COLUMN IF NOT EXISTS side VARCHAR(10) DEFAULT 'BOTH';
-- Values: 'GROOM', 'BRIDE', 'BOTH'

-- Index for filtering events by side
CREATE INDEX IF NOT EXISTS idx_events_side ON events(side);

-- =============================================================================
-- VENUES TABLE
-- Add Hindi/Punjabi translations for address and parking info
-- =============================================================================

ALTER TABLE venues ADD COLUMN IF NOT EXISTS address_hi TEXT;
ALTER TABLE venues ADD COLUMN IF NOT EXISTS address_pa TEXT;
ALTER TABLE venues ADD COLUMN IF NOT EXISTS parking_info_hi TEXT;
ALTER TABLE venues ADD COLUMN IF NOT EXISTS parking_info_pa TEXT;

-- =============================================================================
-- FAQS TABLE
-- Add Hindi/Punjabi translations for questions and answers
-- =============================================================================

ALTER TABLE faqs ADD COLUMN IF NOT EXISTS question_hi TEXT;
ALTER TABLE faqs ADD COLUMN IF NOT EXISTS question_pa TEXT;
ALTER TABLE faqs ADD COLUMN IF NOT EXISTS answer_hi TEXT;
ALTER TABLE faqs ADD COLUMN IF NOT EXISTS answer_pa TEXT;

-- =============================================================================
-- COORDINATOR_CONTACTS TABLE
-- Add side-specific contacts
-- =============================================================================

ALTER TABLE coordinator_contacts ADD COLUMN IF NOT EXISTS side VARCHAR(10) DEFAULT 'BOTH';
-- Values: 'GROOM', 'BRIDE', 'BOTH'

-- Index for filtering contacts by side
CREATE INDEX IF NOT EXISTS idx_coordinator_contacts_side ON coordinator_contacts(side);
