# Phase 08: V2 Backlog

## Goal

Capture valuable post-launch work without letting it disrupt BERIL's v1 path.

Everything in this file is intentionally deferred. None of it is allowed to block phases 01 through 07.

## In Scope

- Online payments
- Bilingual routing and content
- Expanded staff roles and permission differences
- Richer CMS behavior
- Automated notifications
- Reservation deposits
- Customer accounts and history

## Out Of Scope

- Any change required to get the first BERIL launch live.

## Routes

Potential future routes or route changes:

- localized route variants when bilingual support is introduced
- customer account routes if accounts are added
- optional order tracking route if BERIL later wants a public order portal

## Data And Types

Backlog items to revisit after launch:

- payment transaction tables and webhook processing
- provider-specific payment abstractions
- expanded `profiles.role` enforcement for:
  - `manager`
  - `service_staff`
  - `editor`
- customer account tables
- saved carts or wishlists
- reservation deposit support
- richer structured content schemas for CMS blocks
- notification logs and templates

Specific deferred capabilities:

- `card_online` payment implementation
- `bank_transfer` payment implementation
- bilingual copy management and localized metadata
- appointment booking for service
- automated email or WhatsApp notifications at each order or repair milestone
- richer search and filter indexing

## Components

Likely future additions:

- payment provider UI
- account dashboard
- wishlist or saved items
- role-aware admin navigation
- visual CMS block editor

## Analytics

Future analytics work can include:

- funnel drop-off by checkout step
- journal engagement metrics
- audience segmentation
- remarketing pixels

These are secondary to the current required public event set.

## SEO

Future SEO work can include:

- bilingual metadata and route strategy
- expanded article taxonomy
- richer programmatic internal linking
- dedicated landing pages for service subcategories

## Acceptance

- This file is maintained as a backlog only.
- No item here is pulled into active implementation unless the launch phases are already complete or BERIL's priorities change.
- Any item promoted from this file must be moved into a new active phase plan or explicitly added to an existing phase with revised acceptance criteria.

## Deferred

- This entire file is deferred by design.
