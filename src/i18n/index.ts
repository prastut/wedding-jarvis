/**
 * i18n System for Wedding Jarvis Bot
 *
 * Provides internationalization with language fallback.
 * Usage: getMessage('welcome.title', 'HI') -> returns Hindi or falls back to English
 */

import type { UserLanguage, UserSide } from '../types';
import { messages as en } from './en';
import { messages as hi } from './hi';
import { messages as pa } from './pa';

// ============================================================
// MESSAGE KEY TYPE
// ============================================================

/**
 * All valid message keys (derived from English messages)
 */
export type MessageKey = keyof typeof en;

/**
 * Message collection type
 */
export type MessageCollection = Record<MessageKey, string>;

// ============================================================
// MESSAGE COLLECTIONS
// ============================================================

const messagesByLanguage: Record<UserLanguage, MessageCollection> = {
  EN: en,
  HI: hi,
  PA: pa,
};

// ============================================================
// CORE FUNCTIONS
// ============================================================

/**
 * Get a translated message by key and language
 * Falls back to English if the translation is missing
 *
 * @param key - The message key (e.g., 'welcome.title')
 * @param language - The target language (EN, HI, PA)
 * @returns The translated message string
 */
export function getMessage(key: MessageKey, language: UserLanguage = 'EN'): string {
  const messages = messagesByLanguage[language];
  const message = messages?.[key];

  // If translation exists, return it
  if (message) {
    return message;
  }

  // Fall back to English
  const fallback = en[key];
  if (fallback) {
    console.warn(`[i18n] Missing translation for key '${key}' in language '${language}'`);
    return fallback;
  }

  // Key doesn't exist at all
  console.error(`[i18n] Unknown message key: '${key}'`);
  return key;
}

/**
 * Get a message with interpolation support
 * Replaces {placeholders} with provided values
 *
 * @param key - The message key
 * @param language - The target language
 * @param values - Object with placeholder values
 * @returns The translated and interpolated message
 */
export function getMessageWithValues(
  key: MessageKey,
  language: UserLanguage,
  values: Record<string, string | number>
): string {
  let message = getMessage(key, language);

  for (const [placeholder, value] of Object.entries(values)) {
    message = message.replace(new RegExp(`\\{${placeholder}\\}`, 'g'), String(value));
  }

  return message;
}

/**
 * Get the side name in the specified language
 *
 * @param side - GROOM or BRIDE
 * @param language - Target language
 * @returns Translated side name
 */
export function getSideName(side: UserSide, language: UserLanguage): string {
  const key: MessageKey = side === 'GROOM' ? 'common.side.groom' : 'common.side.bride';
  return getMessage(key, language);
}

/**
 * Get the side name with person's name (for side selection buttons)
 *
 * @param side - GROOM or BRIDE
 * @param language - Target language
 * @returns Translated side with person name (e.g., "Groom's Side (Shreyas)")
 */
export function getSideWithName(side: UserSide, language: UserLanguage): string {
  const key: MessageKey = side === 'GROOM' ? 'side.button.groom' : 'side.button.bride';
  return getMessage(key, language);
}

// ============================================================
// MENU HELPERS
// ============================================================

/**
 * Menu item structure for list messages
 */
export interface MenuItem {
  id: string;
  title: string;
  description: string;
}

/**
 * Get all menu items translated for the specified language
 */
export function getMenuItems(language: UserLanguage): MenuItem[] {
  return [
    {
      id: 'menu_schedule',
      title: getMessage('menu.items.schedule.title', language),
      description: getMessage('menu.items.schedule.description', language),
    },
    {
      id: 'menu_venue',
      title: getMessage('menu.items.venue.title', language),
      description: getMessage('menu.items.venue.description', language),
    },
    {
      id: 'menu_travel',
      title: getMessage('menu.items.travel.title', language),
      description: getMessage('menu.items.travel.description', language),
    },
    {
      id: 'menu_rsvp',
      title: getMessage('menu.items.rsvp.title', language),
      description: getMessage('menu.items.rsvp.description', language),
    },
    {
      id: 'menu_emergency',
      title: getMessage('menu.items.emergency.title', language),
      description: getMessage('menu.items.emergency.description', language),
    },
    {
      id: 'menu_faq',
      title: getMessage('menu.items.faq.title', language),
      description: getMessage('menu.items.faq.description', language),
    },
    {
      id: 'menu_gifts',
      title: getMessage('menu.items.gifts.title', language),
      description: getMessage('menu.items.gifts.description', language),
    },
    {
      id: 'menu_reset',
      title: getMessage('menu.items.reset.title', language),
      description: getMessage('menu.items.reset.description', language),
    },
  ];
}

// ============================================================
// RE-EXPORTS
// ============================================================

export { en, hi, pa };
