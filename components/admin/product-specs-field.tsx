"use client";

import { useState } from "react";

type Spec = { key: string; value: string };

export function ProductSpecsField({ defaultSpecs }: { defaultSpecs: Spec[] }) {
  const [specs, setSpecs] = useState<Spec[]>(
    defaultSpecs.length > 0 ? defaultSpecs : [{ key: "", value: "" }],
  );

  const update = (i: number, field: "key" | "value", val: string) =>
    setSpecs((s) => s.map((spec, idx) => (idx === i ? { ...spec, [field]: val } : spec)));

  const remove = (i: number) => setSpecs((s) => s.filter((_, idx) => idx !== i));

  const add = () => setSpecs((s) => [...s, { key: "", value: "" }]);

  const specsRaw = specs
    .filter((s) => s.key.trim())
    .map((s) => `${s.key.trim()}: ${s.value.trim()}`)
    .join("\n");

  return (
    <div className="space-y-1.5">
      <input type="hidden" name="specsRaw" value={specsRaw} />
      {specs.map((spec, i) => (
        <div key={i} className="flex items-center gap-1.5">
          <input
            value={spec.key}
            onChange={(e) => update(i, "key", e.target.value)}
            placeholder="key"
            className="input-premium min-w-0 flex-1 py-1.5 text-sm"
          />
          <span className="shrink-0 text-xs text-graphite/40">:</span>
          <input
            value={spec.value}
            onChange={(e) => update(i, "value", e.target.value)}
            placeholder="value"
            className="input-premium min-w-0 flex-[2] py-1.5 text-sm"
          />
          <button
            type="button"
            onClick={() => remove(i)}
            aria-label="Remove"
            className="shrink-0 px-1 text-lg leading-none text-graphite/35 transition hover:text-red-400"
          >
            ×
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={add}
        className="text-xs font-medium text-mineral hover:text-mineral/75"
      >
        + Add spec
      </button>
    </div>
  );
}
