import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import statsRouter from './stats';
import guestsRouter from './guests';
import broadcastsRouter from './broadcasts';
import eventsRouter from './events';
import venuesRouter from './venues';
import faqsRouter from './faqs';
import contactsRouter from './contacts';
import messagesRouter from './messages';
import registryRouter from './registry';

const router = Router();

// All admin routes require authentication
router.use(requireAuth);

// Mount sub-routers
router.use('/stats', statsRouter);
router.use('/guests', guestsRouter);
router.use('/broadcasts', broadcastsRouter);
router.use('/events', eventsRouter);
router.use('/venues', venuesRouter);
router.use('/faqs', faqsRouter);
router.use('/contacts', contactsRouter);
router.use('/messages', messagesRouter);
router.use('/registry', registryRouter);

export default router;
