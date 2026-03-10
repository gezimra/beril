# Phase 04: Product And Commerce

## Goal

Turn BERIL from a discovery site into a real order-taking business by shipping product detail pages, a persistent cart, checkout, and order success flow.

This phase must support BERIL's real launch payment model while keeping the architecture ready for online payments later.

## In Scope

- Build product detail pages for watches and eyewear.
- Build product gallery, specs, related products, and care/payment information sections.
- Build cart with guest persistence.
- Build checkout with Albanian launch copy and EUR totals.
- Build delivery and payment selectors.
- Submit orders to Supabase through server-side actions or handlers.
- Create order status history on order creation.
- Build the order success page and summary flow.
- Enforce product availability rules for CTA behavior.

## Out Of Scope

- Online card or bank transfer processing.
- Customer accounts or saved carts synced to users.
- Order tracking route for customers.
- Coupon logic, discounts, or loyalty flows.

## Routes

- `/products/[slug]`
- `/cart`
- `/checkout`
- `/order-success`

## Data And Types

### Product Detail Data

Shared detail page fields:

- gallery images
- title
- brand
- category
- subtype
- price
- stock status
- short description
- long description
- care or service info
- delivery and payment note
- related products

Watch specs to surface when present:

- movement
- case size
- crystal
- water resistance
- strap or bracelet
- dial color
- case material

Eyewear specs to surface when present:

- frame material
- lens width
- bridge width
- temple length
- shape
- color
- lens type

### CTA Logic

Use `primary_cta_mode` and `stock_status` together to determine the primary action:

- `add_to_cart`
  - allowed only when `stock_status` is `in_stock` or `limited`
- `reserve_in_store`
  - allowed when item is active but not directly purchasable online
- `whatsapp_inquiry`
  - allowed for high-touch or request-led items
- `request_availability`
  - allowed when `stock_status` is `available_on_request`

Fallback rules:

- if a product is `out_of_stock`, disable direct order actions and surface inquiry or availability messaging
- a product must never show `Add to Cart` if it cannot be fulfilled through the current order model

### Cart

Cart model:

- local-storage backed for guests
- product ID, slug, title snapshot, price snapshot, image, quantity, stock status, category
- quantity updates validated against availability rules

Rules:

- cart persists across refresh
- invalid or archived products are revalidated at checkout
- if a product changes price after being added, checkout uses fresh server-side pricing and shows the updated total

### Checkout

Checkout fields:

- full name
- phone
- email optional
- city
- address
- notes
- delivery method
- payment method

Delivery methods:

- `home_delivery`
- `store_pickup`

Payment methods enabled in UI:

- `cash_on_delivery`
- `pay_in_store`

Reserved in code only:

- `card_online`
- `bank_transfer`

Rules:

- `cash_on_delivery` is only allowed with `home_delivery`
- `pay_in_store` is only allowed with `store_pickup`
- if the customer changes delivery method, invalid payment methods must be reset automatically
- delivery fee should be configurable through `site_settings`
- default delivery fee behavior:
  - home delivery reads a numeric fee from settings
  - store pickup uses `0`

### Order Creation

Server-side submission must:

1. re-read all product data by ID
2. validate availability and current price
3. compute subtotal, delivery fee, and total
4. create `orders`
5. create `order_items`
6. create initial `order_status_history` with `pending`
7. emit confirmation side effects only after DB success

Order success state:

- order code
- customer summary
- item summary
- payment note
- delivery note

## Components

- `ProductGallery`
- `ProductSpecs`
- `RelatedProducts`
- `CartItem`
- `CartSummary`
- `CheckoutForm`
- `PaymentMethodSelector`
- `DeliveryMethodSelector`
- `OrderSuccessCard`

Behavior rules:

- `ProductGallery` should prioritize crisp image viewing on mobile and desktop.
- `CartSummary` must be reusable on cart and checkout.
- `CheckoutForm` must use React Hook Form plus Zod validation.
- Order success UI should be reassuring and operationally clear, not celebratory or flashy.

## Analytics

Implement the following events in this phase:

- `product_view`
- `add_to_cart`
- `begin_checkout`
- `place_order`
- `click_whatsapp` where inquiry CTA is used

Event payloads should include when relevant:

- product ID
- slug
- category
- price
- quantity
- order code
- payment method
- delivery method

## SEO

- Product detail pages require route-specific title, description, OG metadata, and product structured data.
- Include breadcrumb metadata on product detail pages.
- Cart, checkout, and order success should have noindex metadata.
- Product descriptions should maintain BERIL's calm and precise tone.

## Acceptance

- Product detail pages render correctly for both watches and eyewear from shared infrastructure.
- CTA behavior respects product configuration and stock status.
- Users can add, remove, and update items in the cart with persistence across refreshes.
- Checkout validates correctly and blocks incompatible delivery and payment combinations.
- Orders write `orders`, `order_items`, and `order_status_history` together after server-side revalidation.
- The success page displays a real generated order code and the correct summary.
- Offline payment messaging is clear and matches BERIL's operating model.
- Commerce flows are smooth on mobile, especially cart and checkout.

## Deferred

- Digital payments and payment provider webhooks.
- Discount codes.
- Customer account order history.
- Shipping zones beyond one configurable local delivery fee.
