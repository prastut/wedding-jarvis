import { Router, Request, Response } from 'express';
import { sendTestBroadcast } from '../services/broadcast/broadcaster';

const router = Router();

// POST /api/test/broadcast - Test broadcast endpoint for Phase 3 validation
// Remove this endpoint after validating the integration works
router.post('/broadcast', async (req: Request, res: Response) => {
  try {
    const message = req.body.message || 'Test broadcast message from Wedding Jarvis!';

    console.log('Starting test broadcast...');
    const result = await sendTestBroadcast(message);

    res.json({
      success: true,
      result,
    });
  } catch (error) {
    console.error('Test broadcast error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
