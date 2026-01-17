import { getSupabase } from '../db/client';
import type { MessageLog, Guest } from '../types';

export interface MessageWithGuest extends MessageLog {
  guest: Pick<Guest, 'id' | 'name' | 'user_language' | 'user_side'> | null;
}

export async function logMessage(
  phoneNumber: string,
  direction: 'inbound' | 'outbound',
  messageText: string,
  rawPayload?: Record<string, unknown>
): Promise<MessageLog> {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('message_logs')
    .insert({
      phone_number: phoneNumber,
      direction,
      message_text: messageText,
      raw_payload: rawPayload || null,
    })
    .select()
    .single();

  if (error) {
    console.error('Failed to log message:', error);
    throw new Error(`Failed to log message: ${error.message}`);
  }

  return data;
}

export async function getMessageLogs(
  options: {
    phoneNumber?: string;
    limit?: number;
    offset?: number;
  } = {}
): Promise<{ logs: MessageLog[]; total: number }> {
  const supabase = getSupabase();
  const { phoneNumber, limit = 100, offset = 0 } = options;

  let query = supabase.from('message_logs').select('*', { count: 'exact' });

  if (phoneNumber) {
    query = query.eq('phone_number', phoneNumber);
  }

  const { data, error, count } = await query
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    throw new Error(`Failed to fetch message logs: ${error.message}`);
  }

  return { logs: data || [], total: count || 0 };
}

export async function getRecentMessages(options: {
  direction?: 'inbound' | 'outbound';
  since?: string;
  limit?: number;
} = {}): Promise<{ messages: MessageWithGuest[]; total: number }> {
  const supabase = getSupabase();
  const { direction, since, limit = 50 } = options;

  let query = supabase
    .from('message_logs')
    .select('*, guests!message_logs_phone_number_fkey(id, name, user_language, user_side)', {
      count: 'exact',
    });

  if (direction) {
    query = query.eq('direction', direction);
  }

  if (since) {
    query = query.gt('created_at', since);
  }

  const { data, error, count } = await query
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    // Fallback if FK relationship doesn't exist - query without join
    if (error.message.includes('relationship')) {
      const fallbackQuery = supabase
        .from('message_logs')
        .select('*', { count: 'exact' });

      if (direction) {
        fallbackQuery.eq('direction', direction);
      }
      if (since) {
        fallbackQuery.gt('created_at', since);
      }

      const fallbackResult = await fallbackQuery
        .order('created_at', { ascending: false })
        .limit(limit);

      if (fallbackResult.error) {
        throw new Error(`Failed to fetch recent messages: ${fallbackResult.error.message}`);
      }

      const messagesWithNull = (fallbackResult.data || []).map((msg) => ({
        ...msg,
        guest: null,
      }));

      return { messages: messagesWithNull, total: fallbackResult.count || 0 };
    }
    throw new Error(`Failed to fetch recent messages: ${error.message}`);
  }

  const messages = (data || []).map((row) => ({
    id: row.id,
    phone_number: row.phone_number,
    direction: row.direction as 'inbound' | 'outbound',
    message_text: row.message_text,
    raw_payload: row.raw_payload,
    created_at: row.created_at,
    guest: row.guests as MessageWithGuest['guest'],
  }));

  return { messages, total: count || 0 };
}

export async function getChatHistory(
  phoneNumber: string,
  options: { limit?: number; offset?: number } = {}
): Promise<{ messages: MessageLog[]; total: number }> {
  const supabase = getSupabase();
  const { limit = 100, offset = 0 } = options;

  const { data, error, count } = await supabase
    .from('message_logs')
    .select('*', { count: 'exact' })
    .eq('phone_number', phoneNumber)
    .order('created_at', { ascending: true })
    .range(offset, offset + limit - 1);

  if (error) {
    throw new Error(`Failed to fetch chat history: ${error.message}`);
  }

  return { messages: data || [], total: count || 0 };
}
