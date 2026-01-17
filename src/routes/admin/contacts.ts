import { Router, Request, Response } from 'express';
import { getSupabase } from '../../db/client';
import type { CoordinatorContact, ContentSide } from '../../types';

const router = Router();

// GET /api/admin/contacts - List all contacts
router.get('/', async (_req: Request, res: Response) => {
  try {
    const supabase = getSupabase();
    const { data: contacts, error } = await supabase
      .from('coordinator_contacts')
      .select('*')
      .order('is_primary', { ascending: false })
      .order('name', { ascending: true });

    if (error) throw error;

    res.json({ contacts: contacts || [] });
  } catch (error) {
    console.error('[ADMIN] Contacts list error:', error);
    res.status(500).json({ error: 'Failed to fetch contacts' });
  }
});

// GET /api/admin/contacts/:id - Get single contact
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const supabase = getSupabase();
    const { data: contact, error } = await supabase
      .from('coordinator_contacts')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error || !contact) {
      res.status(404).json({ error: 'Contact not found' });
      return;
    }

    res.json({ contact });
  } catch (error) {
    console.error('[ADMIN] Contact fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch contact' });
  }
});

// POST /api/admin/contacts - Create contact
router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, phone_number, role, side, is_primary } = req.body;

    // Validate required fields
    if (!name) {
      res.status(400).json({ error: 'Name is required' });
      return;
    }

    if (!phone_number) {
      res.status(400).json({ error: 'Phone number is required' });
      return;
    }

    if (!side || !['GROOM', 'BRIDE', 'BOTH'].includes(side)) {
      res.status(400).json({ error: 'Valid side (GROOM, BRIDE, or BOTH) is required' });
      return;
    }

    const supabase = getSupabase();
    const { data: contact, error } = await supabase
      .from('coordinator_contacts')
      .insert({
        name,
        phone_number,
        role: role || null,
        side: side as ContentSide,
        is_primary: is_primary ?? false,
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({ contact });
  } catch (error) {
    console.error('[ADMIN] Contact create error:', error);
    res.status(500).json({ error: 'Failed to create contact' });
  }
});

// PATCH /api/admin/contacts/:id - Update contact
router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const supabase = getSupabase();

    // Check contact exists
    const { data: existing } = await supabase
      .from('coordinator_contacts')
      .select('id')
      .eq('id', req.params.id)
      .single();

    if (!existing) {
      res.status(404).json({ error: 'Contact not found' });
      return;
    }

    const { name, phone_number, role, side, is_primary } = req.body;

    // Validate side if provided
    if (side !== undefined && !['GROOM', 'BRIDE', 'BOTH'].includes(side)) {
      res.status(400).json({ error: 'Valid side (GROOM, BRIDE, or BOTH) is required' });
      return;
    }

    const updates: Partial<CoordinatorContact> = {};
    if (name !== undefined) updates.name = name;
    if (phone_number !== undefined) updates.phone_number = phone_number;
    if (role !== undefined) updates.role = role || null;
    if (side !== undefined) updates.side = side as ContentSide;
    if (is_primary !== undefined) updates.is_primary = is_primary;

    const { data: contact, error } = await supabase
      .from('coordinator_contacts')
      .update(updates)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;

    res.json({ contact });
  } catch (error) {
    console.error('[ADMIN] Contact update error:', error);
    res.status(500).json({ error: 'Failed to update contact' });
  }
});

// DELETE /api/admin/contacts/:id - Delete contact
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const supabase = getSupabase();

    // Check contact exists
    const { data: existing } = await supabase
      .from('coordinator_contacts')
      .select('id')
      .eq('id', req.params.id)
      .single();

    if (!existing) {
      res.status(404).json({ error: 'Contact not found' });
      return;
    }

    const { error } = await supabase.from('coordinator_contacts').delete().eq('id', req.params.id);

    if (error) throw error;

    res.json({ success: true });
  } catch (error) {
    console.error('[ADMIN] Contact delete error:', error);
    res.status(500).json({ error: 'Failed to delete contact' });
  }
});

export default router;
