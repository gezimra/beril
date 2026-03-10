"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { startTransition, useState } from "react";
import { useForm } from "react-hook-form";

import { getMessages } from "@/lib/i18n";
import { contactSchema, type ContactInput } from "@/lib/validations/contact";

export function ContactForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const messages = getMessages();

  const {
    register,
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
        <div className="space-y-1">
          <label htmlFor="name" className="label-muted">
            {messages.contact.form.name}
          </label>
          <input
            id="name"
            {...register("name")}
            className="input-premium"
          />
          {errors.name ? (
            <p className="text-xs text-walnut">{errors.name.message}</p>
          ) : null}
        </div>
        <div className="space-y-1">
          <label htmlFor="phone" className="label-muted">
            {messages.contact.form.phone}
          </label>
          <input
            id="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            {...register("phone")}
            className="input-premium"
          />
          {errors.phone ? (
            <p className="text-xs text-walnut">{errors.phone.message}</p>
          ) : null}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <label htmlFor="email" className="label-muted">
            {messages.contact.form.email}
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            {...register("email")}
            className="input-premium"
          />
          {errors.email ? (
            <p className="text-xs text-walnut">{errors.email.message}</p>
          ) : null}
        </div>
        <div className="space-y-1">
          <label htmlFor="subject" className="label-muted">
            {messages.contact.form.subject}
          </label>
          <input
            id="subject"
            {...register("subject")}
            className="input-premium"
          />
          {errors.subject ? (
            <p className="text-xs text-walnut">{errors.subject.message}</p>
          ) : null}
        </div>
      </div>

      <div className="space-y-1">
        <label htmlFor="message" className="label-muted">
          {messages.contact.form.message}
        </label>
        <textarea
          id="message"
          rows={6}
          {...register("message")}
          className="textarea-premium min-h-36"
        />
        {errors.message ? (
          <p className="text-xs text-walnut">{errors.message.message}</p>
        ) : null}
      </div>

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
