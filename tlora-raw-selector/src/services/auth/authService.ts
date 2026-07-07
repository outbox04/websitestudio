import { invoke } from "@tauri-apps/api/core";
import { openUrl } from "@tauri-apps/plugin-opener";
import { supabaseAuth, hasSupabaseAuthConfig } from "@/services/auth/supabaseClient";

async function getAuthCallbackUrl() {
  return invoke<string>("get_auth_callback_url");
}

export async function getCurrentAuthSession() {
  if (!hasSupabaseAuthConfig()) {
    throw new Error("Chưa cấu hình Supabase Auth cho app desktop.");
  }
  const { data, error } = await supabaseAuth.auth.getSession();
  if (error) throw error;
  return data.session;
}

export async function signInWithGooglePkce() {
  if (!hasSupabaseAuthConfig()) {
    throw new Error("Chưa cấu hình Supabase Auth cho app desktop.");
  }
  const redirectTo = await getAuthCallbackUrl();
  const { data, error } = await supabaseAuth.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo,
      skipBrowserRedirect: true,
      queryParams: {
        access_type: "offline",
        prompt: "consent",
      },
    },
  });
  if (error) throw error;
  if (!data.url) throw new Error("Supabase không trả về URL đăng nhập Google.");
  await openUrl(data.url);
}

export async function exchangeAuthCode(code: string) {
  if (!hasSupabaseAuthConfig()) {
    throw new Error("Chưa cấu hình Supabase Auth cho app desktop.");
  }
  const { data, error } = await supabaseAuth.auth.exchangeCodeForSession(code);
  if (error) throw error;
  return data.session;
}

export async function signOutAuth() {
  await supabaseAuth.auth.signOut();
}

export function onAuthStateChanged(callback: () => void) {
  const { data } = supabaseAuth.auth.onAuthStateChange(() => {
    callback();
  });
  return () => data.subscription.unsubscribe();
}
