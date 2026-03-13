"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { startTransition, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";

import { useCart } from "@/components/commerce/cart-provider";
import { Button, buttonVariants } from "@/components/ui/button";
import { Container } from "@/components/layout/container";
import { SectionWrapper } from "@/components/layout/section-wrapper";
import { FloatInput, FloatSelect, FloatTextarea } from "@/components/ui/float-field";
import { PhoneInput } from "@/components/ui/phone-input";
import { StatusBadge } from "@/components/ui/status-badge";
import { trackEvent } from "@/lib/analytics/track";
import { formatEur } from "@/lib/utils/money";
import { getCurrentLocale } from "@/lib/i18n";
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
    control,
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
      setServerError("Shporta juaj eshte bosh.");
      return;
    }

    setIsSubmitting(true);
    setServerError(null);

    try {
      const payloadValues: CheckoutInput = {
        ...values,
        couponCode: appliedCouponCode ?? values.couponCode ?? "",
        affiliateCode: affiliateCode || values.affiliateCode || "",
        locale: getCurrentLocale(),
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
        throw new Error(payload.message ?? "Nuk u arrit te kryhet porosia.");
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
      setServerError(error instanceof Error ? error.message : "Procesi i porosise deshtoi.");
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
              Shto produkte ne shporte para se te vazhdosh me porosine.
            </p>
            <Link
              href="/cart"
              className={buttonVariants({ variant: "primary", className: "mt-5" })}
            >
              Shko te Shporta
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
          <StatusBadge tone="premium">Porosia</StatusBadge>
          <h1 className="mt-4 text-5xl text-graphite">Perfundo Porosine</h1>
          <p className="mt-3 text-sm text-graphite/74">
            Pagesa mund te kryhet ne dorezim, ne dyqan, ose online per porosite me karte.
          </p>

          {isSignedInCustomer ? (
            <div className="mt-4 rounded-xl border border-mineral/28 bg-mineral/8 p-3 text-sm text-graphite/78">
              <p>
                I kycur{accountEmail ? ` si ${accountEmail}` : ""}. Detajet e porosise
                jane plotesuar nga llogaria juaj.
              </p>
              <label className="mt-2 inline-flex items-center gap-2 text-xs uppercase tracking-[0.12em] text-graphite/68">
                <input
                  type="checkbox"
                  checked={saveToAccount}
                  onChange={(event) => setSaveToAccount(event.target.checked)}
                  className="h-4 w-4 rounded border border-graphite/25"
                />
                Ruaj ndryshimet ne llogarine time per porosite e ardhshme
              </label>
            </div>
          ) : null}

          <form onSubmit={onSubmit} className="mt-6 space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <FloatInput
                label="Emri i plote"
                id="customerName"
                {...register("customerName")}
                error={errors.customerName?.message}
              />
              <Controller
                name="phone"
                control={control}
                render={({ field }) => (
                  <PhoneInput
                    id="phone"
                    label="Telefoni"
                    required
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    autoComplete="tel"
                    error={errors.phone?.message}
                  />
                )}
              />
            </div>

            <FloatInput
              label="Email (opsionale)"
              id="email"
              {...register("email")}
              error={errors.email?.message}
            />

            <div className="grid gap-4 sm:grid-cols-3">
              <FloatInput
                label="Shteti"
                id="country"
                {...register("country")}
                error={errors.country?.message}
              />
              <FloatInput
                label="Qyteti"
                id="city"
                {...register("city")}
                error={errors.city?.message}
              />
              <FloatInput
                label="Adresa"
                id="address"
                {...register("address")}
                error={errors.address?.message}
              />
            </div>

            <FloatTextarea
              label="Shenime (opsionale)"
              id="notes"
              rows={3}
              {...register("notes")}
            />

            <div className="space-y-2 rounded-xl border border-graphite/15 bg-white/70 p-3">
              <div className="flex gap-2">
                <FloatInput
                  label="Kodi i kuponit"
                  id="couponCode"
                  value={couponCodeInput}
                  onChange={(event) => setCouponCodeInput(event.target.value)}
                  wrapperClassName="flex-1"
                />
                <button
                  type="button"
                  onClick={applyCoupon}
                  disabled={isCouponValidating}
                  className="mt-auto inline-flex h-10 cursor-pointer items-center rounded-full border border-graphite/18 bg-white px-4 text-xs uppercase tracking-[0.12em] text-graphite transition hover:border-graphite/32 hover:bg-white hover:shadow-sm disabled:pointer-events-none disabled:opacity-50"
                >
                  {isCouponValidating ? "Duke verifikuar" : "Apliko"}
                </button>
              </div>
              {couponMessage ? <p className="text-xs text-mineral">{couponMessage}</p> : null}
              {couponError ? <p className="text-xs text-walnut">{couponError}</p> : null}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <FloatSelect
                label="Menyra e dergeses"
                id="deliveryMethod"
                {...register("deliveryMethod")}
              >
                <option value="home_delivery">Dergese ne shtepi</option>
                <option value="store_pickup">Terheqje ne dyqan</option>
              </FloatSelect>
              <FloatSelect
                label="Menyra e pageses"
                id="paymentMethod"
                {...register("paymentMethod")}
                error={errors.paymentMethod?.message}
              >
                {deliveryMethod === "home_delivery" ? (
                  <>
                    <option value="cash_on_delivery">Pagese ne dorezim</option>
                    <option value="card_online">Karte online (Test)</option>
                    <option value="bank_transfer">Transfer bankar</option>
                  </>
                ) : (
                  <>
                    <option value="pay_in_store">Pagese ne dyqan ne terheqje</option>
                    <option value="card_online">Karte online (Test)</option>
                    <option value="bank_transfer">Transfer bankar</option>
                  </>
                )}
              </FloatSelect>
            </div>

            {affiliateCode ? (
              <p className="text-xs text-graphite/68">
                U gjet kodi affiliate: <span className="font-medium uppercase">{affiliateCode}</span>
              </p>
            ) : null}
            <input type="hidden" {...register("couponCode")} />
            <input type="hidden" {...register("affiliateCode")} />

            {serverError ? (
              <p className="rounded-lg border border-walnut/30 bg-walnut/10 px-3 py-2 text-sm text-walnut">
                {serverError}
              </p>
            ) : null}

            <Button type="submit" disabled={isSubmitting} className="px-6">
              {isSubmitting ? "Duke derguar porosine..." : "Perfundo Porosine"}
            </Button>
          </form>
        </section>

        <aside className="surface-panel h-fit p-5">
          <h2 className="text-2xl text-graphite">Permbledhja e Porosise</h2>
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
              <dt className="text-graphite/72">Nentotali</dt>
              <dd>{formatEur(subtotal)}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-graphite/72">Tarifa e dergeses</dt>
              <dd>{formatEur(deliveryFee)}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-graphite/72">Zbritja nga kuponi</dt>
              <dd className="text-mineral">-{formatEur(couponDiscount)}</dd>
            </div>
            <div className="flex items-center justify-between text-base font-medium">
              <dt>Totali</dt>
              <dd>{formatEur(total)}</dd>
            </div>
          </dl>
        </aside>
      </Container>
    </SectionWrapper>
  );
}
