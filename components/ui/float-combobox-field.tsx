"use client";

import { useEffect, useId, useRef, useState, type KeyboardEventHandler } from "react";

import { cn } from "@/lib/utils/cn";

type FloatComboboxFieldProps = {
  name: string;
  label: string;
  suggestions: string[];
  defaultValue?: string;
  required?: boolean;
  wrapperClassName?: string;
};

/**
 * Floating-label combobox that matches the admin float-field style.
 * Free-text input with filtered dropdown suggestions.
 * Keyboard navigable (↑ ↓ Enter Escape).
 */
export function FloatComboboxField({
  name,
  label,
  suggestions,
  defaultValue = "",
  required,
  wrapperClassName,
}: FloatComboboxFieldProps) {
  const id = useId();
  const [value, setValue] = useState(defaultValue);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);

  const filtered =
    value.trim() === ""
      ? suggestions
      : suggestions.filter(
          (s) =>
            s.toLowerCase().includes(value.toLowerCase()) &&
            s.toLowerCase() !== value.toLowerCase(),
        );

  const isOpen = open && filtered.length > 0;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) {
        setOpen(false);
        setActiveIndex(-1);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const select = (suggestion: string) => {
    setValue(suggestion);
    setOpen(false);
    setActiveIndex(-1);
  };

  const handleKeyDown: KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (!isOpen) {
      if (e.key === "ArrowDown") {
        setOpen(true);
        setActiveIndex(0);
      }
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault();
      select(filtered[activeIndex]);
    } else if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
      setActiveIndex(-1);
    }
  };

  return (
    <div ref={containerRef} className={cn("float-field", wrapperClassName)}>
      <input
        id={id}
        name={name}
        value={value}
        placeholder=" "
        required={required}
        autoComplete="off"
        aria-autocomplete="list"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        onChange={(e) => {
          setValue(e.target.value);
          setOpen(true);
          setActiveIndex(-1);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() =>
          window.setTimeout(() => {
            setOpen(false);
            setActiveIndex(-1);
          }, 120)
        }
        onKeyDown={handleKeyDown}
      />
      <label htmlFor={id}>
        {label}
        {required ? <span className="ml-0.5 text-walnut/80">*</span> : null}
      </label>

      {isOpen && (
        <ul
          role="listbox"
          className="absolute inset-x-0 top-full z-40 mt-1 max-h-52 overflow-y-auto rounded-lg border border-graphite/12 bg-white p-1 shadow-[0_12px_32px_-12px_rgba(44,44,44,0.18)]"
        >
          {filtered.map((suggestion, index) => (
            <li key={suggestion} role="option" aria-selected={index === activeIndex}>
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  select(suggestion);
                }}
                className={cn(
                  "w-full rounded-md px-3 py-2 text-left text-sm transition",
                  index === activeIndex
                    ? "bg-mineral/10 text-mineral"
                    : "text-graphite hover:bg-black/[0.04]",
                )}
              >
                {suggestion}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
