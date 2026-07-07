import { useEffect, useState } from "react";
import { CheckCircle2, FolderOpen, HardDrive, Link2, Loader2, RefreshCw, UploadCloud } from "lucide-react";
import { invoke } from "@tauri-apps/api/core";
import { TopBar } from "@/components/layout/TopBar";
import { listen } from "@tauri-apps/api/event";
import { open } from "@tauri-apps/plugin-dialog";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { getValidGoogleToken } from "@/lib/googleDriveAuth";
import { syncAlbumToWebsite, syncDriveFilesToWebsite } from "@/lib/websiteApi";
import { useSettingsStore } from "@/store/useSettingsStore";

interface DriveInfo {
  path: string;
  label: string;
  has_dcim: boolean;
}

interface ScanResult {
  path: string;
  brand: string;
  folders: string[];
  jpg_count: number;
  raw_count: number;
  total_size: number;
  first_date?: string | null;
  last_date?: string | null;
}

interface SplitProgress {
  current: number;
  total: number;
  file_name: string;
}

interface SplitResult {
  album_name: string;
  album_path: string;
  jpg_count: number;
  raw_count: number;
  skipped: number;
}

interface DriveSyncLinks {
  raw: string;
  edited: string;
  website: string;
}

interface UploadDriveFilesResult {
  uploaded: number;
  failed: number;
  sourceDir: string;
  files: string[];
  driveFiles: Array<{
    driveFileId: string;
    fileName: string;
    thumbnailUrl?: string;
    previewUrl?: string;
    downloadUrl?: string;
  }>;
  errors: string[];
}

type NoticeType = "warning" | "error" | "success";

interface NoticeState {
  type: NoticeType;
  message: string;
}

const getInvokeErrorMessage = (err: unknown, fallback: string) => {
  if (typeof err === "string") return err;
  if (err instanceof Error) return err.message;
  return fallback;
};

const getCardNoticeType = (message: string): NoticeType => {
  const normalized = message.toLowerCase();
  if (
    normalized.includes("dcim") ||
    normalized.includes("khong tim thay") ||
    normalized.includes("không tìm thấy") ||
    normalized.includes("khong doc duoc") ||
    normalized.includes("không đọc được") ||
    normalized.includes("chưa cho app đọc")
  ) {
    return "warning";
  }
  return "error";
};

export function CardImportPage() {
  const { settings, loaded, loadSettings } = useSettingsStore();
  const [drives, setDrives] = useState<DriveInfo[]>([]);
  const [selectedDrive, setSelectedDrive] = useState("");
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [splitResult, setSplitResult] = useState<SplitResult | null>(null);
  const [driveLinks, setDriveLinks] = useState<DriveSyncLinks | null>(null);
  const [progress, setProgress] = useState<SplitProgress | null>(null);
  const [loading, setLoading] = useState(false);
  const [syncingWebsite, setSyncingWebsite] = useState(false);
  const [uploadingRaw, setUploadingRaw] = useState(false);
  const [rawUploadResult, setRawUploadResult] = useState<UploadDriveFilesResult | null>(null);
  const [notice, setNotice] = useState<NoticeState | null>(null);
  const [websiteSyncMessage, setWebsiteSyncMessage] = useState("");
  const [destRoot, setDestRoot] = useState("");
  const [customerName, setCustomerName] = useState("");

  const getTodayFormatted = () => {
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, "0");
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const yyyy = today.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  };

  const [shootDate, setShootDate] = useState(getTodayFormatted());

  useEffect(() => {
    if (!loaded) void loadSettings();
  }, [loaded, loadSettings]);

  useEffect(() => {
    if (loaded && !destRoot && settings.default_dest_root) {
      setDestRoot(settings.default_dest_root);
    }
  }, [loaded, settings.default_dest_root, destRoot]);

  const refreshDrives = async () => {
    try {
      const discovered = await invoke<DriveInfo[]>("list_drives");
      setDrives(discovered);
      if (!selectedDrive && discovered.length > 0) {
        setSelectedDrive(discovered[0].path);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    void refreshDrives();
    const interval = window.setInterval(() => {
      void refreshDrives();
    }, 5000);

    let unlisten: (() => void) | undefined;
    void listen<SplitProgress>("split-progress", (event) => {
      setProgress(event.payload);
    }).then((fn) => {
      unlisten = fn;
    });

    return () => {
      window.clearInterval(interval);
      if (unlisten) unlisten();
    };
  }, [selectedDrive]);

  const handleScan = async () => {
    if (!selectedDrive) return;
    setLoading(true);
    setNotice(null);
    setSplitResult(null);
    setDriveLinks(null);
    setRawUploadResult(null);
    setWebsiteSyncMessage("");
    setProgress(null);
    setScanResult(null);
    try {
      const result = await invoke<ScanResult>("scan_card", { path: selectedDrive });
      setScanResult(result);
      if (result.first_date) {
        setShootDate(result.first_date);
      }
    } catch (err) {
      const message = getInvokeErrorMessage(err, "Không thể đọc thẻ này.");
      setNotice({ type: getCardNoticeType(message), message });
    } finally {
      setLoading(false);
    }
  };

  const handleChooseDestination = async () => {
    const selected = await open({ directory: true, multiple: false, title: "Chọn thư mục lưu album" });
    if (typeof selected === "string") setDestRoot(selected);
  };

  const handleSplit = async () => {
    const targetRoot = destRoot || settings.default_dest_root;

    if (!selectedDrive || !targetRoot) {
      setNotice({ type: "warning", message: "Vui lòng vào Cài đặt chọn thư mục lưu album mặc định trước khi tách ảnh." });
      return;
    }
    if (!customerName.trim()) {
      setNotice({ type: "warning", message: "Vui lòng nhập tên khách hàng để app tạo thư mục theo dạng TÊN_DD.MM." });
      return;
    }

    setLoading(true);
    setNotice(null);
    setProgress(null);
    setDriveLinks(null);
    setRawUploadResult(null);

    let backendShootDate = shootDate;
    const parts = shootDate.split("/");
    if (parts.length === 3) {
      backendShootDate = `${parts[2].trim()}-${parts[1].trim()}-${parts[0].trim()}`;
    }

    try {
      const result = await invoke<SplitResult>("split_card", {
        options: {
          source: selectedDrive,
          destRoot: targetRoot,
          customerName,
          shootDate: backendShootDate,
        },
      });
      setSplitResult(result);
      setProgress(null);
      setNotice({
        type: "success",
        message: `Đã tách xong album ${result.album_name}: FILE GỐC ${result.jpg_count}, FILE RAW ${result.raw_count}. Bạn có thể tiếp tục ở Album khách hàng nếu thoát màn này.`,
      });
      if (settings.api_url) {
        const links = await syncAlbumToWebsiteForSplit(result);
        setDriveLinks(links);
        setWebsiteSyncMessage("Đã tự tạo thư mục Drive và đồng bộ album lên Website API.");
      }
    } catch (err) {
      setNotice({ type: "error", message: getInvokeErrorMessage(err, "Không thể tách ảnh từ thẻ.") });
    } finally {
      setLoading(false);
    }
  };

  const syncAlbumToWebsiteForSplit = async (result: SplitResult) => {
    const album = await invoke<{
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
    }>("update_album_links", {
      payload: {
        albumPath: result.album_path,
        driveFileGocUrl: "",
        driveFileChinhSuaUrl: "",
        websiteUrl: "",
      },
    });

    const synced = await syncAlbumToWebsite(settings, {
      albumName: album.albumName,
      customerName: album.customerName,
      albumPath: album.albumPath,
      rawDir: album.rawDir,
      jpgDir: album.jpgDir,
      editRequestDir: album.editRequestDir,
      editedDir: album.editedDir,
      driveFileGocUrl: album.driveFileGocUrl,
      driveFileChinhSuaUrl: album.driveFileChinhSuaUrl,
      websiteUrl: album.websiteUrl,
      createdAt: album.createdAt,
    });

    const links = {
      raw: synced.driveFileGocUrl || "",
      edited: synced.driveFileChinhSuaUrl || "",
      website: synced.websiteUrl || "",
    };

    await invoke("update_album_links", {
      payload: {
        albumPath: result.album_path,
        driveFileGocUrl: links.raw,
        driveFileChinhSuaUrl: links.edited,
        websiteUrl: links.website,
      },
    });

    return links;
  };

  const handleUploadFileGoc = async () => {
    if (!splitResult) return;
    if (!settings.api_url) {
      setNotice({ type: "warning", message: "Vui lòng cấu hình Website API URL trong Cài đặt để upload FILE GỐC lên Drive." });
      return;
    }
    if (!settings.google_drive_root_folder_id) {
      setNotice({ type: "warning", message: "Vui lòng cấu hình Google Drive Root Folder ID trong Cài đặt." });
      return;
    }

    setUploadingRaw(true);
    setNotice(null);
    setRawUploadResult(null);
    try {
      if (!driveLinks) {
        await handleMockDriveSync();
      }
      const token = await getValidGoogleToken(settings);
      const result = await invoke<UploadDriveFilesResult>("upload_drive_files", {
        payload: {
          albumPath: splitResult.album_path,
          kind: "raw",
          apiUrl: settings.api_url,
          apiKey: settings.api_key,
          driveAccessToken: token.access_token,
          driveRootFolderId: settings.google_drive_root_folder_id,
        },
      });
      if (result.driveFiles.length > 0) {
        await syncDriveFilesToWebsite(settings, {
          albumName: splitResult.album_name,
          kind: "raw",
          files: result.driveFiles.map((file) => ({
            driveFileId: file.driveFileId,
            fileName: file.fileName,
            thumbnailUrl: file.thumbnailUrl,
            previewUrl: file.previewUrl,
            downloadUrl: file.downloadUrl,
          })),
        });
      }
      setRawUploadResult(result);
      setWebsiteSyncMessage(`Đã upload ${result.uploaded} ảnh FILE GỐC lên Drive.`);
    } catch (err) {
      setNotice({ type: "error", message: getInvokeErrorMessage(err, "Không thể upload FILE GỐC lên Drive.") });
    } finally {
      setUploadingRaw(false);
    }
  };

  const handleOpenFileGoc = async () => {
    if (!splitResult) return;
    try {
      await invoke("open_path", { path: `${splitResult.album_path}\\FILE GỐC` });
    } catch (err) {
      setNotice({ type: "error", message: getInvokeErrorMessage(err, "Không thể mở thư mục FILE GỐC.") });
    }
  };

  const handleMockDriveSync = async () => {
    if (!splitResult) return;
    if (!settings.api_url) {
      setNotice({ type: "warning", message: "Vui lòng cấu hình Website API URL trong Cài đặt để tạo thư mục Drive và lấy link gửi khách." });
      return;
    }

    setSyncingWebsite(true);
    setNotice(null);
    setWebsiteSyncMessage("");
    try {
      const album = await invoke<{
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
      }>("update_album_links", {
        payload: {
          albumPath: splitResult.album_path,
          driveFileGocUrl: "",
          driveFileChinhSuaUrl: "",
          websiteUrl: "",
        },
      });

      const synced = await syncAlbumToWebsite(settings, {
        albumName: album.albumName,
        customerName: album.customerName,
        albumPath: album.albumPath,
        rawDir: album.rawDir,
        jpgDir: album.jpgDir,
        editRequestDir: album.editRequestDir,
        editedDir: album.editedDir,
        driveFileGocUrl: album.driveFileGocUrl,
        driveFileChinhSuaUrl: album.driveFileChinhSuaUrl,
        websiteUrl: album.websiteUrl,
        createdAt: album.createdAt,
      });

      const links = {
        raw: synced.driveFileGocUrl || "",
        edited: synced.driveFileChinhSuaUrl || "",
        website: synced.websiteUrl || "",
      };

      await invoke("update_album_links", {
        payload: {
          albumPath: splitResult.album_path,
          driveFileGocUrl: links.raw,
          driveFileChinhSuaUrl: links.edited,
          websiteUrl: links.website,
        },
      });

      setDriveLinks(links);
      setWebsiteSyncMessage("Đã tạo thư mục Drive và đồng bộ album lên Website API.");
    } catch (err) {
      setNotice({ type: "error", message: getInvokeErrorMessage(err, "Không thể đồng bộ thông tin album lên website.") });
    } finally {
      setSyncingWebsite(false);
    }
  };

  return (
    <div className="pb-20">
      <TopBar
        title="Nhập dữ liệu thẻ nhớ"
        description="Tách file gốc và RAW theo album. App tạo thư mục theo năm chụp, đặt tên album dạng TÊN KHÁCH HÀNG_DD.MM, rồi copy JPG vào FILE GỐC và RAW vào FILE RAW."
      />
      <div className="px-8 space-y-6">
        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <Card>
            <CardHeader>
              <CardTitle>Thiết bị phát hiện</CardTitle>
              <Button variant="outline" size="sm" onClick={() => void refreshDrives()} disabled={loading}>
                <RefreshCw className="h-4 w-4" />
                Quét lại
              </Button>
            </CardHeader>
          <CardContent className="space-y-4">
            {drives.length === 0 ? (
              <p className="text-sm text-ink-muted">Chưa phát hiện ổ đĩa nào. Hãy cắm thẻ nhớ và quét lại.</p>
            ) : (
              <div className="space-y-3">
                {drives.map((drive) => (
                  <button
                    key={drive.path}
                    type="button"
                    onClick={() => {
                      setSelectedDrive(drive.path);
                      setScanResult(null);
                      setSplitResult(null);
                      setDriveLinks(null);
                      setNotice(
                        drive.has_dcim
                          ? null
                          : {
                              type: "warning",
                              message: "Ổ này chưa thấy thư mục DCIM. Nếu đây là thẻ nhớ, hãy chọn đúng thư mục gốc của thẻ hoặc kiểm tra lại đầu đọc.",
                            },
                      );
                    }}
                    className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left transition ${
                      selectedDrive === drive.path ? "border-brand bg-brand/10" : "border-border-strong/60 bg-surface"
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <HardDrive className="h-5 w-5 text-brand" />
                      <span>
                        <span className="block font-medium text-ink">{drive.label}</span>
                        <span className="text-sm text-ink-muted">{drive.path}</span>
                      </span>
                    </span>
                    <span className={`rounded-full px-2.5 py-1 text-xs ${drive.has_dcim ? "bg-success/15 text-success" : "bg-warning/15 text-warning"}`}>
                      {drive.has_dcim ? "Có DCIM" : "Không có DCIM"}
                    </span>
                  </button>
                ))}
              </div>
            )}

            <Button onClick={() => void handleScan()} disabled={loading || !selectedDrive} className="w-full">
              {loading ? "Đang quét..." : "Quét thư mục DCIM"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Thông tin thẻ nhớ</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {notice ? (
              <div
                className={`rounded-xl border p-3 text-sm ${
                  notice.type === "success"
                    ? "border-success/30 bg-success/10 text-success"
                    : notice.type === "warning"
                      ? "border-warning/30 bg-warning/10 text-warning"
                      : "border-danger/30 bg-danger/10 text-danger"
                }`}
              >
                {notice.message}
              </div>
            ) : null}
            {scanResult ? (
              <div className="space-y-3 text-sm text-ink-muted">
                <div className="rounded-2xl border border-border-strong/60 bg-surface p-4">
                  <div className="font-semibold text-ink">{scanResult.brand}</div>
                  <div>Đường dẫn: {scanResult.path}</div>
                  <div>Thư mục DCIM: {scanResult.folders.join(", ") || "Không có"}</div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-border-strong/60 bg-surface p-4">
                    <div className="text-xs uppercase tracking-[0.25em] text-ink-muted">JPG</div>
                    <div className="mt-1 text-2xl font-semibold text-ink">{scanResult.jpg_count}</div>
                  </div>
                  <div className="rounded-2xl border border-border-strong/60 bg-surface p-4">
                    <div className="text-xs uppercase tracking-[0.25em] text-ink-muted">RAW</div>
                    <div className="mt-1 text-2xl font-semibold text-ink">{scanResult.raw_count}</div>
                  </div>
                </div>
                <div className="rounded-2xl border border-border-strong/60 bg-surface p-4">
                  <div>Dung lượng: {(scanResult.total_size / 1024 / 1024).toFixed(2)} MB</div>
                  <div>Ngày đầu: {scanResult.first_date ?? "-"}</div>
                  <div>Ngày cuối: {scanResult.last_date ?? "-"}</div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-ink-muted">Chọn một ổ đĩa rồi bấm quét để đọc dữ liệu ảnh trong DCIM.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tách ảnh vào thư mục khách hàng</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2 text-sm text-ink-muted">
              <span>Tên khách hàng</span>
              <input className="w-full rounded-2xl border border-border-strong/60 bg-surface px-3 py-2 text-ink" value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
            </label>
            <label className="space-y-2 text-sm text-ink-muted">
              <span>Ngày chụp</span>
              <input
                type="text"
                placeholder="dd/mm/yyyy"
                className="w-full rounded-2xl border border-border-strong/60 bg-surface px-3 py-2 text-ink"
                value={shootDate}
                onChange={(e) => setShootDate(e.target.value)}
              />
            </label>
            <label className="space-y-2 text-sm text-ink-muted">
              <span>Thư mục lưu mặc định</span>
              <div className="flex gap-2">
                <input
                  className="flex-1 rounded-2xl border border-border-strong/60 bg-surface px-3 py-2 text-ink"
                  value={destRoot || settings.default_dest_root}
                  placeholder="Chưa cấu hình trong Cài đặt"
                  readOnly
                />
                <Button type="button" variant="outline" onClick={() => void handleChooseDestination()}>
                  <FolderOpen className="h-4 w-4" />
                  Đổi
                </Button>
              </div>
            </label>
          </div>

          <Button onClick={() => void handleSplit()} disabled={loading || !selectedDrive || !(destRoot || settings.default_dest_root)} className="w-full">
            {loading ? "Đang tách..." : "Tách vào FILE GỐC / FILE RAW"}
          </Button>

          {progress ? (
            <div className="rounded-2xl border border-border-strong/60 bg-surface p-4 text-sm text-ink-muted">
              Đang xử lý {progress.current}/{progress.total}: {progress.file_name}
            </div>
          ) : null}

          {splitResult ? (
            <div className="space-y-4 rounded-2xl border border-border-strong/60 bg-surface p-4 text-sm text-ink-muted">
              <div>
                <div className="font-semibold text-ink">Album đã tạo: {splitResult.album_name}</div>
                <div>Đường dẫn: {splitResult.album_path}</div>
                <div>FILE GỐC: {splitResult.jpg_count} - FILE RAW: {splitResult.raw_count} - Bỏ qua: {splitResult.skipped}</div>
              </div>
              <Button type="button" variant="outline" onClick={() => void handleMockDriveSync()} disabled={syncingWebsite} className="w-full">
                {syncingWebsite ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}
                Tạo Drive album / lấy link gửi khách
              </Button>
              <div className="rounded-xl border border-border bg-navy-soft/40 p-3 text-sm text-ink-muted">
                Kiểm tra và lọc lại thủ công trong FILE GỐC trước khi upload lên Drive.
              </div>
              <Button type="button" variant="outline" onClick={() => void handleOpenFileGoc()} className="w-full">
                <FolderOpen className="h-4 w-4" />
                Mở FILE GỐC để kiểm tra
              </Button>
              <Button type="button" onClick={() => void handleUploadFileGoc()} disabled={uploadingRaw || syncingWebsite} className="w-full">
                {uploadingRaw ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}
                Upload FILE GỐC lên Drive
              </Button>
              {driveLinks ? (
                <div className="space-y-2 rounded-xl border border-success/30 bg-success/10 p-3">
                  <div className="flex items-center gap-2 font-semibold text-success">
                    <CheckCircle2 className="h-4 w-4" />
                    Đã tạo thông tin đồng bộ
                  </div>
                  <div className="flex items-start gap-2 break-all"><Link2 className="mt-0.5 h-4 w-4 shrink-0" />Drive FILE GỐC: {driveLinks.raw}</div>
                  <div className="flex items-start gap-2 break-all"><Link2 className="mt-0.5 h-4 w-4 shrink-0" />Drive FILE CHỈNH SỬA: {driveLinks.edited}</div>
                  <div className="flex items-start gap-2 break-all"><Link2 className="mt-0.5 h-4 w-4 shrink-0" />Link website gửi khách: {driveLinks.website}</div>
                  {websiteSyncMessage ? <div className="pt-1 text-success">{websiteSyncMessage}</div> : null}
                </div>
              ) : null}
              {rawUploadResult ? (
                <div className="space-y-2 rounded-xl border border-success/30 bg-success/10 p-3">
                  <div className="flex items-center gap-2 font-semibold text-success">
                    <CheckCircle2 className="h-4 w-4" />
                    Đã upload FILE GỐC
                  </div>
                  <div>Đã upload: {rawUploadResult.uploaded} - Lỗi: {rawUploadResult.failed}</div>
                  <div className="break-all">Nguồn: {rawUploadResult.sourceDir}</div>
                  {rawUploadResult.errors.length > 0 ? <div className="text-warning">{rawUploadResult.errors.join(" | ")}</div> : null}
                </div>
              ) : null}
            </div>
          ) : null}
        </CardContent>
      </Card>
      </div>
    </div>
  );
}
