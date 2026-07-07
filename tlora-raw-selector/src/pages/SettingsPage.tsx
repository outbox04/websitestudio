import { useEffect, useRef, useState } from "react";
import { open } from "@tauri-apps/plugin-dialog";
import { openUrl } from "@tauri-apps/plugin-opener";
import { listen } from "@tauri-apps/api/event";
import { CheckCircle2, ChevronDown, Eye, EyeOff, FolderOpen, Loader2, LogIn, LogOut, Save, XCircle } from "lucide-react";
import { TopBar } from "@/components/layout/TopBar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { SettingsField } from "@/components/ui/SettingsField";
import { Toggle } from "@/components/ui/Toggle";
import { useSettingsStore } from "@/store/useSettingsStore";
import {
  buildGoogleAuthUrl,
  clearStoredGoogleToken,
  ensureTloraDriveFolder,
  exchangeGoogleCode,
  fetchGoogleDriveAccount,
  googleRedirectUri,
  hasBuiltInGoogleOAuthCredentials,
  hasGoogleOAuthCredentials,
} from "@/lib/googleDriveAuth";
import { cn } from "@/lib/utils";

type TestState = "idle" | "testing" | "ok" | "fail";

interface TestResult {
  state: TestState;
  message: string;
}

interface GoogleDriveOAuthCallbackPayload {
  code?: string;
  error?: string;
  error_description?: string;
  state?: string;
}

function TestBadge({ r }: { r: TestResult }) {
  if (r.state === "idle") return null;
  if (r.state === "testing") {
    return (
      <span className="flex items-center gap-1.5 text-xs text-ink-muted">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        Đang kiểm tra...
      </span>
    );
  }
  if (r.state === "ok") {
    return (
      <span className="flex items-center gap-1.5 text-xs text-success">
        <CheckCircle2 className="h-3.5 w-3.5" />
        {r.message}
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1.5 text-xs text-danger">
      <XCircle className="h-3.5 w-3.5" />
      {r.message}
    </span>
  );
}

function useReveal() {
  const [show, setShow] = useState(false);
  return { type: show ? "text" : "password", toggle: () => setShow((v) => !v), Icon: show ? EyeOff : Eye };
}

function parseDriveFolderId(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";

  const folderMatch = trimmed.match(/\/folders\/([a-zA-Z0-9_-]+)/);
  if (folderMatch?.[1]) return folderMatch[1];

  try {
    const url = new URL(trimmed);
    const id = url.searchParams.get("id");
    if (id) return id;
  } catch {
    // Plain folder IDs are accepted as-is.
  }

  return trimmed;
}

export function SettingsPage() {
  const { settings, loaded, saving, loadSettings, saveSettings } = useSettingsStore();
  const [local, setLocal] = useState(settings);
  const [dirty, setDirty] = useState(false);
  const [saveOk, setSaveOk] = useState(false);
  const [driveTest, setDriveTest] = useState<TestResult>({ state: "idle", message: "" });
  const [showDriveAdvanced, setShowDriveAdvanced] = useState(false);
  const driveSecret = useReveal();
  const driveOAuthIsBuiltIn = hasBuiltInGoogleOAuthCredentials();
  const latestSettingsRef = useRef(local);

  useEffect(() => {
    if (!loaded) void loadSettings();
  }, [loaded, loadSettings]);

  useEffect(() => {
    setLocal(settings);
  }, [settings]);

  useEffect(() => {
    latestSettingsRef.current = local;
  }, [local]);

  useEffect(() => {
    if (!loaded) return;

    let active = true;
    let unlisten: (() => void) | undefined;
    void listen<GoogleDriveOAuthCallbackPayload>("google-drive-oauth-callback", (event) => {
      if (!active) return;
      const payload = event.payload;
      if (payload.error) {
        setDriveTest({ state: "fail", message: payload.error_description || payload.error });
        return;
      }
      if (!payload.code) {
        setDriveTest({ state: "fail", message: "Google khong tra ve authorization code." });
        return;
      }

      setDriveTest({ state: "testing", message: "Dang xac thuc Google Drive..." });
      void exchangeGoogleCode(latestSettingsRef.current, payload.code, payload.state ?? null)
        .then(async (token) => {
          const [folder, account] = await Promise.all([
            ensureTloraDriveFolder(latestSettingsRef.current),
            fetchGoogleDriveAccount(token.access_token).catch(() => null),
          ]);
          const next = {
            ...latestSettingsRef.current,
            google_drive_root_folder_id: folder.id,
            google_drive_account_email: account?.email || account?.name || "",
          };
          latestSettingsRef.current = next;
          setLocal(next);
          setDirty(false);
          void saveSettings(next);
          setDriveTest({ state: "ok", message: `Da ket noi Drive: ${account?.email || folder.name}` });
        })
        .catch((e) => setDriveTest({ state: "fail", message: e instanceof Error ? e.message : String(e) }));
    }).then((cleanup) => {
      if (!active) {
        cleanup();
      } else {
        unlisten = cleanup;
      }
    });

    return () => {
      active = false;
      if (unlisten) unlisten();
    };
  }, [loaded]);

  function patch<K extends keyof typeof local>(key: K, value: (typeof local)[K]) {
    setLocal((p) => ({ ...p, [key]: value }));
    setDirty(true);
    setSaveOk(false);
  }

  async function handleSave() {
    const next = {
      ...local,
      google_drive_root_folder_id: parseDriveFolderId(local.google_drive_root_folder_id),
    };
    await saveSettings(next);
    setLocal(next);
    setDirty(false);
    setSaveOk(true);
    window.setTimeout(() => setSaveOk(false), 3000);
  }

  async function pickFolder() {
    const selected = await open({ directory: true, multiple: false, title: "Chọn thư mục lưu album" });
    if (typeof selected === "string") patch("default_dest_root", selected);
  }

  async function handleGoogleLogin() {
    try {
      if (!hasGoogleOAuthCredentials(local)) {
        setShowDriveAdvanced(true);
        throw new Error("Bản app chưa có cấu hình Google Drive. Nhập Client ID trong Cấu hình nâng cao một lần.");
      }
      const next = {
        ...local,
        google_drive_root_folder_id: parseDriveFolderId(local.google_drive_root_folder_id),
      };
      await saveSettings(next);
      setLocal(next);
      setDirty(false);
      await openUrl(await buildGoogleAuthUrl(next));
    } catch (e) {
      setDriveTest({ state: "fail", message: e instanceof Error ? e.message : String(e) });
    }
  }

  async function handleDisconnectDrive() {
    clearStoredGoogleToken();
    const next = {
      ...local,
      google_drive_root_folder_id: "",
      google_drive_account_email: "",
    };
    latestSettingsRef.current = next;
    setLocal(next);
    setDirty(false);
    setDriveTest({ state: "idle", message: "" });
    await saveSettings(next);
  }

  if (!loaded) {
    return (
      <div className="flex h-64 items-center justify-center text-ink-muted">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        Đang tải cài đặt...
      </div>
    );
  }

  return (
    <div className="pb-20">
      <TopBar title="Cài đặt" description="Google Drive và thư mục làm việc" />
      <div className="page-shell space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Google Drive</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-xl border border-border bg-navy-soft/40 px-3.5 py-3 text-sm text-ink-muted">
              App sẽ tự tạo hoặc dùng thư mục <span className="font-medium text-ink">TLORA</span> trong Google Drive của tài khoản đã đăng nhập.
            </div>
            <div className="flex flex-wrap items-center gap-3 pt-1">
              {local.google_drive_root_folder_id ? (
                <>
                  <div className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-success/30 bg-success/10 px-3.5 py-2.5 text-sm text-success">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    <span className="min-w-0 truncate">
                      {local.google_drive_account_email || "Google Drive đã kết nối"}
                    </span>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => void handleDisconnectDrive()} disabled={saving}>
                    <LogOut className="h-3.5 w-3.5" />
                    Ngắt kết nối
                  </Button>
                </>
              ) : null}
              <Button variant="outline" size="sm" onClick={() => void handleGoogleLogin()} disabled={saving} className={local.google_drive_root_folder_id ? "hidden" : undefined}>
                <LogIn className="h-3.5 w-3.5" />
                Kết nối Google Drive
              </Button>
              <TestBadge r={driveTest} />
            </div>

            {driveOAuthIsBuiltIn ? (
              <div className="rounded-xl border border-border bg-navy-soft/40 px-3.5 py-3 text-sm text-ink-muted">
                Google Drive OAuth da duoc cau hinh san.
              </div>
            ) : (
            <div className="rounded-xl border border-border bg-navy-soft/40">
              <button
                type="button"
                onClick={() => setShowDriveAdvanced((value) => !value)}
                className="flex w-full items-center justify-between gap-3 px-3.5 py-3 text-left text-sm font-medium text-ink"
              >
                Cấu hình nâng cao
                <ChevronDown className={cn("h-4 w-4 text-ink-muted transition", showDriveAdvanced ? "rotate-180" : "")} />
              </button>
              {showDriveAdvanced ? (
                <div className="space-y-4 border-t border-border px-3.5 pb-3.5 pt-4">
                  <SettingsField
                    label="Client ID"
                    placeholder="Google OAuth Client ID"
                    value={local.google_drive_client_id}
                    onChange={(e) => patch("google_drive_client_id", e.target.value)}
                  />
                  <SettingsField
                    label="Client Secret"
                    placeholder="Google OAuth Client Secret"
                    value={local.google_drive_client_secret}
                    onChange={(e) => patch("google_drive_client_secret", e.target.value)}
                    type={driveSecret.type}
                    action={
                      <button type="button" onClick={driveSecret.toggle} className="text-ink-faint hover:text-ink">
                        <driveSecret.Icon className="h-4 w-4" />
                      </button>
                    }
                  />
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-ink">Redirect URI</label>
                    <div className="rounded-xl border border-border bg-navy-soft px-3.5 py-2 text-sm text-ink">{googleRedirectUri()}</div>
                  </div>
                </div>
              ) : null}
            </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Thư mục mặc định</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-ink">Thư mục gốc lưu trữ khách hàng</label>
              <div className="flex gap-2">
                <input
                  readOnly
                  value={local.default_dest_root}
                  placeholder="Chưa chọn..."
                  className="h-10 flex-1 rounded-xl border border-border bg-navy-soft px-3.5 text-sm text-ink placeholder:text-ink-faint outline-none cursor-default"
                />
                <Button variant="outline" size="sm" onClick={() => void pickFolder()} className="shrink-0 px-3">
                  <FolderOpen className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tùy chọn ứng dụng</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Toggle checked={local.auto_sync} onChange={(v) => patch("auto_sync", v)} label="Auto Sync" description="Tự động đồng bộ theo workflow khi API sẵn sàng" />
            <Toggle checked={local.dark_mode} onChange={(v) => patch("dark_mode", v)} label="Dark Mode" description="Giao diện tối mặc định" />
            <Toggle checked={local.auto_update} onChange={(v) => patch("auto_update", v)} label="Auto Update" description="Tự động cập nhật phiên bản mới" />
          </CardContent>
        </Card>

        <div className="text-xs text-ink-faint text-center">TLORA RAW Selector v0.1.0 · Tauri v2 · React · Rust</div>
      </div>

      <div
        className={cn(
          "fixed bottom-6 right-8 flex items-center gap-3 rounded-2xl border border-border",
          "bg-navy-raised/90 backdrop-blur-xl px-4 py-2.5 shadow-soft transition-all duration-300",
          dirty ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0 pointer-events-none",
        )}
      >
        <span className="text-sm text-ink-muted">Có thay đổi chưa lưu</span>
        <Button onClick={() => void handleSave()} disabled={saving} size="sm">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : saveOk ? <CheckCircle2 className="h-4 w-4" /> : <Save className="h-4 w-4" />}
          {saving ? "Đang lưu..." : saveOk ? "Đã lưu!" : "Lưu cài đặt"}
        </Button>
      </div>
    </div>
  );
}
