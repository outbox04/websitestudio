import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./index.css";
import { AuthProvider } from "@/auth/AuthProvider";
import { LicenseProvider } from "@/license/LicenseProvider";

// Mock Tauri internals when running in a standard web browser for testing
if (typeof window !== "undefined" && !(window as any).__TAURI_INTERNALS__) {
  console.log("Mocking Tauri internals for browser mode...");
  (window as any).__TAURI_INTERNALS__ = {
    invoke: async (cmd: string, args?: any) => {
      console.log(`[Tauri Mock Invoke] ${cmd}`, args);
      if (cmd === "get_device_info") {
        return {
          deviceId: "mock-tlora-device-id-123456",
          deviceName: "Browser Test Device",
          platform: "browser"
        };
      }
      if (cmd === "read_license_cache") {
        const cache = localStorage.getItem("tlora_license_cache");
        return cache ? JSON.parse(cache) : null;
      }
      if (cmd === "write_license_cache") {
        localStorage.setItem("tlora_license_cache", JSON.stringify(args.cache));
        return;
      }
      if (cmd === "clear_license_cache") {
        localStorage.removeItem("tlora_license_cache");
        return;
      }
      if (cmd === "load_settings") {
        return {
          default_dest_root: "C:\\MockPath",
          api_url: "https://www.tlgroup.site",
          api_key: "",
          google_drive_client_id: "",
          google_drive_client_secret: "",
          google_drive_root_folder_id: "",
          auto_sync: false,
          dark_mode: true,
          auto_update: true
        };
      }
      if (cmd === "list_album_workflows") {
        return [];
      }
      if (cmd === "list_drives") {
        return [];
      }
      return null;
    },
    transformCallback: (callback: any, once: boolean) => {
      return "mock-callback-id";
    }
  };
}


ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <LicenseProvider>
          <App />
        </LicenseProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
