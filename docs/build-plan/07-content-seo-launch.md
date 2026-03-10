# Phase 07: Content, SEO, And Launch

## Goal

Complete BERIL's brand and discoverability layer with public content pages, journal publishing, structured metadata, analytics completion, accessibility review, performance tuning, and launch readiness.

This phase closes the loop between a functioning business system and a polished public brand presence.

## In Scope

- Build the About page.
- Build the Contact page and contact form.
- Build public journal list and detail pages.
- Build legal pages: privacy policy, terms, cookies.
- Complete metadata and structured data across public routes.
- Complete GA4 event coverage for all required public interactions.
- Run final accessibility and performance passes.
- Produce a launch checklist covering content, assets, envs, and QA.

## Out Of Scope

- Multilingual content routing.
- Marketing automation flows.
- Advanced editorial workflows like scheduled publishing.
- Customer account or loyalty content.

## Routes

- `/about`
- `/contact`
- `/journal`
- `/journal/[slug]`
- `/privacy-policy`
- `/terms`
- `/cookies`

## Data And Types

### About Page

Required sections:

- who BERIL is
- why watches, eyewear, and service belong together
- expertise and trust story
- store photos
- values and approach

Content source:

- structured `site_settings` fields for editable copy and images

### Contact Page

Required sections:

- contact form
- phone
- email
- WhatsApp
- address
- map
- opening hours

Contact form writes to `contacts`.

Validation:

- name, email, phone, subject, and message required

### Journal Public

Rules:

- `/journal` lists only `published` posts ordered by `published_at` descending
- `/journal/[slug]` serves only published posts
- draft or archived posts must return not found publicly
- excerpt and cover image should be present for list cards and metadata

### Legal Content

V1 decision:

- legal pages can ship as static route content in code
- they are not editable in admin for launch

### Structured Data

Add helpers and output for:

- `LocalBusiness`
- `Product`
- `BreadcrumbList`
- `Article`

Route ownership:

- homepage and contact: `LocalBusiness`
- product detail: `Product` and `BreadcrumbList`
- journal detail: `Article` and `BreadcrumbList`
- catalog and content pages: breadcrumb where useful

## Components

- `MapSection`
- `StoreInfoCard`
- `TestimonialCard` only if genuine content exists, otherwise skip
- `FAQAccordion` only if genuine service or contact FAQs exist, otherwise skip
- `JournalCard`
- `ArticleHero`
- `ArticleBody`
- `ContactForm`

Content rules:

- tone stays calm, premium, and specific
- avoid inflated luxury language
- use real store and product photography wherever available
- do not add filler testimonials or FAQs without real content

## Analytics

Complete required public event coverage:

- `add_to_cart`
- `begin_checkout`
- `place_order`
- `repair_request_submit`
- `repair_track_search`
- `click_whatsapp`
- `click_call`
- `map_click`
- `product_view`

Phase-specific implementation:

- `click_call` on contact and service actions
- `click_whatsapp` on all prominent WhatsApp CTAs
- `map_click` on directions and map interactions

## SEO

Implement per-page:

- title
- meta description
- OG title
- OG description
- OG image

Target local phrases naturally through copy and metadata:

- watches gjilan
- watch repair gjilan
- eyewear gjilan
- optical service gjilan
- watch battery replacement kosovo
- BERIL gjilan

Launch SEO rules:

- keep metadata concise and non-spammy
- noindex transactional routes and admin/auth routes
- ensure canonical URLs are set from `NEXT_PUBLIC_SITE_URL`

## Acceptance

- About and Contact pages feel human, trustworthy, and brand-specific.
- Contact form submissions persist correctly.
- Journal list and article pages publish only approved content.
- Legal pages are present and linked in the footer.
- Structured data renders correctly on relevant public pages.
- All required analytics events are implemented on public journeys.
- Public pages meet accessibility expectations for forms, navigation, and semantic structure.
- Key pages achieve the performance target direction and avoid heavy client-side bloat.
- Launch checklist is complete for production deployment.

## Deferred

- Full bilingual SEO strategy.
- Editorial scheduling and author profiles.
- Automated review request campaigns.
- Rich FAQ or testimonial systems without real source material.
