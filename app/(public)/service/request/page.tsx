"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { startTransition, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Container } from "@/components/layout/container";
import { SectionWrapper } from "@/components/layout/section-wrapper";
import { FloatInput, FloatSelect, FloatTextarea } from "@/components/ui/float-field";
import { PhoneInput } from "@/components/ui/phone-input";
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

function appendFiles(formData: FormData, key: string, files: FileList | null) {
  if (!files || files.length === 0) {
    return;
  }

  for (const file of Array.from(files)) {
    if (file.size > 0) {
      formData.append(key, file);
    }
  }
}

export default function ServiceRequestPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [repairCode, setRepairCode] = useState<string | null>(null);
  const itemImagesInputRef = useRef<HTMLInputElement | null>(null);
  const damageImagesInputRef = useRef<HTMLInputElement | null>(null);
  const proofOfPurchaseInputRef = useRef<HTMLInputElement | null>(null);

  const {
    register,
    control,
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
      const formData = new FormData();
      formData.set("customerName", values.customerName);
      formData.set("phone", values.phone);
      formData.set("email", values.email || "");
      formData.set("preferredContactMethod", values.preferredContactMethod);
      formData.set("itemType", values.itemType);
      formData.set("brand", values.brand);
      formData.set("model", values.model);
      formData.set("serialNumber", values.serialNumber || "");
      formData.set("purchaseDate", values.purchaseDate || "");
      formData.set("serviceType", values.serviceType);
      formData.set("description", values.description);
      formData.set("dropOffMethod", values.dropOffMethod);
      formData.set("privacyAccepted", values.privacyAccepted ? "true" : "false");
      formData.set(
        "serviceTermsAccepted",
        values.serviceTermsAccepted ? "true" : "false",
      );
      appendFiles(formData, "itemImages", itemImagesInputRef.current?.files ?? null);
      appendFiles(
        formData,
        "damageImages",
        damageImagesInputRef.current?.files ?? null,
      );
      appendFiles(
        formData,
        "proofOfPurchase",
        proofOfPurchaseInputRef.current?.files ?? null,
      );

      const response = await fetch("/api/repairs", {
        method: "POST",
        body: formData,
      });

      const payload = (await response.json()) as {
        ok: boolean;
        message?: string;
        repairCode?: string;
      };

      if (!response.ok || !payload.ok || !payload.repairCode) {
        throw new Error(payload.message ?? "Nuk u arrit te dergohet kerkesa per riparim.");
      }

      setRepairCode(payload.repairCode);
      if (itemImagesInputRef.current) {
        itemImagesInputRef.current.value = "";
      }
      if (damageImagesInputRef.current) {
        damageImagesInputRef.current.value = "";
      }
      if (proofOfPurchaseInputRef.current) {
        proofOfPurchaseInputRef.current.value = "";
      }

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
        customerNote: "Kerkesa u pranua nga BERIL.",
        currentStatus:
          values.dropOffMethod === "bring_to_store"
            ? "awaiting_drop_off"
            : "request_received",
        timeline: [
          {
            status: "request_received",
            note: "Kerkesa per riparim u pranua",
            createdAt: new Date().toISOString(),
          },
        ],
      });
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Kerkesa per riparim deshtoi.",
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
          <StatusBadge tone="service">Kerko Riparim</StatusBadge>
          <h1 className="text-5xl text-graphite sm:text-6xl">Formulari i Pranimit per Riparim</h1>
          <p className="max-w-3xl text-sm text-graphite/76 sm:text-base">
            Dergo detajet e produktit dhe BERIL do te te kontaktoje me hapat e ardhshem.
          </p>
        </header>

        <form onSubmit={onSubmit} className="surface-panel space-y-5 p-6 sm:p-7">
          <div className="grid gap-4 sm:grid-cols-2">
            <FloatInput
              label="Emri i plote"
              id="customerName"
              {...register("customerName")}
              error={errors.customerName?.message}
            />
            <Controller
              name="phone"
              control={control}
              render={({ field }) => (
                <PhoneInput
                  id="phone"
                  label="Telefoni"
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
              label="Email"
              id="email"
              {...register("email")}
              error={errors.email?.message}
            />
            <FloatSelect
              label="Kontakti i preferuar"
              id="preferredContactMethod"
              {...register("preferredContactMethod")}
            >
              <option value="phone">Telefon</option>
              <option value="email">Email</option>
              <option value="whatsapp">WhatsApp</option>
            </FloatSelect>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <FloatSelect
              label="Lloji i produktit"
              id="itemType"
              {...register("itemType")}
            >
              <option value="watch">Ore</option>
              <option value="eyewear">Syze</option>
              <option value="other">Tjeter</option>
            </FloatSelect>
            <FloatInput
              label="Brendi"
              id="brand"
              {...register("brand")}
            />
            <FloatInput
              label="Modeli"
              id="model"
              {...register("model")}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <FloatInput
              label="Serial/referenca (opsionale)"
              id="serialNumber"
              {...register("serialNumber")}
            />
            <FloatInput
              label="Data e blerjes (opsionale)"
              id="purchaseDate"
              type="date"
              {...register("purchaseDate")}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <FloatSelect
              label="Lloji i servisit"
              id="serviceType"
              {...register("serviceType")}
            >
              <option value="battery">Bateri</option>
              <option value="strap_bracelet">Rrip/Byzylyk</option>
              <option value="movement_issue">Problem me mekanizmin</option>
              <option value="crystal_issue">Problem me xhamin</option>
              <option value="polishing">Polirim</option>
              <option value="full_inspection">Inspektim i plote</option>
              <option value="eyewear_fitting">Pershtatje syzesh</option>
              <option value="other">Tjeter</option>
            </FloatSelect>
            <FloatSelect
              label="Menyra e dorezimit"
              id="dropOffMethod"
              {...register("dropOffMethod")}
            >
              <option value="bring_to_store">Do ta sjell ne dyqan</option>
              <option value="already_dropped_off">E kam dorezuar tashme</option>
              <option value="contact_me_first">Me kontakto fillimisht</option>
            </FloatSelect>
          </div>

          <FloatTextarea
            label="Pershkrimi i problemit"
            id="description"
            rows={4}
            {...register("description")}
            error={errors.description?.message}
          />

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1">
              <label htmlFor="itemImages" className="text-sm font-medium">
                Foto te produktit
              </label>
              <input
                id="itemImages"
                ref={itemImagesInputRef}
                type="file"
                multiple
                accept="image/*"
                className="w-full rounded-lg border border-graphite/18 bg-white/85 px-3 py-2 text-xs"
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="damageImages" className="text-sm font-medium">
                Foto te demtimit
              </label>
              <input
                id="damageImages"
                ref={damageImagesInputRef}
                type="file"
                multiple
                accept="image/*"
                className="w-full rounded-lg border border-graphite/18 bg-white/85 px-3 py-2 text-xs"
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="proofOfPurchase" className="text-sm font-medium">
                Deshmi e blerjes
              </label>
              <input
                id="proofOfPurchase"
                ref={proofOfPurchaseInputRef}
                type="file"
                accept="image/*,.pdf"
                className="w-full rounded-lg border border-graphite/18 bg-white/85 px-3 py-2 text-xs"
              />
            </div>
          </div>

          <label className="flex items-center gap-2 rounded-lg border border-graphite/15 bg-white/75 px-3 py-2 text-sm text-graphite/78">
            <input type="checkbox" {...register("privacyAccepted")} />
            Pranoj politiken e privatesise
          </label>
          <label className="flex items-center gap-2 rounded-lg border border-graphite/15 bg-white/75 px-3 py-2 text-sm text-graphite/78">
            <input type="checkbox" {...register("serviceTermsAccepted")} />
            Pranoj kushtet e servisit
          </label>

          {errorMessage ? (
            <p className="rounded-lg border border-walnut/35 bg-walnut/10 px-3 py-2 text-sm text-walnut">
              {errorMessage}
            </p>
          ) : null}

          {repairCode ? (
            <div className="rounded-lg border border-mineral/35 bg-mineral/12 px-4 py-3 text-sm text-mineral">
              Kerkesa u dergua me sukses. Kodi juaj i riparimit eshte <strong>{repairCode}</strong>.
              <div className="mt-2">
                <Link href="/repair-track" className="underline">
                  Gjurmo riparimin
                </Link>
              </div>
            </div>
          ) : null}

          <Button type="submit" disabled={isSubmitting} className="px-6">
            {isSubmitting ? "Duke derguar..." : "Dergo Kerkesen"}
          </Button>
        </form>
      </Container>
    </SectionWrapper>
  );
}
