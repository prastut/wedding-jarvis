import { Router, Request, Response } from 'express';
import { getRecentMessages, getChatHistory } from '../../repositories/messageLogs';
import { findGuestByPhone } from '../../repositories/guests';

const router = Router();

// GET /api/admin/messages/recent - Get recent messages for activity feed
router.get('/recent', async (req: Request, res: Response) => {
  try {
    const direction = req.query.direction as 'inbound' | 'outbound' | undefined;
    const since = req.query.since as string | undefined;
    const limit = parseInt(req.query.limit as string) || 50;

    const { messages, total } = await getRecentMessages({
      direction,
      since,
      limit: Math.min(limit, 100),
    });

    res.json({ messages, total });
  } catch (error) {
    console.error('Recent messages error:', error);
    res.status(500).json({ error: 'Failed to fetch recent messages' });
  }
});

// GET /api/admin/messages/:phone - Get chat history for a specific phone number
router.get('/:phone', async (req: Request, res: Response) => {
  try {
    const phoneNumber = req.params.phone;
    const limit = parseInt(req.query.limit as string) || 100;
    const offset = parseInt(req.query.offset as string) || 0;

    // Get guest info and chat history in parallel
    const [guest, { messages, total }] = await Promise.all([
      findGuestByPhone(phoneNumber),
      getChatHistory(phoneNumber, { limit, offset }),
    ]);

    res.json({
      guest: guest || null,
      messages,
      pagination: {
        limit,
        offset,
        total,
      },
    });
  } catch (error) {
    console.error('Chat history error:', error);
    res.status(500).json({ error: 'Failed to fetch chat history' });
  }
});

export default router;
