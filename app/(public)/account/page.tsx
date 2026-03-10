import Link from "next/link";

import { StatusBadge } from "@/components/ui/status-badge";
import { getAuthenticatedCustomerUser } from "@/lib/db/customer-account";

export const metadata = {
  title: "My Account",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AccountOverviewPage() {
  const user = await getAuthenticatedCustomerUser();

  if (!user) {
    return (
      <article className="surface-panel p-6 sm:p-8">
        <StatusBadge tone="premium">Account</StatusBadge>
        <h1 className="mt-3 text-4xl text-graphite">Sign in to access your account</h1>
        <p className="mt-3 text-sm text-graphite/74">
          Create an account to track orders and receive customer-specific discounts.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            href="/account/login"
            className="inline-flex h-10 items-center rounded-full bg-walnut px-5 text-sm font-medium text-white"
          >
            Login
          </Link>
          <Link
            href="/account/register"
            className="inline-flex h-10 items-center rounded-full border border-graphite/18 bg-white/80 px-5 text-sm font-medium text-graphite"
          >
            Register
          </Link>
        </div>
      </article>
    );
  }

  return (
    <article className="surface-panel p-6 sm:p-8">
      <StatusBadge tone="premium">Welcome</StatusBadge>
      <h1 className="mt-3 text-4xl text-graphite">{user.fullName ?? "Customer Account"}</h1>
      <p className="mt-2 text-sm text-graphite/74">{user.email}</p>
      <p className="mt-4 text-sm text-graphite/74">
        Use the menu to view your orders and available discount codes.
      </p>
      <div className="mt-5 flex flex-wrap gap-3">
        <Link
          href="/account/orders"
          className="inline-flex h-10 items-center rounded-full bg-walnut px-5 text-sm font-medium text-white"
        >
          View Orders
        </Link>
        <Link
          href="/account/discounts"
          className="inline-flex h-10 items-center rounded-full border border-graphite/18 bg-white/80 px-5 text-sm font-medium text-graphite"
        >
          View Discounts
        </Link>
      </div>
    </article>
  );
}

