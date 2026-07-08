"use client";

import { cn } from "@/lib/utils";

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
  placeholder?: string;
}

export function PhoneInput({ value, onChange, error, disabled, placeholder }: PhoneInputProps) {
  return (
    <div className="space-y-1.5">
      <div className="flex">
        <div className="flex items-center justify-center px-3 border border-r-0 border-input rounded-l-md bg-muted text-sm text-muted-foreground">
          +91
        </div>
        <input
          type="tel"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={10}
          aria-label="Phone number"
          value={value}
          onChange={(e) => {
            const val = e.target.value.replace(/\D/g, "").slice(0, 10);
            onChange(val);
          }}
          disabled={disabled}
          placeholder={placeholder || "9876543210"}
          className={cn(
            "flex h-10 w-full rounded-r-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
            error && "border-destructive"
          )}
        />
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
