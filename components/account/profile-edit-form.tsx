"use client";

import { useActionState, useState } from "react";
import { customerUpdateProfileAction } from "@/app/(public)/account/actions";
import { Button } from "@/components/ui/button";
import type { CustomerCheckoutProfile } from "@/lib/db/customer-account";

interface ProfileEditFormProps {
  profile: CustomerCheckoutProfile;
}

const initialState = { error: undefined, success: false };

const inputClass =
  "block w-full rounded-lg border border-graphite/18 bg-white/80 px-3 py-2 text-sm text-graphite placeholder:text-graphite/40 focus:outline-none focus:ring-1 focus:ring-graphite/30";

export function ProfileEditForm({ profile }: ProfileEditFormProps) {
  const [state, action, pending] = useActionState(customerUpdateProfileAction, initialState);

  const [values, setValues] = useState({
    customerName: profile.customerName ?? "",
    phone: profile.phone ?? "",
    city: profile.city ?? "",
    country: profile.country ?? "Kosovo",
    address: profile.address ?? "",
  });

  const isDirty =
    values.customerName !== (profile.customerName ?? "") ||
    values.phone !== (profile.phone ?? "") ||
    values.city !== (profile.city ?? "") ||
    values.country !== (profile.country ?? "Kosovo") ||
    values.address !== (profile.address ?? "");

  const set =
    (field: keyof typeof values) => (e: React.ChangeEvent<HTMLInputElement>) =>
      setValues((prev) => ({ ...prev, [field]: e.target.value }));

  return (
    <form action={action} className="mt-5 space-y-4">
      {state.success ? (
        <p className="rounded-lg bg-mineral/10 px-3 py-2 text-sm text-mineral">
          Profile updated successfully.
        </p>
      ) : null}
      {state.error ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{state.error}</p>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="space-y-1.5">
          <span className="text-xs uppercase tracking-[0.12em] text-graphite/65">Full Name</span>
          <input
            name="customerName"
            type="text"
            value={values.customerName}
            onChange={set("customerName")}
            required
            minLength={2}
            className={inputClass}
          />
        </label>
        <label className="space-y-1.5">
          <span className="text-xs uppercase tracking-[0.12em] text-graphite/65">Phone</span>
          <input
            name="phone"
            type="tel"
            value={values.phone}
            onChange={set("phone")}
            className={inputClass}
          />
        </label>
        <label className="space-y-1.5">
          <span className="text-xs uppercase tracking-[0.12em] text-graphite/65">City</span>
          <input
            name="city"
            type="text"
            value={values.city}
            onChange={set("city")}
            className={inputClass}
          />
        </label>
        <label className="space-y-1.5">
          <span className="text-xs uppercase tracking-[0.12em] text-graphite/65">Country</span>
          <input
            name="country"
            type="text"
            value={values.country}
            onChange={set("country")}
            className={inputClass}
          />
        </label>
      </div>
      <label className="block space-y-1.5">
        <span className="text-xs uppercase tracking-[0.12em] text-graphite/65">Address</span>
        <input
          name="address"
          type="text"
          value={values.address}
          onChange={set("address")}
          className={inputClass}
        />
      </label>

      <Button type="submit" disabled={pending || !isDirty} className="h-10">
        {pending ? "Saving..." : "Save Changes"}
      </Button>
    </form>
  );
}
