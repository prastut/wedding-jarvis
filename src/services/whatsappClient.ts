import { config } from '../config';
import type { WhatsAppSendResponse } from '../types';
import type { ReplyButton, ListSection, InteractivePayload } from '../types/whatsapp';

// Re-export types for convenience
export type { ReplyButton, ListRow, ListSection } from '../types/whatsapp';

const WHATSAPP_API_URL = 'https://graph.facebook.com/v18.0';

export interface SendMessageOptions {
  to: string;
  text: string;
}

export async function sendTextMessage(options: SendMessageOptions): Promise<WhatsAppSendResponse> {
  const { to, text } = options;

  const url = `${WHATSAPP_API_URL}/${config.whatsapp.phoneNumberId}/messages`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.whatsapp.accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to,
      type: 'text',
      text: { body: text },
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    console.error('WhatsApp API error:', error);
    throw new Error(`WhatsApp API error: ${response.status} - ${JSON.stringify(error)}`);
  }

  return response.json() as Promise<WhatsAppSendResponse>;
}

export async function sendTemplateMessage(
  to: string,
  templateName: string,
  languageCode: string = 'en'
): Promise<WhatsAppSendResponse> {
  const url = `${WHATSAPP_API_URL}/${config.whatsapp.phoneNumberId}/messages`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.whatsapp.accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to,
      type: 'template',
      template: {
        name: templateName,
        language: { code: languageCode },
      },
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    console.error('WhatsApp API error:', error);
    throw new Error(`WhatsApp API error: ${response.status} - ${JSON.stringify(error)}`);
  }

  return response.json() as Promise<WhatsAppSendResponse>;
}

/**
 * Send an interactive message to WhatsApp
 * @internal Used by sendReplyButtons and sendListMessage
 */
async function sendInteractiveMessage(
  to: string,
  interactive: InteractivePayload
): Promise<WhatsAppSendResponse> {
  const url = `${WHATSAPP_API_URL}/${config.whatsapp.phoneNumberId}/messages`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.whatsapp.accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to,
      type: 'interactive',
      interactive,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    console.error('[INTERACTIVE] WhatsApp API error:', error);
    throw new Error(`WhatsApp API error: ${response.status} - ${JSON.stringify(error)}`);
  }

  return response.json() as Promise<WhatsAppSendResponse>;
}

/**
 * Send interactive reply buttons (max 3 buttons)
 *
 * @param to - Recipient phone number
 * @param bodyText - Message body text (max 1024 characters)
 * @param buttons - Array of buttons (max 3, each title max 20 characters)
 * @param headerText - Optional header text (max 60 characters)
 * @returns WhatsApp API response
 *
 * @example
 * ```ts
 * await sendReplyButtons(phoneNumber, 'Select your language:', [
 *   { id: 'lang_en', title: 'English' },
 *   { id: 'lang_hi', title: 'हिंदी' },
 *   { id: 'lang_pa', title: 'ਪੰਜਾਬੀ' },
 * ]);
 * ```
 */
export async function sendReplyButtons(
  to: string,
  bodyText: string,
  buttons: ReplyButton[],
  headerText?: string
): Promise<WhatsAppSendResponse> {
  // Validate button count
  if (buttons.length > 3) {
    throw new Error(`Reply buttons limited to 3 maximum, got ${buttons.length}`);
  }

  if (buttons.length === 0) {
    throw new Error('At least one button is required');
  }

  // Build interactive payload with truncation for safety
  const interactive: InteractivePayload = {
    type: 'button',
    body: { text: bodyText.substring(0, 1024) },
    action: {
      buttons: buttons.map((btn) => ({
        type: 'reply' as const,
        reply: {
          id: btn.id,
          title: btn.title.substring(0, 20),
        },
      })),
    },
  };

  if (headerText) {
    interactive.header = { type: 'text', text: headerText.substring(0, 60) };
  }

  return sendInteractiveMessage(to, interactive);
}

/**
 * Send interactive list message (max 10 items total across all sections)
 *
 * @param to - Recipient phone number
 * @param bodyText - Message body text (max 1024 characters)
 * @param buttonText - Text for the button that opens the list (max 20 characters)
 * @param sections - Array of sections, each containing rows
 * @param headerText - Optional header text (max 60 characters)
 * @returns WhatsApp API response
 *
 * @example
 * ```ts
 * await sendListMessage(
 *   phoneNumber,
 *   'How can I help you today?',
 *   'View Options',
 *   [{
 *     title: 'Main Menu',
 *     rows: [
 *       { id: 'menu_schedule', title: 'Event Schedule', description: 'View all wedding events' },
 *       { id: 'menu_venue', title: 'Venue & Directions', description: 'Get venue details' },
 *     ]
 *   }]
 * );
 * ```
 */
export async function sendListMessage(
  to: string,
  bodyText: string,
  buttonText: string,
  sections: ListSection[],
  headerText?: string
): Promise<WhatsAppSendResponse> {
  // Validate total row count
  const totalRows = sections.reduce((sum, s) => sum + s.rows.length, 0);
  if (totalRows > 10) {
    throw new Error(`List message limited to 10 items total, got ${totalRows}`);
  }

  if (totalRows === 0) {
    throw new Error('At least one list item is required');
  }

  // Build interactive payload with truncation for safety
  const interactive: InteractivePayload = {
    type: 'list',
    body: { text: bodyText.substring(0, 1024) },
    action: {
      button: buttonText.substring(0, 20),
      sections: sections.map((section) => ({
        title: section.title?.substring(0, 24),
        rows: section.rows.map((row) => ({
          id: row.id,
          title: row.title.substring(0, 24),
          description: row.description?.substring(0, 72),
        })),
      })),
    },
  };

  if (headerText) {
    interactive.header = { type: 'text', text: headerText.substring(0, 60) };
  }

  return sendInteractiveMessage(to, interactive);
}
