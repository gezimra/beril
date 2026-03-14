import { MousePointerClick, TrendingUp, Wallet, Clock, Gift } from "lucide-react";

import { CopyButton } from "@/components/ui/copy-button";
import { StatusBadge } from "@/components/ui/status-badge";
import { getAuthenticatedCustomerUser } from "@/lib/db/customer-account";
import { getAffiliateDashboardByEmail } from "@/lib/db/growth-loyalty";
import { formatEur } from "@/lib/utils/money";
import { redeemAffiliateCommissionAction } from "@/app/(public)/account/actions";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Referrals",
  robots: { index: false, follow: false },
};

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

const payoutStatusLabel: Record<string, string> = {
  pending: "Pending",
  approved: "Approved",
  paid: "Paid",
  cancelled: "Cancelled",
};

const payoutStatusTone: Record<string, string> = {
  pending: "text-graphite/65",
  approved: "text-mineral",
  paid: "text-mineral font-medium",
  cancelled: "text-walnut/70",
};

export default async function AccountAffiliatePage({ searchParams }: PageProps) {
  const user = await getAuthenticatedCustomerUser();

  if (!user) {
    return (
      <article className="surface-panel p-6 sm:p-8">
        <p className="text-sm text-graphite/70">Sign in to view your referral dashboard.</p>
      </article>
    );
  }

  const query = await searchParams;
  const newCoupon = typeof query.coupon === "string" ? query.coupon : null;
  const redeemError = typeof query.error === "string" ? query.error : null;

  const dashboard = await getAffiliateDashboardByEmail(user.email);

  if (!dashboard) {
    return (
      <article className="surface-panel p-6 sm:p-8">
        <StatusBadge tone="service">Referrals</StatusBadge>
        <h1 className="mt-3 text-3xl text-graphite">Referral Program</h1>
        <p className="mt-3 text-sm text-graphite/70">
          You don&apos;t have an active referral account yet. Contact the store to get your personal
          referral code and start earning on every sale you bring in.
        </p>
      </article>
    );
  }

  const { affiliate, stats, payouts } = dashboard;

  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://beril.store").replace(/\/$/, "");
  const referralLink = `${siteUrl}?ref=${affiliate.code}`;

  const totalEarned = stats.pendingCommission + stats.approvedCommission;

  return (
    <div className="space-y-5">
      {newCoupon ? (
        <div className="rounded-xl border border-mineral/30 bg-mineral/8 p-5">
          <div className="flex items-center gap-2">
            <Gift className="h-4 w-4 text-mineral" />
            <p className="text-sm font-medium text-mineral">Store credit redeemed!</p>
          </div>
          <p className="mt-1 text-sm text-graphite/70">
            Your coupon is ready. Use it at checkout — it&apos;s valid for one order.
          </p>
          <div className="mt-3 flex items-center justify-between gap-3 rounded-lg border border-mineral/20 bg-white/80 px-4 py-2.5">
            <p className="font-mono text-base font-medium text-graphite">{newCoupon}</p>
            <CopyButton value={newCoupon} />
          </div>
          <p className="mt-2 text-xs text-graphite/50">
            Also visible in your{" "}
            <a href="/account/discounts" className="underline">
              Discounts
            </a>{" "}
            tab.
          </p>
        </div>
      ) : null}

      {redeemError === "redeem_failed" ? (
        <div className="rounded-xl border border-walnut/25 bg-walnut/8 px-4 py-3 text-sm text-walnut">
          Something went wrong generating your coupon. Please try again or contact the store.
        </div>
      ) : null}

      <article className="surface-panel p-6 sm:p-8">
        <StatusBadge tone="service">Referrals</StatusBadge>
        <h1 className="mt-3 text-3xl text-graphite">Your Referral Dashboard</h1>
        <p className="mt-1 text-sm text-graphite/70">
          Share your link and earn {(affiliate.commissionRate * 100).toFixed(0)}% commission on
          every order you refer.
        </p>

        <div className="mt-5 rounded-xl border border-graphite/12 bg-white/78 p-4">
          <p className="text-xs uppercase tracking-[0.14em] text-graphite/55">Your Referral Link</p>
          <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
            <p className="break-all font-mono text-sm text-graphite">{referralLink}</p>
            <CopyButton value={referralLink} />
          </div>
          <p className="mt-2 text-xs text-graphite/50">
            Code: <span className="font-medium text-graphite/75">{affiliate.code}</span>
          </p>
        </div>
      </article>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="surface-panel p-4">
          <MousePointerClick className="h-4 w-4 text-graphite/50" />
          <p className="mt-2 text-2xl font-medium text-graphite">{stats.totalClicks}</p>
          <p className="text-xs text-graphite/60">Total Clicks</p>
        </div>
        <div className="surface-panel p-4">
          <TrendingUp className="h-4 w-4 text-graphite/50" />
          <p className="mt-2 text-2xl font-medium text-graphite">{stats.totalConversions}</p>
          <p className="text-xs text-graphite/60">Conversions</p>
        </div>
        <div className="surface-panel p-4">
          <Clock className="h-4 w-4 text-graphite/50" />
          <p className="mt-2 text-2xl font-medium text-graphite">
            {formatEur(stats.pendingCommission)}
          </p>
          <p className="text-xs text-graphite/60">Pending</p>
        </div>
        <div className="surface-panel p-4">
          <Wallet className="h-4 w-4 text-graphite/50" />
          <p className="mt-2 text-2xl font-medium text-mineral">
            {formatEur(stats.redeemableCommission)}
          </p>
          <p className="text-xs text-graphite/60">Available</p>
        </div>
      </div>

      {totalEarned > 0 ? (
        <div className="rounded-xl border border-mineral/20 bg-mineral/6 px-4 py-3 text-sm text-graphite/80">
          Total earned to date:{" "}
          <span className="font-medium text-graphite">{formatEur(totalEarned)}</span>
          {stats.pendingCommission > 0 ? (
            <span className="text-graphite/55">
              {" "}
              ({formatEur(stats.pendingCommission)} pending approval)
            </span>
          ) : null}
        </div>
      ) : null}

      {stats.redeemableCommission > 0 ? (
        <article className="surface-panel p-6 sm:p-8">
          <h2 className="text-lg font-medium text-graphite">Redeem Your Earnings</h2>
          <p className="mt-1 text-sm text-graphite/70">
            Convert your{" "}
            <span className="font-medium text-graphite">{formatEur(stats.redeemableCommission)}</span>{" "}
            approved commission into a store credit coupon, usable on any order.
          </p>
          <form action={redeemAffiliateCommissionAction} className="mt-4">
            <button
              type="submit"
              className="inline-flex h-10 items-center gap-2 rounded-full bg-mineral px-5 text-sm font-medium text-white transition hover:brightness-90"
            >
              <Gift className="h-4 w-4" />
              Get coupon — {formatEur(stats.redeemableCommission)}
            </button>
          </form>
          <p className="mt-2 text-xs text-graphite/50">
            A single-use coupon will be generated and added to your account instantly.
          </p>
        </article>
      ) : null}

      <article className="surface-panel p-6 sm:p-8">
        <h2 className="text-lg font-medium text-graphite">Payout History</h2>

        {payouts.length === 0 ? (
          <p className="mt-3 text-sm text-graphite/60">No payouts recorded yet.</p>
        ) : (
          <div className="mt-4 divide-y divide-graphite/8">
            {payouts.map((payout) => {
              const isCouponPayout = payout.reference?.startsWith("COUPON:");
              const couponRef = isCouponPayout ? payout.reference!.replace("COUPON:", "") : null;
              return (
                <div key={payout.id} className="flex items-start justify-between gap-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-graphite">{formatEur(payout.amount)}</p>
                    {couponRef ? (
                      <p className="mt-0.5 font-mono text-xs text-graphite/55">
                        Coupon: {couponRef}
                      </p>
                    ) : null}
                    {!isCouponPayout && payout.periodStart && payout.periodEnd ? (
                      <p className="mt-0.5 text-xs text-graphite/55">
                        {formatDate(payout.periodStart)} — {formatDate(payout.periodEnd)}
                      </p>
                    ) : null}
                    {!isCouponPayout && payout.reference ? (
                      <p className="mt-0.5 font-mono text-xs text-graphite/45">
                        {payout.reference}
                      </p>
                    ) : null}
                  </div>
                  <div className="text-right shrink-0">
                    <p
                      className={`text-xs uppercase tracking-[0.11em] ${payoutStatusTone[payout.status] ?? "text-graphite/65"}`}
                    >
                      {isCouponPayout ? "Store Credit" : (payoutStatusLabel[payout.status] ?? payout.status)}
                    </p>
                    {payout.paidAt ? (
                      <p className="mt-0.5 text-xs text-graphite/45">{formatDate(payout.paidAt)}</p>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </article>
    </div>
  );
}
