-- ─── service_items: linked_order_id ──────────────────────────────────────────
-- Links a service item to the sales order it was purchased through.
-- Used to surface warranty status at repair intake: if linked_order_id is set
-- and purchase_date + warranty_months is in the future → item is under warranty.

ALTER TABLE service_items
  ADD COLUMN IF NOT EXISTS linked_order_id uuid REFERENCES orders(id) ON DELETE SET NULL;

CREATE INDEX service_items_linked_order_idx
  ON service_items (linked_order_id)
  WHERE linked_order_id IS NOT NULL;
