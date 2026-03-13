import { sendOrderConfirmationEmail } from "@/lib/email/order-confirmation";
import { getAllActiveProducts } from "@/lib/db/catalog";
import {
  addCustomerActivity,
  ensureCustomerProfile,
  incrementCustomerOrderStats,
  queueNotificationJob,
} from "@/lib/db/crm-support";
import { addFallbackOrder } from "@/lib/db/fallback-store";
import { awardLoyaltyPointsForOrder, recordAffiliateConversion } from "@/lib/db/growth-loyalty";
import { syncOrderCashbookByOrderId } from "@/lib/db/order-cashbook-sync";
import {
  createPaymentTransactionForOrder,
  recordCouponRedemption,
  validateCouponForOrder,
} from "@/lib/db/payments-promotions";
import { getSiteSettings } from "@/lib/db/site-settings";
import { createSupabaseServiceClient } from "@/lib/db/supabase/service";
import { generateOrderCode, normalizeEmail, normalizePhone } from "@/lib/utils/codes";
import type { CheckoutInput } from "@/lib/validations/checkout";
import type { AdminOrder } from "@/types/admin";
import type { CartItem } from "@/types/cart";
import type { PaymentStatus, PaymentTransactionStatus } from "@/types/domain";

interface CreateOrderInput {
  checkout: CheckoutInput;
  items: CartItem[];
  customerUserId?: string | null;
  customerEmail?: string | null;
  customerFullName?: string | null;
}

interface CreateOrderResult {
  orderCode: string;
  subtotal: number;
  deliveryFee: number;
  discountAmount: number;
  total: number;
  couponCodeApplied: string | null;
  paymentStatus: PaymentStatus;
  paymentTransactionId: string | null;
}

const HOME_DELIVERY_FEE = 3;

function resolveHomeDeliveryFee(value: string) {
  const parsed = Number.parseFloat(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return HOME_DELIVERY_FEE;
  }
  return parsed;
}

function resolveTransactionStatus(method: CheckoutInput["paymentMethod"]): PaymentTransactionStatus {
  if (method === "card_online") {
    return "initiated";
  }

  return "pending";
}

function resolveOrderPaymentStatus(method: CheckoutInput["paymentMethod"]): PaymentStatus {
  if (method === "card_online") {
    return "authorized";
  }

  return "pending";
}

function safeRoundMoney(amount: number) {
  return Math.max(0, Math.round(amount * 100) / 100);
}

export async function createOrder({
  checkout,
  items,
  customerUserId,
  customerEmail,
  customerFullName,
}: CreateOrderInput): Promise<CreateOrderResult> {
  const settings = await getSiteSettings();
  const homeDeliveryFee = resolveHomeDeliveryFee(settings.homeDeliveryFee);
  const activeProducts = await getAllActiveProducts();
  const productById = new Map(activeProducts.map((product) => [product.id, product]));

  if (items.length === 0) {
    throw new Error("Cart is empty.");
  }

  const resolvedItems = items.map((item) => {
    const product = productById.get(item.productId);
    if (!product) {
      throw new Error(`Product not found: ${item.productId}`);
    }

    if (product.stockStatus === "out_of_stock") {
      throw new Error(`Product is out of stock: ${product.title}`);
    }

    const quantity = Math.max(1, Math.min(10, item.quantity));
    return {
      product,
      quantity,
      unitPrice: product.price,
      totalPrice: product.price * quantity,
    };
  });

  const subtotal = safeRoundMoney(
    resolvedItems.reduce((sum, item) => sum + item.totalPrice, 0),
  );
  const deliveryFee =
    checkout.deliveryMethod === "home_delivery" ? homeDeliveryFee : 0;
  const resolvedCustomerEmail = (checkout.email || customerEmail || "").trim();
  const resolvedCustomerName = (checkout.customerName || customerFullName || "").trim();
  const resolvedCustomerPhone = checkout.phone.trim();
  const resolvedCountry = (checkout.country || "Kosovo").trim() || "Kosovo";

  const couponValidation = checkout.couponCode
    ? await validateCouponForOrder({
        code: checkout.couponCode,
        subtotal,
        email: resolvedCustomerEmail || null,
        phone: resolvedCustomerPhone,
        customerUserId: customerUserId ?? null,
      })
    : null;

  if (checkout.couponCode && (!couponValidation || !couponValidation.valid)) {
    throw new Error(couponValidation?.reason ?? "Invalid coupon code.");
  }

  const discountAmount = safeRoundMoney(couponValidation?.discountAmount ?? 0);
  const total = safeRoundMoney(subtotal + deliveryFee - discountAmount);
  const orderCode = generateOrderCode(Date.now() % 100000);
  const paymentStatus = resolveOrderPaymentStatus(checkout.paymentMethod);

  const serviceClient = createSupabaseServiceClient();
  const orderId = `ord-${Date.now()}`;

  if (!serviceClient) {
    const fallbackOrder: AdminOrder = {
      id: orderId,
      orderCode,
      customerName: resolvedCustomerName || checkout.customerName,
      phone: resolvedCustomerPhone,
      email: resolvedCustomerEmail || null,
      country: resolvedCountry,
      city: checkout.city,
      address: checkout.address,
      notes: checkout.notes || null,
      internalNotes: null,
      deliveryMethod: checkout.deliveryMethod,
      paymentMethod: checkout.paymentMethod,
      paymentStatus,
      orderStatus: "pending",
      subtotal,
      deliveryFee,
      total,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      items: resolvedItems.map((entry) => ({
        productId: entry.product.id,
        title: entry.product.title,
        brand: entry.product.brand,
        quantity: entry.quantity,
        unitPrice: entry.unitPrice,
        totalPrice: entry.totalPrice,
      })),
      history: [
        {
          status: "pending",
          note: "Order created from checkout",
          createdAt: new Date().toISOString(),
        },
      ],
    };
    addFallbackOrder(fallbackOrder);

    return {
      orderCode,
      subtotal,
      deliveryFee,
      discountAmount,
      total,
      couponCodeApplied: couponValidation?.code ?? null,
      paymentStatus,
      paymentTransactionId: checkout.paymentMethod === "card_online" ? `txn-${Date.now()}` : null,
    };
  }

  const { data: orderData, error: orderError } = await serviceClient
    .from("orders")
    .insert({
      order_code: orderCode,
      customer_name: resolvedCustomerName || checkout.customerName,
      phone: resolvedCustomerPhone,
      phone_normalized: normalizePhone(resolvedCustomerPhone),
      email: resolvedCustomerEmail || null,
      email_normalized: resolvedCustomerEmail ? normalizeEmail(resolvedCustomerEmail) : null,
      customer_user_id: customerUserId ?? null,
      country: resolvedCountry,
      city: checkout.city,
      address: checkout.address,
      notes: checkout.notes || null,
      delivery_method: checkout.deliveryMethod,
      payment_method: checkout.paymentMethod,
      payment_status: paymentStatus,
      payment_provider:
        checkout.paymentMethod === "card_online"
          ? "stripe"
          : checkout.paymentMethod === "bank_transfer"
            ? "bank_transfer"
            : "manual_offline",
      payment_reference: null,
      order_status: "pending",
      subtotal,
      delivery_fee: deliveryFee,
      discount_amount: discountAmount,
      coupon_code_applied: couponValidation?.code ?? null,
      total,
    })
    .select("id")
    .single();

  if (orderError || !orderData) {
    throw new Error(orderError?.message ?? "Unable to create order.");
  }

  const orderItemsRows = resolvedItems.map((entry) => ({
    order_id: orderData.id,
    product_id: entry.product.id,
    product_title_snapshot: entry.product.title,
    product_brand_snapshot: entry.product.brand,
    quantity: entry.quantity,
    unit_price: entry.unitPrice,
    total_price: entry.totalPrice,
  }));

  const { error: orderItemsError } = await serviceClient
    .from("order_items")
    .insert(orderItemsRows);

  if (orderItemsError) {
    throw new Error(orderItemsError.message);
  }

  const { error: historyError } = await serviceClient
    .from("order_status_history")
    .insert({
      order_id: orderData.id,
      status: "pending",
      note: "Order created from checkout",
    });

  if (historyError) {
    throw new Error(historyError.message);
  }

  // Non-critical: cashbook sync failure must not block order creation.
  await syncOrderCashbookByOrderId(String(orderData.id)).catch(() => {});

  if (couponValidation?.valid && couponValidation.couponId && discountAmount > 0) {
    await recordCouponRedemption({
      couponId: couponValidation.couponId,
      orderId: orderData.id as string,
      discountAmount,
      email: resolvedCustomerEmail || null,
      phone: resolvedCustomerPhone,
      customerAssignmentId: couponValidation.customerAssignmentId ?? null,
    });
  }

  const paymentTransaction = await createPaymentTransactionForOrder({
    orderId: orderData.id as string,
    provider:
      checkout.paymentMethod === "card_online"
        ? "stripe"
        : checkout.paymentMethod === "bank_transfer"
          ? "bank_transfer"
          : "manual_offline",
    method: checkout.paymentMethod,
    status: resolveTransactionStatus(checkout.paymentMethod),
    amount: total,
    providerReference:
      checkout.paymentMethod === "card_online"
        ? `mock_card_${orderCode}`
        : checkout.paymentMethod === "bank_transfer"
          ? `bank_${orderCode}`
          : `offline_${orderCode}`,
    providerPayload:
      checkout.paymentMethod === "card_online"
        ? {
            mode: "test",
            note: "Mock online payment transaction. Integrate Stripe checkout next.",
          }
        : {},
  });

  const customerProfileId = await ensureCustomerProfile({
    name: resolvedCustomerName || checkout.customerName,
    email: resolvedCustomerEmail || null,
    phone: resolvedCustomerPhone,
    defaultCountry: resolvedCountry,
    defaultCity: checkout.city,
    defaultAddress: checkout.address,
  });

  if (customerProfileId) {
    await incrementCustomerOrderStats({
      customerProfileId,
      orderTotal: total,
    });

    await addCustomerActivity({
      customerProfileId,
      activityType: "order_created",
      referenceType: "order",
      referenceId: orderData.id as string,
      summary: `Porosia ${orderCode} u krijua`,
      metadata: {
        total,
        paymentMethod: checkout.paymentMethod,
        deliveryMethod: checkout.deliveryMethod,
      },
    });

    await queueNotificationJob({
      customerProfileId,
      channel: resolvedCustomerEmail ? "email" : "internal",
      trigger: "order_created",
      payload: {
        orderCode,
        total,
        customerName: resolvedCustomerName || checkout.customerName,
      },
    });
  }

  await awardLoyaltyPointsForOrder({
    customerName: resolvedCustomerName || checkout.customerName,
    email: resolvedCustomerEmail || null,
    phone: resolvedCustomerPhone,
    orderId: orderData.id as string,
    orderTotal: total,
  });

  await recordAffiliateConversion({
    affiliateCode: checkout.affiliateCode || null,
    orderId: orderData.id as string,
    orderTotal: total,
  });

  // Non-critical: email failure must never block order creation.
  if (resolvedCustomerEmail) {
    sendOrderConfirmationEmail({
      to: resolvedCustomerEmail,
      locale: checkout.locale ?? "sq",
      customerName: resolvedCustomerName || checkout.customerName,
      orderCode,
      items: resolvedItems.map((entry) => ({
        title: entry.product.title,
        brand: entry.product.brand,
        quantity: entry.quantity,
        unitPrice: entry.unitPrice,
      })),
      subtotal,
      deliveryFee,
      discountAmount,
      total,
      deliveryMethod: checkout.deliveryMethod,
      paymentMethod: checkout.paymentMethod,
    }).catch(() => {});
  }

  return {
    orderCode,
    subtotal,
    deliveryFee,
    discountAmount,
    total,
    couponCodeApplied: couponValidation?.code ?? null,
    paymentStatus,
    paymentTransactionId: paymentTransaction.id,
  };
}

export interface GuestOrderTrackResult {
  orderCode: string;
  customerName: string;
  orderStatus: string;
  paymentStatus: string;
  paymentMethod: string;
  deliveryMethod: string;
  subtotal: number;
  deliveryFee: number;
  discountAmount: number;
  total: number;
  createdAt: string;
  items: Array<{ title: string; brand: string; quantity: number; unitPrice: number }>;
  history: Array<{ status: string; note: string | null; createdAt: string }>;
}

export async function trackGuestOrder(input: {
  orderCode: string;
  phoneOrEmail: string;
}): Promise<GuestOrderTrackResult | null> {
  const serviceClient = createSupabaseServiceClient();
  if (!serviceClient) {
    return null;
  }

  const { data: order, error } = await serviceClient
    .from("orders")
    .select(
      `id, order_code, customer_name, order_status, payment_status, payment_method,
       delivery_method, subtotal, delivery_fee, discount_amount, total, created_at,
       phone_normalized, email_normalized,
       order_items(product_title_snapshot, product_brand_snapshot, quantity, unit_price),
       order_status_history(status, note, created_at)`,
    )
    .eq("order_code", input.orderCode.trim().toUpperCase())
    .maybeSingle();

  if (error || !order) {
    return null;
  }

  const normalized = input.phoneOrEmail.includes("@")
    ? normalizeEmail(input.phoneOrEmail)
    : normalizePhone(input.phoneOrEmail);

  const row = order as Record<string, unknown>;

  const canView =
    normalized === row.phone_normalized || normalized === row.email_normalized;

  if (!canView) {
    return null;
  }

  const items = ((row.order_items as Array<Record<string, unknown>> | null) ?? []).map(
    (item) => ({
      title: String(item.product_title_snapshot),
      brand: String(item.product_brand_snapshot),
      quantity: Number(item.quantity),
      unitPrice: Number(item.unit_price),
    }),
  );

  const history = (
    (row.order_status_history as Array<Record<string, unknown>> | null) ?? []
  )
    .map((event) => ({
      status: String(event.status),
      note: (event.note as string | null) ?? null,
      createdAt: String(event.created_at),
    }))
    .sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt));

  return {
    orderCode: String(row.order_code),
    customerName: String(row.customer_name),
    orderStatus: String(row.order_status),
    paymentStatus: String(row.payment_status),
    paymentMethod: String(row.payment_method),
    deliveryMethod: String(row.delivery_method),
    subtotal: Number(row.subtotal),
    deliveryFee: Number(row.delivery_fee),
    discountAmount: Number(row.discount_amount ?? 0),
    total: Number(row.total),
    createdAt: String(row.created_at),
    items,
    history,
  };
}
