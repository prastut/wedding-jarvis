import { Router, Request, Response } from 'express';
import { getSupabase } from '../../db/client';
import type { Event, ContentSide } from '../../types';

const router = Router();

// GET /api/admin/events - List all events
router.get('/', async (_req: Request, res: Response) => {
  try {
    const supabase = getSupabase();
    const { data: events, error } = await supabase
      .from('events')
      .select('*, venues(id, name)')
      .order('sort_order', { ascending: true });

    if (error) throw error;

    res.json({ events: events || [] });
  } catch (error) {
    console.error('[ADMIN] Events list error:', error);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

// GET /api/admin/events/:id - Get single event
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const supabase = getSupabase();
    const { data: event, error } = await supabase
      .from('events')
      .select('*, venues(id, name)')
      .eq('id', req.params.id)
      .single();

    if (error || !event) {
      res.status(404).json({ error: 'Event not found' });
      return;
    }

    res.json({ event });
  } catch (error) {
    console.error('[ADMIN] Event fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch event' });
  }
});

// POST /api/admin/events - Create event
router.post('/', async (req: Request, res: Response) => {
  try {
    const {
      name,
      name_hi,
      name_pa,
      description,
      start_time,
      venue_id,
      dress_code,
      dress_code_hi,
      dress_code_pa,
      side,
      sort_order,
    } = req.body;

    // Validate required fields
    if (!name) {
      res.status(400).json({ error: 'Name is required' });
      return;
    }

    if (!start_time) {
      res.status(400).json({ error: 'Start time is required' });
      return;
    }

    if (!side || !['GROOM', 'BRIDE', 'BOTH'].includes(side)) {
      res.status(400).json({ error: 'Valid side (GROOM, BRIDE, or BOTH) is required' });
      return;
    }

    const supabase = getSupabase();
    const { data: event, error } = await supabase
      .from('events')
      .insert({
        name,
        name_hi: name_hi || null,
        name_pa: name_pa || null,
        description: description || null,
        start_time,
        venue_id: venue_id || null,
        dress_code: dress_code || null,
        dress_code_hi: dress_code_hi || null,
        dress_code_pa: dress_code_pa || null,
        side: side as ContentSide,
        sort_order: sort_order ?? 0,
      })
      .select('*, venues(id, name)')
      .single();

    if (error) throw error;

    res.status(201).json({ event });
  } catch (error) {
    console.error('[ADMIN] Event create error:', error);
    res.status(500).json({ error: 'Failed to create event' });
  }
});

// PATCH /api/admin/events/:id - Update event
router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const supabase = getSupabase();

    // Check event exists
    const { data: existing } = await supabase
      .from('events')
      .select('id')
      .eq('id', req.params.id)
      .single();

    if (!existing) {
      res.status(404).json({ error: 'Event not found' });
      return;
    }

    const {
      name,
      name_hi,
      name_pa,
      description,
      start_time,
      venue_id,
      dress_code,
      dress_code_hi,
      dress_code_pa,
      side,
      sort_order,
    } = req.body;

    // Validate side if provided
    if (side !== undefined && !['GROOM', 'BRIDE', 'BOTH'].includes(side)) {
      res.status(400).json({ error: 'Valid side (GROOM, BRIDE, or BOTH) is required' });
      return;
    }

    const updates: Partial<Event> = {};
    if (name !== undefined) updates.name = name;
    if (name_hi !== undefined) updates.name_hi = name_hi || null;
    if (name_pa !== undefined) updates.name_pa = name_pa || null;
    if (description !== undefined) updates.description = description || null;
    if (start_time !== undefined) updates.start_time = start_time;
    if (venue_id !== undefined) updates.venue_id = venue_id || null;
    if (dress_code !== undefined) updates.dress_code = dress_code || null;
    if (dress_code_hi !== undefined) updates.dress_code_hi = dress_code_hi || null;
    if (dress_code_pa !== undefined) updates.dress_code_pa = dress_code_pa || null;
    if (side !== undefined) updates.side = side as ContentSide;
    if (sort_order !== undefined) updates.sort_order = sort_order;

    const { data: event, error } = await supabase
      .from('events')
      .update(updates)
      .eq('id', req.params.id)
      .select('*, venues(id, name)')
      .single();

    if (error) throw error;

    res.json({ event });
  } catch (error) {
    console.error('[ADMIN] Event update error:', error);
    res.status(500).json({ error: 'Failed to update event' });
  }
});

// DELETE /api/admin/events/:id - Delete event
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const supabase = getSupabase();

    // Check event exists
    const { data: existing } = await supabase
      .from('events')
      .select('id')
      .eq('id', req.params.id)
      .single();

    if (!existing) {
      res.status(404).json({ error: 'Event not found' });
      return;
    }

    const { error } = await supabase.from('events').delete().eq('id', req.params.id);

    if (error) throw error;

    res.json({ success: true });
  } catch (error) {
    console.error('[ADMIN] Event delete error:', error);
    res.status(500).json({ error: 'Failed to delete event' });
  }
});

export default router;
