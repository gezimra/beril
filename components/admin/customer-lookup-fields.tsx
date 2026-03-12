"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEventHandler,
} from "react";

import { FloatInput } from "@/components/ui/float-field";
import { PhoneInput } from "@/components/ui/phone-input";
import type { AdminCustomerLookup } from "@/types/admin";

const MIN_LOOKUP_LENGTH = 2;
const LOOKUP_DEBOUNCE_MS = 220;

function setFormFieldValue(
  formElement: HTMLFormElement | null,
  fieldName: string,
  nextValue: string,
) {
  if (!formElement) {
    return;
  }

  const field = formElement.elements.namedItem(fieldName);
  if (!(field instanceof HTMLInputElement) && !(field instanceof HTMLSelectElement)) {
    return;
  }

  if (field.value === nextValue) {
    return;
  }

  field.value = nextValue;
  field.dispatchEvent(new Event("input", { bubbles: true }));
  field.dispatchEvent(new Event("change", { bubbles: true }));
}

function formatCustomerHint(customer: AdminCustomerLookup) {
  const chips = [customer.phone, customer.email, customer.city].filter(Boolean);
  return chips.join(" | ");
}

type CustomerLookupFieldsProps = {
  mode: "order" | "service";
};

export function CustomerLookupFields({ mode }: CustomerLookupFieldsProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const requestRef = useRef(0);

  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [suggestions, setSuggestions] = useState<AdminCustomerLookup[]>([]);

  const canSearch = customerName.trim().length >= MIN_LOOKUP_LENGTH;
  const hasSuggestions = suggestions.length > 0;
  const dropdownVisible = open && (loading || hasSuggestions || canSearch || errorText !== null);

  const emptyText = useMemo(() => {
    if (errorText) {
      return errorText;
    }
    if (loading) {
      return "Searching customers...";
    }
    if (canSearch && !hasSuggestions) {
      return "No existing customer found. Continue typing to add a new one.";
    }
    return null;
  }, [canSearch, errorText, hasSuggestions, loading]);

  useEffect(() => {
    const query = customerName.trim();
    if (query.length < MIN_LOOKUP_LENGTH) {
      setSuggestions([]);
      setLoading(false);
      setErrorText(null);
      setActiveIndex(-1);
      return;
    }

    const abortController = new AbortController();
    const requestId = requestRef.current + 1;
    requestRef.current = requestId;

    const timeoutId = window.setTimeout(async () => {
      setLoading(true);
      setErrorText(null);
      try {
        const response = await fetch(
          `/api/admin/customers/lookup?q=${encodeURIComponent(query)}&limit=8`,
          {
            method: "GET",
            cache: "no-store",
            signal: abortController.signal,
          },
        );

        if (!response.ok) {
          throw new Error("Customer lookup failed.");
        }

        const payload: { ok?: boolean; customers?: AdminCustomerLookup[] } =
          await response.json();

        if (requestRef.current !== requestId) {
          return;
        }

        setSuggestions(Array.isArray(payload.customers) ? payload.customers : []);
        setActiveIndex(-1);
      } catch (error) {
        if (abortController.signal.aborted || requestRef.current !== requestId) {
          return;
        }
        setSuggestions([]);
        setActiveIndex(-1);
        setErrorText(
          error instanceof Error ? error.message : "Customer lookup failed.",
        );
      } finally {
        if (requestRef.current === requestId) {
          setLoading(false);
        }
      }
    }, LOOKUP_DEBOUNCE_MS);

    return () => {
      abortController.abort();
      window.clearTimeout(timeoutId);
    };
  }, [customerName]);

  const applySuggestion = (customer: AdminCustomerLookup) => {
    setCustomerName(customer.name);
    if (customer.phone) {
      setPhone(customer.phone);
    }

    if (mode === "order") {
      if (customer.city) {
        setCity(customer.city);
      }
      if (customer.address) {
        setAddress(customer.address);
      }
    }

    const formElement = rootRef.current?.closest("form");
    setFormFieldValue(formElement ?? null, "email", customer.email ?? "");
    if (mode === "order") {
      setFormFieldValue(
        formElement ?? null,
        "country",
        customer.country?.trim() || "Kosovo",
      );
    }

    setOpen(false);
    setActiveIndex(-1);
  };

  const onNameKeyDown: KeyboardEventHandler<HTMLInputElement> = (event) => {
    if (!dropdownVisible || suggestions.length === 0) {
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setOpen(true);
      setActiveIndex((prev) => (prev + 1) % suggestions.length);
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setOpen(true);
      setActiveIndex((prev) =>
        prev <= 0 ? suggestions.length - 1 : prev - 1,
      );
      return;
    }

    if (event.key === "Enter") {
      if (activeIndex >= 0) {
        event.preventDefault();
        applySuggestion(suggestions[activeIndex]);
        return;
      }
      if (suggestions.length > 0) {
        event.preventDefault();
        applySuggestion(suggestions[0]);
      }
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      setOpen(false);
      setActiveIndex(-1);
    }
  };

  return (
    <div ref={rootRef} className="space-y-2">
      <div className="grid gap-2 sm:grid-cols-2">
        <div className="relative">
          <FloatInput
            name="customerName"
            required
            label="Customer name"
            value={customerName}
            autoComplete="off"
            onFocus={() => setOpen(true)}
            onBlur={() => {
              window.setTimeout(() => {
                setOpen(false);
                setActiveIndex(-1);
              }, 120);
            }}
            onKeyDown={onNameKeyDown}
            onChange={(event) => {
              setCustomerName(event.target.value);
              setOpen(true);
              setErrorText(null);
            }}
          />
          {dropdownVisible ? (
            <div className="absolute inset-x-0 top-full z-30 mt-1 max-h-64 overflow-y-auto rounded-xl border border-graphite/14 bg-white p-1 shadow-[0_24px_46px_-28px_rgba(47,75,68,0.65)]">
              {hasSuggestions
                ? suggestions.map((customer, index) => (
                    <button
                      key={customer.key}
                      type="button"
                      onMouseDown={(event) => {
                        event.preventDefault();
                        applySuggestion(customer);
                      }}
                      className={`w-full rounded-lg px-2.5 py-2 text-left transition ${
                        index === activeIndex
                          ? "bg-mineral/10 text-mineral"
                          : "text-graphite hover:bg-stone/35"
                      }`}
                    >
                      <p className="truncate text-sm font-medium">{customer.name}</p>
                      <p className="truncate text-xs text-graphite/62">
                        {formatCustomerHint(customer)}
                      </p>
                    </button>
                  ))
                : emptyText
                  ? <p className="px-3 py-2 text-xs text-graphite/62">{emptyText}</p>
                  : null}
            </div>
          ) : null}
        </div>

        <PhoneInput
          name="phone"
          required
          label="Phone"
          value={phone}
          onChange={setPhone}
        />
      </div>

      {mode === "order" ? (
        <div className="grid gap-2 sm:grid-cols-2">
          <FloatInput
            name="city"
            required
            label="City"
            value={city}
            onChange={(event) => setCity(event.target.value)}
          />
          <FloatInput
            name="address"
            required
            label="Address"
            value={address}
            onChange={(event) => setAddress(event.target.value)}
          />
        </div>
      ) : null}
    </div>
  );
}
