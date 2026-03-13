import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { Container } from "@/components/layout/container";
import { SectionWrapper } from "@/components/layout/section-wrapper";
import { StatusBadge } from "@/components/ui/status-badge";
import { CopyButton } from "@/components/ui/copy-button";
import { formatEur } from "@/lib/utils/money";

type OrderSuccessPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function getParam(
  value: string | string[] | undefined,
  fallback = "",
): string {
  if (Array.isArray(value)) {
    return value[0] ?? fallback;
  }
  return value ?? fallback;
}

export default async function OrderSuccessPage({
  searchParams,
}: OrderSuccessPageProps) {
  const query = await searchParams;
  const orderCode = getParam(query.orderCode, "Pending Confirmation");
  const subtotal = Number(getParam(query.subtotal, "0"));
  const deliveryFee = Number(getParam(query.deliveryFee, "0"));
  const discountAmount = Number(getParam(query.discountAmount, "0"));
  const couponCode = getParam(query.couponCode, "");
  const paymentStatus = getParam(query.paymentStatus, "pending");
  const total = Number(getParam(query.total, "0"));

  return (
    <SectionWrapper className="py-16">
      <Container className="max-w-3xl">
        <article className="surface-panel p-8 sm:p-10">
          <StatusBadge tone="service">Order Received</StatusBadge>
          <h1 className="mt-4 text-5xl text-graphite sm:text-6xl">
            Faleminderit per porosine
          </h1>
          <p className="mt-4 text-sm text-graphite/76 sm:text-base">
            Your order has been received. We will confirm availability and delivery
            by phone or email.
          </p>
          <p className="mt-2 text-sm text-graphite/72">
            Payment status: <span className="font-medium">{paymentStatus}</span>
            {paymentStatus === "authorized"
              ? " (online card transaction initialized in test mode)."
              : " (completed on delivery or pickup)."}
          </p>

          <div className="mt-7 rounded-xl border border-graphite/12 bg-white/78 p-5">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-[0.14em] text-graphite/62">
                Order Code
              </p>
              <CopyButton value={orderCode} />
            </div>
            <p className="mt-2 text-2xl font-medium text-graphite">{orderCode}</p>
          </div>

          <dl className="mt-5 space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <dt className="text-graphite/72">Subtotal</dt>
              <dd>{formatEur(subtotal)}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-graphite/72">Delivery fee</dt>
              <dd>{formatEur(deliveryFee)}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-graphite/72">
                Discount {couponCode ? `(${couponCode})` : ""}
              </dt>
              <dd className="text-mineral">-{formatEur(discountAmount)}</dd>
            </div>
            <div className="flex items-center justify-between text-base font-medium">
              <dt>Total</dt>
              <dd>{formatEur(total)}</dd>
            </div>
          </dl>

          <div className="mt-7 rounded-xl border border-graphite/14 bg-white/75 p-4 space-y-2">
            <p className="text-sm font-medium text-graphite">Track this order</p>
            <p className="text-sm text-graphite/70">
              Use your order code and the phone or email you provided to check status at any time.
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              <Link href="/orders/track" className={buttonVariants({ variant: "primary", className: "h-10" })}>
                Track Order
              </Link>
              <Link href="/account/register" className={buttonVariants({ variant: "secondary", className: "h-10" })}>
                Create Account
              </Link>
            </div>
            <p className="text-xs text-graphite/55">
              Register with the same email to link this order to your account automatically.
            </p>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <Link href="/watches" className={buttonVariants({ variant: "secondary", className: "h-10" })}>
              Continue Shopping
            </Link>
          </div>
        </article>
      </Container>
    </SectionWrapper>
  );
}
