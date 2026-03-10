# Phase 01: Foundation

## Goal

Set up the BERIL application shell and design system so every later phase builds on a stable visual and technical base.

The exit condition for this phase is a working Next.js app with BERIL's global layout, typography, color tokens, metadata defaults, analytics plumbing, and environment wiring ready for real data and feature routes.

## In Scope

- Bootstrap the Next.js 15 App Router project with TypeScript and `pnpm`.
- Install and configure Tailwind CSS, shadcn/ui primitives, Framer Motion, Lucide, React Hook Form, Zod, Supabase client libraries, and class utilities.
- Establish folder structure:
  - `app/`
  - `components/layout/`
  - `components/ui/`
  - `components/content/`
  - `components/product/`
  - `components/commerce/`
  - `components/service/`
  - `components/admin/`
  - `lib/db/`
  - `lib/validations/`
  - `lib/utils/`
  - `lib/analytics/`
  - `types/`
- Implement display font as `Cormorant Garamond` and body/UI font as `Geist`.
- Define CSS variables and Tailwind theme tokens for:
  - `--color-ivory: #F4F0E8`
  - `--color-stone: #D9D0C3`
  - `--color-walnut: #6C4F3A`
  - `--color-mineral: #2F4B44`
  - `--color-gold: #C39B62`
  - `--color-graphite: #2C2C2C`
- Create the root layout and shared shell:
  - Header
  - Footer
  - Section wrapper
  - Container
  - Mobile nav
  - Search drawer shell
- Create a shared motion policy:
  - small entrance animations only
  - no autoplay-heavy hero motion
  - no large parallax or decorative transitions
- Create sitewide metadata defaults:
  - title template
  - default description
  - default OG image placeholder
  - metadata base URL
- Create analytics abstraction with typed event names and no-op behavior when analytics env vars are absent.
- Add Supabase client/server utility scaffolding and env validation utilities.
- Add shared route group strategy for public and admin surfaces.
- Add base error boundaries, `not-found`, loading states, and an accessible skip link.

## Out Of Scope

- Real database schema and migrations.
- Product data fetching.
- Homepage content implementation.
- Catalog filters and product detail logic.
- Cart, checkout, repair flows, and admin CRUD.
- Journal, legal pages, and launch performance tuning.

## Routes

This phase does not own feature route delivery.

It applies the shared shell, metadata, and route boundaries needed by all later routes:

- public layout for customer-facing pages
- admin layout shell placeholder with protection hooks
- auth route shell placeholder for `/login` and `/reset-password`
- shared loading and error UI for route segments

## Data And Types

- Define base TypeScript enums and literal types only, without full DB coupling yet:
  - `ProductCategory`
  - `ProductSubtype`
  - `StockStatus`
  - `OrderStatus`
  - `PaymentMethod`
  - `PaymentStatus`
  - `DeliveryMethod`
  - `RepairStatus`
  - `JournalStatus`
  - `UserRole`
  - `PreferredContactMethod`
- Define shared utility types:
  - `Money`
  - `NavItem`
  - `SeoMeta`
  - `AnalyticsEventName`
- Define a central env schema for client and server variables.
- Define a site settings read contract so later phases can fetch store identity and contact data from one place.

## Components

- `Header`
- `Footer`
- `Container`
- `SectionWrapper`
- `MobileNav`
- `SearchDrawer` shell
- `BrandMark` or logo wrapper
- `PageIntro` utility for later route sections
- `WhatsappButton` shell
- `CallToActionButton` variants
- shared form field wrappers for labels, help text, and errors
- shared empty state, loading state, and status badge primitives

Design direction for all components:

- warm ivory and soft stone backgrounds
- graphite text
- walnut for warm interaction surfaces
- champagne gold as a small accent, mostly borders and fine details
- mineral green used sparingly for trust and service cues
- generous whitespace and refined serif headings

## Analytics

Create an event contract and dispatcher for these events, even if some will not fire until later phases:

- `add_to_cart`
- `begin_checkout`
- `place_order`
- `repair_request_submit`
- `repair_track_search`
- `click_whatsapp`
- `click_call`
- `map_click`
- `product_view`

Implementation rules:

- event payloads must be typed
- analytics calls must be isolated behind one helper
- pages must not fail when analytics is disabled

## SEO

- Configure global metadata defaults for BERIL.
- Create title patterns for public, admin, and auth sections.
- Reserve default OG image handling and favicon/app icon assets.
- Establish structured data helper utilities, but do not output route-specific JSON-LD yet.

## Acceptance

- App boots with Next.js 15 App Router and the agreed dependency stack.
- Global layout is responsive and visually aligned with BERIL's palette and typography.
- Header, footer, mobile nav, and search drawer shell render and behave correctly.
- All pages inherit metadata defaults.
- Analytics wrapper exists with typed events and safe no-op behavior.
- Supabase env utilities and client/server helper scaffolding are in place.
- Focus styles, labels, skip link, and semantic layout landmarks are present.
- No admin route content is publicly accessible by default.

## Deferred

- Final search behavior and product search indexing.
- Route-specific structured data.
- Detailed animation choreography.
- Final header content population from live settings.
