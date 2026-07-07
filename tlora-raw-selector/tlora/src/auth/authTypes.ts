import type { Session, User } from "@supabase/supabase-js";

export type AuthStatus = "loading" | "authenticated" | "anonymous" | "error";

export interface AuthState {
  status: AuthStatus;
  session: Session | null;
  user: User | null;
  error: string;
}
