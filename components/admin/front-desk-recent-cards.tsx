"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { X, ExternalLink, Pencil } from "lucide-react";

import {
  updateOrderStatusAction,
  updateOrderPaymentStatusAction,
  updateOrderNotesAction,
  updateRepairStatusAction,
  updateRepairEstimateAction,
  updateRepairNotesAction,
} from "@/app/admin/actions";
import { CopyButton } from "@/components/ui/copy-button";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatEur } from "@/lib/utils/money";
import { formatStatusLabel } from "@/lib/utils/status-label";
import { orderStatuses, paymentStatuses, repairStatuses } from "@/types/domain";
import type { AdminOrder, AdminRepair } from "@/types/admin";
import type { OrderStatus, PaymentStatus, RepairStatus } from "@/types/domain";

// ─── Order Cards ─────────────────────────────────────────────────────────────

type OrderCardsProps = {
  orders: AdminOrder[];
  todayCount: number;
};

export function FrontDeskOrderCards({ orders, todayCount }: OrderCardsProps) {
  const [selected, setSelected] = useState<AdminOrder | null>(null);

  return (
    <>
      <div className="mt-3 flex items-center justify-between gap-2">
        <p className="text-xs text-graphite/55">
          {orders.slice(0, 8).length} recent
          {todayCount > 0 ? (
            <span className="ml-1.5 rounded-full bg-walnut/10 px-2 py-0.5 text-walnut">
              {todayCount} today
            </span>
          ) : null}
        </p>
      </div>
      <ul className="mt-2 space-y-2 text-sm">
        {orders.length === 0 ? (
          <li className="text-graphite/72">No orders yet.</li>
        ) : (
          orders.slice(0, 8).map((order) => (
            <li key={order.id}>
              <button
                type="button"
                onClick={() => setSelected(order)}
                className="block w-full rounded-lg border border-graphite/10 bg-white/75 px-3 py-2 text-left transition hover:border-graphite/20 hover:bg-white"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium text-graphite">{order.orderCode}</p>
                  <p className="shrink-0 text-[0.7rem] text-graphite/45">
                    {formatRelativeTime(order.createdAt)}
                  </p>
                </div>
                <p className="text-xs text-graphite/62">
                  {order.customerName} | {formatStatusLabel(order.orderStatus)}
                </p>
              </button>
            </li>
          ))
        )}
      </ul>

      {selected ? (
        <OrderModal order={selected} onClose={() => setSelected(null)} />
      ) : null}
    </>
  );
}

// ─── Order Modal ──────────────────────────────────────────────────────────────

type OrderEditDraft = {
  orderStatus: OrderStatus;
  statusNote: string;
  paymentStatus: PaymentStatus;
  internalNotes: string;
};

function OrderModal({ order, onClose }: { order: AdminOrder; onClose: () => void }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [mode, setMode] = useState<"view" | "edit">("view");
  const [draft, setDraft] = useState<OrderEditDraft>({
    orderStatus: order.orderStatus,
    statusNote: "",
    paymentStatus: order.paymentStatus,
    internalNotes: order.internalNotes ?? "",
  });

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (mode === "edit") setMode("view");
        else onClose();
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [mode, onClose]);

  function handleSave() {
    startTransition(async () => {
      // Only push a status change if something changed or a note was written
      if (draft.orderStatus !== order.orderStatus || draft.statusNote.trim()) {
        const fd = new FormData();
        fd.set("orderId", order.id);
        fd.set("status", draft.orderStatus);
        fd.set("note", draft.statusNote.trim());
        await updateOrderStatusAction(fd);
      }

      if (draft.paymentStatus !== order.paymentStatus) {
        const fd = new FormData();
        fd.set("orderId", order.id);
        fd.set("paymentStatus", draft.paymentStatus);
        await updateOrderPaymentStatusAction(fd);
      }

      const fd = new FormData();
      fd.set("orderId", order.id);
      fd.set("internalNotes", draft.internalNotes);
      await updateOrderNotesAction(fd);

      router.refresh();
      onClose();
    });
  }

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-graphite/40 p-4 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-graphite/12 bg-white shadow-xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-graphite/10 bg-white/95 px-5 py-4 backdrop-blur-sm">
          <div>
            <p className="font-mono text-sm font-medium text-graphite">{order.orderCode}</p>
            <p className="text-xs text-graphite/55">
              {formatDate(order.createdAt)} · {formatRelativeTime(order.createdAt)}
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            {mode === "view" ? (
              <button
                type="button"
                onClick={() => setMode("edit")}
                className="flex h-8 items-center gap-1.5 rounded-full border border-graphite/14 bg-white/80 px-3 text-xs text-graphite/65 transition hover:border-graphite/24 hover:text-graphite"
              >
                <Pencil className="h-3 w-3" />
                Edit
              </button>
            ) : null}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="flex h-8 w-8 items-center justify-center rounded-full transition hover:bg-graphite/8"
            >
              <X className="h-4 w-4 text-graphite/60" />
            </button>
          </div>
        </div>

        {/* View mode */}
        {mode === "view" ? (
          <div className="space-y-4 p-5">
            <div className="flex flex-wrap gap-2">
              <StatusBadge tone="neutral">{formatStatusLabel(order.orderStatus)}</StatusBadge>
              <StatusBadge tone="service">{formatStatusLabel(order.paymentStatus)}</StatusBadge>
              <StatusBadge tone="neutral">{formatStatusLabel(order.paymentMethod)}</StatusBadge>
            </div>

            <section className="rounded-xl border border-graphite/10 bg-graphite/[0.03] p-3.5">
              <p className="mb-2 text-[0.65rem] uppercase tracking-[0.14em] text-graphite/50">Customer</p>
              <p className="font-medium text-graphite">{order.customerName}</p>
              <div className="mt-0.5 flex items-center gap-2">
                <p className="text-sm text-graphite/70">{order.phone}</p>
                <CopyButton value={order.phone} />
              </div>
              {order.email ? <p className="text-sm text-graphite/70">{order.email}</p> : null}
              <p className="text-sm text-graphite/70">
                {order.address}, {order.city}, {order.country}
              </p>
            </section>

            <section className="rounded-xl border border-graphite/10 bg-graphite/[0.03] p-3.5">
              <p className="mb-2 text-[0.65rem] uppercase tracking-[0.14em] text-graphite/50">Items</p>
              <div className="space-y-2">
                {order.items.map((item, i) => (
                  <div key={i} className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm text-graphite">
                        {item.quantity}× {item.brand} {item.title}
                      </p>
                      <p className="text-xs text-graphite/55">{formatEur(item.unitPrice)} each</p>
                    </div>
                    <p className="shrink-0 text-sm font-medium text-graphite">{formatEur(item.totalPrice)}</p>
                  </div>
                ))}
              </div>
              <div className="mt-3 space-y-1 border-t border-graphite/10 pt-3 text-sm">
                <div className="flex justify-between text-graphite/65">
                  <span>Subtotal</span>
                  <span>{formatEur(order.subtotal)}</span>
                </div>
                {order.deliveryFee > 0 ? (
                  <div className="flex justify-between text-graphite/65">
                    <span>Delivery ({formatStatusLabel(order.deliveryMethod)})</span>
                    <span>{formatEur(order.deliveryFee)}</span>
                  </div>
                ) : null}
                <div className="flex justify-between font-medium text-graphite">
                  <span>Total</span>
                  <span>{formatEur(order.total)}</span>
                </div>
              </div>
            </section>

            {order.notes ? (
              <section className="rounded-xl border border-graphite/10 bg-graphite/[0.03] p-3.5">
                <p className="mb-1 text-[0.65rem] uppercase tracking-[0.14em] text-graphite/50">Customer note</p>
                <p className="text-sm text-graphite/75">{order.notes}</p>
              </section>
            ) : null}

            {order.internalNotes ? (
              <section className="rounded-xl border border-walnut/14 bg-walnut/[0.04] p-3.5">
                <p className="mb-1 text-[0.65rem] uppercase tracking-[0.14em] text-walnut/70">Internal note</p>
                <p className="text-sm text-graphite/75">{order.internalNotes}</p>
              </section>
            ) : null}
          </div>
        ) : (
          /* Edit mode */
          <div className="space-y-4 p-5">
            <p className="text-xs uppercase tracking-[0.12em] text-graphite/50">Editing order</p>

            <section className="space-y-2 rounded-xl border border-graphite/12 bg-graphite/[0.025] p-3.5">
              <p className="text-[0.65rem] uppercase tracking-[0.14em] text-graphite/50">Order Status</p>
              <select
                value={draft.orderStatus}
                onChange={(e) => setDraft((d) => ({ ...d, orderStatus: e.target.value as OrderStatus }))}
                className="input-premium"
              >
                {orderStatuses.map((s) => (
                  <option key={s} value={s}>{formatStatusLabel(s)}</option>
                ))}
              </select>
              <textarea
                value={draft.statusNote}
                onChange={(e) => setDraft((d) => ({ ...d, statusNote: e.target.value }))}
                rows={2}
                placeholder="Optional note for this status change…"
                className="input-premium resize-none text-xs"
              />
            </section>

            <section className="space-y-2 rounded-xl border border-graphite/12 bg-graphite/[0.025] p-3.5">
              <p className="text-[0.65rem] uppercase tracking-[0.14em] text-graphite/50">Payment Status</p>
              <select
                value={draft.paymentStatus}
                onChange={(e) => setDraft((d) => ({ ...d, paymentStatus: e.target.value as PaymentStatus }))}
                className="input-premium"
              >
                {paymentStatuses.map((s) => (
                  <option key={s} value={s}>{formatStatusLabel(s)}</option>
                ))}
              </select>
            </section>

            <section className="space-y-2 rounded-xl border border-walnut/14 bg-walnut/[0.03] p-3.5">
              <p className="text-[0.65rem] uppercase tracking-[0.14em] text-walnut/65">Internal Note</p>
              <textarea
                value={draft.internalNotes}
                onChange={(e) => setDraft((d) => ({ ...d, internalNotes: e.target.value }))}
                rows={3}
                placeholder="Internal notes (not visible to customer)…"
                className="input-premium resize-none"
              />
            </section>
          </div>
        )}

        {/* Footer */}
        <div className="sticky bottom-0 flex items-center justify-between gap-3 border-t border-graphite/10 bg-white/95 px-5 py-4 backdrop-blur-sm">
          {mode === "view" ? (
            <Link
              href={`/admin/orders?search=${encodeURIComponent(order.orderCode)}`}
              className="inline-flex items-center gap-1.5 rounded-full border border-graphite/20 bg-white px-4 py-2 text-xs uppercase tracking-[0.1em] text-graphite transition hover:border-graphite/30 hover:bg-graphite/5"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              View in Orders
            </Link>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSave}
                disabled={isPending}
                className="inline-flex h-9 items-center rounded-full bg-walnut px-5 text-xs font-medium uppercase tracking-[0.1em] text-white transition hover:brightness-90 disabled:opacity-60"
              >
                {isPending ? "Saving…" : "Save changes"}
              </button>
              <button
                type="button"
                onClick={() => setMode("view")}
                disabled={isPending}
                className="inline-flex h-9 items-center rounded-full border border-graphite/20 bg-white px-4 text-xs uppercase tracking-[0.1em] text-graphite transition hover:bg-graphite/5 disabled:opacity-60"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

// ─── Repair Cards ─────────────────────────────────────────────────────────────

type RepairCardsProps = {
  repairs: AdminRepair[];
  todayCount: number;
};

export function FrontDeskRepairCards({ repairs, todayCount }: RepairCardsProps) {
  const [selected, setSelected] = useState<AdminRepair | null>(null);

  return (
    <>
      <div className="mt-3 flex items-center justify-between gap-2">
        <p className="text-xs text-graphite/55">
          {repairs.slice(0, 8).length} recent
          {todayCount > 0 ? (
            <span className="ml-1.5 rounded-full bg-mineral/10 px-2 py-0.5 text-mineral">
              {todayCount} today
            </span>
          ) : null}
        </p>
      </div>
      <ul className="mt-2 space-y-2 text-sm">
        {repairs.length === 0 ? (
          <li className="text-graphite/72">No repairs yet.</li>
        ) : (
          repairs.slice(0, 8).map((repair) => (
            <li key={repair.id}>
              <button
                type="button"
                onClick={() => setSelected(repair)}
                className="block w-full rounded-lg border border-graphite/10 bg-white/75 px-3 py-2 text-left transition hover:border-graphite/20 hover:bg-white"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium text-graphite">{repair.repairCode}</p>
                  <p className="shrink-0 text-[0.7rem] text-graphite/45">
                    {formatRelativeTime(repair.createdAt)}
                  </p>
                </div>
                <p className="text-xs text-graphite/62">
                  {repair.customerName} | {formatStatusLabel(repair.status)}
                </p>
              </button>
            </li>
          ))
        )}
      </ul>

      {selected ? (
        <RepairModal repair={selected} onClose={() => setSelected(null)} />
      ) : null}
    </>
  );
}

// ─── Repair Modal ─────────────────────────────────────────────────────────────

type RepairEditDraft = {
  status: RepairStatus;
  statusNote: string;
  estimatedCompletion: string;
  amountDue: string;
  notesCustomer: string;
  notesInternal: string;
};

function RepairModal({ repair, onClose }: { repair: AdminRepair; onClose: () => void }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [mode, setMode] = useState<"view" | "edit">("view");
  const [draft, setDraft] = useState<RepairEditDraft>({
    status: repair.status,
    statusNote: "",
    estimatedCompletion: repair.estimatedCompletion ?? "",
    amountDue: repair.amountDue != null ? String(repair.amountDue) : "",
    notesCustomer: repair.notesCustomer ?? "",
    notesInternal: repair.notesInternal ?? "",
  });

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (mode === "edit") setMode("view");
        else onClose();
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [mode, onClose]);

  function handleSave() {
    startTransition(async () => {
      if (draft.status !== repair.status || draft.statusNote.trim()) {
        const fd = new FormData();
        fd.set("repairId", repair.id);
        fd.set("status", draft.status);
        fd.set("note", draft.statusNote.trim());
        fd.set("visibleToCustomer", "false");
        await updateRepairStatusAction(fd);
      }

      const estimateFd = new FormData();
      estimateFd.set("repairId", repair.id);
      estimateFd.set("estimatedCompletion", draft.estimatedCompletion);
      estimateFd.set("amountDue", draft.amountDue);
      await updateRepairEstimateAction(estimateFd);

      const notesFd = new FormData();
      notesFd.set("repairId", repair.id);
      notesFd.set("internalNotes", draft.notesInternal);
      notesFd.set("customerNotes", draft.notesCustomer);
      await updateRepairNotesAction(notesFd);

      router.refresh();
      onClose();
    });
  }

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-graphite/40 p-4 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-graphite/12 bg-white shadow-xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-graphite/10 bg-white/95 px-5 py-4 backdrop-blur-sm">
          <div>
            <p className="font-mono text-sm font-medium text-graphite">{repair.repairCode}</p>
            <p className="text-xs text-graphite/55">
              {formatDate(repair.createdAt)} · {formatRelativeTime(repair.createdAt)}
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            {mode === "view" ? (
              <button
                type="button"
                onClick={() => setMode("edit")}
                className="flex h-8 items-center gap-1.5 rounded-full border border-graphite/14 bg-white/80 px-3 text-xs text-graphite/65 transition hover:border-graphite/24 hover:text-graphite"
              >
                <Pencil className="h-3 w-3" />
                Edit
              </button>
            ) : null}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="flex h-8 w-8 items-center justify-center rounded-full transition hover:bg-graphite/8"
            >
              <X className="h-4 w-4 text-graphite/60" />
            </button>
          </div>
        </div>

        {/* View mode */}
        {mode === "view" ? (
          <div className="space-y-4 p-5">
            <div className="flex flex-wrap gap-2">
              <StatusBadge tone="service">{formatStatusLabel(repair.status)}</StatusBadge>
              {repair.amountDue != null ? (
                <StatusBadge tone="neutral">{formatEur(repair.amountDue)} due</StatusBadge>
              ) : null}
            </div>

            <section className="rounded-xl border border-graphite/10 bg-graphite/[0.03] p-3.5">
              <p className="mb-2 text-[0.65rem] uppercase tracking-[0.14em] text-graphite/50">Customer</p>
              <p className="font-medium text-graphite">{repair.customerName}</p>
              <div className="mt-0.5 flex items-center gap-2">
                <p className="text-sm text-graphite/70">{repair.phone}</p>
                <CopyButton value={repair.phone} />
              </div>
              {repair.email ? <p className="text-sm text-graphite/70">{repair.email}</p> : null}
            </section>

            <section className="rounded-xl border border-graphite/10 bg-graphite/[0.03] p-3.5">
              <p className="mb-2 text-[0.65rem] uppercase tracking-[0.14em] text-graphite/50">Device</p>
              <p className="font-medium text-graphite">
                {repair.brand} {repair.model}
              </p>
              <p className="text-sm text-graphite/65">
                {repair.itemType} · {repair.serviceType}
              </p>
              {repair.description ? (
                <p className="mt-2 text-sm text-graphite/75">{repair.description}</p>
              ) : null}
            </section>

            {repair.estimatedCompletion ? (
              <div className="rounded-xl border border-graphite/10 bg-graphite/[0.03] px-3.5 py-3">
                <p className="text-[0.65rem] uppercase tracking-[0.14em] text-graphite/50">Est. completion</p>
                <p className="mt-0.5 text-sm text-graphite/80">{formatDate(repair.estimatedCompletion)}</p>
              </div>
            ) : null}

            {repair.notesCustomer ? (
              <section className="rounded-xl border border-graphite/10 bg-graphite/[0.03] p-3.5">
                <p className="mb-1 text-[0.65rem] uppercase tracking-[0.14em] text-graphite/50">Customer note</p>
                <p className="text-sm text-graphite/75">{repair.notesCustomer}</p>
              </section>
            ) : null}

            {repair.notesInternal ? (
              <section className="rounded-xl border border-walnut/14 bg-walnut/[0.04] p-3.5">
                <p className="mb-1 text-[0.65rem] uppercase tracking-[0.14em] text-walnut/70">Internal note</p>
                <p className="text-sm text-graphite/75">{repair.notesInternal}</p>
              </section>
            ) : null}
          </div>
        ) : (
          /* Edit mode */
          <div className="space-y-4 p-5">
            <p className="text-xs uppercase tracking-[0.12em] text-graphite/50">Editing repair</p>

            <section className="space-y-2 rounded-xl border border-graphite/12 bg-graphite/[0.025] p-3.5">
              <p className="text-[0.65rem] uppercase tracking-[0.14em] text-graphite/50">Repair Status</p>
              <select
                value={draft.status}
                onChange={(e) => setDraft((d) => ({ ...d, status: e.target.value as RepairStatus }))}
                className="input-premium"
              >
                {repairStatuses.map((s) => (
                  <option key={s} value={s}>{formatStatusLabel(s)}</option>
                ))}
              </select>
              <textarea
                value={draft.statusNote}
                onChange={(e) => setDraft((d) => ({ ...d, statusNote: e.target.value }))}
                rows={2}
                placeholder="Optional note for this status change…"
                className="input-premium resize-none text-xs"
              />
            </section>

            <section className="space-y-2 rounded-xl border border-graphite/12 bg-graphite/[0.025] p-3.5">
              <p className="text-[0.65rem] uppercase tracking-[0.14em] text-graphite/50">Estimate</p>
              <div className="grid gap-2 sm:grid-cols-2">
                <label className="space-y-1">
                  <span className="label-muted">Est. completion</span>
                  <input
                    type="date"
                    value={draft.estimatedCompletion}
                    onChange={(e) => setDraft((d) => ({ ...d, estimatedCompletion: e.target.value }))}
                    className="input-premium"
                  />
                </label>
                <label className="space-y-1">
                  <span className="label-muted">Amount due (EUR)</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={draft.amountDue}
                    onChange={(e) => setDraft((d) => ({ ...d, amountDue: e.target.value }))}
                    className="input-premium"
                  />
                </label>
              </div>
            </section>

            <section className="space-y-2 rounded-xl border border-graphite/12 bg-graphite/[0.025] p-3.5">
              <p className="text-[0.65rem] uppercase tracking-[0.14em] text-graphite/50">Customer-visible Note</p>
              <textarea
                value={draft.notesCustomer}
                onChange={(e) => setDraft((d) => ({ ...d, notesCustomer: e.target.value }))}
                rows={2}
                placeholder="Visible to customer in their portal…"
                className="input-premium resize-none"
              />
            </section>

            <section className="space-y-2 rounded-xl border border-walnut/14 bg-walnut/[0.03] p-3.5">
              <p className="text-[0.65rem] uppercase tracking-[0.14em] text-walnut/65">Internal Note</p>
              <textarea
                value={draft.notesInternal}
                onChange={(e) => setDraft((d) => ({ ...d, notesInternal: e.target.value }))}
                rows={2}
                placeholder="Internal notes only…"
                className="input-premium resize-none"
              />
            </section>
          </div>
        )}

        {/* Footer */}
        <div className="sticky bottom-0 flex items-center justify-between gap-3 border-t border-graphite/10 bg-white/95 px-5 py-4 backdrop-blur-sm">
          {mode === "view" ? (
            <Link
              href={`/admin/repairs?search=${encodeURIComponent(repair.repairCode)}`}
              className="inline-flex items-center gap-1.5 rounded-full border border-graphite/20 bg-white px-4 py-2 text-xs uppercase tracking-[0.1em] text-graphite transition hover:border-graphite/30 hover:bg-graphite/5"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              View in Repairs
            </Link>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSave}
                disabled={isPending}
                className="inline-flex h-9 items-center rounded-full bg-mineral px-5 text-xs font-medium uppercase tracking-[0.1em] text-white transition hover:brightness-90 disabled:opacity-60"
              >
                {isPending ? "Saving…" : "Save changes"}
              </button>
              <button
                type="button"
                onClick={() => setMode("view")}
                disabled={isPending}
                className="inline-flex h-9 items-center rounded-full border border-graphite/20 bg-white px-4 text-xs uppercase tracking-[0.1em] text-graphite transition hover:bg-graphite/5 disabled:opacity-60"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatRelativeTime(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
