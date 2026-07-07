import { NavLink } from "react-router-dom";
import {
  LayoutGrid,
  HardDrive,
  Images,
  RefreshCw,
  Wallet,
  Users,
  Settings,
  PanelLeftClose,
  PanelLeftOpen,
  Aperture,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/useAppStore";

const NAV_ITEMS = [
  { to: "/", label: "Dashboard", icon: LayoutGrid },
  { to: "/nhap-the-nho", label: "Nhập dữ liệu thẻ nhớ", icon: HardDrive },
  { to: "/album-khach-hang", label: "Album khách hàng", icon: Images },
  { to: "/dong-bo-chinh-sua", label: "Đồng bộ ảnh chỉnh sửa", icon: RefreshCw },
  { to: "/ke-toan", label: "Kế toán Studio", icon: Wallet },
  { to: "/khach-hang", label: "Khách hàng", icon: Users },
  { to: "/cai-dat", label: "Cài đặt", icon: Settings },
];

export function Sidebar() {
  const { sidebarCollapsed, toggleSidebar } = useAppStore();

  return (
    <aside
      className={cn(
        "glass-panel flex h-full flex-col shrink-0 transition-[width] duration-200",
        sidebarCollapsed ? "w-[76px]" : "w-[252px]"
      )}
    >
      {/* Brand */}
      <div className="flex items-center gap-3 px-4 py-5">
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand-gradient shadow-glow">
          <Aperture className="h-5 w-5 text-white" strokeWidth={2.5} />
        </div>
        {!sidebarCollapsed && (
          <div className="leading-tight">
            <p className="text-sm font-semibold tracking-wide">TLORA</p>
            <p className="text-xs text-ink-faint">RAW Selector</p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1 px-3">
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) =>
              cn(
                "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-indigo-soft text-ink"
                  : "text-ink-muted hover:bg-navy-soft hover:text-ink"
              )
            }
          >
            {({ isActive }) => (
              <>
                <span
                  className={cn(
                    "absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-full bg-brand-gradient transition-opacity",
                    isActive ? "opacity-100" : "opacity-0"
                  )}
                />
                <Icon className="h-[18px] w-[18px] shrink-0" strokeWidth={2} />
                {!sidebarCollapsed && <span className="truncate">{label}</span>}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Collapse toggle */}
      <div className="border-t border-border p-3">
        <button
          onClick={toggleSidebar}
          className="flex w-full items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm text-ink-faint transition-colors hover:bg-navy-soft hover:text-ink-muted"
        >
          {sidebarCollapsed ? (
            <PanelLeftOpen className="h-[18px] w-[18px]" />
          ) : (
            <>
              <PanelLeftClose className="h-[18px] w-[18px]" />
              <span>Thu gọn</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
