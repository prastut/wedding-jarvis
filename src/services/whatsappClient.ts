import { config } from '../config';
import type { WhatsAppSendResponse } from '../types';

const WHATSAPP_API_URL = 'https://graph.facebook.com/v18.0';

// Types for interactive messages
export interface ReplyButton {
  id: string;
  title: string; // Max 20 characters
}

export interface ListRow {
  id: string;
  title: string; // Max 24 characters
  description?: string; // Max 72 characters
}

export interface ListSection {
  title?: string; // Max 24 characters
  rows: ListRow[];
}

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
 * Send interactive reply buttons (max 3 buttons)
 * Button titles max 20 characters
 */
export async function sendReplyButtons(
  to: string,
  bodyText: string,
  buttons: ReplyButton[],
  headerText?: string
): Promise<WhatsAppSendResponse> {
  if (buttons.length > 3) {
    throw new Error('Reply buttons limited to 3 maximum');
  }

  const url = `${WHATSAPP_API_URL}/${config.whatsapp.phoneNumberId}/messages`;

  const interactive: Record<string, unknown> = {
    type: 'button',
    body: { text: bodyText },
    action: {
      buttons: buttons.map((btn) => ({
        type: 'reply',
        reply: {
          id: btn.id,
          title: btn.title.substring(0, 20),
        },
      })),
    },
  };

  if (headerText) {
    interactive.header = { type: 'text', text: headerText };
  }

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
    console.error('WhatsApp API error (reply buttons):', error);
    throw new Error(`WhatsApp API error: ${response.status} - ${JSON.stringify(error)}`);
  }

  return response.json() as Promise<WhatsAppSendResponse>;
}

/**
 * Send interactive list message (max 10 items total across sections)
 */
export async function sendListMessage(
  to: string,
  bodyText: string,
  buttonText: string,
  sections: ListSection[],
  headerText?: string
): Promise<WhatsAppSendResponse> {
  const totalRows = sections.reduce((sum, s) => sum + s.rows.length, 0);
  if (totalRows > 10) {
    throw new Error('List message limited to 10 items total');
  }

  const url = `${WHATSAPP_API_URL}/${config.whatsapp.phoneNumberId}/messages`;

  const interactive: Record<string, unknown> = {
    type: 'list',
    body: { text: bodyText },
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
    interactive.header = { type: 'text', text: headerText };
  }

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
    console.error('WhatsApp API error (list message):', error);
    throw new Error(`WhatsApp API error: ${response.status} - ${JSON.stringify(error)}`);
  }

  return response.json() as Promise<WhatsAppSendResponse>;
}
