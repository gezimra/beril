import type { ReactNode } from "react";

import { customerLogoutAction } from "@/app/(public)/account/actions";
import { AccountNav } from "@/components/account/account-nav";
import { Container } from "@/components/layout/container";
import { SectionWrapper } from "@/components/layout/section-wrapper";
import { StatusBadge } from "@/components/ui/status-badge";
import { getAuthenticatedCustomerUser } from "@/lib/db/customer-account";

export const dynamic = "force-dynamic";

export default async function AccountLayout({ children }: { children: ReactNode }) {
  const user = await getAuthenticatedCustomerUser();

  return (
    <SectionWrapper className="py-14 sm:py-16">
      <Container className="grid gap-6 lg:grid-cols-[15rem_minmax(0,1fr)]">
        <aside className="surface-panel h-fit p-4">
          <StatusBadge tone="service">Customer</StatusBadge>
          <h2 className="mt-3 text-xl text-graphite">My Account</h2>
          <AccountNav email={user?.email ?? null} />

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
