BERIL Web Product Specification
1. Project overview

Build a premium website for BERIL, a retail and service business in Gjilan, Kosovo focused on:

watches

eyewear

repair/service

The site must support both brand presentation and commercial operations.

It should work as:

a premium brand website

a product catalog

an order capture/ecommerce system

a repair intake system

a repair tracking portal

an admin operating dashboard

The design must feel:

precise

premium

calm

trustworthy

modern European boutique

It must not feel:

generic ecommerce template

loud electronics shop

ornamental perfume brand

sterile medical optical site

2. Brand foundation
Brand name

BERIL

Brand sectors

Watches

Eyewear

Service / Repair

Brand personality

precise

refined

engineered

premium

understated

trustworthy

Core visual palette
Warm Ivory

#F4F0E8

Soft Stone

#D9D0C3

Walnut Brown

#6C4F3A

Deep Mineral Green

#2F4B44

Champagne Gold

#C39B62

Graphite

#2C2C2C

Color usage

base backgrounds: ivory / soft stone

text: graphite

warm accents: walnut

premium accents: champagne gold

secondary accent: mineral green

Gold should be used as an accent, not dominate every screen.

3. Recommended stack
Frontend

Next.js 15+ App Router

TypeScript

Tailwind CSS

shadcn/ui

Framer Motion

Lucide icons

React Hook Form

Zod

Backend / Database

Supabase Postgres

Supabase Auth

Supabase Storage

Row Level Security

Optional external integrations

Resend or Postmark for email

WhatsApp click links

Google Maps embed

GA4 analytics

Meta Pixel optional

future payment provider abstraction

4. Core business model in the site

The site must support full ecommerce architecture, but the initial payment methods used live are:

Cash on Delivery

Pay in Store on Pickup

The system must still be coded so online payments can be added later without changing the whole structure.

So the commerce model is:

browse products

add to cart

checkout

choose COD or pay in store

place order

admin confirms and fulfills

later support card/online payment using the same order model

5. Full route structure
Public routes

/

/watches

/eyewear

/service

/service/request

/repair-track

/cart

/checkout

/order-success

/products/[slug]

/about

/contact

/journal

/journal/[slug]

/privacy-policy

/terms

/cookies

Auth routes

/login

/reset-password

Admin routes

/admin

/admin/orders

/admin/repairs

/admin/products

/admin/customers

/admin/content

/admin/settings

/admin/journal

6. Navigation
Main nav

Home

Watches

Eyewear

Service

Track Repair

About

Contact

Optional:

Journal

Header actions

Search

Cart

WhatsApp

Book Service / Request Repair

7. Website goals by section
7.1 Homepage

The homepage must establish:

the BERIL identity

premium trust

product quality

service credibility

easy next action

Homepage sections
Hero

Content:

logo

headline

subheadline

2 CTAs

premium image/video

Suggested headline:
Precision in Time & Vision

Suggested subheadline:
Curated watches, refined eyewear, and trusted service in Gjilan.

Buttons:

Shop Watches

Request Repair

Brand pillars

3 blocks:

Watches

Eyewear

Service

Featured products

4–8 watches

4–8 eyewear products

Service highlight

battery replacement

strap changes

watch diagnostics

repairs

eyewear adjustments

Trust section

physical store

real repair service

curated selection

local delivery

pay on delivery / pickup

Store visit

address

map

hours

phone

WhatsApp

Social preview

Instagram preview / content grid

Footer

contact

links

legal

social

8. Watches catalog

Route: /watches

Purpose

Browse and filter watch products.

Filters

Brand

Price range

Movement

Strap/bracelet

Dial color

Case size

Availability

New arrivals

Sorting

newest

price low-high

price high-low

featured

Product card fields

image

brand

model name

movement badge

price

availability

CTA

Product badges

Automatic

Quartz

Eco-Drive

New

In Stock

Limited

Available on Request

9. Eyewear catalog

Route: /eyewear

Filters

Frames / Sunglasses

Brand

Shape

Material

Color

Gender / Unisex

Price range

Availability

Product card fields

image

brand

model

frame type

price

CTA

10. Product detail pages

Route: /products/[slug]

Shared product template for both watches and eyewear.

Main content block

product gallery

title

brand

category

price

stock status

CTA area

CTA logic

Depending on product:

Add to Cart

Reserve in Store

Inquire on WhatsApp

Request Availability

Watch spec fields

movement

case size

crystal

water resistance

strap/bracelet

dial color

case material

Eyewear spec fields

frame material

lens width

bridge width

temple length

shape

color

lens type if needed

Additional sections

description

care/service info

delivery/payment note

related products

11. Ecommerce requirements

This must be fully implemented now.

Cart

Route: /cart

Features

add/remove products

update quantity

persistent cart

subtotal

delivery estimate placeholder

CTA to checkout

Checkout

Route: /checkout

Checkout fields
Customer info

full name

phone

email optional

city

address

notes

Delivery method

Home Delivery

In-Store Pickup

Payment method

Cash on Delivery

Pay in Store on Pickup

Architecture must also support later:

online card

bank transfer

other digital payments

Order summary

items

subtotal

delivery fee

total

Submission

creates order

assigns order code

sends confirmation message

shows success screen

Order success

Route: /order-success

Show:

order code

summary

what happens next

payment note

delivery note

button to continue browsing

Suggested message:
Your order has been received. We will confirm availability and delivery by phone or email. Payment will be completed on delivery or on pickup.

12. Order status model

Orders must support:

Pending

Confirmed

Preparing

Out for Delivery

Ready for Pickup

Delivered

Completed

Cancelled

13. Service / repair system

Route: /service

This page must present BERIL as a trusted repair and maintenance destination.

Services list
Watches

Battery replacement

Strap replacement

Bracelet resizing

Diagnostics

Cleaning intake

Mechanical repair intake

Vintage assessment

Eyewear

Frame adjustment

Nose pad replacement

Screw tightening

Fitting and alignment

minor service work

Process section

Request service

Bring item or arrange drop-off

BERIL inspects the item

Status tracked online

Pickup or completion

CTAs

Start Repair Request

Track Repair

14. Repair request form

Route: /service/request

Fields
Customer

full name

phone

email

preferred contact method

Item

item type: watch / eyewear / other

brand

model

serial/reference optional

purchase date optional

Service type

battery

strap/bracelet

movement issue

crystal issue

polishing

full inspection

eyewear fitting

other

Issue description

Textarea

Uploads

images of item

images of damage

proof of purchase optional

Drop-off method

I will bring it to the store

I already dropped it off

Contact me first

Consent

privacy acceptance

service terms acceptance

Submission result

Create repair ticket with code like:
BRL-R-2025-00421

Send confirmation email / show on screen.

15. Repair tracking

Route: /repair-track

Inputs

repair code

email or phone verification

Output

A customer-facing status timeline.

Repair statuses

Request received

Awaiting drop-off

Received in store

Under inspection

Waiting parts

In repair

Ready for pickup

Completed

Cancelled

Show also

item type

brand/model

date received

estimated completion

customer-visible notes

amount due optional

16. Contact page

Route: /contact

Include

contact form

phone

email

WhatsApp

address

map

opening hours

CTAs

Call

WhatsApp

Get Directions

17. About page

Route: /about

Sections

who BERIL is

why watches + eyewear + service

expertise/trust story

store photos

values and approach

Tone should be human and specific, not corporate.

18. Journal

Route: /journal

Purpose

SEO, authority, trust.

Example topics

how to choose a watch

quartz vs automatic

when to replace a watch battery

basic eyewear care

watch maintenance tips

how to clean glasses properly

19. Admin dashboard

This is required, not optional.

Admin home

stats overview

new orders

new repair requests

low stock alerts

contact inquiries

Orders admin

Route: /admin/orders

Features

list/search orders

filter by status

open details

update status

add internal notes

mark delivered/completed

Repairs admin

Route: /admin/repairs

Features

list/search repair requests

filter by status

open details

update status

add customer-visible notes

upload attachments

set estimate

Products admin

Route: /admin/products

Features

create/edit/delete products

upload images

add specs

feature/unfeature

mark stock status

Content admin

Route: /admin/content

Features

edit homepage sections

about page content

contact details

store hours

Journal admin

Route: /admin/journal

Features

create/edit/publish posts

20. Database schema
products

id

slug

title

brand

category

subtype

short_description

description

price

currency

in_stock

quantity optional

featured

status

created_at

updated_at

product_images

id

product_id

url

alt

sort_order

product_specs

id

product_id

key

value

orders

id

order_code

customer_name

phone

email

city

address

notes

delivery_method

payment_method

order_status

subtotal

delivery_fee

total

created_at

updated_at

order_items

id

order_id

product_id

quantity

unit_price

total_price

order_status_history

id

order_id

status

note

created_at

repair_requests

id

repair_code

customer_name

email

phone

preferred_contact_method

item_type

brand

model

serial_number

service_type

description

status

estimated_completion

notes_internal

notes_customer

created_at

updated_at

repair_attachments

id

repair_request_id

file_url

file_type

repair_status_history

id

repair_request_id

status

note

created_at

visible_to_customer

contacts

id

name

email

phone

subject

message

created_at

journal_posts

id

slug

title

excerpt

content

cover_image

status

published_at

site_settings

id

key

value

21. Payment architecture

Even though live payment is COD / pay in store, the codebase must be designed with a generic payment model.

Payment methods supported now

cash_on_delivery

pay_in_store

Payment methods reserved for later

card_online

bank_transfer

Use enums and interfaces so adding a provider later does not require rewriting checkout.

22. Design system
Typography
Headings

Elegant serif:

Cormorant Garamond
or

Playfair Display
or similar

Body/UI

Inter
or

Geist

UI principles

generous whitespace

clean grids

subtle luxury

restrained motion

product-led visuals

23. Components list
Layout

Header

Footer

Section wrapper

Container

Mobile nav

Search drawer

Product

ProductCard

ProductGallery

ProductSpecs

ProductBadge

RelatedProducts

Commerce

CartItem

CartSummary

CheckoutForm

PaymentMethodSelector

DeliveryMethodSelector

OrderSuccessCard

Service

ServiceCard

RepairRequestForm

RepairTimeline

RepairStatusCard

Content

HeroSection

FeatureGrid

TestimonialCard

FAQAccordion

MapSection

StoreInfoCard

Admin

DataTable

StatusBadge

OrderDetailsPanel

RepairDetailsPanel

ProductEditor

RichTextEditor simple

MediaUploader

24. SEO
Each page needs

title

meta description

OG title

OG description

OG image

Structured data

LocalBusiness

Product

Breadcrumb

Article

Local SEO target phrases

watches gjilan

watch repair gjilan

eyewear gjilan

optical service gjilan

watch battery replacement kosovo

BERIL gjilan

25. Analytics

Track:

add_to_cart

begin_checkout

place_order

repair_request_submit

repair_track_search

click_whatsapp

click_call

map_click

product_view

26. Mobile requirements

Must be excellent on mobile for:

product browsing

cart

checkout

repair request

repair tracking

WhatsApp CTA

directions

27. Performance requirements

use next/image

optimize fonts

keep client components minimal

lazy load below fold

avoid heavy animations

target Lighthouse 90+

28. Accessibility

contrast-compliant

keyboard navigable

visible focus states

labeled forms

alt text everywhere

semantic headings

29. Copy style

Tone:

calm

premium

precise

not overhyped

Good:

trusted repair service

curated watches

refined eyewear

local delivery and store pickup

Avoid:

ultimate luxury

world-class excellence

flashy marketing clichés

30. Folder structure suggestion
app/
  page.tsx
  watches/page.tsx
  eyewear/page.tsx
  service/page.tsx
  service/request/page.tsx
  repair-track/page.tsx
  cart/page.tsx
  checkout/page.tsx
  order-success/page.tsx
  about/page.tsx
  contact/page.tsx
  journal/page.tsx
  journal/[slug]/page.tsx
  products/[slug]/page.tsx
  admin/page.tsx
  admin/orders/page.tsx
  admin/repairs/page.tsx
  admin/products/page.tsx
  admin/content/page.tsx
  admin/settings/page.tsx
components/
  layout/
  ui/
  product/
  commerce/
  service/
  content/
  admin/
lib/
  db/
  validations/
  utils/
  analytics/
types/
31. Order and service UX language
Checkout text

Payment methods:

Cash on Delivery

Pay in Store on Pickup

Note:
Payment is completed on delivery or when you collect your order in store.

Service text

Request Repair
Track Your Repair
Trusted service for watches and eyewear

32. Codex implementation priority

Build in this order:

design tokens and global layout

homepage

watches + eyewear catalog

product detail page

cart

checkout

order success

service page

repair request form

repair tracking

admin orders

admin repairs

about/contact

SEO/meta/journal

33. Final implementation objective

The final site should allow BERIL to operate as:

a premium local brand

a real product catalog

a real order-taking business

a real repair service business

a future-ready ecommerce store

without re-architecting later.