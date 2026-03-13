"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { startTransition, useState } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Container } from "@/components/layout/container";
import { SectionWrapper } from "@/components/layout/section-wrapper";
import { FloatInput } from "@/components/ui/float-field";
import { StatusBadge } from "@/components/ui/status-badge";
import { trackEvent } from "@/lib/analytics/track";
import { getMessages } from "@/lib/i18n";
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

export default function RepairTrackPage() {
  const messages = getMessages();
  const t = messages.repairTrack;

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

  function statusLabel(status: RepairTrackResult["currentStatus"]) {
    switch (status) {
      case "request_received": return t.statusRequestReceived;
      case "awaiting_drop_off": return t.statusAwaitingDropOff;
      case "received_in_store": return t.statusReceivedInStore;
      case "under_inspection": return t.statusUnderInspection;
      case "waiting_parts": return t.statusWaitingParts;
      case "in_repair": return t.statusInRepair;
      case "ready_for_pickup": return t.statusReadyForPickup;
      case "completed": return t.statusCompleted;
      case "cancelled": return t.statusCancelled;
      default: return status;
    }
  }

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
          <StatusBadge tone="service">{t.badge}</StatusBadge>
          <h1 className="text-5xl text-graphite sm:text-6xl">{t.title}</h1>
          <p className="max-w-2xl text-sm text-graphite/76 sm:text-base">
            {t.subtitle}
          </p>
        </header>

        <form
          onSubmit={onSubmit}
          className="surface-panel grid gap-4 p-6 sm:grid-cols-[1fr_1fr_auto]"
        >
          <FloatInput
            label={t.codeLabel}
            id="repairCode"
            placeholder={t.codePlaceholder}
            {...register("repairCode")}
            error={errors.repairCode?.message}
          />
          <FloatInput
            label={t.lookupLabel}
            id="phoneOrEmail"
            placeholder={t.lookupPlaceholder}
            {...register("phoneOrEmail")}
            error={errors.phoneOrEmail?.message}
          />
          <Button type="submit" disabled={isSubmitting} className="mt-auto px-6">
            {isSubmitting ? t.submitting : t.submit}
          </Button>
        </form>

        <div className="surface-panel p-6">
          <p className="text-xs uppercase tracking-[0.14em] text-graphite/65">
            {t.howItWorksTitle}
          </p>
          <p className="mt-2 text-sm text-graphite/72">{t.howItWorksIntro}</p>
          <ol className="mt-3 space-y-1.5">
            {(t.howItWorksItems as readonly string[]).map((item, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm text-graphite/72">
                <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-graphite/10 text-[0.6rem] font-medium text-graphite/65">
                  {i + 1}
                </span>
                {item}
              </li>
            ))}
          </ol>
        </div>

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
                  {t.resultRepairCode}
                </p>
                <p className="mt-1 text-sm font-medium text-graphite">
                  {result.repairCode}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.12em] text-graphite/62">
                  {t.resultItem}
                </p>
                <p className="mt-1 text-sm font-medium text-graphite">
                  {result.brand} {result.model}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.12em] text-graphite/62">
                  {t.resultCurrentStatus}
                </p>
                <p className="mt-1 text-sm font-medium text-graphite">
                  {statusLabel(result.currentStatus)}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.12em] text-graphite/62">
                  {t.resultEstimatedCompletion}
                </p>
                <p className="mt-1 text-sm font-medium text-graphite">
                  {result.estimatedCompletion
                    ? new Date(result.estimatedCompletion).toLocaleDateString()
                    : t.resultPending}
                </p>
              </div>
            </div>

            {result.customerNote ? (
              <p className="rounded-lg border border-graphite/10 bg-white/75 px-4 py-3 text-sm text-graphite/78">
                {result.customerNote}
              </p>
            ) : null}

            <div className="space-y-3">
              <h2 className="text-2xl text-graphite">{t.timelineTitle}</h2>
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
              {t.amountDue}:{" "}
              {result.amountDue === null ? t.pendingAmount : formatEur(result.amountDue)}
            </p>
          </section>
        ) : null}
      </Container>
    </SectionWrapper>
  );
}
