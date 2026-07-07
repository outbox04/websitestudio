import { Calendar, User } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";

export interface ShootScheduleItem {
  shootDate: string;
  customerName: string;
  totalPrice: string;
  depositStatus: string;
  description: string;
  notes: string;
}

interface ShootingScheduleCardProps {
  items: ShootScheduleItem[];
  loading: boolean;
}

export function ShootingScheduleCard({ items, loading }: ShootingScheduleCardProps) {
  const getDepositBadge = (deposit: string) => {
    const d = (deposit || "").toLowerCase();
    if (!d || d.includes("chưa cọc") || d.includes("chưa thanh toán") || d === "chưa") {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-danger/15 px-2.5 py-0.5 text-xs font-medium text-danger">
          Chưa cọc
        </span>
      );
    }
    
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-success/15 px-2.5 py-0.5 text-xs font-medium text-success">
        {deposit}
      </span>
    );
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-brand" />
          Danh sách lịch chụp (Từ bảng tính Khách hàng)
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex h-32 items-center justify-center text-sm text-ink-muted">
            Đang tải lịch chụp...
          </div>
        ) : items.length === 0 ? (
          <div className="flex h-32 items-center justify-center text-sm text-ink-muted">
            Chưa có lịch chụp nào được ghi nhận từ Google Sheet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm text-ink-muted">
              <thead>
                <tr className="border-b border-border text-xs uppercase tracking-wider text-ink-faint">
                  <th className="pb-3 pr-4 font-semibold">Ngày chụp</th>
                  <th className="pb-3 px-4 font-semibold">Khách hàng</th>
                  <th className="pb-3 px-4 font-semibold">Giá gói</th>
                  <th className="pb-3 px-4 font-semibold">Đã cọc</th>
                  <th className="pb-3 px-4 font-semibold">Nội dung chụp</th>
                  <th className="pb-3 pl-4 font-semibold text-right">Ghi chú</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {items.map((item, idx) => (
                  <tr key={idx} className="hover:bg-navy-soft/20 transition-colors">
                    <td className="py-3 pr-4 font-medium text-ink whitespace-nowrap">
                      {item.shootDate}
                    </td>
                    <td className="py-3 px-4 text-ink flex items-center gap-1.5 whitespace-nowrap">
                      <User className="h-3.5 w-3.5 text-ink-muted" />
                      {item.customerName}
                    </td>
                    <td className="py-3 px-4 text-ink font-semibold whitespace-nowrap">
                      {item.totalPrice || "-"}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      {getDepositBadge(item.depositStatus)}
                    </td>
                    <td className="py-3 px-4 text-ink-muted">
                      {item.description}
                    </td>
                    <td className="py-3 pl-4 text-right text-xs text-ink-faint">
                      {item.notes || "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
