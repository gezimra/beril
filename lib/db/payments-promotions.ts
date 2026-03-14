import { createSupabaseServiceClient } from "@/lib/db/supabase/service";
import { ensureCustomerProfile } from "@/lib/db/crm-support";
import { syncOrderCashbookByOrderId } from "@/lib/db/order-cashbook-sync";
import { normalizeEmail, normalizePhone } from "@/lib/utils/codes";
import type {
  AdminCampaign,
  AdminCoupon,
  AdminPaymentTransaction,
  AdminPromotion,
} from "@/types/admin";
import type {
  CampaignStatus,
  CouponStatus,
  PaymentMethod,
  PaymentProvider,
  PaymentStatus,
  PaymentTransactionStatus,
  PromotionScope,
  PromotionStatus,
  PromotionType,
} from "@/types/domain";

interface ListFilterParams {
  search?: string;
  status?: string;
  page?: number;
}

const PAGE_SIZE_TRANSACTIONS = 30;

interface UpsertCampaignInput {
  id?: string;
  name: string;
  slug: string;
  description?: string | null;
  status: CampaignStatus;
  startsAt?: string | null;
  endsAt?: string | null;
  budget?: number | null;
}

interface UpsertPromotionInput {
  id?: string;
  campaignId?: string | null;
  name: string;
  status: PromotionStatus;
  type: PromotionType;
  scope: PromotionScope;
  percentageOff?: number | null;
  amountOff?: number | null;
  minOrderTotal?: number;
  isStackable?: boolean;
  startsAt?: string | null;
  endsAt?: string | null;
}

interface UpsertCouponInput {
  id?: string;
  promotionId: string;
  code: string;
  status: CouponStatus;
  usageLimit?: number | null;
  perCustomerLimit?: number;
  startsAt?: string | null;
  endsAt?: string | null;
}

interface CouponValidationInput {
  code: string;
  subtotal: number;
  email?: string | null;
  phone?: string | null;
  customerUserId?: string | null;
}

interface CouponValidationResult {
  valid: boolean;
  reason?: string;
  couponId?: string;
  code?: string;
  discountAmount?: number;
  promotionId?: string;
  customerProfileId?: string | null;
  customerAssignmentId?: string | null;
}

interface PaymentTransactionCreateInput {
  orderId: string;
  provider: PaymentProvider;
  method: PaymentMethod;
  status: PaymentTransactionStatus;
  amount: number;
  providerReference?: string | null;
  providerPayload?: Record<string, unknown>;
}

const fallbackCampaigns: AdminCampaign[] = [];
const fallbackPromotions: AdminPromotion[] = [];
const fallbackCoupons: AdminCoupon[] = [];
const fallbackTransactions: AdminPaymentTransaction[] = [];

export interface CustomerCouponView {
  code: string;
  promotionName: string;
  status: string;
  startsAt: string | null;
  endsAt: string | null;
  maxRedemptions: number | null;
  redemptionCount: number;
}

const nowIso = () => new Date().toISOString();

function includesSearch(source: string, search?: string) {
  if (!search) {
    return true;
  }

  return source.toLowerCase().includes(search.toLowerCase());
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value.trim(),
  );
}

function isIsoDateActive(startsAt: string | null, endsAt: string | null): boolean {
  const now = Date.now();
  const starts = startsAt ? Date.parse(startsAt) : null;
  const ends = endsAt ? Date.parse(endsAt) : null;

  if (starts && Number.isFinite(starts) && now < starts) {
    return false;
  }

  if (ends && Number.isFinite(ends) && now > ends) {
    return false;
  }

  return true;
}

function safeRoundMoney(amount: number) {
  return Math.max(0, Math.round(amount * 100) / 100);
}

function toPaymentStatus(status: PaymentTransactionStatus): PaymentStatus {
  switch (status) {
    case "paid":
      return "paid";
    case "authorized":
      return "authorized";
    case "failed":
      return "failed";
    case "refunded":
      return "refunded";
    case "cancelled":
      return "cancelled";
    case "initiated":
    case "pending":
    default:
      return "pending";
  }
}

export async function listAdminCampaigns({
  search,
  status,
  page = 1,
}: ListFilterParams = {}): Promise<AdminCampaign[]> {
  const serviceClient = createSupabaseServiceClient();
  if (!serviceClient) {
    return fallbackCampaigns
      .filter((campaign) => (status ? campaign.status === status : true))
      .filter((campaign) =>
        includesSearch(`${campaign.name} ${campaign.slug}`, search),
      );
  }

  const from = (page - 1) * PAGE_SIZE_TRANSACTIONS;
  const to = from + PAGE_SIZE_TRANSACTIONS - 1;

  let query = serviceClient
    .from("campaigns")
    .select(
      "id, name, slug, description, status, starts_at, ends_at, budget, created_at, updated_at",
    )
    .order("created_at", { ascending: false })
    .range(from, to);

  if (status) {
    query = query.eq("status", status);
  }
  if (search) {
    query = query.or(`name.ilike.%${search}%,slug.ilike.%${search}%`);
  }

  const { data, error } = await query;
  if (error || !data) {
    return [];
  }

  return data.map((row) => ({
    id: row.id as string,
    name: row.name as string,
    slug: row.slug as string,
    description: (row.description as string | null) ?? null,
    status: row.status as CampaignStatus,
    startsAt: (row.starts_at as string | null) ?? null,
    endsAt: (row.ends_at as string | null) ?? null,
    budget: (row.budget as number | null) ?? null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  }));
}

export async function upsertAdminCampaign(input: UpsertCampaignInput) {
  const serviceClient = createSupabaseServiceClient();
  if (!serviceClient) {
    if (input.id) {
      const index = fallbackCampaigns.findIndex((campaign) => campaign.id === input.id);
      if (index !== -1) {
        fallbackCampaigns[index] = {
          ...fallbackCampaigns[index],
          name: input.name,
          slug: input.slug,
          description: input.description ?? null,
          status: input.status,
          startsAt: input.startsAt ?? null,
          endsAt: input.endsAt ?? null,
          budget: input.budget ?? null,
          updatedAt: nowIso(),
        };
      }
      return;
    }

    fallbackCampaigns.unshift({
      id: `camp-${Date.now()}`,
      name: input.name,
      slug: input.slug,
      description: input.description ?? null,
      status: input.status,
      startsAt: input.startsAt ?? null,
      endsAt: input.endsAt ?? null,
      budget: input.budget ?? null,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    });
    return;
  }

  const payload = {
    name: input.name,
    slug: input.slug,
    description: input.description ?? null,
    status: input.status,
    starts_at: input.startsAt ?? null,
    ends_at: input.endsAt ?? null,
    budget: input.budget ?? null,
  };

  if (input.id) {
    const { error } = await serviceClient
      .from("campaigns")
      .update(payload)
      .eq("id", input.id);

    if (error) {
      throw new Error(error.message);
    }
    return;
  }

  const { error } = await serviceClient.from("campaigns").insert(payload);
  if (error) {
    throw new Error(error.message);
  }
}

export async function listAdminPromotions({
  search,
  status,
  page = 1,
}: ListFilterParams = {}): Promise<AdminPromotion[]> {
  const serviceClient = createSupabaseServiceClient();
  if (!serviceClient) {
    return fallbackPromotions
      .filter((promotion) => (status ? promotion.status === status : true))
      .filter((promotion) => includesSearch(promotion.name, search));
  }

  const from = (page - 1) * PAGE_SIZE_TRANSACTIONS;
  const to = from + PAGE_SIZE_TRANSACTIONS - 1;

  let query = serviceClient
    .from("promotions")
    .select(
      "id, campaign_id, name, status, type, scope, percentage_off, amount_off, min_order_total, is_stackable, starts_at, ends_at, created_at, updated_at",
    )
    .order("created_at", { ascending: false })
    .range(from, to);

  if (status) {
    query = query.eq("status", status);
  }
  if (search) {
    query = query.ilike("name", `%${search}%`);
  }

  const { data, error } = await query;
  if (error || !data) {
    return [];
  }

  return data.map((row) => ({
    id: row.id as string,
    campaignId: (row.campaign_id as string | null) ?? null,
    name: row.name as string,
    status: row.status as PromotionStatus,
    type: row.type as PromotionType,
    scope: row.scope as PromotionScope,
    percentageOff: (row.percentage_off as number | null) ?? null,
    amountOff: (row.amount_off as number | null) ?? null,
    minOrderTotal: Number(row.min_order_total),
    isStackable: Boolean(row.is_stackable),
    startsAt: (row.starts_at as string | null) ?? null,
    endsAt: (row.ends_at as string | null) ?? null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  }));
}

export async function upsertAdminPromotion(input: UpsertPromotionInput) {
  const serviceClient = createSupabaseServiceClient();
  if (!serviceClient) {
    if (input.id) {
      const index = fallbackPromotions.findIndex((promotion) => promotion.id === input.id);
      if (index !== -1) {
        fallbackPromotions[index] = {
          ...fallbackPromotions[index],
          campaignId: input.campaignId ?? null,
          name: input.name,
          status: input.status,
          type: input.type,
          scope: input.scope,
          percentageOff: input.percentageOff ?? null,
          amountOff: input.amountOff ?? null,
          minOrderTotal: input.minOrderTotal ?? 0,
          isStackable: input.isStackable ?? false,
          startsAt: input.startsAt ?? null,
          endsAt: input.endsAt ?? null,
          updatedAt: nowIso(),
        };
      }
      return;
    }

    fallbackPromotions.unshift({
      id: `promo-${Date.now()}`,
      campaignId: input.campaignId ?? null,
      name: input.name,
      status: input.status,
      type: input.type,
      scope: input.scope,
      percentageOff: input.percentageOff ?? null,
      amountOff: input.amountOff ?? null,
      minOrderTotal: input.minOrderTotal ?? 0,
      isStackable: input.isStackable ?? false,
      startsAt: input.startsAt ?? null,
      endsAt: input.endsAt ?? null,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    });
    return;
  }

  const payload = {
    campaign_id: input.campaignId ?? null,
    name: input.name,
    status: input.status,
    type: input.type,
    scope: input.scope,
    percentage_off: input.percentageOff ?? null,
    amount_off: input.amountOff ?? null,
    min_order_total: input.minOrderTotal ?? 0,
    is_stackable: input.isStackable ?? false,
    starts_at: input.startsAt ?? null,
    ends_at: input.endsAt ?? null,
  };

  if (input.id) {
    const { error } = await serviceClient
      .from("promotions")
      .update(payload)
      .eq("id", input.id);

    if (error) {
      throw new Error(error.message);
    }
    return;
  }

  const { error } = await serviceClient.from("promotions").insert(payload);
  if (error) {
    throw new Error(error.message);
  }
}

export async function listAdminCoupons({
  search,
  status,
  page = 1,
}: ListFilterParams = {}): Promise<AdminCoupon[]> {
  const serviceClient = createSupabaseServiceClient();
  if (!serviceClient) {
    return fallbackCoupons
      .filter((coupon) => (status ? coupon.status === status : true))
      .filter((coupon) => includesSearch(coupon.code, search));
  }

  const from = (page - 1) * PAGE_SIZE_TRANSACTIONS;
  const to = from + PAGE_SIZE_TRANSACTIONS - 1;

  let query = serviceClient
    .from("coupon_codes")
    .select(
      "id, promotion_id, code, status, usage_limit, usage_count, per_customer_limit, starts_at, ends_at, created_at, updated_at",
    )
    .order("created_at", { ascending: false })
    .range(from, to);

  if (status) {
    query = query.eq("status", status);
  }
  if (search) {
    query = query.ilike("code", `%${search}%`);
  }

  const { data, error } = await query;
  if (error || !data) {
    return [];
  }

  return data.map((row) => ({
    id: row.id as string,
    promotionId: row.promotion_id as string,
    code: row.code as string,
    status: row.status as CouponStatus,
    usageLimit: (row.usage_limit as number | null) ?? null,
    usageCount: Number(row.usage_count),
    perCustomerLimit: Number(row.per_customer_limit),
    startsAt: (row.starts_at as string | null) ?? null,
    endsAt: (row.ends_at as string | null) ?? null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  }));
}

export async function upsertAdminCoupon(input: UpsertCouponInput) {
  const normalizedCode = input.code.trim().toUpperCase();
  const serviceClient = createSupabaseServiceClient();

  if (!serviceClient) {
    if (input.id) {
      const index = fallbackCoupons.findIndex((coupon) => coupon.id === input.id);
      if (index !== -1) {
        fallbackCoupons[index] = {
          ...fallbackCoupons[index],
          promotionId: input.promotionId,
          code: normalizedCode,
          status: input.status,
          usageLimit: input.usageLimit ?? null,
          perCustomerLimit: input.perCustomerLimit ?? 1,
          startsAt: input.startsAt ?? null,
          endsAt: input.endsAt ?? null,
          updatedAt: nowIso(),
        };
      }
      return;
    }

    fallbackCoupons.unshift({
      id: `coupon-${Date.now()}`,
      promotionId: input.promotionId,
      code: normalizedCode,
      status: input.status,
      usageLimit: input.usageLimit ?? null,
      usageCount: 0,
      perCustomerLimit: input.perCustomerLimit ?? 1,
      startsAt: input.startsAt ?? null,
      endsAt: input.endsAt ?? null,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    });
    return;
  }

  const payload = {
    promotion_id: input.promotionId,
    code: normalizedCode,
    status: input.status,
    usage_limit: input.usageLimit ?? null,
    per_customer_limit: input.perCustomerLimit ?? 1,
    starts_at: input.startsAt ?? null,
    ends_at: input.endsAt ?? null,
  };

  if (input.id) {
    const { error } = await serviceClient
      .from("coupon_codes")
      .update(payload)
      .eq("id", input.id);

    if (error) {
      throw new Error(error.message);
    }
    return;
  }

  const { error } = await serviceClient.from("coupon_codes").insert(payload);
  if (error) {
    throw new Error(error.message);
  }
}

async function resolveCustomerProfileIdByIdentity(input: {
  serviceClient: ReturnType<typeof createSupabaseServiceClient>;
  customerUserId?: string | null;
  email?: string | null;
  phone?: string | null;
}) {
  if (!input.serviceClient) {
    return null;
  }

  if (input.customerUserId) {
    const { data: linkedAccount } = await input.serviceClient
      .from("customer_user_accounts")
      .select("customer_profile_id")
      .eq("user_id", input.customerUserId)
      .maybeSingle();

    if (linkedAccount?.customer_profile_id) {
      return linkedAccount.customer_profile_id as string;
    }
  }

  const normalizedEmail = input.email ? normalizeEmail(input.email) : null;
  const normalizedPhone = input.phone ? normalizePhone(input.phone) : null;

  if (normalizedEmail) {
    const { data: byEmail } = await input.serviceClient
      .from("customer_profiles")
      .select("id")
      .eq("email_normalized", normalizedEmail)
      .maybeSingle();

    if (byEmail?.id) {
      return byEmail.id as string;
    }
  }

  if (normalizedPhone) {
    const { data: byPhone } = await input.serviceClient
      .from("customer_profiles")
      .select("id")
      .eq("phone_normalized", normalizedPhone)
      .maybeSingle();

    if (byPhone?.id) {
      return byPhone.id as string;
    }
  }

  return null;
}

export async function validateCouponForOrder(
  input: CouponValidationInput,
): Promise<CouponValidationResult> {
  const code = input.code.trim().toUpperCase();
  if (!code) {
    return { valid: false, reason: "Ju lutem vendos kodin e kuponit." };
  }

  if (input.subtotal <= 0) {
    return { valid: false, reason: "Shporta eshte bosh." };
  }

  const serviceClient = createSupabaseServiceClient();
  if (!serviceClient) {
    return { valid: false, reason: "Kuponet kerkojne konfigurim serveri." };
  }

  const { data, error } = await serviceClient
    .from("coupon_codes")
    .select(
      `
      id,
      code,
      status,
      usage_limit,
      usage_count,
      per_customer_limit,
      starts_at,
      ends_at,
      promotion:promotions(
        id,
        status,
        type,
        min_order_total,
        percentage_off,
        amount_off,
        starts_at,
        ends_at
      )
      `,
    )
    .eq("code", code)
    .maybeSingle();

  if (error || !data) {
    return { valid: false, reason: "Kuponi nuk u gjet." };
  }

  if ((data.status as CouponStatus) !== "active") {
    return { valid: false, reason: "Kuponi nuk eshte aktiv." };
  }

  if (!isIsoDateActive(data.starts_at as string | null, data.ends_at as string | null)) {
    return { valid: false, reason: "Kuponi nuk eshte ne periudhe aktive." };
  }

  const promotionValue = data.promotion as
    | Record<string, unknown>
    | Array<Record<string, unknown>>
    | null;
  const promotion = Array.isArray(promotionValue)
    ? promotionValue[0]
    : promotionValue;
  if (!promotion) {
    return { valid: false, reason: "Kuponi nuk ka promocion valid." };
  }

  if ((promotion.status as PromotionStatus) !== "active") {
    return { valid: false, reason: "Promocioni i kuponit nuk eshte aktiv." };
  }

  if (
    !isIsoDateActive(
      (promotion.starts_at as string | null) ?? null,
      (promotion.ends_at as string | null) ?? null,
    )
  ) {
    return { valid: false, reason: "Promocioni i kuponit ka skaduar." };
  }

  const usageLimit = (data.usage_limit as number | null) ?? null;
  const usageCount = Number(data.usage_count);
  if (usageLimit !== null && usageCount >= usageLimit) {
    return { valid: false, reason: "Kuponi ka arritur limitin e perdorimit." };
  }

  const minOrderTotal = Number(promotion.min_order_total ?? 0);
  if (input.subtotal < minOrderTotal) {
    return {
      valid: false,
      reason: `Kuponi aplikohet per porosi mbi ${minOrderTotal.toFixed(2)} EUR.`,
    };
  }

  const normalizedEmail = input.email ? normalizeEmail(input.email) : null;
  const normalizedPhone = input.phone ? normalizePhone(input.phone) : null;
  const perCustomerLimit = Number(data.per_customer_limit ?? 1);
  const customerProfileId = await resolveCustomerProfileIdByIdentity({
    serviceClient,
    customerUserId: input.customerUserId ?? null,
    email: input.email ?? null,
    phone: input.phone ?? null,
  });

  const { data: assignmentRows } = await serviceClient
    .from("customer_coupon_assignments")
    .select(
      "id, customer_profile_id, status, starts_at, ends_at, max_redemptions, redemption_count",
    )
    .eq("coupon_id", data.id as string);

  const hasTargetedAssignments = Boolean(assignmentRows && assignmentRows.length > 0);
  let matchedAssignment:
    | {
        id: string;
        status: string;
        starts_at: string | null;
        ends_at: string | null;
        max_redemptions: number | null;
        redemption_count: number;
      }
    | null = null;

  if (hasTargetedAssignments) {
    if (!customerProfileId) {
      return {
        valid: false,
        reason: "Ky kupon eshte i rezervuar per kliente me llogari.",
      };
    }

    matchedAssignment =
      assignmentRows?.find(
        (assignment) =>
          (assignment.customer_profile_id as string) === customerProfileId,
      ) ?? null;

    if (!matchedAssignment) {
      return {
        valid: false,
        reason: "Kuponi nuk eshte caktuar per llogarine tuaj.",
      };
    }

    if (matchedAssignment.status !== "active") {
      return {
        valid: false,
        reason: "Kuponi personal nuk eshte aktiv.",
      };
    }

    if (
      !isIsoDateActive(
        matchedAssignment.starts_at ?? null,
        matchedAssignment.ends_at ?? null,
      )
    ) {
      return {
        valid: false,
        reason: "Kuponi personal nuk eshte ne periudhe aktive.",
      };
    }

    if (
      matchedAssignment.max_redemptions !== null &&
      matchedAssignment.redemption_count >= matchedAssignment.max_redemptions
    ) {
      return {
        valid: false,
        reason: "Kuponi personal ka arritur limitin e perdorimit.",
      };
    }
  }

  if (perCustomerLimit > 0 && (normalizedEmail || normalizedPhone)) {
    let redemptionQuery = serviceClient
      .from("coupon_redemptions")
      .select("id", { head: true, count: "exact" })
      .eq("coupon_id", data.id as string);

    if (normalizedEmail && normalizedPhone) {
      redemptionQuery = redemptionQuery.or(
        `customer_email_normalized.eq.${normalizedEmail},customer_phone_normalized.eq.${normalizedPhone}`,
      );
    } else if (normalizedEmail) {
      redemptionQuery = redemptionQuery.eq("customer_email_normalized", normalizedEmail);
    } else if (normalizedPhone) {
      redemptionQuery = redemptionQuery.eq("customer_phone_normalized", normalizedPhone);
    }

    const { count, error: redemptionError } = await redemptionQuery;
    if (!redemptionError && typeof count === "number" && count >= perCustomerLimit) {
      return { valid: false, reason: "Ky kupon eshte perdorur me pare nga ky klient." };
    }
  }

  let discountAmount = 0;
  const promotionType = promotion.type as PromotionType;
  if (promotionType === "percentage") {
    discountAmount = (input.subtotal * Number(promotion.percentage_off ?? 0)) / 100;
  } else if (promotionType === "fixed_amount") {
    discountAmount = Number(promotion.amount_off ?? 0);
  } else if (promotionType === "free_shipping") {
    discountAmount = 0;
  }

  discountAmount = safeRoundMoney(Math.min(input.subtotal, discountAmount));

  if (discountAmount <= 0) {
    return { valid: false, reason: "Kuponi nuk jep ulje ne kete porosi." };
  }

  return {
    valid: true,
    couponId: data.id as string,
    code: data.code as string,
    discountAmount,
    promotionId: promotion.id as string,
    customerProfileId,
    customerAssignmentId: matchedAssignment?.id ?? null,
  };
}

export async function recordCouponRedemption(input: {
  couponId: string;
  orderId: string;
  discountAmount: number;
  email?: string | null;
  phone?: string | null;
  customerAssignmentId?: string | null;
}) {
  const serviceClient = createSupabaseServiceClient();
  if (!serviceClient) {
    return;
  }

  const { error: insertError } = await serviceClient.from("coupon_redemptions").insert({
    coupon_id: input.couponId,
    order_id: input.orderId,
    customer_email_normalized: input.email ? normalizeEmail(input.email) : null,
    customer_phone_normalized: input.phone ? normalizePhone(input.phone) : null,
    amount_discount: safeRoundMoney(input.discountAmount),
  });

  if (insertError) {
    throw new Error(insertError.message);
  }

  const { data: row, error: fetchError } = await serviceClient
    .from("coupon_codes")
    .select("usage_count")
    .eq("id", input.couponId)
    .single();

  if (!fetchError && row) {
    const { error } = await serviceClient
      .from("coupon_codes")
      .update({ usage_count: Number(row.usage_count) + 1 })
      .eq("id", input.couponId);

    if (error) {
      throw new Error(error.message);
    }
  }

  if (input.customerAssignmentId) {
    const { data: assignmentRow, error: assignmentFetchError } = await serviceClient
      .from("customer_coupon_assignments")
      .select("redemption_count")
      .eq("id", input.customerAssignmentId)
      .maybeSingle();

    if (!assignmentFetchError && assignmentRow) {
      const { error: assignmentUpdateError } = await serviceClient
        .from("customer_coupon_assignments")
        .update({ redemption_count: Number(assignmentRow.redemption_count ?? 0) + 1 })
        .eq("id", input.customerAssignmentId);

      if (assignmentUpdateError) {
        throw new Error(assignmentUpdateError.message);
      }
    }
  }
}

export async function assignCouponToCustomerByEmail(input: {
  couponId: string;
  email: string;
  status?: "active" | "paused" | "expired";
  startsAt?: string | null;
  endsAt?: string | null;
  maxRedemptions?: number | null;
}) {
  const serviceClient = createSupabaseServiceClient();
  if (!serviceClient) {
    return;
  }

  const customerProfileId = await ensureCustomerProfile({
    email: input.email,
    name: null,
    phone: null,
  });

  if (!customerProfileId) {
    throw new Error("Unable to resolve customer profile for this email.");
  }

  const { error } = await serviceClient.from("customer_coupon_assignments").upsert(
    {
      coupon_id: input.couponId,
      customer_profile_id: customerProfileId,
      status: input.status ?? "active",
      starts_at: input.startsAt ?? null,
      ends_at: input.endsAt ?? null,
      max_redemptions: input.maxRedemptions ?? null,
    },
    { onConflict: "coupon_id,customer_profile_id" },
  );

  if (error) {
    throw new Error(error.message);
  }
}

export async function listCustomerCouponsForUser(input: {
  customerUserId: string;
  email?: string | null;
}): Promise<CustomerCouponView[]> {
  const serviceClient = createSupabaseServiceClient();
  if (!serviceClient) {
    return [];
  }

  const customerProfileId = await resolveCustomerProfileIdByIdentity({
    serviceClient,
    customerUserId: input.customerUserId,
    email: input.email ?? null,
    phone: null,
  });

  if (!customerProfileId) {
    return [];
  }

  const { data, error } = await serviceClient
    .from("customer_coupon_assignments")
    .select(
      `
      id,
      status,
      starts_at,
      ends_at,
      max_redemptions,
      redemption_count,
      coupon:coupon_codes(
        code,
        status,
        starts_at,
        ends_at,
        promotion:promotions(name)
      )
      `,
    )
    .eq("customer_profile_id", customerProfileId)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error || !data) {
    return [];
  }

  return data
    .map((row) => {
      const couponValue = row.coupon as
        | Record<string, unknown>
        | Array<Record<string, unknown>>
        | null;
      const coupon = Array.isArray(couponValue) ? couponValue[0] : couponValue;
      if (!coupon) {
        return null;
      }

      const promotionValue = coupon.promotion as
        | Record<string, unknown>
        | Array<Record<string, unknown>>
        | null;
      const promotion = Array.isArray(promotionValue)
        ? promotionValue[0]
        : promotionValue;

      return {
        code: String(coupon.code),
        promotionName: String(promotion?.name ?? "Promotion"),
        status: String(row.status ?? coupon.status ?? "active"),
        startsAt: (row.starts_at as string | null) ?? (coupon.starts_at as string | null) ?? null,
        endsAt: (row.ends_at as string | null) ?? (coupon.ends_at as string | null) ?? null,
        maxRedemptions: (row.max_redemptions as number | null) ?? null,
        redemptionCount: Number(row.redemption_count ?? 0),
      } satisfies CustomerCouponView;
    })
    .filter((row): row is CustomerCouponView => row !== null);
}

export async function listAdminPaymentTransactions({
  search,
  status,
  page = 1,
}: ListFilterParams = {}): Promise<AdminPaymentTransaction[]> {
  const serviceClient = createSupabaseServiceClient();
  if (!serviceClient) {
    return fallbackTransactions
      .filter((transaction) => (status ? transaction.status === status : true))
      .filter((transaction) =>
        includesSearch(
          `${transaction.providerReference ?? ""} ${transaction.orderId}`,
          search,
        ),
      );
  }

  const from = (page - 1) * PAGE_SIZE_TRANSACTIONS;
  const to = from + PAGE_SIZE_TRANSACTIONS - 1;

  let query = serviceClient
    .from("payment_transactions")
    .select(
      "id, order_id, provider, method, status, amount, currency, provider_reference, created_at, updated_at",
    )
    .order("created_at", { ascending: false })
    .range(from, to);

  if (status) {
    query = query.eq("status", status);
  }

  if (search) {
    if (isUuid(search)) {
      query = query.eq("order_id", search.trim());
    } else {
      query = query.ilike("provider_reference", `%${search}%`);
    }
  }

  const { data, error } = await query;
  if (error || !data) {
    return [];
  }

  return data.map((row) => ({
    id: row.id as string,
    orderId: row.order_id as string,
    provider: row.provider as PaymentProvider,
    method: row.method as PaymentMethod,
    status: row.status as PaymentTransactionStatus,
    amount: Number(row.amount),
    currency: String(row.currency),
    providerReference: (row.provider_reference as string | null) ?? null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  }));
}

export async function createPaymentTransactionForOrder(
  input: PaymentTransactionCreateInput,
): Promise<{ id: string; status: PaymentTransactionStatus; providerReference: string | null }> {
  const serviceClient = createSupabaseServiceClient();
  if (!serviceClient) {
    const transaction: AdminPaymentTransaction = {
      id: `txn-${Date.now()}`,
      orderId: input.orderId,
      provider: input.provider,
      method: input.method,
      status: input.status,
      amount: input.amount,
      currency: "EUR",
      providerReference: input.providerReference ?? null,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    fallbackTransactions.unshift(transaction);
    return {
      id: transaction.id,
      status: transaction.status,
      providerReference: transaction.providerReference,
    };
  }

  const { data, error } = await serviceClient
    .from("payment_transactions")
    .insert({
      order_id: input.orderId,
      provider: input.provider,
      method: input.method,
      status: input.status,
      amount: safeRoundMoney(input.amount),
      currency: "EUR",
      provider_reference: input.providerReference ?? null,
      provider_payload: input.providerPayload ?? {},
    })
    .select("id, status, provider_reference")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to create payment transaction.");
  }

  return {
    id: data.id as string,
    status: data.status as PaymentTransactionStatus,
    providerReference: (data.provider_reference as string | null) ?? null,
  };
}

export async function updateAdminPaymentTransactionStatus(
  transactionId: string,
  status: PaymentTransactionStatus,
  note?: string | null,
) {
  const serviceClient = createSupabaseServiceClient();
  if (!serviceClient) {
    const transaction = fallbackTransactions.find((row) => row.id === transactionId);
    if (!transaction) {
      return;
    }
    transaction.status = status;
    transaction.updatedAt = nowIso();
    return;
  }

  const { data: transaction, error: transactionError } = await serviceClient
    .from("payment_transactions")
    .update({
      status,
      failure_reason: status === "failed" ? note ?? "Failed manually from admin" : null,
    })
    .eq("id", transactionId)
    .select("id, order_id")
    .single();

  if (transactionError || !transaction) {
    throw new Error(transactionError?.message ?? "Transaction not found.");
  }

  const { error: eventError } = await serviceClient.from("payment_events").insert({
    transaction_id: transactionId,
    event_type: `manual_${status}`,
    event_payload: { note: note ?? null },
  });
  if (eventError) {
    throw new Error(eventError.message);
  }

  const { error: orderError } = await serviceClient
    .from("orders")
    .update({ payment_status: toPaymentStatus(status) })
    .eq("id", transaction.order_id as string);

  if (orderError) {
    throw new Error(orderError.message);
  }

  await syncOrderCashbookByOrderId(String(transaction.order_id));
}
