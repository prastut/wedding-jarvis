import { getSupabase } from '../db/client';
import type { MessageLog, Guest, MessageStatus } from '../types';

export interface MessageWithGuest extends MessageLog {
  guest: Pick<Guest, 'id' | 'name' | 'user_language' | 'user_side'> | null;
}

export async function logMessage(
  phoneNumber: string,
  direction: 'inbound' | 'outbound',
  messageText: string,
  rawPayload?: Record<string, unknown>,
  wamid?: string
): Promise<MessageLog> {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('message_logs')
    .insert({
      phone_number: phoneNumber,
      direction,
      message_text: messageText,
      raw_payload: rawPayload || null,
      wamid: wamid || null,
      status: 'sent',
    })
    .select()
    .single();

  if (error) {
    console.error('Failed to log message:', error);
    throw new Error(`Failed to log message: ${error.message}`);
  }

  return data;
}

export async function updateMessageStatus(
  wamid: string,
  status: MessageStatus
): Promise<void> {
  const supabase = getSupabase();

  const { error } = await supabase
    .from('message_logs')
    .update({ status })
    .eq('wamid', wamid);

  if (error) {
    console.error('Failed to update message status:', error);
  }
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

  // Fetch messages
  let query = supabase.from('message_logs').select('*', { count: 'exact' });

  if (direction) {
    query = query.eq('direction', direction);
  }

  if (since) {
    query = query.gt('created_at', since);
  }

  const { data: messagesData, error: messagesError, count } = await query
    .order('created_at', { ascending: false })
    .limit(limit);

  if (messagesError) {
    throw new Error(`Failed to fetch recent messages: ${messagesError.message}`);
  }

  const messages = messagesData || [];

  if (messages.length === 0) {
    return { messages: [], total: 0 };
  }

  // Get unique phone numbers and fetch guests
  const phoneNumbers = [...new Set(messages.map((m) => m.phone_number))];

  const { data: guestsData } = await supabase
    .from('guests')
    .select('id, phone_number, name, user_language, user_side')
    .in('phone_number', phoneNumbers);

  // Create a map for quick lookup
  const guestMap = new Map<string, MessageWithGuest['guest']>();
  (guestsData || []).forEach((g) => {
    guestMap.set(g.phone_number, {
      id: g.id,
      name: g.name,
      user_language: g.user_language,
      user_side: g.user_side,
    });
  });

  // Merge messages with guest data
  const messagesWithGuests: MessageWithGuest[] = messages.map((msg) => ({
    id: msg.id,
    phone_number: msg.phone_number,
    direction: msg.direction as 'inbound' | 'outbound',
    message_text: msg.message_text,
    raw_payload: msg.raw_payload,
    wamid: msg.wamid || null,
    status: msg.status || 'sent',
    created_at: msg.created_at,
    guest: guestMap.get(msg.phone_number) || null,
  }));

  return { messages: messagesWithGuests, total: count || 0 };
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
