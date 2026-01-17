import { getSupabase } from '../db/client';
import type { MessageLog } from '../types';

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
