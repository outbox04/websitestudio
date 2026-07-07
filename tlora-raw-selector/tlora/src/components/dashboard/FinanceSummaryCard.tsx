import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

interface Transaction {
  type: string;
  category: string;
  amount: number;
}

const MOCK_TRANSACTIONS: Transaction[] = [
  { type: "Thu", category: "Thuê chụp ảnh", amount: 3500000 },
  { type: "Chi", category: "Chi tiêu khác", amount: 150000 },
  { type: "Góp vốn", category: "Góp vốn hiện vật (Mua đồ)", amount: 12000000 },
  { type: "Thu", category: "Đặt cọc", amount: 1000000 },
  { type: "Góp vốn", category: "Góp vốn tiền mặt", amount: 5000000 },
  { type: "Chi", category: "Marketing/Ads", amount: 2000000 },
  { type: "Thu", category: "Thuê chụp ảnh", amount: 4500000 },
  { type: "Chi", category: "Thuê váy/Studio", amount: 1200000 },
  { type: "Chi", category: "Mua thiết bị", amount: 3200000 },
  { type: "Thu", category: "Thuê váy/đồ", amount: 1500000 }
];

export function FinanceSummaryCard() {
  const [loading, setLoading] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isUsingMock, setIsUsingMock] = useState(true);
  
  const scriptUrl = localStorage.getItem("tlora_accounting_script_url") || "";
  const initialBalance = Number(localStorage.getItem("tlora_accounting_initial_balance")) || 0;

  const loadData = async () => {
    if (!scriptUrl) {
      setTransactions(MOCK_TRANSACTIONS);
      setIsUsingMock(true);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(scriptUrl);
      const data = await res.json();
      if (data && data.success && Array.isArray(data.transactions)) {
        setTransactions(data.transactions);
        setIsUsingMock(false);
      } else {
        throw new Error();
      }
    } catch {
      setTransactions(MOCK_TRANSACTIONS);
      setIsUsingMock(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, [scriptUrl]);

  const metrics = useMemo(() => {
    let revenue = 0;
    let expense = 0;
    let cashCapital = 0;
    let assetCapital = 0;

    transactions.forEach((tx) => {
      if (tx.type === "Thu") revenue += tx.amount;
      else if (tx.type === "Chi") expense += tx.amount;
      else if (tx.type === "Góp vốn") {
        if (tx.category === "Góp vốn tiền mặt") cashCapital += tx.amount;
        else assetCapital += tx.amount;
      }
    });

    const netProfit = revenue - expense;
    const cashOnHand = initialBalance + netProfit + cashCapital;

    return {
      revenue,
      expense,
      netProfit,
      cashOnHand,
      cashCapital,
      assetCapital
    };
  }, [transactions, initialBalance]);

  const formatNumber = (num: number) => {
    return num.toLocaleString("vi-VN") + "đ";
  };

  return (
    <Card className="h-full flex flex-col justify-between">
      <CardHeader>
        <CardTitle className="flex items-center justify-between w-full">
          <span>Tài chính Studio</span>
          {loading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin text-ink-muted" />
          ) : isUsingMock ? (
            <span className="text-[10px] bg-warning/10 text-warning px-2 py-0.5 rounded-full font-medium">Dữ liệu mẫu</span>
          ) : (
            <span className="text-[10px] bg-success/10 text-success px-2 py-0.5 rounded-full font-medium">Đã liên kết</span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 flex-1">
        {/* Main cash on hand metric */}
        <div className="rounded-2xl bg-navy-soft/40 p-4 border border-border/20">
          <p className="text-[10px] uppercase tracking-wider text-ink-muted font-medium">Tiền lưu động (Quỹ)</p>
          <h4 className="text-2xl font-bold text-ink mt-1">{formatNumber(metrics.cashOnHand)}</h4>
        </div>

        {/* Revenue & Expenses side-by-side */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-navy-soft/20 p-3 border border-border/10">
            <span className="text-[9px] uppercase text-ink-muted block font-medium">Doanh thu (Thu)</span>
            <span className="text-sm font-bold text-success mt-1 block">{formatNumber(metrics.revenue)}</span>
          </div>
          <div className="rounded-2xl bg-navy-soft/20 p-3 border border-border/10">
            <span className="text-[9px] uppercase text-ink-muted block font-medium">Chi tiêu (Chi)</span>
            <span className="text-sm font-bold text-danger mt-1 block">{formatNumber(metrics.expense)}</span>
          </div>
        </div>

        {/* Net Profit and Capital Contribution */}
        <div className="space-y-2.5 pt-1">
          <div className="flex justify-between items-center text-xs">
            <span className="text-ink-muted">Lợi nhuận ròng:</span>
            <span className={`font-semibold ${metrics.netProfit >= 0 ? "text-success" : "text-danger"}`}>
              {metrics.netProfit >= 0 ? "+" : ""}{formatNumber(metrics.netProfit)}
            </span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-ink-muted">Vốn góp bằng tiền:</span>
            <span className="font-semibold text-indigo-400">{formatNumber(metrics.cashCapital)}</span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-ink-muted">Góp vốn mua đồ:</span>
            <span className="font-semibold text-orange-400">{formatNumber(metrics.assetCapital)}</span>
          </div>
        </div>
      </CardContent>

      <div className="px-5 pb-5 pt-0">
        <Link to="/ke-toan">
          <Button variant="subtle" className="w-full text-xs h-9 justify-center gap-1">
            Ghi sổ & Chi tiết
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </Link>
      </div>
    </Card>
  );
}
