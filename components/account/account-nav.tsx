"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";

interface AccountNavProps {
  email: string | null;
}

const navItems = [
  { href: "/account", label: "Overview", exact: true },
  { href: "/account/orders", label: "Orders" },
  { href: "/account/discounts", label: "Discounts" },
  { href: "/account/affiliate", label: "Referrals" },
];

export function AccountNav({ email }: AccountNavProps) {
  const pathname = usePathname();

  return (
    <nav className="mt-4 space-y-1">
      {navItems.map((item) => {
        const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "block rounded-lg px-3 py-2 text-sm transition",
              isActive
                ? "bg-white/80 font-medium text-graphite"
                : "text-graphite/82 hover:bg-white/70 hover:text-graphite",
            )}
          >
            {item.label}
          </Link>
        );
      })}
      <p className="mt-2 px-3 text-xs text-graphite/45">{email ?? "Guest"}</p>
    </nav>
  );
}
