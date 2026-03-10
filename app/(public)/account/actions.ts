"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import {
  loginCustomerAccount,
  logoutCustomerAccount,
  registerCustomerAccount,
} from "@/lib/db/customer-account";

const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
  next: z.string().trim().optional(),
});

const registerSchema = z.object({
  fullName: z.string().trim().min(2),
  email: z.string().trim().email(),
  phone: z.string().trim().optional(),
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
