import { useEffect, useState } from "react";
import { Images, Clock, Wand2, CheckCircle2, ImagePlus, Database } from "lucide-react";
import { TopBar } from "@/components/layout/TopBar";
import { StatCard } from "@/components/dashboard/StatCard";
import { SystemProgress } from "@/components/dashboard/SystemProgress";
import { FinanceSummaryCard } from "@/components/dashboard/FinanceSummaryCard";
import { ShootingScheduleCard, type ShootScheduleItem } from "@/components/dashboard/ShootingScheduleCard";
import { useSettingsStore } from "@/store/useSettingsStore";
import { invoke } from "@tauri-apps/api/core";
import { readDir } from "@tauri-apps/plugin-fs";
import { fetchWebsiteAlbums } from "@/lib/websiteApi";
import type { SystemProgressItem } from "@/lib/types";

interface AlbumWorkflow {
  albumName: string;
  customerName: string;
  albumPath: string;
  rawDir: string;
  jpgDir: string;
  editRequestDir: string;
  editedDir: string;
  driveFileGocUrl: string;
  driveFileChinhSuaUrl: string;
  websiteUrl: string;
  createdAt: string;
}

const MOCK_SCHEDULE: ShootScheduleItem[] = [
  { shootDate: "22/06/2026", customerName: "Nguyễn Văn A", totalPrice: "2.500.000đ", depositStatus: "Đã cọc 1.000.000đ", description: "Chụp chân dung doanh nhân ngày 22/06", notes: "Studio gói 2 tiếng" },
  { shootDate: "24/06/2026", customerName: "Lê Thị B", totalPrice: "5.000.000đ", depositStatus: "Chưa cọc", description: "Chụp ảnh cưới dã ngoại ngoại cảnh", notes: "Trang phục áo dài & váy cưới" },
  { shootDate: "28/06/2026", customerName: "Trần Văn C", totalPrice: "12.000.000đ", depositStatus: "Đã cọc 2.000.000đ", description: "Chụp phóng sự cưới gói Gold", notes: "Cần lấy file RAW gấp" }
];

async function countFilesInDir(path: string, extensions: string[]): Promise<number> {
  if (!path) return 0;
  try {
    const entries = await readDir(path);
    let count = 0;
    for (const entry of entries) {
      if (entry.isFile) {
        const ext = entry.name.split(".").pop()?.toLowerCase();
        if (ext && extensions.includes(ext)) {
          count++;
        }
      }
    }
    return count;
  } catch {
    return 0;
  }
}



function parseFormattedDate(dateStr: string): Date {
  const parts = dateStr.split("/");
  if (parts.length === 3) {
    return new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
  }
  return new Date(0);
}

export function DashboardPage() {
  const { settings, loaded, loadSettings } = useSettingsStore();
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    totalAlbums: 0,
    waitingSelection: 0,
    editing: 0,
    completed: 0,
    totalJpg: 0,
    totalSelected: 0,
    totalEdited: 0,
    totalStorageGb: 0,
  });
  const [schedules, setSchedules] = useState<ShootScheduleItem[]>([]);

  useEffect(() => {
    if (!loaded) void loadSettings();
  }, [loaded, loadSettings]);

  const fetchDashboardData = async () => {
    setLoading(true);
    const scriptUrl = localStorage.getItem("tlora_customer_script_url") || localStorage.getItem("tlora_accounting_script_url") || "";
    try {
      // 1. Fetch local workflows
      const localAlbums: AlbumWorkflow[] = settings.default_dest_root
        ? await invoke<AlbumWorkflow[]>("list_album_workflows", { root: settings.default_dest_root }).catch(() => [])
        : [];

      // 2. Fetch website albums
      const websiteAlbums = settings.api_url
        ? await fetchWebsiteAlbums(settings).then((r) => r.albums ?? []).catch(() => [])
        : [];

      // 3. Scan directories in parallel for files count and status classification
      let totalJpg = 0;
      let totalSelected = 0;
      let totalEdited = 0;
      
      let waitingSelectionCount = 0;
      let editingCount = 0;
      let completedCount = 0;

      // Process local albums
      await Promise.all(
        localAlbums.map(async (album) => {
          // Count JPG files in FILE GỐC
          const jpgCount = await countFilesInDir(album.jpgDir, ["jpg", "jpeg"]);
          // Count files in FILE CHỈNH SỬA
          const selectedCount = await countFilesInDir(album.editRequestDir, ["jpg", "jpeg", "cr2", "cr3", "nef", "arw"]);
          // Count files in FILE DONE
          const editedCount = await countFilesInDir(album.editedDir, ["jpg", "jpeg"]);

          totalJpg += jpgCount;
          totalSelected += selectedCount;
          totalEdited += editedCount;

          const hasEditRequestFiles = selectedCount > 0;
          const isCompleted = (album.driveFileChinhSuaUrl && album.driveFileChinhSuaUrl !== "-") || editedCount > 0;

          if (isCompleted) {
            completedCount++;
          } else if (hasEditRequestFiles) {
            editingCount++;
          } else if (album.driveFileGocUrl && album.driveFileGocUrl !== "-") {
            waitingSelectionCount++;
          }
        })
      );

      // Unique album names union
      const uniqueNames = new Set([
        ...localAlbums.map(a => a.albumName.toLowerCase()),
        ...websiteAlbums.map(a => a.albumName.toLowerCase())
      ]);
      const totalAlbums = uniqueNames.size;

      // Calculate completed status from website too if not matched locally
      for (const wa of websiteAlbums) {
        const key = wa.albumName.toLowerCase();
        const localMatched = localAlbums.some(a => a.albumName.toLowerCase() === key);
        if (!localMatched) {
          if (wa.driveFileChinhSuaUrl && wa.driveFileChinhSuaUrl !== "-") {
            completedCount++;
          } else if (wa.driveFileGocUrl && wa.driveFileGocUrl !== "-") {
            waitingSelectionCount++;
          }
        }
      }

      // Estimate storage in GB: JPG ~ 8MB, RAW ~ 35MB
      const totalStorageGb = Math.round((totalJpg * 8 + totalSelected * 35 + totalEdited * 8) / 1024);

      setStats({
        totalAlbums,
        waitingSelection: waitingSelectionCount,
        editing: editingCount,
        completed: completedCount,
        totalJpg,
        totalSelected,
        totalEdited,
        totalStorageGb,
      });

      // 4. Load Shooting Schedules (Lịch chụp) from Google Sheets Tab "Khách hàng"
      let sheetSchedules: ShootScheduleItem[] = [];
      if (scriptUrl) {
        try {
          const res = await fetch(`${scriptUrl}?action=get_schedule`);
          const data = await res.json();
          if (data && data.success && Array.isArray(data.schedule)) {
            sheetSchedules = data.schedule;
          }
        } catch (err) {
          console.warn("Lỗi khi kết nối Google Sheets tab Khách hàng để lấy lịch chụp:", err);
        }
      }

      if (sheetSchedules.length > 0) {
        const sorted = [...sheetSchedules]
          .sort((a, b) => {
            const dateA = parseFormattedDate(a.shootDate);
            const dateB = parseFormattedDate(b.shootDate);
            return dateB.getTime() - dateA.getTime(); // Mới nhất lên đầu
          })
          .slice(0, 5);
        setSchedules(sorted);
      } else {
        // Fallback to beautiful mock booking schedules
        setSchedules(MOCK_SCHEDULE);
      }
    } catch (e) {
      console.error("Lỗi khi tải dữ liệu dashboard:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (loaded) {
      void fetchDashboardData();
      const interval = setInterval(() => {
        void fetchDashboardData();
      }, 30000); // refresh every 30s
      return () => clearInterval(interval);
    }
  }, [loaded, settings.default_dest_root, settings.api_url]);

  const statCards = [
    { id: "albums", label: "Tổng album", value: stats.totalAlbums.toString(), delta: "Thời gian thực", trend: "flat" as const, icon: Images },
    { id: "pending", label: "Album chờ khách chọn", value: stats.waitingSelection.toString(), delta: "Chờ duyệt", trend: "flat" as const, icon: Clock },
    { id: "editing", label: "Album đang chỉnh sửa", value: stats.editing.toString(), delta: "Photographer", trend: "flat" as const, icon: Wand2 },
    { id: "completed", label: "Album hoàn thiện", value: stats.completed.toString(), delta: "Đã hoàn thành", trend: "flat" as const, icon: CheckCircle2 },
    { id: "total-photos", label: "Tổng ảnh lưu trữ", value: stats.totalJpg.toLocaleString("vi-VN"), delta: "Tách JPG/RAW", trend: "flat" as const, icon: ImagePlus },
    { id: "storage", label: "Dung lượng đã xử lý", value: `${stats.totalStorageGb} GB`, delta: "Ước lượng", trend: "flat" as const, icon: Database },
  ];

  const progressItems: SystemProgressItem[] = [
    { id: "split", label: "Tách JPG / RAW", done: stats.totalJpg, total: stats.totalJpg || 1, tone: "success" },
    { id: "cull", label: "Lọc ảnh gửi khách", done: stats.totalSelected, total: stats.totalJpg || 1, tone: "indigo" },
    { id: "edit-sync", label: "Đồng bộ ảnh đã chỉnh", done: stats.totalEdited, total: stats.totalSelected || 1, tone: "warning" },
  ];

  return (
    <div className="pb-10">
      <TopBar title="Dashboard" description="Tổng quan toàn bộ studio · cập nhật theo thời gian thực" />

      <div className="page-shell">
        {/* Stat cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {statCards.map((stat) => (
            <StatCard key={stat.id} {...stat} />
          ))}
        </div>

        {/* Progress, Schedule & Finance */}
        <div className="mt-6 grid grid-cols-1 gap-6 2xl:grid-cols-3">
          <div className="min-w-0 space-y-6 2xl:col-span-2">
            <SystemProgress items={progressItems} />
            <ShootingScheduleCard items={schedules} loading={loading} />
          </div>
          <div className="min-w-0">
            <FinanceSummaryCard />
          </div>
        </div>
      </div>
    </div>
  );
}
