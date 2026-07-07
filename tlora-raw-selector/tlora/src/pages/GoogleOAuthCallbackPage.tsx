import { useEffect, useState } from "react";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { exchangeGoogleCode } from "@/lib/googleDriveAuth";
import { useSettingsStore } from "@/store/useSettingsStore";

export function GoogleOAuthCallbackPage() {
  const { settings, loaded, loadSettings } = useSettingsStore();
  const [state, setState] = useState<"loading" | "ok" | "fail">("loading");
  const [message, setMessage] = useState("Đang xác thực Google Drive...");

  useEffect(() => {
    if (!loaded) void loadSettings();
  }, [loaded, loadSettings]);

  useEffect(() => {
    if (!loaded) return;

    const params = new URLSearchParams(window.location.search);
    const error = params.get("error");
    const code = params.get("code");
    const oauthState = params.get("state");

    if (error) {
      setState("fail");
      setMessage(error);
      return;
    }

    if (!code) {
      setState("fail");
      setMessage("Google không trả về authorization code.");
      return;
    }

    void exchangeGoogleCode(settings, code, oauthState)
      .then(() => {
        setState("ok");
        setMessage("Đăng nhập Google Drive thành công.");
      })
      .catch((err) => {
        setState("fail");
        setMessage(err instanceof Error ? err.message : String(err));
      });
  }, [loaded, settings]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas p-6">
      <div className="w-full max-w-lg rounded-2xl border border-border bg-navy-raised p-6 shadow-soft">
        <div className="flex items-center gap-3">
          {state === "loading" ? <Loader2 className="h-5 w-5 animate-spin text-brand" /> : null}
          {state === "ok" ? <CheckCircle2 className="h-5 w-5 text-success" /> : null}
          {state === "fail" ? <XCircle className="h-5 w-5 text-danger" /> : null}
          <h1 className="text-lg font-semibold text-ink">Google Drive OAuth</h1>
        </div>
        <p className="mt-3 text-sm text-ink-muted">{message}</p>
        <Button className="mt-5 w-full" onClick={() => { window.location.href = "/cai-dat"; }}>
          Quay lại cài đặt
        </Button>
      </div>
    </div>
  );
}
