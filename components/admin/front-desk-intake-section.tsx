"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { CheckCircle2, X } from "lucide-react";

import {
  createManualOrderAction,
  createManualRepairRequestAction,
} from "@/app/admin/actions";
import { CustomerLookupFields } from "@/components/admin/customer-lookup-fields";
import { ManualOrderItemsField } from "@/components/admin/manual-order-items-field";
import { ManualServiceItemsField } from "@/components/admin/manual-service-items-field";
import { FloatInput, FloatSelect, FloatTextarea } from "@/components/ui/float-field";
import {
  deliveryMethods,
  orderStatuses,
  paymentMethods,
  paymentStatuses,
  preferredContactMethods,
  repairStatuses,
} from "@/types/domain";
import { formatStatusLabel } from "@/lib/utils/status-label";

type ActiveProduct = {
  id: string;
  brand: string;
  title: string;
  price: number;
};

type Props = {
  activeProducts: ActiveProduct[];
  initialTab: "order" | "service";
  successType: "order" | "service" | null;
};

export function FrontDeskIntakeSection({ activeProducts, initialTab, successType }: Props) {
  const [activeIntake, setActiveIntake] = useState<"order" | "service">(initialTab);
  const [bannerVisible, setBannerVisible] = useState(successType !== null);
  const [serviceItemCount, setServiceItemCount] = useState(0);

  // Derive brand suggestions from catalog for service item autocomplete
  const brandSuggestions = [...new Set(activeProducts.map((p) => p.brand))].sort();

  const orderFormRef = useRef<HTMLFormElement>(null);
  const serviceFormRef = useRef<HTMLFormElement>(null);

  // Auto-focus first visible input when switching tabs
  useEffect(() => {
    const ref = activeIntake === "order" ? orderFormRef : serviceFormRef;
    const timer = setTimeout(() => {
      ref.current?.querySelector<HTMLInputElement>('input:not([type="hidden"])')?.focus();
    }, 50);
    return () => clearTimeout(timer);
  }, [activeIntake]);

  useEffect(() => {
    if (!bannerVisible) return;
    const timer = setTimeout(() => setBannerVisible(false), 5000);
    return () => clearTimeout(timer);
  }, [bannerVisible]);

  return (
    <div className="surface-panel min-w-0 overflow-hidden">
      {/* Success banner */}
      {bannerVisible && successType ? (
        <div className="flex items-center justify-between gap-3 border-b border-mineral/20 bg-mineral/8 px-4 py-2.5">
          <div className="flex items-center gap-2 text-sm text-mineral">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            {successType === "order" ? "Order created successfully." : "Service intake created successfully."}
          </div>
          <button
            type="button"
            onClick={() => setBannerVisible(false)}
            className="text-mineral/50 hover:text-mineral"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : null}

      {/* Underline tab bar */}
      <div className="flex items-center border-b border-black/8 px-1">
        <button
          type="button"
          onClick={() => setActiveIntake("order")}
          className={`-mb-px border-b-2 px-4 py-3 text-xs font-medium uppercase tracking-[0.1em] transition ${
            activeIntake === "order"
              ? "border-mineral text-mineral"
              : "border-transparent text-graphite/50 hover:text-graphite"
          }`}
        >
          Order Intake
        </button>
        <button
          type="button"
          onClick={() => setActiveIntake("service")}
          className={`-mb-px border-b-2 px-4 py-3 text-xs font-medium uppercase tracking-[0.1em] transition ${
            activeIntake === "service"
              ? "border-mineral text-mineral"
              : "border-transparent text-graphite/50 hover:text-graphite"
          }`}
        >
          Service Intake
        </button>
        <div className="ml-auto flex items-center gap-4 pr-2">
          <Link
            href="/admin/orders"
            className="text-xs text-graphite/42 transition hover:text-graphite"
          >
            All orders ↗
          </Link>
          <Link
            href="/admin/repairs"
            className="text-xs text-graphite/42 transition hover:text-graphite"
          >
            All repairs ↗
          </Link>
        </div>
      </div>

      {/* Order intake form — always mounted, hidden when inactive */}
      <form
        ref={orderFormRef}
        action={createManualOrderAction}
        className={`space-y-0 px-4 pb-5 pt-4 sm:px-5 ${activeIntake === "order" ? "" : "hidden"}`}
      >
        <input type="hidden" name="returnTo" value="/admin/operations/front-desk?success=order" />

        <div className="admin-form-section">
          <p className="admin-form-section-label">Customer</p>
          <CustomerLookupFields mode="order" />
        </div>

        <div className="admin-form-section">
          <p className="admin-form-section-label">Items &amp; Pricing</p>
          <ManualOrderItemsField
            products={activeProducts.map((p) => ({
              id: p.id,
              brand: p.brand,
              title: p.title,
              price: p.price,
            }))}
          />
        </div>

        <div className="admin-form-section">
          <p className="admin-form-section-label">Payment</p>
          <div className="grid gap-2 sm:grid-cols-3">
            <FloatSelect name="paymentMethod" defaultValue="cash_on_delivery" label="Payment method">
              {paymentMethods.map((item) => (
                <option key={item} value={item}>
                  {formatStatusLabel(item)}
                </option>
              ))}
            </FloatSelect>
            <FloatSelect name="paymentStatus" defaultValue="pending" label="Payment status">
              {paymentStatuses.map((item) => (
                <option key={item} value={item}>
                  {formatStatusLabel(item)}
                </option>
              ))}
            </FloatSelect>
            <FloatSelect name="deliveryMethod" defaultValue="home_delivery" label="Delivery">
              {deliveryMethods.map((item) => (
                <option key={item} value={item}>
                  {formatStatusLabel(item)}
                </option>
              ))}
            </FloatSelect>
          </div>
        </div>

        <details className="admin-advanced">
          <summary>Advanced order fields</summary>
          <div className="space-y-2 px-3 pb-3">
            <div className="grid gap-2 sm:grid-cols-2">
              <FloatInput name="email" type="email" label="Email" />
              <FloatInput name="country" defaultValue="Kosovo" label="Country" />
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <FloatSelect name="orderStatus" defaultValue="pending" label="Order status">
                {orderStatuses.map((item) => (
                  <option key={item} value={item}>
                    {formatStatusLabel(item)}
                  </option>
                ))}
              </FloatSelect>
              <FloatInput name="deliveryFee" type="number" step="0.01" min="0" label="Delivery fee" />
            </div>
            <FloatInput
              name="total"
              type="number"
              step="0.01"
              min="0"
              label="Final total override (optional)"
            />
            <p className="-mt-1 text-xs text-graphite/55">
              Uses your custom final order amount for this order only. Product prices stay unchanged.
            </p>
            <FloatTextarea name="notes" rows={2} label="Customer notes" />
            <FloatTextarea name="internalNotes" rows={2} label="Internal notes" />
          </div>
        </details>

        <div className="pt-4">
          <button type="submit" className="admin-primary-btn-walnut">
            Create Order
          </button>
        </div>
      </form>

      {/* Service intake form — always mounted, hidden when inactive */}
      <form
        ref={serviceFormRef}
        action={createManualRepairRequestAction}
        className={`space-y-0 px-4 pb-5 pt-4 sm:px-5 ${activeIntake === "service" ? "" : "hidden"}`}
      >
        <input
          type="hidden"
          name="returnTo"
          value="/admin/operations/front-desk?intake=service&success=service"
        />

        <div className="admin-form-section">
          <p className="admin-form-section-label">Customer</p>
          <CustomerLookupFields mode="service" />
        </div>

        <div className="admin-form-section">
          <p className="admin-form-section-label">Service Items</p>
          <ManualServiceItemsField
            onItemCountChange={setServiceItemCount}
            brandSuggestions={brandSuggestions}
          />
        </div>

        <div className="admin-form-section">
          <p className="admin-form-section-label">Intake Details</p>
          <div className="grid gap-2 sm:grid-cols-2">
            <FloatSelect name="dropOffMethod" defaultValue="already_dropped_off" label="Drop-off">
              <option value="already_dropped_off">Already dropped off</option>
              <option value="bring_to_store">Bring to store</option>
              <option value="contact_me_first">Contact me first</option>
            </FloatSelect>
            <FloatSelect name="status" defaultValue="received_in_store" label="Repair status">
              {repairStatuses.map((item) => (
                <option key={item} value={item}>
                  {formatStatusLabel(item)}
                </option>
              ))}
            </FloatSelect>
          </div>
        </div>

        <details className="admin-advanced">
          <summary>Advanced service fields</summary>
          <div className="space-y-2 px-3 pb-3">
            <div className="grid gap-2 sm:grid-cols-2">
              <FloatInput name="email" type="email" label="Email" />
              <FloatSelect name="preferredContactMethod" defaultValue="phone" label="Preferred contact">
                {preferredContactMethods.map((item) => (
                  <option key={item} value={item}>
                    {formatStatusLabel(item)}
                  </option>
                ))}
              </FloatSelect>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <FloatInput name="estimatedCompletion" type="date" label="Estimated completion" />
              <FloatInput name="amountDue" type="number" min="0" step="0.01" label="Amount due EUR" />
            </div>
            <FloatTextarea name="notesCustomer" rows={2} label="Customer-visible note" />
            <FloatTextarea name="notesInternal" rows={2} label="Internal note" />
          </div>
        </details>

        <div className="flex items-center gap-3 pt-4">
          <button
            type="submit"
            disabled={serviceItemCount === 0}
            className="admin-primary-btn-mineral disabled:cursor-not-allowed disabled:opacity-50"
          >
            Create Service
          </button>
          {serviceItemCount === 0 ? (
            <p className="text-xs text-graphite/45">Add at least one item above</p>
          ) : (
            <p className="text-xs text-graphite/50">
              {serviceItemCount} {serviceItemCount === 1 ? "item" : "items"} ready
            </p>
          )}
        </div>
      </form>
    </div>
  );
}
