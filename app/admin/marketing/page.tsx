import {
  assignCouponToCustomerAction,
  upsertCampaignAction,
  upsertCouponAction,
  upsertPromotionAction,
} from "@/app/admin/actions";
import { Container } from "@/components/layout/container";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  listAdminCampaigns,
  listAdminCoupons,
  listAdminPromotions,
} from "@/lib/db/payments-promotions";
import {
  campaignStatuses,
  couponStatuses,
  promotionScopes,
  promotionStatuses,
  promotionTypes,
} from "@/types/domain";

type AdminMarketingPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function getQueryParam(value: string | string[] | undefined, fallback = ""): string {
  if (Array.isArray(value)) {
    return value[0] ?? fallback;
  }
  return value ?? fallback;
}

export default async function AdminMarketingPage({
  searchParams,
}: AdminMarketingPageProps) {
  const query = await searchParams;
  const search = getQueryParam(query.search);
  const status = getQueryParam(query.status);

  const [campaigns, promotions, coupons] = await Promise.all([
    listAdminCampaigns({ search, status }),
    listAdminPromotions({ search, status }),
    listAdminCoupons({ search, status }),
  ]);

  return (
    <Container className="space-y-6">
      <header className="surface-panel p-6">
        <StatusBadge tone="service">Marketing</StatusBadge>
        <h1 className="mt-3 text-4xl text-graphite">Campaigns, Promotions, Coupons</h1>
        <p className="mt-2 text-sm text-graphite/74">
          Manage campaign windows, promotion logic, and coupon inventory.
        </p>
      </header>

      <form method="get" className="surface-panel grid gap-3 p-4 sm:grid-cols-[1fr_14rem_auto]">
        <input
          name="search"
          defaultValue={search}
          placeholder="Search name/code"
          className="w-full rounded-lg border border-graphite/18 bg-white/85 px-3 py-2 text-sm"
        />
        <select
          name="status"
          defaultValue={status}
          className="rounded-lg border border-graphite/18 bg-white/85 px-3 py-2 text-sm"
        >
          <option value="">All statuses</option>
          {Array.from(
            new Set([...campaignStatuses, ...promotionStatuses, ...couponStatuses]),
          ).map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="inline-flex h-10 items-center justify-center rounded-full bg-walnut px-5 text-xs uppercase tracking-[0.12em] text-white"
        >
          Apply
        </button>
      </form>

      <section className="surface-panel grid gap-4 p-5 lg:grid-cols-2">
        <form action={upsertCampaignAction} className="space-y-2 rounded-xl border border-graphite/12 bg-white/70 p-4">
          <p className="text-xs uppercase tracking-[0.14em] text-graphite/62">Create Campaign</p>
          <input
            name="name"
            required
            placeholder="Name"
            className="w-full rounded-lg border border-graphite/18 bg-white/85 px-3 py-2 text-sm"
          />
          <input
            name="slug"
            required
            placeholder="spring-launch"
            className="w-full rounded-lg border border-graphite/18 bg-white/85 px-3 py-2 text-sm"
          />
          <textarea
            name="description"
            rows={2}
            placeholder="Description"
            className="w-full rounded-lg border border-graphite/18 bg-white/85 px-3 py-2 text-sm"
          />
          <div className="grid gap-2 sm:grid-cols-2">
            <select
              name="status"
              defaultValue="draft"
              className="rounded-lg border border-graphite/18 bg-white/85 px-3 py-2 text-sm"
            >
              {campaignStatuses.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
            <input
              name="budget"
              type="number"
              min="0"
              step="0.01"
              placeholder="Budget EUR"
              className="rounded-lg border border-graphite/18 bg-white/85 px-3 py-2 text-sm"
            />
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <input
              name="startsAt"
              type="datetime-local"
              className="rounded-lg border border-graphite/18 bg-white/85 px-3 py-2 text-sm"
            />
            <input
              name="endsAt"
              type="datetime-local"
              className="rounded-lg border border-graphite/18 bg-white/85 px-3 py-2 text-sm"
            />
          </div>
          <button
            type="submit"
            className="inline-flex h-9 items-center rounded-full bg-mineral px-4 text-xs uppercase tracking-[0.12em] text-white"
          >
            Save Campaign
          </button>
        </form>

        <form action={upsertPromotionAction} className="space-y-2 rounded-xl border border-graphite/12 bg-white/70 p-4">
          <p className="text-xs uppercase tracking-[0.14em] text-graphite/62">Create Promotion</p>
          <select
            name="campaignId"
            defaultValue=""
            className="w-full rounded-lg border border-graphite/18 bg-white/85 px-3 py-2 text-sm"
          >
            <option value="">No campaign</option>
            {campaigns.map((campaign) => (
              <option key={campaign.id} value={campaign.id}>
                {campaign.name}
              </option>
            ))}
          </select>
          <input
            name="name"
            required
            placeholder="Promotion name"
            className="w-full rounded-lg border border-graphite/18 bg-white/85 px-3 py-2 text-sm"
          />
          <div className="grid gap-2 sm:grid-cols-3">
            <select
              name="status"
              defaultValue="draft"
              className="rounded-lg border border-graphite/18 bg-white/85 px-3 py-2 text-sm"
            >
              {promotionStatuses.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
            <select
              name="type"
              defaultValue="percentage"
              className="rounded-lg border border-graphite/18 bg-white/85 px-3 py-2 text-sm"
            >
              {promotionTypes.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
            <select
              name="scope"
              defaultValue="order"
              className="rounded-lg border border-graphite/18 bg-white/85 px-3 py-2 text-sm"
            >
              {promotionScopes.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>
          <div className="grid gap-2 sm:grid-cols-3">
            <input
              name="percentageOff"
              type="number"
              step="0.01"
              min="0"
              max="100"
              placeholder="% off"
              className="rounded-lg border border-graphite/18 bg-white/85 px-3 py-2 text-sm"
            />
            <input
              name="amountOff"
              type="number"
              step="0.01"
              min="0"
              placeholder="Amount off EUR"
              className="rounded-lg border border-graphite/18 bg-white/85 px-3 py-2 text-sm"
            />
            <input
              name="minOrderTotal"
              type="number"
              step="0.01"
              min="0"
              placeholder="Min order EUR"
              className="rounded-lg border border-graphite/18 bg-white/85 px-3 py-2 text-sm"
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-graphite/74">
            <input type="checkbox" name="isStackable" />
            Stackable
          </label>
          <div className="grid gap-2 sm:grid-cols-2">
            <input
              name="startsAt"
              type="datetime-local"
              className="rounded-lg border border-graphite/18 bg-white/85 px-3 py-2 text-sm"
            />
            <input
              name="endsAt"
              type="datetime-local"
              className="rounded-lg border border-graphite/18 bg-white/85 px-3 py-2 text-sm"
            />
          </div>
          <button
            type="submit"
            className="inline-flex h-9 items-center rounded-full bg-mineral px-4 text-xs uppercase tracking-[0.12em] text-white"
          >
            Save Promotion
          </button>
        </form>
      </section>

      <section className="surface-panel p-5">
        <form action={upsertCouponAction} className="grid gap-3 md:grid-cols-7">
          <select
            name="promotionId"
            required
            defaultValue=""
            className="md:col-span-2 rounded-lg border border-graphite/18 bg-white/85 px-3 py-2 text-sm"
          >
            <option value="">Select promotion</option>
            {promotions.map((promotion) => (
              <option key={promotion.id} value={promotion.id}>
                {promotion.name}
              </option>
            ))}
          </select>
          <input
            name="code"
            required
            placeholder="BERIL10"
            className="rounded-lg border border-graphite/18 bg-white/85 px-3 py-2 text-sm uppercase"
          />
          <select
            name="status"
            defaultValue="active"
            className="rounded-lg border border-graphite/18 bg-white/85 px-3 py-2 text-sm"
          >
            {couponStatuses.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          <input
            name="usageLimit"
            type="number"
            min="1"
            placeholder="Limit"
            className="rounded-lg border border-graphite/18 bg-white/85 px-3 py-2 text-sm"
          />
          <input
            name="perCustomerLimit"
            type="number"
            min="1"
            defaultValue={1}
            className="rounded-lg border border-graphite/18 bg-white/85 px-3 py-2 text-sm"
          />
          <button
            type="submit"
            className="inline-flex h-10 items-center justify-center rounded-full bg-walnut px-4 text-xs uppercase tracking-[0.12em] text-white"
          >
            Save Coupon
          </button>
        </form>
      </section>

      <section className="surface-panel p-5">
        <form
          action={assignCouponToCustomerAction}
          className="grid gap-3 md:grid-cols-7"
        >
          <select
            name="couponId"
            required
            defaultValue=""
            className="md:col-span-2 rounded-lg border border-graphite/18 bg-white/85 px-3 py-2 text-sm"
          >
            <option value="">Select coupon</option>
            {coupons.map((coupon) => (
              <option key={coupon.id} value={coupon.id}>
                {coupon.code}
              </option>
            ))}
          </select>
          <input
            name="customerEmail"
            type="email"
            required
            placeholder="customer@email.com"
            className="md:col-span-2 rounded-lg border border-graphite/18 bg-white/85 px-3 py-2 text-sm"
          />
          <select
            name="status"
            defaultValue="active"
            className="rounded-lg border border-graphite/18 bg-white/85 px-3 py-2 text-sm"
          >
            <option value="active">active</option>
            <option value="paused">paused</option>
            <option value="expired">expired</option>
          </select>
          <input
            name="maxRedemptions"
            type="number"
            min="1"
            placeholder="Max uses"
            className="rounded-lg border border-graphite/18 bg-white/85 px-3 py-2 text-sm"
          />
          <button
            type="submit"
            className="inline-flex h-10 items-center justify-center rounded-full bg-mineral px-4 text-xs uppercase tracking-[0.12em] text-white"
          >
            Assign Coupon
          </button>
          <input
            name="startsAt"
            type="datetime-local"
            className="md:col-span-2 rounded-lg border border-graphite/18 bg-white/85 px-3 py-2 text-sm"
          />
          <input
            name="endsAt"
            type="datetime-local"
            className="md:col-span-2 rounded-lg border border-graphite/18 bg-white/85 px-3 py-2 text-sm"
          />
          <p className="md:col-span-3 text-xs text-graphite/62">
            Assign private coupons to customers by email. Assigned coupons will
            only validate for the matched customer account.
          </p>
        </form>
      </section>

      <section className="grid gap-5 xl:grid-cols-3">
        <article className="surface-panel p-4">
          <h2 className="text-2xl text-graphite">Campaigns</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {campaigns.length === 0 ? (
              <li className="text-graphite/70">No campaigns yet.</li>
            ) : (
              campaigns.map((campaign) => (
                <li key={campaign.id} className="rounded-lg border border-graphite/10 bg-white/75 px-3 py-2">
                  <p className="font-medium text-graphite">{campaign.name}</p>
                  <p className="text-xs text-graphite/65">{campaign.status}</p>
                </li>
              ))
            )}
          </ul>
        </article>

        <article className="surface-panel p-4">
          <h2 className="text-2xl text-graphite">Promotions</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {promotions.length === 0 ? (
              <li className="text-graphite/70">No promotions yet.</li>
            ) : (
              promotions.map((promotion) => (
                <li key={promotion.id} className="rounded-lg border border-graphite/10 bg-white/75 px-3 py-2">
                  <p className="font-medium text-graphite">{promotion.name}</p>
                  <p className="text-xs text-graphite/65">
                    {promotion.type} | {promotion.status}
                  </p>
                </li>
              ))
            )}
          </ul>
        </article>

        <article className="surface-panel p-4">
          <h2 className="text-2xl text-graphite">Coupons</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {coupons.length === 0 ? (
              <li className="text-graphite/70">No coupons yet.</li>
            ) : (
              coupons.map((coupon) => (
                <li key={coupon.id} className="rounded-lg border border-graphite/10 bg-white/75 px-3 py-2">
                  <p className="font-medium text-graphite">{coupon.code}</p>
                  <p className="text-xs text-graphite/65">
                    {coupon.status} | used {coupon.usageCount}
                  </p>
                </li>
              ))
            )}
          </ul>
        </article>
      </section>
    </Container>
  );
}
