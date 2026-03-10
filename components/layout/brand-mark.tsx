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
        "inline-flex flex-col leading-none text-graphite transition-opacity hover:opacity-90",
        className,
      )}
    >
      <span className="font-display text-[2rem] tracking-[0.2em]">BERIL</span>
      <span className="text-[0.62rem] uppercase tracking-[0.26em] text-graphite/70">
        Watches | Eyewear | Service
      </span>
    </Link>
  );
}
