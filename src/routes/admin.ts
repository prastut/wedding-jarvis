import { Router, Request, Response } from 'express';
import { getSupabase } from '../db/client';
import { requireAuth } from '../middleware/auth';
import { getAllGuests } from '../repositories/guests';
import type { Broadcast } from '../types';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// All admin routes require authentication
router.use(requireAuth);

// GET /api/admin/stats - Dashboard statistics
router.get('/stats', async (_req: Request, res: Response) => {
  try {
    const supabase = getSupabase();

    // Get guest counts
    const { count: totalGuests } = await supabase
      .from('guests')
      .select('*', { count: 'exact', head: true });

    const { count: optedInGuests } = await supabase
      .from('guests')
      .select('*', { count: 'exact', head: true })
      .eq('opted_in', true);

    // Get message counts
    const { count: totalMessages } = await supabase
      .from('message_logs')
      .select('*', { count: 'exact', head: true });

    const { count: inboundMessages } = await supabase
      .from('message_logs')
      .select('*', { count: 'exact', head: true })
      .eq('direction', 'inbound');

    // Get last activity
    const { data: lastMessage } = await supabase
      .from('message_logs')
      .select('created_at')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    // Get broadcast counts
    const { count: totalBroadcasts } = await supabase
      .from('broadcasts')
      .select('*', { count: 'exact', head: true });

    const { count: completedBroadcasts } = await supabase
      .from('broadcasts')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'completed');

    res.json({
      guests: {
        total: totalGuests || 0,
        optedIn: optedInGuests || 0,
        optedOut: (totalGuests || 0) - (optedInGuests || 0),
      },
      messages: {
        total: totalMessages || 0,
        inbound: inboundMessages || 0,
        outbound: (totalMessages || 0) - (inboundMessages || 0),
      },
      broadcasts: {
        total: totalBroadcasts || 0,
        completed: completedBroadcasts || 0,
      },
      lastActivity: lastMessage?.created_at || null,
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// GET /api/admin/guests - List guests with pagination and filters
router.get('/guests', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const search = req.query.search as string | undefined;
    const optedIn = req.query.opted_in === 'true' ? true :
                    req.query.opted_in === 'false' ? false : undefined;

    const offset = (page - 1) * limit;

    const { guests, total } = await getAllGuests({
      limit,
      offset,
      search,
      optedIn,
    });

    res.json({
      guests,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Guest list error:', error);
    res.status(500).json({ error: 'Failed to fetch guests' });
  }
});

// GET /api/admin/guests/export - Export guests as CSV
router.get('/guests/export', async (req: Request, res: Response) => {
  try {
    const optedIn = req.query.opted_in === 'true' ? true :
                    req.query.opted_in === 'false' ? false : undefined;

    const { guests } = await getAllGuests({ limit: 10000, optedIn });

    // Build CSV
    const headers = ['phone_number', 'name', 'opted_in', 'first_seen_at', 'last_inbound_at'];
    const rows = guests.map(g => [
      g.phone_number,
      g.name || '',
      g.opted_in ? 'Yes' : 'No',
      g.first_seen_at,
      g.last_inbound_at || '',
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="guests.csv"');
    res.send(csv);
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ error: 'Failed to export guests' });
  }
});

// GET /api/admin/broadcasts - List broadcasts
router.get('/broadcasts', async (req: Request, res: Response) => {
  try {
    const supabase = getSupabase();
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;

    const { data: broadcasts, error, count } = await supabase
      .from('broadcasts')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    res.json({
      broadcasts,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    console.error('Broadcasts list error:', error);
    res.status(500).json({ error: 'Failed to fetch broadcasts' });
  }
});

// GET /api/admin/broadcasts/:id - Get single broadcast
router.get('/broadcasts/:id', async (req: Request, res: Response) => {
  try {
    const supabase = getSupabase();
    const { data: broadcast, error } = await supabase
      .from('broadcasts')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error || !broadcast) {
      res.status(404).json({ error: 'Broadcast not found' });
      return;
    }

    res.json({ broadcast });
  } catch (error) {
    console.error('Broadcast fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch broadcast' });
  }
});

// POST /api/admin/broadcasts - Create broadcast
router.post('/broadcasts', async (req: Request, res: Response) => {
  try {
    const { topic, message, template_name } = req.body;

    if (!topic || !message) {
      res.status(400).json({ error: 'Topic and message are required' });
      return;
    }

    const supabase = getSupabase();
    const idempotencyKey = uuidv4();

    const { data: broadcast, error } = await supabase
      .from('broadcasts')
      .insert({
        topic,
        message,
        template_name: template_name || null,
        status: 'draft',
        idempotency_key: idempotencyKey,
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({ broadcast });
  } catch (error) {
    console.error('Broadcast create error:', error);
    res.status(500).json({ error: 'Failed to create broadcast' });
  }
});

// PATCH /api/admin/broadcasts/:id - Update broadcast
router.patch('/broadcasts/:id', async (req: Request, res: Response) => {
  try {
    const supabase = getSupabase();
    const { topic, message, template_name } = req.body;

    // Check broadcast exists and is in draft status
    const { data: existing } = await supabase
      .from('broadcasts')
      .select('status')
      .eq('id', req.params.id)
      .single();

    if (!existing) {
      res.status(404).json({ error: 'Broadcast not found' });
      return;
    }

    if (existing.status !== 'draft') {
      res.status(400).json({ error: 'Can only edit draft broadcasts' });
      return;
    }

    const updates: Partial<Broadcast> = {};
    if (topic !== undefined) updates.topic = topic;
    if (message !== undefined) updates.message = message;
    if (template_name !== undefined) updates.template_name = template_name;

    const { data: broadcast, error } = await supabase
      .from('broadcasts')
      .update(updates)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;

    res.json({ broadcast });
  } catch (error) {
    console.error('Broadcast update error:', error);
    res.status(500).json({ error: 'Failed to update broadcast' });
  }
});

// DELETE /api/admin/broadcasts/:id - Delete broadcast
router.delete('/broadcasts/:id', async (req: Request, res: Response) => {
  try {
    const supabase = getSupabase();

    // Check broadcast exists and is in draft status
    const { data: existing } = await supabase
      .from('broadcasts')
      .select('status')
      .eq('id', req.params.id)
      .single();

    if (!existing) {
      res.status(404).json({ error: 'Broadcast not found' });
      return;
    }

    if (existing.status !== 'draft') {
      res.status(400).json({ error: 'Can only delete draft broadcasts' });
      return;
    }

    const { error } = await supabase
      .from('broadcasts')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;

    res.json({ success: true });
  } catch (error) {
    console.error('Broadcast delete error:', error);
    res.status(500).json({ error: 'Failed to delete broadcast' });
  }
});

// POST /api/admin/broadcasts/:id/send - Execute broadcast
router.post('/broadcasts/:id/send', async (req: Request, res: Response) => {
  try {
    const supabase = getSupabase();

    // Check broadcast exists and is in draft/pending status
    const { data: broadcast } = await supabase
      .from('broadcasts')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (!broadcast) {
      res.status(404).json({ error: 'Broadcast not found' });
      return;
    }

    if (broadcast.status !== 'draft' && broadcast.status !== 'pending') {
      res.status(400).json({ error: `Cannot send broadcast with status: ${broadcast.status}` });
      return;
    }

    // Import sendBroadcast dynamically to avoid circular deps
    const { sendBroadcast } = await import('../services/broadcast/broadcaster');

    // Update status to pending before starting
    await supabase
      .from('broadcasts')
      .update({ status: 'pending' })
      .eq('id', req.params.id);

    // Send broadcast (this will update status to sending/completed/failed)
    const result = await sendBroadcast(req.params.id);

    res.json({
      success: true,
      result,
    });
  } catch (error) {
    console.error('Broadcast send error:', error);
    res.status(500).json({ error: 'Failed to send broadcast' });
  }
});

export default router;
