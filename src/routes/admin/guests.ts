import { Router, Request, Response } from 'express';
import { getAllGuests } from '../../repositories/guests';

const router = Router();

// GET /api/admin/guests - List guests with pagination and filters
router.get('/', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const search = req.query.search as string | undefined;
    const optedIn =
      req.query.opted_in === 'true' ? true : req.query.opted_in === 'false' ? false : undefined;

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
router.get('/export', async (req: Request, res: Response) => {
  try {
    const optedIn =
      req.query.opted_in === 'true' ? true : req.query.opted_in === 'false' ? false : undefined;

    const { guests } = await getAllGuests({ limit: 10000, optedIn });

    // Build CSV
    const headers = ['phone_number', 'name', 'opted_in', 'first_seen_at', 'last_inbound_at'];
    const rows = guests.map((g) => [
      g.phone_number,
      g.name || '',
      g.opted_in ? 'Yes' : 'No',
      g.first_seen_at,
      g.last_inbound_at || '',
    ]);

    const csv = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="guests.csv"');
    res.send(csv);
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ error: 'Failed to export guests' });
  }
});

export default router;
