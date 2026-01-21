import { Router, Request, Response } from 'express';
import { config } from '../config';
import { findGuestByPhone } from '../repositories/guests';
import {
  getAvailableRegistryItems,
  getClaimsByGuestId,
  createClaim,
  deleteClaimByItemAndGuest,
  getRegistryItemById,
  isItemClaimed,
} from '../repositories/registry';
import type { Guest } from '../types';

const router = Router();

/**
 * Middleware to validate guest by phone number
 * Sets req.guest if valid, returns 403 if not found or registry closed
 */
async function validateGuest(
  req: Request & { guest?: Guest },
  res: Response,
  next: () => void
): Promise<void> {
  // Check if registry is open
  if (!config.registry.isOpen) {
    res.status(403).json({ error: 'Registry is currently closed' });
    return;
  }

  const phone = req.query.phone as string;

  if (!phone) {
    res.status(400).json({ error: 'Phone number is required' });
    return;
  }

  // Look up guest by phone number
  const guest = await findGuestByPhone(phone);

  if (!guest) {
    res.status(403).json({ error: 'Please message the wedding bot first to access the wishlist' });
    return;
  }

  req.guest = guest;
  next();
}

// GET /api/registry/items - Get all available items with claim status for guest
router.get('/items', async (req: Request & { guest?: Guest }, res: Response) => {
  try {
    await validateGuest(req, res, async () => {
      const guest = req.guest!;

      // Get all available items
      const items = await getAvailableRegistryItems();

      // Get this guest's claims
      const guestClaims = await getClaimsByGuestId(guest.id);
      const guestClaimedItemIds = new Set(guestClaims.map((c) => c.item_id));

      // Get all claimed item IDs (to show which items are taken)
      const itemsWithClaimStatus = await Promise.all(
        items.map(async (item) => {
          const claimed = await isItemClaimed(item.id);
          return {
            id: item.id,
            name: item.name,
            name_hi: item.name_hi,
            name_pa: item.name_pa,
            description: item.description,
            description_hi: item.description_hi,
            description_pa: item.description_pa,
            price: item.show_price ? item.price : null,
            show_price: item.show_price,
            image_url: item.image_url,
            external_link: item.external_link,
            is_claimed: claimed,
            claimed_by_me: guestClaimedItemIds.has(item.id),
          };
        })
      );

      res.json({
        items: itemsWithClaimStatus,
        guest: {
          id: guest.id,
          name: guest.name,
          language: guest.user_language || 'EN',
        },
      });
    });
  } catch (error) {
    console.error('[REGISTRY] Items fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch registry items' });
  }
});

// POST /api/registry/claim - Claim an item
router.post('/claim', async (req: Request & { guest?: Guest }, res: Response) => {
  try {
    await validateGuest(req, res, async () => {
      const guest = req.guest!;
      const { itemId } = req.body;

      if (!itemId) {
        res.status(400).json({ error: 'itemId is required' });
        return;
      }

      // Check item exists and is available
      const item = await getRegistryItemById(itemId);
      if (!item) {
        res.status(404).json({ error: 'Item not found' });
        return;
      }

      if (!item.is_available) {
        res.status(400).json({ error: 'Item is not available' });
        return;
      }

      // Check if already claimed
      const alreadyClaimed = await isItemClaimed(itemId);
      if (alreadyClaimed) {
        res.status(409).json({ error: 'Item is already claimed' });
        return;
      }

      // Create the claim
      const claim = await createClaim(itemId, guest.id);

      res.status(201).json({
        success: true,
        claim: {
          id: claim.id,
          item_id: claim.item_id,
          claimed_at: claim.claimed_at,
        },
      });
    });
  } catch (error) {
    console.error('[REGISTRY] Claim error:', error);
    res.status(500).json({ error: 'Failed to claim item' });
  }
});

// DELETE /api/registry/claim/:itemId - Unclaim an item
router.delete('/claim/:itemId', async (req: Request & { guest?: Guest }, res: Response) => {
  try {
    await validateGuest(req, res, async () => {
      const guest = req.guest!;
      const { itemId } = req.params;

      // Delete the claim (only if it belongs to this guest)
      await deleteClaimByItemAndGuest(itemId, guest.id);

      res.json({ success: true });
    });
  } catch (error) {
    console.error('[REGISTRY] Unclaim error:', error);
    res.status(500).json({ error: 'Failed to unclaim item' });
  }
});

// GET /api/registry/settings - Get registry settings (public)
router.get('/settings', (_req: Request, res: Response) => {
  res.json({
    isOpen: config.registry.isOpen,
    upiAddress: config.registry.upiAddress || null,
  });
});

export default router;
