import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import statsRouter from './stats';
import guestsRouter from './guests';
import broadcastsRouter from './broadcasts';

const router = Router();

// All admin routes require authentication
router.use(requireAuth);

// Mount sub-routers
router.use('/stats', statsRouter);
router.use('/guests', guestsRouter);
router.use('/broadcasts', broadcastsRouter);

export default router;
