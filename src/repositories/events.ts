import { getSupabase } from '../db/client';
import type { Event, UserSide } from '../types';

/**
 * Event with joined venue data
 */
export interface EventWithVenue extends Event {
  venues?: {
    name: string;
  };
}

/**
 * Get events filtered by guest's side
 * Returns events for the specified side plus shared events (BOTH)
 * Sorted by sort_order
 *
 * @param side - The guest's side (GROOM or BRIDE), or null for all events
 * @returns Array of events with venue data
 */
export async function getEventsBySide(side: UserSide | null): Promise<EventWithVenue[]> {
  const supabase = getSupabase();

  let query = supabase
    .from('events')
    .select('*, venues(name)')
    .order('sort_order', { ascending: true });

  // Filter by side: show events for guest's side or BOTH
  if (side) {
    query = query.or(`side.eq.${side},side.eq.BOTH`);
  }

  const { data, error } = await query;

  if (error) {
    console.error('[EVENTS] Failed to fetch events:', error);
    throw new Error(`Failed to fetch events: ${error.message}`);
  }

  return (data || []) as EventWithVenue[];
}

/**
 * Get all events (for admin panel)
 */
export async function getAllEvents(): Promise<EventWithVenue[]> {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('events')
    .select('*, venues(name)')
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('[EVENTS] Failed to fetch all events:', error);
    throw new Error(`Failed to fetch events: ${error.message}`);
  }

  return (data || []) as EventWithVenue[];
}
