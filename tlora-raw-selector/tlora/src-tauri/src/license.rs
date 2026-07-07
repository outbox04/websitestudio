use chrono::{SecondsFormat, Utc};
use serde::{Deserialize, Serialize};
use std::collections::hash_map::DefaultHasher;
use std::fs;
use std::hash::{Hash, Hasher};
use std::path::{Path, PathBuf};
use std::process::Command;

const DEVICE_FILE: &str = "device.json";
const LICENSE_CACHE_FILE: &str = "license_cache.json";

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DeviceInfo {
    pub device_id: String,
    pub device_name: String,
    pub platform: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct LicenseCache {
    pub license_key: String,
    pub user_id: String,
    pub device_id: String,
    pub status: String,
    pub checked_at: String,
    pub expires_at: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct StoredDevice {
    device_id: String,
    device_name: String,
    platform: String,
    created_at: String,
}

fn ensure_dir(config_dir: &Path) -> Result<(), String> {
    if !config_dir.exists() {
        fs::create_dir_all(config_dir)
            .map_err(|e| format!("Khong tao duoc thu muc config license: {e}"))?;
    }
    Ok(())
}

fn device_path(config_dir: &Path) -> PathBuf {
    config_dir.join(DEVICE_FILE)
}

fn license_cache_path(config_dir: &Path) -> PathBuf {
    config_dir.join(LICENSE_CACHE_FILE)
}

fn command_output(program: &str, args: &[&str]) -> Option<String> {
    let output = Command::new(program).args(args).output().ok()?;
    if !output.status.success() {
        return None;
    }
    let text = String::from_utf8_lossy(&output.stdout);
    let value = text
        .lines()
        .map(str::trim)
        .find(|line| !line.is_empty() && !line.contains("UUID") && !line.contains("MachineGuid"))?;
    Some(value.to_string())
}

fn machine_seed() -> String {
    #[cfg(target_os = "windows")]
    {
        if let Some(value) = command_output(
            "reg",
            &[
                "query",
                "HKLM\\SOFTWARE\\Microsoft\\Cryptography",
                "/v",
                "MachineGuid",
            ],
        ) {
            return value
                .split_whitespace()
                .last()
                .unwrap_or(&value)
                .to_string();
        }
        if let Some(value) = command_output("wmic", &["csproduct", "get", "uuid"]) {
            return value;
        }
    }

    std::env::var("COMPUTERNAME")
        .or_else(|_| std::env::var("HOSTNAME"))
        .unwrap_or_else(|_| {
            format!(
                "tlora-{}",
                Utc::now().timestamp_nanos_opt().unwrap_or_default()
            )
        })
}

fn hash_device_id(seed: &str) -> String {
    let mut hasher = DefaultHasher::new();
    seed.hash(&mut hasher);
    format!("tlora-device-{:016x}", hasher.finish())
}

fn device_name() -> String {
    std::env::var("COMPUTERNAME")
        .or_else(|_| std::env::var("HOSTNAME"))
        .unwrap_or_else(|_| "Unknown device".to_string())
}

pub fn get_device_info(config_dir: &Path) -> Result<DeviceInfo, String> {
    ensure_dir(config_dir)?;
    let path = device_path(config_dir);
    if path.exists() {
        let contents =
            fs::read_to_string(&path).map_err(|e| format!("Khong doc duoc device id: {e}"))?;
        let stored: StoredDevice =
            serde_json::from_str(&contents).map_err(|e| format!("Device id khong hop le: {e}"))?;
        return Ok(DeviceInfo {
            device_id: stored.device_id,
            device_name: stored.device_name,
            platform: stored.platform,
        });
    }

    let stored = StoredDevice {
        device_id: hash_device_id(&machine_seed()),
        device_name: device_name(),
        platform: std::env::consts::OS.to_string(),
        created_at: Utc::now().to_rfc3339_opts(SecondsFormat::Secs, true),
    };
    let contents = serde_json::to_string_pretty(&stored)
        .map_err(|e| format!("Khong serialize duoc device id: {e}"))?;
    fs::write(&path, contents).map_err(|e| format!("Khong ghi duoc device id: {e}"))?;

    Ok(DeviceInfo {
        device_id: stored.device_id,
        device_name: stored.device_name,
        platform: stored.platform,
    })
}

pub fn read_license_cache(config_dir: &Path) -> Result<Option<LicenseCache>, String> {
    let path = license_cache_path(config_dir);
    if !path.exists() {
        return Ok(None);
    }
    let contents =
        fs::read_to_string(&path).map_err(|e| format!("Khong doc duoc license cache: {e}"))?;
    let cache =
        serde_json::from_str(&contents).map_err(|e| format!("License cache khong hop le: {e}"))?;
    Ok(Some(cache))
}

pub fn write_license_cache(config_dir: &Path, cache: &LicenseCache) -> Result<(), String> {
    ensure_dir(config_dir)?;
    let contents = serde_json::to_string_pretty(cache)
        .map_err(|e| format!("Khong serialize duoc license cache: {e}"))?;
    fs::write(license_cache_path(config_dir), contents)
        .map_err(|e| format!("Khong ghi duoc license cache: {e}"))
}

pub fn clear_license_cache(config_dir: &Path) -> Result<(), String> {
    let path = license_cache_path(config_dir);
    if path.exists() {
        fs::remove_file(path).map_err(|e| format!("Khong xoa duoc license cache: {e}"))?;
    }
    Ok(())
}
