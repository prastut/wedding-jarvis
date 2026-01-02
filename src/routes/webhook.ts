import { Router, Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { config } from '../config';
import { sendTextMessage } from '../services/whatsapp/client';
import { handleMessage } from '../services/bot/menu-router';
import { findOrCreateGuest } from '../repositories/guests';
import { logMessage } from '../repositories/message-logs';
import type { WhatsAppInboundMessage } from '../types';

const router = Router();

// Webhook signature validation middleware
function validateSignature(req: Request & { rawBody?: Buffer }, res: Response, next: NextFunction): void {
  // Skip validation if app secret is not configured
  if (!config.whatsapp.appSecret) {
    console.warn('WHATSAPP_APP_SECRET not configured - skipping signature validation');
    next();
    return;
  }

  const signature = req.headers['x-hub-signature-256'] as string;
  if (!signature) {
    console.error('Missing X-Hub-Signature-256 header');
    res.sendStatus(401);
    return;
  }

  const rawBody = req.rawBody;
  if (!rawBody) {
    console.error('Raw body not available for signature validation');
    res.sendStatus(400);
    return;
  }

  const expectedSignature = 'sha256=' + crypto
    .createHmac('sha256', config.whatsapp.appSecret)
    .update(rawBody)
    .digest('hex');

  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
    console.error('Invalid webhook signature');
    res.sendStatus(401);
    return;
  }

  next();
}

// GET /webhook - Verification challenge from Meta
router.get('/', (req: Request, res: Response) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  console.log('Webhook verification request:', { mode, token, challenge: challenge?.toString().substring(0, 20) });

  if (mode === 'subscribe' && token === config.whatsapp.verifyToken) {
    console.log('Webhook verified successfully');
    res.status(200).send(challenge);
  } else {
    console.log('Webhook verification failed');
    res.sendStatus(403);
  }
});

// POST /webhook - Receive inbound messages
router.post('/', validateSignature, async (req: Request, res: Response) => {
  try {
    const body = req.body as WhatsAppInboundMessage;

    // Log the raw payload for debugging
    console.log('Webhook received:', JSON.stringify(body, null, 2));

    // Always respond 200 immediately to acknowledge receipt
    res.sendStatus(200);

    // Process the message asynchronously
    await processWebhook(body);
  } catch (error) {
    console.error('Webhook processing error:', error);
    // Still return 200 to prevent Meta from retrying
    res.sendStatus(200);
  }
});

async function processWebhook(body: WhatsAppInboundMessage): Promise<void> {
  if (body.object !== 'whatsapp_business_account') {
    console.log('Not a WhatsApp Business webhook, ignoring');
    return;
  }

  for (const entry of body.entry) {
    for (const change of entry.changes) {
      const value = change.value;

      // Handle status updates (delivery receipts)
      if (value.statuses) {
        for (const status of value.statuses) {
          console.log(`Message ${status.id} status: ${status.status}`);
        }
        continue;
      }

      // Handle incoming messages
      if (value.messages && value.contacts) {
        for (let i = 0; i < value.messages.length; i++) {
          const message = value.messages[i];
          const contact = value.contacts[i];

          if (message.type === 'text' && message.text) {
            await handleInboundMessage(
              message.from,
              message.text.body,
              contact?.profile?.name,
              body
            );
          } else {
            console.log(`Received non-text message type: ${message.type}`);
            // Respond with menu for unsupported message types
            await handleInboundMessage(
              message.from,
              'MENU',
              contact?.profile?.name,
              body
            );
          }
        }
      }
    }
  }
}

async function handleInboundMessage(
  phoneNumber: string,
  messageText: string,
  senderName: string | undefined,
  rawPayload: WhatsAppInboundMessage
): Promise<void> {
  try {
    console.log(`Processing message from ${phoneNumber}: "${messageText}"`);

    // Run guest lookup and inbound logging in parallel (non-blocking for response)
    const guestPromise = findOrCreateGuest(phoneNumber, senderName);
    const inboundLogPromise = logMessage(phoneNumber, 'inbound', messageText, rawPayload as unknown as Record<string, unknown>);

    // Wait for guest (needed for opt-in status) but don't wait for log
    await guestPromise;

    // Generate response using bot menu router
    const responseText = await handleMessage(phoneNumber, messageText);

    // Send the response immediately
    await sendTextMessage({ to: phoneNumber, text: responseText });

    console.log(`Response sent to ${phoneNumber}`);

    // Log outbound message in background (fire and forget)
    Promise.all([inboundLogPromise, logMessage(phoneNumber, 'outbound', responseText)])
      .catch(err => console.error('Logging error:', err));
  } catch (error) {
    console.error(`Error handling message from ${phoneNumber}:`, error);

    // Try to send an error message
    try {
      await sendTextMessage({
        to: phoneNumber,
        text: 'Sorry, something went wrong. Please try again.',
      });
    } catch (sendError) {
      console.error('Failed to send error message:', sendError);
    }
  }
}

export default router;
