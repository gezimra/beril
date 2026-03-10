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

function readCookie(name: string) {
  if (typeof document === "undefined") {
    return "";
  }

  const pairs = document.cookie.split(";").map((part) => part.trim());
  const match = pairs.find((part) => part.startsWith(`${name}=`));
  if (!match) {
    return "";
  }

  return decodeURIComponent(match.slice(name.length + 1));
}

export default function CheckoutPage() {
  const router = useRouter();
  const { items, subtotal, clearCart } = useCart();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [hasTrackedCheckout, setHasTrackedCheckout] = useState(false);
  const [homeDeliveryFee, setHomeDeliveryFee] = useState(3);
  const [couponCodeInput, setCouponCodeInput] = useState("");
  const [appliedCouponCode, setAppliedCouponCode] = useState<string | null>(null);
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponMessage, setCouponMessage] = useState<string | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [isCouponValidating, setIsCouponValidating] = useState(false);
  const [affiliateCode, setAffiliateCode] = useState("");
  const [isSignedInCustomer, setIsSignedInCustomer] = useState(false);
  const [accountEmail, setAccountEmail] = useState("");
  const [saveToAccount, setSaveToAccount] = useState(false);

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
      country: "Kosovo",
      city: "",
      address: "",
      notes: "",
      couponCode: "",
      affiliateCode: "",
      deliveryMethod: "home_delivery",
      paymentMethod: "cash_on_delivery",
    },
  });

  const deliveryMethod = watch("deliveryMethod");
  const paymentMethod = watch("paymentMethod");
  const email = watch("email");
  const phone = watch("phone");

  useEffect(() => {
    const cookieValue = readCookie("beril_ref");
    if (!cookieValue) {
      return;
    }
    setAffiliateCode(cookieValue);
    setValue("affiliateCode", cookieValue);
  }, [setValue]);

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

  useEffect(() => {
    let isCancelled = false;

    void fetch("/api/account/checkout-profile")
      .then(async (response) => {
        if (!response.ok) {
          return;
        }

        const payload = (await response.json()) as {
          ok: boolean;
          signedIn?: boolean;
          profile?: {
            customerName: string;
            phone: string;
            email: string;
            country: string;
            city: string;
            address: string;
          } | null;
        };

        if (!payload.ok || isCancelled) {
          return;
        }

        if (!payload.signedIn) {
          setIsSignedInCustomer(false);
          setAccountEmail("");
          return;
        }

        setIsSignedInCustomer(true);
        setSaveToAccount(true);
        setAccountEmail(payload.profile?.email ?? "");

        if (payload.profile) {
          setValue("customerName", payload.profile.customerName || "", {
            shouldDirty: false,
          });
          setValue("phone", payload.profile.phone || "", { shouldDirty: false });
          setValue("email", payload.profile.email || "", { shouldDirty: false });
          setValue("country", payload.profile.country || "Kosovo", {
            shouldDirty: false,
          });
          setValue("city", payload.profile.city || "", { shouldDirty: false });
          setValue("address", payload.profile.address || "", {
            shouldDirty: false,
          });
        }
      })
      .catch(() => {
        // Checkout should continue even if profile prefill is unavailable.
      });

    return () => {
      isCancelled = true;
    };
  }, [setValue]);

  const deliveryFee = deliveryMethod === "home_delivery" ? homeDeliveryFee : 0;
  const total = Math.max(0, subtotal + deliveryFee - couponDiscount);

  async function applyCoupon() {
    if (!couponCodeInput.trim()) {
      setCouponError("Vendos kodin e kuponit.");
      setCouponMessage(null);
      return;
    }

    setIsCouponValidating(true);
    setCouponError(null);
    setCouponMessage(null);

    try {
      const response = await fetch("/api/commerce/coupon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: couponCodeInput.trim(),
          subtotal,
          email,
          phone,
        }),
      });

      const payload = (await response.json()) as {
        ok: boolean;
        valid: boolean;
        message?: string;
        couponCode?: string;
        discountAmount?: number;
      };

      if (!response.ok || !payload.ok || !payload.valid) {
        setAppliedCouponCode(null);
        setCouponDiscount(0);
        setCouponError(payload.message ?? "Kuponi nuk eshte valid.");
        setCouponMessage(null);
        return;
      }

      const normalizedCode = payload.couponCode ?? couponCodeInput.trim().toUpperCase();
      const discount = Math.max(0, Number(payload.discountAmount ?? 0));

      setAppliedCouponCode(normalizedCode);
      setCouponDiscount(discount);
      setCouponError(null);
      setCouponMessage(`Kuponi ${normalizedCode} u aplikua.`);
      setValue("couponCode", normalizedCode);

      trackEvent("apply_coupon", {
        route: "/checkout",
        source: "checkout_coupon",
        couponCode: normalizedCode,
        discountAmount: discount,
      });
    } catch {
      setAppliedCouponCode(null);
      setCouponDiscount(0);
      setCouponError("Kuponi nuk u verifikua. Provo perseri.");
      setCouponMessage(null);
    } finally {
      setIsCouponValidating(false);
    }
  }

  const onSubmit = handleSubmit(async (values) => {
    if (items.length === 0) {
      setServerError("Your cart is empty.");
      return;
    }

    setIsSubmitting(true);
    setServerError(null);

    try {
      const payloadValues: CheckoutInput = {
        ...values,
        couponCode: appliedCouponCode ?? values.couponCode ?? "",
        affiliateCode: affiliateCode || values.affiliateCode || "",
      };

      if (isSignedInCustomer && saveToAccount) {
        await fetch("/api/account/checkout-profile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            customerName: payloadValues.customerName,
            phone: payloadValues.phone,
            country: payloadValues.country,
            city: payloadValues.city,
            address: payloadValues.address,
          }),
        }).catch(() => {
          // Non-blocking profile update. Order flow still proceeds.
        });
      }

      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ checkout: payloadValues, items }),
      });

      const payload = (await response.json()) as {
        ok: boolean;
        message?: string;
        order?: {
          orderCode: string;
          total: number;
          subtotal: number;
          deliveryFee: number;
          discountAmount?: number;
          couponCodeApplied?: string | null;
          paymentStatus?: string;
          paymentTransactionId?: string | null;
        };
      };

      if (!response.ok || !payload.ok || !payload.order) {
        throw new Error(payload.message ?? "Unable to place order.");
      }

      trackEvent("place_order", {
        route: "/checkout",
        source: "checkout_submit",
        orderCode: payload.order.orderCode,
        total: payload.order.total,
        paymentMethod: payloadValues.paymentMethod,
        deliveryMethod: payloadValues.deliveryMethod,
      });

      if (payloadValues.paymentMethod === "card_online") {
        trackEvent("payment_initiated", {
          route: "/checkout",
          source: "checkout_submit",
          orderCode: payload.order.orderCode,
          paymentMethod: payloadValues.paymentMethod,
          amount: payload.order.total,
          transactionId: payload.order.paymentTransactionId ?? undefined,
        });
      }

      clearCart();

      startTransition(() => {
        const params = new URLSearchParams({
          orderCode: payload.order!.orderCode,
          total: String(payload.order!.total),
          subtotal: String(payload.order!.subtotal),
          deliveryFee: String(payload.order!.deliveryFee),
          discountAmount: String(payload.order!.discountAmount ?? 0),
          couponCode: payload.order!.couponCodeApplied ?? "",
          paymentStatus: payload.order!.paymentStatus ?? "",
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
            Payment can be completed on delivery, in store, or online for card orders.
          </p>

          {isSignedInCustomer ? (
            <div className="mt-4 rounded-xl border border-mineral/28 bg-mineral/8 p-3 text-sm text-graphite/78">
              <p>
                Signed in{accountEmail ? ` as ${accountEmail}` : ""}. Checkout details
                are prefilled from your account.
              </p>
              <label className="mt-2 inline-flex items-center gap-2 text-xs uppercase tracking-[0.12em] text-graphite/68">
                <input
                  type="checkbox"
                  checked={saveToAccount}
                  onChange={(event) => setSaveToAccount(event.target.checked)}
                  className="h-4 w-4 rounded border border-graphite/25"
                />
                Save any edits to my account for next orders
              </label>
            </div>
          ) : null}

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
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
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

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-1">
                <label htmlFor="country" className="text-sm font-medium">
                  Country
                </label>
                <input
                  id="country"
                  {...register("country")}
                  className="w-full rounded-lg border border-graphite/18 bg-white/85 px-3 py-2 text-sm"
                />
                {errors.country ? (
                  <p className="text-xs text-walnut">{errors.country.message}</p>
                ) : null}
              </div>
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
              <div className="space-y-1 sm:col-span-1">
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

            <div className="space-y-2 rounded-xl border border-graphite/15 bg-white/70 p-3">
              <label htmlFor="couponCode" className="text-xs uppercase tracking-[0.12em] text-graphite/68">
                Coupon code
              </label>
              <div className="flex gap-2">
                <input
                  id="couponCode"
                  value={couponCodeInput}
                  onChange={(event) => setCouponCodeInput(event.target.value)}
                  placeholder="BERIL10"
                  className="w-full rounded-lg border border-graphite/18 bg-white/90 px-3 py-2 text-sm uppercase"
                />
                <button
                  type="button"
                  onClick={applyCoupon}
                  disabled={isCouponValidating}
                  className="inline-flex h-10 items-center rounded-full border border-graphite/18 bg-white px-4 text-xs uppercase tracking-[0.12em] text-graphite disabled:opacity-50"
                >
                  {isCouponValidating ? "Checking" : "Apply"}
                </button>
              </div>
              {couponMessage ? <p className="text-xs text-mineral">{couponMessage}</p> : null}
              {couponError ? <p className="text-xs text-walnut">{couponError}</p> : null}
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
                    <>
                      <option value="cash_on_delivery">Cash on Delivery</option>
                      <option value="card_online">Card Online (Test)</option>
                      <option value="bank_transfer">Bank Transfer</option>
                    </>
                  ) : (
                    <>
                      <option value="pay_in_store">Pay in Store on Pickup</option>
                      <option value="card_online">Card Online (Test)</option>
                      <option value="bank_transfer">Bank Transfer</option>
                    </>
                  )}
                </select>
                {errors.paymentMethod ? (
                  <p className="text-xs text-walnut">{errors.paymentMethod.message}</p>
                ) : null}
              </div>
            </div>

            {affiliateCode ? (
              <p className="text-xs text-graphite/68">
                Affiliate code detected: <span className="font-medium uppercase">{affiliateCode}</span>
              </p>
            ) : null}
            <input type="hidden" {...register("couponCode")} />
            <input type="hidden" {...register("affiliateCode")} />

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
            <div className="flex items-center justify-between">
              <dt className="text-graphite/72">Coupon discount</dt>
              <dd className="text-mineral">-{formatEur(couponDiscount)}</dd>
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
