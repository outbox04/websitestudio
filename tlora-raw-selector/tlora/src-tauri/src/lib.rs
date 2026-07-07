// Prevents additional console window on Windows in release builds.
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod card_import;
mod auth_loopback;
mod license;
mod settings;
mod workflow;

use std::fs;
use std::process::Command;

use card_import::{list_drives, scan_card, split_card};
use license::{DeviceInfo, LicenseCache};
use settings::{
    read_settings_from_path, settings_path, AppSettingsData, SyncEditedImagesPayload,
    SyncEditedImagesResult,
};
use tauri::{Emitter, Manager};
use workflow::{
    AlbumWorkflow, PrepareEditBatchPayload, PrepareEditBatchResult, UpdateAlbumLinksPayload,
    UploadDriveFilesPayload, UploadDriveFilesResult, UploadEditedBatchPayload,
    UploadEditedBatchResult,
};

#[tauri::command]
fn load_settings(app: tauri::AppHandle) -> Result<AppSettingsData, String> {
    let config_dir = app
        .path()
        .app_config_dir()
        .map_err(|e| format!("Không lấy được thư mục cài đặt: {e}"))?;
    let path = settings_path(&config_dir);
    read_settings_from_path(&path)
}

#[tauri::command]
fn save_settings(app: tauri::AppHandle, settings: AppSettingsData) -> Result<(), String> {
    let config_dir = app
        .path()
        .app_config_dir()
        .map_err(|e| format!("Không lấy được thư mục cài đặt: {e}"))?;
    if !config_dir.exists() {
        fs::create_dir_all(&config_dir)
            .map_err(|e| format!("Không tạo được thư mục cài đặt: {e}"))?;
    }

    let path = settings_path(&config_dir);
    let contents = serde_json::to_string_pretty(&settings)
        .map_err(|e| format!("Không serialize được cài đặt: {e}"))?;
    fs::write(path, contents).map_err(|e| format!("Không ghi được cài đặt: {e}"))
}

#[tauri::command]
fn sync_edited_images(
    _app: tauri::AppHandle,
    payload: SyncEditedImagesPayload,
) -> Result<SyncEditedImagesResult, String> {
    settings::sync_edited_images(&payload.source_dir, &payload.dest_dir)
}

#[tauri::command]
fn list_album_workflows(root: String) -> Result<Vec<AlbumWorkflow>, String> {
    workflow::list_album_workflows(&root)
}

#[tauri::command]
fn prepare_edit_batch(payload: PrepareEditBatchPayload) -> Result<PrepareEditBatchResult, String> {
    workflow::prepare_edit_batch(payload)
}

#[tauri::command]
fn upload_edited_batch(
    payload: UploadEditedBatchPayload,
) -> Result<UploadEditedBatchResult, String> {
    workflow::upload_edited_batch(payload)
}

#[tauri::command]
async fn upload_drive_files(
    app: tauri::AppHandle,
    payload: UploadDriveFilesPayload,
) -> Result<UploadDriveFilesResult, String> {
    tauri::async_runtime::spawn_blocking(move || {
        let app_handle = app.clone();
        workflow::upload_drive_files(payload, move |progress| {
            let _ = app_handle.emit("drive-upload-progress", progress);
        })
    })
    .await
    .map_err(|e| format!("Tac vu upload bi dung bat thuong: {e}"))?
}

#[tauri::command]
fn update_album_links(payload: UpdateAlbumLinksPayload) -> Result<AlbumWorkflow, String> {
    workflow::update_album_links(payload)
}

#[tauri::command]
fn open_path(path: String) -> Result<(), String> {
    if path.trim().is_empty() {
        return Err("Duong dan trong.".into());
    }

    #[cfg(target_os = "windows")]
    {
        Command::new("explorer")
            .arg(path)
            .spawn()
            .map_err(|e| format!("Khong mo duoc thu muc: {e}"))?;
    }

    #[cfg(target_os = "macos")]
    {
        Command::new("open")
            .arg(path)
            .spawn()
            .map_err(|e| format!("Khong mo duoc thu muc: {e}"))?;
    }

    #[cfg(all(unix, not(target_os = "macos")))]
    {
        Command::new("xdg-open")
            .arg(path)
            .spawn()
            .map_err(|e| format!("Khong mo duoc thu muc: {e}"))?;
    }

    Ok(())
}

fn app_config_dir(app: &tauri::AppHandle) -> Result<std::path::PathBuf, String> {
    app.path()
        .app_config_dir()
        .map_err(|e| format!("Khong lay duoc thu muc config app: {e}"))
}

#[tauri::command]
fn get_device_info(app: tauri::AppHandle) -> Result<DeviceInfo, String> {
    license::get_device_info(&app_config_dir(&app)?)
}

#[tauri::command]
fn read_license_cache(app: tauri::AppHandle) -> Result<Option<LicenseCache>, String> {
    license::read_license_cache(&app_config_dir(&app)?)
}

#[tauri::command]
fn write_license_cache(app: tauri::AppHandle, cache: LicenseCache) -> Result<(), String> {
    license::write_license_cache(&app_config_dir(&app)?, &cache)
}

#[tauri::command]
fn clear_license_cache(app: tauri::AppHandle) -> Result<(), String> {
    license::clear_license_cache(&app_config_dir(&app)?)
}

#[tauri::command]
fn get_auth_callback_url(state: tauri::State<auth_loopback::AuthLoopbackState>) -> String {
    state.callback_url()
}

#[tauri::command]
fn get_google_drive_auth_callback_url(
    state: tauri::State<auth_loopback::AuthLoopbackState>,
) -> String {
    state.google_drive_callback_url()
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let mut builder = tauri::Builder::default();

    #[cfg(any(target_os = "macos", windows, target_os = "linux"))]
    {
        builder = builder.plugin(tauri_plugin_single_instance::init(|_app, _argv, _cwd| {}));
    }

    builder
        .setup(|app| {
            let auth_state = auth_loopback::start_auth_loopback_server(app.handle())?;
            app.manage(auth_state);
            Ok(())
        })
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![
            list_drives,
            scan_card,
            split_card,
            load_settings,
            save_settings,
            sync_edited_images,
            list_album_workflows,
            prepare_edit_batch,
            upload_edited_batch,
            upload_drive_files,
            update_album_links,
            open_path,
            get_device_info,
            read_license_cache,
            write_license_cache,
            clear_license_cache,
            get_auth_callback_url,
            get_google_drive_auth_callback_url
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
