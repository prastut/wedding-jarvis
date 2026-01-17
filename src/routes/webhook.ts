import { Router, Request, Response } from 'express';
import { config } from '../config';
import { sendTextMessage } from '../services/whatsappClient';
import { handleMessage } from '../services/botRouter';
import { findOrCreateGuest } from '../repositories/guests';
import { logMessage, updateMessageStatus } from '../repositories/messageLogs';
import type { MessageStatus } from '../types';
import { verifyWebhookSignature } from '../middleware/webhookVerify';
import { INTERACTIVE_PREFIXES } from '../constants/buttonIds';
import type { WhatsAppInboundMessage } from '../types';

const router = Router();

// GET /webhook - Verification challenge from Meta
router.get('/', (req: Request, res: Response) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  console.log('Webhook verification request:', {
    mode,
    token,
    challenge: challenge?.toString().substring(0, 20),
  });

  if (mode === 'subscribe' && token === config.whatsapp.verifyToken) {
    console.log('Webhook verified successfully');
    res.status(200).send(challenge);
  } else {
    console.log('Webhook verification failed');
    res.sendStatus(403);
  }
});

// POST /webhook - Receive inbound messages
router.post('/', verifyWebhookSignature, async (req: Request, res: Response) => {
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
          // Update message status in database
          if (['sent', 'delivered', 'read', 'failed'].includes(status.status)) {
            updateMessageStatus(status.id, status.status as MessageStatus).catch((err) =>
              console.error('Failed to update message status:', err)
            );
          }
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
          } else if (message.type === 'interactive' && message.interactive) {
            // Handle button and list replies
            const interactive = message.interactive;

            if (interactive.button_reply) {
              console.log(
                `[INTERACTIVE] Button reply from ${message.from}: id="${interactive.button_reply.id}" title="${interactive.button_reply.title}"`
              );
              await handleInboundMessage(
                message.from,
                `${INTERACTIVE_PREFIXES.BUTTON}${interactive.button_reply.id}`,
                contact?.profile?.name,
                body
              );
            } else if (interactive.list_reply) {
              console.log(
                `[INTERACTIVE] List reply from ${message.from}: id="${interactive.list_reply.id}" title="${interactive.list_reply.title}"`
              );
              await handleInboundMessage(
                message.from,
                `${INTERACTIVE_PREFIXES.LIST}${interactive.list_reply.id}`,
                contact?.profile?.name,
                body
              );
            }
          } else {
            console.log(`Received non-text message type: ${message.type}`);
            // Respond with menu for unsupported message types
            await handleInboundMessage(message.from, 'MENU', contact?.profile?.name, body);
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
    const inboundLogPromise = logMessage(
      phoneNumber,
      'inbound',
      messageText,
      rawPayload as unknown as Record<string, unknown>
    );

    // Wait for guest (needed for bot routing based on guest state)
    const guest = await guestPromise;

    // Generate response using bot menu router
    const responseText = await handleMessage(guest, messageText);

    // If responseText is null, an interactive message was already sent
    if (responseText !== null) {
      // Send the response immediately and capture the message ID
      const sendResponse = await sendTextMessage({ to: phoneNumber, text: responseText });
      const wamid = sendResponse.messages?.[0]?.id;
      console.log(`Response sent to ${phoneNumber} (wamid: ${wamid})`);

      // Log outbound message in background (fire and forget)
      Promise.all([
        inboundLogPromise,
        logMessage(phoneNumber, 'outbound', responseText, undefined, wamid),
      ]).catch((err) => console.error('Logging error:', err));
    } else {
      console.log(`Interactive message sent to ${phoneNumber} (no text response needed)`);
      // Still wait for inbound log
      inboundLogPromise.catch((err) => console.error('Logging error:', err));
    }
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
