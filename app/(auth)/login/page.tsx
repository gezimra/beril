import Link from "next/link";

import { loginAction } from "@/app/(auth)/actions";

export const metadata = {
  title: "Admin Login",
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
    case "auth_unavailable":
      return "Auth service nuk eshte i konfiguruar.";
    default:
      return "Login deshtoi. Provo perseri.";
  }
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const query = await searchParams;
  const nextPath = firstParam(query.next) ?? "/admin";
  const errorCode = firstParam(query.error);
  const signedOut = firstParam(query.signed_out) === "1";
  const message = getLoginMessage(errorCode);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-graphite/65">BERIL</p>
        <h1 className="mt-2 text-4xl text-graphite">Admin Login</h1>
        <p className="mt-3 text-sm text-graphite/72">
          Sign in with your owner account to access BERIL operations.
        </p>
      </div>

      {message ? (
        <p className="rounded-lg border border-walnut/35 bg-walnut/10 px-3 py-2 text-sm text-walnut">
          {message}
        </p>
      ) : null}

      {signedOut ? (
        <p className="rounded-lg border border-mineral/35 bg-mineral/12 px-3 py-2 text-sm text-mineral">
          Session ended. You can sign in again.
        </p>
      ) : null}

      <form action={loginAction} className="space-y-4" aria-label="Admin login form">
        <input type="hidden" name="next" value={nextPath} />
        <div className="space-y-1">
          <label htmlFor="email" className="text-sm font-medium text-graphite">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            placeholder="owner@beril.store"
            required
            autoComplete="email"
            className="w-full rounded-xl border border-graphite/20 bg-white/80 px-4 py-3 text-sm"
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="password" className="text-sm font-medium text-graphite">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            placeholder="********"
            required
            autoComplete="current-password"
            className="w-full rounded-xl border border-graphite/20 bg-white/80 px-4 py-3 text-sm"
          />
        </div>
        <button
          type="submit"
          className="inline-flex h-11 items-center rounded-full bg-walnut px-5 text-sm font-medium text-white"
        >
          Continue
        </button>
      </form>

      <Link href="/reset-password" className="text-sm text-graphite/74 hover:text-graphite">
        Forgot password?
      </Link>
    </div>
  );
}
