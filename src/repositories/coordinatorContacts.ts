import { getSupabase } from '../db/client';
import type { CoordinatorContact, UserSide } from '../types';

/**
 * Get coordinator contacts filtered by guest's side
 * Returns contacts for the specified side plus shared contacts (BOTH)
 * Sorted by is_primary DESC (primary contacts first), then by name
 *
 * @param side - The guest's side (GROOM or BRIDE), or null for all contacts
 * @returns Array of coordinator contacts
 */
export async function getContactsBySide(side: UserSide | null): Promise<CoordinatorContact[]> {
  const supabase = getSupabase();

  let query = supabase
    .from('coordinator_contacts')
    .select('*')
    .order('is_primary', { ascending: false })
    .order('name', { ascending: true });

  // Filter by side: show contacts for guest's side or BOTH
  if (side) {
    query = query.or(`side.eq.${side},side.eq.BOTH`);
  }

  const { data, error } = await query;

  if (error) {
    console.error('[CONTACTS] Failed to fetch contacts:', error);
    throw new Error(`Failed to fetch contacts: ${error.message}`);
  }

  return (data || []) as CoordinatorContact[];
}

/**
 * Get all coordinator contacts (for admin panel)
 */
export async function getAllContacts(): Promise<CoordinatorContact[]> {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('coordinator_contacts')
    .select('*')
    .order('is_primary', { ascending: false })
    .order('name', { ascending: true });

  if (error) {
    console.error('[CONTACTS] Failed to fetch all contacts:', error);
    throw new Error(`Failed to fetch contacts: ${error.message}`);
  }

  return (data || []) as CoordinatorContact[];
}
