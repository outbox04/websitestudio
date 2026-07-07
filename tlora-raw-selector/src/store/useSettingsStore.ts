import { create } from "zustand";
import { invoke } from "@tauri-apps/api/core";

const DEFAULT_API_URL = import.meta.env.VITE_TLORA_LICENSE_API_URL || "";

export interface AppSettingsData {
  default_dest_root: string;
  api_url: string;
  api_key: string;
  google_drive_client_id: string;
  google_drive_client_secret: string;
  google_drive_root_folder_id: string;
  google_drive_account_email: string;
  auto_sync: boolean;
  dark_mode: boolean;
  auto_update: boolean;
}

const DEFAULTS: AppSettingsData = {
  default_dest_root: "",
  api_url: DEFAULT_API_URL,
  api_key: "",
  google_drive_client_id: "",
  google_drive_client_secret: "",
  google_drive_root_folder_id: "",
  google_drive_account_email: "",
  auto_sync: false,
  dark_mode: true,
  auto_update: true,
};

interface SettingsState {
  settings: AppSettingsData;
  loaded: boolean;
  saving: boolean;
  loadSettings: () => Promise<void>;
  saveSettings: (patch: Partial<AppSettingsData>) => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: DEFAULTS,
  loaded: false,
  saving: false,

  loadSettings: async () => {
    try {
      const data = await invoke<AppSettingsData>("load_settings");
      set({ settings: data, loaded: true });
    } catch {
      set({ settings: DEFAULTS, loaded: true });
    }
  },

  saveSettings: async (patch) => {
    const next = { ...get().settings, ...patch };
    set({ saving: true, settings: next });
    try {
      await invoke("save_settings", { settings: next });
    } finally {
      set({ saving: false });
    }
  },
}));
