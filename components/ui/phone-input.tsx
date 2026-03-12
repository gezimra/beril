"use client";

import { useId, useMemo, useState } from "react";

import { cn } from "@/lib/utils/cn";

type PhoneCountry = {
  iso2: string;
  name: string;
  flag: string;
  dialCode: string;
};

const phoneCountryOptions: PhoneCountry[] = [
  { iso2: "XK", name: "Kosovo", flag: "🇽🇰", dialCode: "383" },
  { iso2: "AL", name: "Albania", flag: "🇦🇱", dialCode: "355" },
  { iso2: "MK", name: "North Macedonia", flag: "🇲🇰", dialCode: "389" },
  { iso2: "ME", name: "Montenegro", flag: "🇲🇪", dialCode: "382" },
  { iso2: "RS", name: "Serbia", flag: "🇷🇸", dialCode: "381" },
  { iso2: "DE", name: "Germany", flag: "🇩🇪", dialCode: "49" },
  { iso2: "CH", name: "Switzerland", flag: "🇨🇭", dialCode: "41" },
  { iso2: "AT", name: "Austria", flag: "🇦🇹", dialCode: "43" },
  { iso2: "IT", name: "Italy", flag: "🇮🇹", dialCode: "39" },
  { iso2: "GB", name: "United Kingdom", flag: "🇬🇧", dialCode: "44" },
  { iso2: "US", name: "United States", flag: "🇺🇸", dialCode: "1" },
];

const countriesByIso = new Map(phoneCountryOptions.map((country) => [country.iso2, country]));
const countriesByDialCode = [...phoneCountryOptions].sort(
  (left, right) => right.dialCode.length - left.dialCode.length,
);

function sanitizeLocalPhone(value: string) {
  return value.replace(/\D+/g, "").slice(0, 15);
}

function getValidCountryIso2(iso2: string | undefined) {
  if (iso2 && countriesByIso.has(iso2)) {
    return iso2;
  }
  return "XK";
}

function composePhoneValue(countryIso2: string, localNumber: string) {
  const cleanLocalNumber = sanitizeLocalPhone(localNumber);
  if (!cleanLocalNumber) {
    return "";
  }

  const country = countriesByIso.get(getValidCountryIso2(countryIso2));
  if (!country) {
    return cleanLocalNumber;
  }

  return `+${country.dialCode}${cleanLocalNumber}`;
}

function parsePhoneValue(
  value: string | undefined,
  fallbackCountryIso2: string,
): { countryIso2: string; localNumber: string } {
  const raw = String(value ?? "").trim();
  if (!raw) {
    return {
      countryIso2: getValidCountryIso2(fallbackCountryIso2),
      localNumber: "",
    };
  }

  const digits = sanitizeLocalPhone(raw);
  if (!digits) {
    return {
      countryIso2: getValidCountryIso2(fallbackCountryIso2),
      localNumber: "",
    };
  }

  if (raw.startsWith("+")) {
    for (const country of countriesByDialCode) {
      if (digits.startsWith(country.dialCode)) {
        return {
          countryIso2: country.iso2,
          localNumber: sanitizeLocalPhone(digits.slice(country.dialCode.length)),
        };
      }
    }
  }

  return {
    countryIso2: getValidCountryIso2(fallbackCountryIso2),
    localNumber: digits,
  };
}

type PhoneInputProps = {
  id?: string;
  name?: string;
  label: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  wrapperClassName?: string;
  defaultCountryIso2?: string;
  autoComplete?: string;
  placeholder?: string;
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  onBlur?: () => void;
};

export function PhoneInput({
  id,
  name,
  label,
  required = false,
  disabled = false,
  error,
  wrapperClassName,
  defaultCountryIso2 = "XK",
  autoComplete = "tel",
  placeholder = "44 123 456",
  value,
  defaultValue,
  onChange,
  onBlur,
}: PhoneInputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const resolvedDefaultCountryIso2 = getValidCountryIso2(defaultCountryIso2);
  const initialState = useMemo(
    () => parsePhoneValue(defaultValue, resolvedDefaultCountryIso2),
    [defaultValue, resolvedDefaultCountryIso2],
  );
  const [uncontrolledCountryIso2, setUncontrolledCountryIso2] = useState(initialState.countryIso2);
  const [uncontrolledLocalNumber, setUncontrolledLocalNumber] = useState(initialState.localNumber);
  const [draftCountryIso2, setDraftCountryIso2] = useState(initialState.countryIso2);
  const isControlled = value !== undefined;

  const controlledState = parsePhoneValue(value, draftCountryIso2);
  const currentCountryIso2 = getValidCountryIso2(
    isControlled
      ? controlledState.localNumber.length > 0
        ? controlledState.countryIso2
        : draftCountryIso2
      : uncontrolledCountryIso2,
  );
  const localNumber = isControlled ? controlledState.localNumber : uncontrolledLocalNumber;
  const resolvedPhoneValue = composePhoneValue(currentCountryIso2, localNumber);

  function handlePhoneChange(nextCountryIso2: string, nextLocalNumber: string) {
    const nextValue = composePhoneValue(nextCountryIso2, nextLocalNumber);
    onChange?.(nextValue);
  }

  return (
    <div className={cn("relative", wrapperClassName)}>
      {name ? <input type="hidden" name={name} value={resolvedPhoneValue} /> : null}
      <label
        htmlFor={inputId}
        className="pointer-events-none absolute left-3 top-[0.3rem] text-[0.625rem] uppercase tracking-[0.06em] text-graphite/58"
      >
        {label}
      </label>
      <div className="grid grid-cols-[8.75rem_minmax(0,1fr)] gap-2">
        <select
          value={currentCountryIso2}
          onChange={(event) => {
            const nextCountryIso2 = getValidCountryIso2(event.target.value);
            if (isControlled) {
              setDraftCountryIso2(nextCountryIso2);
            } else {
              setUncontrolledCountryIso2(nextCountryIso2);
            }
            handlePhoneChange(nextCountryIso2, localNumber);
          }}
          className="h-[3.05rem] rounded-[0.5rem] border border-graphite/18 bg-white/85 px-3 pb-[0.45rem] pt-[1.1rem] text-sm text-graphite transition focus:border-gold focus:bg-white focus:outline-none"
          disabled={disabled}
          aria-label={`${label} country code`}
        >
          {phoneCountryOptions.map((country) => (
            <option key={country.iso2} value={country.iso2}>
              {country.flag} +{country.dialCode}
            </option>
          ))}
        </select>
        <input
          id={inputId}
          type="tel"
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete={autoComplete}
          required={required}
          disabled={disabled}
          value={localNumber}
          onChange={(event) => {
            const nextLocalNumber = sanitizeLocalPhone(event.target.value);
            if (isControlled) {
              setDraftCountryIso2(currentCountryIso2);
            } else {
              setUncontrolledLocalNumber(nextLocalNumber);
            }
            handlePhoneChange(currentCountryIso2, nextLocalNumber);
          }}
          onBlur={onBlur}
          className="h-[3.05rem] rounded-[0.5rem] border border-graphite/18 bg-white/85 px-3 pb-[0.45rem] pt-[1.1rem] text-sm text-graphite transition focus:border-gold focus:bg-white focus:outline-none"
          placeholder={placeholder}
        />
      </div>
      {error ? <p className="mt-1 text-xs text-walnut">{error}</p> : null}
    </div>
  );
}
