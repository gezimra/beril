"use client";

import { useEffect } from "react";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Admin Error]", error);
  }, [error]);

  return (
    <div className="surface-panel mx-auto max-w-lg p-6 text-center sm:p-8">
      <h2 className="font-cormorant text-xl font-semibold text-graphite sm:text-2xl">
        Something went wrong
      </h2>
      <p className="mt-2 text-sm text-graphite/70">
        An error occurred while loading this admin page. Please try again or contact support if the
        issue persists.
      </p>
      {error.digest && (
        <p className="mt-2 font-mono text-xs text-graphite/50">Error ID: {error.digest}</p>
      )}
      <button
        onClick={reset}
        className="mt-5 inline-flex h-10 items-center rounded-full bg-mineral-green px-6 text-sm font-medium uppercase tracking-wider text-white transition-colors hover:bg-mineral-green/90"
      >
        Try again
      </button>
    </div>
  );
}
