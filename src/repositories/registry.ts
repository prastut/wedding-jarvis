import { getSupabase } from '../db/client';
import type { RegistryItem, RegistryClaim, RegistryItemInput, ClaimWithGuest } from '../types';

// ============================================================================
// Registry Items
// ============================================================================

/**
 * Get all registry items (for admin panel)
 */
export async function getAllRegistryItems(): Promise<RegistryItem[]> {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('registry_items')
    .select('*')
    .order('sort_order', { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch registry items: ${error.message}`);
  }

  return data || [];
}

/**
 * Get available registry items (for guest-facing page)
 * Only returns items where is_available = true
 */
export async function getAvailableRegistryItems(): Promise<RegistryItem[]> {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('registry_items')
    .select('*')
    .eq('is_available', true)
    .order('sort_order', { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch available registry items: ${error.message}`);
  }

  return data || [];
}

/**
 * Get a single registry item by ID
 */
export async function getRegistryItemById(id: string): Promise<RegistryItem | null> {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('registry_items')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null; // Not found
    }
    throw new Error(`Failed to fetch registry item: ${error.message}`);
  }

  return data;
}

/**
 * Create a new registry item
 */
export async function createRegistryItem(input: RegistryItemInput): Promise<RegistryItem> {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('registry_items')
    .insert({
      name: input.name,
      name_hi: input.name_hi || null,
      name_pa: input.name_pa || null,
      description: input.description || null,
      description_hi: input.description_hi || null,
      description_pa: input.description_pa || null,
      price: input.price || null,
      show_price: input.show_price ?? true,
      image_url: input.image_url || null,
      external_link: input.external_link || null,
      sort_order: input.sort_order ?? 0,
      is_available: input.is_available ?? true,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create registry item: ${error.message}`);
  }

  return data;
}

/**
 * Update an existing registry item
 */
export async function updateRegistryItem(
  id: string,
  updates: Partial<RegistryItemInput>
): Promise<RegistryItem> {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('registry_items')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update registry item: ${error.message}`);
  }

  return data;
}

/**
 * Delete a registry item
 */
export async function deleteRegistryItem(id: string): Promise<void> {
  const supabase = getSupabase();

  const { error } = await supabase.from('registry_items').delete().eq('id', id);

  if (error) {
    throw new Error(`Failed to delete registry item: ${error.message}`);
  }
}

/**
 * Reorder registry items by updating sort_order for each item
 */
export async function reorderRegistryItems(orderedIds: string[]): Promise<void> {
  const supabase = getSupabase();

  // Update each item's sort_order based on its position in the array
  const updates = orderedIds.map((id, index) =>
    supabase.from('registry_items').update({ sort_order: index }).eq('id', id)
  );

  const results = await Promise.all(updates);

  const failed = results.find((r) => r.error);
  if (failed?.error) {
    throw new Error(`Failed to reorder registry items: ${failed.error.message}`);
  }
}

// ============================================================================
// Registry Claims
// ============================================================================

/**
 * Get all claims for a specific item
 */
export async function getClaimsByItemId(itemId: string): Promise<RegistryClaim[]> {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('registry_claims')
    .select('*')
    .eq('item_id', itemId);

  if (error) {
    throw new Error(`Failed to fetch claims for item: ${error.message}`);
  }

  return data || [];
}

/**
 * Get all claims by a specific guest
 */
export async function getClaimsByGuestId(guestId: string): Promise<RegistryClaim[]> {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('registry_claims')
    .select('*')
    .eq('guest_id', guestId);

  if (error) {
    throw new Error(`Failed to fetch claims for guest: ${error.message}`);
  }

  return data || [];
}

/**
 * Get a specific claim by item and guest
 */
export async function getClaimByItemAndGuest(
  itemId: string,
  guestId: string
): Promise<RegistryClaim | null> {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('registry_claims')
    .select('*')
    .eq('item_id', itemId)
    .eq('guest_id', guestId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null; // Not found
    }
    throw new Error(`Failed to fetch claim: ${error.message}`);
  }

  return data;
}

/**
 * Create a new claim
 */
export async function createClaim(itemId: string, guestId: string): Promise<RegistryClaim> {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('registry_claims')
    .insert({
      item_id: itemId,
      guest_id: guestId,
    })
    .select()
    .single();

  if (error) {
    // Check for unique constraint violation (item already claimed)
    if (error.code === '23505') {
      throw new Error('Item is already claimed');
    }
    throw new Error(`Failed to create claim: ${error.message}`);
  }

  return data;
}

/**
 * Delete a claim by ID
 */
export async function deleteClaim(claimId: string): Promise<void> {
  const supabase = getSupabase();

  const { error } = await supabase.from('registry_claims').delete().eq('id', claimId);

  if (error) {
    throw new Error(`Failed to delete claim: ${error.message}`);
  }
}

/**
 * Delete a claim by item and guest
 */
export async function deleteClaimByItemAndGuest(itemId: string, guestId: string): Promise<void> {
  const supabase = getSupabase();

  const { error } = await supabase
    .from('registry_claims')
    .delete()
    .eq('item_id', itemId)
    .eq('guest_id', guestId);

  if (error) {
    throw new Error(`Failed to delete claim: ${error.message}`);
  }
}

/**
 * Get all claims with guest and item details (for admin panel)
 */
export async function getAllClaimsWithGuests(): Promise<ClaimWithGuest[]> {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('registry_claims')
    .select(
      `
      *,
      guest:guests(id, name, phone_number),
      item:registry_items(id, name)
    `
    )
    .order('claimed_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch claims with guests: ${error.message}`);
  }

  return (data || []) as ClaimWithGuest[];
}

/**
 * Check if an item is claimed
 */
export async function isItemClaimed(itemId: string): Promise<boolean> {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('registry_claims')
    .select('id')
    .eq('item_id', itemId)
    .limit(1);

  if (error) {
    throw new Error(`Failed to check if item is claimed: ${error.message}`);
  }

  return (data?.length || 0) > 0;
}
