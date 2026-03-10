import Link from "next/link";
import type { ReactNode } from "react";

import { customerLogoutAction } from "@/app/(public)/account/actions";
import { Container } from "@/components/layout/container";
import { SectionWrapper } from "@/components/layout/section-wrapper";
import { StatusBadge } from "@/components/ui/status-badge";
import { getAuthenticatedCustomerUser } from "@/lib/db/customer-account";

export default async function AccountLayout({ children }: { children: ReactNode }) {
  const user = await getAuthenticatedCustomerUser();

  return (
    <SectionWrapper className="py-14 sm:py-16">
      <Container className="grid gap-6 lg:grid-cols-[15rem_minmax(0,1fr)]">
        <aside className="surface-panel h-fit p-4">
          <StatusBadge tone="service">Customer</StatusBadge>
          <h2 className="mt-3 text-xl text-graphite">My Account</h2>
          <p className="mt-1 text-xs text-graphite/65">
            {user ? user.email : "Guest"}
          </p>
          <nav className="mt-4 space-y-1">
            <Link
              href="/account"
              className="block rounded-lg px-3 py-2 text-sm text-graphite/82 hover:bg-white/70 hover:text-graphite"
            >
              Overview
            </Link>
            <Link
              href="/account/orders"
              className="block rounded-lg px-3 py-2 text-sm text-graphite/82 hover:bg-white/70 hover:text-graphite"
            >
              Orders
            </Link>
            <Link
              href="/account/discounts"
              className="block rounded-lg px-3 py-2 text-sm text-graphite/82 hover:bg-white/70 hover:text-graphite"
            >
              Discounts
            </Link>
            {!user ? (
              <>
                <Link
                  href="/account/login"
                  className="block rounded-lg px-3 py-2 text-sm text-graphite/82 hover:bg-white/70 hover:text-graphite"
                >
                  Login
                </Link>
                <Link
                  href="/account/register"
                  className="block rounded-lg px-3 py-2 text-sm text-graphite/82 hover:bg-white/70 hover:text-graphite"
                >
                  Register
                </Link>
              </>
            ) : null}
          </nav>

          {user ? (
            <form action={customerLogoutAction} className="mt-5">
              <button
                type="submit"
                className="inline-flex h-9 items-center rounded-full border border-graphite/18 bg-white/85 px-4 text-xs uppercase tracking-[0.12em] text-graphite"
              >
                Sign out
              </button>
            </form>
          ) : null}
        </aside>

        <section>{children}</section>
      </Container>
    </SectionWrapper>
  );
}

