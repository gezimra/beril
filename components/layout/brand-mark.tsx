import Link from "next/link";

import { cn } from "@/lib/utils/cn";

interface BrandMarkProps {
  className?: string;
}

export function BrandMark({ className }: BrandMarkProps) {
  return (
    <Link
      href="/"
      className={cn(
        "inline-flex rounded-md px-1 py-1 leading-none text-graphite transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-walnut/35 focus-visible:ring-offset-2 focus-visible:ring-offset-ivory",
        className,
      )}
    >
      <span className="font-display text-[1.85rem] tracking-[0.18em] sm:text-[2rem] sm:tracking-[0.2em]">
        BERIL
      </span>
      <span className="text-[0.56rem] uppercase tracking-[0.22em] text-graphite/70 sm:text-[0.62rem] sm:tracking-[0.26em]">
        Watches | Eyewear | Service
      </span>
    </Link>
  );
}
