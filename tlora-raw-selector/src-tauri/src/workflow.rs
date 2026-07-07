use chrono::Local;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs;
use std::path::{Path, PathBuf};

const ALBUM_MANIFEST: &str = ".tlora-album.json";
const RAW_EXTS: &[&str] = &[
    "3fr", "ari", "arw", "bay", "cr2", "cr3", "crw", "dcr", "dng", "erf", "fff", "iiq", "k25",
    "kdc", "mef", "mos", "mrw", "nef", "nrw", "orf", "pef", "raf", "raw", "rw2", "rwl", "sr2",
    "srf", "srw", "x3f",
];
const JPG_EXTS: &[&str] = &["jpg", "jpeg"];
const DONE_EXTS: &[&str] = JPG_EXTS;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AlbumWorkflow {
    pub album_name: String,
    pub customer_name: String,
    pub album_path: String,
    pub raw_dir: String,
    pub jpg_dir: String,
    pub edit_request_dir: String,
    pub edited_dir: String,
    pub drive_file_goc_url: String,
    pub drive_file_chinh_sua_url: String,
    pub website_url: String,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PrepareEditBatchPayload {
    pub album_path: String,
    pub selected_files_text: String,
    pub output_dir: Option<String>,
    pub use_jpeg_fallback: Option<bool>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PrepareEditBatchResult {
    pub requested: usize,
    pub matched: usize,
    pub copied: usize,
    pub missing: usize,
    pub output_dir: String,
    pub done_file: String,
    pub copied_files: Vec<String>,
    pub missing_files: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UploadEditedBatchPayload {
    pub source_dir: String,
    pub destination_dir: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UploadEditedBatchResult {
    pub uploaded: usize,
    pub skipped: usize,
    pub destination_dir: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UploadDriveFilesPayload {
    pub album_path: String,
    pub kind: String,
    pub api_url: String,
    pub api_key: String,
    pub drive_access_token: Option<String>,
    pub drive_root_folder_id: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UploadDriveFilesResult {
    pub uploaded: usize,
    pub failed: usize,
    pub source_dir: String,
    pub files: Vec<String>,
    pub drive_files: Vec<UploadedDriveFile>,
    pub errors: Vec<String>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct UploadDriveFilesProgress {
    pub album_path: String,
    pub kind: String,
    pub current: usize,
    pub total: usize,
    pub uploaded: usize,
    pub failed: usize,
    pub file_name: String,
    pub status: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UploadedDriveFile {
    pub drive_file_id: String,
    pub file_name: String,
    pub thumbnail_url: String,
    pub preview_url: String,
    pub download_url: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateAlbumLinksPayload {
    pub album_path: String,
    pub drive_file_goc_url: String,
    pub drive_file_chinh_sua_url: String,
    pub website_url: String,
}

fn ext_lower(path: &Path) -> String {
    path.extension()
        .and_then(|e| e.to_str())
        .unwrap_or_default()
        .to_lowercase()
}

fn stem_lower(path: &Path) -> String {
    path.file_stem()
        .and_then(|s| s.to_str())
        .unwrap_or_default()
        .to_lowercase()
}

pub fn write_album_manifest(album: &AlbumWorkflow) -> Result<(), String> {
    let album_path = Path::new(&album.album_path);
    let contents = serde_json::to_string_pretty(album)
        .map_err(|e| format!("Khong tao duoc manifest album: {e}"))?;
    fs::write(album_path.join(ALBUM_MANIFEST), contents)
        .map_err(|e| format!("Khong ghi duoc manifest album: {e}"))
}

pub fn make_album_workflow(
    album_name: &str,
    customer_name: &str,
    album_root: &Path,
) -> AlbumWorkflow {
    AlbumWorkflow {
        album_name: album_name.to_string(),
        customer_name: customer_name.to_string(),
        album_path: album_root.to_string_lossy().to_string(),
        raw_dir: album_root.join("FILE RAW").to_string_lossy().to_string(),
        jpg_dir: album_root.join("FILE GỐC").to_string_lossy().to_string(),
        edit_request_dir: album_root
            .join("FILE CHỈNH SỬA")
            .to_string_lossy()
            .to_string(),
        edited_dir: album_root.join("FILE DONE").to_string_lossy().to_string(),
        drive_file_goc_url: String::new(),
        drive_file_chinh_sua_url: String::new(),
        website_url: String::new(),
        created_at: Local::now().to_rfc3339(),
    }
}

fn read_album_manifest(path: &Path) -> Option<AlbumWorkflow> {
    let contents = fs::read_to_string(path.join(ALBUM_MANIFEST)).ok()?;
    serde_json::from_str(&contents).ok()
}

fn collect_album_workflows(root: &Path, albums: &mut Vec<AlbumWorkflow>) -> Result<(), String> {
    if let Some(album) = read_album_manifest(root) {
        albums.push(album);
        return Ok(());
    }

    for entry in fs::read_dir(root).map_err(|e| format!("Khong doc duoc thu muc album: {e}"))? {
        let entry = entry.map_err(|e| format!("Khong doc duoc album: {e}"))?;
        let path = entry.path();
        if path.is_dir() {
            collect_album_workflows(&path, albums)?;
        }
    }

    Ok(())
}

pub fn list_album_workflows(root: &str) -> Result<Vec<AlbumWorkflow>, String> {
    let root = Path::new(root);
    if !root.exists() {
        return Ok(Vec::new());
    }

    let mut albums = Vec::new();
    collect_album_workflows(root, &mut albums)?;

    albums.sort_by(|a, b| b.created_at.cmp(&a.created_at));
    Ok(albums)
}

fn parse_requested_files(text: &str) -> Vec<String> {
    let mut files = Vec::new();
    for token in text.split(|c: char| c == '\r' || c == '\n' || c == '\t' || c == ',' || c == ';') {
        let token = normalize_requested_token(token);
        let token = token.trim().trim_matches('"').trim_matches('\'');
        if token.is_empty() {
            continue;
        }
        let stem = Path::new(token)
            .file_stem()
            .and_then(|s| s.to_str())
            .unwrap_or(token)
            .to_lowercase();
        if !stem.is_empty() && !files.contains(&stem) {
            files.push(stem);
        }
    }
    files
}

fn normalize_requested_token(token: &str) -> String {
    let mut normalized = String::new();
    let mut chars = token.trim().chars().peekable();

    while let Some(ch) = chars.next() {
        if ch == '.' {
            while matches!(chars.peek(), Some(next) if next.is_whitespace()) {
                chars.next();
            }
            normalized.push(ch);
            continue;
        }

        normalized.push(ch);
    }

    normalized
}

fn file_index(
    dir: &Path,
    exts: &[&str],
    folder_label: &str,
) -> Result<HashMap<String, Vec<PathBuf>>, String> {
    let mut index = HashMap::new();
    collect_file_index(dir, exts, folder_label, &mut index)?;
    Ok(index)
}

fn collect_file_index(
    dir: &Path,
    exts: &[&str],
    folder_label: &str,
    index: &mut HashMap<String, Vec<PathBuf>>,
) -> Result<(), String> {
    for entry in
        fs::read_dir(dir).map_err(|e| format!("Khong doc duoc thu muc {folder_label}: {e}"))?
    {
        let entry = entry.map_err(|e| format!("Khong doc duoc file trong {folder_label}: {e}"))?;
        let path = entry.path();
        if path.is_dir() {
            collect_file_index(&path, exts, folder_label, index)?;
            continue;
        }
        if path.is_file() && exts.contains(&ext_lower(&path).as_str()) {
            index.entry(stem_lower(&path)).or_default().push(path);
        }
    }
    Ok(())
}

fn unique_destination_path(output_dir: &Path, file_name: &str) -> PathBuf {
    let original = output_dir.join(file_name);
    if !original.exists() {
        return original;
    }

    let path = Path::new(file_name);
    let stem = path
        .file_stem()
        .and_then(|s| s.to_str())
        .unwrap_or(file_name);
    let ext = path
        .extension()
        .and_then(|e| e.to_str())
        .unwrap_or_default();

    for index in 2.. {
        let candidate_name = if ext.is_empty() {
            format!("{stem}-{index}")
        } else {
            format!("{stem}-{index}.{ext}")
        };
        let candidate = output_dir.join(candidate_name);
        if !candidate.exists() {
            return candidate;
        }
    }

    unreachable!("unique destination loop always returns")
}

pub fn prepare_edit_batch(
    payload: PrepareEditBatchPayload,
) -> Result<PrepareEditBatchResult, String> {
    let album = read_album_manifest(Path::new(&payload.album_path))
        .ok_or_else(|| "Khong tim thay manifest album.".to_string())?;
    let raw_dir = Path::new(&album.raw_dir);
    let jpg_dir = Path::new(&album.jpg_dir);
    let use_jpeg_fallback = payload.use_jpeg_fallback.unwrap_or(true);
    if !raw_dir.exists() {
        return Err("Thư mục FILE RAW của album không tồn tại.".into());
    }

    if use_jpeg_fallback && !jpg_dir.exists() {
        return Err("Thu muc FILE GOC cua album khong ton tai de fallback JPG.".into());
    }

    let requested = parse_requested_files(&payload.selected_files_text);
    if requested.is_empty() {
        return Err("Chua co danh sach file can chinh tu database/website.".into());
    }

    let output_dir = payload
        .output_dir
        .filter(|v| !v.trim().is_empty())
        .map(PathBuf::from)
        .unwrap_or_else(|| Path::new(&album.edit_request_dir).to_path_buf());
    fs::create_dir_all(&output_dir)
        .map_err(|e| format!("Không tạo được thư mục FILE CHỈNH SỬA: {e}"))?;

    let raw_index = file_index(raw_dir, RAW_EXTS, "FILE RAW")?;
    let jpg_index = if use_jpeg_fallback {
        file_index(jpg_dir, JPG_EXTS, "FILE GOC")?
    } else {
        HashMap::new()
    };
    let mut copied = 0usize;
    let mut copied_files = Vec::new();
    let mut missing_files = Vec::new();

    for stem in &requested {
        let sources = if let Some(raw_sources) = raw_index.get(stem) {
            raw_sources
        } else if use_jpeg_fallback {
            match jpg_index.get(stem) {
                Some(jpg_sources) => jpg_sources,
                None => {
                    missing_files.push(stem.clone());
                    continue;
                }
            }
        } else {
            missing_files.push(stem.clone());
            continue;
        };
        for source in sources {
            let file_name = source
                .file_name()
                .and_then(|n| n.to_str())
                .unwrap_or_default()
                .to_string();
            let target = unique_destination_path(&output_dir, &file_name);
            let copied_file_name = target
                .file_name()
                .and_then(|n| n.to_str())
                .unwrap_or(&file_name)
                .to_string();
            if !target.exists() {
                fs::copy(source, &target)
                    .map_err(|e| format!("Không copy được RAW {file_name}: {e}"))?;
                copied += 1;
            }
            copied_files.push(copied_file_name);
        }
    }

    let done_file = output_dir.join("DONE.txt");
    let mut done_contents = format!(
        "Album: {}\nCustomer: {}\nGenerated: {}\n\nFILES TO EDIT:\n",
        album.album_name,
        album.customer_name,
        Local::now().to_rfc3339()
    );
    for file in &copied_files {
        done_contents.push_str(file);
        done_contents.push('\n');
    }
    if !missing_files.is_empty() {
        done_contents.push_str("\nMISSING:\n");
        for file in &missing_files {
            done_contents.push_str(file);
            done_contents.push('\n');
        }
    }
    fs::write(&done_file, done_contents).map_err(|e| format!("Khong ghi duoc file DONE: {e}"))?;

    Ok(PrepareEditBatchResult {
        requested: requested.len(),
        matched: copied_files.len(),
        copied,
        missing: missing_files.len(),
        output_dir: output_dir.to_string_lossy().to_string(),
        done_file: done_file.to_string_lossy().to_string(),
        copied_files,
        missing_files,
    })
}

pub fn upload_edited_batch(
    payload: UploadEditedBatchPayload,
) -> Result<UploadEditedBatchResult, String> {
    let source = Path::new(&payload.source_dir);
    let destination = Path::new(&payload.destination_dir);
    if !source.exists() {
        return Err("Thư mục FILE DONE không tồn tại.".into());
    }
    fs::create_dir_all(destination)
        .map_err(|e| format!("Không tạo được thư mục FILE DONE: {e}"))?;

    let mut uploaded = 0usize;
    let mut skipped = 0usize;
    for entry in
        fs::read_dir(source).map_err(|e| format!("Không đọc được thư mục FILE DONE: {e}"))?
    {
        let entry = entry.map_err(|e| format!("Không đọc được file JPG hoàn thiện: {e}"))?;
        let path = entry.path();
        if !path.is_file() || !DONE_EXTS.contains(&ext_lower(&path).as_str()) {
            continue;
        }
        let Some(file_name) = path.file_name() else {
            continue;
        };
        let target = destination.join(file_name);
        if target.exists() {
            skipped += 1;
            continue;
        }
        fs::copy(&path, &target).map_err(|e| format!("Khong upload/copy duoc file: {e}"))?;
        uploaded += 1;
    }

    Ok(UploadEditedBatchResult {
        uploaded,
        skipped,
        destination_dir: destination.to_string_lossy().to_string(),
    })
}

fn collect_files_with_exts(dir: &Path, exts: &[&str]) -> Result<Vec<PathBuf>, String> {
    let mut files = Vec::new();
    collect_files_with_exts_inner(dir, exts, &mut files)?;
    files.sort_by(|a, b| a.file_name().cmp(&b.file_name()));
    Ok(files)
}

fn collect_files_with_exts_inner(
    dir: &Path,
    exts: &[&str],
    files: &mut Vec<PathBuf>,
) -> Result<(), String> {
    for entry in fs::read_dir(dir).map_err(|e| format!("Khong doc duoc thu muc upload: {e}"))? {
        let entry = entry.map_err(|e| format!("Khong doc duoc file upload: {e}"))?;
        let path = entry.path();
        if path.is_dir() {
            collect_files_with_exts_inner(&path, exts, files)?;
            continue;
        }
        if path.is_file() && exts.contains(&ext_lower(&path).as_str()) {
            files.push(path);
        }
    }
    Ok(())
}

fn normalized_api_url(api_url: &str) -> Result<String, String> {
    let value = api_url.trim().trim_end_matches('/').to_string();
    if value.is_empty() {
        return Err("Chua cau hinh Website API URL.".into());
    }
    Ok(value)
}

fn compact_http_body(text: String) -> String {
    let trimmed = text.trim();
    if trimmed.len() <= 500 {
        return trimmed.to_string();
    }
    format!("{}...", &trimmed[..500])
}

fn drive_query_escape(value: &str) -> String {
    value.replace('\\', "\\\\").replace('\'', "\\'")
}

#[derive(Debug, Deserialize)]
struct GoogleDriveFile {
    id: String,
    name: Option<String>,
    #[serde(rename = "webViewLink")]
    web_view_link: Option<String>,
    #[serde(rename = "webContentLink")]
    web_content_link: Option<String>,
}

#[derive(Debug, Deserialize)]
struct GoogleDriveListResponse {
    files: Vec<GoogleDriveFile>,
}

fn drive_image_url(file_id: &str, width: u32) -> String {
    format!("https://drive.google.com/thumbnail?id={file_id}&sz=w{width}")
}

fn drive_auth_request(
    client: &reqwest::blocking::Client,
    method: reqwest::Method,
    url: &str,
    access_token: &str,
) -> reqwest::blocking::RequestBuilder {
    client.request(method, url).bearer_auth(access_token)
}

fn find_drive_folder(
    client: &reqwest::blocking::Client,
    access_token: &str,
    parent_id: &str,
    name: &str,
) -> Result<Option<GoogleDriveFile>, String> {
    let query = format!(
        "'{}' in parents and name='{}' and mimeType='application/vnd.google-apps.folder' and trashed=false",
        drive_query_escape(parent_id),
        drive_query_escape(name)
    );
    let response = drive_auth_request(
        client,
        reqwest::Method::GET,
        "https://www.googleapis.com/drive/v3/files",
        access_token,
    )
    .query(&[
        ("q", query.as_str()),
        ("fields", "files(id,name,webViewLink)"),
        ("supportsAllDrives", "true"),
        ("includeItemsFromAllDrives", "true"),
    ])
    .send()
    .map_err(|e| format!("Khong tim duoc thu muc Drive {name}: {e}"))?;

    if !response.status().is_success() {
        let status = response.status();
        let body = compact_http_body(response.text().unwrap_or_default());
        return Err(format!(
            "Google Drive tim thu muc loi HTTP {status}: {body}"
        ));
    }

    let list: GoogleDriveListResponse = response
        .json()
        .map_err(|e| format!("Khong doc duoc phan hoi Google Drive: {e}"))?;
    Ok(list.files.into_iter().next())
}

fn create_drive_folder(
    client: &reqwest::blocking::Client,
    access_token: &str,
    parent_id: &str,
    name: &str,
) -> Result<GoogleDriveFile, String> {
    let body = serde_json::json!({
        "name": name,
        "mimeType": "application/vnd.google-apps.folder",
        "parents": [parent_id],
    });
    let response = drive_auth_request(
        client,
        reqwest::Method::POST,
        "https://www.googleapis.com/drive/v3/files",
        access_token,
    )
    .query(&[
        ("supportsAllDrives", "true"),
        ("fields", "id,name,webViewLink"),
    ])
    .json(&body)
    .send()
    .map_err(|e| format!("Khong tao duoc thu muc Drive {name}: {e}"))?;

    if !response.status().is_success() {
        let status = response.status();
        let body = compact_http_body(response.text().unwrap_or_default());
        return Err(format!(
            "Google Drive tao thu muc loi HTTP {status}: {body}"
        ));
    }

    response
        .json()
        .map_err(|e| format!("Khong doc duoc thu muc Drive vua tao: {e}"))
}

fn ensure_drive_folder(
    client: &reqwest::blocking::Client,
    access_token: &str,
    parent_id: &str,
    name: &str,
) -> Result<GoogleDriveFile, String> {
    if let Some(folder) = find_drive_folder(client, access_token, parent_id, name)? {
        return Ok(folder);
    }
    create_drive_folder(client, access_token, parent_id, name)
}

fn upload_file_to_drive(
    client: &reqwest::blocking::Client,
    access_token: &str,
    folder_id: &str,
    file_name: &str,
    bytes: Vec<u8>,
) -> Result<UploadedDriveFile, String> {
    let metadata = serde_json::json!({
        "name": file_name,
        "parents": [folder_id],
    })
    .to_string();
    let form = reqwest::blocking::multipart::Form::new()
        .part(
            "metadata",
            reqwest::blocking::multipart::Part::text(metadata)
                .mime_str("application/json; charset=UTF-8")
                .map_err(|e| format!("Khong tao duoc metadata upload Drive: {e}"))?,
        )
        .part(
            "file",
            reqwest::blocking::multipart::Part::bytes(bytes)
                .file_name(file_name.to_string())
                .mime_str("image/jpeg")
                .map_err(|e| format!("Khong tao duoc file upload Drive: {e}"))?,
        );
    let response = drive_auth_request(
        client,
        reqwest::Method::POST,
        "https://www.googleapis.com/upload/drive/v3/files",
        access_token,
    )
    .query(&[
        ("uploadType", "multipart"),
        ("supportsAllDrives", "true"),
        ("fields", "id,name,webViewLink,webContentLink"),
    ])
    .multipart(form)
    .send()
    .map_err(|e| format!("Khong upload duoc {file_name} len Google Drive: {e}"))?;

    if !response.status().is_success() {
        let status = response.status();
        let body = compact_http_body(response.text().unwrap_or_default());
        return Err(format!(
            "{file_name}: Google Drive upload loi HTTP {status}: {body}"
        ));
    }

    let uploaded: GoogleDriveFile = response
        .json()
        .map_err(|e| format!("Khong doc duoc file Drive vua upload: {e}"))?;
    let drive_file_id = uploaded.id;
    Ok(UploadedDriveFile {
        drive_file_id: drive_file_id.clone(),
        file_name: uploaded.name.unwrap_or_else(|| file_name.to_string()),
        thumbnail_url: drive_image_url(&drive_file_id, 900),
        preview_url: drive_image_url(&drive_file_id, 2400),
        download_url: uploaded
            .web_content_link
            .or(uploaded.web_view_link)
            .unwrap_or_default(),
    })
}

pub fn upload_drive_files<F>(
    payload: UploadDriveFilesPayload,
    mut on_progress: F,
) -> Result<UploadDriveFilesResult, String>
where
    F: FnMut(UploadDriveFilesProgress),
{
    let album = read_album_manifest(Path::new(&payload.album_path))
        .ok_or_else(|| "Khong tim thay manifest album.".to_string())?;
    let kind = payload.kind.trim().to_lowercase();
    let source_dir = match kind.as_str() {
        "raw" => Path::new(&album.jpg_dir),
        "edited" => Path::new(&album.edited_dir),
        _ => return Err("Loai upload phai la raw hoac edited.".into()),
    };

    if !source_dir.exists() {
        return Err(format!(
            "Thu muc upload khong ton tai: {}",
            source_dir.to_string_lossy()
        ));
    }

    let files_to_upload = collect_files_with_exts(source_dir, JPG_EXTS)?;
    if files_to_upload.is_empty() {
        return Err("Khong co file JPG/JPEG de upload.".into());
    }

    let endpoint = format!("{}/api/tlora/upload", normalized_api_url(&payload.api_url)?);
    let client = reqwest::blocking::Client::new();
    let mut uploaded = 0usize;
    let mut failed = 0usize;
    let mut files = Vec::new();
    let mut drive_files = Vec::new();
    let mut errors = Vec::new();
    let drive_access_token = payload
        .drive_access_token
        .as_deref()
        .map(str::trim)
        .unwrap_or_default();
    let drive_root_folder_id = payload
        .drive_root_folder_id
        .as_deref()
        .map(str::trim)
        .unwrap_or_default();
    let direct_drive_upload = !drive_access_token.is_empty() && !drive_root_folder_id.is_empty();
    let direct_drive_folder_id = if direct_drive_upload {
        let album_folder = ensure_drive_folder(
            &client,
            drive_access_token,
            drive_root_folder_id,
            &album.album_name,
        )?;
        let child_name = if kind == "raw" {
            "FILE GỐC"
        } else {
            "FILE CHỈNH SỬA"
        };
        Some(ensure_drive_folder(&client, drive_access_token, &album_folder.id, child_name)?.id)
    } else {
        None
    };

    let total = files_to_upload.len();
    for (index, path) in files_to_upload.into_iter().enumerate() {
        let file_name = path
            .file_name()
            .and_then(|n| n.to_str())
            .unwrap_or_default()
            .to_string();
        if file_name.is_empty() {
            continue;
        }
        let current = index + 1;

        on_progress(UploadDriveFilesProgress {
            album_path: album.album_path.clone(),
            kind: kind.clone(),
            current,
            total,
            uploaded,
            failed,
            file_name: file_name.clone(),
            status: "uploading".to_string(),
        });

        let bytes = match fs::read(&path) {
            Ok(bytes) => bytes,
            Err(err) => {
                failed += 1;
                errors.push(format!("{file_name}: {err}"));
                on_progress(UploadDriveFilesProgress {
                    album_path: album.album_path.clone(),
                    kind: kind.clone(),
                    current,
                    total,
                    uploaded,
                    failed,
                    file_name,
                    status: "failed".to_string(),
                });
                continue;
            }
        };

        if let Some(folder_id) = &direct_drive_folder_id {
            match upload_file_to_drive(&client, drive_access_token, folder_id, &file_name, bytes) {
                Ok(drive_file) => {
                    uploaded += 1;
                    files.push(file_name.clone());
                    drive_files.push(drive_file);
                    on_progress(UploadDriveFilesProgress {
                        album_path: album.album_path.clone(),
                        kind: kind.clone(),
                        current,
                        total,
                        uploaded,
                        failed,
                        file_name,
                        status: "uploaded".to_string(),
                    });
                }
                Err(err) => {
                    failed += 1;
                    errors.push(err);
                    on_progress(UploadDriveFilesProgress {
                        album_path: album.album_path.clone(),
                        kind: kind.clone(),
                        current,
                        total,
                        uploaded,
                        failed,
                        file_name,
                        status: "failed".to_string(),
                    });
                }
            }
            continue;
        }

        let part = match reqwest::blocking::multipart::Part::bytes(bytes)
            .file_name(file_name.clone())
            .mime_str("image/jpeg")
        {
            Ok(part) => part,
            Err(err) => {
                failed += 1;
                errors.push(format!("{file_name}: {err}"));
                on_progress(UploadDriveFilesProgress {
                    album_path: album.album_path.clone(),
                    kind: kind.clone(),
                    current,
                    total,
                    uploaded,
                    failed,
                    file_name,
                    status: "failed".to_string(),
                });
                continue;
            }
        };
        let form = reqwest::blocking::multipart::Form::new()
            .text("albumName", album.album_name.clone())
            .text("customerName", album.customer_name.clone())
            .text("kind", kind.clone())
            .part("file", part);

        let mut request = client.post(&endpoint).multipart(form);
        let api_key = payload.api_key.trim();
        if !api_key.is_empty() {
            request = request
                .bearer_auth(api_key)
                .header("x-api-key", api_key.to_string());
        }

        match request.send() {
            Ok(response) if response.status().is_success() => {
                uploaded += 1;
                files.push(file_name.clone());
                on_progress(UploadDriveFilesProgress {
                    album_path: album.album_path.clone(),
                    kind: kind.clone(),
                    current,
                    total,
                    uploaded,
                    failed,
                    file_name,
                    status: "uploaded".to_string(),
                });
            }
            Ok(response) => {
                failed += 1;
                let status = response.status();
                let message =
                    compact_http_body(response.text().unwrap_or_else(|_| status.to_string()));
                if matches!(status.as_u16(), 401 | 403 | 405)
                    || (status.as_u16() == 404
                        && (message.contains("This page could not be found")
                            || message.contains("<!DOCTYPE")
                            || message.contains("_not-found")))
                {
                    return Err(format!(
                        "Website API upload khong san sang (HTTP {status}) khi upload {file_name}. Hay deploy website co endpoint /api/tlora/upload va kiem tra API key. {message}"
                    ));
                }
                if status.as_u16() == 404 {
                    return Err(format!(
                        "Website API khong tim thay gallery khi upload {file_name} (HTTP {status}). Hay dong bo album len website truoc. {message}"
                    ));
                }
                errors.push(format!("{file_name}: HTTP {status} {message}"));
                on_progress(UploadDriveFilesProgress {
                    album_path: album.album_path.clone(),
                    kind: kind.clone(),
                    current,
                    total,
                    uploaded,
                    failed,
                    file_name,
                    status: "failed".to_string(),
                });
            }
            Err(err) => {
                failed += 1;
                errors.push(format!("{file_name}: {err}"));
                on_progress(UploadDriveFilesProgress {
                    album_path: album.album_path.clone(),
                    kind: kind.clone(),
                    current,
                    total,
                    uploaded,
                    failed,
                    file_name,
                    status: "failed".to_string(),
                });
            }
        }
    }

    Ok(UploadDriveFilesResult {
        uploaded,
        failed,
        source_dir: source_dir.to_string_lossy().to_string(),
        files,
        drive_files,
        errors,
    })
}

pub fn update_album_links(payload: UpdateAlbumLinksPayload) -> Result<AlbumWorkflow, String> {
    let album_path = Path::new(&payload.album_path);
    let mut album = read_album_manifest(album_path)
        .ok_or_else(|| "Khong tim thay manifest album.".to_string())?;

    album.drive_file_goc_url = payload.drive_file_goc_url;
    album.drive_file_chinh_sua_url = payload.drive_file_chinh_sua_url;
    album.website_url = payload.website_url;
    write_album_manifest(&album)?;

    Ok(album)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parse_requested_files_keeps_spaces_around_extension() {
        let files =
            parse_requested_files("\"ABC011. JPG\"\nfolder\\ABC012.JPG, ABC011.JPG;ABC013.CR3");

        assert_eq!(files, vec!["abc011", "abc012", "abc013"]);
    }

    #[test]
    fn prepare_edit_batch_reads_raw_recursively_and_falls_back_to_jpg() {
        let temp_dir =
            std::env::temp_dir().join(format!("tlora-prepare-edit-test-{}", std::process::id()));
        let _ = fs::remove_dir_all(&temp_dir);
        let album_root = temp_dir.join("album");
        let album = make_album_workflow("TEST_16.06", "TEST", &album_root);
        fs::create_dir_all(Path::new(&album.raw_dir).join("sub")).unwrap();
        fs::create_dir_all(&album.jpg_dir).unwrap();
        fs::create_dir_all(&album.edit_request_dir).unwrap();
        fs::create_dir_all(&album.edited_dir).unwrap();
        write_album_manifest(&album).unwrap();

        fs::write(
            Path::new(&album.raw_dir).join("sub").join("ABC001.CR3"),
            b"raw",
        )
        .unwrap();
        fs::write(Path::new(&album.jpg_dir).join("ABC002.JPG"), b"jpg").unwrap();

        let result = prepare_edit_batch(PrepareEditBatchPayload {
            album_path: album.album_path.clone(),
            selected_files_text: "ABC001.JPG\nABC002.JPG\nABC003.JPG".to_string(),
            output_dir: None,
            use_jpeg_fallback: Some(true),
        })
        .unwrap();

        assert_eq!(result.requested, 3);
        assert_eq!(result.matched, 2);
        assert_eq!(result.copied, 2);
        assert_eq!(result.missing, 1);
        assert!(Path::new(&album.edit_request_dir)
            .join("ABC001.CR3")
            .exists());
        assert!(Path::new(&album.edit_request_dir)
            .join("ABC002.JPG")
            .exists());
        assert_eq!(result.missing_files, vec!["abc003"]);

        fs::remove_dir_all(temp_dir).unwrap();
    }

    #[test]
    fn upload_done_batch_only_accepts_jpg_files() {
        let temp_dir =
            std::env::temp_dir().join(format!("tlora-done-upload-test-{}", std::process::id()));
        let source = temp_dir.join("FILE DONE");
        let destination = temp_dir.join("drive-edited");
        fs::create_dir_all(&source).unwrap();

        fs::write(source.join("done-a.jpg"), b"jpg").unwrap();
        fs::write(source.join("done-b.JPEG"), b"jpeg").unwrap();
        fs::write(source.join("skip.png"), b"png").unwrap();
        fs::write(source.join("skip.cr3"), b"raw").unwrap();

        let result = upload_edited_batch(UploadEditedBatchPayload {
            source_dir: source.to_string_lossy().to_string(),
            destination_dir: destination.to_string_lossy().to_string(),
        })
        .unwrap();

        assert_eq!(result.uploaded, 2);
        assert!(destination.join("done-a.jpg").exists());
        assert!(destination.join("done-b.JPEG").exists());
        assert!(!destination.join("skip.png").exists());
        assert!(!destination.join("skip.cr3").exists());

        fs::remove_dir_all(temp_dir).unwrap();
    }
}
