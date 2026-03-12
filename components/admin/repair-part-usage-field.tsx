"use client";

import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { cn } from "@/lib/utils/cn";

type WorkOrderOption = {
  id: string;
  label: string;
};

type InventoryItemOption = {
  id: string;
  label: string;
  unitCost: number | null;
};

type UsageLineItem = {
  rowId: string;
  workOrderId: string;
  inventoryItemId: string;
  quantity: string;
  unitCost: string;
  note: string;
};

type UsageDraft = Omit<UsageLineItem, "rowId">;

const createDraft = (
  defaultWorkOrderId: string,
  defaultInventoryItemId: string,
  defaultUnitCost: number | null,
): UsageDraft => ({
  workOrderId: defaultWorkOrderId,
  inventoryItemId: defaultInventoryItemId,
  quantity: "1",
  unitCost: defaultUnitCost === null ? "" : String(defaultUnitCost),
  note: "",
});

function parseNumber(value: string | undefined) {
  if (!value) {
    return 0;
  }
  const normalized = Number(value);
  if (!Number.isFinite(normalized)) {
    return 0;
  }
  return normalized;
}

function round2(value: number) {
  return Math.round(value * 100) / 100;
}

export function RepairPartUsageField({
  workOrders,
  inventoryItems,
  defaultWorkOrderId,
  defaultInventoryItemId,
}: {
  workOrders: WorkOrderOption[];
  inventoryItems: InventoryItemOption[];
  defaultWorkOrderId?: string;
  defaultInventoryItemId?: string;
}) {
  const inventoryMap = useMemo(
    () => new Map(inventoryItems.map((item) => [item.id, item])),
    [inventoryItems],
  );
  const workOrderMap = useMemo(
    () => new Map(workOrders.map((item) => [item.id, item])),
    [workOrders],
  );

  const initialInventory = defaultInventoryItemId
    ? inventoryMap.get(defaultInventoryItemId) ?? null
    : null;
  const [items, setItems] = useState<UsageLineItem[]>([]);
  const [draft, setDraft] = useState<UsageDraft>(
    createDraft(
      defaultWorkOrderId ?? "",
      defaultInventoryItemId ?? "",
      initialInventory?.unitCost ?? null,
    ),
  );
  const [nextRowNumber, setNextRowNumber] = useState(1);
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);

  const updateDraft = (updates: Partial<UsageDraft>) => {
    setDraft((prev) => ({ ...prev, ...updates }));
  };

  const updateItem = (rowId: string, updates: Partial<UsageLineItem>) => {
    setItems((prev) =>
      prev.map((item) => (item.rowId === rowId ? { ...item, ...updates } : item)),
    );
  };

  const addItem = () => {
    if (!draft.workOrderId || !draft.inventoryItemId) {
      return;
    }

    const rowId = `usage-row-${nextRowNumber}`;
    setItems((prev) => [...prev, { rowId, ...draft }]);
    setNextRowNumber((prev) => prev + 1);
    const selectedInventory = inventoryMap.get(draft.inventoryItemId) ?? null;
    setDraft(
      createDraft(
        draft.workOrderId,
        "",
        selectedInventory?.unitCost ?? null,
      ),
    );
    setExpandedRowId(rowId);
  };

  const removeItem = (rowId: string) => {
    setItems((prev) => prev.filter((item) => item.rowId !== rowId));
    setExpandedRowId((current) => (current === rowId ? null : current));
  };

  const totalQuantity = items.reduce(
    (sum, item) => sum + Math.max(1, Math.trunc(parseNumber(item.quantity))),
    0,
  );
  const totalCost = items.reduce((sum, item) => {
    const quantity = Math.max(1, Math.trunc(parseNumber(item.quantity)));
    const unitCost = Math.max(0, parseNumber(item.unitCost));
    return sum + round2(quantity * unitCost);
  }, 0);

  return (
    <div className="space-y-2.5 rounded-lg border border-graphite/12 bg-white/70 p-2.5 sm:space-y-3 sm:p-3">
      <div className="flex items-center justify-between gap-3 border-b border-graphite/10 pb-2.5">
        <p className="text-xs uppercase tracking-[0.14em] text-graphite/70">Parts Consumption</p>
      </div>

      <div className="rounded-lg border border-mineral/16 bg-mineral/[0.045] p-2.5 sm:p-3">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <p className="label-muted">New parts usage line</p>
            <p className="mt-0.5 text-xs text-graphite/62">
              Select work order, part, and quantity, then append it to the batch.
            </p>
          </div>
          <button
            type="button"
            onClick={addItem}
            disabled={!draft.workOrderId || !draft.inventoryItemId}
            className="admin-secondary-btn disabled:cursor-not-allowed disabled:opacity-55"
          >
            + Add usage
          </button>
        </div>

        <div className="mt-2 rounded-lg border border-mineral/18 bg-white/88 p-2.5 sm:p-3">
          <div className="grid gap-2 sm:grid-cols-2">
            <FloatSelectInline
              value={draft.workOrderId}
              onChange={(value) => updateDraft({ workOrderId: value })}
              label="Work order"
            >
              <option value="">Select work order</option>
              {workOrders.map((workOrder) => (
                <option key={workOrder.id} value={workOrder.id}>
                  {workOrder.label}
                </option>
              ))}
            </FloatSelectInline>
            <FloatSelectInline
              value={draft.inventoryItemId}
              onChange={(value) => {
                const selected = inventoryMap.get(value) ?? null;
                updateDraft({
                  inventoryItemId: value,
                  unitCost: draft.unitCost.length > 0 ? draft.unitCost : selected?.unitCost === null || selected?.unitCost === undefined ? "" : String(selected.unitCost),
                });
              }}
              label="Inventory item"
            >
              <option value="">Select part</option>
              {inventoryItems.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </FloatSelectInline>
          </div>

          <div className="mt-2 rounded-lg border border-walnut/18 bg-walnut/[0.045] p-2.5">
            <p className="label-muted">Quantity and costing</p>
            <div className="mt-1.5 grid gap-2 sm:grid-cols-[7rem_minmax(0,1fr)]">
              <div className="space-y-1">
                <label className="label-muted">Quantity</label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={draft.quantity}
                  onChange={(event) => updateDraft({ quantity: event.target.value })}
                  className="input-premium"
                />
              </div>
              <div className="space-y-1">
                <label className="label-muted">Unit Cost Override (optional)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={draft.unitCost}
                  onChange={(event) => updateDraft({ unitCost: event.target.value })}
                  className="input-premium"
                />
              </div>
            </div>
            <div className="mt-2">
              <label className="label-muted">Stock note (optional)</label>
              <input
                value={draft.note}
                onChange={(event) => updateDraft({ note: event.target.value })}
                className="input-premium mt-1"
                placeholder="Part consumed in repair work order"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-2.5 sm:space-y-3">
        {items.map((item, index) => {
          const part = inventoryMap.get(item.inventoryItemId);
          const workOrder = workOrderMap.get(item.workOrderId);
          const isExpanded = expandedRowId === item.rowId;
          const quantity = Math.max(1, Math.trunc(parseNumber(item.quantity)));
          const unitCost = Math.max(0, parseNumber(item.unitCost));
          const lineTotal = round2(quantity * unitCost);

          return (
            <div
              key={item.rowId}
              className={cn(
                "rounded-lg border border-graphite/12 bg-white p-2.5 shadow-[0_10px_28px_-24px_rgba(44,44,44,0.7)] sm:p-3",
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="label-muted">Usage line {index + 1}</p>
                  <p className="truncate text-sm text-graphite">
                    {part?.label ?? "Unselected part"}
                  </p>
                  <p className="truncate text-xs text-graphite/62">
                    {workOrder?.label ?? "No work order selected"} | Qty {quantity}
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="rounded-full border border-mineral/22 bg-mineral/[0.06] px-2.5 py-1 text-[0.65rem] uppercase tracking-[0.12em] text-mineral">
                    {lineTotal.toFixed(2)} EUR
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedRowId((current) => (current === item.rowId ? null : item.rowId))
                    }
                    className="admin-secondary-btn"
                  >
                    {isExpanded ? "Hide" : "Edit"}
                  </button>
                  <button
                    type="button"
                    onClick={() => removeItem(item.rowId)}
                    className="admin-secondary-btn"
                  >
                    Remove
                  </button>
                </div>
              </div>

              {isExpanded ? (
                <>
                  <div className="mt-2 grid gap-2 sm:grid-cols-2">
                    <FloatSelectInline
                      value={item.workOrderId}
                      onChange={(value) => updateItem(item.rowId, { workOrderId: value })}
                      label="Work order"
                    >
                      <option value="">Select work order</option>
                      {workOrders.map((workOrderOption) => (
                        <option key={workOrderOption.id} value={workOrderOption.id}>
                          {workOrderOption.label}
                        </option>
                      ))}
                    </FloatSelectInline>
                    <FloatSelectInline
                      value={item.inventoryItemId}
                      onChange={(value) => {
                        const selected = inventoryMap.get(value) ?? null;
                        updateItem(item.rowId, {
                          inventoryItemId: value,
                          unitCost:
                            item.unitCost.length > 0
                              ? item.unitCost
                              : selected?.unitCost === null || selected?.unitCost === undefined
                                ? ""
                                : String(selected.unitCost),
                        });
                      }}
                      label="Inventory item"
                    >
                      <option value="">Select part</option>
                      {inventoryItems.map((inventoryItemOption) => (
                        <option key={inventoryItemOption.id} value={inventoryItemOption.id}>
                          {inventoryItemOption.label}
                        </option>
                      ))}
                    </FloatSelectInline>
                  </div>

                  <div className="mt-2 rounded-lg border border-walnut/18 bg-walnut/[0.045] p-2.5">
                    <p className="label-muted">Quantity and costing</p>
                    <div className="mt-1.5 grid gap-2 sm:grid-cols-[7rem_minmax(0,1fr)]">
                      <div className="space-y-1">
                        <label className="label-muted">Quantity</label>
                        <input
                          type="number"
                          min="1"
                          step="1"
                          value={item.quantity}
                          onChange={(event) => updateItem(item.rowId, { quantity: event.target.value })}
                          className="input-premium"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="label-muted">Unit Cost Override (optional)</label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.unitCost}
                          onChange={(event) => updateItem(item.rowId, { unitCost: event.target.value })}
                          className="input-premium"
                        />
                      </div>
                    </div>
                    <div className="mt-2">
                      <label className="label-muted">Stock note (optional)</label>
                      <input
                        value={item.note}
                        onChange={(event) => updateItem(item.rowId, { note: event.target.value })}
                        className="input-premium mt-1"
                        placeholder="Part consumed in repair work order"
                      />
                    </div>
                  </div>
                </>
              ) : null}

              <input type="hidden" name="usageWorkOrderId" value={item.workOrderId} />
              <input type="hidden" name="usageInventoryItemId" value={item.inventoryItemId} />
              <input type="hidden" name="usageQuantity" value={item.quantity} />
              <input type="hidden" name="usageUnitCost" value={item.unitCost} />
              <input type="hidden" name="usageNote" value={item.note} />
            </div>
          );
        })}
      </div>

      <div className="rounded-lg border border-mineral/20 bg-mineral/[0.05] px-2.5 py-2 sm:px-3">
        {items.length === 0 ? (
          <p className="text-xs text-graphite/62">
            No usage lines yet. Add at least one part usage before submitting.
          </p>
        ) : (
          <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-graphite/70">
            <span>{items.length} lines</span>
            <span>Total qty: {totalQuantity}</span>
            <span>Estimated total cost: {totalCost.toFixed(2)} EUR</span>
          </div>
        )}
      </div>

      <div className="rounded-xl border border-graphite/14 bg-white/80 p-2.5 sm:p-3">
        <button
          type="submit"
          disabled={items.length === 0}
          className="admin-primary-btn-walnut w-full sm:w-auto disabled:cursor-not-allowed disabled:opacity-55"
        >
          Consume Parts Batch
        </button>
      </div>
    </div>
  );
}

function FloatSelectInline({
  value,
  onChange,
  label,
  children,
}: {
  value: string;
  onChange: (value: string) => void;
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="space-y-1">
      <span className="label-muted">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="input-premium"
      >
        {children}
      </select>
    </label>
  );
}
