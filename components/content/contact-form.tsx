"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { startTransition, useState } from "react";
import { Controller, useForm } from "react-hook-form";

import { FloatInput, FloatTextarea } from "@/components/ui/float-field";
import { PhoneInput } from "@/components/ui/phone-input";
import { getMessages, type Locale } from "@/lib/i18n";
import { contactSchema, type ContactInput } from "@/lib/validations/contact";

interface ContactFormProps {
  locale?: Locale;
}

export function ContactForm({ locale }: ContactFormProps = {}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const messages = getMessages(locale);

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ContactInput>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      subject: "",
      message: "",
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    setIsSubmitting(true);
    setStatus("idle");
    setErrorMessage(null);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      const payload = (await response.json()) as { ok: boolean; message?: string };
      if (!response.ok || !payload.ok) {
        throw new Error(payload.message ?? "Unable to submit contact form.");
      }

      reset();
      setStatus("success");
    } catch (error) {
      setStatus("error");
      setErrorMessage(
        error instanceof Error ? error.message : "Contact submission failed.",
      );
    } finally {
      startTransition(() => {
        setIsSubmitting(false);
      });
    }
  });

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <FloatInput
          label={messages.contact.form.name}
          id="name"
          {...register("name")}
          error={errors.name?.message}
        />
        <Controller
          name="phone"
          control={control}
          render={({ field }) => (
            <PhoneInput
              id="phone"
              label={messages.contact.form.phone}
              required
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
              autoComplete="tel"
              error={errors.phone?.message}
            />
          )}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <FloatInput
          label={messages.contact.form.email}
          id="email"
          type="email"
          autoComplete="email"
          {...register("email")}
          error={errors.email?.message}
        />
        <FloatInput
          label={messages.contact.form.subject}
          id="subject"
          {...register("subject")}
          error={errors.subject?.message}
        />
      </div>

      <FloatTextarea
        label={messages.contact.form.message}
        id="message"
        rows={6}
        {...register("message")}
        error={errors.message?.message}
      />

      {status === "success" ? (
        <p className="rounded-lg border border-mineral/30 bg-mineral/10 px-3 py-2 text-sm text-mineral">
          {messages.contact.form.success}
        </p>
      ) : null}

      {status === "error" ? (
        <p className="rounded-lg border border-walnut/35 bg-walnut/10 px-3 py-2 text-sm text-walnut">
          {errorMessage ?? messages.contact.form.errorFallback}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="inline-flex h-11 items-center rounded-full bg-walnut px-6 text-sm font-medium text-white disabled:opacity-50"
      >
        {isSubmitting ? messages.contact.form.sending : messages.contact.form.send}
      </button>
    </form>
  );
}
