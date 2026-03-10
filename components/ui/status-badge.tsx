import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils/cn";

const statusBadgeVariants = cva(
  "badge-soft",
  {
    variants: {
      tone: {
        neutral: "border-graphite/18 bg-white/70 text-graphite/74",
        warm: "border-walnut/32 bg-walnut/10 text-walnut",
        premium: "border-gold/42 bg-gold/16 text-walnut/90",
        service: "border-mineral/30 bg-mineral/12 text-mineral",
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
