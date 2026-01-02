-- Seed data for wedding testing
-- Run this in Supabase SQL Editor (run each section in order)

-- ============================================
-- STEP 1: Insert Venues
-- ============================================
INSERT INTO venues (name, address, google_maps_link, parking_info) VALUES
(
  'Hotel Leaf 9 INN',
  'SR 68, DLF Phase 3, Sector 24, Gurugram, Haryana 122010',
  'https://maps.app.goo.gl/sUSTLgwSo1VW7yLg8',
  'Valet parking available at hotel entrance'
),
(
  'The Garden Terrace',
  'Sector 29, Gurugram, Haryana 122001',
  'https://maps.app.goo.gl/example123',
  'Street parking available nearby'
);

-- ============================================
-- STEP 2: Insert Events (uses venue IDs from subquery)
-- ============================================
INSERT INTO events (name, description, start_time, venue_id, dress_code, sort_order) VALUES
(
  'Mehendi Ceremony',
  'Traditional henna ceremony for the bride and guests',
  '2025-02-14 14:00:00+05:30',
  (SELECT id FROM venues WHERE name = 'Hotel Leaf 9 INN'),
  'Colorful Indian attire - yellows, greens, oranges preferred',
  1
),
(
  'Sangeet Night',
  'Music, dance and celebrations',
  '2025-02-14 19:00:00+05:30',
  (SELECT id FROM venues WHERE name = 'Hotel Leaf 9 INN'),
  'Semi-formal Indian or Western - bright colors welcome',
  2
),
(
  'Wedding Ceremony',
  'Main wedding ceremony',
  '2025-02-15 11:00:00+05:30',
  (SELECT id FROM venues WHERE name = 'The Garden Terrace'),
  'Traditional Indian formal - men: kurta/sherwani, women: saree/lehenga',
  3
),
(
  'Reception',
  'Wedding reception and dinner',
  '2025-02-15 19:00:00+05:30',
  (SELECT id FROM venues WHERE name = 'Hotel Leaf 9 INN'),
  'Formal attire - Indian or Western',
  4
);

-- ============================================
-- STEP 3: Insert FAQs
-- ============================================
INSERT INTO faqs (question, answer, category, sort_order) VALUES
(
  'Can I bring a plus one?',
  'Please check your invitation for the number of guests included. If you need to bring an additional guest, kindly contact the wedding coordinator.',
  'General',
  1
),
(
  'Is there parking available?',
  'Yes, valet parking is available at Hotel Leaf 9 INN. Please inform the attendant at the entrance.',
  'Venue',
  2
),
(
  'Will there be vegetarian food options?',
  'Yes! We will have a variety of vegetarian and non-vegetarian options at all events.',
  'Food',
  3
),
(
  'What time should I arrive?',
  'Please arrive 15-30 minutes before the event start time to get settled.',
  'General',
  4
),
(
  'Is there accommodation available?',
  'Yes, rooms are available at Hotel Leaf 9 INN. Please contact the coordinator to book.',
  'Accommodation',
  5
),
(
  'Can I take photos during the ceremony?',
  'We have professional photographers covering all events. Feel free to take photos, but please avoid using flash during the main ceremonies.',
  'General',
  6
);

-- ============================================
-- STEP 4: Insert Coordinator Contacts
-- ============================================
INSERT INTO coordinator_contacts (name, phone_number, role, is_primary) VALUES
(
  'Nalin',
  '+91-9810823377',
  'Wedding Coordinator',
  true
),
(
  'Prastut',
  '+91-9940212530',
  'Wedding Coordinator',
  false
);
