# Phase 11: CRM, Support, And Automation

## Goal

Create a unified customer operations layer combining customer history, support interactions, and automated communication for orders and repairs.

## In Scope

- Build a customer 360 profile in admin.
- Add support inbox with live chat and manual messaging workflows.
- Add notification automation for order and repair milestones.
- Add abandoned cart and back-in-stock messaging flows.
- Add follow-up reminders for service intervals.

## Out Of Scope

- Full customer self-service portal redesign.
- AI agent automation for support.
- Multi-language messaging templates.

## Routes

- Existing:
  - `/admin/customers`
  - `/admin/orders`
  - `/admin/repairs`
- New:
  - `/admin/customers/[id]`
  - `/admin/support`
  - `/admin/automations`
  - `/admin/templates`

## Data And Types

- Add CRM tables:
  - `customer_profiles`
  - `customer_tags`
  - `customer_activity_timeline`
- Add support tables:
  - `support_threads`
  - `support_messages`
  - `support_thread_links` (order, repair, customer references)
- Add automation tables:
  - `notification_templates`
  - `notification_jobs`
  - `notification_logs`
- Add typed enums:
  - `SupportChannel`
  - `ThreadStatus`
  - `AutomationTrigger`
  - `NotificationStatus`

## Components

- `CustomerProfilePanel`.
- `CustomerTimeline`.
- `SupportInbox`.
- `ThreadComposer`.
- `AutomationRuleEditor`.
- `TemplateEditor`.

## Analytics

- Add:
  - `support_thread_opened`
  - `support_message_sent`
  - `automation_triggered`
  - `notification_delivered`
  - `notification_failed`

## SEO

- No public SEO additions required.
- If a public support entry route is added later, it must be `noindex`.

## Acceptance

- Admin sees one customer view with orders, repairs, contacts, and notes.
- Support threads can be linked to customer, order, and repair records.
- Live chat workflow supports assignment, status changes, and response tracking.
- Automation jobs run with retry and failure logging.
- Order and repair milestone notifications are configurable and traceable.

## Deferred

- AI-generated replies.
- Full omnichannel inbox (email, WhatsApp, Instagram, web chat) in one thread.
- Predictive churn scoring.
