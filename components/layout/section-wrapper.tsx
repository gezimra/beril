import type { ReactNode } from "react";

import { cn } from "@/lib/utils/cn";

interface SectionWrapperProps {
  children: ReactNode;
  className?: string;
}

export function SectionWrapper({ children, className }: SectionWrapperProps) {
  return <section className={cn("section-rhythm", className)}>{children}</section>;
}
