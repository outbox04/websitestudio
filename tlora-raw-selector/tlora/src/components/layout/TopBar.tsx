import { StatusPill } from "@/components/ui/StatusPill";
import { useAppStore } from "@/store/useAppStore";

interface TopBarProps {
  title: string;
  description?: string;
  hideStatusPills?: boolean;
}

export function TopBar({ title, description, hideStatusPills = false }: TopBarProps) {
  const integrations = useAppStore((s) => s.integrations);

  return (
    <header className="flex flex-wrap items-center justify-between gap-4 px-8 py-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {description && <p className="mt-1 text-sm text-ink-muted">{description}</p>}
      </div>

      {!hideStatusPills && (
        <div className="flex items-center gap-2">
          {integrations.map((it) => (
            <StatusPill key={it.id} label={it.label} state={it.state} detail={it.detail} />
          ))}
        </div>
      )}
    </header>
  );
}
