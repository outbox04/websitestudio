import { useEffect, useState } from "react";
import { CheckCircle2, ExternalLink, FolderOpen, Loader2, RefreshCw, UploadCloud } from "lucide-react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { useNavigate } from "react-router-dom";
import { TopBar } from "@/components/layout/TopBar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useSettingsStore } from "@/store/useSettingsStore";
import { getValidGoogleToken } from "@/lib/googleDriveAuth";
import { syncAlbumToWebsite, syncDriveFilesToWebsite } from "@/lib/websiteApi";

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

interface UploadDriveFilesProgress {
  albumPath: string;
  kind: string;
  current: number;
  total: number;
  uploaded: number;
  failed: number;
  fileName: string;
  status: string;
}

function errorMessage(err: unknown, fallback: string) {
  if (typeof err === "string") return err;
  if (err instanceof Error) return err.message;
  return fallback;
}

export function CustomerAlbumsPage() {
  const { settings, loaded, loadSettings } = useSettingsStore();
  const navigate = useNavigate();
  const [albums, setAlbums] = useState<AlbumWorkflow[]>([]);
  const [loading, setLoading] = useState(false);
  const [busyAlbum, setBusyAlbum] = useState("");
  const [uploadProgress, setUploadProgress] = useState<Record<string, UploadDriveFilesProgress>>({});
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!loaded) void loadSettings();
  }, [loaded, loadSettings]);

  useEffect(() => {
    let unlisten: (() => void) | undefined;
    void listen<UploadDriveFilesProgress>("drive-upload-progress", (event) => {
      setUploadProgress((prev) => ({
        ...prev,
        [event.payload.albumPath]: event.payload,
      }));
    }).then((fn) => {
      unlisten = fn;
    });

    return () => {
      if (unlisten) unlisten();
    };
  }, []);

  const refreshAlbums = async () => {
    if (!settings.default_dest_root) return;
    setLoading(true);
    setError("");
    try {
      const result = await invoke<AlbumWorkflow[]>("list_album_workflows", { root: settings.default_dest_root });
      setAlbums(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Khong the doc danh sach album da tach.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (loaded) void refreshAlbums();
  }, [loaded, settings.default_dest_root]);

  const openPath = async (path: string) => {
    try {
      await invoke("open_path", { path });
    } catch (err) {
      setError(errorMessage(err, "Khong the mo thu muc."));
    }
  };

  const ensureAlbumOnWebsite = async (album: AlbumWorkflow) => {
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

    const updatedAlbum = await invoke<AlbumWorkflow>("update_album_links", {
      payload: {
        albumPath: album.albumPath,
        driveFileGocUrl: synced.driveFileGocUrl || album.driveFileGocUrl,
        driveFileChinhSuaUrl: synced.driveFileChinhSuaUrl || album.driveFileChinhSuaUrl,
        websiteUrl: synced.websiteUrl || album.websiteUrl,
      },
    });

    setAlbums((prev) => prev.map((item) => (item.albumPath === updatedAlbum.albumPath ? updatedAlbum : item)));
    return updatedAlbum;
  };

  const uploadFileGoc = async (album: AlbumWorkflow) => {
    if (!settings.api_url) {
      setError("Chua cau hinh Website API URL de upload FILE GOC.");
      return;
    }
    if (!settings.google_drive_root_folder_id) {
      setError("Chua cau hinh Google Drive Root Folder ID trong Cai dat.");
      return;
    }

    setBusyAlbum(album.albumPath);
    setUploadProgress((prev) => {
      const next = { ...prev };
      delete next[album.albumPath];
      return next;
    });
    setMessage("");
    setError("");
    try {
      const syncedAlbum = await ensureAlbumOnWebsite(album);
      const token = await getValidGoogleToken(settings);
      const result = await invoke<UploadDriveFilesResult>("upload_drive_files", {
        payload: {
          albumPath: syncedAlbum.albumPath,
          kind: "raw",
          apiUrl: settings.api_url,
          apiKey: settings.api_key,
          driveAccessToken: token.access_token,
          driveRootFolderId: settings.google_drive_root_folder_id,
        },
      });
      if (result.driveFiles.length > 0) {
        await syncDriveFilesToWebsite(settings, {
          albumName: syncedAlbum.albumName,
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
      setMessage(`Da upload FILE GOC cho ${syncedAlbum.albumName}: ${result.uploaded} file, loi ${result.failed}.`);
      if (result.errors.length > 0) {
        setError(result.errors.join(" | "));
      }
    } catch (err) {
      setError(errorMessage(err, "Khong the upload FILE GOC."));
    } finally {
      setBusyAlbum("");
    }
  };

  return (
    <div className="pb-20">
      <TopBar
        title="Album khách hàng"
        description="Quản lý tiếp các album đã tách: kiểm tra FILE GỐC, upload Drive, mở FILE DONE và chuyển sang đồng bộ chỉnh sửa"
      />
      <div className="px-8 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Album đã tách trên máy</CardTitle>
            <Button variant="outline" size="sm" onClick={() => void refreshAlbums()} disabled={loading || !settings.default_dest_root}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              Làm mới
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {!settings.default_dest_root ? (
              <div className="rounded-xl border border-warning/30 bg-warning/10 p-3 text-sm text-warning">
                Chưa có thư mục lưu trữ mặc định. Vào Cài đặt để chọn thư mục gốc trước.
              </div>
            ) : null}

            {message ? (
              <div className="flex items-center gap-2 rounded-xl border border-success/30 bg-success/10 p-3 text-sm text-success">
                <CheckCircle2 className="h-4 w-4" />
                {message}
              </div>
            ) : null}
            {error ? <div className="rounded-xl border border-danger/30 bg-danger/10 p-3 text-sm text-danger">{error}</div> : null}

            {albums.length === 0 ? (
              <div className="rounded-xl border border-border bg-navy-soft/40 p-4 text-sm text-ink-muted">
                Chưa tìm thấy album đã tách. Sau khi nhập dữ liệu từ thẻ nhớ, album sẽ xuất hiện ở đây để tiếp tục các bước còn lại.
              </div>
            ) : (
              <div className="grid gap-4 xl:grid-cols-2">
                {albums.map((album) => (
                  <AlbumCard
                    key={album.albumPath}
                    album={album}
                    busy={busyAlbum === album.albumPath}
                    progress={uploadProgress[album.albumPath]}
                    onOpen={openPath}
                    onUpload={uploadFileGoc}
                    onEditSync={() => navigate("/dong-bo-chinh-sua")}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function AlbumCard({
  album,
  busy,
  progress,
  onOpen,
  onUpload,
  onEditSync,
}: {
  album: AlbumWorkflow;
  busy: boolean;
  progress?: UploadDriveFilesProgress;
  onOpen: (path: string) => void | Promise<void>;
  onUpload: (album: AlbumWorkflow) => void | Promise<void>;
  onEditSync: () => void;
}) {
  const percent = progress?.total ? Math.round((progress.current / progress.total) * 100) : 0;
  const completedUrl = album.websiteUrl && album.websiteUrl !== "-"
    ? (album.websiteUrl.endsWith("/") ? `${album.websiteUrl}done` : `${album.websiteUrl}/done`)
    : "";

  return (
    <div className="rounded-2xl border border-border bg-navy-soft/40 p-4 text-sm text-ink-muted">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-base font-semibold text-ink">{album.albumName}</div>
          <div>{album.customerName || "Khách hàng"}</div>
        </div>
        <Button variant="ghost" size="sm" onClick={() => void onOpen(album.albumPath)}>
          <ExternalLink className="h-4 w-4" />
        </Button>
      </div>

      <div className="mt-3 space-y-1 break-all">
        <div><span className="font-semibold text-ink-muted">Album:</span> {album.albumPath}</div>
        <div><span className="font-semibold text-ink-muted">FILE GỐC:</span> {album.jpgDir}</div>
        <div><span className="font-semibold text-ink-muted">FILE CHỈNH SỬA:</span> {album.editRequestDir || "Chưa tạo"}</div>
        <div><span className="font-semibold text-ink-muted">FILE DONE:</span> {album.editedDir}</div>
        
        {album.websiteUrl && album.websiteUrl !== "-" && (
          <div className="mt-2 flex items-center gap-1.5">
            <span className="font-semibold text-ink-muted">Link gửi khách chọn ảnh:</span>
            <a
              href={album.websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand hover:underline flex items-center gap-1"
            >
              {album.websiteUrl} <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        )}
        
        {completedUrl && (
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-ink-muted">Link gửi khách hoàn thiện:</span>
            <a
              href={completedUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-success hover:underline flex items-center gap-1"
            >
              {completedUrl} <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        )}
      </div>

      {progress ? (
        <div className="mt-4 rounded-xl border border-border bg-surface/60 p-3">
          <div className="flex items-center justify-between gap-3 text-xs text-ink-muted">
            <span className="truncate">
              {progress.status === "uploading" ? "Đang upload" : progress.status === "uploaded" ? "Đã xong" : "Lỗi"}: {progress.fileName}
            </span>
            <span className="shrink-0">
              {progress.current}/{progress.total}
            </span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-navy-soft">
            <div className="h-full rounded-full bg-brand-gradient transition-all" style={{ width: `${percent}%` }} />
          </div>
          <div className="mt-2 text-xs text-ink-muted">
            Thành công: {progress.uploaded} - Lỗi: {progress.failed} - {percent}%
          </div>
        </div>
      ) : null}

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <Button variant="outline" size="sm" onClick={() => void onOpen(album.jpgDir)}>
          <FolderOpen className="h-4 w-4" />
          Mở FILE GỐC
        </Button>
        <Button size="sm" onClick={() => void onUpload(album)} disabled={busy}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}
          Upload FILE GỐC
        </Button>
        <Button variant="outline" size="sm" onClick={() => void onOpen(album.editRequestDir)} disabled={!album.editRequestDir}>
          <FolderOpen className="h-4 w-4" />
          Mở FILE CHỈNH SỬA
        </Button>
        <Button variant="outline" size="sm" onClick={() => void onOpen(album.editedDir)}>
          <FolderOpen className="h-4 w-4" />
          Mở FILE DONE
        </Button>
        <Button variant="subtle" size="sm" onClick={onEditSync} className="sm:col-span-2">
          <RefreshCw className="h-4 w-4" />
          Đồng bộ chỉnh sửa
        </Button>
      </div>
    </div>
  );
}
