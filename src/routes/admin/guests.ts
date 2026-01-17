import { Router, Request, Response } from 'express';
import { getAllGuests, GuestFilters } from '../../repositories/guests';
import type { UserLanguage, UserSide } from '../../types';

const router = Router();

// GET /api/admin/guests - List guests with pagination and filters
router.get('/', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const search = req.query.search as string | undefined;
    const optedIn =
      req.query.opted_in === 'true' ? true : req.query.opted_in === 'false' ? false : undefined;

    // New filters for language, side, and RSVP status
    const languageParam = req.query.language as string | undefined;
    const sideParam = req.query.side as string | undefined;
    const rsvpParam = req.query.rsvp as string | undefined;

    // Parse language filter
    let language: GuestFilters['language'];
    if (languageParam === 'not_set') {
      language = 'not_set';
    } else if (languageParam && ['EN', 'HI', 'PA'].includes(languageParam)) {
      language = languageParam as UserLanguage;
    }

    // Parse side filter
    let side: GuestFilters['side'];
    if (sideParam === 'not_set') {
      side = 'not_set';
    } else if (sideParam && ['GROOM', 'BRIDE'].includes(sideParam)) {
      side = sideParam as UserSide;
    }

    // Parse RSVP filter
    let rsvpStatus: GuestFilters['rsvpStatus'];
    if (rsvpParam === 'pending') {
      rsvpStatus = 'pending';
    } else if (rsvpParam && ['YES', 'NO'].includes(rsvpParam)) {
      rsvpStatus = rsvpParam as 'YES' | 'NO';
    }

    const offset = (page - 1) * limit;

    const { guests, total } = await getAllGuests({
      limit,
      offset,
      search,
      optedIn,
      language,
      side,
      rsvpStatus,
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

    // Parse filters for export
    const languageParam = req.query.language as string | undefined;
    const sideParam = req.query.side as string | undefined;
    const rsvpParam = req.query.rsvp as string | undefined;

    let language: GuestFilters['language'];
    if (languageParam === 'not_set') {
      language = 'not_set';
    } else if (languageParam && ['EN', 'HI', 'PA'].includes(languageParam)) {
      language = languageParam as UserLanguage;
    }

    let side: GuestFilters['side'];
    if (sideParam === 'not_set') {
      side = 'not_set';
    } else if (sideParam && ['GROOM', 'BRIDE'].includes(sideParam)) {
      side = sideParam as UserSide;
    }

    let rsvpStatus: GuestFilters['rsvpStatus'];
    if (rsvpParam === 'pending') {
      rsvpStatus = 'pending';
    } else if (rsvpParam && ['YES', 'NO'].includes(rsvpParam)) {
      rsvpStatus = rsvpParam as 'YES' | 'NO';
    }

    const { guests } = await getAllGuests({
      limit: 10000,
      optedIn,
      language,
      side,
      rsvpStatus,
    });

    // Build CSV with new columns
    const headers = [
      'phone_number',
      'name',
      'opted_in',
      'language',
      'side',
      'rsvp_status',
      'guest_count',
      'first_seen_at',
      'last_inbound_at',
    ];

    const formatLanguage = (lang: string | null): string => {
      switch (lang) {
        case 'EN':
          return 'English';
        case 'HI':
          return 'Hindi';
        case 'PA':
          return 'Punjabi';
        default:
          return '';
      }
    };

    const formatSide = (s: string | null): string => {
      switch (s) {
        case 'GROOM':
          return 'Groom';
        case 'BRIDE':
          return 'Bride';
        default:
          return '';
      }
    };

    const formatRsvp = (status: string | null): string => {
      switch (status) {
        case 'YES':
          return 'Attending';
        case 'NO':
          return 'Not Attending';
        default:
          return 'Pending';
      }
    };

    const rows = guests.map((g) => [
      g.phone_number,
      g.name || '',
      g.opted_in ? 'Yes' : 'No',
      formatLanguage(g.user_language),
      formatSide(g.user_side),
      formatRsvp(g.rsvp_status),
      g.rsvp_guest_count !== null ? String(g.rsvp_guest_count) : '',
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
