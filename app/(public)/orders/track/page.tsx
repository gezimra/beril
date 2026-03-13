"use client";

import { useState } from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Container } from "@/components/layout/container";
import { SectionWrapper } from "@/components/layout/section-wrapper";
import { StatusBadge } from "@/components/ui/status-badge";
import { FloatInput } from "@/components/ui/float-field";
import { formatEur } from "@/lib/utils/money";
import type { GuestOrderTrackResult } from "@/lib/db/orders";

function orderStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    pending: "Pending",
    confirmed: "Confirmed",
    preparing: "Preparing",
    out_for_delivery: "Out for Delivery",
    ready_for_pickup: "Ready for Pickup",
    delivered: "Delivered",
    completed: "Completed",
    cancelled: "Cancelled",
  };
  return labels[status] ?? status;
}

function formatDate(isoString: string): string {
  return new Date(isoString).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function OrderTrackPage() {
  const [orderCode, setOrderCode] = useState("");
  const [phoneOrEmail, setPhoneOrEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<GuestOrderTrackResult | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/orders/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderCode: orderCode.trim(), phoneOrEmail: phoneOrEmail.trim() }),
      });

      const data = (await response.json()) as {
        ok: boolean;
        message?: string;
        result?: GuestOrderTrackResult;
      };

      if (!data.ok || !data.result) {
        setError(data.message ?? "Order not found.");
        return;
      }

      setResult(data.result);
    } catch {
      setError("Could not reach the server. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <SectionWrapper className="py-16">
      <Container className="max-w-2xl space-y-8">
        <header className="space-y-3">
          <StatusBadge tone="service">Track Order</StatusBadge>
          <h1 className="text-5xl text-graphite sm:text-6xl">Order Status</h1>
          <p className="text-sm text-graphite/74">
            Enter your order code and the phone number or email you used at checkout.
          </p>
        </header>

        <article className="surface-panel p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <FloatInput
              label="Order code"
              id="orderCode"
              value={orderCode}
              onChange={(e) => setOrderCode(e.target.value)}
              placeholder="BRL-2026-00001"
              required
            />
            <FloatInput
              label="Phone or email"
              id="phoneOrEmail"
              value={phoneOrEmail}
              onChange={(e) => setPhoneOrEmail(e.target.value)}
              placeholder="+383..."
              required
            />
            {error ? (
              <p className="rounded-lg border border-walnut/35 bg-walnut/10 px-3 py-2 text-sm text-walnut">
                {error}
              </p>
            ) : null}
            <Button type="submit" disabled={loading} className="px-6">
              {loading ? "Searching..." : "Track Order"}
            </Button>
          </form>
        </article>

        {result ? (
          <article className="surface-panel p-6 sm:p-8 space-y-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.14em] text-graphite/62">Order Code</p>
                <p className="mt-1 text-2xl font-medium text-graphite">{result.orderCode}</p>
                <p className="text-sm text-graphite/65">{formatDate(result.createdAt)}</p>
              </div>
              <div className="text-right">
                <p className="text-xs uppercase tracking-[0.14em] text-graphite/62">Status</p>
                <p className="mt-1 text-lg font-medium text-graphite">
                  {orderStatusLabel(result.orderStatus)}
                </p>
              </div>
            </div>

            <div>
              <p className="text-xs uppercase tracking-[0.14em] text-graphite/62">Items</p>
              <ul className="mt-2 space-y-1 text-sm text-graphite/80">
                {result.items.map((item, i) => (
                  <li key={i}>
                    {item.title} ({item.brand}) &times; {item.quantity} &mdash;{" "}
                    {formatEur(item.unitPrice * item.quantity)}
                  </li>
                ))}
              </ul>
            </div>

            <dl className="space-y-1 text-sm">
              <div className="flex items-center justify-between">
                <dt className="text-graphite/65">Subtotal</dt>
                <dd>{formatEur(result.subtotal)}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-graphite/65">Delivery</dt>
                <dd>{formatEur(result.deliveryFee)}</dd>
              </div>
              {result.discountAmount > 0 ? (
                <div className="flex items-center justify-between">
                  <dt className="text-graphite/65">Discount</dt>
                  <dd className="text-mineral">-{formatEur(result.discountAmount)}</dd>
                </div>
              ) : null}
              <div className="flex items-center justify-between font-medium">
                <dt>Total</dt>
                <dd>{formatEur(result.total)}</dd>
              </div>
            </dl>

            {result.history.length > 0 ? (
              <div>
                <p className="text-xs uppercase tracking-[0.14em] text-graphite/62">Timeline</p>
                <ol className="mt-3 space-y-2">
                  {result.history.map((event, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm">
                      <span className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-graphite/30" />
                      <span>
                        <span className="font-medium text-graphite">
                          {orderStatusLabel(event.status)}
                        </span>
                        {event.note ? (
                          <span className="text-graphite/65"> — {event.note}</span>
                        ) : null}
                        <span className="ml-2 text-xs text-graphite/50">
                          {formatDate(event.createdAt)}
                        </span>
                      </span>
                    </li>
                  ))}
                </ol>
              </div>
            ) : null}

            <div className="border-t border-graphite/10 pt-4">
              <p className="text-sm text-graphite/65">
                Want to track future orders in one place?{" "}
                <Link href="/account/register" className="underline text-graphite">
                  Create an account
                </Link>{" "}
                with the same email to link your order history.
              </p>
            </div>
          </article>
        ) : null}

        <div className="rounded-xl border border-graphite/12 bg-white/70 p-5 space-y-2 text-sm text-graphite/72">
          <p className="font-medium text-graphite">How to find your order code</p>
          <ul className="space-y-1 list-disc list-inside">
            <li>Check the confirmation page you saw after placing the order</li>
            <li>Look for a confirmation SMS or email from BERIL</li>
            <li>Contact BERIL directly if you cannot locate your code</li>
          </ul>
        </div>
      </Container>
    </SectionWrapper>
  );
}
