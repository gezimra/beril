"use client";

import Link from "next/link";
import { useActionState } from "react";

import { customerRequestPasswordResetAction } from "@/app/(public)/account/actions";
import { Button } from "@/components/ui/button";
import { FloatInput } from "@/components/ui/float-field";
import { StatusBadge } from "@/components/ui/status-badge";

const initialState = { error: undefined, success: false };

export default function ForgotPasswordPage() {
  const [state, action, pending] = useActionState(
    customerRequestPasswordResetAction,
    initialState,
  );

  return (
    <article className="surface-panel p-6 sm:p-8">
      <StatusBadge tone="premium">Reset Password</StatusBadge>
      <h1 className="mt-3 text-4xl text-graphite">Forgot password?</h1>
      <p className="mt-3 text-sm text-graphite/74">
        Enter your account email and we will send you a link to set a new password.
      </p>

      {state.success ? (
        <div className="mt-4 rounded-lg border border-mineral/35 bg-mineral/12 px-3 py-2 text-sm text-mineral">
          If an account exists for that email, a password reset link has been sent. Check your
          inbox.
        </div>
      ) : (
        <form action={action} className="mt-5 space-y-4">
          {state.error ? (
            <p className="rounded-lg border border-walnut/35 bg-walnut/10 px-3 py-2 text-sm text-walnut">
              {state.error}
            </p>
          ) : null}
          <FloatInput
            label="Email"
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
          />
          <Button type="submit" disabled={pending}>
            {pending ? "Sending..." : "Send reset link"}
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
