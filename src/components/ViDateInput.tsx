// Native <input type="date"> paints MM/DD/YYYY when the browser/OS is en-US,
// even if <html lang="vi">. We keep the ISO value (yyyy-mm-dd) for the API and
// paint DD/MM/YYYY ourselves so Vietnamese users always see the right order.
import * as React from "react";
import { cn } from "@/lib/utils";

const DISPLAY = new Intl.DateTimeFormat("vi-VN", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

/** "2026-09-18" → "18/09/2026" (vi-VN). Empty / bad → "". */
export function formatIsoDateVi(iso: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return "";
  return DISPLAY.format(new Date(iso + "T00:00:00"));
}

type ViDateInputProps = Omit<
  React.ComponentProps<"input">,
  "type" | "value" | "onChange"
> & {
  /** yyyy-mm-dd — same shape native date inputs and the booking API use. */
  value: string;
  onChange: (isoDate: string) => void;
};

export function ViDateInput({
  value,
  onChange,
  className,
  min,
  max,
  disabled,
  required,
  id,
  name,
  "aria-label": ariaLabel,
  ...rest
}: ViDateInputProps) {
  const display = formatIsoDateVi(value);

  return (
    <div
      className={cn(
        "relative focus-within:border-gold",
        disabled && "cursor-not-allowed opacity-50",
        className,
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "pointer-events-none block",
          display ? "text-foreground" : "text-muted-foreground",
        )}
      >
        {display || "dd/mm/yyyy"}
      </span>
      <input
        {...rest}
        id={id}
        name={name}
        type="date"
        lang="vi"
        required={required}
        disabled={disabled}
        min={min}
        max={max}
        value={value}
        aria-label={ariaLabel}
        onChange={(e) => onChange(e.target.value)}
        className="absolute inset-0 cursor-pointer opacity-0 disabled:cursor-not-allowed"
      />
    </div>
  );
}
