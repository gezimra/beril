"use client";

import { useEffect, useRef, useState } from "react";

import { ComboboxInput } from "@/components/ui/combobox-input";

// ─── Types ────────────────────────────────────────────────────────────────────

type ServiceItemType = "watch" | "eyewear" | "other";

type OpticalRx = {
  sphOD: string; cylOD: string; axisOD: string;
  sphOS: string; cylOS: string; axisOS: string;
  add: string;
  pd: string;
  lensType: string;
  lensMaterial: string;
  coating: string;
  frameType: string;
};

type ServiceItemHistory = {
  id: string;
  itemType: string;
  brand: string | null;
  model: string | null;
  serialNumber: string | null;
  serviceCount: number;
  lastServiceAt: string | null;
};

type ServiceLineItem = {
  rowId: string;
  itemType: ServiceItemType;
  brand: string;
  model: string;
  serialNumber: string;
  serviceItemId: string | null; // linked service_items.id
  serviceType: string;
  description: string;
  optical?: OpticalRx;
};

type ServiceDraft = {
  itemType: ServiceItemType;
  brand: string;
  model: string;
  serialNumber: string;
  serviceItemId: string | null;
  serviceTypePreset: string;
  serviceTypeCustom: string;
  description: string;
  optical: OpticalRx;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const ITEM_TYPES: { value: ServiceItemType; label: string }[] = [
  { value: "watch", label: "Watch" },
  { value: "eyewear", label: "Eyewear" },
  { value: "other", label: "Other" },
];

const SERVICE_TYPE_OPTIONS: Record<ServiceItemType, string[]> = {
  watch: [
    "Battery replacement",
    "Strap fitting",
    "Crystal replacement",
    "Water resistance test",
    "Full service / overhaul",
    "Cleaning & polishing",
    "Clasp repair",
    "Crown repair",
    "Diagnostics",
    "Engraving",
    "Other",
  ],
  eyewear: [
    "Lens fitting",
    "Frame adjustment",
    "Nose pad replacement",
    "Hinge repair",
    "Lens replacement",
    "Frame repair",
    "Prescription update",
    "New glasses",
    "Diagnostics",
    "Other",
  ],
  other: [
    "Cleaning",
    "Repair",
    "Diagnostics",
    "Other",
  ],
};

// Service types that require optical prescription fields
const OPTICAL_SERVICE_TYPES = new Set([
  "Lens fitting",
  "Lens replacement",
  "Prescription update",
  "New glasses",
]);

const LENS_TYPES = ["Single vision", "Progressive", "Bifocal", "Reading / near"];
const LENS_MATERIALS = ["CR-39 (standard)", "Polycarbonate", "Trivex", "1.67 hi-index", "1.74 hi-index"];
const COATINGS = ["Basic", "Anti-reflective", "UV protection", "Blue light filter", "Photochromic (transition)", "Polarized"];
const FRAME_TYPES = ["Full rim", "Semi-rim", "Rimless"];

const createOptical = (): OpticalRx => ({
  sphOD: "", cylOD: "", axisOD: "",
  sphOS: "", cylOS: "", axisOS: "",
  add: "", pd: "",
  lensType: "Single vision",
  lensMaterial: "CR-39 (standard)",
  coating: "Anti-reflective",
  frameType: "Full rim",
});

const createDraft = (): ServiceDraft => ({
  itemType: "watch",
  brand: "",
  model: "",
  serialNumber: "",
  serviceItemId: null,
  serviceTypePreset: "",
  serviceTypeCustom: "",
  description: "",
  optical: createOptical(),
});

function getServiceType(draft: Pick<ServiceDraft, "serviceTypePreset" | "serviceTypeCustom">) {
  return draft.serviceTypePreset === "Other" ? draft.serviceTypeCustom : draft.serviceTypePreset;
}

// ─── Props ────────────────────────────────────────────────────────────────────

type Props = {
  onItemCountChange?: (count: number) => void;
  brandSuggestions?: string[];
};

// ─── Component ────────────────────────────────────────────────────────────────

export function ManualServiceItemsField({ onItemCountChange, brandSuggestions = [] }: Props) {
  const [items, setItems] = useState<ServiceLineItem[]>([]);
  const [draft, setDraft] = useState<ServiceDraft>(createDraft);
  const [nextRowNumber, setNextRowNumber] = useState(1);
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);
  const [draftOpen, setDraftOpen] = useState(true);
  const [toastLabel, setToastLabel] = useState<string | null>(null);

  useEffect(() => {
    onItemCountChange?.(items.length);
  }, [items.length, onItemCountChange]);

  const updateDraft = (updates: Partial<ServiceDraft>) =>
    setDraft((prev) => ({ ...prev, ...updates }));

  const updateItem = (rowId: string, updates: Partial<ServiceLineItem>) =>
    setItems((prev) => prev.map((item) => (item.rowId === rowId ? { ...item, ...updates } : item)));

  const updateItemOptical = (rowId: string, updates: Partial<OpticalRx>) =>
    setItems((prev) =>
      prev.map((item) =>
        item.rowId === rowId
          ? { ...item, optical: { ...(item.optical ?? createOptical()), ...updates } }
          : item,
      ),
    );

  const addItem = () => {
    const serviceType = getServiceType(draft);
    if (!serviceType.trim()) return;
    const rowId = `service-row-${nextRowNumber}`;
    setItems((prev) => [
      ...prev,
      {
        rowId,
        itemType: draft.itemType,
        brand: draft.brand,
        model: draft.model,
        serialNumber: draft.serialNumber,
        serviceItemId: draft.serviceItemId,
        serviceType,
        description: draft.description,
        optical: draft.itemType === "eyewear" ? { ...draft.optical } : undefined,
      },
    ]);
    setNextRowNumber((prev) => prev + 1);
    setDraft(createDraft());
    setExpandedRowId(null);
    // Show toast and keep the draft form open for the next item
    setToastLabel(serviceType);
    window.setTimeout(() => setToastLabel(null), 2500);
  };

  const removeItem = (rowId: string) => {
    setItems((prev) => {
      const next = prev.filter((item) => item.rowId !== rowId);
      if (next.length === 0) setDraftOpen(true);
      return next;
    });
    setExpandedRowId((c) => (c === rowId ? null : c));
  };

  const canAdd = getServiceType(draft).trim().length > 0;

  return (
    <div className="space-y-3">
      {/* Toast */}
      {toastLabel && (
        <div className="flex items-center gap-2 rounded-md border border-mineral/20 bg-mineral/[0.07] px-3 py-2 text-xs font-medium text-mineral">
          <span className="text-base leading-none">✓</span>
          &ldquo;{toastLabel}&rdquo; added — fill in the next item below
        </div>
      )}

      {/* Draft entry */}
      {draftOpen ? (
        <DraftForm
          draft={draft}
          onChange={updateDraft}
          onAdd={addItem}
          canAdd={canAdd}
          showCancel={items.length > 0}
          onCancel={() => setDraftOpen(false)}
          brandSuggestions={brandSuggestions}
        />
      ) : (
        <button
          type="button"
          onClick={() => setDraftOpen(true)}
          className="flex w-full items-center justify-center gap-1 rounded-md border border-black/12 bg-white py-2.5 text-sm font-medium text-graphite/70 shadow-sm transition hover:border-mineral/35 hover:bg-mineral/[0.03] hover:text-mineral"
        >
          <span className="text-base leading-none">+</span> Add another item
        </button>
      )}

      {/* Added items */}
      {items.length > 0 && (
        <div className="space-y-2">
          {items.map((item, index) => {
            const isExpanded = expandedRowId === item.rowId;
            return (
              <div key={item.rowId} className="rounded-md border border-black/10 bg-white p-3">
                {/* Summary row */}
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <ItemTypePill type={item.itemType} />
                      <p className="truncate text-sm font-medium text-graphite">
                        {item.serviceType}
                      </p>
                    </div>
                    <p className="mt-0.5 truncate text-xs text-graphite/55">
                      Item {index + 1}
                      {item.brand ? ` · ${item.brand}${item.model ? ` ${item.model}` : ""}` : ""}
                      {item.serialNumber ? ` · S/N ${item.serialNumber}` : ""}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setExpandedRowId((c) => (c === item.rowId ? null : item.rowId))}
                      className="admin-secondary-btn"
                    >
                      {isExpanded ? "Collapse" : "Edit"}
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

                {/* Inline edit */}
                {isExpanded && (
                  <div className="mt-3 border-t border-black/7 pt-3">
                    <ItemEditForm
                      item={item}
                      onUpdate={(updates) => updateItem(item.rowId, updates)}
                      onUpdateOptical={(updates) => updateItemOptical(item.rowId, updates)}
                      brandSuggestions={brandSuggestions}
                    />
                  </div>
                )}

                {/* Hidden form fields */}
                <input type="hidden" name="serviceItemType" value={item.itemType} />
                <input type="hidden" name="serviceItemBrand" value={item.brand} />
                <input type="hidden" name="serviceItemModel" value={item.model} />
                <input type="hidden" name="serviceItemSerialNumber" value={item.serialNumber} />
                <input type="hidden" name="serviceItemId" value={item.serviceItemId ?? ""} />
                <input type="hidden" name="serviceItemServiceType" value={item.serviceType} />
                <input type="hidden" name="serviceItemDescription" value={item.description} />
                {item.optical && OPTICAL_SERVICE_TYPES.has(item.serviceType) && (
                  <>
                    <input type="hidden" name="serviceItemOpticalSphOD" value={item.optical.sphOD} />
                    <input type="hidden" name="serviceItemOpticalCylOD" value={item.optical.cylOD} />
                    <input type="hidden" name="serviceItemOpticalAxisOD" value={item.optical.axisOD} />
                    <input type="hidden" name="serviceItemOpticalSphOS" value={item.optical.sphOS} />
                    <input type="hidden" name="serviceItemOpticalCylOS" value={item.optical.cylOS} />
                    <input type="hidden" name="serviceItemOpticalAxisOS" value={item.optical.axisOS} />
                    <input type="hidden" name="serviceItemOpticalAdd" value={item.optical.add} />
                    <input type="hidden" name="serviceItemOpticalPD" value={item.optical.pd} />
                    <input type="hidden" name="serviceItemOpticalLensType" value={item.optical.lensType} />
                    <input type="hidden" name="serviceItemOpticalMaterial" value={item.optical.lensMaterial} />
                    <input type="hidden" name="serviceItemOpticalCoating" value={item.optical.coating} />
                    <input type="hidden" name="serviceItemOpticalFrame" value={item.optical.frameType} />
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}

      {items.length > 0 && (
        <p className="text-xs text-graphite/50">
          {items.length} {items.length === 1 ? "item" : "items"} ready for intake.
        </p>
      )}
    </div>
  );
}

// ─── Draft form ───────────────────────────────────────────────────────────────

function DraftForm({
  draft,
  onChange,
  onAdd,
  canAdd,
  showCancel,
  onCancel,
  brandSuggestions,
}: {
  draft: ServiceDraft;
  onChange: (updates: Partial<ServiceDraft>) => void;
  onAdd: () => void;
  canAdd: boolean;
  showCancel: boolean;
  onCancel: () => void;
  brandSuggestions: string[];
}) {
  return (
    <div className="rounded-md border border-black/10 bg-black/[0.02] p-3">
      {/* Header row */}
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="text-xs font-medium text-graphite/65">
          {showCancel ? "Add another item" : "New item"}
        </p>
        {showCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="text-xs text-graphite/45 transition hover:text-graphite"
          >
            Cancel
          </button>
        )}
      </div>

      {/* Item type segmented control */}
      <div className="mb-3">
        <p className="label-muted mb-1.5">Item type</p>
        <div className="flex overflow-hidden rounded border border-black/12">
          {ITEM_TYPES.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => onChange({ itemType: value, serviceTypePreset: "", serviceTypeCustom: "" })}
              className={[
                "flex-1 py-1.5 text-xs font-medium transition border-r border-black/10 last:border-r-0",
                draft.itemType === value
                  ? "bg-graphite text-white"
                  : "bg-white text-graphite/65 hover:bg-black/[0.04] hover:text-graphite",
              ].join(" ")}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Service type */}
      <ServiceTypeField
        itemType={draft.itemType}
        preset={draft.serviceTypePreset}
        custom={draft.serviceTypeCustom}
        onPresetChange={(v) => onChange({ serviceTypePreset: v, serviceTypeCustom: "" })}
        onCustomChange={(v) => onChange({ serviceTypeCustom: v })}
        required
      />

      {/* Brand / Model / Serial */}
      <div className="mt-2 grid gap-2 sm:grid-cols-2">
        <label className="space-y-1">
          <span className="label-muted">Brand</span>
          <ComboboxInput
            value={draft.brand}
            onChange={(v) => onChange({ brand: v, model: "" })}
            suggestions={brandSuggestions}
            placeholder="Optional"
          />
        </label>
        <label className="space-y-1">
          <span className="label-muted">Model</span>
          <input
            value={draft.model}
            onChange={(e) => onChange({ model: e.target.value })}
            disabled={!draft.brand.trim()}
            className="input-premium disabled:cursor-not-allowed disabled:opacity-45"
            placeholder={draft.brand.trim() ? "Model" : "Enter brand first"}
          />
        </label>
      </div>

      {/* Serial number with history lookup */}
      <div className="mt-2">
        <SerialLookupField
          serialNumber={draft.serialNumber}
          linkedItemId={draft.serviceItemId}
          onSerialChange={(v) => onChange({ serialNumber: v, serviceItemId: null })}
          onLink={(id) => onChange({ serviceItemId: id })}
        />
      </div>

      {/* Description */}
      <div className="mt-2">
        <label className="space-y-1">
          <span className="label-muted">Issue / notes</span>
          <textarea
            value={draft.description}
            onChange={(e) => onChange({ description: e.target.value })}
            className="input-premium min-h-[4rem] resize-y"
            placeholder="Optional — describe the issue or customer request"
          />
        </label>
      </div>

      {/* Optical prescription — only for eyewear + lens fitting */}
      {draft.itemType === "eyewear" && OPTICAL_SERVICE_TYPES.has(getServiceType(draft)) && (
        <div className="mt-3 border-t border-black/7 pt-3">
          <OpticalForm
            rx={draft.optical}
            onChange={(updates) => onChange({ optical: { ...draft.optical, ...updates } })}
          />
        </div>
      )}

      {/* Add button at bottom */}
      <div className="mt-3 flex items-center gap-3 border-t border-black/7 pt-3">
        <button
          type="button"
          onClick={onAdd}
          disabled={!canAdd}
          className="admin-primary-btn-mineral disabled:cursor-not-allowed disabled:opacity-50"
        >
          + Add item
        </button>
        {!canAdd && (
          <p className="text-[0.68rem] text-graphite/42">
            Select a service type first
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Item edit form ───────────────────────────────────────────────────────────

function ItemEditForm({
  item,
  onUpdate,
  onUpdateOptical,
  brandSuggestions,
}: {
  item: ServiceLineItem;
  onUpdate: (updates: Partial<ServiceLineItem>) => void;
  onUpdateOptical: (updates: Partial<OpticalRx>) => void;
  brandSuggestions: string[];
}) {
  const [serviceTypePreset, setServiceTypePreset] = useState(() => {
    const options = SERVICE_TYPE_OPTIONS[item.itemType];
    return options.includes(item.serviceType) ? item.serviceType : "Other";
  });
  const [serviceTypeCustom, setServiceTypeCustom] = useState(() => {
    const options = SERVICE_TYPE_OPTIONS[item.itemType];
    return options.includes(item.serviceType) ? "" : item.serviceType;
  });

  return (
    <div className="space-y-2">
      {/* Item type */}
      <div>
        <p className="label-muted mb-1.5">Item type</p>
        <div className="flex overflow-hidden rounded border border-black/12">
          {ITEM_TYPES.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => onUpdate({ itemType: value })}
              className={[
                "flex-1 py-1.5 text-xs font-medium transition border-r border-black/10 last:border-r-0",
                item.itemType === value
                  ? "bg-graphite text-white"
                  : "bg-white text-graphite/65 hover:bg-black/[0.04] hover:text-graphite",
              ].join(" ")}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Service type */}
      <ServiceTypeField
        itemType={item.itemType}
        preset={serviceTypePreset}
        custom={serviceTypeCustom}
        onPresetChange={(v) => {
          setServiceTypePreset(v);
          setServiceTypeCustom("");
          if (v !== "Other") onUpdate({ serviceType: v });
        }}
        onCustomChange={(v) => {
          setServiceTypeCustom(v);
          onUpdate({ serviceType: v });
        }}
        required
      />

      {/* Brand / Model */}
      <div className="grid gap-2 sm:grid-cols-2">
        <label className="space-y-1">
          <span className="label-muted">Brand</span>
          <ComboboxInput
            value={item.brand}
            onChange={(v) => onUpdate({ brand: v, model: "" })}
            suggestions={brandSuggestions}
          />
        </label>
        <label className="space-y-1">
          <span className="label-muted">Model</span>
          <input
            value={item.model}
            onChange={(e) => onUpdate({ model: e.target.value })}
            disabled={!item.brand.trim()}
            className="input-premium disabled:cursor-not-allowed disabled:opacity-45"
            placeholder={item.brand.trim() ? "Model" : "Enter brand first"}
          />
        </label>
      </div>

      {/* Serial number */}
      <SerialLookupField
        serialNumber={item.serialNumber}
        linkedItemId={item.serviceItemId}
        onSerialChange={(v) => onUpdate({ serialNumber: v, serviceItemId: null })}
        onLink={(id) => onUpdate({ serviceItemId: id })}
      />

      {/* Description */}
      <label className="space-y-1">
        <span className="label-muted">Issue / notes</span>
        <textarea
          value={item.description}
          onChange={(e) => onUpdate({ description: e.target.value })}
          className="input-premium min-h-[4rem] resize-y"
        />
      </label>

      {/* Optical */}
      {item.itemType === "eyewear" && OPTICAL_SERVICE_TYPES.has(item.serviceType) && (
        <div className="border-t border-black/7 pt-3">
          <OpticalForm
            rx={item.optical ?? createOptical()}
            onChange={onUpdateOptical}
          />
        </div>
      )}
    </div>
  );
}

// ─── Service type field ───────────────────────────────────────────────────────

function ServiceTypeField({
  itemType,
  preset,
  custom,
  onPresetChange,
  onCustomChange,
  required,
}: {
  itemType: ServiceItemType;
  preset: string;
  custom: string;
  onPresetChange: (v: string) => void;
  onCustomChange: (v: string) => void;
  required?: boolean;
}) {
  const options = SERVICE_TYPE_OPTIONS[itemType];
  return (
    <div className="space-y-1.5">
      <label className="space-y-1">
        <span className="label-muted">
          Service type
          {required && <span className="ml-0.5 text-walnut/80">*</span>}
        </span>
        <select
          value={preset}
          onChange={(e) => onPresetChange(e.target.value)}
          className="input-premium"
        >
          <option value="" disabled>Select...</option>
          {options.map((o) => (
            <option key={o} value={o}>{o}</option>
          ))}
        </select>
      </label>
      {preset === "Other" && (
        <input
          value={custom}
          onChange={(e) => onCustomChange(e.target.value)}
          className="input-premium"
          placeholder="Describe the service type..."
          autoFocus
        />
      )}
    </div>
  );
}

// ─── Optical prescription form ────────────────────────────────────────────────

function OpticalForm({ rx, onChange }: { rx: OpticalRx; onChange: (u: Partial<OpticalRx>) => void }) {
  const rxField = (
    label: string,
    fieldOD: keyof OpticalRx,
    fieldOS: keyof OpticalRx,
    placeholder = "",
  ) => (
    <tr>
      <td className="py-1 pr-2 text-[0.68rem] font-medium text-graphite/55">{label}</td>
      <td className="py-1 pr-1.5">
        <input
          value={rx[fieldOD]}
          onChange={(e) => onChange({ [fieldOD]: e.target.value })}
          className="h-8 w-full rounded border border-black/12 bg-white px-2 text-center text-xs text-graphite transition focus:border-mineral/50 focus:outline-none"
          placeholder={placeholder}
        />
      </td>
      <td className="py-1">
        <input
          value={rx[fieldOS]}
          onChange={(e) => onChange({ [fieldOS]: e.target.value })}
          className="h-8 w-full rounded border border-black/12 bg-white px-2 text-center text-xs text-graphite transition focus:border-mineral/50 focus:outline-none"
          placeholder={placeholder}
        />
      </td>
    </tr>
  );

  return (
    <div className="space-y-3">
      <p className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-mineral/70">
        Optical Prescription
      </p>

      {/* Rx grid */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[260px]">
          <thead>
            <tr>
              <th className="w-12" />
              <th className="pb-1.5 text-center text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-graphite/50">
                OD (right)
              </th>
              <th className="pb-1.5 text-center text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-graphite/50">
                OS (left)
              </th>
            </tr>
          </thead>
          <tbody>
            {rxField("Sph", "sphOD", "sphOS", "0.00")}
            {rxField("Cyl", "cylOD", "cylOS", "0.00")}
            {rxField("Axis", "axisOD", "axisOS", "—")}
            {rxField("Add", "add", "add", "—")}
          </tbody>
        </table>
      </div>

      {/* PD */}
      <label className="space-y-1">
        <span className="label-muted">PD (pupillary distance)</span>
        <input
          value={rx.pd}
          onChange={(e) => onChange({ pd: e.target.value })}
          className="input-premium"
          placeholder="e.g. 64 or 32/32"
        />
      </label>

      {/* Lens & frame options */}
      <div className="grid gap-2 sm:grid-cols-2">
        <label className="space-y-1">
          <span className="label-muted">Lens type</span>
          <select
            value={rx.lensType}
            onChange={(e) => onChange({ lensType: e.target.value })}
            className="input-premium"
          >
            {LENS_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </label>
        <label className="space-y-1">
          <span className="label-muted">Frame type</span>
          <select
            value={rx.frameType}
            onChange={(e) => onChange({ frameType: e.target.value })}
            className="input-premium"
          >
            {FRAME_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </label>
        <label className="space-y-1">
          <span className="label-muted">Lens material</span>
          <select
            value={rx.lensMaterial}
            onChange={(e) => onChange({ lensMaterial: e.target.value })}
            className="input-premium"
          >
            {LENS_MATERIALS.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </label>
        <label className="space-y-1">
          <span className="label-muted">Coating</span>
          <select
            value={rx.coating}
            onChange={(e) => onChange({ coating: e.target.value })}
            className="input-premium"
          >
            {COATINGS.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </label>
      </div>
    </div>
  );
}

// ─── Serial number lookup field ───────────────────────────────────────────────

const SERIAL_LOOKUP_DEBOUNCE_MS = 300;

function relativeTime(iso: string) {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

function SerialLookupField({
  serialNumber,
  linkedItemId,
  onSerialChange,
  onLink,
}: {
  serialNumber: string;
  linkedItemId: string | null;
  onSerialChange: (v: string) => void;
  onLink: (id: string) => void;
}) {
  const [results, setResults] = useState<ServiceItemHistory[]>([]);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    const q = serialNumber.trim();
    if (q.length < 3) {
      setResults([]);
      return;
    }
    timerRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/admin/items/lookup?q=${encodeURIComponent(q)}&limit=4`,
          { cache: "no-store" },
        );
        if (res.ok) {
          const payload: { ok: boolean; items: ServiceItemHistory[] } = await res.json();
          setResults(payload.items ?? []);
        }
      } finally {
        setLoading(false);
      }
    }, SERIAL_LOOKUP_DEBOUNCE_MS);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [serialNumber]);

  const linkedItem = results.find((r) => r.id === linkedItemId);

  return (
    <div className="space-y-1.5">
      <label className="space-y-1">
        <span className="label-muted">Serial number</span>
        <input
          value={serialNumber}
          onChange={(e) => onSerialChange(e.target.value)}
          className="input-premium font-mono"
          placeholder="Optional — used to track service history"
          autoComplete="off"
        />
      </label>

      {/* Linked item badge */}
      {linkedItem && (
        <div className="flex items-center gap-2 rounded border border-mineral/20 bg-mineral/[0.06] px-2.5 py-1.5 text-xs text-mineral">
          <span className="font-medium">↗ Linked:</span>
          <span>
            {linkedItem.brand} {linkedItem.model} ·{" "}
            <span className="font-semibold">{linkedItem.serviceCount} previous {linkedItem.serviceCount === 1 ? "service" : "services"}</span>
            {linkedItem.lastServiceAt ? ` · last ${relativeTime(linkedItem.lastServiceAt)}` : ""}
          </span>
        </div>
      )}

      {/* Lookup results (only when not already linked) */}
      {!linkedItemId && results.length > 0 && (
        <div className="rounded border border-black/10 bg-white">
          <p className="border-b border-black/7 px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-graphite/45">
            Known items — select to link
          </p>
          {results.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => onLink(r.id)}
              className="flex w-full items-center justify-between gap-3 px-2.5 py-2 text-left text-xs transition hover:bg-mineral/[0.05]"
            >
              <span className="font-medium text-graphite">
                {r.brand ?? "—"} {r.model ?? ""}
                {r.serialNumber ? <span className="ml-1 font-mono text-graphite/55">#{r.serialNumber}</span> : null}
              </span>
              <span className="shrink-0 text-graphite/50">
                {r.serviceCount} {r.serviceCount === 1 ? "service" : "services"}
                {r.lastServiceAt ? ` · ${relativeTime(r.lastServiceAt)}` : ""}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Loading state */}
      {loading && !linkedItemId && (
        <p className="text-[0.68rem] text-graphite/40">Searching history…</p>
      )}

      {/* No match */}
      {!loading && !linkedItemId && serialNumber.trim().length >= 3 && results.length === 0 && (
        <p className="text-[0.68rem] text-graphite/40">No previous service record found — new item will be registered.</p>
      )}
    </div>
  );
}

// ─── Item type pill ───────────────────────────────────────────────────────────

function ItemTypePill({ type }: { type: ServiceItemType }) {
  const styles: Record<ServiceItemType, string> = {
    watch: "bg-walnut/10 text-walnut",
    eyewear: "bg-mineral/10 text-mineral",
    other: "bg-graphite/8 text-graphite/65",
  };
  return (
    <span className={`shrink-0 rounded px-1.5 py-0.5 text-[0.6rem] font-semibold uppercase tracking-[0.1em] ${styles[type]}`}>
      {type}
    </span>
  );
}

