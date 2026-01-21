import { Router, Request, Response } from 'express';
import {
  getAllRegistryItems,
  getRegistryItemById,
  createRegistryItem,
  updateRegistryItem,
  deleteRegistryItem,
  reorderRegistryItems,
  getAllClaimsWithGuests,
  deleteClaim,
  isItemClaimed,
} from '../../repositories/registry';
import type { RegistryItemInput } from '../../types';

const router = Router();

// ============================================================================
// Registry Items
// ============================================================================

// GET /api/admin/registry/items - List all items
router.get('/items', async (_req: Request, res: Response) => {
  try {
    const items = await getAllRegistryItems();
    res.json({ items });
  } catch (error) {
    console.error('[ADMIN] Registry items list error:', error);
    res.status(500).json({ error: 'Failed to fetch registry items' });
  }
});

// GET /api/admin/registry/items/:id - Get single item
router.get('/items/:id', async (req: Request, res: Response) => {
  try {
    const item = await getRegistryItemById(req.params.id);

    if (!item) {
      res.status(404).json({ error: 'Registry item not found' });
      return;
    }

    res.json({ item });
  } catch (error) {
    console.error('[ADMIN] Registry item fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch registry item' });
  }
});

// POST /api/admin/registry/items - Create item
router.post('/items', async (req: Request, res: Response) => {
  try {
    const {
      name,
      name_hi,
      name_pa,
      description,
      description_hi,
      description_pa,
      price,
      show_price,
      image_url,
      external_link,
      sort_order,
      is_available,
    } = req.body;

    // Validate required fields
    if (!name) {
      res.status(400).json({ error: 'Name is required' });
      return;
    }

    const input: RegistryItemInput = {
      name,
      name_hi: name_hi || null,
      name_pa: name_pa || null,
      description: description || null,
      description_hi: description_hi || null,
      description_pa: description_pa || null,
      price: price ? parseFloat(price) : null,
      show_price: show_price ?? true,
      image_url: image_url || null,
      external_link: external_link || null,
      sort_order: sort_order ?? 0,
      is_available: is_available ?? true,
    };

    const item = await createRegistryItem(input);
    res.status(201).json({ item });
  } catch (error) {
    console.error('[ADMIN] Registry item create error:', error);
    res.status(500).json({ error: 'Failed to create registry item' });
  }
});

// PATCH /api/admin/registry/items/:id - Update item
router.patch('/items/:id', async (req: Request, res: Response) => {
  try {
    // Check item exists
    const existing = await getRegistryItemById(req.params.id);
    if (!existing) {
      res.status(404).json({ error: 'Registry item not found' });
      return;
    }

    const {
      name,
      name_hi,
      name_pa,
      description,
      description_hi,
      description_pa,
      price,
      show_price,
      image_url,
      external_link,
      sort_order,
      is_available,
    } = req.body;

    const updates: Partial<RegistryItemInput> = {};
    if (name !== undefined) updates.name = name;
    if (name_hi !== undefined) updates.name_hi = name_hi || null;
    if (name_pa !== undefined) updates.name_pa = name_pa || null;
    if (description !== undefined) updates.description = description || null;
    if (description_hi !== undefined) updates.description_hi = description_hi || null;
    if (description_pa !== undefined) updates.description_pa = description_pa || null;
    if (price !== undefined) updates.price = price ? parseFloat(price) : null;
    if (show_price !== undefined) updates.show_price = show_price;
    if (image_url !== undefined) updates.image_url = image_url || null;
    if (external_link !== undefined) updates.external_link = external_link || null;
    if (sort_order !== undefined) updates.sort_order = sort_order;
    if (is_available !== undefined) updates.is_available = is_available;

    const item = await updateRegistryItem(req.params.id, updates);
    res.json({ item });
  } catch (error) {
    console.error('[ADMIN] Registry item update error:', error);
    res.status(500).json({ error: 'Failed to update registry item' });
  }
});

// DELETE /api/admin/registry/items/:id - Delete item
router.delete('/items/:id', async (req: Request, res: Response) => {
  try {
    // Check item exists
    const existing = await getRegistryItemById(req.params.id);
    if (!existing) {
      res.status(404).json({ error: 'Registry item not found' });
      return;
    }

    // Check for existing claims
    const hasClaims = await isItemClaimed(req.params.id);
    if (hasClaims) {
      res.status(400).json({
        error: 'Cannot delete item with existing claims. Release the claim first.',
      });
      return;
    }

    await deleteRegistryItem(req.params.id);
    res.json({ success: true });
  } catch (error) {
    console.error('[ADMIN] Registry item delete error:', error);
    res.status(500).json({ error: 'Failed to delete registry item' });
  }
});

// POST /api/admin/registry/items/reorder - Reorder items
router.post('/items/reorder', async (req: Request, res: Response) => {
  try {
    const { orderedIds } = req.body;

    if (!Array.isArray(orderedIds)) {
      res.status(400).json({ error: 'orderedIds array is required' });
      return;
    }

    await reorderRegistryItems(orderedIds);
    res.json({ success: true });
  } catch (error) {
    console.error('[ADMIN] Registry items reorder error:', error);
    res.status(500).json({ error: 'Failed to reorder registry items' });
  }
});

// POST /api/admin/registry/items/import - Import from CSV
router.post('/items/import', async (req: Request, res: Response) => {
  try {
    const { csv } = req.body;

    if (!csv || typeof csv !== 'string') {
      res.status(400).json({ error: 'CSV data is required' });
      return;
    }

    // Parse CSV
    const lines = csv.trim().split('\n');
    if (lines.length < 2) {
      res.status(400).json({ error: 'CSV must have a header row and at least one data row' });
      return;
    }

    // Parse header
    const header = parseCSVLine(lines[0]);

    // Validate header has required columns
    if (!header.includes('name')) {
      res.status(400).json({ error: 'CSV must have a "name" column' });
      return;
    }

    // Get current max sort_order
    const existingItems = await getAllRegistryItems();
    let sortOrder = existingItems.length > 0 ? Math.max(...existingItems.map((i) => i.sort_order)) + 1 : 0;

    // Parse and create items
    const imported: string[] = [];
    const errors: string[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      try {
        const values = parseCSVLine(line);
        const row: Record<string, string> = {};

        header.forEach((col, idx) => {
          row[col.toLowerCase().trim()] = values[idx]?.trim() || '';
        });

        if (!row.name) {
          errors.push(`Row ${i + 1}: Name is required`);
          continue;
        }

        const input: RegistryItemInput = {
          name: row.name,
          name_hi: row.name_hi || null,
          name_pa: row.name_pa || null,
          description: row.description || null,
          description_hi: row.description_hi || null,
          description_pa: row.description_pa || null,
          price: row.price ? parseFloat(row.price) : null,
          show_price: !!row.price,
          image_url: row.image_url || null,
          external_link: row.external_link || null,
          sort_order: sortOrder++,
          is_available: true,
        };

        await createRegistryItem(input);
        imported.push(row.name);
      } catch (err) {
        errors.push(`Row ${i + 1}: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    }

    res.json({
      success: true,
      imported: imported.length,
      items: imported,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error('[ADMIN] Registry import error:', error);
    res.status(500).json({ error: 'Failed to import registry items' });
  }
});

/**
 * Parse a CSV line, handling quoted values
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        // Escaped quote
        current += '"';
        i++;
      } else {
        // Toggle quote mode
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current);
  return result;
}

// ============================================================================
// Registry Claims
// ============================================================================

// GET /api/admin/registry/claims - List all claims with guest info
router.get('/claims', async (_req: Request, res: Response) => {
  try {
    const claims = await getAllClaimsWithGuests();
    res.json({ claims });
  } catch (error) {
    console.error('[ADMIN] Registry claims list error:', error);
    res.status(500).json({ error: 'Failed to fetch registry claims' });
  }
});

// DELETE /api/admin/registry/claims/:id - Release a claim
router.delete('/claims/:id', async (req: Request, res: Response) => {
  try {
    await deleteClaim(req.params.id);
    res.json({ success: true });
  } catch (error) {
    console.error('[ADMIN] Registry claim delete error:', error);
    res.status(500).json({ error: 'Failed to release claim' });
  }
});

export default router;
