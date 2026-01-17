import { getSupabase } from '../db/client';
import type {
  Event,
  Venue,
  FAQ,
  CoordinatorContact,
  Guest,
  UserLanguage,
  UserSide,
} from '../types';
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
    return 'You have been unsubscribed. Reply START to subscribe again.';
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
  // Handle navigation
  if (buttonId && isNavId(buttonId)) {
    if (buttonId === NAV_IDS.BACK_TO_MENU) {
      await showMainMenu(guest.phone_number, guest.user_language!);
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
    await showMainMenu(guest.phone_number, guest.user_language!);
    return null;
  }

  if (buttonId && isSideId(buttonId)) {
    // They somehow got a side button while onboarded - treat as reset
    await showMainMenu(guest.phone_number, guest.user_language!);
    return null;
  }

  // Handle text commands (legacy support)
  if (textInput === 'MENU' || textInput === '0' || textInput === 'HI' || textInput === 'HELLO') {
    await showMainMenu(guest.phone_number, guest.user_language!);
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
  await showMainMenu(guest.phone_number, guest.user_language!);
  return getFallbackMessage(guest.user_language!);
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
      await sendContentWithBackButton(
        guest.phone_number,
        getStubContent('Travel & Stay', language),
        language
      );
      return null;

    case MENU_IDS.RSVP:
      // TODO PR-09: Full RSVP flow
      await sendContentWithBackButton(
        guest.phone_number,
        getStubContent('RSVP', language),
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
      await sendContentWithBackButton(
        guest.phone_number,
        getStubContent('Gift Registry', language),
        language
      );
      return null;

    case MENU_IDS.RESET:
      // TODO PR-10: Reset flow
      await sendContentWithBackButton(
        guest.phone_number,
        getStubContent('Reset', language),
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
  const body = `Welcome to Sanjoli & Shreyas's Wedding! 🌸

Please select your language:`;

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
  const messages: Record<UserLanguage, { body: string; groom: string; bride: string }> = {
    EN: {
      body: `Thank you! 🙏

Please select your side:`,
      groom: "Groom's Side (Shreyas)",
      bride: "Bride's Side (Sanjoli)",
    },
    HI: {
      body: `धन्यवाद! 🙏

कृपया अपना पक्ष चुनें:`,
      groom: 'वर पक्ष (श्रेयस)',
      bride: 'वधू पक्ष (संजोली)',
    },
    PA: {
      body: `ਧੰਨਵਾਦ! 🙏

ਕਿਰਪਾ ਕਰਕੇ ਆਪਣਾ ਪੱਖ ਚੁਣੋ:`,
      groom: 'ਲਾੜੇ ਵਾਲੇ (ਸ਼੍ਰੇਯਸ)',
      bride: 'ਲਾੜੀ ਵਾਲੇ (ਸੰਜੋਲੀ)',
    },
  };

  const msg = messages[language];
  const buttons: ReplyButton[] = [
    { id: SIDE_IDS.GROOM, title: msg.groom },
    { id: SIDE_IDS.BRIDE, title: msg.bride },
  ];

  try {
    await sendReplyButtons(phoneNumber, msg.body, buttons);
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
  const menus: Record<
    UserLanguage,
    {
      body: string;
      button: string;
      items: Array<{ id: string; title: string; description: string }>;
    }
  > = {
    EN: {
      body: 'How can I help you today?',
      button: 'View Options',
      items: [
        { id: MENU_IDS.SCHEDULE, title: 'Event Schedule', description: 'View all wedding events' },
        {
          id: MENU_IDS.VENUE,
          title: 'Venue & Directions',
          description: 'Get venue details & maps',
        },
        {
          id: MENU_IDS.TRAVEL,
          title: 'Travel & Stay',
          description: 'Travel and accommodation info',
        },
        { id: MENU_IDS.RSVP, title: 'RSVP', description: 'Confirm your attendance' },
        { id: MENU_IDS.EMERGENCY, title: 'Emergency Contact', description: 'Get help immediately' },
        { id: MENU_IDS.FAQ, title: 'FAQs', description: 'Common questions answered' },
        { id: MENU_IDS.GIFTS, title: 'Gift Registry', description: 'View gift suggestions' },
        {
          id: MENU_IDS.RESET,
          title: 'Change Language/Side',
          description: 'Update your preferences',
        },
      ],
    },
    HI: {
      body: 'मैं आज आपकी कैसे मदद कर सकता हूं?',
      button: 'विकल्प देखें',
      items: [
        {
          id: MENU_IDS.SCHEDULE,
          title: 'कार्यक्रम सूची',
          description: 'सभी शादी के कार्यक्रम देखें',
        },
        {
          id: MENU_IDS.VENUE,
          title: 'स्थान और दिशा',
          description: 'स्थान विवरण और नक्शा प्राप्त करें',
        },
        { id: MENU_IDS.TRAVEL, title: 'यात्रा और ठहराव', description: 'यात्रा और आवास जानकारी' },
        { id: MENU_IDS.RSVP, title: 'RSVP', description: 'अपनी उपस्थिति की पुष्टि करें' },
        {
          id: MENU_IDS.EMERGENCY,
          title: 'आपातकालीन संपर्क',
          description: 'तुरंत सहायता प्राप्त करें',
        },
        {
          id: MENU_IDS.FAQ,
          title: 'अक्सर पूछे जाने वाले प्रश्न',
          description: 'सामान्य प्रश्नों के उत्तर',
        },
        { id: MENU_IDS.GIFTS, title: 'उपहार सूची', description: 'उपहार सुझाव देखें' },
        {
          id: MENU_IDS.RESET,
          title: 'भाषा/पक्ष बदलें',
          description: 'अपनी प्राथमिकताएं अपडेट करें',
        },
      ],
    },
    PA: {
      body: 'ਅੱਜ ਮੈਂ ਤੁਹਾਡੀ ਕਿਵੇਂ ਮਦਦ ਕਰ ਸਕਦਾ ਹਾਂ?',
      button: 'ਵਿਕਲਪ ਦੇਖੋ',
      items: [
        { id: MENU_IDS.SCHEDULE, title: 'ਸਮਾਗਮ ਸੂਚੀ', description: 'ਸਾਰੇ ਵਿਆਹ ਦੇ ਸਮਾਗਮ ਦੇਖੋ' },
        {
          id: MENU_IDS.VENUE,
          title: 'ਸਥਾਨ ਅਤੇ ਦਿਸ਼ਾ',
          description: 'ਸਥਾਨ ਵੇਰਵੇ ਅਤੇ ਨਕਸ਼ਾ ਪ੍ਰਾਪਤ ਕਰੋ',
        },
        {
          id: MENU_IDS.TRAVEL,
          title: 'ਯਾਤਰਾ ਅਤੇ ਠਹਿਰਾਅ',
          description: 'ਯਾਤਰਾ ਅਤੇ ਰਹਿਣ ਦੀ ਜਾਣਕਾਰੀ',
        },
        { id: MENU_IDS.RSVP, title: 'RSVP', description: 'ਆਪਣੀ ਹਾਜ਼ਰੀ ਦੀ ਪੁਸ਼ਟੀ ਕਰੋ' },
        { id: MENU_IDS.EMERGENCY, title: 'ਐਮਰਜੈਂਸੀ ਸੰਪਰਕ', description: 'ਤੁਰੰਤ ਮਦਦ ਪ੍ਰਾਪਤ ਕਰੋ' },
        { id: MENU_IDS.FAQ, title: 'ਅਕਸਰ ਪੁੱਛੇ ਸਵਾਲ', description: 'ਆਮ ਸਵਾਲਾਂ ਦੇ ਜਵਾਬ' },
        { id: MENU_IDS.GIFTS, title: 'ਤੋਹਫ਼ਾ ਸੂਚੀ', description: 'ਤੋਹਫ਼ੇ ਦੇ ਸੁਝਾਅ ਦੇਖੋ' },
        { id: MENU_IDS.RESET, title: 'ਭਾਸ਼ਾ/ਪੱਖ ਬਦਲੋ', description: 'ਆਪਣੀਆਂ ਤਰਜੀਹਾਂ ਅੱਪਡੇਟ ਕਰੋ' },
      ],
    },
  };

  const menu = menus[language];
  const sections: ListSection[] = [
    {
      title: 'Menu',
      rows: menu.items.map((item) => ({
        id: item.id,
        title: item.title,
        description: item.description,
      })),
    },
  ];

  // Combine welcome message with menu body if provided
  const body = welcomePrefix ? `${welcomePrefix}\n\n${menu.body}` : menu.body;

  try {
    await sendListMessage(phoneNumber, body, menu.button, sections);
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
  const sideName = {
    EN: side === 'GROOM' ? "Groom's family" : "Bride's family",
    HI: side === 'GROOM' ? 'वर पक्ष' : 'वधू पक्ष',
    PA: side === 'GROOM' ? 'ਲਾੜੇ ਵਾਲੇ' : 'ਲਾੜੀ ਵਾਲੇ',
  };

  const messages: Record<UserLanguage, string> = {
    EN: `Welcome, ${sideName.EN}! 🎉

You're all set!`,
    HI: `स्वागत है, ${sideName.HI}! 🎉

आप तैयार हैं!`,
    PA: `ਜੀ ਆਇਆਂ ਨੂੰ, ${sideName.PA}! 🎉

ਤੁਸੀਂ ਤਿਆਰ ਹੋ!`,
  };

  return messages[language];
}

/**
 * Get fallback message for unknown inputs
 */
function getFallbackMessage(language: UserLanguage): string {
  const messages: Record<UserLanguage, string> = {
    EN: "I didn't understand that. Please select an option from the menu:",
    HI: 'मैं समझ नहीं पाया। कृपया मेनू से एक विकल्प चुनें:',
    PA: 'ਮੈਂ ਸਮਝ ਨਹੀਂ ਸਕਿਆ। ਕਿਰਪਾ ਕਰਕੇ ਮੇਨੂ ਤੋਂ ਇੱਕ ਵਿਕਲਪ ਚੁਣੋ:',
  };
  return messages[language];
}

/**
 * Get "Back to Menu" button label in user's language
 */
function getBackToMenuLabel(language: UserLanguage): string {
  const labels: Record<UserLanguage, string> = {
    EN: 'Back to Menu',
    HI: 'मेनू पर वापस',
    PA: 'ਮੇਨੂ ਤੇ ਵਾਪਸ',
  };
  return labels[language];
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
    { id: NAV_IDS.BACK_TO_MENU, title: getBackToMenuLabel(language) },
  ];

  try {
    await sendReplyButtons(phoneNumber, content, buttons);
    console.log(`[INTERACTIVE] Sent content with back button to ${phoneNumber}`);
  } catch (error) {
    console.error(`[INTERACTIVE] Failed to send content with back button:`, error);
    throw error;
  }
}

/**
 * Get stub content for features not yet implemented
 */
function getStubContent(feature: string, language: UserLanguage): string {
  const messages: Record<UserLanguage, string> = {
    EN: `${feature} feature coming soon!`,
    HI: `${feature} सुविधा जल्द आ रही है!`,
    PA: `${feature} ਸੁਵਿਧਾ ਜਲਦੀ ਆ ਰਹੀ ਹੈ!`,
  };
  return messages[language];
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

  const supabase = getSupabase();

  // Fetch events filtered by side
  let query = supabase
    .from('events')
    .select('*, venues(name)')
    .order('sort_order', { ascending: true });

  // Filter by side: show events for guest's side or BOTH
  if (guest.user_side) {
    query = query.or(`side.eq.${guest.user_side},side.eq.BOTH`);
  }

  const { data: events, error } = await query;

  if (error || !events || events.length === 0) {
    await sendContentWithBackButton(
      guest.phone_number,
      getStubContent('Schedule', language),
      language
    );
    return;
  }

  const headers: Record<UserLanguage, string> = {
    EN: '*Event Schedule*',
    HI: '*कार्यक्रम सूची*',
    PA: '*ਸਮਾਗਮ ਸੂਚੀ*',
  };

  const eventList = events
    .map((event: Event & { venues?: { name: string } }) => {
      const date = new Date(event.start_time);
      const dateStr = date.toLocaleDateString(language === 'EN' ? 'en-US' : 'hi-IN', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
      });
      const timeStr = date.toLocaleTimeString(language === 'EN' ? 'en-US' : 'hi-IN', {
        hour: 'numeric',
        minute: '2-digit',
      });
      const venue = event.venues?.name || '';

      // Get translated name
      const name =
        (language === 'HI' && event.name_hi) || (language === 'PA' && event.name_pa) || event.name;

      return `*${name}*\n${dateStr} at ${timeStr}${venue ? `\nVenue: ${venue}` : ''}`;
    })
    .join('\n\n');

  const content = `${headers[language]}\n\n${eventList}`;
  setCache(cacheKey, content);
  await sendContentWithBackButton(guest.phone_number, content, language);
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
      getStubContent('Venues', language),
      language
    );
    return;
  }

  const headers: Record<UserLanguage, string> = {
    EN: '*Venue & Directions*',
    HI: '*स्थान और दिशा-निर्देश*',
    PA: '*ਸਥਾਨ ਅਤੇ ਦਿਸ਼ਾ-ਨਿਰਦੇਸ਼*',
  };

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
        text += `\nMap: ${venue.google_maps_link}`;
      }
      if (parking) {
        text += `\nParking: ${parking}`;
      }
      return text;
    })
    .join('\n\n');

  const content = `${headers[language]}\n\n${venueList}`;
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
      getStubContent('FAQs', language),
      language
    );
    return;
  }

  const headers: Record<UserLanguage, string> = {
    EN: '*Frequently Asked Questions*',
    HI: '*अक्सर पूछे जाने वाले प्रश्न*',
    PA: '*ਅਕਸਰ ਪੁੱਛੇ ਜਾਣ ਵਾਲੇ ਸਵਾਲ*',
  };

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

  const content = `${headers[language]}\n\n${faqList}`;
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
        getStubContent('Emergency Contact', language),
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
  const headers: Record<UserLanguage, string> = {
    EN: '*Emergency Contact*',
    HI: '*आपातकालीन संपर्क*',
    PA: '*ਐਮਰਜੈਂਸੀ ਸੰਪਰਕ*',
  };

  const phoneLabels: Record<UserLanguage, string> = {
    EN: 'Phone',
    HI: 'फोन',
    PA: 'ਫੋਨ',
  };

  let text = `${headers[language]}\n\n${contact.name}`;
  if (contact.role) {
    text += ` (${contact.role})`;
  }
  text += `\n${phoneLabels[language]}: ${contact.phone_number}`;
  return text;
}
