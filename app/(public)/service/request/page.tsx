"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { startTransition, useState } from "react";
import { useForm } from "react-hook-form";

import { Container } from "@/components/layout/container";
import { SectionWrapper } from "@/components/layout/section-wrapper";
import { StatusBadge } from "@/components/ui/status-badge";
import { trackEvent } from "@/lib/analytics/track";
import {
  repairRequestSchema,
  type RepairRequestInput,
} from "@/lib/validations/repair-request";
import { normalizeEmail, normalizePhone } from "@/lib/utils/codes";

type RepairFallbackRecord = {
  repairCode: string;
  phoneNormalized: string;
  emailNormalized: string | null;
  itemType: string;
  brand: string;
  model: string;
  dateReceived: string;
  estimatedCompletion: string | null;
  amountDue: number | null;
  customerNote: string | null;
  currentStatus:
    | "request_received"
    | "awaiting_drop_off"
    | "received_in_store"
    | "under_inspection"
    | "waiting_parts"
    | "in_repair"
    | "ready_for_pickup"
    | "completed"
    | "cancelled";
  timeline: Array<{
    status:
      | "request_received"
      | "awaiting_drop_off"
      | "received_in_store"
      | "under_inspection"
      | "waiting_parts"
      | "in_repair"
      | "ready_for_pickup"
      | "completed"
      | "cancelled";
    note: string | null;
    createdAt: string;
  }>;
};

const FALLBACK_STORAGE_KEY = "beril_repairs_v1";

function saveFallbackRepair(record: RepairFallbackRecord) {
  try {
    const current = JSON.parse(
      window.localStorage.getItem(FALLBACK_STORAGE_KEY) ?? "[]",
    ) as RepairFallbackRecord[];

    current.push(record);
    window.localStorage.setItem(FALLBACK_STORAGE_KEY, JSON.stringify(current));
  } catch {
    // Ignore local storage errors.
  }
}

export default function ServiceRequestPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [repairCode, setRepairCode] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RepairRequestInput>({
    resolver: zodResolver(repairRequestSchema),
    defaultValues: {
      customerName: "",
      phone: "",
      email: "",
      preferredContactMethod: "phone",
      itemType: "watch",
      brand: "",
      model: "",
      serialNumber: "",
      purchaseDate: "",
      serviceType: "battery",
      description: "",
      dropOffMethod: "bring_to_store",
      privacyAccepted: true,
      serviceTermsAccepted: true,
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    setIsSubmitting(true);
    setErrorMessage(null);
    setRepairCode(null);

    try {
      const response = await fetch("/api/repairs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      const payload = (await response.json()) as {
        ok: boolean;
        message?: string;
        repairCode?: string;
      };

      if (!response.ok || !payload.ok || !payload.repairCode) {
        throw new Error(payload.message ?? "Unable to submit repair request.");
      }

      setRepairCode(payload.repairCode);
      trackEvent("repair_request_submit", {
        route: "/service/request",
        source: "repair_form",
        repairCode: payload.repairCode,
        itemType: values.itemType,
        serviceType: values.serviceType,
      });

      saveFallbackRepair({
        repairCode: payload.repairCode,
        phoneNormalized: normalizePhone(values.phone),
        emailNormalized: values.email ? normalizeEmail(values.email) : null,
        itemType: values.itemType,
        brand: values.brand,
        model: values.model,
        dateReceived: new Date().toISOString(),
        estimatedCompletion: null,
        amountDue: null,
        customerNote: "Request received by BERIL.",
        currentStatus:
          values.dropOffMethod === "bring_to_store"
            ? "awaiting_drop_off"
            : "request_received",
        timeline: [
          {
            status: "request_received",
            note: "Repair request received",
            createdAt: new Date().toISOString(),
          },
        ],
      });
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Repair request failed.",
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
          <StatusBadge tone="service">Request Repair</StatusBadge>
          <h1 className="text-5xl text-graphite sm:text-6xl">Repair Intake Form</h1>
          <p className="max-w-3xl text-sm text-graphite/76 sm:text-base">
            Submit your item details and BERIL will follow up with the next service
            steps.
          </p>
        </header>

        <form onSubmit={onSubmit} className="surface-panel space-y-5 p-6 sm:p-7">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <label htmlFor="customerName" className="text-sm font-medium">
                Full name
              </label>
              <input
                id="customerName"
                {...register("customerName")}
                className="w-full rounded-lg border border-graphite/18 bg-white/85 px-3 py-2 text-sm"
              />
              {errors.customerName ? (
                <p className="text-xs text-walnut">{errors.customerName.message}</p>
              ) : null}
            </div>
            <div className="space-y-1">
              <label htmlFor="phone" className="text-sm font-medium">
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

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <label htmlFor="email" className="text-sm font-medium">
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
              <label htmlFor="preferredContactMethod" className="text-sm font-medium">
                Preferred contact
              </label>
              <select
                id="preferredContactMethod"
                {...register("preferredContactMethod")}
                className="w-full rounded-lg border border-graphite/18 bg-white/85 px-3 py-2 text-sm"
              >
                <option value="phone">Phone</option>
                <option value="email">Email</option>
                <option value="whatsapp">WhatsApp</option>
              </select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1">
              <label htmlFor="itemType" className="text-sm font-medium">
                Item type
              </label>
              <select
                id="itemType"
                {...register("itemType")}
                className="w-full rounded-lg border border-graphite/18 bg-white/85 px-3 py-2 text-sm"
              >
                <option value="watch">Watch</option>
                <option value="eyewear">Eyewear</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="space-y-1">
              <label htmlFor="brand" className="text-sm font-medium">
                Brand
              </label>
              <input
                id="brand"
                {...register("brand")}
                className="w-full rounded-lg border border-graphite/18 bg-white/85 px-3 py-2 text-sm"
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="model" className="text-sm font-medium">
                Model
              </label>
              <input
                id="model"
                {...register("model")}
                className="w-full rounded-lg border border-graphite/18 bg-white/85 px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <label htmlFor="serialNumber" className="text-sm font-medium">
                Serial/reference (optional)
              </label>
              <input
                id="serialNumber"
                {...register("serialNumber")}
                className="w-full rounded-lg border border-graphite/18 bg-white/85 px-3 py-2 text-sm"
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="purchaseDate" className="text-sm font-medium">
                Purchase date (optional)
              </label>
              <input
                id="purchaseDate"
                type="date"
                {...register("purchaseDate")}
                className="w-full rounded-lg border border-graphite/18 bg-white/85 px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <label htmlFor="serviceType" className="text-sm font-medium">
                Service type
              </label>
              <select
                id="serviceType"
                {...register("serviceType")}
                className="w-full rounded-lg border border-graphite/18 bg-white/85 px-3 py-2 text-sm"
              >
                <option value="battery">Battery</option>
                <option value="strap_bracelet">Strap/Bracelet</option>
                <option value="movement_issue">Movement issue</option>
                <option value="crystal_issue">Crystal issue</option>
                <option value="polishing">Polishing</option>
                <option value="full_inspection">Full inspection</option>
                <option value="eyewear_fitting">Eyewear fitting</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="space-y-1">
              <label htmlFor="dropOffMethod" className="text-sm font-medium">
                Drop-off method
              </label>
              <select
                id="dropOffMethod"
                {...register("dropOffMethod")}
                className="w-full rounded-lg border border-graphite/18 bg-white/85 px-3 py-2 text-sm"
              >
                <option value="bring_to_store">I will bring it to the store</option>
                <option value="already_dropped_off">I already dropped it off</option>
                <option value="contact_me_first">Contact me first</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label htmlFor="description" className="text-sm font-medium">
              Issue description
            </label>
            <textarea
              id="description"
              rows={4}
              {...register("description")}
              className="w-full rounded-lg border border-graphite/18 bg-white/85 px-3 py-2 text-sm"
            />
            {errors.description ? (
              <p className="text-xs text-walnut">{errors.description.message}</p>
            ) : null}
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1">
              <label htmlFor="itemImages" className="text-sm font-medium">
                Item images
              </label>
              <input
                id="itemImages"
                type="file"
                multiple
                accept="image/*"
                className="w-full rounded-lg border border-graphite/18 bg-white/85 px-3 py-2 text-xs"
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="damageImages" className="text-sm font-medium">
                Damage images
              </label>
              <input
                id="damageImages"
                type="file"
                multiple
                accept="image/*"
                className="w-full rounded-lg border border-graphite/18 bg-white/85 px-3 py-2 text-xs"
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="proofOfPurchase" className="text-sm font-medium">
                Proof of purchase
              </label>
              <input
                id="proofOfPurchase"
                type="file"
                accept="image/*,.pdf"
                className="w-full rounded-lg border border-graphite/18 bg-white/85 px-3 py-2 text-xs"
              />
            </div>
          </div>

          <label className="flex items-center gap-2 rounded-lg border border-graphite/15 bg-white/75 px-3 py-2 text-sm text-graphite/78">
            <input type="checkbox" {...register("privacyAccepted")} />
            I accept the privacy policy
          </label>
          <label className="flex items-center gap-2 rounded-lg border border-graphite/15 bg-white/75 px-3 py-2 text-sm text-graphite/78">
            <input type="checkbox" {...register("serviceTermsAccepted")} />
            I accept the service terms
          </label>

          {errorMessage ? (
            <p className="rounded-lg border border-walnut/35 bg-walnut/10 px-3 py-2 text-sm text-walnut">
              {errorMessage}
            </p>
          ) : null}

          {repairCode ? (
            <div className="rounded-lg border border-mineral/35 bg-mineral/12 px-4 py-3 text-sm text-mineral">
              Repair request submitted. Your repair code is <strong>{repairCode}</strong>.
              <div className="mt-2">
                <Link href="/repair-track" className="underline">
                  Track your repair
                </Link>
              </div>
            </div>
          ) : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex h-11 items-center rounded-full bg-walnut px-6 text-sm font-medium text-white disabled:opacity-50"
          >
            {isSubmitting ? "Submitting..." : "Submit Repair Request"}
          </button>
        </form>
      </Container>
    </SectionWrapper>
  );
}
