# Phase 13: Growth, Loyalty, And Affiliate

## Goal

Add sustainable growth systems for repeat revenue, referrals, and partner acquisition once core operations are stable.

## In Scope

- Add loyalty program for repeat customers.
- Add referral tracking and rewards.
- Add affiliate onboarding, tracking, and payout workflow.
- Add post-purchase upsell and cross-sell campaigns.
- Add growth dashboards and attribution reporting.

## Out Of Scope

- Enterprise partner contracts.
- External ad platform bid automation.
- Complex commission tax logic by country.

## Routes

- Existing:
  - `/journal`
  - `/products/[slug]`
  - `/checkout`
- New:
  - `/account`
  - `/account/rewards`
  - `/account/referrals`
  - `/affiliate`
  - `/affiliate/dashboard`
  - `/admin/affiliates`
  - `/admin/loyalty`

## Data And Types

- Add loyalty tables:
  - `loyalty_accounts`
  - `loyalty_ledger`
  - `loyalty_rules`
- Add referral and affiliate tables:
  - `referral_codes`
  - `referral_rewards`
  - `affiliates`
  - `affiliate_clicks`
  - `affiliate_conversions`
  - `affiliate_payouts`
- Add enums:
  - `RewardType`
  - `AffiliateStatus`
  - `PayoutStatus`

## Components

- `RewardsSummaryCard`.
- `ReferralInvitePanel`.
- `AffiliateSignupForm`.
- `AffiliateDashboard`.
- `CommissionTable`.
- `GrowthAttributionDashboard`.

## Analytics

- Add:
  - `referral_code_shared`
  - `referral_conversion`
  - `affiliate_click`
  - `affiliate_conversion`
  - `loyalty_reward_redeemed`
  - `upsell_accepted`

## SEO

- Affiliate landing pages need dedicated metadata and anti-duplicate canonicals.
- Customer account and affiliate dashboards must be non-indexed.

## Acceptance

- Loyalty accrual and redemption are accurate and auditable.
- Referral rewards are issued only on valid completed orders.
- Affiliate attribution survives multi-session journeys.
- Payout calculations are reviewable and exportable.
- Growth dashboards show channel, campaign, and partner contribution to revenue.

## Deferred

- Multi-tier affiliate structures.
- Dynamic commission optimization.
- External partner API ecosystem.
