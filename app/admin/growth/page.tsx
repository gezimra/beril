import {
  upsertAffiliateAction,
  upsertAffiliatePayoutAction,
  upsertLoyaltyRuleAction,
} from "@/app/admin/actions";
import { Container } from "@/components/layout/container";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  listAdminAffiliatePayouts,
  listAdminAffiliates,
  listAdminLoyaltyAccounts,
  listAdminLoyaltyRules,
} from "@/lib/db/growth-loyalty";
import { affiliateStatuses, payoutStatuses, rewardTypes } from "@/types/domain";

type AdminGrowthPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function getQueryParam(value: string | string[] | undefined, fallback = "") {
  if (Array.isArray(value)) {
    return value[0] ?? fallback;
  }
  return value ?? fallback;
}

export default async function AdminGrowthPage({
  searchParams,
}: AdminGrowthPageProps) {
  const query = await searchParams;
  const search = getQueryParam(query.search);
  const status = getQueryParam(query.status);

  const [rules, accounts, affiliates, payouts] = await Promise.all([
    listAdminLoyaltyRules(),
    listAdminLoyaltyAccounts({ search }),
    listAdminAffiliates({ search, status }),
    listAdminAffiliatePayouts({ status }),
  ]);

  return (
    <Container className="space-y-6">
      <header className="surface-panel p-6">
        <StatusBadge tone="service">Growth</StatusBadge>
        <h1 className="mt-3 text-4xl text-graphite">Loyalty, Referral, Affiliate</h1>
        <p className="mt-2 text-sm text-graphite/74">
          Configure retention rules and affiliate commission operations.
        </p>
      </header>

      <form method="get" className="surface-panel grid gap-3 p-4 sm:grid-cols-[1fr_14rem_auto]">
        <input
          name="search"
          defaultValue={search}
          placeholder="Search affiliate or account"
          className="w-full rounded-lg border border-graphite/18 bg-white/85 px-3 py-2 text-sm"
        />
        <select
          name="status"
          defaultValue={status}
          className="rounded-lg border border-graphite/18 bg-white/85 px-3 py-2 text-sm"
        >
          <option value="">All statuses</option>
          {Array.from(new Set([...affiliateStatuses, ...payoutStatuses])).map((item) => (
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

      <section className="grid gap-5 xl:grid-cols-2">
        <article className="surface-panel p-4">
          <h2 className="text-2xl text-graphite">Loyalty Rules</h2>
          <form action={upsertLoyaltyRuleAction} className="mt-3 space-y-2 rounded-lg border border-graphite/12 bg-white/70 p-3">
            <input
              name="name"
              required
              placeholder="Rule name"
              className="w-full rounded-lg border border-graphite/18 bg-white/85 px-3 py-2 text-sm"
            />
            <div className="grid gap-2 sm:grid-cols-3">
              <input
                name="pointsPerEur"
                type="number"
                min="0"
                step="0.01"
                defaultValue={1}
                className="rounded-lg border border-graphite/18 bg-white/85 px-3 py-2 text-sm"
              />
              <input
                name="minRedeemPoints"
                type="number"
                min="0"
                defaultValue={100}
                className="rounded-lg border border-graphite/18 bg-white/85 px-3 py-2 text-sm"
              />
              <select
                name="rewardType"
                defaultValue="points"
                className="rounded-lg border border-graphite/18 bg-white/85 px-3 py-2 text-sm"
              >
                {rewardTypes.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>
            <label className="flex items-center gap-2 text-sm text-graphite/74">
              <input type="checkbox" name="active" defaultChecked />
              Active
            </label>
            <button
              type="submit"
              className="inline-flex h-9 items-center rounded-full bg-mineral px-4 text-xs uppercase tracking-[0.12em] text-white"
            >
              Save Rule
            </button>
          </form>

          <ul className="mt-3 space-y-2 text-sm">
            {rules.length === 0 ? (
              <li className="text-graphite/72">No loyalty rules.</li>
            ) : (
              rules.map((rule) => (
                <li key={rule.id} className="rounded-lg border border-graphite/10 bg-white/75 px-3 py-2">
                  <p className="font-medium text-graphite">{rule.name}</p>
                  <p className="text-xs text-graphite/62">
                    {rule.pointsPerEur} pts/EUR | min {rule.minRedeemPoints} | {rule.rewardType}
                  </p>
                </li>
              ))
            )}
          </ul>
        </article>

        <article className="surface-panel p-4">
          <h2 className="text-2xl text-graphite">Loyalty Accounts</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {accounts.length === 0 ? (
              <li className="text-graphite/72">No loyalty accounts yet.</li>
            ) : (
              accounts.map((account) => (
                <li key={account.id} className="rounded-lg border border-graphite/10 bg-white/75 px-3 py-2">
                  <p className="font-medium text-graphite">{account.customerProfileId}</p>
                  <p className="text-xs text-graphite/62">
                    {account.pointsBalance} pts | {account.tier}
                  </p>
                </li>
              ))
            )}
          </ul>
        </article>
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        <article className="surface-panel p-4">
          <h2 className="text-2xl text-graphite">Affiliates</h2>
          <form action={upsertAffiliateAction} className="mt-3 space-y-2 rounded-lg border border-graphite/12 bg-white/70 p-3">
            <input
              name="name"
              required
              placeholder="Affiliate name"
              className="w-full rounded-lg border border-graphite/18 bg-white/85 px-3 py-2 text-sm"
            />
            <input
              name="email"
              type="email"
              placeholder="Affiliate email"
              className="w-full rounded-lg border border-graphite/18 bg-white/85 px-3 py-2 text-sm"
            />
            <div className="grid gap-2 sm:grid-cols-3">
              <input
                name="code"
                required
                placeholder="BERIL-A1"
                className="rounded-lg border border-graphite/18 bg-white/85 px-3 py-2 text-sm uppercase"
              />
              <select
                name="status"
                defaultValue="pending"
                className="rounded-lg border border-graphite/18 bg-white/85 px-3 py-2 text-sm"
              >
                {affiliateStatuses.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
              <input
                name="commissionRate"
                type="number"
                min="0"
                max="1"
                step="0.0001"
                defaultValue={0.05}
                className="rounded-lg border border-graphite/18 bg-white/85 px-3 py-2 text-sm"
              />
            </div>
            <textarea
              name="notes"
              rows={2}
              placeholder="Notes"
              className="w-full rounded-lg border border-graphite/18 bg-white/85 px-3 py-2 text-sm"
            />
            <button
              type="submit"
              className="inline-flex h-9 items-center rounded-full bg-walnut px-4 text-xs uppercase tracking-[0.12em] text-white"
            >
              Save Affiliate
            </button>
          </form>

          <ul className="mt-3 space-y-2 text-sm">
            {affiliates.length === 0 ? (
              <li className="text-graphite/72">No affiliates yet.</li>
            ) : (
              affiliates.map((affiliate) => (
                <li key={affiliate.id} className="rounded-lg border border-graphite/10 bg-white/75 px-3 py-2">
                  <p className="font-medium text-graphite">{affiliate.name}</p>
                  <p className="text-xs text-graphite/62">
                    {affiliate.code} | {affiliate.status} | {(affiliate.commissionRate * 100).toFixed(2)}%
                  </p>
                </li>
              ))
            )}
          </ul>
        </article>

        <article className="surface-panel p-4">
          <h2 className="text-2xl text-graphite">Affiliate Payouts</h2>
          <form action={upsertAffiliatePayoutAction} className="mt-3 space-y-2 rounded-lg border border-graphite/12 bg-white/70 p-3">
            <select
              name="affiliateId"
              required
              defaultValue=""
              className="w-full rounded-lg border border-graphite/18 bg-white/85 px-3 py-2 text-sm"
            >
              <option value="">Select affiliate</option>
              {affiliates.map((affiliate) => (
                <option key={affiliate.id} value={affiliate.id}>
                  {affiliate.name} ({affiliate.code})
                </option>
              ))}
            </select>
            <div className="grid gap-2 sm:grid-cols-2">
              <input
                name="periodStart"
                type="date"
                className="rounded-lg border border-graphite/18 bg-white/85 px-3 py-2 text-sm"
              />
              <input
                name="periodEnd"
                type="date"
                className="rounded-lg border border-graphite/18 bg-white/85 px-3 py-2 text-sm"
              />
            </div>
            <div className="grid gap-2 sm:grid-cols-3">
              <input
                name="amount"
                type="number"
                min="0"
                step="0.01"
                required
                placeholder="Amount EUR"
                className="rounded-lg border border-graphite/18 bg-white/85 px-3 py-2 text-sm"
              />
              <select
                name="status"
                defaultValue="pending"
                className="rounded-lg border border-graphite/18 bg-white/85 px-3 py-2 text-sm"
              >
                {payoutStatuses.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
              <input
                name="paidAt"
                type="datetime-local"
                className="rounded-lg border border-graphite/18 bg-white/85 px-3 py-2 text-sm"
              />
            </div>
            <input
              name="reference"
              placeholder="Bank transfer ref"
              className="w-full rounded-lg border border-graphite/18 bg-white/85 px-3 py-2 text-sm"
            />
            <button
              type="submit"
              className="inline-flex h-9 items-center rounded-full bg-mineral px-4 text-xs uppercase tracking-[0.12em] text-white"
            >
              Save Payout
            </button>
          </form>

          <ul className="mt-3 space-y-2 text-sm">
            {payouts.length === 0 ? (
              <li className="text-graphite/72">No affiliate payouts.</li>
            ) : (
              payouts.map((payout) => (
                <li key={payout.id} className="rounded-lg border border-graphite/10 bg-white/75 px-3 py-2">
                  <p className="font-medium text-graphite">{payout.affiliateId}</p>
                  <p className="text-xs text-graphite/62">
                    {payout.amount} EUR | {payout.status}
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

