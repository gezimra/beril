import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { ProfileEditForm } from "@/components/account/profile-edit-form";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  getAuthenticatedCustomerUser,
  getCheckoutProfileForAuthenticatedCustomer,
} from "@/lib/db/customer-account";

export const dynamic = "force-dynamic";

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
          <Link href="/account/login" className={buttonVariants({ variant: "primary", className: "h-10" })}>
            Login
          </Link>
          <Link href="/account/register" className={buttonVariants({ variant: "secondary", className: "h-10" })}>
            Register
          </Link>
          <Link href="/orders/track" className={buttonVariants({ variant: "secondary", className: "h-10" })}>
            Track my order
          </Link>
        </div>
      </article>
    );
  }

  const profile = await getCheckoutProfileForAuthenticatedCustomer();

  return (
    <div className="space-y-5">
      <article className="surface-panel p-6 sm:p-8">
        <StatusBadge tone="premium">Welcome</StatusBadge>
        <h1 className="mt-3 text-4xl text-graphite">{user.fullName ?? "Customer Account"}</h1>
        <p className="mt-2 text-sm text-graphite/74">{user.email}</p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link href="/account/orders" className={buttonVariants({ variant: "primary", className: "h-10" })}>
            View Orders
          </Link>
          <Link href="/account/discounts" className={buttonVariants({ variant: "secondary", className: "h-10" })}>
            View Discounts
          </Link>
        </div>
      </article>

      {profile ? (
        <article className="surface-panel p-6 sm:p-8">
          <StatusBadge tone="service">Profile</StatusBadge>
          <h2 className="mt-3 text-2xl text-graphite">Edit Profile</h2>
          <p className="mt-1 text-sm text-graphite/74">
            Keep your delivery details up to date for faster checkout.
          </p>
          <ProfileEditForm profile={profile} />
        </article>
      ) : null}
    </div>
  );
}
