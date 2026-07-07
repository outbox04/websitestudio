import { FormEvent, useState } from "react";
import { KeyRound, Loader2, LogOut } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface LicenseActivationScreenProps {
  loading: boolean;
  error: string;
  onActivate: (licenseKey: string) => Promise<void>;
  onLogout: () => Promise<void>;
}

export function LicenseActivationScreen({ loading, error, onActivate, onLogout }: LicenseActivationScreenProps) {
  const [licenseKey, setLicenseKey] = useState("");

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!licenseKey.trim()) return;
    void onActivate(licenseKey.trim());
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-navy px-6 text-ink">
      <form onSubmit={submit} className="w-full max-w-md rounded-2xl border border-border bg-navy-raised p-6 shadow-soft">
        <div className="text-sm font-semibold uppercase tracking-[0.2em] text-brand">TLORA License</div>
        <h1 className="mt-3 text-2xl font-semibold">Kích hoạt thiết bị</h1>
        <p className="mt-2 text-sm text-ink-muted">Nhập license key được cấp cho studio để mở ứng dụng trên máy này.</p>

        <label className="mt-5 block space-y-1.5">
          <span className="text-sm font-medium text-ink">License Key</span>
          <input
            value={licenseKey}
            onChange={(e) => setLicenseKey(e.target.value)}
            placeholder="TLORA-XXXX-XXXX"
            className="h-10 w-full rounded-xl border border-border bg-navy-soft px-3.5 text-sm text-ink placeholder:text-ink-faint outline-none"
          />
        </label>

        {error ? <div className="mt-4 rounded-xl border border-danger/30 bg-danger/10 p-3 text-sm text-danger">{error}</div> : null}

        <Button type="submit" disabled={loading || !licenseKey.trim()} className="mt-6 w-full">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
          Kích hoạt
        </Button>

        <Button type="button" variant="outline" onClick={onLogout} className="mt-3 w-full">
          <LogOut className="h-4 w-4" />
          Đăng xuất tài khoản
        </Button>
      </form>
    </div>
  );
}
