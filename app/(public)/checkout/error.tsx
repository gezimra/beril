"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function CheckoutError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Checkout Error]", error);
  }, [error]);

  return (
    <div className="mx-auto max-w-lg px-4 py-16 text-center">
      <h2 className="font-cormorant text-xl font-semibold text-graphite sm:text-2xl">
        Checkout Interrupted
      </h2>
      <p className="mt-2 text-sm text-graphite/70">
        We encountered an issue processing your checkout. Your cart items are safe.
      </p>
      {error.digest && (
        <p className="mt-2 font-mono text-xs text-graphite/50">Error ID: {error.digest}</p>
      )}
      <div className="mt-6 flex items-center justify-center gap-3">
        <button
          onClick={reset}
          className="inline-flex h-10 items-center rounded-full bg-mineral-green px-6 text-sm font-medium uppercase tracking-wider text-white transition-colors hover:bg-mineral-green/90"
        >
          Try again
        </button>
        <Link
          href="/cart"
          className="inline-flex h-10 items-center rounded-full border border-graphite/20 px-6 text-sm font-medium uppercase tracking-wider text-graphite transition-colors hover:bg-graphite/5"
        >
          Back to Cart
        </Link>
      </div>
    </div>
  );
}
