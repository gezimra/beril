"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { startTransition, useState } from "react";
import { useForm } from "react-hook-form";

import { Container } from "@/components/layout/container";
import { SectionWrapper } from "@/components/layout/section-wrapper";
import { StatusBadge } from "@/components/ui/status-badge";
import { trackEvent } from "@/lib/analytics/track";
import { normalizeEmail, normalizePhone } from "@/lib/utils/codes";
import {
  repairTrackSchema,
  type RepairTrackInput,
} from "@/lib/validations/repair-track";
import type { RepairTrackResult } from "@/types/repair";
import { formatEur } from "@/lib/utils/money";

type RepairFallbackRecord = RepairTrackResult & {
  phoneNormalized: string;
  emailNormalized: string | null;
};

const FALLBACK_STORAGE_KEY = "beril_repairs_v1";

function getFallbackResult(input: RepairTrackInput): RepairTrackResult | null {
  try {
    const stored = JSON.parse(
      window.localStorage.getItem(FALLBACK_STORAGE_KEY) ?? "[]",
    ) as RepairFallbackRecord[];

    const normalized = input.phoneOrEmail.includes("@")
      ? normalizeEmail(input.phoneOrEmail)
      : normalizePhone(input.phoneOrEmail);

    const match = stored.find((entry) => {
      if (entry.repairCode !== input.repairCode) {
        return false;
      }

      return normalized === entry.phoneNormalized || normalized === entry.emailNormalized;
    });

    if (!match) {
      return null;
    }

    return {
      repairCode: match.repairCode,
      itemType: match.itemType,
      brand: match.brand,
      model: match.model,
      dateReceived: match.dateReceived,
      estimatedCompletion: match.estimatedCompletion,
      amountDue: match.amountDue,
      customerNote: match.customerNote,
      currentStatus: match.currentStatus,
      timeline: match.timeline,
    };
  } catch {
    return null;
  }
}

function statusLabel(status: RepairTrackResult["currentStatus"]) {
  switch (status) {
    case "request_received":
      return "Request received";
    case "awaiting_drop_off":
      return "Awaiting drop-off";
    case "received_in_store":
      return "Received in store";
    case "under_inspection":
      return "Under inspection";
    case "waiting_parts":
      return "Waiting parts";
    case "in_repair":
      return "In repair";
    case "ready_for_pickup":
      return "Ready for pickup";
    case "completed":
      return "Completed";
    case "cancelled":
      return "Cancelled";
    default:
      return status;
  }
}

export default function RepairTrackPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [result, setResult] = useState<RepairTrackResult | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RepairTrackInput>({
    resolver: zodResolver(repairTrackSchema),
    defaultValues: {
      repairCode: "",
      phoneOrEmail: "",
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    setIsSubmitting(true);
    setErrorMessage(null);
    setResult(null);

    try {
      const response = await fetch("/api/repairs/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      const payload = (await response.json()) as {
        ok: boolean;
        message?: string;
        result?: RepairTrackResult;
      };

      if (response.ok && payload.ok && payload.result) {
        trackEvent("repair_track_search", {
          route: "/repair-track",
          source: "repair_track_form",
          repairCode: values.repairCode,
          result: "found",
        });
        setResult(payload.result);
        return;
      }

      const fallback = getFallbackResult(values);
      if (fallback) {
        trackEvent("repair_track_search", {
          route: "/repair-track",
          source: "repair_track_form",
          repairCode: values.repairCode,
          result: "found",
        });
        setResult(fallback);
        return;
      }

      throw new Error(payload.message ?? "Repair request not found.");
    } catch (error) {
      trackEvent("repair_track_search", {
        route: "/repair-track",
        source: "repair_track_form",
        repairCode: values.repairCode,
        result: "not_found",
      });
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to track repair.",
      );
    } finally {
      startTransition(() => {
        setIsSubmitting(false);
      });
    }
  });

  return (
    <SectionWrapper className="py-16">
      <Container className="space-y-8">
        <header className="space-y-4">
          <StatusBadge tone="service">Track Repair</StatusBadge>
          <h1 className="text-5xl text-graphite sm:text-6xl">Repair Status</h1>
          <p className="max-w-2xl text-sm text-graphite/76 sm:text-base">
            Enter your repair code and phone or email to view the current repair
            timeline.
          </p>
        </header>

        <form
          onSubmit={onSubmit}
          className="surface-panel grid gap-4 p-6 sm:grid-cols-[1fr_1fr_auto]"
        >
          <div className="space-y-1">
            <label htmlFor="repairCode" className="text-sm font-medium">
              Repair code
            </label>
            <input
              id="repairCode"
              placeholder="BRL-R-2026-00001"
              {...register("repairCode")}
              className="w-full rounded-lg border border-graphite/18 bg-white/85 px-3 py-2 text-sm"
            />
            {errors.repairCode ? (
              <p className="text-xs text-walnut">{errors.repairCode.message}</p>
            ) : null}
          </div>
          <div className="space-y-1">
            <label htmlFor="phoneOrEmail" className="text-sm font-medium">
              Phone or email
            </label>
            <input
              id="phoneOrEmail"
              placeholder="+383..."
              {...register("phoneOrEmail")}
              className="w-full rounded-lg border border-graphite/18 bg-white/85 px-3 py-2 text-sm"
            />
            {errors.phoneOrEmail ? (
              <p className="text-xs text-walnut">{errors.phoneOrEmail.message}</p>
            ) : null}
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-auto inline-flex h-11 items-center rounded-full bg-walnut px-6 text-sm font-medium text-white disabled:opacity-50"
          >
            {isSubmitting ? "Searching..." : "Track"}
          </button>
        </form>

        {errorMessage ? (
          <p className="rounded-lg border border-walnut/35 bg-walnut/10 px-4 py-3 text-sm text-walnut">
            {errorMessage}
          </p>
        ) : null}

        {result ? (
          <section className="surface-panel space-y-6 p-6 sm:p-7">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <p className="text-xs uppercase tracking-[0.12em] text-graphite/62">
                  Repair Code
                </p>
                <p className="mt-1 text-sm font-medium text-graphite">
                  {result.repairCode}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.12em] text-graphite/62">
                  Item
                </p>
                <p className="mt-1 text-sm font-medium text-graphite">
                  {result.brand} {result.model}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.12em] text-graphite/62">
                  Current Status
                </p>
                <p className="mt-1 text-sm font-medium text-graphite">
                  {statusLabel(result.currentStatus)}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.12em] text-graphite/62">
                  Estimated Completion
                </p>
                <p className="mt-1 text-sm font-medium text-graphite">
                  {result.estimatedCompletion
                    ? new Date(result.estimatedCompletion).toLocaleDateString()
                    : "Pending"}
                </p>
              </div>
            </div>

            {result.customerNote ? (
              <p className="rounded-lg border border-graphite/10 bg-white/75 px-4 py-3 text-sm text-graphite/78">
                {result.customerNote}
              </p>
            ) : null}

            <div className="space-y-3">
              <h2 className="text-2xl text-graphite">Timeline</h2>
              <ol className="space-y-2">
                {result.timeline.map((event, index) => (
                  <li
                    key={`${event.status}-${event.createdAt}-${index}`}
                    className="rounded-lg border border-graphite/10 bg-white/75 px-4 py-3 text-sm"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-medium text-graphite">
                        {statusLabel(event.status)}
                      </span>
                      <span className="text-xs text-graphite/62">
                        {new Date(event.createdAt).toLocaleString()}
                      </span>
                    </div>
                    {event.note ? (
                      <p className="mt-1 text-graphite/74">{event.note}</p>
                    ) : null}
                  </li>
                ))}
              </ol>
            </div>

            <p className="text-sm text-graphite/76">
              Amount due:{" "}
              {result.amountDue === null ? "To be confirmed" : formatEur(result.amountDue)}
            </p>
          </section>
        ) : null}
      </Container>
    </SectionWrapper>
  );
}
