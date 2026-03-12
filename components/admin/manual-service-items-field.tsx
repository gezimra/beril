"use client";

import { useState } from "react";

type ServiceItemType = "watch" | "eyewear" | "other";

type ServiceLineItem = {
  rowId: string;
  itemType: ServiceItemType;
  brand: string;
  model: string;
  serviceType: string;
  description: string;
};

type ServiceDraft = Omit<ServiceLineItem, "rowId">;

const createDraft = (): ServiceDraft => ({
  itemType: "watch",
  brand: "",
  model: "",
  serviceType: "",
  description: "",
});

export function ManualServiceItemsField() {
  const [items, setItems] = useState<ServiceLineItem[]>([]);
  const [draft, setDraft] = useState<ServiceDraft>(createDraft);
  const [nextRowNumber, setNextRowNumber] = useState(1);
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);

  const updateDraft = (updates: Partial<ServiceDraft>) => {
    setDraft((prev) => ({ ...prev, ...updates }));
  };

  const updateItem = (rowId: string, updates: Partial<ServiceLineItem>) => {
    setItems((prev) =>
      prev.map((item) => (item.rowId === rowId ? { ...item, ...updates } : item)),
    );
  };

  const addItem = () => {
    if (!draft.brand.trim() || !draft.model.trim() || !draft.serviceType.trim() || !draft.description.trim()) {
      return;
    }

    const rowId = `service-row-${nextRowNumber}`;
    setItems((prev) => [...prev, { rowId, ...draft }]);
    setNextRowNumber((prev) => prev + 1);
    setDraft(createDraft());
    setExpandedRowId(rowId);
  };

  const removeItem = (rowId: string) => {
    setItems((prev) => prev.filter((item) => item.rowId !== rowId));
    setExpandedRowId((current) => (current === rowId ? null : current));
  };

  const canAdd =
    draft.brand.trim().length > 0 &&
    draft.model.trim().length > 0 &&
    draft.serviceType.trim().length > 0 &&
    draft.description.trim().length > 0;

  return (
    <div className="space-y-2.5 rounded-lg border border-graphite/12 bg-white/70 p-2.5 sm:space-y-3 sm:p-3">
      <div className="flex items-center justify-between gap-3 border-b border-graphite/10 pb-2.5">
        <p className="text-xs uppercase tracking-[0.14em] text-graphite/70">Service Items</p>
      </div>

      <div className="rounded-lg border border-mineral/16 bg-mineral/[0.045] p-2.5 sm:p-3">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <p className="label-muted">New service item</p>
            <p className="mt-0.5 text-xs text-graphite/62">
              Add each watch/eyewear item the customer brings in this visit.
            </p>
          </div>
          <button
            type="button"
            onClick={addItem}
            disabled={!canAdd}
            className="admin-secondary-btn disabled:cursor-not-allowed disabled:opacity-55"
          >
            + Add item
          </button>
        </div>

        <div className="mt-2 rounded-lg border border-mineral/18 bg-white/88 p-2.5 sm:p-3">
          <div className="grid gap-2 sm:grid-cols-2">
            <label className="space-y-1">
              <span className="label-muted">Item type</span>
              <select
                value={draft.itemType}
                onChange={(event) =>
                  updateDraft({ itemType: event.target.value as ServiceItemType })
                }
                className="input-premium"
              >
                <option value="watch">Watch</option>
                <option value="eyewear">Eyewear</option>
                <option value="other">Other</option>
              </select>
            </label>
            <label className="space-y-1">
              <span className="label-muted">Service type</span>
              <input
                value={draft.serviceType}
                onChange={(event) => updateDraft({ serviceType: event.target.value })}
                className="input-premium"
                placeholder="Battery, fitting, diagnostics..."
              />
            </label>
          </div>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            <label className="space-y-1">
              <span className="label-muted">Brand</span>
              <input
                value={draft.brand}
                onChange={(event) => updateDraft({ brand: event.target.value })}
                className="input-premium"
                placeholder="Brand"
              />
            </label>
            <label className="space-y-1">
              <span className="label-muted">Model</span>
              <input
                value={draft.model}
                onChange={(event) => updateDraft({ model: event.target.value })}
                className="input-premium"
                placeholder="Model"
              />
            </label>
          </div>
          <div className="mt-2">
            <label className="space-y-1">
              <span className="label-muted">Issue description</span>
              <textarea
                value={draft.description}
                onChange={(event) => updateDraft({ description: event.target.value })}
                className="input-premium min-h-[6.5rem] resize-y"
                placeholder="Describe the issue and requested service"
              />
            </label>
          </div>
        </div>
      </div>

      <div className="space-y-2.5 sm:space-y-3">
        {items.map((item, index) => {
          const isExpanded = expandedRowId === item.rowId;
          return (
            <div
              key={item.rowId}
              className="rounded-lg border border-graphite/12 bg-white p-2.5 shadow-[0_10px_28px_-24px_rgba(44,44,44,0.7)] sm:p-3"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="label-muted">Item {index + 1}</p>
                  <p className="truncate text-sm text-graphite">
                    {item.brand} {item.model}
                  </p>
                  <p className="truncate text-xs text-graphite/62">
                    {item.itemType} | {item.serviceType}
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
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
                <div className="mt-2 rounded-lg border border-walnut/18 bg-walnut/[0.045] p-2.5">
                  <div className="grid gap-2 sm:grid-cols-2">
                    <label className="space-y-1">
                      <span className="label-muted">Item type</span>
                      <select
                        value={item.itemType}
                        onChange={(event) =>
                          updateItem(item.rowId, { itemType: event.target.value as ServiceItemType })
                        }
                        className="input-premium"
                      >
                        <option value="watch">Watch</option>
                        <option value="eyewear">Eyewear</option>
                        <option value="other">Other</option>
                      </select>
                    </label>
                    <label className="space-y-1">
                      <span className="label-muted">Service type</span>
                      <input
                        value={item.serviceType}
                        onChange={(event) => updateItem(item.rowId, { serviceType: event.target.value })}
                        className="input-premium"
                      />
                    </label>
                  </div>
                  <div className="mt-2 grid gap-2 sm:grid-cols-2">
                    <label className="space-y-1">
                      <span className="label-muted">Brand</span>
                      <input
                        value={item.brand}
                        onChange={(event) => updateItem(item.rowId, { brand: event.target.value })}
                        className="input-premium"
                      />
                    </label>
                    <label className="space-y-1">
                      <span className="label-muted">Model</span>
                      <input
                        value={item.model}
                        onChange={(event) => updateItem(item.rowId, { model: event.target.value })}
                        className="input-premium"
                      />
                    </label>
                  </div>
                  <div className="mt-2">
                    <label className="space-y-1">
                      <span className="label-muted">Issue description</span>
                      <textarea
                        value={item.description}
                        onChange={(event) => updateItem(item.rowId, { description: event.target.value })}
                        className="input-premium min-h-[6.5rem] resize-y"
                      />
                    </label>
                  </div>
                </div>
              ) : null}

              <input type="hidden" name="serviceItemType" value={item.itemType} />
              <input type="hidden" name="serviceItemBrand" value={item.brand} />
              <input type="hidden" name="serviceItemModel" value={item.model} />
              <input type="hidden" name="serviceItemServiceType" value={item.serviceType} />
              <input type="hidden" name="serviceItemDescription" value={item.description} />
            </div>
          );
        })}
      </div>

      <div className="rounded-lg border border-mineral/20 bg-mineral/[0.05] px-2.5 py-2 sm:px-3">
        {items.length === 0 ? (
          <p className="text-xs text-graphite/62">
            No service items added yet. Add at least one item before submitting.
          </p>
        ) : (
          <p className="text-xs text-graphite/62">
            {items.length} {items.length === 1 ? "service item" : "service items"} ready for intake.
          </p>
        )}
      </div>

      <div className="rounded-xl border border-graphite/14 bg-white/80 p-2.5 sm:p-3">
        <button
          type="submit"
          disabled={items.length === 0}
          className="admin-primary-btn-mineral w-full sm:w-auto disabled:cursor-not-allowed disabled:opacity-55"
        >
          Create Manual Service
        </button>
      </div>
    </div>
  );
}

