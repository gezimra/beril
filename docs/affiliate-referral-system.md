# Affiliate & Referral System

## Overview

Every registered user (customer or employee) is a potential affiliate. There is no separate partner portal — the affiliate dashboard lives inside the standard `/account` area, linked by email. The admin creates an affiliate record with the user's email; the user then sees the Referrals tab automatically when they log in.

---

## Architecture

### Identity linking

Affiliates are identified by email. `getAffiliateDashboardByEmail(email)` looks up the `affiliates` table using the authenticated user's session email. No separate auth system.

### Database tables

| Table | Purpose |
|---|---|
| `affiliates` | Core record: name, email, code (unique, uppercase), status, commission_rate |
| `affiliate_clicks` | Every visit via `?ref=CODE` — affiliate_id, source, landing_page, visitor_id |
| `affiliate_conversions` | One row per referred order — commission_amount, status (pending → approved → rejected) |
| `affiliate_payouts` | Disbursements — amount, status (pending/approved/paid/cancelled), reference |

### Commission flow

```
Order placed with ?ref=CODE cookie
        ↓
recordAffiliateConversion() — status: "pending"
        ↓
Admin approves in /admin/growth
        ↓
status: "approved" — now redeemable by the affiliate
        ↓
Affiliate clicks "Get coupon" in /account/affiliate
        ↓
generateAffiliateCouponFromCommission()
  - Creates a promotions record (fixed_amount, amount_off = redeemable balance)
  - Creates a coupon_codes record (usage_limit: 1, per_customer_limit: 1)
  - Creates an affiliate_payouts record (status: "paid", reference: "COUPON:{code}")
        ↓
Coupon appears in /account/discounts, usable at checkout
```

---

## Key files

| File | Role |
|---|---|
| `lib/db/growth-loyalty.ts` | All DB logic: `getAffiliateDashboardByEmail`, `generateAffiliateCouponFromCommission`, `findAffiliateByCode`, `recordAffiliateConversion`, `trackAffiliateClick` |
| `app/(public)/account/affiliate/page.tsx` | Customer-facing dashboard: stats, referral link, redeem button, payout history |
| `app/(public)/account/actions.ts` | `redeemAffiliateCommissionAction` server action |
| `components/account/account-nav.tsx` | Referrals nav item |
| `app/admin/growth/page.tsx` | Admin: create/manage affiliates, approve conversions, record payouts |
| `app/api/affiliate/click/route.ts` | POST endpoint that records a click and sets `beril_ref` cookie (30 days) |
| `components/analytics/affiliate-tracker.tsx` | Client component: detects `?ref=CODE` on page load, calls click API |

---

## Redeemable commission logic

```
redeemableCommission = approvedCommission - sum(payouts where status IN ('paid', 'approved'))
```

This prevents double-redemption. Each time a coupon is generated or a cash payout is recorded, `redeemableCommission` drops accordingly.

---

## Payout methods

### Store credit (coupon) — self-service
- Affiliate clicks "Get coupon" in their dashboard
- Generates a single-use `coupon_codes` record via `generateAffiliateCouponFromCommission()`
- Payout record reference is prefixed `COUPON:` so the dashboard labels it "Store Credit"
- Coupon appears immediately in `/account/discounts`

### Cash payout — admin-initiated
- Admin creates a payout in `/admin/growth` with status "paid" and a bank transfer reference
- Payout history in the affiliate dashboard shows this as "Paid" with the reference

---

## Adding a new affiliate

1. Go to `/admin/growth` → Affiliates section
2. Create record with the user's **exact email**, a unique code, commission rate, status: active
3. The user sees the Referrals tab on their next login — no further setup needed

---

## Referral link format

```
https://beril.store?ref={AFFILIATE_CODE}
```

The `AffiliateTracker` component detects the `ref` param on any page load, calls `/api/affiliate/click`, and sets a `beril_ref` cookie valid for 30 days. Orders placed within that window record a conversion.

---

## Coupon code format

```
AFF-{AFFILIATE_CODE}-{RANDOM6}
```

Example: `AFF-GEZIM-A3B7K2`

The random suffix is generated with `Math.random().toString(36).slice(2, 8).toUpperCase()`.
