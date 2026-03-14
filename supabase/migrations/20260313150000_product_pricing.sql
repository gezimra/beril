-- Add purchase price and sale percentage to products
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS purchase_price numeric,
  ADD COLUMN IF NOT EXISTS sale_percentage numeric;
