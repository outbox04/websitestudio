use serde::{Deserialize, Serialize};
use std::fs;
use std::path::{Path, PathBuf};

const SUPPORTED_SYNC_EXTS: &[&str] = &[
    "jpg", "jpeg", "png", "tif", "tiff", "dng", "cr2", "cr3", "crw", "nef", "nrw", "arw", "srf",
    "sr2", "raf", "orf", "rw2", "pef", "x3f",
];

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SyncEditedImagesPayload {
    pub source_dir: String,
    pub dest_dir: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SyncEditedImagesResult {
    pub copied: usize,
    pub skipped: usize,
    pub destination: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct AppSettingsData {
    pub default_dest_root: String,
    pub api_url: String,
    pub api_key: String,
    pub google_drive_client_id: String,
    pub google_drive_client_secret: String,
    pub google_drive_root_folder_id: String,
    pub auto_sync: bool,
    pub dark_mode: bool,
    pub auto_update: bool,
}

impl Default for AppSettingsData {
    fn default() -> Self {
        Self {
            default_dest_root: String::new(),
            api_url: String::new(),
            api_key: String::new(),
            google_drive_client_id: String::new(),
            google_drive_client_secret: String::new(),
            google_drive_root_folder_id: String::new(),
            auto_sync: false,
            dark_mode: true,
            auto_update: true,
        }
    }
}

pub fn settings_path(config_dir: &Path) -> PathBuf {
    config_dir.join("tlora-settings.json")
}

pub fn read_settings_from_path(path: &Path) -> Result<AppSettingsData, String> {
    if !path.exists() {
        return Ok(AppSettingsData::default());
    }

    let contents =
        fs::read_to_string(path).map_err(|e| format!("Không đọc được tệp cài đặt: {e}"))?;
    serde_json::from_str(&contents).map_err(|e| format!("Không parse được cài đặt: {e}"))
}

pub fn sync_edited_images(
    source_dir: &str,
    dest_dir: &str,
) -> Result<SyncEditedImagesResult, String> {
    let source = Path::new(source_dir);
    let destination = Path::new(dest_dir);

    if !source.exists() {
        return Err("Thư mục nguồn không tồn tại.".into());
    }

    if !destination.exists() {
        fs::create_dir_all(destination).map_err(|e| format!("Không tạo được thư mục đích: {e}"))?;
    }

    let mut copied = 0usize;
    let mut skipped = 0usize;

    for entry in fs::read_dir(source).map_err(|e| format!("Không đọc được thư mục nguồn: {e}"))?
    {
        let entry = entry.map_err(|e| format!("Không đọc được tệp: {e}"))?;
        let path = entry.path();
        if path.is_dir() {
            continue;
        }

        let ext = path
            .extension()
            .and_then(|e| e.to_str())
            .unwrap_or_default()
            .to_lowercase();
        if !SUPPORTED_SYNC_EXTS.contains(&ext.as_str()) {
            continue;
        }

        let file_name = path
            .file_name()
            .and_then(|n| n.to_str())
            .unwrap_or_default();
        let target = destination.join(file_name);
        if target.exists() {
            skipped += 1;
            continue;
        }

        fs::copy(&path, &target).map_err(|e| format!("Không copy được tệp {file_name}: {e}"))?;
        copied += 1;
    }

    Ok(SyncEditedImagesResult {
        copied,
        skipped,
        destination: destination.to_string_lossy().to_string(),
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn reads_default_settings_when_file_is_missing() {
        let temp_dir =
            std::env::temp_dir().join(format!("tlora-settings-test-{}", std::process::id()));
        let path = temp_dir.join("settings.json");

        let settings = read_settings_from_path(&path).unwrap();
        assert_eq!(settings.default_dest_root, String::new());
        assert!(settings.auto_sync == false);
    }

    #[test]
    fn syncs_supported_files_from_source_to_destination() {
        let temp_dir =
            std::env::temp_dir().join(format!("tlora-edit-sync-test-{}", std::process::id()));
        let source = temp_dir.join("source");
        let destination = temp_dir.join("destination");

        fs::create_dir_all(&source).unwrap();
        fs::create_dir_all(&destination).unwrap();

        fs::write(source.join("a.jpg"), b"jpg").unwrap();
        fs::write(source.join("b.CR2"), b"raw").unwrap();
        fs::write(source.join("ignore.txt"), b"ignore").unwrap();

        let result =
            sync_edited_images(&source.to_string_lossy(), &destination.to_string_lossy()).unwrap();

        assert_eq!(result.copied, 2);
        assert_eq!(result.skipped, 0);
        assert!(destination.join("a.jpg").exists());
        assert!(destination.join("b.CR2").exists());

        fs::remove_dir_all(temp_dir).unwrap();
    }
}
