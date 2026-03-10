# Phase 06: Admin Operations

## Goal

Give BERIL staff the internal tools needed to run the business day to day: manage orders, manage repairs, maintain the catalog, monitor inbound contacts, and update core site content.

This phase turns the public-facing site into a real operating system for the store.

## In Scope

- Build admin authentication and route protection.
- Build admin dashboard overview.
- Build orders admin.
- Build repairs admin.
- Build products admin.
- Build customers admin as a derived read model.
- Build content admin for homepage, about, contact details, and store hours.
- Build settings admin for business-wide configuration.
- Build journal admin for create, edit, and publish workflows.

## Out Of Scope

- Multi-role permission differences in UI.
- Customer accounts.
- Deep CMS block builders.
- Full audit logging.
- Warehouse, purchasing, or supplier management.

## Routes

- `/login`
- `/reset-password`
- `/admin`
- `/admin/orders`
- `/admin/repairs`
- `/admin/products`
- `/admin/customers`
- `/admin/content`
- `/admin/settings`
- `/admin/journal`

## Data And Types

### Auth And Roles

- Use Supabase Auth for admin sign-in.
- Use `profiles.role` as the authorization source.
- Only `owner` is allowed to access the admin in v1.
- Route guards, server helpers, and UI role checks must be written so more roles can be activated later without refactoring every page.

### Admin Dashboard

Dashboard overview must show:

- orders by active status
- new repair requests
- low stock alerts
- recent contact inquiries
- recent journal drafts or scheduled content if available

### Orders Admin

Required behavior:

- list orders with search by order code, customer name, phone, and email
- filter by `order_status`
- open detail panel
- update order status
- edit `internal_notes`
- mark delivered or completed

Status transition guidance:

- `pending` -> `confirmed` or `cancelled`
- `confirmed` -> `preparing` or `cancelled`
- `preparing` -> `out_for_delivery` or `ready_for_pickup`
- `out_for_delivery` -> `delivered`
- `ready_for_pickup` -> `completed`
- `delivered` -> `completed`

Every status change must create an `order_status_history` row.

### Repairs Admin

Required behavior:

- list repair requests with search by repair code, customer, phone, brand, or model
- filter by `repair_status`
- open detail panel
- update status
- edit internal notes
- edit customer-visible notes
- upload staff attachments
- set estimated completion
- set optional amount due

Every status change must create a `repair_status_history` row.

When a new status note is customer-visible, set `visible_to_customer = true`.

### Products Admin

Required behavior:

- create, edit, and archive products
- upload and reorder product images
- edit product specs
- toggle `featured`
- toggle `is_new`
- edit `stock_status`
- edit `primary_cta_mode`

The admin product editor must support both watches and eyewear using one shared form with category-specific spec sections.

### Customers Admin

V1 rule:

- do not create a `customers` table
- build `/admin/customers` from a combined query over orders, repairs, and contacts

The screen should show:

- customer name
- latest email
- latest phone
- activity counts
- latest order
- latest repair
- latest contact inquiry

### Content Admin

Editable content in v1:

- homepage hero copy
- pillar blocks
- trust section
- store visit block
- about page content
- contact details
- opening hours

Store these as structured `site_settings` values rather than a free-form page builder.

### Settings Admin

Editable settings in v1:

- business name
- phone
- email
- WhatsApp number
- address
- map URL
- delivery fee
- default SEO fields

### Journal Admin

Required behavior:

- create posts
- edit posts
- upload cover image
- save drafts
- publish posts
- unpublish by reverting to draft or archive

## Components

- `DataTable`
- `StatusBadge`
- `OrderDetailsPanel`
- `RepairDetailsPanel`
- `ProductEditor`
- `RichTextEditor` simple
- `MediaUploader`
- `AdminStatCard`
- `AdminSearchBar`
- `AdminFilterBar`

Behavior rules:

- admin surfaces prioritize clarity and speed over decorative styling
- tables must work on smaller laptop widths and degrade acceptably on mobile
- detail panels should support quick status and note updates without excessive navigation
- use confirmation dialogs only for destructive or high-risk actions

## Analytics

- Admin pages do not need GA4-style marketing analytics in v1.
- Keep internal event logging minimal.
- Public events fired by admin actions are limited to side effects like contacting a customer; do not pollute public analytics with admin-only interactions.

## SEO

- Admin and auth routes should be `noindex`.
- Public metadata is not owned by this phase except where admins edit settings that later feed SEO fields.

## Acceptance

- Admin sign-in works with Supabase Auth and only `owner` can access admin pages.
- Protected routes cannot be accessed publicly.
- Dashboard shows meaningful operational summaries from real data.
- Orders can be searched, filtered, opened, updated, and annotated.
- Repairs can be searched, filtered, updated, and enriched with customer-visible notes and attachments.
- Products can be created and maintained through the admin instead of only seeds.
- Customers view works without a dedicated `customers` table.
- Core content and business settings can be updated without code changes.
- Journal posts can be drafted and published for use in the public journal phase.

## Deferred

- Role-specific permissions beyond `owner`.
- Fine-grained audit history.
- Bulk import and export tools.
- Advanced media library management.
