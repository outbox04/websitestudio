import { LogIn, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface LoginScreenProps {
  loading: boolean;
  error: string;
  onLogin: () => void;
}

export function LoginScreen({ loading, error, onLogin }: LoginScreenProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-navy px-6 text-ink">
      <div className="w-full max-w-md rounded-2xl border border-border bg-navy-raised p-6 shadow-soft">
        <div className="text-sm font-semibold uppercase tracking-[0.2em] text-brand">TLORA</div>
        <h1 className="mt-3 text-2xl font-semibold">Đăng nhập để sử dụng app</h1>
        <p className="mt-2 text-sm text-ink-muted">Dùng tài khoản Google đã được cấp quyền license TLORA.</p>

        {error ? <div className="mt-4 rounded-xl border border-danger/30 bg-danger/10 p-3 text-sm text-danger">{error}</div> : null}

        <Button onClick={onLogin} disabled={loading} className="mt-6 w-full">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
          Kết nối Google
        </Button>
      </div>
    </div>
  );
}
