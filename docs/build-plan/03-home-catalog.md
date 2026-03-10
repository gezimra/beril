# Phase 03: Home And Catalog

## Goal

Deliver BERIL's public discovery experience so visitors immediately understand the brand and can browse watches and eyewear through a premium, fast, mobile-first catalog.

This phase should make BERIL feel credible and refined before cart or repair workflows are introduced.

## In Scope

- Build the homepage using seeded site settings and featured products.
- Build `/watches` with watch-specific filters and sorting.
- Build `/eyewear` with eyewear-specific filters and sorting.
- Build shared product list and product card components.
- Build homepage sections:
  - hero
  - brand pillars
  - featured watches
  - featured eyewear
  - service highlight
  - trust section
  - store visit section
  - social preview block
- Build responsive grid behavior and empty states.
- Build URL-driven filters with server-rendered initial state.
- Build a shared badge system for category and stock cues.

## Out Of Scope

- Product detail route.
- Cart and checkout.
- Real service intake and repair tracking.
- Admin CRUD.
- Public journal and contact page.

## Routes

- `/`
- `/watches`
- `/eyewear`

Rules:

- Catalog routes must read filter and sort state from URL query params.
- Filter changes should update the URL so links are shareable.
- First render should work without client-side hydration for core content.

## Data And Types

- Homepage reads from seeded `site_settings` keys and featured products from `products`.
- Catalog list queries must support:
  - `brand`
  - `price_min`
  - `price_max`
  - `availability`
  - `sort`
- Watch-specific filters:
  - `movement`
  - `strap`
  - `dial_color`
  - `case_size`
  - `new_arrivals`
- Eyewear-specific filters:
  - `frame_type`
  - `shape`
  - `material`
  - `color`
  - `gender`
- Sorting values:
  - `newest`
  - `price_asc`
  - `price_desc`
  - `featured`
- Product badge rules:
  - movement badges for watches: `Automatic`, `Quartz`, `Eco-Drive`
  - stock badges from `stock_status`
  - `New` badge from `is_new`

Implementation decisions:

- Filter values should come from normalized query param schemas and not from ad hoc string parsing.
- Watch spec and eyewear spec values used in filters should come from `product_specs`.
- The homepage featured products should come from `featured = true`, split by category.
- Social preview can ship as a curated static grid or placeholder content fed from `site_settings`; do not block the phase on a live Instagram integration.

## Components

- `HeroSection`
- `FeatureGrid`
- `ProductCard`
- `ProductBadge`
- `SectionWrapper`
- `StoreInfoCard`
- `MapSection`
- `CatalogToolbar`
- `CatalogFilterSheet`
- `CatalogSortSelect`
- `CatalogActiveFilters`
- `ProductGrid`
- `EmptyCatalogState`

Component behavior rules:

- `ProductCard` must show image, brand, model title, relevant secondary label, price, availability cue, and CTA affordance.
- `ProductBadge` must support both neutral and accent styles without feeling like a discount badge system.
- `CatalogFilterSheet` must work cleanly on mobile and desktop.
- Homepage sections must feel editorial, not like marketplace widgets.

## Analytics

- Track `click_whatsapp` and `click_call` if homepage contact actions are present.
- Prepare product card click context so later `product_view` events can include source route.
- Track map interactions with `map_click`.

## SEO

- Homepage title and description should establish BERIL as watches, eyewear, and trusted service in Gjilan.
- `/watches` and `/eyewear` need route-specific title and description targets for local intent.
- Add breadcrumb structured data for catalog routes once detail pages exist; in this phase, plain metadata is sufficient.
- Use locally relevant phrasing aligned with:
  - watches gjilan
  - eyewear gjilan
  - BERIL gjilan

## Acceptance

- Homepage renders from seeded content and featured products, not hardcoded page-only constants.
- Watches and eyewear pages load quickly and render meaningful content on first load.
- URL-driven filters work for both categories and preserve state on refresh and share.
- Product cards show the correct badges and CTA affordance per product data.
- Empty and no-result states are polished and informative.
- The entire discovery experience is responsive and strong on mobile.
- Homepage brand presentation feels calm, premium, and specific rather than generic.

## Deferred

- Live social integration.
- Full-text site search results.
- Product detail page interactions.
- Journal teasers that depend on public journal launch.
