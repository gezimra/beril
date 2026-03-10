# BERIL Build Plan

## Purpose

This directory is the execution guide for building BERIL without trying to ship every part of the product at once.

It translates `/Users/gezimrashiti/Projects/Beril/CONCEPT.md` into a fixed delivery sequence, phase gates, and implementation decisions that can be followed step by step.

## How To Use This Plan

1. Work phases in order.
2. Do not start a later phase until the current phase acceptance gate is satisfied.
3. When a phase starts, update its status here from `not started` to `in progress`.
4. When a phase ships and passes its gate, update its status to `done`.
5. Anything intentionally pushed back belongs in `08-v2-backlog.md`, not inside active phases.

## Document Map

| File | Purpose |
| --- | --- |
| `01-foundation.md` | Repo bootstrap, global shell, design system, analytics wrapper, environment setup |
| `02-data-domain.md` | Database schema, RLS, storage, seed data, validation, server-side domain helpers |
| `03-home-catalog.md` | Homepage and catalog browsing for watches and eyewear |
| `04-product-commerce.md` | Product detail, cart, checkout, order submission, order success |
| `05-service-repairs.md` | Service page, repair request, repair tracking |
| `06-admin-operations.md` | Auth, admin dashboard, orders, repairs, products, customers, content, settings, journal admin |
| `07-content-seo-launch.md` | About, contact, journal public routes, legal pages, structured data, launch hardening |
| `08-v2-backlog.md` | Deferred features that must not block launch |

## Locked Decisions

- Stack: Next.js 15 App Router, TypeScript, Tailwind CSS, shadcn/ui, Framer Motion, React Hook Form, Zod.
- Backend: Supabase Postgres, Supabase Auth, Supabase Storage, Row Level Security.
- Launch language: Albanian.
- Launch currency: EUR.
- Customer accounts: out of scope for v1.
- Admin access: only `owner` is active in v1, but the role model is future-ready.
- Product management: seed catalog first, admin CRUD later.
- Payment methods in v1: `cash_on_delivery`, `pay_in_store`.
- Payment architecture reserves `card_online` and `bank_transfer` without implementing them in v1.
- Public writes happen through trusted server-side actions or route handlers, not directly from anonymous clients.
- Customer-facing routes stay non-localized in v1 even though copy is Albanian.

## Execution Rules

- Prefer server components by default.
- Keep client components limited to filters, cart state, forms, upload UX, and interactive admin panels.
- Use typed domain enums in both app code and database schema.
- Keep motion restrained and purposeful.
- Treat the build as one product with three core flows:
  - discovery and catalog
  - order capture
  - repair intake and tracking
- Do not let journal, animation polish, or CMS flexibility block the revenue and operations flows.

## Environment Checklist

- Node.js 22 LTS installed locally.
- `pnpm` used as the package manager.
- Vercel project created for deployment.
- Supabase project created with:
  - Postgres database
  - Auth enabled for admin users
  - Storage buckets for `products`, `repairs`, `journal`, and `site`
- Environment variables defined for:
  - `NEXT_PUBLIC_SITE_URL`
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `SUPABASE_DB_URL`
  - `GA_MEASUREMENT_ID`
  - `RESEND_API_KEY` or `POSTMARK_SERVER_TOKEN` when email is enabled
- Store data collected before launch:
  - business name, phone, email, WhatsApp number
  - full address
  - opening hours
  - Google Maps embed or destination link
  - product imagery
  - store imagery

## Phase Status

| Phase | Status | Dependency |
| --- | --- | --- |
| 01 Foundation | `done` | none |
| 02 Data and Domain | `done` | 01 |
| 03 Home and Catalog | `done` | 01, 02 |
| 04 Product and Commerce | `in progress` | 02, 03 |
| 05 Service and Repairs | `in progress` | 02, 03 |
| 06 Admin Operations | `not started` | 02, 04, 05 |
| 07 Content, SEO, Launch | `not started` | 03, 04, 05, 06 |
| 08 V2 Backlog | `deferred` | after launch |

## Definition Of Done

A phase is only `done` when all of the following are true:

- Its required routes work on desktop and mobile.
- Empty states, loading states, and error states are covered.
- Validation is implemented for every public or admin form in the phase.
- Required analytics events for the phase are wired.
- Page metadata requirements for the phase are complete.
- Accessibility basics are covered: focus states, labels, semantic headings, keyboard navigation.
- No placeholder data remains unless the phase explicitly allows seeded content.
- The phase acceptance checklist in its own markdown file is fully satisfied.

## Coverage Matrix: Routes

| Route | Phase |
| --- | --- |
| `/` | 03 |
| `/watches` | 03 |
| `/eyewear` | 03 |
| `/products/[slug]` | 04 |
| `/cart` | 04 |
| `/checkout` | 04 |
| `/order-success` | 04 |
| `/service` | 05 |
| `/service/request` | 05 |
| `/repair-track` | 05 |
| `/login` | 06 |
| `/reset-password` | 06 |
| `/admin` | 06 |
| `/admin/orders` | 06 |
| `/admin/repairs` | 06 |
| `/admin/products` | 06 |
| `/admin/customers` | 06 |
| `/admin/content` | 06 |
| `/admin/settings` | 06 |
| `/admin/journal` | 06 |
| `/about` | 07 |
| `/contact` | 07 |
| `/journal` | 07 |
| `/journal/[slug]` | 07 |
| `/privacy-policy` | 07 |
| `/terms` | 07 |
| `/cookies` | 07 |

## Coverage Matrix: Database And Storage

| Resource | Phase |
| --- | --- |
| `profiles` | 02 |
| `products` | 02 |
| `product_images` | 02 |
| `product_specs` | 02 |
| `orders` | 02 |
| `order_items` | 02 |
| `order_status_history` | 02 |
| `repair_requests` | 02 |
| `repair_attachments` | 02 |
| `repair_status_history` | 02 |
| `contacts` | 02 |
| `journal_posts` | 02 |
| `site_settings` | 02 |
| Storage bucket `products` | 02 |
| Storage bucket `repairs` | 02 |
| Storage bucket `journal` | 02 |
| Storage bucket `site` | 02 |

## Coverage Matrix: Major Features

| Feature | Phase |
| --- | --- |
| App shell, header, footer, mobile nav | 01 |
| Design tokens, font system, color variables | 01 |
| Supabase environment wiring | 01 |
| Analytics wrapper and event contract | 01 |
| SQL schema, RLS, storage rules, seeds | 02 |
| Shared enums, Zod schemas, domain helpers | 02 |
| Homepage hero, pillars, featured blocks, trust, store section | 03 |
| Watches catalog filters and sorting | 03 |
| Eyewear catalog filters and sorting | 03 |
| Shared product cards and badges | 03 |
| Product detail page | 04 |
| Cart persistence and cart UI | 04 |
| Checkout and order creation | 04 |
| Offline payment method selection | 04 |
| Order success flow | 04 |
| Service landing page | 05 |
| Repair request form and uploads | 05 |
| Repair tracking portal | 05 |
| Owner auth and route protection | 06 |
| Admin dashboard overview | 06 |
| Orders admin | 06 |
| Repairs admin | 06 |
| Products admin | 06 |
| Customers admin | 06 |
| Content admin | 06 |
| Settings admin | 06 |
| Journal admin | 06 |
| About page | 07 |
| Contact page and contact form | 07 |
| Journal public pages | 07 |
| Legal pages | 07 |
| Metadata, structured data, local SEO | 07 |
| Accessibility pass and performance pass | 07 |
| Online payments | 08 |
| Bilingual routing | 08 |
| Expanded staff roles | 08 |
| Richer CMS and customer accounts | 08 |

## Risks To Control

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Treating BERIL as a generic storefront | Dilutes brand and trust | Lock typography, palette, spacing, and restrained motion in phase 01 |
| Building UI before the domain model | Rework in checkout and repairs | Finish schema, enums, validation, and server helpers in phase 02 before feature routes |
| Letting admin scope expand too early | Slows launch-critical public flows | Admin CRUD begins only after catalog, checkout, and repair intake exist |
| Adding multilingual support in v1 | Multiplies content and routing work | Keep Albanian-only launch and defer full i18n to phase 08 |
| Overusing gold or motion | Brand feels loud or generic | Treat gold as accent only and motion as minimal |
| Weak repair verification | Privacy leak in tracking portal | Require repair code plus normalized phone or email match |
| Modeling customers as a standalone table too early | Unnecessary complexity | Build `/admin/customers` as a derived view in v1 |

## Phase Gates Summary

- Phase 01: responsive shell, tokens and fonts in place, metadata defaults set, admin routes not public.
- Phase 02: migrations and seeds succeed from empty state, RLS protects writes, shared schemas validate.
- Phase 03: homepage and catalogs render from real data, URL filters work, product badges are correct.
- Phase 04: cart persists, checkout validates Albanian flow, order and history rows are created atomically.
- Phase 05: repair requests store uploads and status history, tracking verification works, customer-safe notes only.
- Phase 06: owner auth protects admin, order and repair statuses update correctly, product CRUD is active.
- Phase 07: content routes are complete, structured data is present, analytics is complete, launch checklist passes.

## Review Cadence

- Before starting a phase: read that phase file and confirm dependencies are already `done`.
- During a phase: keep a short implementation checklist in the relevant file or task tracker.
- After a phase: verify the acceptance section manually and through tests before moving to the next file.
