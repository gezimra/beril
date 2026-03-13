import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils/cn";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-full text-sm font-medium transition disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary:
          "bg-walnut text-white hover:brightness-[0.88] hover:shadow-md focus-visible:outline-walnut",
        // "bg-walnut text-white hover:brightness-[0.88] hover:shadow-md focus-visible:outline-walnut",
        secondary:
          "border border-graphite/20 bg-white/80 text-graphite hover:border-graphite/32 hover:bg-white hover:shadow-sm",
        ghost:
          "bg-transparent text-graphite hover:bg-graphite/8 border border-transparent hover:border-graphite/10",
      },
      size: {
        default: "h-11 px-5",
        sm: "h-9 px-4 text-xs",
        icon: "h-10 w-10 rounded-full",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  },
);

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants>;

function Button({
  className,
  variant,
  size,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
