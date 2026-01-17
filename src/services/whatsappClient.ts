import { config } from '../config';
import type { WhatsAppSendResponse } from '../types';

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
      'Authorization': `Bearer ${config.whatsapp.accessToken}`,
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
      'Authorization': `Bearer ${config.whatsapp.accessToken}`,
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
