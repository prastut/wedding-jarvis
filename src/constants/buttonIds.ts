/**
 * Button and List IDs for WhatsApp Interactive Messages
 *
 * All IDs used in the Wedding Jarvis bot for interactive message buttons and lists.
 * These IDs are returned in webhook payloads when users tap buttons/list items.
 */

import type { UserLanguage, UserSide } from '../types';

// ============================================================
// LANGUAGE SELECTION (Reply Buttons)
// ============================================================

export const LANG_IDS = {
  ENGLISH: 'lang_en',
  HINDI: 'lang_hi',
  PUNJABI: 'lang_pa',
} as const;

export type LanguageId = (typeof LANG_IDS)[keyof typeof LANG_IDS];

/**
 * Check if an ID is a language selection ID
 */
export function isLanguageId(id: string): id is LanguageId {
  return id.startsWith('lang_');
}

/**
 * Extract the UserLanguage code from a language button ID
 * @param id - The button ID (e.g., 'lang_en')
 * @returns The language code (e.g., 'EN') or null if invalid
 */
export function extractLanguage(id: string): UserLanguage | null {
  if (!isLanguageId(id)) return null;

  const langMap: Record<string, UserLanguage> = {
    lang_en: 'EN',
    lang_hi: 'HI',
    lang_pa: 'PA',
  };

  return langMap[id] || null;
}

// ============================================================
// SIDE SELECTION (Reply Buttons)
// ============================================================

export const SIDE_IDS = {
  GROOM: 'side_groom',
  BRIDE: 'side_bride',
} as const;

export type SideId = (typeof SIDE_IDS)[keyof typeof SIDE_IDS];

/**
 * Check if an ID is a side selection ID
 */
export function isSideId(id: string): id is SideId {
  return id.startsWith('side_');
}

/**
 * Extract the UserSide from a side button ID
 * @param id - The button ID (e.g., 'side_groom')
 * @returns The side code (e.g., 'GROOM') or null if invalid
 */
export function extractSide(id: string): UserSide | null {
  if (!isSideId(id)) return null;

  const sideMap: Record<string, UserSide> = {
    side_groom: 'GROOM',
    side_bride: 'BRIDE',
  };

  return sideMap[id] || null;
}

// ============================================================
// MAIN MENU (List Message)
// ============================================================

export const MENU_IDS = {
  SCHEDULE: 'menu_schedule',
  VENUE: 'menu_venue',
  TRAVEL: 'menu_travel',
  RSVP: 'menu_rsvp',
  EMERGENCY: 'menu_emergency',
  FAQ: 'menu_faq',
  GIFTS: 'menu_gifts',
  RESET: 'menu_reset',
} as const;

export type MenuId = (typeof MENU_IDS)[keyof typeof MENU_IDS];

/**
 * Check if an ID is a menu selection ID
 */
export function isMenuId(id: string): id is MenuId {
  return id.startsWith('menu_');
}

// ============================================================
// RSVP FLOW (Reply Buttons & List)
// ============================================================

export const RSVP_IDS = {
  YES: 'rsvp_yes',
  NO: 'rsvp_no',
  UPDATE: 'rsvp_update',
  BACK: 'rsvp_back',
} as const;

export type RsvpId = (typeof RSVP_IDS)[keyof typeof RSVP_IDS];

/**
 * Check if an ID is an RSVP action ID
 */
export function isRsvpId(id: string): id is RsvpId {
  return id.startsWith('rsvp_');
}

// ============================================================
// RSVP COUNT SELECTION (List Message)
// ============================================================

export const COUNT_IDS = {
  COUNT_1: 'count_1',
  COUNT_2: 'count_2',
  COUNT_3: 'count_3',
  COUNT_4: 'count_4',
  COUNT_5: 'count_5',
  COUNT_6: 'count_6',
  COUNT_7: 'count_7',
  COUNT_8: 'count_8',
  COUNT_9: 'count_9',
  COUNT_10_PLUS: 'count_10plus',
} as const;

export type CountId = (typeof COUNT_IDS)[keyof typeof COUNT_IDS];

/**
 * Check if an ID is a count selection ID
 */
export function isCountId(id: string): id is CountId {
  return id.startsWith('count_');
}

/**
 * Extract the guest count from a count list ID
 * @param id - The list ID (e.g., 'count_3' or 'count_10plus')
 * @returns The count number (1-10, where 10 represents "10+") or null if invalid
 */
export function extractCount(id: string): number | null {
  if (!isCountId(id)) return null;

  if (id === COUNT_IDS.COUNT_10_PLUS) {
    return 10; // Store as 10 per spec
  }

  const match = id.match(/^count_(\d+)$/);
  if (match) {
    const num = parseInt(match[1], 10);
    if (num >= 1 && num <= 9) {
      return num;
    }
  }

  return null;
}

// ============================================================
// NAVIGATION
// ============================================================

export const NAV_IDS = {
  BACK_TO_MENU: 'nav_back_menu',
} as const;

export type NavId = (typeof NAV_IDS)[keyof typeof NAV_IDS];

/**
 * Check if an ID is a navigation ID
 */
export function isNavId(id: string): id is NavId {
  return id.startsWith('nav_');
}

// ============================================================
// ALL IDS TYPE
// ============================================================

/**
 * Union of all possible button/list IDs
 */
export type ButtonId = LanguageId | SideId | MenuId | RsvpId | CountId | NavId;

/**
 * Determine the category of a button/list ID
 */
export function getIdCategory(
  id: string
): 'language' | 'side' | 'menu' | 'rsvp' | 'count' | 'nav' | 'unknown' {
  if (isLanguageId(id)) return 'language';
  if (isSideId(id)) return 'side';
  if (isMenuId(id)) return 'menu';
  if (isRsvpId(id)) return 'rsvp';
  if (isCountId(id)) return 'count';
  if (isNavId(id)) return 'nav';
  return 'unknown';
}

// ============================================================
// PREFIXES FOR WEBHOOK PARSING
// ============================================================

/**
 * Prefixes used in webhook handler to distinguish interactive message types
 */
export const INTERACTIVE_PREFIXES = {
  BUTTON: 'BUTTON:',
  LIST: 'LIST:',
} as const;

/**
 * Parse a prefixed message text to extract the interactive ID
 * @param messageText - The message text (e.g., 'BUTTON:lang_en' or 'LIST:menu_schedule')
 * @returns Object with type and id, or null if not an interactive message
 */
export function parseInteractiveMessage(
  messageText: string
): { type: 'button' | 'list'; id: string } | null {
  if (messageText.startsWith(INTERACTIVE_PREFIXES.BUTTON)) {
    return {
      type: 'button',
      id: messageText.slice(INTERACTIVE_PREFIXES.BUTTON.length),
    };
  }
  if (messageText.startsWith(INTERACTIVE_PREFIXES.LIST)) {
    return {
      type: 'list',
      id: messageText.slice(INTERACTIVE_PREFIXES.LIST.length),
    };
  }
  return null;
}
