/**
 * Temporary test routes for validating WhatsApp interactive messages
 * TO BE REMOVED after PR-00 validation is complete
 */
import { Router, Request, Response } from 'express';
import { sendReplyButtons, sendListMessage } from '../services/whatsappClient';

const router = Router();

/**
 * POST /test-interactive/buttons?to=PHONE_NUMBER
 * Sends a test reply button message with 3 buttons
 */
router.post('/buttons', async (req: Request, res: Response) => {
  const to = req.query.to as string;

  if (!to) {
    res.status(400).json({ error: 'Missing required query param: to (phone number)' });
    return;
  }

  try {
    const result = await sendReplyButtons(
      to,
      "Welcome to Sanjoli & Shreyas's Wedding! 🌸\n\nPlease select your language:",
      [
        { id: 'lang_en', title: 'English' },
        { id: 'lang_hi', title: 'हिंदी' },
        { id: 'lang_pa', title: 'ਪੰਜਾਬੀ' },
      ]
    );

    console.log('Reply buttons sent successfully:', result);
    res.json({
      success: true,
      message: 'Reply buttons sent',
      result,
    });
  } catch (error) {
    console.error('Failed to send reply buttons:', error);
    res.status(500).json({
      error: 'Failed to send reply buttons',
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

/**
 * POST /test-interactive/list?to=PHONE_NUMBER
 * Sends a test list message with 5 items
 */
router.post('/list', async (req: Request, res: Response) => {
  const to = req.query.to as string;

  if (!to) {
    res.status(400).json({ error: 'Missing required query param: to (phone number)' });
    return;
  }

  try {
    const result = await sendListMessage(
      to,
      'Welcome back! 👋\n\nHow can I help you today?',
      'View Options',
      [
        {
          title: 'Main Menu',
          rows: [
            {
              id: 'menu_schedule',
              title: 'Event Schedule',
              description: 'View all wedding events',
            },
            {
              id: 'menu_venue',
              title: 'Venue & Directions',
              description: 'Get venue details and maps',
            },
            { id: 'menu_rsvp', title: 'RSVP', description: 'Confirm your attendance' },
            {
              id: 'menu_emergency',
              title: 'Emergency Contact',
              description: 'Get help from coordinators',
            },
            { id: 'menu_faq', title: 'FAQs', description: 'Common questions answered' },
          ],
        },
      ]
    );

    console.log('List message sent successfully:', result);
    res.json({
      success: true,
      message: 'List message sent',
      result,
    });
  } catch (error) {
    console.error('Failed to send list message:', error);
    res.status(500).json({
      error: 'Failed to send list message',
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

/**
 * POST /test-interactive/side-selection?to=PHONE_NUMBER
 * Sends a test for side selection (2 buttons)
 */
router.post('/side-selection', async (req: Request, res: Response) => {
  const to = req.query.to as string;

  if (!to) {
    res.status(400).json({ error: 'Missing required query param: to (phone number)' });
    return;
  }

  try {
    const result = await sendReplyButtons(to, 'Thank you! 🙏\n\nPlease select your side:', [
      { id: 'side_groom', title: "Groom's Side" },
      { id: 'side_bride', title: "Bride's Side" },
    ]);

    console.log('Side selection sent successfully:', result);
    res.json({
      success: true,
      message: 'Side selection buttons sent',
      result,
    });
  } catch (error) {
    console.error('Failed to send side selection:', error);
    res.status(500).json({
      error: 'Failed to send side selection',
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

export default router;
