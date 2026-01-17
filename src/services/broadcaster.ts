import { config } from '../config';
import { getSupabase } from '../db/client';
import { sendTextMessage } from './whatsappClient';
import { getOptedInGuests } from '../repositories/guests';
import { logMessage } from '../repositories/messageLogs';
import type { Broadcast, UserLanguage } from '../types';

interface BroadcastResult {
  total: number;
  sent: number;
  failed: number;
  errors: Array<{ phone: string; error: string }>;
}

export interface BroadcastProgress {
  type: 'start' | 'progress' | 'complete' | 'error';
  total?: number;
  current?: number;
  sent?: number;
  failed?: number;
  guest?: { name: string; phone: string };
  status?: 'sent' | 'failed';
  error?: string;
}

export type ProgressCallback = (progress: BroadcastProgress) => void;

export interface SendBroadcastOptions {
  includePhones?: string[];
  excludePhones?: string[];
  onProgress?: ProgressCallback;
}

/**
 * Get the message text for a guest based on their language preference.
 * Falls back to English if the guest's language is not set or the translation is missing.
 */
function getMessageForLanguage(
  broadcast: Broadcast,
  language: UserLanguage | null
): string {
  switch (language) {
    case 'HI':
      return broadcast.message_hi || broadcast.message;
    case 'PA':
      return broadcast.message_pa || broadcast.message;
    case 'EN':
    default:
      return broadcast.message;
  }
}

export async function sendBroadcast(
  broadcastId: string,
  options: SendBroadcastOptions = {}
): Promise<BroadcastResult> {
  const { includePhones, excludePhones, onProgress } = options;
  const supabase = getSupabase();

  // Get the broadcast
  const { data: broadcast, error: fetchError } = await supabase
    .from('broadcasts')
    .select('*')
    .eq('id', broadcastId)
    .single();

  if (fetchError || !broadcast) {
    throw new Error(`Broadcast not found: ${broadcastId}`);
  }

  // Update status to sending
  await supabase.from('broadcasts').update({ status: 'sending' }).eq('id', broadcastId);

  // Get all opted-in guests
  let guests = await getOptedInGuests();

  // Filter guests based on include/exclude lists
  if (includePhones && includePhones.length > 0) {
    guests = guests.filter((g) => includePhones.includes(g.phone_number));
  }
  if (excludePhones && excludePhones.length > 0) {
    guests = guests.filter((g) => !excludePhones.includes(g.phone_number));
  }

  const result: BroadcastResult = {
    total: guests.length,
    sent: 0,
    failed: 0,
    errors: [],
  };

  // Notify start
  onProgress?.({ type: 'start', total: guests.length });

  // Send to each guest with rate limiting
  for (let i = 0; i < guests.length; i++) {
    const guest = guests[i];
    try {
      // Get the message in the guest's preferred language
      const messageText = getMessageForLanguage(
        broadcast as Broadcast,
        guest.user_language as UserLanguage | null
      );

      await sendTextMessage({
        to: guest.phone_number,
        text: messageText,
      });

      // Log the outbound message
      await logMessage(guest.phone_number, 'outbound', messageText);

      // Log success in send_logs
      await supabase.from('send_logs').insert({
        broadcast_id: broadcastId,
        guest_id: guest.id,
        status: 'sent',
      });

      result.sent++;

      // Notify progress
      onProgress?.({
        type: 'progress',
        current: i + 1,
        total: guests.length,
        sent: result.sent,
        failed: result.failed,
        guest: { name: guest.name || 'Unknown', phone: guest.phone_number },
        status: 'sent',
      });

      // Rate limiting delay
      if (config.broadcast.delayMs > 0) {
        await delay(config.broadcast.delayMs);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      // Log failure in send_logs
      await supabase.from('send_logs').insert({
        broadcast_id: broadcastId,
        guest_id: guest.id,
        status: 'failed',
        error_code: errorMessage.substring(0, 50),
      });

      result.failed++;
      result.errors.push({ phone: guest.phone_number, error: errorMessage });

      // Notify progress with failure
      onProgress?.({
        type: 'progress',
        current: i + 1,
        total: guests.length,
        sent: result.sent,
        failed: result.failed,
        guest: { name: guest.name || 'Unknown', phone: guest.phone_number },
        status: 'failed',
        error: errorMessage,
      });

      console.error(`Failed to send to ${guest.phone_number}:`, errorMessage);
    }
  }

  // Update broadcast status and counts
  const finalStatus = result.failed === result.total ? 'failed' : 'completed';
  await supabase
    .from('broadcasts')
    .update({
      status: finalStatus,
      sent_count: result.sent,
      failed_count: result.failed,
    })
    .eq('id', broadcastId);

  // Notify completion
  onProgress?.({
    type: 'complete',
    total: result.total,
    sent: result.sent,
    failed: result.failed,
  });

  return result;
}

export async function sendTestBroadcast(message: string): Promise<BroadcastResult> {
  const guests = await getOptedInGuests();

  const result: BroadcastResult = {
    total: guests.length,
    sent: 0,
    failed: 0,
    errors: [],
  };

  console.log(`Sending test broadcast to ${guests.length} opted-in guests`);

  for (const guest of guests) {
    try {
      await sendTextMessage({
        to: guest.phone_number,
        text: message,
      });

      await logMessage(guest.phone_number, 'outbound', message);

      result.sent++;
      console.log(`Sent to ${guest.phone_number}`);

      if (config.broadcast.delayMs > 0) {
        await delay(config.broadcast.delayMs);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      result.failed++;
      result.errors.push({ phone: guest.phone_number, error: errorMessage });
      console.error(`Failed to send to ${guest.phone_number}:`, errorMessage);
    }
  }

  return result;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
