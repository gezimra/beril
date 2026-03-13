"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { customerResetPasswordAction } from "@/app/(public)/account/actions";
import { Button } from "@/components/ui/button";
import { FloatInput } from "@/components/ui/float-field";
import { StatusBadge } from "@/components/ui/status-badge";

const initialState = { error: undefined, success: false };

export default function ResetPasswordPage() {
  const router = useRouter();
  const [state, action, pending] = useActionState(
    customerResetPasswordAction,
    initialState,
  );

  useEffect(() => {
    if (state.success) {
      const t = setTimeout(() => router.push("/account"), 2000);
      return () => clearTimeout(t);
    }
  }, [state.success, router]);

  return (
    <article className="surface-panel p-6 sm:p-8">
      <StatusBadge tone="premium">New Password</StatusBadge>
      <h1 className="mt-3 text-4xl text-graphite">Set new password</h1>
      <p className="mt-3 text-sm text-graphite/74">
        Choose a new password for your account.
      </p>

      {state.success ? (
        <div className="mt-4 rounded-lg border border-mineral/35 bg-mineral/12 px-3 py-2 text-sm text-mineral">
          Password updated. Redirecting to your account...
        </div>
      ) : (
        <form action={action} className="mt-5 space-y-4">
          {state.error ? (
            <p className="rounded-lg border border-walnut/35 bg-walnut/10 px-3 py-2 text-sm text-walnut">
              {state.error}
            </p>
          ) : null}
          <FloatInput
            label="New password"
            id="password"
            name="password"
            type="password"
            minLength={8}
            required
            autoComplete="new-password"
          />
          <Button type="submit" disabled={pending}>
            {pending ? "Saving..." : "Set password"}
          </Button>
        </form>
      )}

      <p className="mt-5 text-sm text-graphite/72">
        <Link href="/account/login" className="underline">
          Back to login
        </Link>
      </p>
    </article>
  );
}
