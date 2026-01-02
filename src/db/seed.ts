import { config } from '../config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(config.supabase.url, config.supabase.serviceKey);

async function seed() {
  console.log('Seeding database...\n');

  // Clear existing data
  console.log('Clearing existing data...');
  await supabase.from('events').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('venues').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('faqs').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('coordinator_contacts').delete().neq('id', '00000000-0000-0000-0000-000000000000');

  // Insert Venues
  console.log('Inserting venues...');
  const { data: venues, error: venuesError } = await supabase
    .from('venues')
    .insert([
      {
        name: 'Hotel Leaf 9 INN',
        address: 'SR 68, DLF Phase 3, Sector 24, Gurugram, Haryana 122010',
        google_maps_link: 'https://maps.app.goo.gl/sUSTLgwSo1VW7yLg8',
        parking_info: 'Valet parking available at hotel entrance',
      },
      {
        name: 'The Garden Terrace',
        address: 'Sector 29, Gurugram, Haryana 122001',
        google_maps_link: 'https://maps.app.goo.gl/example123',
        parking_info: 'Street parking available nearby',
      },
    ])
    .select();

  if (venuesError) {
    console.error('Error inserting venues:', venuesError);
    return;
  }
  console.log(`  Inserted ${venues.length} venues`);

  const leaf9Id = venues.find(v => v.name === 'Hotel Leaf 9 INN')?.id;
  const gardenId = venues.find(v => v.name === 'The Garden Terrace')?.id;

  // Insert Events
  console.log('Inserting events...');
  const { data: events, error: eventsError } = await supabase
    .from('events')
    .insert([
      {
        name: 'Mehendi Ceremony',
        description: 'Traditional henna ceremony for the bride and guests',
        start_time: '2025-02-14T14:00:00+05:30',
        venue_id: leaf9Id,
        dress_code: 'Colorful Indian attire - yellows, greens, oranges preferred',
        sort_order: 1,
      },
      {
        name: 'Sangeet Night',
        description: 'Music, dance and celebrations',
        start_time: '2025-02-14T19:00:00+05:30',
        venue_id: leaf9Id,
        dress_code: 'Semi-formal Indian or Western - bright colors welcome',
        sort_order: 2,
      },
      {
        name: 'Wedding Ceremony',
        description: 'Main wedding ceremony',
        start_time: '2025-02-15T11:00:00+05:30',
        venue_id: gardenId,
        dress_code: 'Traditional Indian formal - men: kurta/sherwani, women: saree/lehenga',
        sort_order: 3,
      },
      {
        name: 'Reception',
        description: 'Wedding reception and dinner',
        start_time: '2025-02-15T19:00:00+05:30',
        venue_id: leaf9Id,
        dress_code: 'Formal attire - Indian or Western',
        sort_order: 4,
      },
    ])
    .select();

  if (eventsError) {
    console.error('Error inserting events:', eventsError);
    return;
  }
  console.log(`  Inserted ${events.length} events`);

  // Insert FAQs
  console.log('Inserting FAQs...');
  const { data: faqs, error: faqsError } = await supabase
    .from('faqs')
    .insert([
      {
        question: 'Can I bring a plus one?',
        answer: 'Please check your invitation for the number of guests included. If you need to bring an additional guest, kindly contact the wedding coordinator.',
        category: 'General',
        sort_order: 1,
      },
      {
        question: 'Is there parking available?',
        answer: 'Yes, valet parking is available at Hotel Leaf 9 INN. Please inform the attendant at the entrance.',
        category: 'Venue',
        sort_order: 2,
      },
      {
        question: 'Will there be vegetarian food options?',
        answer: 'Yes! We will have a variety of vegetarian and non-vegetarian options at all events.',
        category: 'Food',
        sort_order: 3,
      },
      {
        question: 'What time should I arrive?',
        answer: 'Please arrive 15-30 minutes before the event start time to get settled.',
        category: 'General',
        sort_order: 4,
      },
      {
        question: 'Is there accommodation available?',
        answer: 'Yes, rooms are available at Hotel Leaf 9 INN. Please contact the coordinator to book.',
        category: 'Accommodation',
        sort_order: 5,
      },
      {
        question: 'Can I take photos during the ceremony?',
        answer: 'We have professional photographers covering all events. Feel free to take photos, but please avoid using flash during the main ceremonies.',
        category: 'General',
        sort_order: 6,
      },
    ])
    .select();

  if (faqsError) {
    console.error('Error inserting FAQs:', faqsError);
    return;
  }
  console.log(`  Inserted ${faqs.length} FAQs`);

  // Insert Coordinator Contacts
  console.log('Inserting coordinator contacts...');
  const { data: contacts, error: contactsError } = await supabase
    .from('coordinator_contacts')
    .insert([
      {
        name: 'Nalin',
        phone_number: '+91-9810823377',
        role: 'Wedding Coordinator',
        is_primary: true,
      },
      {
        name: 'Prastut',
        phone_number: '+91-9940212530',
        role: 'Wedding Coordinator',
        is_primary: false,
      },
    ])
    .select();

  if (contactsError) {
    console.error('Error inserting contacts:', contactsError);
    return;
  }
  console.log(`  Inserted ${contacts.length} coordinator contacts`);

  console.log('\nSeeding complete!');
}

seed().catch(console.error);
