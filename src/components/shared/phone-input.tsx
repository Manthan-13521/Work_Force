import { cn } from "@/lib/utils";

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
  id?: string;
  placeholder?: string;
}

export function PhoneInput({
  value,
  onChange,
  error,
  disabled,
  id = "phone",
  placeholder = "Enter phone number",
}: PhoneInputProps) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-sm font-medium text-foreground">
        Phone Number
      </label>
      <div className="relative">
        <div className="flex rounded-lg shadow-sm transition-all duration-200 focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
          <span
            className={cn(
              "inline-flex items-center rounded-l-lg border border-r-0 bg-muted px-3 text-sm font-medium text-muted-foreground",
              error ? "border-destructive" : "border-input"
            )}
          >
            +91
          </span>
          <input
            id={id}
            type="tel"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={10}
            placeholder={placeholder}
            disabled={disabled}
            value={value}
            onChange={(e) => {
              const digits = e.target.value.replace(/\D/g, "").slice(0, 10);
              onChange(digits);
            }}
            className={cn(
              "block w-full rounded-r-lg border bg-background px-3 py-2 text-sm ring-offset-background",
              "placeholder:text-muted-foreground/60",
              "transition-all duration-200",
              "focus:outline-none",
              "disabled:cursor-not-allowed disabled:opacity-50",
              error ? "border-destructive" : "border-input"
            )}
            aria-invalid={error ? "true" : undefined}
            aria-describedby={error ? `${id}-error` : undefined}
          />
        </div>
      </div>
      {error && (
        <p id={`${id}-error`} className="text-xs text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
