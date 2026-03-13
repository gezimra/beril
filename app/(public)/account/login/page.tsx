import Link from "next/link";

import { customerLoginAction } from "@/app/(public)/account/actions";
import { Button } from "@/components/ui/button";
import { FloatInput } from "@/components/ui/float-field";
import { StatusBadge } from "@/components/ui/status-badge";

export const metadata = {
  title: "Customer Login",
  robots: {
    index: false,
    follow: false,
  },
};

type LoginPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function firstParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}

function getLoginMessage(errorCode?: string) {
  if (!errorCode) {
    return null;
  }

  switch (errorCode) {
    case "invalid_credentials":
      return "Email ose password i pasakte.";
    default:
      return "Login deshtoi. Provo perseri.";
  }
}

export default async function CustomerLoginPage({ searchParams }: LoginPageProps) {
  const query = await searchParams;
  const nextPath = firstParam(query.next) ?? "/account";
  const errorCode = firstParam(query.error);
  const signedOut = firstParam(query.signed_out) === "1";
  const registered = firstParam(query.registered) === "1";
  const requiresConfirmation = firstParam(query.confirm) === "1";
  const message = getLoginMessage(errorCode);

  return (
    <article className="surface-panel p-6 sm:p-8">
      <StatusBadge tone="premium">Account Login</StatusBadge>
      <h1 className="mt-3 text-4xl text-graphite">Sign in</h1>
      <p className="mt-3 text-sm text-graphite/74">
        Access your orders and discount codes.
      </p>

      {message ? (
        <p className="mt-4 rounded-lg border border-walnut/35 bg-walnut/10 px-3 py-2 text-sm text-walnut">
          {message}
        </p>
      ) : null}

      {signedOut ? (
        <p className="mt-4 rounded-lg border border-mineral/35 bg-mineral/12 px-3 py-2 text-sm text-mineral">
          Session ended.
        </p>
      ) : null}

      {registered ? (
        <p className="mt-4 rounded-lg border border-mineral/35 bg-mineral/12 px-3 py-2 text-sm text-mineral">
          Account created.
          {requiresConfirmation
            ? " Check your email and confirm your account before signing in."
            : " You can now sign in."}
        </p>
      ) : null}

      <form action={customerLoginAction} className="mt-5 space-y-4">
        <input type="hidden" name="next" value={nextPath} />
        <FloatInput
          label="Email"
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
        />
        <FloatInput
          label="Password"
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
        />
        <Button type="submit">Sign in</Button>
      </form>

      <p className="mt-5 text-sm text-graphite/72">
        <Link href="/account/forgot-password" className="underline">
          Forgot password?
        </Link>
      </p>
      <p className="mt-3 text-sm text-graphite/72">
        No account yet?{" "}
        <Link href="/account/register" className="underline">
          Register now
        </Link>
      </p>
    </article>
  );
}
