"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { revalidatePath } from "next/cache";

import {
  loginCustomerAccount,
  logoutCustomerAccount,
  registerCustomerAccount,
  updateCheckoutProfileForAuthenticatedCustomer,
} from "@/lib/db/customer-account";
import { createSupabaseServerClient } from "@/lib/db/supabase/server";
import { env } from "@/lib/env";
import { optionalPhoneInputSchema } from "@/lib/validations/phone";

const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
  next: z.string().trim().optional(),
});

const registerSchema = z.object({
  fullName: z.string().trim().min(2),
  email: z.string().trim().email(),
  phone: optionalPhoneInputSchema,
  password: z.string().min(8),
});

function normalizeNextPath(value?: string) {
  if (!value || !value.startsWith("/")) {
    return "/account";
  }
  return value;
}

export async function customerLoginAction(formData: FormData) {
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
    redirect(`/account/login?error=invalid_credentials&next=${encodeURIComponent(nextPath)}`);
  }

  try {
    await loginCustomerAccount({
      email: parsed.data.email,
      password: parsed.data.password,
    });
  } catch {
    redirect(`/account/login?error=invalid_credentials&next=${encodeURIComponent(nextPath)}`);
  }

  redirect(nextPath);
}

export async function customerRegisterAction(formData: FormData) {
  const parsed = registerSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    redirect("/account/register?error=invalid_payload");
  }

  try {
    const result = await registerCustomerAccount({
      fullName: parsed.data.fullName,
      email: parsed.data.email,
      phone: parsed.data.phone || null,
      password: parsed.data.password,
    });

    if (result.needsEmailConfirmation) {
      redirect("/account/login?registered=1&confirm=1");
    }
  } catch (error) {
    const message = error instanceof Error ? error.message.toLowerCase() : "";

    if (
      message.includes("over_email_send_rate_limit") ||
      message.includes("rate limit")
    ) {
      redirect("/account/register?error=email_rate_limit");
    }

    if (message.includes("user already registered")) {
      redirect("/account/login?registered=1");
    }

    redirect("/account/register?error=register_failed");
  }

  redirect("/account");
}

export async function customerLogoutAction() {
  await logoutCustomerAccount();
  redirect("/account/login?signed_out=1");
}

const profileUpdateSchema = z.object({
  customerName: z.string().trim().min(2),
  phone: optionalPhoneInputSchema,
  country: z.string().trim().min(1).default("Kosovo"),
  city: z.string().trim(),
  address: z.string().trim(),
});

export async function customerUpdateProfileAction(
  _prevState: { error?: string; success?: boolean },
  formData: FormData,
): Promise<{ error?: string; success?: boolean }> {
  const parsed = profileUpdateSchema.safeParse({
    customerName: formData.get("customerName"),
    phone: formData.get("phone"),
    country: formData.get("country"),
    city: formData.get("city"),
    address: formData.get("address"),
  });

  if (!parsed.success) {
    return { error: "Invalid input. Check all fields and try again." };
  }

  try {
    await updateCheckoutProfileForAuthenticatedCustomer({
      ...parsed.data,
      phone: parsed.data.phone ?? "",
    });
  } catch {
    return { error: "Unable to save changes. Please try again." };
  }

  revalidatePath("/account");
  return { success: true };
}

export async function customerRequestPasswordResetAction(
  _prevState: { error?: string; success?: boolean },
  formData: FormData,
): Promise<{ error?: string; success?: boolean }> {
  const email = z.string().trim().email().safeParse(formData.get("email"));
  if (!email.success) {
    return { error: "Enter a valid email address." };
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return { error: "Service unavailable. Please try again." };
  }

  const siteUrl = env.client.siteUrl.replace(/\/+$/, "");

  await supabase.auth.resetPasswordForEmail(email.data, {
    redirectTo: `${siteUrl}/auth/callback?next=/account/reset-password`,
  });

  // Always succeed to avoid email enumeration.
  return { success: true };
}

export async function customerResetPasswordAction(
  _prevState: { error?: string; success?: boolean },
  formData: FormData,
): Promise<{ error?: string; success?: boolean }> {
  const password = z.string().min(8).safeParse(formData.get("password"));
  if (!password.success) {
    return { error: "Password must be at least 8 characters." };
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return { error: "Service unavailable. Please try again." };
  }

  const { error } = await supabase.auth.updateUser({ password: password.data });
  if (error) {
    return { error: "Unable to update password. The link may have expired." };
  }

  return { success: true };
}
