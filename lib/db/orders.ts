import { getAllActiveProducts } from "@/lib/db/catalog";
import { addFallbackOrder } from "@/lib/db/fallback-store";
import { createSupabaseServiceClient } from "@/lib/db/supabase/service";
import { generateOrderCode, normalizeEmail, normalizePhone } from "@/lib/utils/codes";
import type { AdminOrder } from "@/types/admin";
import type { CartItem } from "@/types/cart";
import type { CheckoutInput } from "@/lib/validations/checkout";

interface CreateOrderInput {
  checkout: CheckoutInput;
  items: CartItem[];
}

interface CreateOrderResult {
  orderCode: string;
  subtotal: number;
  deliveryFee: number;
  total: number;
}

const HOME_DELIVERY_FEE = 3;

export async function createOrder({
  checkout,
  items,
}: CreateOrderInput): Promise<CreateOrderResult> {
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

  const subtotal = resolvedItems.reduce((sum, item) => sum + item.totalPrice, 0);
  const deliveryFee =
    checkout.deliveryMethod === "home_delivery" ? HOME_DELIVERY_FEE : 0;
  const total = subtotal + deliveryFee;
  const orderCode = generateOrderCode(Date.now() % 100000);

  const serviceClient = createSupabaseServiceClient();
  const orderId = `ord-${Date.now()}`;

  if (!serviceClient) {
    const fallbackOrder: AdminOrder = {
      id: orderId,
      orderCode,
      customerName: checkout.customerName,
      phone: checkout.phone,
      email: checkout.email || null,
      city: checkout.city,
      address: checkout.address,
      notes: checkout.notes || null,
      internalNotes: null,
      deliveryMethod: checkout.deliveryMethod,
      paymentMethod: checkout.paymentMethod,
      paymentStatus: "pending",
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
      total,
    };
  }

  const { data: orderData, error: orderError } = await serviceClient
    .from("orders")
    .insert({
      order_code: orderCode,
      customer_name: checkout.customerName,
      phone: checkout.phone,
      phone_normalized: normalizePhone(checkout.phone),
      email: checkout.email || null,
      email_normalized: checkout.email ? normalizeEmail(checkout.email) : null,
      city: checkout.city,
      address: checkout.address,
      notes: checkout.notes || null,
      delivery_method: checkout.deliveryMethod,
      payment_method: checkout.paymentMethod,
      payment_status: "pending",
      order_status: "pending",
      subtotal,
      delivery_fee: deliveryFee,
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

  return {
    orderCode,
    subtotal,
    deliveryFee,
    total,
  };
}
