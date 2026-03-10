import type { ReactNode } from "react";

import { cn } from "@/lib/utils/cn";

interface SectionWrapperProps {
  children: ReactNode;
  className?: string;
}

export function SectionWrapper({ children, className }: SectionWrapperProps) {
  return <section className={cn("py-14 sm:py-20", className)}>{children}</section>;
}
