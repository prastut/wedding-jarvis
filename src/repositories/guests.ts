import { getSupabase } from '../db/client';
import type { Guest } from '../types';

export async function findOrCreateGuest(phoneNumber: string, name?: string): Promise<Guest> {
  const supabase = getSupabase();

  // Try to find existing guest
  const { data: existing } = await supabase
    .from('guests')
    .select('*')
    .eq('phone_number', phoneNumber)
    .single();

  if (existing) {
    // Update last_inbound_at
    const { data: updated } = await supabase
      .from('guests')
      .update({
        last_inbound_at: new Date().toISOString(),
        ...(name && !existing.name ? { name } : {}),
      })
      .eq('id', existing.id)
      .select()
      .single();

    return updated || existing;
  }

  // Create new guest
  const { data: newGuest, error } = await supabase
    .from('guests')
    .insert({
      phone_number: phoneNumber,
      name: name || null,
      opted_in: true,
      first_seen_at: new Date().toISOString(),
      last_inbound_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create guest: ${error.message}`);
  }

  return newGuest;
}

export async function getOptedInGuests(): Promise<Guest[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('guests')
    .select('*')
    .eq('opted_in', true)
    .order('created_at', { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch guests: ${error.message}`);
  }

  return data || [];
}

export async function getAllGuests(
  options: {
    limit?: number;
    offset?: number;
    search?: string;
    optedIn?: boolean;
  } = {}
): Promise<{ guests: Guest[]; total: number }> {
  const supabase = getSupabase();
  const { limit = 50, offset = 0, search, optedIn } = options;

  let query = supabase.from('guests').select('*', { count: 'exact' });

  if (search) {
    query = query.or(`phone_number.ilike.%${search}%,name.ilike.%${search}%`);
  }

  if (optedIn !== undefined) {
    query = query.eq('opted_in', optedIn);
  }

  const { data, error, count } = await query
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    throw new Error(`Failed to fetch guests: ${error.message}`);
  }

  return { guests: data || [], total: count || 0 };
}
