"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEventHandler,
} from "react";

import { cn } from "@/lib/utils/cn";

type ComboboxInputProps = {
  /** Current value (controlled) */
  value: string;
  /** Called with the new value on every keystroke OR when a suggestion is selected */
  onChange: (value: string) => void;
  /** Static list of suggestions. Filtered by current value automatically. */
  suggestions: string[];
  /** Show all suggestions on focus even when input is empty */
  showAllOnFocus?: boolean;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  /** Passed to the underlying <input> so form submission works */
  name?: string;
  id?: string;
  autoComplete?: string;
};

/**
 * A styled combobox input — same dropdown design as CustomerLookupFields.
 * Accepts any free-text value but shows filtered suggestions from `suggestions`.
 * Fully keyboard navigable (↑ ↓ Enter Escape).
 */
export function ComboboxInput({
  value,
  onChange,
  suggestions,
  showAllOnFocus = true,
  placeholder,
  disabled,
  required,
  className,
  name,
  id: externalId,
  autoComplete = "off",
}: ComboboxInputProps) {
  const generatedId = useId();
  const inputId = externalId ?? generatedId;

  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);

  // Filter suggestions: show all when empty + showAllOnFocus, else filter by value
  const filtered =
    value.trim() === ""
      ? showAllOnFocus
        ? suggestions
        : []
      : suggestions.filter(
          (s) =>
            s.toLowerCase().includes(value.toLowerCase()) &&
            s.toLowerCase() !== value.toLowerCase(),
        );

  const isOpen = open && filtered.length > 0;

  // Close when clicking outside
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
      onChange(filtered[activeIndex]);
      setOpen(false);
      setActiveIndex(-1);
    } else if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
      setActiveIndex(-1);
    }
  };

  const select = (suggestion: string) => {
    onChange(suggestion);
    setOpen(false);
    setActiveIndex(-1);
  };

  return (
    <div ref={containerRef} className="relative">
      <input
        id={inputId}
        name={name}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
          setActiveIndex(-1);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() =>
          // Delay so onMouseDown on suggestions fires first
          window.setTimeout(() => {
            setOpen(false);
            setActiveIndex(-1);
          }, 120)
        }
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        autoComplete={autoComplete}
        aria-autocomplete="list"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        className={cn("input-premium", className)}
      />

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
