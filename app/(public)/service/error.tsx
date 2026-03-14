"use client";

import { useEffect } from "react";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";

export default function ServiceError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Service Error]", error);
  }, [error]);

  return (
    <div className="mx-auto max-w-lg px-4 py-16 text-center">
      <h2 className="font-cormorant text-xl font-semibold text-graphite sm:text-2xl">
        Something went wrong
      </h2>
      <p className="mt-2 text-sm text-graphite/70">
        We encountered an issue loading the service page. Please try again.
      </p>
      <div className="mt-6 flex items-center justify-center gap-3">
        <button
          onClick={reset}
          className={buttonVariants({ variant: "primary", className: "h-10" })}
        >
          Try again
        </button>
        <Link
          href="/"
          className={buttonVariants({ variant: "secondary", className: "h-10" })}
        >
          Go Home
        </Link>
      </div>
    </div>
  );
}
