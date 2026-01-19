import { Router, Request, Response } from 'express';
import { getSupabase } from '../../db/client';
import type { Broadcast } from '../../types';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// GET /api/admin/broadcasts - List broadcasts
router.get('/', async (req: Request, res: Response) => {
  try {
    const supabase = getSupabase();
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;

    const {
      data: broadcasts,
      error,
      count,
    } = await supabase
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
router.get('/:id', async (req: Request, res: Response) => {
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
router.post('/', async (req: Request, res: Response) => {
  try {
    const { message, message_hi, message_pa, template_name } = req.body;

    if (!message) {
      res.status(400).json({ error: 'Message is required' });
      return;
    }

    const supabase = getSupabase();
    const idempotencyKey = uuidv4();

    // Auto-generate topic from message (first 50 chars)
    const topic = message.slice(0, 50) + (message.length > 50 ? '…' : '');

    const { data: broadcast, error } = await supabase
      .from('broadcasts')
      .insert({
        topic,
        message,
        message_hi: message_hi || null,
        message_pa: message_pa || null,
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
router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const supabase = getSupabase();
    const { message, message_hi, message_pa, template_name } = req.body;

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
    if (message !== undefined) {
      updates.message = message;
      // Auto-generate topic from message
      updates.topic = message.slice(0, 50) + (message.length > 50 ? '…' : '');
    }
    if (message_hi !== undefined) updates.message_hi = message_hi || null;
    if (message_pa !== undefined) updates.message_pa = message_pa || null;
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
router.delete('/:id', async (req: Request, res: Response) => {
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

    const { error } = await supabase.from('broadcasts').delete().eq('id', req.params.id);

    if (error) throw error;

    res.json({ success: true });
  } catch (error) {
    console.error('Broadcast delete error:', error);
    res.status(500).json({ error: 'Failed to delete broadcast' });
  }
});

// POST /api/admin/broadcasts/:id/send - Execute broadcast (legacy, returns JSON)
router.post('/:id/send', async (req: Request, res: Response) => {
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
    const { sendBroadcast } = await import('../../services/broadcaster');

    // Update status to pending before starting
    await supabase.from('broadcasts').update({ status: 'pending' }).eq('id', req.params.id);

    // Get include/exclude from request body
    const { includePhones, excludePhones } = req.body || {};

    // Send broadcast (this will update status to sending/completed/failed)
    const result = await sendBroadcast(req.params.id, { includePhones, excludePhones });

    res.json({
      success: true,
      result,
    });
  } catch (error) {
    console.error('Broadcast send error:', error);
    res.status(500).json({ error: 'Failed to send broadcast' });
  }
});

// POST /api/admin/broadcasts/:id/send-stream - Execute broadcast with streaming progress
router.post('/:id/send-stream', async (req: Request, res: Response) => {
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

    // Parse include/exclude from body
    const { includePhones, excludePhones } = req.body || {};

    // Set up streaming headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    // Import sendBroadcast dynamically
    const { sendBroadcast } = await import('../../services/broadcaster');

    // Update status to pending before starting
    await supabase.from('broadcasts').update({ status: 'pending' }).eq('id', req.params.id);

    // Send broadcast with progress callback
    await sendBroadcast(req.params.id, {
      includePhones,
      excludePhones,
      onProgress: (progress) => {
        res.write(`data: ${JSON.stringify(progress)}\n\n`);
      },
    });

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error) {
    console.error('Broadcast send-stream error:', error);
    res.write(`data: ${JSON.stringify({ type: 'error', error: 'Failed to send broadcast' })}\n\n`);
    res.end();
  }
});

export default router;
