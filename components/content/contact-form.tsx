"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { startTransition, useState } from "react";
import { useForm } from "react-hook-form";

import { contactSchema, type ContactInput } from "@/lib/validations/contact";

export function ContactForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <label htmlFor="name" className="text-sm font-medium text-graphite">
            Name
          </label>
          <input
            id="name"
            {...register("name")}
            className="w-full rounded-lg border border-graphite/18 bg-white/85 px-3 py-2 text-sm"
          />
          {errors.name ? (
            <p className="text-xs text-walnut">{errors.name.message}</p>
          ) : null}
        </div>
        <div className="space-y-1">
          <label htmlFor="phone" className="text-sm font-medium text-graphite">
            Phone
          </label>
          <input
            id="phone"
            {...register("phone")}
            className="w-full rounded-lg border border-graphite/18 bg-white/85 px-3 py-2 text-sm"
          />
          {errors.phone ? (
            <p className="text-xs text-walnut">{errors.phone.message}</p>
          ) : null}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <label htmlFor="email" className="text-sm font-medium text-graphite">
            Email
          </label>
          <input
            id="email"
            {...register("email")}
            className="w-full rounded-lg border border-graphite/18 bg-white/85 px-3 py-2 text-sm"
          />
          {errors.email ? (
            <p className="text-xs text-walnut">{errors.email.message}</p>
          ) : null}
        </div>
        <div className="space-y-1">
          <label htmlFor="subject" className="text-sm font-medium text-graphite">
            Subject
          </label>
          <input
            id="subject"
            {...register("subject")}
            className="w-full rounded-lg border border-graphite/18 bg-white/85 px-3 py-2 text-sm"
          />
          {errors.subject ? (
            <p className="text-xs text-walnut">{errors.subject.message}</p>
          ) : null}
        </div>
      </div>

      <div className="space-y-1">
        <label htmlFor="message" className="text-sm font-medium text-graphite">
          Message
        </label>
        <textarea
          id="message"
          rows={5}
          {...register("message")}
          className="w-full rounded-lg border border-graphite/18 bg-white/85 px-3 py-2 text-sm"
        />
        {errors.message ? (
          <p className="text-xs text-walnut">{errors.message.message}</p>
        ) : null}
      </div>

      {status === "success" ? (
        <p className="rounded-lg border border-mineral/30 bg-mineral/10 px-3 py-2 text-sm text-mineral">
          Message sent successfully. BERIL will follow up soon.
        </p>
      ) : null}

      {status === "error" ? (
        <p className="rounded-lg border border-walnut/35 bg-walnut/10 px-3 py-2 text-sm text-walnut">
          {errorMessage ?? "Unable to send message."}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="inline-flex h-11 items-center rounded-full bg-walnut px-6 text-sm font-medium text-white disabled:opacity-50"
      >
        {isSubmitting ? "Sending..." : "Send Message"}
      </button>
    </form>
  );
}
