import Link from "next/link";

import { getMessages, type Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils/cn";

interface BrandMarkProps {
  className?: string;
  locale: Locale;
  compact?: boolean;
}

export function BrandMark({ className, locale, compact = false }: BrandMarkProps) {
  const messages = getMessages(locale);

  return (
    <Link
      href="/"
      className={cn(
        "inline-flex flex-col items-start rounded-md px-1 py-1 leading-none text-graphite transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-walnut/35 focus-visible:ring-offset-2 focus-visible:ring-offset-ivory",
        className,
      )}
    >
      <span
        className={[
          "font-display",
          compact
            ? "text-[1.45rem] tracking-[0.14em] sm:text-[1.75rem] sm:tracking-[0.18em]"
            : "text-[1.85rem] tracking-[0.18em] sm:text-[2rem] sm:tracking-[0.2em]",
        ].join(" ")}
      >
        BERIL
      </span>
      <span
        className={[
          "mt-1 max-w-[9.25rem] truncate uppercase text-graphite/70 sm:max-w-none",
          compact
            ? "max-[380px]:hidden text-[0.42rem] tracking-[0.16em] sm:text-[0.46rem] sm:tracking-[0.19em]"
            : "text-[0.46rem] tracking-[0.2em] sm:text-[0.52rem] sm:tracking-[0.23em]",
        ].join(" ")}
      >
        {messages.header.descriptor}
      </span>
    </Link>
  );
}
