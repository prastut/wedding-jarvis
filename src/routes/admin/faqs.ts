import { Router, Request, Response } from 'express';
import { getSupabase } from '../../db/client';
import type { FAQ } from '../../types';

const router = Router();

// GET /api/admin/faqs - List all FAQs
router.get('/', async (_req: Request, res: Response) => {
  try {
    const supabase = getSupabase();
    const { data: faqs, error } = await supabase
      .from('faqs')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error) throw error;

    res.json({ faqs: faqs || [] });
  } catch (error) {
    console.error('[ADMIN] FAQs list error:', error);
    res.status(500).json({ error: 'Failed to fetch FAQs' });
  }
});

// GET /api/admin/faqs/:id - Get single FAQ
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const supabase = getSupabase();
    const { data: faq, error } = await supabase
      .from('faqs')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error || !faq) {
      res.status(404).json({ error: 'FAQ not found' });
      return;
    }

    res.json({ faq });
  } catch (error) {
    console.error('[ADMIN] FAQ fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch FAQ' });
  }
});

// POST /api/admin/faqs - Create FAQ
router.post('/', async (req: Request, res: Response) => {
  try {
    const {
      question,
      question_hi,
      question_pa,
      answer,
      answer_hi,
      answer_pa,
      category,
      sort_order,
    } = req.body;

    // Validate required fields
    if (!question) {
      res.status(400).json({ error: 'Question is required' });
      return;
    }

    if (!answer) {
      res.status(400).json({ error: 'Answer is required' });
      return;
    }

    const supabase = getSupabase();
    const { data: faq, error } = await supabase
      .from('faqs')
      .insert({
        question,
        question_hi: question_hi || null,
        question_pa: question_pa || null,
        answer,
        answer_hi: answer_hi || null,
        answer_pa: answer_pa || null,
        category: category || null,
        sort_order: sort_order ?? 0,
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({ faq });
  } catch (error) {
    console.error('[ADMIN] FAQ create error:', error);
    res.status(500).json({ error: 'Failed to create FAQ' });
  }
});

// PATCH /api/admin/faqs/:id - Update FAQ
router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const supabase = getSupabase();

    // Check FAQ exists
    const { data: existing } = await supabase
      .from('faqs')
      .select('id')
      .eq('id', req.params.id)
      .single();

    if (!existing) {
      res.status(404).json({ error: 'FAQ not found' });
      return;
    }

    const {
      question,
      question_hi,
      question_pa,
      answer,
      answer_hi,
      answer_pa,
      category,
      sort_order,
    } = req.body;

    const updates: Partial<FAQ> = {};
    if (question !== undefined) updates.question = question;
    if (question_hi !== undefined) updates.question_hi = question_hi || null;
    if (question_pa !== undefined) updates.question_pa = question_pa || null;
    if (answer !== undefined) updates.answer = answer;
    if (answer_hi !== undefined) updates.answer_hi = answer_hi || null;
    if (answer_pa !== undefined) updates.answer_pa = answer_pa || null;
    if (category !== undefined) updates.category = category || null;
    if (sort_order !== undefined) updates.sort_order = sort_order;

    const { data: faq, error } = await supabase
      .from('faqs')
      .update(updates)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;

    res.json({ faq });
  } catch (error) {
    console.error('[ADMIN] FAQ update error:', error);
    res.status(500).json({ error: 'Failed to update FAQ' });
  }
});

// DELETE /api/admin/faqs/:id - Delete FAQ
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const supabase = getSupabase();

    // Check FAQ exists
    const { data: existing } = await supabase
      .from('faqs')
      .select('id')
      .eq('id', req.params.id)
      .single();

    if (!existing) {
      res.status(404).json({ error: 'FAQ not found' });
      return;
    }

    const { error } = await supabase.from('faqs').delete().eq('id', req.params.id);

    if (error) throw error;

    res.json({ success: true });
  } catch (error) {
    console.error('[ADMIN] FAQ delete error:', error);
    res.status(500).json({ error: 'Failed to delete FAQ' });
  }
});

export default router;
