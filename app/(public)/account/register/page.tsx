import Link from "next/link";

import { customerRegisterAction } from "@/app/(public)/account/actions";
import { Button } from "@/components/ui/button";
import { FloatInput } from "@/components/ui/float-field";
import { PhoneInput } from "@/components/ui/phone-input";
import { StatusBadge } from "@/components/ui/status-badge";

export const metadata = {
  title: "Create Account",
  robots: {
    index: false,
    follow: false,
  },
};

type RegisterPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function firstParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}

export default async function CustomerRegisterPage({
  searchParams,
}: RegisterPageProps) {
  const query = await searchParams;
  const error = firstParam(query.error);
  const errorMessage =
    error === "email_rate_limit"
      ? "Shume kerkesa per email konfirmimi. Prit pak minuta dhe provo perseri."
      : error
        ? "Registration failed. Check your details and try again."
        : null;

  return (
    <article className="surface-panel p-6 sm:p-8">
      <StatusBadge tone="premium">Create Account</StatusBadge>
      <h1 className="mt-3 text-4xl text-graphite">Register</h1>
      <p className="mt-3 text-sm text-graphite/74">
        Create a customer account to track orders and access assigned discounts.
      </p>

      {errorMessage ? (
        <p className="mt-4 rounded-lg border border-walnut/35 bg-walnut/10 px-3 py-2 text-sm text-walnut">
          {errorMessage}
        </p>
      ) : null}

      <form action={customerRegisterAction} className="mt-5 space-y-4">
        <FloatInput label="Full name" id="fullName" name="fullName" type="text" required />
        <FloatInput label="Email" id="email" name="email" type="email" required />
        <PhoneInput label="Phone (optional)" id="phone" name="phone" />
        <FloatInput
          label="Password"
          id="password"
          name="password"
          type="password"
          minLength={8}
          required
        />
        <Button type="submit">Create account</Button>
      </form>

      <p className="mt-5 text-sm text-graphite/72">
        Already have an account?{" "}
        <Link href="/account/login" className="underline">
          Sign in
        </Link>
      </p>
    </article>
  );
}
