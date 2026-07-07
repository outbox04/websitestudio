import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { LicenseActivationScreen } from "@/license/LicenseActivationScreen";
import type { DeviceInfo, LicenseState } from "@/license/licenseTypes";
import { useAuth } from "@/auth/AuthProvider";
import { getDeviceInfo } from "@/services/license/deviceService";
import { activateLicense, verifyLicense } from "@/services/license/licenseService";

interface LicenseContextValue extends LicenseState {
  device: DeviceInfo | null;
  refresh: () => Promise<void>;
}

const LicenseContext = createContext<LicenseContextValue | null>(null);

export function useLicense() {
  const value = useContext(LicenseContext);
  if (!value) throw new Error("useLicense must be used inside LicenseProvider");
  return value;
}

export function LicenseProvider({ children }: { children: ReactNode }) {
  const { session, logout } = useAuth();
  const [device, setDevice] = useState<DeviceInfo | null>(null);
  const [state, setState] = useState<LicenseState>({ status: "loading", cache: null, error: "" });
  const [activating, setActivating] = useState(false);

  const refresh = async () => {
    if (!session) return;
    setState((current) => ({ ...current, status: "loading", error: "" }));
    try {
      const deviceInfo = await getDeviceInfo();
      setDevice(deviceInfo);
      const result = await verifyLicense(session, deviceInfo);
      if (result.valid) {
        setState({ status: "valid", cache: result.cache, error: result.message });
        return;
      }
      setState({
        status: result.cache ? "offline_expired" : "needs_activation",
        cache: result.cache,
        error: result.message,
      });
    } catch (e) {
      setState({ status: "invalid", cache: null, error: e instanceof Error ? e.message : String(e) });
    }
  };

  useEffect(() => {
    void refresh();
  }, [session?.access_token]);

  const activate = async (licenseKey: string) => {
    if (!session) return;
    setActivating(true);
    setState((current) => ({ ...current, error: "" }));
    try {
      const deviceInfo = device ?? (await getDeviceInfo());
      setDevice(deviceInfo);
      const cache = await activateLicense(session, deviceInfo, licenseKey);
      setState({ status: "valid", cache, error: "" });
    } catch (e) {
      setState((current) => ({ ...current, status: "needs_activation", error: e instanceof Error ? e.message : String(e) }));
    } finally {
      setActivating(false);
    }
  };

  const value = useMemo<LicenseContextValue>(
    () => ({
      ...state,
      device,
      refresh,
    }),
    [state, device],
  );

  if (state.status === "loading") {
    return (
      <LicenseContext.Provider value={value}>
        <div className="flex min-h-screen items-center justify-center bg-navy text-sm text-ink-muted">
          Đang kiểm tra license...
        </div>
      </LicenseContext.Provider>
    );
  }

  if (state.status !== "valid") {
    return (
      <LicenseContext.Provider value={value}>
        <LicenseActivationScreen loading={activating} error={state.error} onActivate={activate} onLogout={logout} />
      </LicenseContext.Provider>
    );
  }

  return <LicenseContext.Provider value={value}>{children}</LicenseContext.Provider>;
}
