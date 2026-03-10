export const analyticsEventNames = [
  "add_to_cart",
  "apply_coupon",
  "begin_checkout",
  "payment_initiated",
  "place_order",
  "repair_request_submit",
  "repair_track_search",
  "start_chat",
  "affiliate_click",
  "click_whatsapp",
  "click_call",
  "map_click",
  "product_view",
] as const;

export type AnalyticsEventName = (typeof analyticsEventNames)[number];

interface BaseEventPayload {
  route?: string;
  source?: string;
}

export interface AnalyticsEventPayloads {
  add_to_cart: BaseEventPayload & {
    productId: string;
    productSlug?: string;
    category?: string;
    quantity: number;
    unitPrice: number;
  };
  apply_coupon: BaseEventPayload & {
    couponCode: string;
    discountAmount: number;
  };
  begin_checkout: BaseEventPayload & {
    itemCount: number;
    subtotal: number;
  };
  payment_initiated: BaseEventPayload & {
    orderCode: string;
    paymentMethod: string;
    amount: number;
    transactionId?: string;
  };
  place_order: BaseEventPayload & {
    orderCode: string;
    total: number;
    paymentMethod: string;
    deliveryMethod: string;
  };
  repair_request_submit: BaseEventPayload & {
    repairCode: string;
    itemType?: string;
    serviceType?: string;
  };
  repair_track_search: BaseEventPayload & {
    repairCode?: string;
    result: "found" | "not_found";
  };
  start_chat: BaseEventPayload & {
    threadId?: string;
    channel?: string;
  };
  affiliate_click: BaseEventPayload & {
    code: string;
    affiliateId?: string;
  };
  click_whatsapp: BaseEventPayload & {
    destination?: string;
  };
  click_call: BaseEventPayload & {
    destination?: string;
  };
  map_click: BaseEventPayload & {
    destination?: string;
  };
  product_view: BaseEventPayload & {
    productId: string;
    productSlug: string;
    category?: string;
    price?: number;
  };
}

export type AnalyticsEventPayload<T extends AnalyticsEventName> =
  AnalyticsEventPayloads[T];
