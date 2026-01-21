import { config } from '../config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(config.supabase.url, config.supabase.serviceKey);

async function seed() {
  console.log('Seeding database...\n');

  // Clear existing data
  console.log('Clearing existing data...');
  await supabase
    .from('registry_claims')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase
    .from('registry_items')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('events').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('venues').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('faqs').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase
    .from('coordinator_contacts')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000');

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

  const leaf9Id = venues.find((v) => v.name === 'Hotel Leaf 9 INN')?.id;
  const gardenId = venues.find((v) => v.name === 'The Garden Terrace')?.id;

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
        answer:
          'Please check your invitation for the number of guests included. If you need to bring an additional guest, kindly contact the wedding coordinator.',
        category: 'General',
        sort_order: 1,
      },
      {
        question: 'Is there parking available?',
        answer:
          'Yes, valet parking is available at Hotel Leaf 9 INN. Please inform the attendant at the entrance.',
        category: 'Venue',
        sort_order: 2,
      },
      {
        question: 'Will there be vegetarian food options?',
        answer:
          'Yes! We will have a variety of vegetarian and non-vegetarian options at all events.',
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
        answer:
          'Yes, rooms are available at Hotel Leaf 9 INN. Please contact the coordinator to book.',
        category: 'Accommodation',
        sort_order: 5,
      },
      {
        question: 'Can I take photos during the ceremony?',
        answer:
          'We have professional photographers covering all events. Feel free to take photos, but please avoid using flash during the main ceremonies.',
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

  // Insert Registry Items
  console.log('Inserting registry items...');
  const { data: registryItems, error: registryError } = await supabase
    .from('registry_items')
    .insert([
      // Home category items
      {
        name: 'Dyson V15 Vacuum',
        name_hi: 'डायसन V15 वैक्यूम',
        name_pa: 'ਡਾਇਸਨ V15 ਵੈਕਿਊਮ',
        description: 'Powerful cordless vacuum for effortless cleaning',
        description_hi: 'आसान सफाई के लिए शक्तिशाली कॉर्डलेस वैक्यूम',
        description_pa: 'ਸੌਖੀ ਸਫ਼ਾਈ ਲਈ ਸ਼ਕਤੀਸ਼ਾਲੀ ਕੌਰਡਲੈਸ ਵੈਕਿਊਮ',
        price: 52000,
        sort_order: 1,
        is_available: true,
        show_price: true,
      },
      {
        name: 'King Size Bedding Set',
        name_hi: 'किंग साइज बेडिंग सेट',
        name_pa: 'ਕਿੰਗ ਸਾਈਜ਼ ਬੈਡਿੰਗ ਸੈੱਟ',
        description: 'Luxurious cotton bedding set with premium thread count',
        description_hi: 'प्रीमियम थ्रेड काउंट के साथ शानदार कॉटन बेडिंग सेट',
        description_pa: 'ਪ੍ਰੀਮੀਅਮ ਥ੍ਰੈੱਡ ਕਾਉਂਟ ਦੇ ਨਾਲ ਸ਼ਾਨਦਾਰ ਕਾਟਨ ਬੈਡਿੰਗ ਸੈੱਟ',
        price: 8500,
        sort_order: 2,
        is_available: true,
        show_price: true,
      },
      {
        name: 'Smart LED TV 55"',
        name_hi: 'स्मार्ट LED टीवी 55"',
        name_pa: 'ਸਮਾਰਟ LED ਟੀਵੀ 55"',
        description: '4K Ultra HD Smart TV with built-in streaming apps',
        price: 45000,
        sort_order: 3,
        is_available: true,
        show_price: true,
      },
      {
        name: 'Aromatherapy Diffuser',
        description: 'Essential oil diffuser with ambient lighting',
        price: 2500,
        sort_order: 4,
        is_available: true,
        show_price: true,
      },
      // Kitchen category items
      {
        name: 'KitchenAid Stand Mixer',
        name_hi: 'किचनएड स्टैंड मिक्सर',
        name_pa: 'ਕਿਚਨਏਡ ਸਟੈਂਡ ਮਿਕਸਰ',
        description: 'Professional-grade stand mixer for baking enthusiasts',
        description_hi: 'बेकिंग के शौकीनों के लिए प्रोफेशनल-ग्रेड स्टैंड मिक्सर',
        description_pa: 'ਬੇਕਿੰਗ ਦੇ ਸ਼ੌਕੀਨਾਂ ਲਈ ਪ੍ਰੋਫੈਸ਼ਨਲ-ਗ੍ਰੇਡ ਸਟੈਂਡ ਮਿਕਸਰ',
        price: 35000,
        sort_order: 5,
        is_available: true,
        show_price: true,
      },
      {
        name: 'Instant Pot Duo',
        name_hi: 'इंस्टेंट पॉट डुओ',
        name_pa: 'ਇੰਸਟੈਂਟ ਪੋਟ ਡੂਓ',
        description: 'Multi-use pressure cooker - 7 appliances in one',
        price: 9500,
        sort_order: 6,
        is_available: true,
        show_price: true,
      },
      {
        name: 'Nespresso Machine',
        description: 'Premium coffee maker for espresso lovers',
        price: 15000,
        sort_order: 7,
        is_available: true,
        show_price: true,
      },
      {
        name: 'Premium Cookware Set',
        name_hi: 'प्रीमियम कुकवेयर सेट',
        name_pa: 'ਪ੍ਰੀਮੀਅਮ ਕੁੱਕਵੇਅਰ ਸੈੱਭ',
        description: 'Non-stick cookware set - 10 piece collection',
        description_hi: 'नॉन-स्टिक कुकवेयर सेट - 10 पीस कलेक्शन',
        description_pa: 'ਨਾਨ-ਸਟਿੱਕ ਕੁੱਕਵੇਅਰ ਸੈੱਟ - 10 ਪੀਸ ਕਲੈਕਸ਼ਨ',
        price: 12000,
        sort_order: 8,
        is_available: true,
        show_price: true,
      },
      {
        name: 'Air Fryer',
        name_hi: 'एयर फ्रायर',
        name_pa: 'ਏਅਰ ਫ੍ਰਾਇਰ',
        description: 'Digital air fryer for healthy cooking',
        price: 6500,
        sort_order: 9,
        is_available: true,
        show_price: true,
      },
      // Experience category items
      {
        name: 'Cooking Class for Two',
        name_hi: 'दो के लिए कुकिंग क्लास',
        name_pa: 'ਦੋ ਲਈ ਕੁਕਿੰਗ ਕਲਾਸ',
        description: 'Hands-on cooking experience with a professional chef',
        description_hi: 'पेशेवर शेफ के साथ प्रैक्टिकल कुकिंग अनुभव',
        description_pa: 'ਪੇਸ਼ੇਵਰ ਸ਼ੈਫ ਨਾਲ ਪ੍ਰੈਕਟੀਕਲ ਕੁਕਿੰਗ ਅਨੁਭਵ',
        price: 5000,
        sort_order: 10,
        is_available: true,
        show_price: true,
      },
      {
        name: 'Spa Day Package',
        name_hi: 'स्पा डे पैकेज',
        name_pa: 'ਸਪਾ ਡੇ ਪੈਕੇਜ',
        description: 'Relaxing couples spa day with massage and treatments',
        price: 8000,
        sort_order: 11,
        is_available: true,
        show_price: true,
      },
      {
        name: 'Weekend Getaway Voucher',
        name_hi: 'वीकेंड गेटअवे वाउचर',
        name_pa: 'ਵੀਕੈਂਡ ਗੈਟਅਵੇ ਵਾਊਚਰ',
        description: 'Two-night stay at a luxury resort of choice',
        description_hi: 'पसंद के लक्जरी रिसॉर्ट में दो रात का ठहराव',
        description_pa: 'ਪਸੰਦ ਦੇ ਲਗਜ਼ਰੀ ਰਿਜ਼ੌਰਟ ਵਿੱਚ ਦੋ ਰਾਤਾਂ ਦੀ ਰਿਹਾਇਸ਼',
        price: 25000,
        sort_order: 12,
        is_available: true,
        show_price: true,
      },
    ])
    .select();

  if (registryError) {
    console.error('Error inserting registry items:', registryError);
    return;
  }
  console.log(`  Inserted ${registryItems.length} registry items`);

  console.log('\nSeeding complete!');
}

seed().catch(console.error);
