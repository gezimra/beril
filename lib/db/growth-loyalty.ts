import { createSupabaseServiceClient } from "@/lib/db/supabase/service";
import { ensureCustomerProfile } from "@/lib/db/crm-support";
import type {
  AdminAffiliate,
  AdminAffiliatePayout,
  AdminLoyaltyAccount,
  AdminLoyaltyRule,
} from "@/types/admin";
import type { AffiliateStatus, PayoutStatus, RewardType } from "@/types/domain";

interface ListFilterParams {
  search?: string;
  status?: string;
}

interface UpsertLoyaltyRuleInput {
  id?: string;
  name: string;
  pointsPerEur: number;
  minRedeemPoints: number;
  rewardType: RewardType;
  active: boolean;
}

interface UpsertAffiliateInput {
  id?: string;
  name: string;
  email?: string | null;
  code: string;
  status: AffiliateStatus;
  commissionRate: number;
  notes?: string | null;
}

interface UpsertAffiliatePayoutInput {
  id?: string;
  affiliateId: string;
  periodStart?: string | null;
  periodEnd?: string | null;
  amount: number;
  status: PayoutStatus;
  paidAt?: string | null;
  reference?: string | null;
}

const nowIso = () => new Date().toISOString();

const fallbackRules: AdminLoyaltyRule[] = [];
const fallbackAccounts: AdminLoyaltyAccount[] = [];
const fallbackAffiliates: AdminAffiliate[] = [];
const fallbackPayouts: AdminAffiliatePayout[] = [];

function includesSearch(source: string, search?: string) {
  if (!search) {
    return true;
  }
  return source.toLowerCase().includes(search.toLowerCase());
}

export async function listAdminLoyaltyRules(): Promise<AdminLoyaltyRule[]> {
  const serviceClient = createSupabaseServiceClient();
  if (!serviceClient) {
    return fallbackRules;
  }

  const { data, error } = await serviceClient
    .from("loyalty_rules")
    .select("id, name, points_per_eur, min_redeem_points, reward_type, active, created_at, updated_at")
    .order("updated_at", { ascending: false })
    .limit(50);

  if (error || !data) {
    return [];
  }

  return data.map((row) => ({
    id: row.id as string,
    name: row.name as string,
    pointsPerEur: Number(row.points_per_eur),
    minRedeemPoints: Number(row.min_redeem_points),
    rewardType: row.reward_type as RewardType,
    active: Boolean(row.active),
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  }));
}

export async function upsertAdminLoyaltyRule(input: UpsertLoyaltyRuleInput) {
  const serviceClient = createSupabaseServiceClient();
  if (!serviceClient) {
    if (input.id) {
      const index = fallbackRules.findIndex((row) => row.id === input.id);
      if (index !== -1) {
        fallbackRules[index] = {
          ...fallbackRules[index],
          name: input.name,
          pointsPerEur: input.pointsPerEur,
          minRedeemPoints: input.minRedeemPoints,
          rewardType: input.rewardType,
          active: input.active,
          updatedAt: nowIso(),
        };
      }
      return;
    }
    fallbackRules.unshift({
      id: `rule-${Date.now()}`,
      name: input.name,
      pointsPerEur: input.pointsPerEur,
      minRedeemPoints: input.minRedeemPoints,
      rewardType: input.rewardType,
      active: input.active,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    });
    return;
  }

  const payload = {
    name: input.name,
    points_per_eur: input.pointsPerEur,
    min_redeem_points: input.minRedeemPoints,
    reward_type: input.rewardType,
    active: input.active,
  };

  if (input.id) {
    const { error } = await serviceClient
      .from("loyalty_rules")
      .update(payload)
      .eq("id", input.id);
    if (error) {
      throw new Error(error.message);
    }
    return;
  }

  const { error } = await serviceClient.from("loyalty_rules").insert(payload);
  if (error) {
    throw new Error(error.message);
  }
}

export async function listAdminLoyaltyAccounts({
  search,
}: ListFilterParams = {}): Promise<AdminLoyaltyAccount[]> {
  const serviceClient = createSupabaseServiceClient();
  if (!serviceClient) {
    return fallbackAccounts.filter((account) => includesSearch(account.tier, search));
  }

  let query = serviceClient
    .from("loyalty_accounts")
    .select("id, customer_profile_id, points_balance, tier, created_at, updated_at")
    .order("updated_at", { ascending: false })
    .limit(120);

  if (search) {
    query = query.ilike("tier", `%${search}%`);
  }

  const { data, error } = await query;
  if (error || !data) {
    return [];
  }

  return data.map((row) => ({
    id: row.id as string,
    customerProfileId: row.customer_profile_id as string,
    pointsBalance: Number(row.points_balance),
    tier: row.tier as string,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  }));
}

export async function awardLoyaltyPointsForOrder(input: {
  customerName?: string | null;
  email?: string | null;
  phone?: string | null;
  orderId: string;
  orderTotal: number;
}) {
  const serviceClient = createSupabaseServiceClient();
  if (!serviceClient || input.orderTotal <= 0) {
    return;
  }

  const activeRules = await listAdminLoyaltyRules();
  const rule = activeRules.find((row) => row.active);
  if (!rule) {
    return;
  }

  const customerProfileId = await ensureCustomerProfile({
    name: input.customerName,
    email: input.email,
    phone: input.phone,
  });

  if (!customerProfileId) {
    return;
  }

  const points = Math.max(0, Math.round(input.orderTotal * rule.pointsPerEur));
  if (points === 0) {
    return;
  }

  const { data: existingAccount, error: accountError } = await serviceClient
    .from("loyalty_accounts")
    .select("id, points_balance")
    .eq("customer_profile_id", customerProfileId)
    .maybeSingle();

  if (accountError) {
    throw new Error(accountError.message);
  }

  let accountId = existingAccount?.id as string | undefined;
  if (!accountId) {
    const { data, error } = await serviceClient
      .from("loyalty_accounts")
      .insert({
        customer_profile_id: customerProfileId,
        points_balance: points,
        tier: "standard",
      })
      .select("id")
      .single();

    if (error || !data) {
      throw new Error(error?.message ?? "Failed to create loyalty account.");
    }
    accountId = data.id as string;
  } else {
    const currentBalance = Number(existingAccount?.points_balance ?? 0);
    const { error } = await serviceClient
      .from("loyalty_accounts")
      .update({ points_balance: currentBalance + points })
      .eq("id", accountId);
    if (error) {
      throw new Error(error.message);
    }
  }

  const { error: ledgerError } = await serviceClient.from("loyalty_ledger").insert({
    loyalty_account_id: accountId,
    points_delta: points,
    reason: "order_created",
    reference_type: "order",
    reference_id: input.orderId,
  });

  if (ledgerError) {
    throw new Error(ledgerError.message);
  }
}

export async function listAdminAffiliates({
  search,
  status,
}: ListFilterParams = {}): Promise<AdminAffiliate[]> {
  const serviceClient = createSupabaseServiceClient();
  if (!serviceClient) {
    return fallbackAffiliates
      .filter((affiliate) => (status ? affiliate.status === status : true))
      .filter((affiliate) => includesSearch(`${affiliate.name} ${affiliate.code}`, search));
  }

  let query = serviceClient
    .from("affiliates")
    .select("id, name, email, code, status, commission_rate, notes, created_at, updated_at")
    .order("updated_at", { ascending: false })
    .limit(200);

  if (status) {
    query = query.eq("status", status);
  }
  if (search) {
    query = query.or(`name.ilike.%${search}%,code.ilike.%${search}%`);
  }

  const { data, error } = await query;
  if (error || !data) {
    return [];
  }

  return data.map((row) => ({
    id: row.id as string,
    name: row.name as string,
    email: (row.email as string | null) ?? null,
    code: row.code as string,
    status: row.status as AffiliateStatus,
    commissionRate: Number(row.commission_rate),
    notes: (row.notes as string | null) ?? null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  }));
}

export async function upsertAdminAffiliate(input: UpsertAffiliateInput) {
  const normalizedCode = input.code.trim().toUpperCase();
  const serviceClient = createSupabaseServiceClient();
  if (!serviceClient) {
    if (input.id) {
      const index = fallbackAffiliates.findIndex((row) => row.id === input.id);
      if (index !== -1) {
        fallbackAffiliates[index] = {
          ...fallbackAffiliates[index],
          name: input.name,
          email: input.email ?? null,
          code: normalizedCode,
          status: input.status,
          commissionRate: input.commissionRate,
          notes: input.notes ?? null,
          updatedAt: nowIso(),
        };
      }
      return;
    }

    fallbackAffiliates.unshift({
      id: `aff-${Date.now()}`,
      name: input.name,
      email: input.email ?? null,
      code: normalizedCode,
      status: input.status,
      commissionRate: input.commissionRate,
      notes: input.notes ?? null,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    });
    return;
  }

  const payload = {
    name: input.name,
    email: input.email ?? null,
    code: normalizedCode,
    status: input.status,
    commission_rate: input.commissionRate,
    notes: input.notes ?? null,
  };

  if (input.id) {
    const { error } = await serviceClient
      .from("affiliates")
      .update(payload)
      .eq("id", input.id);
    if (error) {
      throw new Error(error.message);
    }
    return;
  }

  const { error } = await serviceClient.from("affiliates").insert(payload);
  if (error) {
    throw new Error(error.message);
  }
}

export async function listAdminAffiliatePayouts({
  status,
}: ListFilterParams = {}): Promise<AdminAffiliatePayout[]> {
  const serviceClient = createSupabaseServiceClient();
  if (!serviceClient) {
    return fallbackPayouts.filter((payout) => (status ? payout.status === status : true));
  }

  let query = serviceClient
    .from("affiliate_payouts")
    .select(
      "id, affiliate_id, period_start, period_end, amount, status, paid_at, reference, created_at, updated_at",
    )
    .order("created_at", { ascending: false })
    .limit(200);

  if (status) {
    query = query.eq("status", status);
  }

  const { data, error } = await query;
  if (error || !data) {
    return [];
  }

  return data.map((row) => ({
    id: row.id as string,
    affiliateId: row.affiliate_id as string,
    periodStart: (row.period_start as string | null) ?? null,
    periodEnd: (row.period_end as string | null) ?? null,
    amount: Number(row.amount),
    status: row.status as PayoutStatus,
    paidAt: (row.paid_at as string | null) ?? null,
    reference: (row.reference as string | null) ?? null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  }));
}

export async function upsertAdminAffiliatePayout(input: UpsertAffiliatePayoutInput) {
  const serviceClient = createSupabaseServiceClient();
  if (!serviceClient) {
    if (input.id) {
      const index = fallbackPayouts.findIndex((row) => row.id === input.id);
      if (index !== -1) {
        fallbackPayouts[index] = {
          ...fallbackPayouts[index],
          affiliateId: input.affiliateId,
          periodStart: input.periodStart ?? null,
          periodEnd: input.periodEnd ?? null,
          amount: input.amount,
          status: input.status,
          paidAt: input.paidAt ?? null,
          reference: input.reference ?? null,
          updatedAt: nowIso(),
        };
      }
      return;
    }

    fallbackPayouts.unshift({
      id: `payout-${Date.now()}`,
      affiliateId: input.affiliateId,
      periodStart: input.periodStart ?? null,
      periodEnd: input.periodEnd ?? null,
      amount: input.amount,
      status: input.status,
      paidAt: input.paidAt ?? null,
      reference: input.reference ?? null,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    });
    return;
  }

  const payload = {
    affiliate_id: input.affiliateId,
    period_start: input.periodStart ?? null,
    period_end: input.periodEnd ?? null,
    amount: input.amount,
    status: input.status,
    paid_at: input.paidAt ?? null,
    reference: input.reference ?? null,
  };

  if (input.id) {
    const { error } = await serviceClient
      .from("affiliate_payouts")
      .update(payload)
      .eq("id", input.id);
    if (error) {
      throw new Error(error.message);
    }
    return;
  }

  const { error } = await serviceClient.from("affiliate_payouts").insert(payload);
  if (error) {
    throw new Error(error.message);
  }
}

export async function findAffiliateByCode(code?: string | null) {
  const normalizedCode = code?.trim().toUpperCase();
  if (!normalizedCode) {
    return null;
  }

  const serviceClient = createSupabaseServiceClient();
  if (!serviceClient) {
    return fallbackAffiliates.find(
      (affiliate) =>
        affiliate.code.toUpperCase() === normalizedCode && affiliate.status === "active",
    );
  }

  const { data, error } = await serviceClient
    .from("affiliates")
    .select("id, name, email, code, status, commission_rate, notes, created_at, updated_at")
    .eq("code", normalizedCode)
    .eq("status", "active")
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return {
    id: data.id as string,
    name: data.name as string,
    email: (data.email as string | null) ?? null,
    code: data.code as string,
    status: data.status as AffiliateStatus,
    commissionRate: Number(data.commission_rate),
    notes: (data.notes as string | null) ?? null,
    createdAt: data.created_at as string,
    updatedAt: data.updated_at as string,
  } satisfies AdminAffiliate;
}

export async function trackAffiliateClick(input: {
  code: string;
  source?: string | null;
  landingPage?: string | null;
  visitorId?: string | null;
}) {
  const affiliate = await findAffiliateByCode(input.code);
  if (!affiliate) {
    return null;
  }

  const serviceClient = createSupabaseServiceClient();
  if (!serviceClient) {
    return affiliate;
  }

  const { error } = await serviceClient.from("affiliate_clicks").insert({
    affiliate_id: affiliate.id,
    source: input.source ?? null,
    landing_page: input.landingPage ?? null,
    visitor_id: input.visitorId ?? null,
  });

  if (error) {
    throw new Error(error.message);
  }

  return affiliate;
}

export async function recordAffiliateConversion(input: {
  affiliateCode?: string | null;
  orderId: string;
  orderTotal: number;
}) {
  const affiliate = await findAffiliateByCode(input.affiliateCode);
  if (!affiliate) {
    return;
  }

  const commissionAmount = Math.max(
    0,
    Math.round(input.orderTotal * affiliate.commissionRate * 100) / 100,
  );

  const serviceClient = createSupabaseServiceClient();
  if (!serviceClient) {
    return;
  }

  const { error } = await serviceClient.from("affiliate_conversions").insert({
    affiliate_id: affiliate.id,
    order_id: input.orderId,
    commission_amount: commissionAmount,
    status: "pending",
  });

  if (error) {
    throw new Error(error.message);
  }
}
