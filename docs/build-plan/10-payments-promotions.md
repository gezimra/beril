# Phase 10: Payments And Promotions

## Goal

Enable real online payments and commercial control tools (campaigns, sales, coupons) without changing the core order model implemented in v1.

## In Scope

- Add online card payments to checkout using the existing generic payment architecture.
- Add payment transaction tracking, webhook handling, and refund support.
- Add campaign, sale, and coupon management in admin.
- Add pricing rule evaluation at checkout.
- Keep COD and pay-in-store active as fallback methods.

## Out Of Scope

- Affiliate payouts.
- Loyalty points.
- Full marketing automation journeys.
- Multi-currency pricing.

## Routes

- Existing:
  - `/checkout`
  - `/order-success`
  - `/admin/orders`
- New:
  - `/admin/campaigns`
  - `/admin/promotions`
  - `/admin/coupons`

## Data And Types

- Add payment tables:
  - `payment_transactions`
  - `payment_events`
  - `refund_transactions`
- Add promotion tables:
  - `campaigns`
  - `promotions`
  - `coupon_codes`
  - `coupon_redemptions`
- Extend order model usage of:
  - `orders.payment_status`
  - `orders.payment_provider`
  - `orders.payment_reference`
- Add typed interfaces for:
  - payment provider adapters
  - promotion eligibility
  - coupon validation results

## Components

- `PaymentMethodSelector` upgrade for `card_online`.
- `PromotionCodeInput`.
- `CampaignEditor`.
- `CouponEditor`.
- `PromotionRuleBuilder` (v1 simple rule UI).

## Analytics

- Add:
  - `payment_initiated`
  - `payment_succeeded`
  - `payment_failed`
  - `coupon_applied`
  - `campaign_view`
- Keep existing events unchanged.

## SEO

- Campaign landing pages must have unique metadata and canonical URLs.
- Avoid indexation of internal campaign preview URLs.

## Acceptance

- Online card payment flow works end to end in test and live mode.
- Failed payment can recover without creating duplicate orders.
- Webhooks update payment status reliably and idempotently.
- Coupons validate correctly for expiry, usage limit, and eligibility.
- Campaign scheduling toggles visibility automatically.
- Admin can create, edit, pause, and archive campaigns and coupons.

## Deferred

- BNPL providers.
- Subscription billing.
- Advanced promotion stacking logic.
