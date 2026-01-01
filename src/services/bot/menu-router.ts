import { getSupabase } from '../../db/client';
import type { Event, Venue, FAQ, CoordinatorContact } from '../../types';

const MAIN_MENU = `Welcome! Reply with a number:

1 - Event Schedule
2 - Venues & Directions
3 - Dress Codes
4 - FAQs
5 - Contact Coordinator

Reply STOP to unsubscribe.`;

export async function handleMessage(phoneNumber: string, messageText: string): Promise<string> {
  const text = messageText.trim().toUpperCase();

  // Handle opt-out/opt-in
  if (text === 'STOP') {
    await updateOptIn(phoneNumber, false);
    return 'You have been unsubscribed. Reply START to subscribe again.';
  }

  if (text === 'START') {
    await updateOptIn(phoneNumber, true);
    return `You have been subscribed.\n\n${MAIN_MENU}`;
  }

  // Handle menu options
  switch (text) {
    case 'HI':
    case 'HELLO':
    case 'HEY':
    case 'MENU':
    case '0':
      return MAIN_MENU;

    case '1':
      return await getEventSchedule();

    case '2':
      return await getVenuesAndDirections();

    case '3':
      return await getDressCodes();

    case '4':
      return await getFAQs();

    case '5':
      return await getCoordinatorContact();

    default:
      return `Sorry, I didn't understand that.\n\n${MAIN_MENU}`;
  }
}

async function updateOptIn(phoneNumber: string, optedIn: boolean): Promise<void> {
  const supabase = getSupabase();
  await supabase
    .from('guests')
    .update({ opted_in: optedIn })
    .eq('phone_number', phoneNumber);
}

async function getEventSchedule(): Promise<string> {
  const supabase = getSupabase();
  const { data: events, error } = await supabase
    .from('events')
    .select('*, venues(name)')
    .order('sort_order', { ascending: true });

  if (error || !events || events.length === 0) {
    return 'No events scheduled yet. Check back soon!\n\nReply 0 for menu.';
  }

  const eventList = events.map((event: Event & { venues?: { name: string } }) => {
    const date = new Date(event.start_time);
    const dateStr = date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });
    const timeStr = date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
    const venue = event.venues?.name || '';

    return `*${event.name}*\n${dateStr} at ${timeStr}${venue ? `\nVenue: ${venue}` : ''}`;
  }).join('\n\n');

  return `*Event Schedule*\n\n${eventList}\n\nReply 0 for menu.`;
}

async function getVenuesAndDirections(): Promise<string> {
  const supabase = getSupabase();
  const { data: venues, error } = await supabase
    .from('venues')
    .select('*')
    .order('name', { ascending: true });

  if (error || !venues || venues.length === 0) {
    return 'Venue information coming soon!\n\nReply 0 for menu.';
  }

  const venueList = venues.map((venue: Venue) => {
    let text = `*${venue.name}*\n${venue.address}`;
    if (venue.google_maps_link) {
      text += `\nMap: ${venue.google_maps_link}`;
    }
    if (venue.parking_info) {
      text += `\nParking: ${venue.parking_info}`;
    }
    return text;
  }).join('\n\n');

  return `*Venues & Directions*\n\n${venueList}\n\nReply 0 for menu.`;
}

async function getDressCodes(): Promise<string> {
  const supabase = getSupabase();
  const { data: events, error } = await supabase
    .from('events')
    .select('name, dress_code')
    .not('dress_code', 'is', null)
    .order('sort_order', { ascending: true });

  if (error || !events || events.length === 0) {
    return 'Dress code information coming soon!\n\nReply 0 for menu.';
  }

  const dressCodes = events.map((event: Pick<Event, 'name' | 'dress_code'>) => {
    return `*${event.name}*\n${event.dress_code}`;
  }).join('\n\n');

  return `*Dress Codes*\n\n${dressCodes}\n\nReply 0 for menu.`;
}

async function getFAQs(): Promise<string> {
  const supabase = getSupabase();
  const { data: faqs, error } = await supabase
    .from('faqs')
    .select('*')
    .order('sort_order', { ascending: true });

  if (error || !faqs || faqs.length === 0) {
    return 'FAQs coming soon!\n\nReply 0 for menu.';
  }

  const faqList = faqs.map((faq: FAQ) => {
    return `*Q: ${faq.question}*\nA: ${faq.answer}`;
  }).join('\n\n');

  return `*Frequently Asked Questions*\n\n${faqList}\n\nReply 0 for menu.`;
}

async function getCoordinatorContact(): Promise<string> {
  const supabase = getSupabase();
  const { data: contacts, error } = await supabase
    .from('coordinator_contacts')
    .select('*')
    .eq('is_primary', true)
    .limit(1);

  if (error || !contacts || contacts.length === 0) {
    // Fallback to any coordinator
    const { data: anyContact } = await supabase
      .from('coordinator_contacts')
      .select('*')
      .limit(1);

    if (!anyContact || anyContact.length === 0) {
      return 'Coordinator contact information coming soon!\n\nReply 0 for menu.';
    }

    const contact = anyContact[0] as CoordinatorContact;
    return formatContactInfo(contact);
  }

  const contact = contacts[0] as CoordinatorContact;
  return formatContactInfo(contact);
}

function formatContactInfo(contact: CoordinatorContact): string {
  let text = `*Contact Coordinator*\n\n${contact.name}`;
  if (contact.role) {
    text += ` (${contact.role})`;
  }
  text += `\nPhone: ${contact.phone_number}`;
  text += '\n\nReply 0 for menu.';
  return text;
}
