import { cn } from "@/lib/utils";

const toneClasses = {
  indigo: "bg-indigo",
  purple: "bg-purple",
  success: "bg-success",
  warning: "bg-warning",
} as const;

interface ProgressBarProps {
  value: number; // 0 - 100
  tone?: keyof typeof toneClasses;
  className?: string;
}

export function ProgressBar({ value, tone = "indigo", className }: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, value));
  return (
    <div className={cn("h-1.5 w-full rounded-full bg-white/[0.06] overflow-hidden", className)}>
      <div
        className={cn("h-full rounded-full transition-all duration-500", toneClasses[tone])}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
