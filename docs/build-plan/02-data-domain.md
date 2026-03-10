# Phase 02: Data And Domain

## Goal

Create the real backend model for BERIL so product discovery, checkout, repair intake, and admin operations all sit on one coherent data layer.

This phase locks the database schema, storage plan, validation, seed data, RLS, and server-side access contracts before route-heavy work begins.

## In Scope

- Create Supabase SQL enums for all shared statuses and method types.
- Create and migrate all core tables.
- Add RLS policies for public reads and restricted writes.
- Create storage buckets and access policies.
- Seed initial site settings, homepage blocks, watches, eyewear, and sample journal content.
- Build server-side query and mutation helpers for catalog, orders, repairs, contacts, and journal posts.
- Create shared Zod schemas for all customer-facing and admin-facing forms.
- Create deterministic code generation utilities for order and repair codes.
- Define filter param schemas and parsing helpers for catalog routes.
- Normalize phone numbers and emails for repair tracking and admin matching.

## Out Of Scope

- Styling or delivery of public feature routes.
- Cart persistence UI.
- Admin table UIs.
- SEO metadata output beyond what is needed to support later reads.

## Routes

This phase does not deliver feature pages directly.

It provides the data contracts used later by:

- `/`
- `/watches`
- `/eyewear`
- `/products/[slug]`
- `/checkout`
- `/service/request`
- `/repair-track`
- `/contact`
- `/journal`
- `/admin/*`

## Data And Types

### Enums

Create database enums and matching app types for:

- `product_category`: `watch`, `eyewear`
- `product_subtype`: `analog_watch`, `smart_watch`, `frame`, `sunglasses`, `service_accessory`
- `stock_status`: `in_stock`, `limited`, `available_on_request`, `out_of_stock`
- `product_status`: `draft`, `active`, `archived`
- `order_status`: `pending`, `confirmed`, `preparing`, `out_for_delivery`, `ready_for_pickup`, `delivered`, `completed`, `cancelled`
- `payment_method`: `cash_on_delivery`, `pay_in_store`, `card_online`, `bank_transfer`
- `payment_status`: `pending`, `not_required`, `authorized`, `paid`, `failed`, `refunded`, `cancelled`
- `delivery_method`: `home_delivery`, `store_pickup`
- `repair_status`: `request_received`, `awaiting_drop_off`, `received_in_store`, `under_inspection`, `waiting_parts`, `in_repair`, `ready_for_pickup`, `completed`, `cancelled`
- `preferred_contact_method`: `phone`, `email`, `whatsapp`
- `drop_off_method`: `bring_to_store`, `already_dropped_off`, `contact_me_first`
- `journal_status`: `draft`, `published`, `archived`
- `user_role`: `owner`, `manager`, `service_staff`, `editor`

### Tables

Create these tables and fields as the v1 source of truth:

- `profiles`
  - `id`
  - `email`
  - `full_name`
  - `role`
  - `created_at`
  - `updated_at`
- `products`
  - `id`
  - `slug`
  - `title`
  - `brand`
  - `category`
  - `subtype`
  - `short_description`
  - `description`
  - `price`
  - `currency`
  - `stock_status`
  - `quantity`
  - `featured`
  - `is_new`
  - `status`
  - `primary_cta_mode`
  - `created_at`
  - `updated_at`
- `product_images`
  - `id`
  - `product_id`
  - `url`
  - `alt`
  - `sort_order`
- `product_specs`
  - `id`
  - `product_id`
  - `key`
  - `value`
  - `sort_order`
- `orders`
  - `id`
  - `order_code`
  - `customer_name`
  - `phone`
  - `phone_normalized`
  - `email`
  - `email_normalized`
  - `city`
  - `address`
  - `notes`
  - `internal_notes`
  - `delivery_method`
  - `payment_method`
  - `payment_status`
  - `payment_provider`
  - `payment_reference`
  - `order_status`
  - `subtotal`
  - `delivery_fee`
  - `total`
  - `created_at`
  - `updated_at`
- `order_items`
  - `id`
  - `order_id`
  - `product_id`
  - `product_title_snapshot`
  - `product_brand_snapshot`
  - `quantity`
  - `unit_price`
  - `total_price`
- `order_status_history`
  - `id`
  - `order_id`
  - `status`
  - `note`
  - `created_at`
- `repair_requests`
  - `id`
  - `repair_code`
  - `customer_name`
  - `email`
  - `email_normalized`
  - `phone`
  - `phone_normalized`
  - `preferred_contact_method`
  - `item_type`
  - `brand`
  - `model`
  - `serial_number`
  - `purchase_date`
  - `service_type`
  - `description`
  - `drop_off_method`
  - `status`
  - `estimated_completion`
  - `amount_due`
  - `notes_internal`
  - `notes_customer`
  - `created_at`
  - `updated_at`
- `repair_attachments`
  - `id`
  - `repair_request_id`
  - `file_url`
  - `file_type`
  - `file_label`
  - `created_at`
- `repair_status_history`
  - `id`
  - `repair_request_id`
  - `status`
  - `note`
  - `created_at`
  - `visible_to_customer`
- `contacts`
  - `id`
  - `name`
  - `email`
  - `phone`
  - `subject`
  - `message`
  - `created_at`
- `journal_posts`
  - `id`
  - `slug`
  - `title`
  - `excerpt`
  - `content`
  - `cover_image`
  - `status`
  - `published_at`
  - `created_at`
  - `updated_at`
- `site_settings`
  - `id`
  - `key`
  - `value`
  - `updated_at`

### Data Decisions

- `stock_status` replaces a plain `in_stock` boolean as the merchandising source of truth.
- `products.primary_cta_mode` decides whether a product defaults to add-to-cart, reserve, WhatsApp inquiry, or availability request.
- Use snapshots in `order_items` so order history is stable even if product names or prices change later.
- `internal_notes` lives directly on `orders`; repair requests already have `notes_internal`.
- `contacts` remains lightweight in v1 and is surfaced in admin as inquiries.
- `/admin/customers` is a derived read model from orders, repairs, and contacts. Do not add a `customers` table in v1.

### Storage

- Bucket `products`: product galleries and admin media uploads
- Bucket `repairs`: customer uploads and staff attachments
- Bucket `journal`: journal cover images
- Bucket `site`: hero media, store photos, brand assets

Storage rules:

- public read for `products`, `journal`, and approved `site` assets
- signed or protected access for `repairs`
- uploads validated for file type and size before storage

### Seeds

Seed at minimum:

- 8 watches
- 8 eyewear products
- homepage settings:
  - hero copy
  - pillar blocks
  - service highlights
  - trust points
  - store visit block
- store settings:
  - name
  - phone
  - email
  - WhatsApp
  - address
  - opening hours
  - map URL
- 3 journal draft or published starter posts

### Validation

Create Zod schemas for:

- catalog query params
- cart item payload
- checkout form
- repair request form
- repair tracking form
- contact form
- admin product editor
- admin order update
- admin repair update
- admin journal editor
- site settings update

### Code Generation

- Order code format: `BRL-O-YYYY-NNNNN`
- Repair code format: `BRL-R-YYYY-NNNNN`
- Generate codes server-side only.
- Ensure codes are unique with DB constraints and a retry-safe helper.

## Components

This phase should not create polished feature components, but it should define the data shapes used by:

- product cards
- product galleries
- checkout summary blocks
- repair timelines
- admin tables and detail panels

Also add reusable server-side mappers:

- `mapProductCard`
- `mapProductDetail`
- `mapOrderSummary`
- `mapRepairTrackingResult`
- `mapJournalListItem`

## Analytics

- Create typed payload shapes for each event.
- Add utilities to enrich events with product IDs, slugs, categories, and order codes.
- Prepare a server-safe way to emit `place_order` and `repair_request_submit` after successful writes.

## SEO

- Define the site settings keys that later phases will use for metadata defaults and contact structured data.
- Ensure products and journal posts store the minimum fields needed for page metadata and OG rendering.

## Acceptance

- All enums, tables, indexes, and constraints migrate successfully on an empty Supabase project.
- Seeds are idempotent and safe to run more than once.
- RLS allows public reads where intended and blocks anonymous writes to protected resources.
- Admin-authenticated reads and writes are possible through server-side helpers.
- Zod schemas cover every planned form and query surface in v1.
- Order and repair code helpers generate the agreed formats safely.
- Storage buckets and policies support the required public and protected asset flows.
- Derived customer data can be queried without a dedicated `customers` table.

## Deferred

- Audit log tables.
- Payment transaction tables for online providers.
- Full-text search indexing.
- Customer account tables and saved addresses.
