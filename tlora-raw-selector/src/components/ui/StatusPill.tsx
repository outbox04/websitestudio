import { cn } from "@/lib/utils";
import type { ConnectionState } from "@/lib/types";

const stateConfig: Record<ConnectionState, { dot: string; text: string; label: string }> = {
  connected: { dot: "bg-success", text: "text-ink", label: "Đã kết nối" },
  syncing: { dot: "bg-indigo animate-pulse-dot", text: "text-ink", label: "Đang đồng bộ" },
  error: { dot: "bg-danger", text: "text-danger", label: "Lỗi kết nối" },
  disconnected: { dot: "bg-ink-faint", text: "text-ink-faint", label: "Chưa kết nối" },
};

interface StatusPillProps {
  label: string;
  state: ConnectionState;
  detail?: string;
  className?: string;
}

export function StatusPill({ label, state, detail, className }: StatusPillProps) {
  const cfg = stateConfig[state];
  return (
    <div
      className={cn(
        "flex items-center gap-2.5 rounded-xl border border-border bg-navy-soft/60 px-3 py-1.5",
        className
      )}
      title={detail}
    >
      <span className={cn("h-2 w-2 rounded-full", cfg.dot)} />
      {label ? (
        <div className="flex flex-col leading-none">
          <span className={cn("text-xs font-semibold", cfg.text)}>{label}</span>
          {detail && <span className="text-[11px] text-ink-faint mt-0.5">{detail}</span>}
        </div>
      ) : (
        <span className={cn("text-xs font-semibold", cfg.text)}>{cfg.label}</span>
      )}
    </div>
  );
}
