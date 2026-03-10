import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils/cn";

const statusBadgeVariants = cva(
  "inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium uppercase tracking-[0.14em]",
  {
    variants: {
      tone: {
        neutral: "border-graphite/20 text-graphite/75 bg-white/65",
        warm: "border-walnut/35 text-walnut bg-walnut/10",
        premium: "border-gold/50 text-walnut bg-gold/20",
        service: "border-mineral/35 text-mineral bg-mineral/15",
      },
    },
    defaultVariants: {
      tone: "neutral",
    },
  },
);

type StatusBadgeProps = VariantProps<typeof statusBadgeVariants> & {
  children: React.ReactNode;
  className?: string;
};

export function StatusBadge({ children, tone, className }: StatusBadgeProps) {
  return (
    <span className={cn(statusBadgeVariants({ tone, className }))}>{children}</span>
  );
}
