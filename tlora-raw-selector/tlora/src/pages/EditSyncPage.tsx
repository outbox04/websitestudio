import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, FileCheck2, Loader2, RefreshCw, UploadCloud } from "lucide-react";
import { invoke } from "@tauri-apps/api/core";
import { TopBar } from "@/components/layout/TopBar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useSettingsStore } from "@/store/useSettingsStore";
import { getValidGoogleToken } from "@/lib/googleDriveAuth";
import {
  fetchWebsiteAlbums,
  fetchWebsiteEditRequest,
  syncEditedUploadToWebsite,
  syncDriveFilesToWebsite,
  syncEditRequestToWebsite,
  type WebsiteAlbumListItem,
} from "@/lib/websiteApi";

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

interface AlbumOption {
  albumName: string;
  customerName: string;
  website?: WebsiteAlbumListItem;
  local?: AlbumWorkflow;
}

interface PrepareEditBatchResult {
  requested: number;
  matched: number;
  copied: number;
  missing: number;
  outputDir: string;
  doneFile: string;
  copiedFiles: string[];
  missingFiles: string[];
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

function normalizeName(value: string) {
  return value.trim().toLowerCase();
}

export function EditSyncPage() {
  const { settings, loaded, loadSettings } = useSettingsStore();
  const [localAlbums, setLocalAlbums] = useState<AlbumWorkflow[]>([]);
  const [websiteAlbums, setWebsiteAlbums] = useState<WebsiteAlbumListItem[]>([]);
  const [selectedAlbumName, setSelectedAlbumName] = useState("");
  const [selectedFilesText, setSelectedFilesText] = useState("");
  const [useJpegFallback, setUseJpegFallback] = useState(true);
  const [busy, setBusy] = useState(false);
  const [loadingAlbums, setLoadingAlbums] = useState(false);
  const [prepareResult, setPrepareResult] = useState<PrepareEditBatchResult | null>(null);
  const [uploadResult, setUploadResult] = useState<UploadDriveFilesResult | null>(null);
  const [error, setError] = useState("");
  const [apiMessage, setApiMessage] = useState("");

  useEffect(() => {
    if (!loaded) void loadSettings();
  }, [loaded, loadSettings]);

  const albumOptions = useMemo<AlbumOption[]>(() => {
    const localByName = new Map(localAlbums.map((album) => [normalizeName(album.albumName), album]));
    const options = websiteAlbums.map((album) => ({
      albumName: album.albumName,
      customerName: album.customerName || album.albumName,
      website: album,
      local: localByName.get(normalizeName(album.albumName)),
    }));

    if (options.length > 0) return options;

    return localAlbums.map((album) => ({
      albumName: album.albumName,
      customerName: album.customerName,
      local: album,
    }));
  }, [localAlbums, websiteAlbums]);

  const selectedOption = useMemo(
    () => albumOptions.find((album) => album.albumName === selectedAlbumName) ?? null,
    [albumOptions, selectedAlbumName],
  );
  const selectedLocalAlbum = selectedOption?.local ?? null;

  const completedWebsiteUrl = useMemo(() => {
    const url = selectedOption?.website?.websiteUrl || selectedLocalAlbum?.websiteUrl || "";
    if (!url || url === "-") return "-";
    return url.endsWith("/") ? `${url}done` : `${url}/done`;
  }, [selectedOption, selectedLocalAlbum]);

  const refreshAlbums = async () => {
    setLoadingAlbums(true);
    setError("");
    try {
      const [localResult, websiteResult] = await Promise.all([
        settings.default_dest_root
          ? invoke<AlbumWorkflow[]>("list_album_workflows", { root: settings.default_dest_root }).catch(() => [])
          : Promise.resolve([]),
        settings.api_url ? fetchWebsiteAlbums(settings).then((result) => result.albums ?? []) : Promise.resolve([]),
      ]);

      setLocalAlbums(localResult);
      setWebsiteAlbums(websiteResult);

      const nextOptions = websiteResult.length
        ? websiteResult.map((album) => album.albumName)
        : localResult.map((album) => album.albumName);
      if ((!selectedAlbumName || !nextOptions.includes(selectedAlbumName)) && nextOptions.length > 0) {
        setSelectedAlbumName(nextOptions[0]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Khong the tai danh sach album tu Website API.");
    } finally {
      setLoadingAlbums(false);
    }
  };

  useEffect(() => {
    if (loaded) void refreshAlbums();
  }, [loaded, settings.default_dest_root, settings.api_url, settings.api_key]);

  useEffect(() => {
    setPrepareResult(null);
    setUploadResult(null);
    setSelectedFilesText("");
    setApiMessage("");
    
    // Auto-fetch if website api is configured
    if (loaded && settings.api_url && selectedAlbumName) {
      void fetchFilesFromWebsite();
    }
  }, [selectedAlbumName, loaded]);

  const fetchFilesFromWebsite = async () => {
    if (!selectedOption || !settings.api_url) return;
    try {
      const editRequest = await fetchWebsiteEditRequest(settings, selectedOption.albumName);
      const files = editRequest.files ?? editRequest.selectedFiles ?? editRequest.selected_files ?? [];
      if (files.length > 0) {
        setSelectedFilesText(files.join("\n"));
      }
    } catch (err) {
      console.warn("Could not fetch edit request from website:", err);
    }
  };

  const handlePrepare = async () => {
    if (!selectedOption) {
      setError("Chon album truoc khi loc anh can chinh.");
      return;
    }
    if (!selectedLocalAlbum) {
      setError("Album nay chua co duong dan local tren may. Hay tach/nhap album nay truoc.");
      return;
    }
    if (!selectedFilesText.trim()) {
      setError("Vui lòng nhập danh sách file cần lọc.");
      return;
    }

    setBusy(true);
    setError("");
    setPrepareResult(null);
    setUploadResult(null);
    setApiMessage("");
    try {
      const result = await invoke<PrepareEditBatchResult>("prepare_edit_batch", {
        payload: {
          albumPath: selectedLocalAlbum.albumPath,
          selectedFilesText: selectedFilesText.trim(),
          useJpegFallback,
        },
      });
      setPrepareResult(result);
      
      if (settings.api_url) {
        await syncEditRequestToWebsite(settings, {
          albumName: selectedOption.albumName,
          customerName: selectedOption.customerName,
          requested: result.requested,
          matched: result.matched,
          missing: result.missing,
          outputDir: result.outputDir,
          doneFile: result.doneFile,
          copiedFiles: result.copiedFiles,
          missingFiles: result.missingFiles,
        });
        setApiMessage("Da lay danh sach tu website va loc file vao FILE CHINH SUA.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Khong the loc anh can chinh.");
    } finally {
      setBusy(false);
    }
  };

  const handleUploadDone = async () => {
    if (!selectedOption) {
      setError("Chon album truoc khi upload FILE DONE.");
      return;
    }
    if (!selectedLocalAlbum) {
      setError("Album nay chua co duong dan FILE DONE tren may.");
      return;
    }
    if (!settings.api_url) {
      setError("Chua cau hinh Website API URL de upload Drive.");
      return;
    }
    if (!settings.google_drive_root_folder_id) {
      setError("Chua cau hinh Google Drive Root Folder ID trong Cai dat.");
      return;
    }

    setBusy(true);
    setError("");
    setUploadResult(null);
    setApiMessage("");
    try {
      const token = await getValidGoogleToken(settings);
      const result = await invoke<UploadDriveFilesResult>("upload_drive_files", {
        payload: {
          albumPath: selectedLocalAlbum.albumPath,
          kind: "edited",
          apiUrl: settings.api_url,
          apiKey: settings.api_key,
          driveAccessToken: token.access_token,
          driveRootFolderId: settings.google_drive_root_folder_id,
        },
      });
      setUploadResult(result);
      if (result.driveFiles.length > 0) {
        await syncDriveFilesToWebsite(settings, {
          albumName: selectedOption.albumName,
          kind: "edited",
          files: result.driveFiles.map((file) => ({
            driveFileId: file.driveFileId,
            fileName: file.fileName,
            thumbnailUrl: file.thumbnailUrl,
            previewUrl: file.previewUrl,
            downloadUrl: file.downloadUrl,
          })),
        });
      }
      await syncEditedUploadToWebsite(settings, {
        albumName: selectedOption.albumName,
        customerName: selectedOption.customerName,
        uploaded: result.uploaded,
        skipped: result.failed,
        destinationDir: selectedLocalAlbum.editedDir,
      });
      setApiMessage("Da upload FILE DONE len Drive FILE CHINH SUA va dong bo website.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Khong the upload FILE DONE len Drive.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="pb-20">
      <TopBar
        title="Đồng bộ ảnh chỉnh sửa"
        description="Danh sách album lấy từ Website API/Supabase; app tự ghép đường dẫn local khi album đã được tách trên máy"
      />
      <div className="px-8 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Chọn album</CardTitle>
            <Button variant="outline" size="sm" onClick={() => void refreshAlbums()} disabled={loadingAlbums}>
              <RefreshCw className="h-4 w-4" />
              Làm mới
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {albumOptions.length > 0 ? (
              <select
                value={selectedAlbumName}
                onChange={(e) => setSelectedAlbumName(e.target.value)}
                className="h-10 w-full rounded-xl border border-border bg-navy-soft px-3.5 text-sm text-ink outline-none"
              >
                {albumOptions.map((album) => (
                  <option key={album.albumName} value={album.albumName}>
                    {album.albumName}
                  </option>
                ))}
              </select>
            ) : (
              <div className="rounded-xl border border-border bg-navy-soft/40 p-4 text-sm text-ink-muted">
                Chưa tải được danh sách album.
              </div>
            )}

            {selectedOption ? (
              <div className="grid gap-3 text-sm text-ink-muted md:grid-cols-2">
                <PathInfo label="Link website hoàn thiện" value={completedWebsiteUrl} />
                <PathInfo label="Link website" value={selectedOption.website?.websiteUrl || selectedLocalAlbum?.websiteUrl || "-"} />
                <PathInfo label="FILE GỐC" value={selectedLocalAlbum?.jpgDir || "Chưa có đường dẫn local"} />
                <PathInfo label="FILE RAW" value={selectedLocalAlbum?.rawDir || "Chưa có đường dẫn local"} />
                <PathInfo label="FILE CHỈNH SỬA" value={selectedLocalAlbum?.editRequestDir || "Chưa có đường dẫn local"} />
                <PathInfo label="FILE DONE" value={selectedLocalAlbum?.editedDir || "Chưa có đường dẫn local"} />
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Lọc ảnh cần chỉnh</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs text-ink-muted font-medium">Danh sách tên file khách chọn chỉnh sửa (mỗi dòng một file)</label>
              <textarea
                placeholder="Ví dụ:&#10;_DSC1234&#10;_DSC5678"
                className="w-full h-36 rounded-xl border border-border bg-navy-soft px-3 py-2 text-xs text-ink outline-none font-mono placeholder:text-ink-faint focus:border-brand/40 transition"
                value={selectedFilesText}
                onChange={(e) => setSelectedFilesText(e.target.value)}
              />
              <p className="text-[11px] text-ink-faint">
                Dán danh sách file khách gửi hoặc danh sách được tải tự động từ website. Ứng dụng sẽ tìm các file RAW gốc tương ứng trong FILE RAW và tự động copy sang FILE CHỈNH SỬA.
              </p>
            </div>

            <label className="flex items-center gap-3 rounded-xl border border-border bg-navy-soft/40 px-3.5 py-3 text-sm text-ink-muted cursor-pointer">
              <input
                type="checkbox"
                checked={useJpegFallback}
                onChange={(event) => setUseJpegFallback(event.target.checked)}
                className="h-4 w-4 accent-brand cursor-pointer"
              />
              <span>Nếu không có RAW thì copy JPG từ FILE GỐC</span>
            </label>

            <Button onClick={() => void handlePrepare()} disabled={busy || !selectedOption || !selectedLocalAlbum || !selectedFilesText.trim()} className="w-full">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileCheck2 className="h-4 w-4" />}
              Lọc file vào thư mục FILE CHỈNH SỬA
            </Button>

            {prepareResult ? (
              <div className="rounded-xl border border-success/30 bg-success/10 p-4 text-sm text-ink-muted">
                <div className="flex items-center gap-2 font-semibold text-success">
                  <CheckCircle2 className="h-4 w-4" />
                  Đã chuẩn bị file cần chỉnh
                </div>
                <div className="mt-2">
                  Yêu cầu: {prepareResult.requested} - Tìm thấy: {prepareResult.matched} - Copy mới: {prepareResult.copied} - Thiếu: {prepareResult.missing}
                </div>
                <div className="break-all mt-1">Thư mục đích: {prepareResult.outputDir}</div>
                {prepareResult.missingFiles.length > 0 ? (
                  <div className="mt-2 text-warning font-medium">Thiếu các file sau: {prepareResult.missingFiles.join(", ")}</div>
                ) : null}
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Upload FILE DONE</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-xl border border-border bg-navy-soft/40 p-3 text-sm text-ink-muted">
              <div className="font-semibold text-ink">Nguồn upload</div>
              <div className="break-all">{selectedLocalAlbum?.editedDir || "Album này chưa có đường dẫn FILE DONE trên máy"}</div>
            </div>

            <Button onClick={() => void handleUploadDone()} disabled={busy || !selectedOption || !selectedLocalAlbum} className="w-full">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}
              Upload JPG trong FILE DONE lên Drive FILE CHỈNH SỬA
            </Button>

            {uploadResult ? (
              <div className="rounded-xl border border-success/30 bg-success/10 p-4 text-sm text-ink-muted">
                <div className="flex items-center gap-2 font-semibold text-success">
                  <CheckCircle2 className="h-4 w-4" />
                  Upload hoàn tất
                </div>
                <div className="mt-2">Đã upload: {uploadResult.uploaded} - Lỗi: {uploadResult.failed}</div>
                <div className="break-all">Nguồn: {uploadResult.sourceDir}</div>
                {uploadResult.errors.length > 0 ? <div className="mt-2 text-warning">{uploadResult.errors.join(" | ")}</div> : null}
              </div>
            ) : null}

            {apiMessage ? <div className="rounded-xl border border-border bg-navy-soft/40 p-3 text-sm text-ink-muted">{apiMessage}</div> : null}
            {error ? <div className="rounded-xl border border-danger/30 bg-danger/10 p-3 text-sm text-danger">{error}</div> : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function PathInfo({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-navy-soft/40 p-3">
      <div className="font-semibold text-ink">{label}</div>
      <div className="break-all">{value}</div>
    </div>
  );
}
