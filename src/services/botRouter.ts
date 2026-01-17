import { getSupabase } from '../db/client';
import type { Event, Venue, FAQ, CoordinatorContact } from '../types';

// Simple in-memory cache (5 minute TTL)
const cache: Map<string, { data: string; expires: number }> = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function getCached(key: string): string | null {
  const entry = cache.get(key);
  if (entry && entry.expires > Date.now()) {
    return entry.data;
  }
  cache.delete(key);
  return null;
}

function setCache(key: string, data: string): void {
  cache.set(key, { data, expires: Date.now() + CACHE_TTL });
}

const MAIN_MENU = `Welcome! Reply with a number:

1 - Wedding Location Guide
2 - Dress Code
3 - Schedule
4 - FAQ
5 - Emergency Contact

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
      return await getVenuesAndDirections();

    case '2':
      return await getDressCodes();

    case '3':
      return await getEventSchedule();

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
  await supabase.from('guests').update({ opted_in: optedIn }).eq('phone_number', phoneNumber);
}

async function getEventSchedule(): Promise<string> {
  const cached = getCached('events');
  if (cached) return cached;

  const supabase = getSupabase();
  const { data: events, error } = await supabase
    .from('events')
    .select('*, venues(name)')
    .order('sort_order', { ascending: true });

  if (error || !events || events.length === 0) {
    return 'Schedule coming soon!\n\nReply 0 for menu.';
  }

  const eventList = events
    .map((event: Event & { venues?: { name: string } }) => {
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
    })
    .join('\n\n');

  const result = `*Schedule*\n\n${eventList}\n\nReply 0 for menu.`;
  setCache('events', result);
  return result;
}

async function getVenuesAndDirections(): Promise<string> {
  const cached = getCached('venues');
  if (cached) return cached;

  const supabase = getSupabase();
  const { data: venues, error } = await supabase
    .from('venues')
    .select('*')
    .order('name', { ascending: true });

  if (error || !venues || venues.length === 0) {
    return 'Wedding location guide coming soon!\n\nReply 0 for menu.';
  }

  const venueList = venues
    .map((venue: Venue) => {
      let text = `*${venue.name}*\n${venue.address}`;
      if (venue.google_maps_link) {
        text += `\nMap: ${venue.google_maps_link}`;
      }
      if (venue.parking_info) {
        text += `\nParking: ${venue.parking_info}`;
      }
      return text;
    })
    .join('\n\n');

  const result = `*Wedding Location Guide*\n\n${venueList}\n\nReply 0 for menu.`;
  setCache('venues', result);
  return result;
}

async function getDressCodes(): Promise<string> {
  const cached = getCached('dresscodes');
  if (cached) return cached;

  const supabase = getSupabase();
  const { data: events, error } = await supabase
    .from('events')
    .select('name, dress_code')
    .not('dress_code', 'is', null)
    .order('sort_order', { ascending: true });

  if (error || !events || events.length === 0) {
    return 'Dress code information coming soon!\n\nReply 0 for menu.';
  }

  const dressCodes = events
    .map((event: Pick<Event, 'name' | 'dress_code'>) => {
      return `*${event.name}*\n${event.dress_code}`;
    })
    .join('\n\n');

  const result = `*Dress Code*\n\n${dressCodes}\n\nView color palettes: https://wedding-jarvis-production.up.railway.app/dress-code\n\nReply 0 for menu.`;
  setCache('dresscodes', result);
  return result;
}

async function getFAQs(): Promise<string> {
  const cached = getCached('faqs');
  if (cached) return cached;

  const supabase = getSupabase();
  const { data: faqs, error } = await supabase
    .from('faqs')
    .select('*')
    .order('sort_order', { ascending: true });

  if (error || !faqs || faqs.length === 0) {
    return 'FAQs coming soon!\n\nReply 0 for menu.';
  }

  const faqList = faqs
    .map((faq: FAQ) => {
      return `*Q: ${faq.question}*\nA: ${faq.answer}`;
    })
    .join('\n\n');

  const result = `*FAQ*\n\n${faqList}\n\nReply 0 for menu.`;
  setCache('faqs', result);
  return result;
}

async function getCoordinatorContact(): Promise<string> {
  const cached = getCached('coordinator');
  if (cached) return cached;

  const supabase = getSupabase();
  const { data: contacts, error } = await supabase
    .from('coordinator_contacts')
    .select('*')
    .eq('is_primary', true)
    .limit(1);

  if (error || !contacts || contacts.length === 0) {
    // Fallback to any coordinator
    const { data: anyContact } = await supabase.from('coordinator_contacts').select('*').limit(1);

    if (!anyContact || anyContact.length === 0) {
      return 'Emergency contact coming soon!\n\nReply 0 for menu.';
    }

    const contact = anyContact[0] as CoordinatorContact;
    const result = formatContactInfo(contact);
    setCache('coordinator', result);
    return result;
  }

  const contact = contacts[0] as CoordinatorContact;
  const result = formatContactInfo(contact);
  setCache('coordinator', result);
  return result;
}

function formatContactInfo(contact: CoordinatorContact): string {
  let text = `*Emergency Contact*\n\n${contact.name}`;
  if (contact.role) {
    text += ` (${contact.role})`;
  }
  text += `\nPhone: ${contact.phone_number}`;
  text += '\n\nReply 0 for menu.';
  return text;
}
