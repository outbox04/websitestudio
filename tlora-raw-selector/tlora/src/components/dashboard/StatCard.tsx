import { type LucideIcon, ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string;
  delta?: string;
  trend?: "up" | "down" | "flat";
  icon: LucideIcon;
}

const trendConfig = {
  up: { icon: ArrowUpRight, className: "text-success" },
  down: { icon: ArrowDownRight, className: "text-danger" },
  flat: { icon: Minus, className: "text-ink-faint" },
};

export function StatCard({ label, value, delta, trend = "flat", icon: Icon }: StatCardProps) {
  const TrendIcon = trendConfig[trend].icon;

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <p className="text-sm font-medium text-ink-muted">{label}</p>
        <div className="grid h-9 w-9 place-items-center rounded-lg bg-navy-soft">
          <Icon className="h-[18px] w-[18px] text-ink-muted" strokeWidth={2} />
        </div>
      </div>
      <p className="num-stat mt-3 text-3xl font-semibold">{value}</p>
      {delta && (
        <div className={cn("mt-2 flex items-center gap-1 text-xs font-medium", trendConfig[trend].className)}>
          <TrendIcon className="h-3.5 w-3.5" />
          <span>{delta}</span>
        </div>
      )}
    </Card>
  );
}
