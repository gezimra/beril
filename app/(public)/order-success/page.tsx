import Link from "next/link";

import { Container } from "@/components/layout/container";
import { SectionWrapper } from "@/components/layout/section-wrapper";
import { StatusBadge } from "@/components/ui/status-badge";
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
            by phone or email. Payment will be completed on delivery or on pickup.
          </p>

          <div className="mt-7 rounded-xl border border-graphite/12 bg-white/78 p-5">
            <p className="text-xs uppercase tracking-[0.14em] text-graphite/62">
              Order Code
            </p>
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
            <div className="flex items-center justify-between text-base font-medium">
              <dt>Total</dt>
              <dd>{formatEur(total)}</dd>
            </div>
          </dl>

          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              href="/watches"
              className="inline-flex h-11 items-center rounded-full bg-walnut px-5 text-sm font-medium text-white"
            >
              Continue Shopping
            </Link>
            <Link
              href="/service"
              className="inline-flex h-11 items-center rounded-full border border-graphite/18 bg-white/75 px-5 text-sm font-medium text-graphite"
            >
              Explore Service
            </Link>
          </div>
        </article>
      </Container>
    </SectionWrapper>
  );
}
