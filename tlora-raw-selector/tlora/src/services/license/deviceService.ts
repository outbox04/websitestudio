import { invoke } from "@tauri-apps/api/core";
import type { DeviceInfo } from "@/license/licenseTypes";

export async function getDeviceInfo(): Promise<DeviceInfo> {
  return invoke<DeviceInfo>("get_device_info");
}
