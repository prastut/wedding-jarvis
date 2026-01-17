import { getSupabase } from '../db/client';
import type { Broadcast } from '../types';
import { v4 as uuidv4 } from 'uuid';

export interface BroadcastsListOptions {
  limit?: number;
  offset?: number;
}

export async function listBroadcasts(
  options: BroadcastsListOptions = {}
): Promise<{ broadcasts: Broadcast[]; total: number }> {
  const supabase = getSupabase();
  const { limit = 20, offset = 0 } = options;

  const { data, error, count } = await supabase
    .from('broadcasts')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    throw new Error(`Failed to fetch broadcasts: ${error.message}`);
  }

  return { broadcasts: data || [], total: count || 0 };
}

export async function getBroadcastById(id: string): Promise<Broadcast | null> {
  const supabase = getSupabase();
  const { data, error } = await supabase.from('broadcasts').select('*').eq('id', id).single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null; // Not found
    }
    throw new Error(`Failed to fetch broadcast: ${error.message}`);
  }

  return data;
}

export async function createBroadcast(
  data: Pick<Broadcast, 'topic' | 'message' | 'template_name'>
): Promise<Broadcast> {
  const supabase = getSupabase();
  const idempotencyKey = uuidv4();

  const { data: broadcast, error } = await supabase
    .from('broadcasts')
    .insert({
      topic: data.topic,
      message: data.message,
      template_name: data.template_name || null,
      status: 'draft',
      idempotency_key: idempotencyKey,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create broadcast: ${error.message}`);
  }

  return broadcast;
}

export async function updateBroadcast(
  id: string,
  updates: Partial<Pick<Broadcast, 'topic' | 'message' | 'template_name'>>
): Promise<Broadcast> {
  const supabase = getSupabase();

  const { data: broadcast, error } = await supabase
    .from('broadcasts')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update broadcast: ${error.message}`);
  }

  return broadcast;
}

export async function deleteBroadcast(id: string): Promise<void> {
  const supabase = getSupabase();

  const { error } = await supabase.from('broadcasts').delete().eq('id', id);

  if (error) {
    throw new Error(`Failed to delete broadcast: ${error.message}`);
  }
}

export async function updateBroadcastStatus(
  id: string,
  status: Broadcast['status'],
  counts?: { sent_count?: number; failed_count?: number }
): Promise<void> {
  const supabase = getSupabase();

  const updates: Partial<Broadcast> = { status };
  if (counts?.sent_count !== undefined) updates.sent_count = counts.sent_count;
  if (counts?.failed_count !== undefined) updates.failed_count = counts.failed_count;

  const { error } = await supabase.from('broadcasts').update(updates).eq('id', id);

  if (error) {
    throw new Error(`Failed to update broadcast status: ${error.message}`);
  }
}
