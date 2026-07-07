import { cn } from "@/lib/utils";

interface SettingsFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  hint?: string;
  action?: React.ReactNode;
}

export function SettingsField({ label, hint, action, className, ...props }: SettingsFieldProps) {
  return (
    <label className="block space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium text-ink">{label}</span>
        {action}
      </div>
      <input
        className={cn(
          "h-10 w-full rounded-xl border border-border bg-navy-soft px-3.5 text-sm text-ink placeholder:text-ink-faint outline-none",
          className
        )}
        {...props}
      />
      {hint ? <p className="text-xs text-ink-faint">{hint}</p> : null}
    </label>
  );
}
