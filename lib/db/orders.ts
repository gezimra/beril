import { getAllActiveProducts } from "@/lib/db/catalog";
import {
  addCustomerActivity,
  ensureCustomerProfile,
  incrementCustomerOrderStats,
  queueNotificationJob,
} from "@/lib/db/crm-support";
import { addFallbackOrder } from "@/lib/db/fallback-store";
import { awardLoyaltyPointsForOrder, recordAffiliateConversion } from "@/lib/db/growth-loyalty";
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
