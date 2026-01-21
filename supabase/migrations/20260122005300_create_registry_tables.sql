-- Wedding Registry Tables

-- Registry items table (gift wishlist)
CREATE TABLE IF NOT EXISTS registry_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  name_hi VARCHAR(255),
  name_pa VARCHAR(255),
  description TEXT,
  description_hi TEXT,
  description_pa TEXT,
  price DECIMAL(10,2),
  show_price BOOLEAN DEFAULT true,
  image_url TEXT,
  external_link TEXT,
  sort_order INTEGER DEFAULT 0,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_registry_items_sort ON registry_items(sort_order);
CREATE INDEX idx_registry_items_available ON registry_items(is_available);

-- Registry claims table (tracks who claimed what)
CREATE TABLE IF NOT EXISTS registry_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES registry_items(id) ON DELETE CASCADE,
  guest_id UUID NOT NULL REFERENCES guests(id) ON DELETE CASCADE,
  claimed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(item_id)
);

CREATE INDEX idx_registry_claims_item ON registry_claims(item_id);
CREATE INDEX idx_registry_claims_guest ON registry_claims(guest_id);

-- Apply updated_at trigger to registry_items
DROP TRIGGER IF EXISTS update_registry_items_updated_at ON registry_items;
CREATE TRIGGER update_registry_items_updated_at BEFORE UPDATE ON registry_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
