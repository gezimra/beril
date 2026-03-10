"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { createSupabaseServerClient } from "@/lib/db/supabase/server";
import { env } from "@/lib/env";

const fallbackRedirect = "/admin";

const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
  next: z.string().trim().optional(),
});

const resetPasswordSchema = z.object({
  email: z.string().trim().email(),
});

function normalizeNextPath(value?: string) {
  if (!value || !value.startsWith("/")) {
    return fallbackRedirect;
  }
  return value;
}

function withNext(pathname: string, nextPath: string) {
  if (nextPath === fallbackRedirect) {
    return pathname;
  }
  const separator = pathname.includes("?") ? "&" : "?";
  return `${pathname}${separator}next=${encodeURIComponent(nextPath)}`;
}

export async function loginAction(formData: FormData) {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    next: formData.get("next"),
  });

  const nextPath = normalizeNextPath(
    typeof formData.get("next") === "string"
      ? String(formData.get("next"))
      : undefined,
  );

  if (!parsed.success) {
    redirect(withNext("/login?error=invalid_credentials", nextPath));
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    const allowDevBypass =
      process.env.NODE_ENV === "development" &&
      process.env.ALLOW_DEV_ADMIN_BYPASS === "true";
    if (allowDevBypass) {
      redirect(nextPath);
    }
    redirect(withNext("/login?error=auth_unavailable", nextPath));
  }

  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    redirect(withNext("/login?error=invalid_credentials", nextPath));
  }

  redirect(nextPath);
}

export async function requestPasswordResetAction(formData: FormData) {
  const parsed = resetPasswordSchema.safeParse({
    email: formData.get("email"),
  });

  if (!parsed.success) {
    redirect("/reset-password?error=invalid_email");
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    redirect("/reset-password?error=auth_unavailable");
  }

  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${env.client.siteUrl}/reset-password`,
  });

  if (error) {
    redirect("/reset-password?error=reset_failed");
  }

  redirect("/reset-password?sent=1");
}

export async function logoutAction() {
  const supabase = await createSupabaseServerClient();

  if (supabase) {
    await supabase.auth.signOut();
  }

  redirect("/login?signed_out=1");
}
