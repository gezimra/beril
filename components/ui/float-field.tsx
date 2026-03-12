import { useId, type ComponentProps, type ReactNode } from "react";

import { cn } from "@/lib/utils/cn";

type FloatInputProps = ComponentProps<"input"> & {
  label: string;
  wrapperClassName?: string;
  error?: string;
};

export function FloatInput({ label, wrapperClassName, error, ...props }: FloatInputProps) {
  const generatedId = useId();
  const inputId = props.id ?? generatedId;
  return (
    <div className={cn("float-field", wrapperClassName)}>
      <input {...props} id={inputId} placeholder=" " />
      <label htmlFor={inputId}>{label}</label>
      {error ? <p className="mt-1 text-xs text-walnut">{error}</p> : null}
    </div>
  );
}

type FloatTextareaProps = ComponentProps<"textarea"> & {
  label: string;
  wrapperClassName?: string;
  error?: string;
};

export function FloatTextarea({ label, wrapperClassName, error, ...props }: FloatTextareaProps) {
  const generatedId = useId();
  const textareaId = props.id ?? generatedId;
  return (
    <div className={cn("float-field", wrapperClassName)}>
      <textarea {...props} id={textareaId} placeholder=" " />
      <label htmlFor={textareaId}>{label}</label>
      {error ? <p className="mt-1 text-xs text-walnut">{error}</p> : null}
    </div>
  );
}

type FloatSelectProps = ComponentProps<"select"> & {
  label: string;
  wrapperClassName?: string;
  error?: string;
  children: ReactNode;
};

export function FloatSelect({
  label,
  wrapperClassName,
  error,
  children,
  ...props
}: FloatSelectProps) {
  const generatedId = useId();
  const selectId = props.id ?? generatedId;
  return (
    <div className={cn("float-field", wrapperClassName)}>
      <select {...props} id={selectId}>{children}</select>
      <label htmlFor={selectId}>{label}</label>
      {error ? <p className="mt-1 text-xs text-walnut">{error}</p> : null}
    </div>
  );
}
