-- ─── warranty_months + warranty_terms on products ────────────────────────────
-- warranty_months: how many months the warranty lasts (0 = no warranty).
-- warranty_terms: plain-text description of what is and isn't covered,
--   e.g. "Covers movement mechanism only. Excludes physical damage, water
--   damage, and strap/lens wear."
-- Used to auto-create service_items with warranty context when an order
-- transitions to completed/delivered.

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS warranty_months integer NOT NULL DEFAULT 0
    CHECK (warranty_months >= 0);

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS warranty_terms text;
