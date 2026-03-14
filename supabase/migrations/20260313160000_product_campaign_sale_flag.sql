-- When true the product-level sale_percentage is suppressed on the storefront;
-- the discount is expected to come from an active campaign instead.
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS campaign_sale_only boolean NOT NULL DEFAULT false;
