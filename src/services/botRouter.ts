import { getSupabase } from '../db/client';
import type { Venue, FAQ, CoordinatorContact, Guest, UserLanguage, UserSide } from '../types';
import { getEventsBySide, type EventWithVenue } from '../repositories/events';
import {
  parseInteractiveMessage,
  isLanguageId,
  isSideId,
  isMenuId,
  isNavId,
  extractLanguage,
  extractSide,
  MENU_IDS,
  LANG_IDS,
  SIDE_IDS,
  NAV_IDS,
} from '../constants/buttonIds';
import {
  sendReplyButtons,
  sendListMessage,
  type ReplyButton,
  type ListSection,
} from './whatsappClient';
import { updateGuestLanguage, updateGuestSide, updateGuestOptIn } from '../repositories/guests';
import {
  getMessage,
  getMessageWithValues,
  getSideName,
  getSideWithName,
  getMenuItems,
} from '../i18n';

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

// ============================================================
// MAIN ENTRY POINT
// ============================================================

/**
 * Handle incoming message and return response.
 * Returns string for text response, or null if interactive message was sent directly.
 */
export async function handleMessage(guest: Guest, messageText: string): Promise<string | null> {
  const text = messageText.trim().toUpperCase();

  // Handle opt-out/opt-in
  if (text === 'STOP') {
    await updateGuestOptIn(guest.phone_number, false);
    return getMessage('optOut.confirm', 'EN'); // Always in English
  }

  if (text === 'START') {
    await updateGuestOptIn(guest.phone_number, true);
    // After resubscribing, show appropriate screen based on onboarding state
    if (!guest.user_language) {
      await showLanguageSelection(guest.phone_number);
      return null;
    }
    if (!guest.user_side) {
      await showSideSelection(guest.phone_number, guest.user_language);
      return null;
    }
    await showMainMenu(guest.phone_number, guest.user_language);
    return null;
  }

  // Parse interactive message if present
  const interactiveMsg = parseInteractiveMessage(messageText.trim());
  const buttonId = interactiveMsg?.id || null;

  // State machine based on guest onboarding status
  // Step 1: Language not set - show or handle language selection
  if (!guest.user_language) {
    return await handleLanguageState(guest, buttonId);
  }

  // Step 2: Side not set - show or handle side selection
  if (!guest.user_side) {
    return await handleSideState(guest, buttonId);
  }

  // Step 3: Fully onboarded - route to menu handlers
  return await handleOnboardedState(guest, buttonId, text);
}

// ============================================================
// STATE HANDLERS
// ============================================================

/**
 * Handle state when user_language is null
 */
async function handleLanguageState(guest: Guest, buttonId: string | null): Promise<string | null> {
  // If they tapped a language button, save it and show side selection
  if (buttonId && isLanguageId(buttonId)) {
    const language = extractLanguage(buttonId);
    if (language) {
      console.log(`[ONBOARDING] ${guest.phone_number} selected language: ${language}`);
      const updatedGuest = await updateGuestLanguage(guest.id, language);
      await showSideSelection(guest.phone_number, updatedGuest.user_language!);
      return null;
    }
  }

  // Otherwise, show language selection
  await showLanguageSelection(guest.phone_number);
  return null;
}

/**
 * Handle state when user_side is null
 */
async function handleSideState(guest: Guest, buttonId: string | null): Promise<string | null> {
  // If they tapped a side button, save it and show main menu
  if (buttonId && isSideId(buttonId)) {
    const side = extractSide(buttonId);
    if (side) {
      console.log(`[ONBOARDING] ${guest.phone_number} selected side: ${side}`);
      const updatedGuest = await updateGuestSide(guest.id, side);
      // Show welcome message merged with menu
      const welcomeMessage = getWelcomeMessage(guest.user_language!, updatedGuest.user_side!);
      await showMainMenu(guest.phone_number, guest.user_language!, welcomeMessage);
      return null;
    }
  }

  // Otherwise, re-show side selection
  await showSideSelection(guest.phone_number, guest.user_language!);
  return null;
}

/**
 * Handle state when guest is fully onboarded
 */
async function handleOnboardedState(
  guest: Guest,
  buttonId: string | null,
  textInput: string
): Promise<string | null> {
  const language = guest.user_language!;

  // Handle navigation
  if (buttonId && isNavId(buttonId)) {
    if (buttonId === NAV_IDS.BACK_TO_MENU) {
      await showMainMenu(guest.phone_number, language);
      return null;
    }
  }

  // Handle menu selections
  if (buttonId && isMenuId(buttonId)) {
    return await handleMenuSelection(guest, buttonId);
  }

  // Handle button presses for specific flows (language re-selection, etc.)
  if (buttonId && isLanguageId(buttonId)) {
    // They somehow got a language button while onboarded - treat as reset
    await showMainMenu(guest.phone_number, language);
    return null;
  }

  if (buttonId && isSideId(buttonId)) {
    // They somehow got a side button while onboarded - treat as reset
    await showMainMenu(guest.phone_number, language);
    return null;
  }

  // Handle text commands (legacy support)
  if (textInput === 'MENU' || textInput === '0' || textInput === 'HI' || textInput === 'HELLO') {
    await showMainMenu(guest.phone_number, language);
    return null;
  }

  // Numeric menu commands for legacy support
  switch (textInput) {
    case '1':
      await sendEventSchedule(guest);
      return null;
    case '2':
      await sendVenuesAndDirections(guest);
      return null;
    case '3':
      await sendFAQs(guest);
      return null;
    case '4':
      await sendCoordinatorContact(guest);
      return null;
  }

  // Unknown input - show fallback menu
  await showMainMenu(guest.phone_number, language);
  return getMessage('fallback.unknown', language);
}

/**
 * Handle menu item selections
 * All handlers send interactive messages directly and return null
 */
async function handleMenuSelection(guest: Guest, menuId: string): Promise<string | null> {
  const language = guest.user_language!;

  switch (menuId) {
    case MENU_IDS.SCHEDULE:
      await sendEventSchedule(guest);
      return null;

    case MENU_IDS.VENUE:
      await sendVenuesAndDirections(guest);
      return null;

    case MENU_IDS.TRAVEL:
      // TODO PR-08: Travel info
      await sendContentWithBackButton(guest.phone_number, getMessage('travel.info', language), language);
      return null;

    case MENU_IDS.RSVP:
      // TODO PR-09: Full RSVP flow
      await sendContentWithBackButton(
        guest.phone_number,
        getMessageWithValues('stub.comingSoon', language, { feature: 'RSVP' }),
        language
      );
      return null;

    case MENU_IDS.EMERGENCY:
      await sendCoordinatorContact(guest);
      return null;

    case MENU_IDS.FAQ:
      await sendFAQs(guest);
      return null;

    case MENU_IDS.GIFTS:
      // TODO PR-08: Gift registry
      await sendContentWithBackButton(guest.phone_number, getMessage('gifts.info', language), language);
      return null;

    case MENU_IDS.RESET:
      // TODO PR-10: Reset flow
      await sendContentWithBackButton(
        guest.phone_number,
        getMessageWithValues('stub.comingSoon', language, { feature: 'Reset' }),
        language
      );
      return null;

    default:
      await showMainMenu(guest.phone_number, language);
      return null;
  }
}

// ============================================================
// INTERACTIVE MESSAGE SENDERS
// ============================================================

/**
 * Show language selection buttons (always in English since language unknown)
 */
async function showLanguageSelection(phoneNumber: string): Promise<void> {
  const body = `${getMessage('welcome.title', 'EN')}

${getMessage('welcome.selectLanguage', 'EN')}`;

  const buttons: ReplyButton[] = [
    { id: LANG_IDS.ENGLISH, title: 'English' },
    { id: LANG_IDS.HINDI, title: 'हिंदी' },
    { id: LANG_IDS.PUNJABI, title: 'ਪੰਜਾਬੀ' },
  ];

  try {
    await sendReplyButtons(phoneNumber, body, buttons);
    console.log(`[INTERACTIVE] Sent language selection to ${phoneNumber}`);
  } catch (error) {
    console.error(`[INTERACTIVE] Failed to send language selection:`, error);
    throw error;
  }
}

/**
 * Show side selection buttons (in user's language)
 */
async function showSideSelection(phoneNumber: string, language: UserLanguage): Promise<void> {
  const body = `${getMessage('side.thankYou', language)}

${getMessage('side.selectPrompt', language)}`;

  const buttons: ReplyButton[] = [
    { id: SIDE_IDS.GROOM, title: getSideWithName('GROOM', language) },
    { id: SIDE_IDS.BRIDE, title: getSideWithName('BRIDE', language) },
  ];

  try {
    await sendReplyButtons(phoneNumber, body, buttons);
    console.log(`[INTERACTIVE] Sent side selection to ${phoneNumber}`);
  } catch (error) {
    console.error(`[INTERACTIVE] Failed to send side selection:`, error);
    throw error;
  }
}

/**
 * Show main menu list message (in user's language)
 * @param welcomePrefix - Optional welcome message to prepend to the menu body
 */
async function showMainMenu(
  phoneNumber: string,
  language: UserLanguage,
  welcomePrefix?: string
): Promise<void> {
  const menuItems = getMenuItems(language);

  const sections: ListSection[] = [
    {
      title: 'Menu',
      rows: menuItems.map((item) => ({
        id: item.id,
        title: item.title,
        description: item.description,
      })),
    },
  ];

  // Combine welcome message with menu body if provided
  const menuBody = getMessage('menu.header', language);
  const body = welcomePrefix ? `${welcomePrefix}\n\n${menuBody}` : menuBody;
  const buttonText = getMessage('menu.button', language);

  try {
    await sendListMessage(phoneNumber, body, buttonText, sections);
    console.log(`[INTERACTIVE] Sent main menu to ${phoneNumber}`);
  } catch (error) {
    console.error(`[INTERACTIVE] Failed to send main menu:`, error);
    throw error;
  }
}

// ============================================================
// MESSAGE HELPERS
// ============================================================

/**
 * Get welcome message after completing onboarding
 */
function getWelcomeMessage(language: UserLanguage, side: UserSide): string {
  const sideName = getSideName(side, language);
  return getMessageWithValues('onboarding.welcome', language, { sideName });
}

/**
 * Send content with a "Back to Menu" button
 */
async function sendContentWithBackButton(
  phoneNumber: string,
  content: string,
  language: UserLanguage
): Promise<void> {
  const buttons: ReplyButton[] = [
    { id: NAV_IDS.BACK_TO_MENU, title: getMessage('nav.backToMenu', language) },
  ];

  try {
    await sendReplyButtons(phoneNumber, content, buttons);
    console.log(`[INTERACTIVE] Sent content with back button to ${phoneNumber}`);
  } catch (error) {
    console.error(`[INTERACTIVE] Failed to send content with back button:`, error);
    throw error;
  }
}

// ============================================================
// CONTENT SENDERS (fetch data and send with back button)
// ============================================================

async function sendEventSchedule(guest: Guest): Promise<void> {
  const language = guest.user_language || 'EN';
  const cacheKey = `events_${language}_${guest.user_side}`;
  const cached = getCached(cacheKey);

  if (cached) {
    await sendContentWithBackButton(guest.phone_number, cached, language);
    return;
  }

  try {
    const events = await getEventsBySide(guest.user_side);

    if (events.length === 0) {
      await sendContentWithBackButton(
        guest.phone_number,
        getMessage('error.noData', language),
        language
      );
      return;
    }

    const header = getMessage('content.schedule.header', language);
    const atLabel = getMessage('content.event.at', language);
    const venueLabel = getMessage('content.event.venue', language);

    const eventList = events
      .map((event: EventWithVenue) => {
        const date = new Date(event.start_time);
        const locale = language === 'EN' ? 'en-US' : language === 'HI' ? 'hi-IN' : 'pa-IN';
        const dateStr = date.toLocaleDateString(locale, {
          weekday: 'long',
          month: 'long',
          day: 'numeric',
        });
        const timeStr = date.toLocaleTimeString(locale, {
          hour: 'numeric',
          minute: '2-digit',
        });
        const venue = event.venues?.name || '';

        // Get translated name
        const name =
          (language === 'HI' && event.name_hi) ||
          (language === 'PA' && event.name_pa) ||
          event.name;

        return `*${name}*\n${dateStr} ${atLabel} ${timeStr}${venue ? `\n${venueLabel}: ${venue}` : ''}`;
      })
      .join('\n\n');

    const content = `${header}\n\n${eventList}`;
    setCache(cacheKey, content);
    await sendContentWithBackButton(guest.phone_number, content, language);
  } catch (error) {
    console.error('[EVENTS] Error fetching event schedule:', error);
    await sendContentWithBackButton(
      guest.phone_number,
      getMessage('error.noData', language),
      language
    );
  }
}

async function sendVenuesAndDirections(guest: Guest): Promise<void> {
  const language = guest.user_language || 'EN';
  const cacheKey = `venues_${language}`;
  const cached = getCached(cacheKey);

  if (cached) {
    await sendContentWithBackButton(guest.phone_number, cached, language);
    return;
  }

  const supabase = getSupabase();
  const { data: venues, error } = await supabase
    .from('venues')
    .select('*')
    .order('name', { ascending: true });

  if (error || !venues || venues.length === 0) {
    await sendContentWithBackButton(
      guest.phone_number,
      getMessage('error.noData', language),
      language
    );
    return;
  }

  const header = getMessage('content.venue.header', language);
  const mapLabel = getMessage('content.venue.map', language);
  const parkingLabel = getMessage('content.venue.parking', language);

  const venueList = venues
    .map((venue: Venue) => {
      const address =
        (language === 'HI' && venue.address_hi) ||
        (language === 'PA' && venue.address_pa) ||
        venue.address;

      const parking =
        (language === 'HI' && venue.parking_info_hi) ||
        (language === 'PA' && venue.parking_info_pa) ||
        venue.parking_info;

      let text = `*${venue.name}*\n${address}`;
      if (venue.google_maps_link) {
        text += `\n${mapLabel}: ${venue.google_maps_link}`;
      }
      if (parking) {
        text += `\n${parkingLabel}: ${parking}`;
      }
      return text;
    })
    .join('\n\n');

  const content = `${header}\n\n${venueList}`;
  setCache(cacheKey, content);
  await sendContentWithBackButton(guest.phone_number, content, language);
}

async function sendFAQs(guest: Guest): Promise<void> {
  const language = guest.user_language || 'EN';
  const cacheKey = `faqs_${language}`;
  const cached = getCached(cacheKey);

  if (cached) {
    await sendContentWithBackButton(guest.phone_number, cached, language);
    return;
  }

  const supabase = getSupabase();
  const { data: faqs, error } = await supabase
    .from('faqs')
    .select('*')
    .order('sort_order', { ascending: true });

  if (error || !faqs || faqs.length === 0) {
    await sendContentWithBackButton(
      guest.phone_number,
      getMessage('error.noData', language),
      language
    );
    return;
  }

  const header = getMessage('content.faq.header', language);

  const faqList = faqs
    .map((faq: FAQ) => {
      const question =
        (language === 'HI' && faq.question_hi) ||
        (language === 'PA' && faq.question_pa) ||
        faq.question;

      const answer =
        (language === 'HI' && faq.answer_hi) || (language === 'PA' && faq.answer_pa) || faq.answer;

      return `*Q: ${question}*\nA: ${answer}`;
    })
    .join('\n\n');

  const content = `${header}\n\n${faqList}`;
  setCache(cacheKey, content);
  await sendContentWithBackButton(guest.phone_number, content, language);
}

async function sendCoordinatorContact(guest: Guest): Promise<void> {
  const language = guest.user_language || 'EN';
  const cacheKey = `coordinator_${language}_${guest.user_side}`;
  const cached = getCached(cacheKey);

  if (cached) {
    await sendContentWithBackButton(guest.phone_number, cached, language);
    return;
  }

  const supabase = getSupabase();

  // Try to get primary contact for guest's side or BOTH
  let query = supabase.from('coordinator_contacts').select('*').eq('is_primary', true);

  if (guest.user_side) {
    query = query.or(`side.eq.${guest.user_side},side.eq.BOTH`);
  }

  const { data: contacts, error } = await query.limit(1);

  if (error || !contacts || contacts.length === 0) {
    // Fallback to any coordinator
    let fallbackQuery = supabase.from('coordinator_contacts').select('*');
    if (guest.user_side) {
      fallbackQuery = fallbackQuery.or(`side.eq.${guest.user_side},side.eq.BOTH`);
    }
    const { data: anyContact } = await fallbackQuery.limit(1);

    if (!anyContact || anyContact.length === 0) {
      await sendContentWithBackButton(
        guest.phone_number,
        getMessage('error.noData', language),
        language
      );
      return;
    }

    const content = formatContactContent(anyContact[0] as CoordinatorContact, language);
    setCache(cacheKey, content);
    await sendContentWithBackButton(guest.phone_number, content, language);
    return;
  }

  const content = formatContactContent(contacts[0] as CoordinatorContact, language);
  setCache(cacheKey, content);
  await sendContentWithBackButton(guest.phone_number, content, language);
}

function formatContactContent(contact: CoordinatorContact, language: UserLanguage): string {
  const header = getMessage('content.emergency.header', language);
  const phoneLabel = getMessage('content.contact.phone', language);

  let text = `${header}\n\n${contact.name}`;
  if (contact.role) {
    text += ` (${contact.role})`;
  }
  text += `\n${phoneLabel}: ${contact.phone_number}`;
  return text;
}
