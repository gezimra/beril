"use client";

import { useEffect } from "react";

import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="grid min-h-screen place-items-center bg-ivory px-6">
      <div className="surface-panel max-w-xl p-8">
        <p className="text-xs uppercase tracking-[0.2em] text-graphite/62">
          Unexpected error
        </p>
        <h1 className="mt-2 text-4xl text-graphite">Something went wrong</h1>
        <p className="mt-4 text-sm text-graphite/72">
          The issue was captured. Retry now or refresh the page.
        </p>
        <Button className="mt-6" onClick={reset}>
          Try again
        </Button>
      </div>
    </div>
  );
}
