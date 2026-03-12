"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/utils/cn";

type OrderProductOption = {
  id: string;
  brand: string;
  title: string;
  price: number;
};

type OrderLineItem = {
  rowId: string;
  productSearch: string;
  productId: string;
  quantity: string;
  sellingPrice: string;
  rabat: string;
  rabatType: "amount" | "percent";
};

type OrderLineDraft = Omit<OrderLineItem, "rowId">;

type NormalizedOrderProduct = OrderProductOption & {
  label: string;
  searchLabel: string;
  searchBlob: string;
};

const createDraft = (): OrderLineDraft => ({
  productSearch: "",
  productId: "",
  quantity: "1",
  sellingPrice: "",
  rabat: "",
  rabatType: "amount",
});

function normalizeText(value: string) {
  return value.trim().toLowerCase();
}

function round2(value: number) {
  return Math.round(value * 100) / 100;
}

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

export function ManualOrderItemsField({ products }: { products: OrderProductOption[] }) {
  const [items, setItems] = useState<OrderLineItem[]>([]);
  const [draft, setDraft] = useState<OrderLineDraft>(createDraft);
  const [nextRowNumber, setNextRowNumber] = useState(1);
  const [openPickerId, setOpenPickerId] = useState<string | null>(null);
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);
  const normalizedProducts = useMemo<NormalizedOrderProduct[]>(
    () =>
      products
        .map((product) => {
          const brand = String(product.brand ?? "").trim();
          const title = String(product.title ?? "").trim();
          const displayBrand = brand || "Unknown Brand";
          const displayTitle = title || `Product ${product.id.slice(0, 8)}`;
          const label = `${displayBrand} | ${displayTitle} | ${product.price.toFixed(2)} EUR`;
          const searchLabel = `${displayBrand} ${displayTitle}`.trim();
          const searchBlob = normalizeText(
            `${displayBrand} ${displayTitle} ${product.id} ${product.price}`,
          );
          return { ...product, label, searchLabel, searchBlob };
        })
        .sort((a, b) => a.label.localeCompare(b.label)),
    [products],
  );
  const productMap = useMemo(
    () => new Map(normalizedProducts.map((product) => [product.id, product])),
    [normalizedProducts],
  );

  const updateItem = (rowId: string, updates: Partial<OrderLineItem>) => {
    setItems((prev) =>
      prev.map((item) => (item.rowId === rowId ? { ...item, ...updates } : item)),
    );
  };

  const updateDraft = (updates: Partial<OrderLineDraft>) => {
    setDraft((prev) => ({ ...prev, ...updates }));
  };

  const addItem = () => {
    if (!draft.productId) {
      return;
    }

    const rowId = `row-${nextRowNumber}`;
    setItems((prev) => [...prev, { rowId, ...draft }]);
    setNextRowNumber((prev) => prev + 1);
    setDraft(createDraft());
    setExpandedRowId(rowId);
    setOpenPickerId(null);
  };

  const removeItem = (rowId: string) => {
    setItems((prev) => prev.filter((item) => item.rowId !== rowId));
    setExpandedRowId((current) => (current === rowId ? null : current));
    setOpenPickerId((current) => (current === rowId ? null : current));
  };

  const getFilteredProducts = (searchValue: string, selectedProductId: string) => {
    const term = normalizeText(searchValue);
    const selected = productMap.get(selectedProductId);
    const baseList =
      term.length === 0
        ? normalizedProducts.slice(0, 90)
        : normalizedProducts.filter((product) => product.searchBlob.includes(term)).slice(0, 90);

    if (selected && !baseList.some((entry) => entry.id === selected.id)) {
      return [selected, ...baseList];
    }

    return baseList;
  };

  const getItemPricing = (item: Pick<OrderLineItem, "productId" | "quantity" | "sellingPrice" | "rabat" | "rabatType">) => {
    const product = productMap.get(item.productId);
    if (!product) {
      return {
        quantity: Math.max(1, Math.trunc(parseNumber(item.quantity))),
        unitPrice: 0,
        lineSubtotal: 0,
        lineDiscount: 0,
        lineTotal: 0,
      };
    }

    const quantity = Math.max(1, Math.trunc(parseNumber(item.quantity)));
    const unitPrice = round2(item.sellingPrice ? parseNumber(item.sellingPrice) : product.price);
    const lineSubtotal = round2(Math.max(0, unitPrice * quantity));
    const rabatValue = Math.max(0, parseNumber(item.rabat));
    const lineDiscount =
      item.rabatType === "percent"
        ? round2(Math.min(lineSubtotal, lineSubtotal * (Math.min(100, rabatValue) / 100)))
        : round2(Math.min(rabatValue, lineSubtotal));
    const lineTotal = round2(Math.max(0, lineSubtotal - lineDiscount));

    return {
      quantity,
      unitPrice,
      lineSubtotal,
      lineDiscount,
      lineTotal,
    };
  };

  const subtotal = items.reduce((sum, item) => {
    const pricing = getItemPricing(item);
    return sum + pricing.lineTotal;
  }, 0);
  const draftFilteredProducts = getFilteredProducts(draft.productSearch, draft.productId).slice(0, 12);
  const draftSelectedProduct = draft.productId ? productMap.get(draft.productId) : null;

  return (
    <div className="space-y-2.5 rounded-lg border border-graphite/12 bg-white/70 p-2.5 sm:space-y-3 sm:p-3">
      <div className="flex items-center justify-between gap-3 border-b border-graphite/10 pb-2.5">
        <p className="text-xs uppercase tracking-[0.14em] text-graphite/70">Order Items</p>
      </div>

      <div className="rounded-lg border border-mineral/16 bg-mineral/[0.045] p-2.5 sm:p-3">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <p className="label-muted">New line item</p>
            <p className="mt-0.5 text-xs text-graphite/62">
              Select product, quantity, and discount, then append it to the order.
            </p>
          </div>
          <button
            type="button"
            onClick={addItem}
            disabled={!draft.productId}
            className="admin-secondary-btn disabled:cursor-not-allowed disabled:opacity-55"
          >
            + Add item
          </button>
        </div>

        <div className="mt-2 rounded-lg border border-mineral/18 bg-white/88 p-2.5 sm:p-3">
          <div className="space-y-1">
            <p className="label-muted">Product selection</p>
            <div className="relative min-w-0">
              <input
                value={draft.productSearch}
                onFocus={() => setOpenPickerId("draft")}
                onBlur={() => {
                  window.setTimeout(() => {
                    setOpenPickerId((current) => (current === "draft" ? null : current));
                  }, 120);
                }}
                onChange={(event) =>
                  updateDraft({
                    productSearch: event.target.value,
                    productId: "",
                  })
                }
                className="input-premium"
                placeholder="Search and select product"
              />
              {openPickerId === "draft" ? (
                <div className="absolute inset-x-0 z-50 mt-1 max-h-64 overflow-y-auto rounded-xl border border-graphite/14 bg-white p-1 shadow-[0_24px_46px_-28px_rgba(47,75,68,0.65)]">
                  {draftFilteredProducts.length === 0 ? (
                    <p className="px-3 py-2 text-xs text-graphite/62">No products found.</p>
                  ) : (
                    draftFilteredProducts.map((product) => (
                        <button
                          key={product.id}
                          type="button"
                          onMouseDown={(event) => {
                            event.preventDefault();
                            updateDraft({
                              productId: product.id,
                              productSearch: product.searchLabel,
                              sellingPrice:
                                draft.sellingPrice.length > 0
                                  ? draft.sellingPrice
                                  : String(product.price),
                            });
                            setOpenPickerId(null);
                          }}
                          className={`flex w-full min-w-0 items-center justify-between rounded-lg px-2.5 py-2 text-left text-sm transition ${
                            draft.productId === product.id
                              ? "bg-mineral/10 text-mineral"
                              : "text-graphite hover:bg-stone/35"
                          }`}
                        >
                          <span className="truncate pr-3">{product.searchLabel}</span>
                          <span className="text-xs text-graphite/62">
                            {product.price.toFixed(2)} EUR
                          </span>
                        </button>
                      ))
                  )}
                </div>
              ) : null}
            </div>
            <p className="min-h-4 text-xs text-graphite/62">
              {draftSelectedProduct
                ? `Base price: ${draftSelectedProduct.price.toFixed(2)} EUR`
                : "Search and select a product to add this line"}
            </p>
          </div>

          <div className="mt-2 rounded-lg border border-walnut/18 bg-walnut/[0.045] p-2.5">
            <p className="label-muted">Quantity and pricing</p>
            <div className="mt-1.5 grid gap-2 sm:grid-cols-[5.5rem_minmax(0,1fr)] lg:grid-cols-[5.5rem_minmax(0,1fr)_minmax(0,1fr)]">
              <div className="space-y-1">
                <label className="label-muted">Qty</label>
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
                <label className="label-muted">Unit Price Override (optional)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={draft.sellingPrice}
                  onChange={(event) => updateDraft({ sellingPrice: event.target.value })}
                  className="input-premium"
                />
              </div>
              <div className="space-y-1 sm:col-span-2 lg:col-span-1">
                <label className="label-muted">Rabat</label>
                <div className="grid grid-cols-[minmax(0,1fr)_5.8rem] gap-2">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={draft.rabat}
                    onChange={(event) => updateDraft({ rabat: event.target.value })}
                    className="input-premium"
                  />
                  <select
                    value={draft.rabatType}
                    onChange={(event) =>
                      updateDraft({
                        rabatType: event.target.value as "amount" | "percent",
                      })
                    }
                    className="input-premium"
                  >
                    <option value="amount">EUR</option>
                    <option value="percent">%</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-2.5 sm:space-y-3">
        {items.map((item, index) => {
          const selectedProduct = productMap.get(item.productId);
          const filteredProducts = getFilteredProducts(item.productSearch, item.productId).slice(0, 12);
          const pricing = getItemPricing(item);
          const isExpanded = expandedRowId === item.rowId;
          return (
            <div
              key={item.rowId}
              className={cn(
                "relative rounded-lg border border-graphite/12 bg-white p-2.5 shadow-[0_10px_28px_-24px_rgba(44,44,44,0.7)] sm:p-3",
                openPickerId === item.rowId ? "z-20" : "z-0",
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="label-muted">Item {index + 1}</p>
                  <p className="truncate text-sm text-graphite">
                    {selectedProduct ? selectedProduct.searchLabel : "Unselected product"}
                  </p>
                  <p className="text-xs text-graphite/62">
                    Qty {pricing.quantity} x {pricing.unitPrice.toFixed(2)} EUR
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="rounded-full border border-mineral/22 bg-mineral/[0.06] px-2.5 py-1 text-[0.65rem] uppercase tracking-[0.12em] text-mineral">
                    {pricing.lineTotal.toFixed(2)} EUR
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
                  <div className="mt-2 rounded-lg border border-mineral/16 bg-mineral/[0.045] p-2.5">
                    <p className="label-muted">Product selection</p>
                    <div className="relative mt-1.5 min-w-0">
                      <input
                        value={item.productSearch}
                        onFocus={() => setOpenPickerId(item.rowId)}
                        onBlur={() => {
                          window.setTimeout(() => {
                            setOpenPickerId((current) =>
                              current === item.rowId ? null : current,
                            );
                          }, 120);
                        }}
                        onChange={(event) =>
                          updateItem(item.rowId, {
                            productSearch: event.target.value,
                            productId: "",
                          })
                        }
                        className="input-premium"
                        placeholder="Search and select product"
                      />
                      {openPickerId === item.rowId ? (
                        <div className="absolute inset-x-0 z-50 mt-1 max-h-64 overflow-y-auto rounded-xl border border-graphite/14 bg-white p-1 shadow-[0_24px_46px_-28px_rgba(47,75,68,0.65)]">
                          {filteredProducts.length === 0 ? (
                            <p className="px-3 py-2 text-xs text-graphite/62">
                              No products found.
                            </p>
                          ) : (
                            filteredProducts.map((product) => (
                              <button
                                key={product.id}
                                type="button"
                                onMouseDown={(event) => {
                                  event.preventDefault();
                                  updateItem(item.rowId, {
                                    productId: product.id,
                                    productSearch: product.searchLabel,
                                    sellingPrice:
                                      item.sellingPrice.length > 0
                                        ? item.sellingPrice
                                        : String(product.price),
                                  });
                                  setOpenPickerId(null);
                                }}
                                className={`flex w-full min-w-0 items-center justify-between rounded-lg px-2.5 py-2 text-left text-sm transition ${
                                  item.productId === product.id
                                    ? "bg-mineral/10 text-mineral"
                                    : "text-graphite hover:bg-stone/35"
                                }`}
                              >
                                <span className="truncate pr-3">{product.searchLabel}</span>
                                <span className="text-xs text-graphite/62">
                                  {product.price.toFixed(2)} EUR
                                </span>
                              </button>
                            ))
                          )}
                        </div>
                      ) : null}
                    </div>
                    <p className="mt-1 min-h-4 text-xs text-graphite/62">
                      {selectedProduct
                        ? `Base price: ${selectedProduct.price.toFixed(2)} EUR`
                        : "Search and select a product to add this line"}
                    </p>
                  </div>

                  <div className="mt-2 rounded-lg border border-walnut/18 bg-walnut/[0.045] p-2.5">
                    <p className="label-muted">Quantity and pricing</p>
                    <div className="mt-1.5 grid gap-2 sm:grid-cols-[5.5rem_minmax(0,1fr)] lg:grid-cols-[5.5rem_minmax(0,1fr)_minmax(0,1fr)]">
                      <div className="space-y-1">
                        <label className="label-muted">Qty</label>
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
                        <label className="label-muted">Unit Price Override (optional)</label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.sellingPrice}
                          onChange={(event) =>
                            updateItem(item.rowId, { sellingPrice: event.target.value })
                          }
                          className="input-premium"
                        />
                      </div>
                      <div className="space-y-1 sm:col-span-2 lg:col-span-1">
                        <label className="label-muted">Rabat</label>
                        <div className="grid grid-cols-[minmax(0,1fr)_5.8rem] gap-2">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.rabat}
                            onChange={(event) => updateItem(item.rowId, { rabat: event.target.value })}
                            className="input-premium"
                          />
                          <select
                            value={item.rabatType}
                            onChange={(event) =>
                              updateItem(item.rowId, {
                                rabatType: event.target.value as "amount" | "percent",
                              })
                            }
                            className="input-premium"
                          >
                            <option value="amount">EUR</option>
                            <option value="percent">%</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              ) : null}

              <input type="hidden" name="itemProductId" value={item.productId} />
              <input type="hidden" name="itemQuantity" value={item.quantity} />
              <input type="hidden" name="itemSellingPrice" value={item.sellingPrice} />
              <input type="hidden" name="itemRabat" value={item.rabat} />
              <input type="hidden" name="itemRabatType" value={item.rabatType} />
            </div>
          );
        })}
      </div>

      <div className="rounded-lg border border-graphite/12 bg-white/78 p-2.5">
        {items.length === 0 ? (
          <p className="text-xs text-graphite/62">
            No line items yet. Use the section above to add the first product.
          </p>
        ) : (
          <p className="text-xs text-graphite/62">
            {items.length} {items.length === 1 ? "line item" : "line items"} ready for order creation.
          </p>
        )}
      </div>

      <div className="rounded-lg border border-mineral/20 bg-mineral/[0.05] px-2.5 py-2 sm:px-3">
        <p className="text-xs uppercase tracking-[0.14em] text-graphite/62">Calculated subtotal</p>
        <p className="mt-1 text-lg font-medium text-graphite">{subtotal.toFixed(2)} EUR</p>
        <p className="mt-1 text-xs text-graphite/62">
          Subtotal uses selected products, quantity, optional unit price override, and rabat per line.
        </p>
      </div>
    </div>
  );
}
