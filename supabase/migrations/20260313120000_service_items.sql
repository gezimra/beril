-- Ensure the shared updated_at helper exists (idempotent)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ─── service_items ────────────────────────────────────────────────────────────
-- Tracks physical items (watches, eyewear, other) brought in for service.
-- Gives each item a persistent identity so multiple repair visits can be linked
-- and service history, warranty, and recurring issues can be tracked over time.

CREATE TABLE service_items (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  item_type        text        NOT NULL CHECK (item_type IN ('watch', 'eyewear', 'other')),
  brand            text,
  model            text,
  serial_number    text,
  purchase_date    date,
  warranty_months  integer     DEFAULT 12 CHECK (warranty_months >= 0),
  color            text,
  notes            text,
  created_at       timestamptz DEFAULT now(),
  updated_at       timestamptz DEFAULT now()
);

-- Fast serial-number lookup (most common search path)
CREATE INDEX service_items_serial_idx    ON service_items (serial_number) WHERE serial_number IS NOT NULL;
-- Brand + model index for non-serial lookups
CREATE INDEX service_items_brand_model_idx ON service_items (brand, model);

-- Trigger to keep updated_at fresh
CREATE TRIGGER service_items_updated_at
  BEFORE UPDATE ON service_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ─── Link repair_requests → service_items ────────────────────────────────────
-- Nullable: old/legacy repair_requests won't have this.
-- Future repairs created via admin intake will be linked.

ALTER TABLE repair_requests
  ADD COLUMN IF NOT EXISTS service_item_id uuid REFERENCES service_items(id) ON DELETE SET NULL;

CREATE INDEX repair_requests_service_item_idx ON repair_requests (service_item_id) WHERE service_item_id IS NOT NULL;

-- ─── RLS ──────────────────────────────────────────────────────────────────────
ALTER TABLE service_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_items_owner_all"
  ON service_items
  FOR ALL
  USING (is_owner())
  WITH CHECK (is_owner());
