# Phase 05: Service And Repairs

## Goal

Deliver BERIL's service business online by shipping the repair landing page, repair request intake, and secure public repair tracking.

This phase is as important as commerce because BERIL is not only a store. It is also a trusted service destination.

## In Scope

- Build the `/service` landing page.
- Build the repair request form on `/service/request`.
- Support repair image uploads and proof-of-purchase uploads.
- Build the repair tracking form and customer status timeline on `/repair-track`.
- Create repair requests and repair status history records.
- Send or prepare a confirmation message after submission.
- Surface customer-visible notes, estimated completion, and optional amount due.

## Out Of Scope

- Repair payment collection.
- Appointment scheduling.
- Live chat or live repair estimate generation.
- Full service knowledge base.

## Routes

- `/service`
- `/service/request`
- `/repair-track`

## Data And Types

### Service Page

Content sections:

- service intro
- watch services list
- eyewear services list
- process section
- trust cues
- CTA band for request and tracking

The page should read its editable copy from `site_settings` where practical, but can launch with seeded structured content.

### Repair Request Form

Fields:

- full name
- phone
- email
- preferred contact method
- item type
- brand
- model
- serial or reference optional
- purchase date optional
- service type
- issue description
- drop-off method
- privacy consent
- service terms consent
- uploads:
  - item images
  - damage images
  - proof of purchase optional

Validation rules:

- full name, phone, item type, service type, issue description, preferred contact method, drop-off method, and both consent fields are required
- email becomes required only if preferred contact method is `email`
- at least one item or damage image is recommended, but not mandatory
- allowed uploads must be constrained by size and MIME type

Submission side effects:

1. normalize phone and email
2. create `repair_requests`
3. create initial `repair_status_history` entry with `request_received`
4. if `drop_off_method` is `bring_to_store`, add a second status entry of `awaiting_drop_off`
5. upload attachments and create `repair_attachments`
6. trigger confirmation message or queue it for later delivery

### Repair Tracking

Inputs:

- repair code
- email or phone verification

Verification rule:

- fetch by `repair_code`
- compare normalized input against either `email_normalized` or `phone_normalized`
- return no sensitive data on mismatch

Customer response payload:

- repair code
- item type
- brand
- model
- date received
- current status
- estimated completion
- amount due
- customer-visible notes
- timeline from `repair_status_history` where `visible_to_customer = true`

Status order:

1. `request_received`
2. `awaiting_drop_off`
3. `received_in_store`
4. `under_inspection`
5. `waiting_parts`
6. `in_repair`
7. `ready_for_pickup`
8. `completed`
9. `cancelled`

## Components

- `ServiceCard`
- `RepairRequestForm`
- `RepairTimeline`
- `RepairStatusCard`
- `MapSection` if reused from earlier phases
- `StoreInfoCard` if reused from earlier phases

Behavior rules:

- The service landing page must feel reassuring and specific, not like a generic support page.
- The repair form must be optimized for mobile camera uploads.
- Timeline UI must clearly distinguish current status from completed steps.
- Customer-facing notes must be visibly separate from internal staff context.

## Analytics

Implement:

- `repair_request_submit`
- `repair_track_search`
- `click_whatsapp`
- `click_call`

Recommended payload fields:

- repair code for successful creation only
- service type
- item type
- preferred contact method
- route source

## SEO

- `/service` should target service credibility and local search intent.
- `/service/request` and `/repair-track` can use transactional metadata and should not target broad organic keywords.
- Use local SEO phrasing aligned with:
  - watch repair gjilan
  - optical service gjilan
  - watch battery replacement kosovo
- Add LocalBusiness structured data later in phase 07, but keep metadata fields ready now.

## Acceptance

- The service page clearly communicates BERIL's watch and eyewear service offering.
- Repair requests can be submitted successfully with attachments and consents.
- Repair codes are generated in the agreed `BRL-R-YYYY-NNNNN` format.
- Initial repair status history is created correctly on submission.
- Tracking requires both repair code and matching phone or email verification.
- Tracking results expose only customer-safe fields and notes.
- Mobile UX is strong for the entire repair flow, especially uploads and tracking search.

## Deferred

- Scheduled pickup and delivery for repairs.
- Automated status notifications at every repair milestone.
- Repair quote approval workflows.
- Customer self-service cancellation or rescheduling.
