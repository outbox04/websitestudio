import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { StatusPill } from "@/components/ui/StatusPill";
import { useAppStore } from "@/store/useAppStore";

export function IntegrationStatusCard() {
  const integrations = useAppStore((s) => s.integrations);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Kết nối hệ thống</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {integrations.map((it) => (
          <div
            key={it.id}
            className="flex items-center justify-between rounded-xl border border-border bg-navy-soft/40 px-4 py-3"
          >
            <div>
              <p className="text-sm font-medium text-ink">{it.label}</p>
              <p className="text-xs text-ink-faint">{it.detail}</p>
            </div>
            <StatusPill label="" state={it.state} className="px-2" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
