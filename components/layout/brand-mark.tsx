import Link from "next/link";

import { getMessages } from "@/lib/i18n";
import { cn } from "@/lib/utils/cn";

interface BrandMarkProps {
  className?: string;
}

export function BrandMark({ className }: BrandMarkProps) {
  const messages = getMessages();

  return (
    <Link
      href="/"
      className={cn(
        "inline-flex flex-col items-start rounded-md px-1 py-1 leading-none text-graphite transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-walnut/35 focus-visible:ring-offset-2 focus-visible:ring-offset-ivory",
        className,
      )}
    >
      <span className="font-display text-[1.85rem] tracking-[0.18em] sm:text-[2rem] sm:tracking-[0.2em]">
        BERIL
      </span>
      <span className="mt-1 text-[0.46rem] uppercase tracking-[0.2em] text-graphite/70 sm:text-[0.52rem] sm:tracking-[0.23em]">
        {messages.header.descriptor}
      </span>
    </Link>
  );
}
