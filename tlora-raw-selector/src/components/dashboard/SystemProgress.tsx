import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import type { SystemProgressItem } from "@/lib/types";

const ITEMS: SystemProgressItem[] = [
  { id: "split", label: "Tách JPG / RAW", done: 18420, total: 18420, tone: "success" },
  { id: "cull", label: "Lọc ảnh gửi khách", done: 14310, total: 18420, tone: "indigo" },
  { id: "edit-sync", label: "Đồng bộ ảnh đã chỉnh", done: 612, total: 842, tone: "warning" },
];

interface SystemProgressProps {
  items?: SystemProgressItem[];
}

export function SystemProgress({ items = ITEMS }: SystemProgressProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Tiến trình tổng hệ thống</CardTitle>
        <span className="text-xs text-ink-faint">Cập nhật mỗi 30 giây</span>
      </CardHeader>
      <CardContent className="space-y-4">
        {items.map((item) => {
          const pct = Math.round((item.done / item.total) * 100);
          return (
            <div key={item.id}>
              <div className="mb-1.5 flex items-center justify-between text-sm">
                <span className="text-ink">{item.label}</span>
                <span className="num-stat text-ink-faint">
                  {item.done.toLocaleString("vi-VN")} / {item.total.toLocaleString("vi-VN")}
                  <span className="ml-2 text-ink-muted">{pct}%</span>
                </span>
              </div>
              <ProgressBar value={pct} tone={item.tone} />
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
