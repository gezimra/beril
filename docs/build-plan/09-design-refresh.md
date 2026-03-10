# Phase 09: Design Refresh

## Goal

Refresh BERIL's visual layer across public storefront routes while preserving all existing commerce, repair, and admin behavior from phases 01-07.

Current status: `deferred` until design direction is finalized.

## In Scope

- Refine visual system tokens for spacing, surface depth, and rhythm.
- Rebalance homepage composition for stronger premium identity.
- Improve mobile-first polish for navigation, hero, and product cards.
- Normalize section spacing and card density across catalog and PDP routes.
- Keep interactions and existing data contracts unchanged.

## Out Of Scope

- Database schema changes.
- Checkout, order, or repair business-logic changes.
- New admin features.
- Payment provider integration.

## Routes

- `/`
- `/watches`
- `/eyewear`
- `/products/[slug]`
- Shared layout and navigation components used by public routes.

## Data And Types

- No schema migrations in this phase.
- Existing domain models remain unchanged.
- Any visual preferences that need to be editor-managed later should be tracked for a future `site_settings` extension.

## Components

- `Header`
- `MobileNav`
- `SearchDrawer`
- `ProductCard`
- shared section and surface primitives from global styles

## Analytics

- Keep all current event names and payload shapes unchanged.
- Validate that UI changes do not remove tracked click points.

## SEO

- Preserve all existing metadata and structured data behavior.
- Design-only work must not alter canonical paths or indexing intent.

## Acceptance

- Mobile menu is fully usable on real devices and emulators.
- Product cards are visually balanced in 2-column mobile grids.
- Homepage and catalog sections keep a consistent premium rhythm.
- No regression in cart, checkout, repair, or admin flows.
- `pnpm lint` and `pnpm build` pass after each design milestone.

## Deferred

- This phase is fully deferred for now and does not block launch completion.
- Full brand reboot with new art direction assets.
- Multi-theme support.
- Animated storytelling sections requiring new media production.
