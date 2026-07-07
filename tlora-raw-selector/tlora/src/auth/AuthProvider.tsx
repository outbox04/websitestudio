import { createContext, useContext, useEffect, useMemo, useState, useRef } from "react";
import type { ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { exchangeAuthCode, getCurrentAuthSession, onAuthStateChanged, signInWithGooglePkce } from "@/services/auth/authService";
import { LoginScreen } from "@/auth/LoginScreen";
import type { AuthState } from "@/auth/authTypes";
import { listenForAuthLoopbackCallback } from "@/auth/loopbackAuth";

interface AuthContextValue extends AuthState {
  login: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthProvider");
  return value;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    status: "loading",
    session: null,
    user: null,
    error: "",
  });
  const [loginLoading, setLoginLoading] = useState(false);
  const exchangingRef = useRef(false);

  const setSession = (session: Session | null) => {
    setState({
      status: session ? "authenticated" : "anonymous",
      session,
      user: (session?.user ?? null) as User | null,
      error: "",
    });
  };

  const exchangeCodeAndSetSession = async (code: string) => {
    const session = await exchangeAuthCode(code);
    setSession(session);
  };

  const handleLoopbackCallback = async ({ code, error, error_description }: { code?: string; error?: string; error_description?: string }) => {
    if (exchangingRef.current) return;

    if (error) {
      setState({
        status: "error",
        session: null,
        user: null,
        error: error_description || error,
      });
      setLoginLoading(false);
      return;
    }

    if (!code) {
      setState({
        status: "error",
        session: null,
        user: null,
        error: "Supabase không trả về authorization code.",
      });
      setLoginLoading(false);
      return;
    }

    exchangingRef.current = true;
    try {
      await exchangeCodeAndSetSession(code);
    } catch (e) {
      exchangingRef.current = false;
      setState({
        status: "error",
        session: null,
        user: null,
        error: e instanceof Error ? e.message : String(e),
      });
      setLoginLoading(false);
    }
  };

  const loadSession = async () => {
    try {
      setSession(await getCurrentAuthSession());
    } catch (e) {
      setState({
        status: "error",
        session: null,
        user: null,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  };

  useEffect(() => {
    let active = true;
    void loadSession();
    
    let unlistenLoopback: (() => void) | undefined;
    void listenForAuthLoopbackCallback((payload) => {
      if (active) {
        void handleLoopbackCallback(payload);
      }
    }).then((unlisten) => {
      if (!active) {
        unlisten();
      } else {
        unlistenLoopback = unlisten;
      }
    });

    const unlistenAuth = onAuthStateChanged(() => {
      if (active) {
        void loadSession();
      }
    });

    return () => {
      active = false;
      unlistenAuth();
      if (unlistenLoopback) unlistenLoopback();
    };
  }, []);

  const login = async () => {
    setLoginLoading(true);
    setState((current) => ({ ...current, error: "" }));
    try {
      await signInWithGooglePkce();
    } catch (e) {
      setState({
        status: "anonymous",
        session: null,
        user: null,
        error: e instanceof Error ? e.message : String(e),
      });
      setLoginLoading(false);
    }
  };

  const logout = async () => {
    try {
      await signOutAuth();
      setSession(null);
    } catch (e) {
      console.error("Sign out error:", e);
    }
  };

  const value = useMemo<AuthContextValue>(
    () => ({
      ...state,
      login,
      logout,
    }),
    [state],
  );

  if (state.status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-navy text-sm text-ink-muted">
        Đang kiểm tra đăng nhập...
      </div>
    );
  }

  if (state.status !== "authenticated") {
    return (
      <AuthContext.Provider value={value}>
        <LoginScreen loading={loginLoading} error={state.error} onLogin={() => void login()} />
      </AuthContext.Provider>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
