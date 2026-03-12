import Link from "next/link";

import { requestPasswordResetAction } from "@/app/(auth)/actions";
import { FloatInput } from "@/components/ui/float-field";

export const metadata = {
  title: "Reset Password",
  robots: {
    index: false,
    follow: false,
  },
};

type ResetPasswordPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function firstParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}

function getResetErrorMessage(errorCode?: string) {
  if (!errorCode) {
    return null;
  }

  switch (errorCode) {
    case "invalid_email":
      return "Please enter a valid email address.";
    case "auth_unavailable":
      return "Auth service is not configured.";
    case "reset_failed":
      return "Unable to send reset link right now.";
    default:
      return "Reset request failed.";
  }
}

export default async function ResetPasswordPage({
  searchParams,
}: ResetPasswordPageProps) {
  const query = await searchParams;
  const errorCode = firstParam(query.error);
  const sent = firstParam(query.sent) === "1";
  const message = getResetErrorMessage(errorCode);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-graphite/65">BERIL</p>
        <h1 className="mt-2 text-4xl text-graphite">Reset Password</h1>
        <p className="mt-3 text-sm text-graphite/72">
          Request a reset link for your owner account.
        </p>
      </div>

      {message ? (
        <p className="rounded-lg border border-walnut/35 bg-walnut/10 px-3 py-2 text-sm text-walnut">
          {message}
        </p>
      ) : null}

      {sent ? (
        <p className="rounded-lg border border-mineral/35 bg-mineral/10 px-3 py-2 text-sm text-mineral">
          Reset link sent. Check your inbox.
        </p>
      ) : null}

      <form
        action={requestPasswordResetAction}
        className="space-y-4"
        aria-label="Reset password form"
      >
        <FloatInput
          label="Email"
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
        />
        <button
          type="submit"
          className="inline-flex h-11 items-center rounded-full bg-walnut px-5 text-sm font-medium text-white"
        >
          Send reset link
        </button>
      </form>

      <Link href="/login" className="text-sm text-graphite/74 hover:text-graphite">
        Back to login
      </Link>
    </div>
  );
}
