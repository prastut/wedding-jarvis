import { Router, Request, Response } from 'express';
import { getSupabase } from '../../db/client';
import type { Venue } from '../../types';

const router = Router();

// GET /api/admin/venues - List all venues
router.get('/', async (_req: Request, res: Response) => {
  try {
    const supabase = getSupabase();
    const { data: venues, error } = await supabase
      .from('venues')
      .select('*')
      .order('name', { ascending: true });

    if (error) throw error;

    res.json({ venues: venues || [] });
  } catch (error) {
    console.error('[ADMIN] Venues list error:', error);
    res.status(500).json({ error: 'Failed to fetch venues' });
  }
});

// GET /api/admin/venues/:id - Get single venue
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const supabase = getSupabase();
    const { data: venue, error } = await supabase
      .from('venues')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error || !venue) {
      res.status(404).json({ error: 'Venue not found' });
      return;
    }

    res.json({ venue });
  } catch (error) {
    console.error('[ADMIN] Venue fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch venue' });
  }
});

// POST /api/admin/venues - Create venue
router.post('/', async (req: Request, res: Response) => {
  try {
    const {
      name,
      address,
      address_hi,
      address_pa,
      google_maps_link,
      parking_info,
      parking_info_hi,
      parking_info_pa,
    } = req.body;

    // Validate required fields
    if (!name) {
      res.status(400).json({ error: 'Name is required' });
      return;
    }

    if (!address) {
      res.status(400).json({ error: 'Address is required' });
      return;
    }

    const supabase = getSupabase();
    const { data: venue, error } = await supabase
      .from('venues')
      .insert({
        name,
        address,
        address_hi: address_hi || null,
        address_pa: address_pa || null,
        google_maps_link: google_maps_link || null,
        parking_info: parking_info || null,
        parking_info_hi: parking_info_hi || null,
        parking_info_pa: parking_info_pa || null,
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({ venue });
  } catch (error) {
    console.error('[ADMIN] Venue create error:', error);
    res.status(500).json({ error: 'Failed to create venue' });
  }
});

// PATCH /api/admin/venues/:id - Update venue
router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const supabase = getSupabase();

    // Check venue exists
    const { data: existing } = await supabase
      .from('venues')
      .select('id')
      .eq('id', req.params.id)
      .single();

    if (!existing) {
      res.status(404).json({ error: 'Venue not found' });
      return;
    }

    const {
      name,
      address,
      address_hi,
      address_pa,
      google_maps_link,
      parking_info,
      parking_info_hi,
      parking_info_pa,
    } = req.body;

    const updates: Partial<Venue> = {};
    if (name !== undefined) updates.name = name;
    if (address !== undefined) updates.address = address;
    if (address_hi !== undefined) updates.address_hi = address_hi || null;
    if (address_pa !== undefined) updates.address_pa = address_pa || null;
    if (google_maps_link !== undefined) updates.google_maps_link = google_maps_link || null;
    if (parking_info !== undefined) updates.parking_info = parking_info || null;
    if (parking_info_hi !== undefined) updates.parking_info_hi = parking_info_hi || null;
    if (parking_info_pa !== undefined) updates.parking_info_pa = parking_info_pa || null;

    const { data: venue, error } = await supabase
      .from('venues')
      .update(updates)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;

    res.json({ venue });
  } catch (error) {
    console.error('[ADMIN] Venue update error:', error);
    res.status(500).json({ error: 'Failed to update venue' });
  }
});

// DELETE /api/admin/venues/:id - Delete venue
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const supabase = getSupabase();

    // Check venue exists
    const { data: existing } = await supabase
      .from('venues')
      .select('id')
      .eq('id', req.params.id)
      .single();

    if (!existing) {
      res.status(404).json({ error: 'Venue not found' });
      return;
    }

    // Check if venue is used by any events
    const { count } = await supabase
      .from('events')
      .select('*', { count: 'exact', head: true })
      .eq('venue_id', req.params.id);

    if (count && count > 0) {
      res.status(400).json({
        error: `Cannot delete venue: it is used by ${count} event(s)`,
      });
      return;
    }

    const { error } = await supabase.from('venues').delete().eq('id', req.params.id);

    if (error) throw error;

    res.json({ success: true });
  } catch (error) {
    console.error('[ADMIN] Venue delete error:', error);
    res.status(500).json({ error: 'Failed to delete venue' });
  }
});

export default router;
