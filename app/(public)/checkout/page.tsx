"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { startTransition, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";

import { useCart } from "@/components/commerce/cart-provider";
import { Container } from "@/components/layout/container";
import { SectionWrapper } from "@/components/layout/section-wrapper";
import { StatusBadge } from "@/components/ui/status-badge";
import { trackEvent } from "@/lib/analytics/track";
import { formatEur } from "@/lib/utils/money";
import { checkoutSchema, type CheckoutInput } from "@/lib/validations/checkout";

export default function CheckoutPage() {
  const router = useRouter();
  const { items, subtotal, clearCart } = useCart();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [hasTrackedCheckout, setHasTrackedCheckout] = useState(false);
  const [homeDeliveryFee, setHomeDeliveryFee] = useState(3);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CheckoutInput>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      customerName: "",
      phone: "",
      email: "",
      city: "",
      address: "",
      notes: "",
      deliveryMethod: "home_delivery",
      paymentMethod: "cash_on_delivery",
    },
  });

  const deliveryMethod = watch("deliveryMethod");
  const paymentMethod = watch("paymentMethod");

  useEffect(() => {
    if (deliveryMethod === "home_delivery" && paymentMethod === "pay_in_store") {
      setValue("paymentMethod", "cash_on_delivery");
    }
    if (deliveryMethod === "store_pickup" && paymentMethod === "cash_on_delivery") {
      setValue("paymentMethod", "pay_in_store");
    }
  }, [deliveryMethod, paymentMethod, setValue]);

  useEffect(() => {
    if (items.length === 0 || hasTrackedCheckout) {
      return;
    }

    trackEvent("begin_checkout", {
      route: "/checkout",
      source: "checkout_page",
      itemCount: items.length,
      subtotal,
    });
    setHasTrackedCheckout(true);
  }, [hasTrackedCheckout, items.length, subtotal]);

  useEffect(() => {
    let isCancelled = false;

    void fetch("/api/commerce/config")
      .then(async (response) => {
        if (!response.ok) {
          return;
        }

        const payload = (await response.json()) as {
          ok: boolean;
          homeDeliveryFee?: number;
        };

        if (!payload.ok || typeof payload.homeDeliveryFee !== "number") {
          return;
        }

        if (!isCancelled) {
          setHomeDeliveryFee(payload.homeDeliveryFee);
        }
      })
      .catch(() => {
        // Keep fallback fee if config fetch fails.
      });

    return () => {
      isCancelled = true;
    };
  }, []);

  const deliveryFee =
    deliveryMethod === "home_delivery" ? homeDeliveryFee : 0;
  const total = subtotal + deliveryFee;

  const onSubmit = handleSubmit(async (values) => {
    if (items.length === 0) {
      setServerError("Your cart is empty.");
      return;
    }

    setIsSubmitting(true);
    setServerError(null);

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ checkout: values, items }),
      });

      const payload = (await response.json()) as {
        ok: boolean;
        message?: string;
        order?: { orderCode: string; total: number; subtotal: number; deliveryFee: number };
      };

      if (!response.ok || !payload.ok || !payload.order) {
        throw new Error(payload.message ?? "Unable to place order.");
      }

      trackEvent("place_order", {
        route: "/checkout",
        source: "checkout_submit",
        orderCode: payload.order.orderCode,
        total: payload.order.total,
        paymentMethod: values.paymentMethod,
        deliveryMethod: values.deliveryMethod,
      });

      clearCart();

      startTransition(() => {
        const params = new URLSearchParams({
          orderCode: payload.order!.orderCode,
          total: String(payload.order!.total),
          subtotal: String(payload.order!.subtotal),
          deliveryFee: String(payload.order!.deliveryFee),
        });
        router.push(`/order-success?${params.toString()}`);
      });
    } catch (error) {
      setServerError(error instanceof Error ? error.message : "Checkout failed.");
      setIsSubmitting(false);
    }
  });

  if (items.length === 0) {
    return (
      <SectionWrapper className="py-16">
        <Container>
          <div className="surface-panel p-8">
            <h1 className="text-4xl text-graphite">Checkout</h1>
            <p className="mt-3 text-sm text-graphite/74">
              Add products to your cart before checkout.
            </p>
            <Link
              href="/cart"
              className="mt-5 inline-flex h-11 items-center rounded-full bg-walnut px-5 text-sm font-medium text-white"
            >
              Go to Cart
            </Link>
          </div>
        </Container>
      </SectionWrapper>
    );
  }

  return (
    <SectionWrapper className="py-16">
      <Container className="grid gap-7 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <section className="surface-panel p-6 sm:p-7">
          <StatusBadge tone="premium">Checkout</StatusBadge>
          <h1 className="mt-4 text-5xl text-graphite">Complete Your Order</h1>
          <p className="mt-3 text-sm text-graphite/74">
            Payment is completed on delivery or when you collect your order in store.
          </p>

          <form onSubmit={onSubmit} className="mt-6 space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <label htmlFor="customerName" className="text-sm font-medium">
                  Full name
                </label>
                <input
                  id="customerName"
                  {...register("customerName")}
                  className="w-full rounded-lg border border-graphite/18 bg-white/85 px-3 py-2 text-sm"
                />
                {errors.customerName ? (
                  <p className="text-xs text-walnut">{errors.customerName.message}</p>
                ) : null}
              </div>
              <div className="space-y-1">
                <label htmlFor="phone" className="text-sm font-medium">
                  Phone
                </label>
                <input
                  id="phone"
                  {...register("phone")}
                  className="w-full rounded-lg border border-graphite/18 bg-white/85 px-3 py-2 text-sm"
                />
                {errors.phone ? (
                  <p className="text-xs text-walnut">{errors.phone.message}</p>
                ) : null}
              </div>
            </div>

            <div className="space-y-1">
              <label htmlFor="email" className="text-sm font-medium">
                Email (optional)
              </label>
              <input
                id="email"
                {...register("email")}
                className="w-full rounded-lg border border-graphite/18 bg-white/85 px-3 py-2 text-sm"
              />
              {errors.email ? (
                <p className="text-xs text-walnut">{errors.email.message}</p>
              ) : null}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <label htmlFor="city" className="text-sm font-medium">
                  City
                </label>
                <input
                  id="city"
                  {...register("city")}
                  className="w-full rounded-lg border border-graphite/18 bg-white/85 px-3 py-2 text-sm"
                />
                {errors.city ? (
                  <p className="text-xs text-walnut">{errors.city.message}</p>
                ) : null}
              </div>
              <div className="space-y-1">
                <label htmlFor="address" className="text-sm font-medium">
                  Address
                </label>
                <input
                  id="address"
                  {...register("address")}
                  className="w-full rounded-lg border border-graphite/18 bg-white/85 px-3 py-2 text-sm"
                />
                {errors.address ? (
                  <p className="text-xs text-walnut">{errors.address.message}</p>
                ) : null}
              </div>
            </div>

            <div className="space-y-1">
              <label htmlFor="notes" className="text-sm font-medium">
                Notes (optional)
              </label>
              <textarea
                id="notes"
                rows={3}
                {...register("notes")}
                className="w-full rounded-lg border border-graphite/18 bg-white/85 px-3 py-2 text-sm"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <label htmlFor="deliveryMethod" className="text-sm font-medium">
                  Delivery method
                </label>
                <select
                  id="deliveryMethod"
                  {...register("deliveryMethod")}
                  className="w-full rounded-lg border border-graphite/18 bg-white/85 px-3 py-2 text-sm"
                >
                  <option value="home_delivery">Home Delivery</option>
                  <option value="store_pickup">In-Store Pickup</option>
                </select>
              </div>
              <div className="space-y-1">
                <label htmlFor="paymentMethod" className="text-sm font-medium">
                  Payment method
                </label>
                <select
                  id="paymentMethod"
                  {...register("paymentMethod")}
                  className="w-full rounded-lg border border-graphite/18 bg-white/85 px-3 py-2 text-sm"
                >
                  {deliveryMethod === "home_delivery" ? (
                    <option value="cash_on_delivery">Cash on Delivery</option>
                  ) : (
                    <option value="pay_in_store">Pay in Store on Pickup</option>
                  )}
                </select>
                {errors.paymentMethod ? (
                  <p className="text-xs text-walnut">{errors.paymentMethod.message}</p>
                ) : null}
              </div>
            </div>

            {serverError ? (
              <p className="rounded-lg border border-walnut/30 bg-walnut/10 px-3 py-2 text-sm text-walnut">
                {serverError}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex h-11 items-center rounded-full bg-walnut px-6 text-sm font-medium text-white disabled:opacity-50"
            >
              {isSubmitting ? "Placing order..." : "Place Order"}
            </button>
          </form>
        </section>

        <aside className="surface-panel h-fit p-5">
          <h2 className="text-2xl text-graphite">Order Summary</h2>
          <ul className="mt-4 space-y-3 text-sm">
            {items.map((item) => (
              <li key={item.productId} className="flex items-center justify-between gap-3">
                <span className="text-graphite/78">
                  {item.title} x {item.quantity}
                </span>
                <span className="font-medium text-graphite">
                  {formatEur(item.unitPrice * item.quantity)}
                </span>
              </li>
            ))}
          </ul>
          <dl className="mt-5 space-y-2 border-t border-graphite/12 pt-4 text-sm">
            <div className="flex items-center justify-between">
              <dt className="text-graphite/72">Subtotal</dt>
              <dd>{formatEur(subtotal)}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-graphite/72">Delivery fee</dt>
              <dd>{formatEur(deliveryFee)}</dd>
            </div>
            <div className="flex items-center justify-between text-base font-medium">
              <dt>Total</dt>
              <dd>{formatEur(total)}</dd>
            </div>
          </dl>
        </aside>
      </Container>
    </SectionWrapper>
  );
}
