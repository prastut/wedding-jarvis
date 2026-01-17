import { getSupabase } from '../db/client';
import type { Venue, FAQ, CoordinatorContact, Guest, UserLanguage, UserSide } from '../types';
import { getEventsBySide, type EventWithVenue } from '../repositories/events';
import { getContactsBySide } from '../repositories/coordinatorContacts';
import {
  parseInteractiveMessage,
  isLanguageId,
  isSideId,
  isMenuId,
  isNavId,
  isRsvpId,
  isCountId,
  extractLanguage,
  extractSide,
  extractCount,
  MENU_IDS,
  LANG_IDS,
  SIDE_IDS,
  NAV_IDS,
  RSVP_IDS,
  COUNT_IDS,
} from '../constants/buttonIds';
import {
  sendReplyButtons,
  sendListMessage,
  sendTextMessage,
  type ReplyButton,
  type ListSection,
} from './whatsappClient';
import {
  updateGuestLanguage,
  updateGuestSide,
  updateGuestOptIn,
  resetGuestPreferences,
  updateGuestRsvpYes,
  updateGuestRsvpNo,
} from '../repositories/guests';
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

/**
 * Check if post-wedding mode is enabled
 * Set POST_WEDDING_MODE=enabled in environment to activate
 * When enabled, bot shows thank you message instead of normal menu
 */
function isPostWedding(): boolean {
  return process.env.POST_WEDDING_MODE?.toLowerCase() === 'enabled';
}

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

  // Check if wedding has ended - show thank you message
  if (isPostWedding()) {
    await sendPostWeddingMessage(guest);
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

  // Handle RSVP flow buttons
  if (buttonId && isRsvpId(buttonId)) {
    return await handleRsvpButton(guest, buttonId);
  }

  // Handle count selection (from RSVP flow)
  if (buttonId && isCountId(buttonId)) {
    return await handleCountSelection(guest, buttonId);
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

  // Unknown input - show fallback menu with "please select" message
  const fallbackMessage = getMessage('fallback.unknown', language);
  await showMainMenu(guest.phone_number, language, fallbackMessage);
  return null;
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
      await sendContentWithBackButton(guest.phone_number, getMessage('travel.info', language), language);
      return null;

    case MENU_IDS.RSVP:
      await handleRsvp(guest);
      return null;

    case MENU_IDS.EMERGENCY:
      await sendCoordinatorContact(guest);
      return null;

    case MENU_IDS.FAQ:
      await sendFAQs(guest);
      return null;

    case MENU_IDS.GIFTS:
      await sendGiftRegistry(guest);
      return null;

    case MENU_IDS.RESET:
      await handleReset(guest);
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
// POST-WEDDING BEHAVIOR
// ============================================================

/**
 * Send thank you message after the wedding has ended
 * Uses guest's language if available, falls back to English
 */
async function sendPostWeddingMessage(guest: Guest): Promise<void> {
  const language = guest.user_language || 'EN';
  const message = getMessage('postWedding.thankYou', language);

  try {
    await sendTextMessage({
      to: guest.phone_number,
      text: message,
    });
    console.log(`[POST-WEDDING] Sent thank you message to ${guest.phone_number}`);
  } catch (error) {
    console.error(`[POST-WEDDING] Failed to send thank you message:`, error);
    throw error;
  }
}

// ============================================================
// RESET FLOW
// ============================================================

/**
 * Handle reset: clear language/side preferences while preserving RSVP data
 * Then show language selection to restart onboarding
 */
async function handleReset(guest: Guest): Promise<void> {
  const language = guest.user_language || 'EN';
  const confirmMessage = getMessage('reset.confirm', language);

  console.log(`[RESET] ${guest.phone_number} resetting preferences`);

  // Reset language and side in database (RSVP preserved)
  await resetGuestPreferences(guest.id);

  // Send confirmation message followed by language selection
  // We send the confirmation as part of the language selection body
  const welcomeTitle = getMessage('welcome.title', 'EN');
  const selectLanguage = getMessage('welcome.selectLanguage', 'EN');
  const body = `${confirmMessage}\n\n${welcomeTitle}\n\n${selectLanguage}`;

  const buttons: ReplyButton[] = [
    { id: LANG_IDS.ENGLISH, title: 'English' },
    { id: LANG_IDS.HINDI, title: 'हिंदी' },
    { id: LANG_IDS.PUNJABI, title: 'ਪੰਜਾਬੀ' },
  ];

  try {
    await sendReplyButtons(guest.phone_number, body, buttons);
    console.log(`[RESET] Sent language selection after reset to ${guest.phone_number}`);
  } catch (error) {
    console.error(`[RESET] Failed to send language selection after reset:`, error);
    throw error;
  }
}

// ============================================================
// RSVP FLOW
// ============================================================

/**
 * Handle RSVP menu selection
 * Shows different prompts based on whether guest has already RSVP'd
 */
async function handleRsvp(guest: Guest): Promise<void> {
  const language = guest.user_language || 'EN';

  if (guest.rsvp_status === null) {
    // First-time RSVP: show Yes/No buttons
    await showRsvpPrompt(guest.phone_number, language);
  } else {
    // Returning guest: show current status with Update button
    await showRsvpStatus(guest);
  }
}

/**
 * Handle RSVP button presses (rsvp_yes, rsvp_no, rsvp_update, rsvp_back)
 */
async function handleRsvpButton(guest: Guest, buttonId: string): Promise<string | null> {
  const language = guest.user_language || 'EN';

  switch (buttonId) {
    case RSVP_IDS.YES:
      // User wants to attend - show count list
      await showGuestCountList(guest.phone_number, language);
      return null;

    case RSVP_IDS.NO:
      // User cannot attend - save status and show confirmation
      await updateGuestRsvpNo(guest.id);
      console.log(`[RSVP] ${guest.phone_number} declined attendance`);
      await sendContentWithBackButton(
        guest.phone_number,
        getMessage('rsvp.thankYou.no', language),
        language
      );
      return null;

    case RSVP_IDS.UPDATE:
      // User wants to update their RSVP - show count list
      await showGuestCountList(guest.phone_number, language);
      return null;

    case RSVP_IDS.BACK:
      // User wants to go back to menu
      await showMainMenu(guest.phone_number, language);
      return null;

    default:
      // Unknown RSVP button - show menu
      await showMainMenu(guest.phone_number, language);
      return null;
  }
}

/**
 * Handle count selection from the guest count list
 */
async function handleCountSelection(guest: Guest, buttonId: string): Promise<string | null> {
  const language = guest.user_language || 'EN';
  const count = extractCount(buttonId);

  if (count === null) {
    // Invalid count - show menu
    await showMainMenu(guest.phone_number, language);
    return null;
  }

  // Save RSVP with guest count
  await updateGuestRsvpYes(guest.id, count);
  console.log(`[RSVP] ${guest.phone_number} confirmed attendance with ${count} guests`);

  // Show appropriate thank you message
  let thankYouMessage: string;
  if (count === 10) {
    // 10+ guests - special message about follow-up
    thankYouMessage = getMessage('rsvp.thankYou.10plus', language);
  } else {
    thankYouMessage = getMessage('rsvp.thankYou.yes', language);
  }

  await sendContentWithBackButton(guest.phone_number, thankYouMessage, language);
  return null;
}

/**
 * Show RSVP Yes/No prompt for first-time guests
 */
async function showRsvpPrompt(phoneNumber: string, language: UserLanguage): Promise<void> {
  const body = getMessage('rsvp.prompt', language);

  const buttons: ReplyButton[] = [
    { id: RSVP_IDS.YES, title: getMessage('rsvp.button.yes', language) },
    { id: RSVP_IDS.NO, title: getMessage('rsvp.button.no', language) },
  ];

  try {
    await sendReplyButtons(phoneNumber, body, buttons);
    console.log(`[RSVP] Sent RSVP prompt to ${phoneNumber}`);
  } catch (error) {
    console.error(`[RSVP] Failed to send RSVP prompt:`, error);
    throw error;
  }
}

/**
 * Show current RSVP status for returning guests with Update button
 */
async function showRsvpStatus(guest: Guest): Promise<void> {
  const language = guest.user_language || 'EN';

  let statusMessage: string;
  if (guest.rsvp_status === 'YES') {
    const count = guest.rsvp_guest_count === 10 ? '10+' : String(guest.rsvp_guest_count || 1);
    statusMessage = getMessageWithValues('rsvp.confirmed.yes', language, { count });
  } else {
    statusMessage = getMessage('rsvp.confirmed.no', language);
  }

  const buttons: ReplyButton[] = [
    { id: RSVP_IDS.UPDATE, title: getMessage('rsvp.button.update', language) },
    { id: RSVP_IDS.BACK, title: getMessage('rsvp.button.back', language) },
  ];

  try {
    await sendReplyButtons(guest.phone_number, statusMessage, buttons);
    console.log(`[RSVP] Sent RSVP status to ${guest.phone_number}`);
  } catch (error) {
    console.error(`[RSVP] Failed to send RSVP status:`, error);
    throw error;
  }
}

/**
 * Show guest count list (1-10+) for RSVP
 */
async function showGuestCountList(phoneNumber: string, language: UserLanguage): Promise<void> {
  const body = getMessage('rsvp.countPrompt', language);
  const buttonText = getMessage('rsvp.countButton', language);

  // Build rows for 1-9 and 10+
  const rows = [
    { id: COUNT_IDS.COUNT_1, title: '1', description: '' },
    { id: COUNT_IDS.COUNT_2, title: '2', description: '' },
    { id: COUNT_IDS.COUNT_3, title: '3', description: '' },
    { id: COUNT_IDS.COUNT_4, title: '4', description: '' },
    { id: COUNT_IDS.COUNT_5, title: '5', description: '' },
    { id: COUNT_IDS.COUNT_6, title: '6', description: '' },
    { id: COUNT_IDS.COUNT_7, title: '7', description: '' },
    { id: COUNT_IDS.COUNT_8, title: '8', description: '' },
    { id: COUNT_IDS.COUNT_9, title: '9', description: '' },
    { id: COUNT_IDS.COUNT_10_PLUS, title: getMessage('rsvp.count.10plus', language), description: '' },
  ];

  const sections: ListSection[] = [
    {
      title: 'Guests',
      rows,
    },
  ];

  try {
    await sendListMessage(phoneNumber, body, buttonText, sections);
    console.log(`[RSVP] Sent guest count list to ${phoneNumber}`);
  } catch (error) {
    console.error(`[RSVP] Failed to send guest count list:`, error);
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

  try {
    const contacts = await getContactsBySide(guest.user_side);

    if (contacts.length === 0) {
      await sendContentWithBackButton(
        guest.phone_number,
        getMessage('error.noData', language),
        language
      );
      return;
    }

    const content = formatContactsContent(contacts, language);
    setCache(cacheKey, content);
    await sendContentWithBackButton(guest.phone_number, content, language);
  } catch (error) {
    console.error('[CONTACTS] Error fetching coordinator contacts:', error);
    await sendContentWithBackButton(
      guest.phone_number,
      getMessage('error.noData', language),
      language
    );
  }
}

function formatContactsContent(contacts: CoordinatorContact[], language: UserLanguage): string {
  const header = getMessage('content.emergency.header', language);
  const phoneLabel = getMessage('content.contact.phone', language);

  const contactList = contacts
    .map((contact) => {
      let text = `*${contact.name}*`;
      if (contact.role) {
        text += ` (${contact.role})`;
      }
      text += `\n${phoneLabel}: ${contact.phone_number}`;
      return text;
    })
    .join('\n\n');

  return `${header}\n\n${contactList}`;
}

/**
 * Get the gifts page URL based on language
 */
function getGiftsPageUrl(language: UserLanguage): string {
  const baseUrl = process.env.PUBLIC_URL || 'https://wedding-jarvis-production.up.railway.app';
  switch (language) {
    case 'HI':
      return `${baseUrl}/gifts/hi`;
    case 'PA':
      return `${baseUrl}/gifts/pa`;
    default:
      return `${baseUrl}/gifts`;
  }
}

async function sendGiftRegistry(guest: Guest): Promise<void> {
  const language = guest.user_language || 'EN';
  const giftsLink = getGiftsPageUrl(language);
  const content = getMessageWithValues('gifts.info', language, { giftsLink });
  await sendContentWithBackButton(guest.phone_number, content, language);
}
