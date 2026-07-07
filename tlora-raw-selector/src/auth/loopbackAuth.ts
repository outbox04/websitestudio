import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";

export interface LoopbackAuthCallbackPayload {
  code?: string;
  error?: string;
  error_description?: string;
  state?: string;
}

export async function getAuthCallbackUrl() {
  return invoke<string>("get_auth_callback_url");
}

export async function listenForAuthLoopbackCallback(
  handler: (payload: LoopbackAuthCallbackPayload) => void,
) {
  return listen<LoopbackAuthCallbackPayload>("auth-loopback-callback", (event) => {
    handler(event.payload);
  });
}