import {
  upsertAffiliateAction,
  upsertAffiliatePayoutAction,
  upsertLoyaltyRuleAction,
} from "@/app/admin/actions";
import { Container } from "@/components/layout/container";
import { FloatInput, FloatSelect, FloatTextarea } from "@/components/ui/float-field";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  listAdminAffiliatePayouts,
  listAdminAffiliates,
  listAdminLoyaltyAccounts,
  listAdminLoyaltyRules,
} from "@/lib/db/growth-loyalty";
import { formatStatusLabel } from "@/lib/utils/status-label";
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
        <FloatInput
          name="search"
          defaultValue={search}
          label="Search affiliate or account"
        />
        <FloatSelect
          name="status"
          defaultValue={status}
          label="All statuses"
        >
          <option value="">All statuses</option>
          {Array.from(new Set([...affiliateStatuses, ...payoutStatuses])).map((item) => (
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

      <section className="grid gap-5 xl:grid-cols-2">
        <article className="surface-panel p-4">
          <h2 className="text-2xl text-graphite">Loyalty Rules</h2>
          <form action={upsertLoyaltyRuleAction} className="mt-3 space-y-2 rounded-lg border border-graphite/12 bg-white/70 p-3">
            <FloatInput
              name="name"
              required
              label="Rule name"
            />
            <div className="grid gap-2 sm:grid-cols-3">
              <FloatInput
                name="pointsPerEur"
                type="number"
                min="0"
                step="0.01"
                defaultValue={1}
                label="Points per EUR"
              />
              <FloatInput
                name="minRedeemPoints"
                type="number"
                min="0"
                defaultValue={100}
                label="Min redeem points"
              />
              <FloatSelect
                name="rewardType"
                defaultValue="points"
                label="Reward type"
              >
                {rewardTypes.map((item) => (
                  <option key={item} value={item}>
                    {formatStatusLabel(item)}
                  </option>
                ))}
              </FloatSelect>
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
                    {rule.pointsPerEur} pts/EUR | min {rule.minRedeemPoints} |{" "}
                    {formatStatusLabel(rule.rewardType)}
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
            <FloatInput
              name="name"
              required
              label="Affiliate name"
            />
            <FloatInput
              name="email"
              type="email"
              label="Affiliate email"
            />
            <div className="grid gap-2 sm:grid-cols-3">
              <FloatInput
                name="code"
                required
                label="BERIL-A1"
              />
              <FloatSelect
                name="status"
                defaultValue="pending"
                label="Status"
              >
                {affiliateStatuses.map((item) => (
                  <option key={item} value={item}>
                    {formatStatusLabel(item)}
                  </option>
                ))}
              </FloatSelect>
              <FloatInput
                name="commissionRate"
                type="number"
                min="0"
                max="1"
                step="0.0001"
                defaultValue={0.05}
                label="Commission rate"
              />
            </div>
            <FloatTextarea
              name="notes"
              rows={2}
              label="Notes"
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
                    {affiliate.code} | {formatStatusLabel(affiliate.status)} | {(affiliate.commissionRate * 100).toFixed(2)}%
                  </p>
                </li>
              ))
            )}
          </ul>
        </article>

        <article className="surface-panel p-4">
          <h2 className="text-2xl text-graphite">Affiliate Payouts</h2>
          <form action={upsertAffiliatePayoutAction} className="mt-3 space-y-2 rounded-lg border border-graphite/12 bg-white/70 p-3">
            <FloatSelect
              name="affiliateId"
              required
              defaultValue=""
              label="Select affiliate"
            >
              <option value="">Select affiliate</option>
              {affiliates.map((affiliate) => (
                <option key={affiliate.id} value={affiliate.id}>
                  {affiliate.name} ({affiliate.code})
                </option>
              ))}
            </FloatSelect>
            <div className="grid gap-2 sm:grid-cols-2">
              <FloatInput
                name="periodStart"
                type="date"
                label="Period start"
              />
              <FloatInput
                name="periodEnd"
                type="date"
                label="Period end"
              />
            </div>
            <div className="grid gap-2 sm:grid-cols-3">
              <FloatInput
                name="amount"
                type="number"
                min="0"
                step="0.01"
                required
                label="Amount EUR"
              />
              <FloatSelect
                name="status"
                defaultValue="pending"
                label="Status"
              >
                {payoutStatuses.map((item) => (
                  <option key={item} value={item}>
                    {formatStatusLabel(item)}
                  </option>
                ))}
              </FloatSelect>
              <FloatInput
                name="paidAt"
                type="datetime-local"
                label="Paid at"
              />
            </div>
            <FloatInput
              name="reference"
              label="Bank transfer ref"
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
                    {payout.amount} EUR | {formatStatusLabel(payout.status)}
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
