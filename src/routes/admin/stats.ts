import { Router, Request, Response } from 'express';
import { getDashboardStats } from '../../repositories/stats';

const router = Router();

// GET /api/admin/stats - Dashboard statistics
router.get('/', async (_req: Request, res: Response) => {
  try {
    const stats = await getDashboardStats();
    res.json(stats);
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

export default router;
