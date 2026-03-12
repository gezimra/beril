import {
  assignCouponToCustomerAction,
  upsertCampaignAction,
  upsertCouponAction,
  upsertPromotionAction,
} from "@/app/admin/actions";
import { Container } from "@/components/layout/container";
import { FloatInput, FloatSelect, FloatTextarea } from "@/components/ui/float-field";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  listAdminCampaigns,
  listAdminCoupons,
  listAdminPromotions,
} from "@/lib/db/payments-promotions";
import { formatStatusLabel } from "@/lib/utils/status-label";
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
        <FloatInput
          name="search"
          defaultValue={search}
          label="Search name/code"
        />
        <FloatSelect
          name="status"
          defaultValue={status}
          label="All statuses"
        >
          <option value="">All statuses</option>
          {Array.from(
            new Set([...campaignStatuses, ...promotionStatuses, ...couponStatuses]),
          ).map((item) => (
            <option key={item} value={item}>
              {formatStatusLabel(item)}
            </option>
          ))}
        </FloatSelect>
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
          <FloatInput
            name="name"
            required
            label="Name"
          />
          <FloatInput
            name="slug"
            required
            label="spring-launch"
          />
          <FloatTextarea
            name="description"
            rows={2}
            label="Description"
          />
          <div className="grid gap-2 sm:grid-cols-2">
            <FloatSelect
              name="status"
              defaultValue="draft"
              label="Status"
            >
              {campaignStatuses.map((item) => (
                <option key={item} value={item}>
                  {formatStatusLabel(item)}
                </option>
              ))}
            </FloatSelect>
            <FloatInput
              name="budget"
              type="number"
              min="0"
              step="0.01"
              label="Budget EUR"
            />
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <FloatInput
              name="startsAt"
              type="datetime-local"
              label="Starts at"
            />
            <FloatInput
              name="endsAt"
              type="datetime-local"
              label="Ends at"
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
          <FloatSelect
            name="campaignId"
            defaultValue=""
            label="Campaign"
          >
            <option value="">No campaign</option>
            {campaigns.map((campaign) => (
              <option key={campaign.id} value={campaign.id}>
                {campaign.name}
              </option>
            ))}
          </FloatSelect>
          <FloatInput
            name="name"
            required
            label="Promotion name"
          />
          <div className="grid gap-2 sm:grid-cols-3">
            <FloatSelect
              name="status"
              defaultValue="draft"
              label="Status"
            >
              {promotionStatuses.map((item) => (
                <option key={item} value={item}>
                  {formatStatusLabel(item)}
                </option>
              ))}
            </FloatSelect>
            <FloatSelect
              name="type"
              defaultValue="percentage"
              label="Type"
            >
              {promotionTypes.map((item) => (
                <option key={item} value={item}>
                  {formatStatusLabel(item)}
                </option>
              ))}
            </FloatSelect>
            <FloatSelect
              name="scope"
              defaultValue="order"
              label="Scope"
            >
              {promotionScopes.map((item) => (
                <option key={item} value={item}>
                  {formatStatusLabel(item)}
                </option>
              ))}
            </FloatSelect>
          </div>
          <div className="grid gap-2 sm:grid-cols-3">
            <FloatInput
              name="percentageOff"
              type="number"
              step="0.01"
              min="0"
              max="100"
              label="% off"
            />
            <FloatInput
              name="amountOff"
              type="number"
              step="0.01"
              min="0"
              label="Amount off EUR"
            />
            <FloatInput
              name="minOrderTotal"
              type="number"
              step="0.01"
              min="0"
              label="Min order EUR"
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-graphite/74">
            <input type="checkbox" name="isStackable" />
            Stackable
          </label>
          <div className="grid gap-2 sm:grid-cols-2">
            <FloatInput
              name="startsAt"
              type="datetime-local"
              label="Starts at"
            />
            <FloatInput
              name="endsAt"
              type="datetime-local"
              label="Ends at"
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
          <FloatSelect
            name="promotionId"
            required
            defaultValue=""
            label="Select promotion"
            wrapperClassName="md:col-span-2"
          >
            <option value="">Select promotion</option>
            {promotions.map((promotion) => (
              <option key={promotion.id} value={promotion.id}>
                {promotion.name}
              </option>
            ))}
          </FloatSelect>
          <FloatInput
            name="code"
            required
            label="BERIL10"
          />
          <FloatSelect
            name="status"
            defaultValue="active"
            label="Status"
          >
            {couponStatuses.map((item) => (
              <option key={item} value={item}>
                {formatStatusLabel(item)}
              </option>
            ))}
          </FloatSelect>
          <FloatInput
            name="usageLimit"
            type="number"
            min="1"
            label="Limit"
          />
          <FloatInput
            name="perCustomerLimit"
            type="number"
            min="1"
            defaultValue={1}
            label="Per customer"
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
          <FloatSelect
            name="couponId"
            required
            defaultValue=""
            label="Select coupon"
            wrapperClassName="md:col-span-2"
          >
            <option value="">Select coupon</option>
            {coupons.map((coupon) => (
              <option key={coupon.id} value={coupon.id}>
                {coupon.code}
              </option>
            ))}
          </FloatSelect>
          <FloatInput
            name="customerEmail"
            type="email"
            required
            label="customer@email.com"
            wrapperClassName="md:col-span-2"
          />
          <FloatSelect
            name="status"
            defaultValue="active"
            label="Status"
          >
            <option value="active">Active</option>
            <option value="paused">Paused</option>
            <option value="expired">Expired</option>
          </FloatSelect>
          <FloatInput
            name="maxRedemptions"
            type="number"
            min="1"
            label="Max uses"
          />
          <button
            type="submit"
            className="inline-flex h-10 items-center justify-center rounded-full bg-mineral px-4 text-xs uppercase tracking-[0.12em] text-white"
          >
            Assign Coupon
          </button>
          <FloatInput
            name="startsAt"
            type="datetime-local"
            label="Starts at"
            wrapperClassName="md:col-span-2"
          />
          <FloatInput
            name="endsAt"
            type="datetime-local"
            label="Ends at"
            wrapperClassName="md:col-span-2"
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
                  <p className="text-xs text-graphite/65">
                    {formatStatusLabel(campaign.status)}
                  </p>
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
                    {formatStatusLabel(promotion.type)} | {formatStatusLabel(promotion.status)}
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
                    {formatStatusLabel(coupon.status)} | used {coupon.usageCount}
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
