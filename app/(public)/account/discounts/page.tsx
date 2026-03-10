import { redirect } from "next/navigation";

import { StatusBadge } from "@/components/ui/status-badge";
import {
  getAuthenticatedCustomerUser,
  listDiscountsForAuthenticatedCustomer,
} from "@/lib/db/customer-account";

export const metadata = {
  title: "My Discounts",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function CustomerDiscountsPage() {
  const user = await getAuthenticatedCustomerUser();
  if (!user) {
    redirect("/account/login?next=/account/discounts");
  }

  const discounts = await listDiscountsForAuthenticatedCustomer();

  return (
    <article className="surface-panel p-6 sm:p-8">
      <StatusBadge tone="premium">Discounts</StatusBadge>
      <h1 className="mt-3 text-4xl text-graphite">My Discount Codes</h1>
      <p className="mt-2 text-sm text-graphite/74">
        These are customer-specific coupon codes assigned to your account.
      </p>

      <div className="mt-5 space-y-3">
        {discounts.length === 0 ? (
          <div className="rounded-xl border border-graphite/12 bg-white/75 p-4 text-sm text-graphite/72">
            No personal discount codes assigned yet.
          </div>
        ) : (
          discounts.map((coupon) => (
            <article
              key={`${coupon.code}-${coupon.promotionName}`}
              className="rounded-xl border border-graphite/12 bg-white/75 p-4"
            >
              <p className="text-xs uppercase tracking-[0.14em] text-graphite/62">Coupon</p>
              <p className="mt-1 text-2xl font-medium uppercase text-graphite">{coupon.code}</p>
              <p className="mt-2 text-sm text-graphite/74">{coupon.promotionName}</p>
              <p className="mt-1 text-xs text-graphite/62">
                status: {coupon.status}
                {coupon.maxRedemptions !== null
                  ? ` | used ${coupon.redemptionCount}/${coupon.maxRedemptions}`
                  : ` | used ${coupon.redemptionCount}`}
              </p>
              <p className="mt-1 text-xs text-graphite/62">
                {coupon.startsAt ? `from ${new Date(coupon.startsAt).toLocaleDateString()}` : "active now"}
                {coupon.endsAt
                  ? ` until ${new Date(coupon.endsAt).toLocaleDateString()}`
                  : ""}
              </p>
            </article>
          ))
        )}
      </div>
    </article>
  );
}

