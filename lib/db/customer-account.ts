import { createSupabaseServiceClient } from "@/lib/db/supabase/service";
import { createSupabaseServerClient } from "@/lib/db/supabase/server";
import { ensureCustomerProfile } from "@/lib/db/crm-support";
import { listCustomerCouponsForUser, type CustomerCouponView } from "@/lib/db/payments-promotions";
import { normalizeEmail, normalizePhone } from "@/lib/utils/codes";
import type { OrderStatus, PaymentMethod, PaymentStatus } from "@/types/domain";

export interface CustomerAccountUser {
  id: string;
  email: string;
  fullName: string | null;
}

export interface CustomerOrderItem {
  productTitle: string;
  productBrand: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface CustomerOrderHistoryEvent {
  status: OrderStatus;
  note: string | null;
  createdAt: string;
}

export interface CustomerOrderSummary {
  id: string;
  orderCode: string;
  orderStatus: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  subtotal: number;
  deliveryFee: number;
  discountAmount: number;
  total: number;
  createdAt: string;
  items: CustomerOrderItem[];
  history: CustomerOrderHistoryEvent[];
}

export interface CustomerCheckoutProfile {
  customerName: string;
  phone: string;
  email: string;
  country: string;
  city: string;
  address: string;
}

export interface CustomerCheckoutProfileUpdate {
  customerName: string;
  phone: string;
  country: string;
  city: string;
  address: string;
}

export async function getAuthenticatedCustomerUser(): Promise<CustomerAccountUser | null> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return null;
  }

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user || !user.email) {
    return null;
  }

  return {
    id: user.id,
    email: user.email,
    fullName:
      typeof user.user_metadata?.full_name === "string"
        ? user.user_metadata.full_name
        : null,
  };
}

async function resolveCustomerProfileIdForUser(
  user: CustomerAccountUser,
): Promise<string | null> {
  const serviceClient = createSupabaseServiceClient();
  if (!serviceClient) {
    return null;
  }

  const { data: linkedAccount } = await serviceClient
    .from("customer_user_accounts")
    .select("customer_profile_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (linkedAccount?.customer_profile_id) {
    return linkedAccount.customer_profile_id as string;
  }

  const customerProfileId = await ensureCustomerProfile({
    name: user.fullName ?? null,
    email: user.email,
  });

  if (!customerProfileId) {
    return null;
  }

  await serviceClient.from("customer_user_accounts").upsert(
    {
      user_id: user.id,
      customer_profile_id: customerProfileId,
    },
    { onConflict: "user_id" },
  );

  return customerProfileId;
}

async function linkCustomerAuthToProfile(input: {
  userId: string;
  fullName?: string | null;
  email: string;
  phone?: string | null;
}) {
  const serviceClient = createSupabaseServiceClient();
  if (!serviceClient) {
    return;
  }

  const customerProfileId = await ensureCustomerProfile({
    name: input.fullName ?? null,
    email: input.email,
    phone: input.phone ?? null,
  });

  if (!customerProfileId) {
    return;
  }

  let linkErrorMessage: string | null = null;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const { error: linkError } = await serviceClient
      .from("customer_user_accounts")
      .upsert(
        {
          user_id: input.userId,
          customer_profile_id: customerProfileId,
        },
        { onConflict: "user_id" },
      );

    if (!linkError) {
      linkErrorMessage = null;
      break;
    }

    if (linkError.code === "23503" && attempt === 0) {
      // A short retry prevents intermittent FK races immediately after auth signup.
      await new Promise((resolve) => setTimeout(resolve, 150));
      continue;
    }

    linkErrorMessage = linkError.message;
    break;
  }

  if (linkErrorMessage) {
    throw new Error(linkErrorMessage);
  }

  const normalizedEmail = normalizeEmail(input.email);
  const { error: ownershipError } = await serviceClient
    .from("orders")
    .update({ customer_user_id: input.userId })
    .eq("email_normalized", normalizedEmail)
    .is("customer_user_id", null);

  if (ownershipError) {
    throw new Error(ownershipError.message);
  }

  // Intentionally no phone-based auto-linking. Phone numbers at checkout are
  // self-reported and unverified — a typo or shared family phone would silently
  // attach someone else's orders to this account. Email is safe to auto-link
  // because Supabase verifies ownership during signup. Phone-only orders can
  // be looked up via /orders/track instead.
}

export async function registerCustomerAccount(input: {
  fullName: string;
  email: string;
  password: string;
  phone?: string | null;
}) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    throw new Error("Auth service is not configured.");
  }

  const { data, error } = await supabase.auth.signUp({
    email: input.email,
    password: input.password,
    options: {
      data: {
        full_name: input.fullName,
      },
    },
  });

  if (error) {
    throw new Error(error.message);
  }

  const needsEmailConfirmation = !data.session;
  if (!needsEmailConfirmation && data.user?.id && data.user.email) {
    try {
      await linkCustomerAuthToProfile({
        userId: data.user.id,
        fullName: input.fullName,
        email: data.user.email,
        phone: input.phone ?? null,
      });
    } catch {
      // Do not fail registration due to post-signup profile-link races.
      // The link is re-attempted on login.
    }
  }

  return {
    needsEmailConfirmation,
    userId: data.user?.id ?? null,
  };
}

export async function loginCustomerAccount(input: { email: string; password: string }) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    throw new Error("Auth service is not configured.");
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email: input.email,
    password: input.password,
  });

  if (error || !data.user?.id || !data.user.email) {
    throw new Error(error?.message ?? "Invalid credentials.");
  }

  try {
    await linkCustomerAuthToProfile({
      userId: data.user.id,
      fullName:
        typeof data.user.user_metadata?.full_name === "string"
          ? data.user.user_metadata.full_name
          : null,
      email: data.user.email,
      phone: null,
    });
  } catch {
    // Keep login successful even if profile-link sync fails transiently.
  }
}

export async function logoutCustomerAccount() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return;
  }

  await supabase.auth.signOut();
}

export async function listOrdersForAuthenticatedCustomer(): Promise<
  CustomerOrderSummary[]
> {
  const user = await getAuthenticatedCustomerUser();
  const serviceClient = createSupabaseServiceClient();

  if (!user || !serviceClient) {
    return [];
  }

  const normalizedEmail = normalizeEmail(user.email);
  const { data, error } = await serviceClient
    .from("orders")
    .select(
      `
      id,
      order_code,
      order_status,
      payment_status,
      payment_method,
      subtotal,
      delivery_fee,
      discount_amount,
      total,
      created_at,
      order_items(product_title_snapshot, product_brand_snapshot, quantity, unit_price, total_price),
      order_status_history(status, note, created_at)
      `,
    )
    .or(`customer_user_id.eq.${user.id},email_normalized.eq.${normalizedEmail}`)
    .order("created_at", { ascending: false })
    .limit(200);

  if (error || !data) {
    return [];
  }

  return data.map((row) => ({
    id: row.id as string,
    orderCode: row.order_code as string,
    orderStatus: row.order_status as OrderStatus,
    paymentStatus: row.payment_status as PaymentStatus,
    paymentMethod: row.payment_method as PaymentMethod,
    subtotal: Number(row.subtotal),
    deliveryFee: Number(row.delivery_fee),
    discountAmount: Number(row.discount_amount ?? 0),
    total: Number(row.total),
    createdAt: row.created_at as string,
    items: ((row.order_items as Array<Record<string, unknown>> | null) ?? []).map(
      (item) => ({
        productTitle: String(item.product_title_snapshot),
        productBrand: String(item.product_brand_snapshot),
        quantity: Number(item.quantity),
        unitPrice: Number(item.unit_price),
        totalPrice: Number(item.total_price),
      }),
    ),
    history: (
      (row.order_status_history as Array<Record<string, unknown>> | null) ?? []
    )
      .map((event) => ({
        status: event.status as OrderStatus,
        note: (event.note as string | null) ?? null,
        createdAt: String(event.created_at),
      }))
      .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)),
  }));
}

export async function listDiscountsForAuthenticatedCustomer(): Promise<CustomerCouponView[]> {
  const user = await getAuthenticatedCustomerUser();
  if (!user) {
    return [];
  }

  return listCustomerCouponsForUser({
    customerUserId: user.id,
    email: user.email,
  });
}

export async function getCheckoutProfileForAuthenticatedCustomer(): Promise<CustomerCheckoutProfile | null> {
  const user = await getAuthenticatedCustomerUser();
  const serviceClient = createSupabaseServiceClient();

  if (!user || !serviceClient) {
    return null;
  }

  const customerProfileId = await resolveCustomerProfileIdForUser(user);
  if (!customerProfileId) {
    return null;
  }

  const { data, error } = await serviceClient
    .from("customer_profiles")
    .select("name, email, phone, default_country, default_city, default_address")
    .eq("id", customerProfileId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return {
    customerName:
      (data.name as string | null) ??
      user.fullName ??
      "",
    phone: (data.phone as string | null) ?? "",
    email: (data.email as string | null) ?? user.email,
    country: (data.default_country as string | null) ?? "Kosovo",
    city: (data.default_city as string | null) ?? "",
    address: (data.default_address as string | null) ?? "",
  };
}

export async function updateCheckoutProfileForAuthenticatedCustomer(
  input: CustomerCheckoutProfileUpdate,
) {
  const user = await getAuthenticatedCustomerUser();
  const serviceClient = createSupabaseServiceClient();

  if (!user || !serviceClient) {
    throw new Error("Authentication required.");
  }

  const customerProfileId = await resolveCustomerProfileIdForUser(user);
  if (!customerProfileId) {
    throw new Error("Unable to resolve customer profile.");
  }

  const { error } = await serviceClient
    .from("customer_profiles")
    .update({
      name: input.customerName,
      email: user.email,
      email_normalized: normalizeEmail(user.email),
      phone: input.phone,
      phone_normalized: normalizePhone(input.phone),
      default_country: input.country || "Kosovo",
      default_city: input.city,
      default_address: input.address,
    })
    .eq("id", customerProfileId);

  if (error) {
    throw new Error(error.message);
  }
}
