import { getSupabase } from '../db/client';
import type { Guest, UserLanguage, UserSide } from '../types';

export async function findGuestByPhone(phoneNumber: string): Promise<Guest | null> {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('guests')
    .select('*')
    .eq('phone_number', phoneNumber)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw new Error(`Failed to find guest: ${error.message}`);
  }

  return data || null;
}

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

export interface GuestFilters {
  limit?: number;
  offset?: number;
  search?: string;
  optedIn?: boolean;
  language?: UserLanguage | 'not_set';
  side?: UserSide | 'not_set';
  rsvpStatus?: 'YES' | 'NO' | 'pending';
}

export async function getAllGuests(
  options: GuestFilters = {}
): Promise<{ guests: Guest[]; total: number }> {
  const supabase = getSupabase();
  const { limit = 50, offset = 0, search, optedIn, language, side, rsvpStatus } = options;

  let query = supabase.from('guests').select('*', { count: 'exact' });

  if (search) {
    query = query.or(`phone_number.ilike.%${search}%,name.ilike.%${search}%`);
  }

  if (optedIn !== undefined) {
    query = query.eq('opted_in', optedIn);
  }

  // Language filter
  if (language === 'not_set') {
    query = query.is('user_language', null);
  } else if (language) {
    query = query.eq('user_language', language);
  }

  // Side filter
  if (side === 'not_set') {
    query = query.is('user_side', null);
  } else if (side) {
    query = query.eq('user_side', side);
  }

  // RSVP status filter
  if (rsvpStatus === 'pending') {
    query = query.is('rsvp_status', null);
  } else if (rsvpStatus) {
    query = query.eq('rsvp_status', rsvpStatus);
  }

  const { data, error, count } = await query
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    throw new Error(`Failed to fetch guests: ${error.message}`);
  }

  return { guests: data || [], total: count || 0 };
}

/**
 * Update guest's language preference
 */
export async function updateGuestLanguage(guestId: string, language: UserLanguage): Promise<Guest> {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('guests')
    .update({ user_language: language })
    .eq('id', guestId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update guest language: ${error.message}`);
  }

  return data;
}

/**
 * Update guest's side preference
 */
export async function updateGuestSide(guestId: string, side: UserSide): Promise<Guest> {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('guests')
    .update({ user_side: side })
    .eq('id', guestId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update guest side: ${error.message}`);
  }

  return data;
}

/**
 * Update guest's opt-in status
 */
export async function updateGuestOptIn(phoneNumber: string, optedIn: boolean): Promise<void> {
  const supabase = getSupabase();

  const { error } = await supabase
    .from('guests')
    .update({ opted_in: optedIn })
    .eq('phone_number', phoneNumber);

  if (error) {
    throw new Error(`Failed to update guest opt-in: ${error.message}`);
  }
}

/**
 * Reset guest's language and side preferences while preserving RSVP data.
 * Used when guest wants to change their language or side selection.
 */
export async function resetGuestPreferences(guestId: string): Promise<Guest> {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('guests')
    .update({
      user_language: null,
      user_side: null,
    })
    .eq('id', guestId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to reset guest preferences: ${error.message}`);
  }

  return data;
}

/**
 * Update guest's RSVP status to 'YES' with guest count
 */
export async function updateGuestRsvpYes(guestId: string, guestCount: number): Promise<Guest> {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('guests')
    .update({
      rsvp_status: 'YES',
      rsvp_guest_count: guestCount,
    })
    .eq('id', guestId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update guest RSVP: ${error.message}`);
  }

  return data;
}

/**
 * Update guest's RSVP status to 'NO'
 */
export async function updateGuestRsvpNo(guestId: string): Promise<Guest> {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('guests')
    .update({
      rsvp_status: 'NO',
      rsvp_guest_count: null,
    })
    .eq('id', guestId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update guest RSVP: ${error.message}`);
  }

  return data;
}
