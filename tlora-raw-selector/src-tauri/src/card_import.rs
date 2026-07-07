use serde::{Deserialize, Serialize};
use std::fs;
use std::path::{Path, PathBuf};
use std::time::SystemTime;

use chrono::{DateTime, Datelike, Local, NaiveDate};
use tauri::Emitter;

use crate::workflow::{make_album_workflow, write_album_manifest};

/// RAW file extensions across major camera brands.
const RAW_EXTS: &[&str] = &[
    "cr2", "cr3", "crw", // Canon
    "nef", "nrw", // Nikon
    "arw", "srf", "sr2", // Sony
    "raf", // Fujifilm
    "orf", // Olympus
    "rw2", // Panasonic
    "pef", // Pentax
    "x3f", // Sigma
    "dng", // Adobe DNG
];

const JPG_EXTS: &[&str] = &["jpg", "jpeg"];

fn ext_lower(path: &Path) -> Option<String> {
    path.extension().map(|e| e.to_string_lossy().to_lowercase())
}

fn is_jpg(ext: &str) -> bool {
    JPG_EXTS.contains(&ext)
}

fn is_raw(ext: &str) -> bool {
    RAW_EXTS.contains(&ext)
}

fn collect_files(dir: &Path, files: &mut Vec<PathBuf>) {
    let entries = match fs::read_dir(dir) {
        Ok(e) => e,
        Err(_) => return,
    };
    for entry in entries.flatten() {
        let path = entry.path();
        if path.is_dir() {
            collect_files(&path, files);
        } else {
            files.push(path);
        }
    }
}

fn collect_files_checked(dir: &Path, files: &mut Vec<PathBuf>) -> Result<(), String> {
    let entries = fs::read_dir(dir)
        .map_err(|e| format!("Không đọc được thư mục {}: {e}", dir.to_string_lossy()))?;
    for entry in entries {
        let entry = entry.map_err(|e| {
            format!(
                "Không đọc được một mục trong {}: {e}",
                dir.to_string_lossy()
            )
        })?;
        let path = entry.path();
        if path.is_dir() {
            collect_files_checked(&path, files)?;
        } else {
            files.push(path);
        }
    }
    Ok(())
}

fn sanitize_path_component(input: &str, fallback: &str) -> String {
    let mut cleaned: String = input
        .trim()
        .chars()
        .map(|c| {
            if c.is_control() || matches!(c, '<' | '>' | ':' | '"' | '/' | '\\' | '|' | '?' | '*') {
                '_'
            } else {
                c
            }
        })
        .collect();

    cleaned = cleaned.trim_matches(|c| c == ' ' || c == '.').to_string();
    while cleaned.contains("__") {
        cleaned = cleaned.replace("__", "_");
    }

    if cleaned.is_empty() {
        fallback.to_string()
    } else {
        cleaned
    }
}

fn album_folder_name(customer_name: &str, shoot_date: &str) -> Result<(String, String), String> {
    let customer = sanitize_path_component(customer_name, "Khach_hang");
    if customer_name.trim().is_empty() {
        return Err("Vui lòng nhập tên khách hàng để đặt tên thư mục album.".into());
    }

    let date = NaiveDate::parse_from_str(shoot_date, "%Y-%m-%d")
        .map_err(|e| format!("Ngày chụp không hợp lệ: {e}"))?;
    let album_name = format!("{customer}_{:02}.{:02}", date.day(), date.month());
    Ok((album_name, date.year().to_string()))
}

fn unique_destination(target_dir: &Path, file_name: &str) -> PathBuf {
    let first = target_dir.join(file_name);
    if !first.exists() {
        return first;
    }

    let source_name = Path::new(file_name);
    let stem = source_name
        .file_stem()
        .map(|s| s.to_string_lossy().to_string())
        .unwrap_or_else(|| "file".to_string());
    let ext = source_name
        .extension()
        .map(|e| e.to_string_lossy().to_string());

    for i in 2..10_000 {
        let candidate = match &ext {
            Some(ext) if !ext.is_empty() => target_dir.join(format!("{stem}_{i}.{ext}")),
            _ => target_dir.join(format!("{stem}_{i}")),
        };
        if !candidate.exists() {
            return candidate;
        }
    }

    target_dir.join(format!("{stem}_copy"))
}

fn validate_split_destination(source_root: &Path, dest_root: &Path) -> Result<(), String> {
    if !dest_root.is_dir() {
        return Err("Thư mục lưu không tồn tại hoặc không phải là thư mục. Hãy chọn một thư mục trên máy tính hoặc ổ cứng làm nơi lưu album.".into());
    }

    let source_root = fs::canonicalize(source_root)
        .map_err(|e| format!("Không kiểm tra được thẻ nhớ đã chọn: {e}"))?;
    let dest_root =
        fs::canonicalize(dest_root).map_err(|e| format!("Không kiểm tra được thư mục lưu: {e}"))?;

    if dest_root.starts_with(&source_root) {
        return Err("Thư mục lưu đang nằm trên chính thẻ nhớ. Hãy chọn thư mục trên máy tính hoặc ổ cứng khác để app chỉ đọc từ thẻ và không ghi vào thẻ.".into());
    }

    Ok(())
}

fn format_date(t: SystemTime) -> String {
    let dt: DateTime<Local> = DateTime::from(t);
    dt.format("%d/%m/%Y").to_string()
}

fn brand_from_ext(ext: &str) -> &'static str {
    match ext {
        "cr2" | "cr3" | "crw" => "Canon",
        "nef" | "nrw" => "Nikon",
        "arw" | "srf" | "sr2" => "Sony",
        "raf" => "Fujifilm",
        "orf" => "Olympus",
        "rw2" => "Panasonic",
        "pef" => "Pentax",
        "x3f" => "Sigma",
        "dng" => "DNG (Adobe)",
        _ => "Không xác định",
    }
}

#[derive(Serialize)]
pub struct DriveInfo {
    pub path: String,
    pub label: String,
    pub has_dcim: bool,
}

#[tauri::command]
pub fn list_drives() -> Vec<DriveInfo> {
    let mut drives: Vec<DriveInfo> = Vec::new();

    #[cfg(target_os = "windows")]
    {
        for letter in 'D'..='Z' {
            let root = format!("{}:\\", letter);
            let root_path = Path::new(&root);
            if root_path.exists() {
                let has_dcim = root_path.join("DCIM").exists();
                drives.push(DriveInfo {
                    path: root.clone(),
                    label: format!("Ổ {}:", letter),
                    has_dcim,
                });
            }
        }
    }

    #[cfg(not(target_os = "windows"))]
    {
        for base in ["/Volumes", "/media"] {
            let entries = match fs::read_dir(base) {
                Ok(e) => e,
                Err(_) => continue,
            };
            for entry in entries.flatten() {
                let path = entry.path();
                if !path.is_dir() {
                    continue;
                }

                if path.join("DCIM").exists() {
                    drives.push(DriveInfo {
                        path: path.to_string_lossy().to_string(),
                        label: path
                            .file_name()
                            .map(|n| n.to_string_lossy().to_string())
                            .unwrap_or_default(),
                        has_dcim: true,
                    });
                    continue;
                }

                if let Ok(sub_entries) = fs::read_dir(&path) {
                    for sub in sub_entries.flatten() {
                        let sub_path = sub.path();
                        if sub_path.is_dir() && sub_path.join("DCIM").exists() {
                            drives.push(DriveInfo {
                                path: sub_path.to_string_lossy().to_string(),
                                label: sub_path
                                    .file_name()
                                    .map(|n| n.to_string_lossy().to_string())
                                    .unwrap_or_default(),
                                has_dcim: true,
                            });
                        }
                    }
                }
            }
        }
    }

    drives
}

#[derive(Serialize)]
pub struct CardScanResult {
    pub path: String,
    pub brand: String,
    pub folders: Vec<String>,
    pub jpg_count: u64,
    pub raw_count: u64,
    pub total_size: u64,
    pub first_date: Option<String>,
    pub last_date: Option<String>,
}

#[tauri::command]
pub fn scan_card(path: String) -> Result<CardScanResult, String> {
    let root = Path::new(&path);
    if !root.exists() {
        return Err(
            "Không tìm thấy ổ/thẻ nhớ đã chọn. Hãy cắm lại thẻ hoặc quét lại danh sách thiết bị."
                .into(),
        );
    }

    let dcim = root.join("DCIM");
    if !dcim.is_dir() {
        return Err("Không tìm thấy thư mục DCIM trên thẻ này. App chỉ đọc dữ liệu ảnh từ thư mục DCIM và không ghi vào thẻ.".into());
    }

    let mut folders: Vec<String> = Vec::new();
    let entries = fs::read_dir(&dcim)
        .map_err(|e| format!("Không đọc được thư mục DCIM trên thẻ này: {e}. Hãy kiểm tra quyền truy cập, đầu đọc thẻ hoặc tháo cắm lại thẻ."))?;
    for entry in entries.flatten() {
        let p = entry.path();
        if p.is_dir() {
            if let Some(name) = p.file_name() {
                folders.push(name.to_string_lossy().to_string());
            }
        }
    }
    folders.sort();

    let mut files = Vec::new();
    collect_files(&dcim, &mut files);

    let mut jpg_count: u64 = 0;
    let mut raw_count: u64 = 0;
    let mut total_size: u64 = 0;
    let mut brand: Option<&'static str> = None;
    let mut earliest: Option<SystemTime> = None;
    let mut latest: Option<SystemTime> = None;

    for f in &files {
        let ext = match ext_lower(f) {
            Some(e) => e,
            None => continue,
        };
        let jpg = is_jpg(&ext);
        let raw = is_raw(&ext);
        if !jpg && !raw {
            continue;
        }

        if let Ok(meta) = fs::metadata(f) {
            total_size += meta.len();
            if let Ok(modified) = meta.modified() {
                earliest = Some(match earliest {
                    Some(e) if modified < e => modified,
                    Some(e) => e,
                    None => modified,
                });
                latest = Some(match latest {
                    Some(l) if modified > l => modified,
                    Some(l) => l,
                    None => modified,
                });
            }
        }

        if jpg {
            jpg_count += 1;
        }
        if raw {
            raw_count += 1;
            if brand.is_none() {
                brand = Some(brand_from_ext(&ext));
            }
        }
    }

    Ok(CardScanResult {
        path: path.to_string(),
        brand: brand.unwrap_or("Không xác định (chỉ có JPG)").to_string(),
        folders,
        jpg_count,
        raw_count,
        total_size,
        first_date: earliest.map(format_date),
        last_date: latest.map(format_date),
    })
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SplitOptions {
    pub source: String,
    pub dest_root: String,
    pub customer_name: String,
    pub shoot_date: String,
}

#[derive(Serialize, Clone)]
pub struct SplitProgress {
    pub current: u64,
    pub total: u64,
    pub file_name: String,
}

#[derive(Serialize)]
pub struct SplitResult {
    pub album_name: String,
    pub album_path: String,
    pub jpg_count: u64,
    pub raw_count: u64,
    pub skipped: u64,
}

#[tauri::command]
pub async fn split_card(
    app: tauri::AppHandle,
    options: SplitOptions,
) -> Result<SplitResult, String> {
    let dcim = Path::new(&options.source).join("DCIM");
    if !dcim.is_dir() {
        return Err("Không tìm thấy thư mục DCIM trên thẻ này. App chỉ đọc dữ liệu ảnh từ thư mục DCIM và không ghi vào thẻ.".into());
    }

    if options.dest_root.trim().is_empty() {
        return Err("Vui lòng chọn thư mục lưu kết quả.".into());
    }
    if options.customer_name.trim().is_empty() {
        return Err("Vui lòng nhập tên khách hàng để đặt tên thư mục album.".into());
    }
    validate_split_destination(Path::new(&options.source), Path::new(&options.dest_root))?;

    let mut all_files = Vec::new();
    collect_files_checked(&dcim, &mut all_files)?;

    let files: Vec<PathBuf> = all_files
        .into_iter()
        .filter(|f| match ext_lower(f) {
            Some(ext) => is_jpg(&ext) || is_raw(&ext),
            None => false,
        })
        .collect();

    let total = files.len() as u64;
    if total == 0 {
        return Err("Không tìm thấy ảnh JPG hoặc RAW nào trên thẻ.".into());
    }

    let (album_name, shoot_year) = album_folder_name(&options.customer_name, &options.shoot_date)?;

    let album_root = Path::new(&options.dest_root)
        .join(shoot_year)
        .join(&album_name);
    let jpg_dir = album_root.join("FILE GỐC");
    let raw_dir = album_root.join("FILE RAW");
    let edit_request_dir = album_root.join("FILE CHỈNH SỬA");
    let edited_dir = album_root.join("FILE DONE");
    fs::create_dir_all(&edit_request_dir)
        .map_err(|e| format!("Không tạo được thư mục FILE CHỈNH SỬA: {e}"))?;
    fs::create_dir_all(&edited_dir)
        .map_err(|e| format!("Không tạo được thư mục FILE DONE: {e}"))?;
    fs::create_dir_all(&jpg_dir).map_err(|e| format!("Không tạo được thư mục FILE GỐC: {e}"))?;
    fs::create_dir_all(&raw_dir).map_err(|e| format!("Không tạo được thư mục FILE RAW: {e}"))?;

    let mut jpg_count: u64 = 0;
    let mut raw_count: u64 = 0;
    let mut skipped: u64 = 0;
    let mut copy_errors: Vec<String> = Vec::new();

    for (i, f) in files.iter().enumerate() {
        let ext = ext_lower(f).unwrap_or_default();
        let target_dir = if is_jpg(&ext) { &jpg_dir } else { &raw_dir };
        let file_name = f
            .file_name()
            .map(|n| n.to_string_lossy().to_string())
            .unwrap_or_default();
        let dest = unique_destination(target_dir, &file_name);

        match fs::copy(f, &dest) {
            Ok(_) => {
                if is_jpg(&ext) {
                    jpg_count += 1;
                } else {
                    raw_count += 1;
                }
            }
            Err(e) => {
                skipped += 1;
                if copy_errors.len() < 5 {
                    copy_errors.push(format!(
                        "{} -> {}: {e}",
                        f.to_string_lossy(),
                        dest.to_string_lossy()
                    ));
                }
            }
        }

        let _ = app.emit(
            "split-progress",
            SplitProgress {
                current: (i + 1) as u64,
                total,
                file_name,
            },
        );
    }

    if jpg_count + raw_count == 0 {
        let detail = if copy_errors.is_empty() {
            "Không có file nào được copy. Hãy kiểm tra thư mục lưu hoặc quyền đọc thẻ.".to_string()
        } else {
            format!("Chi tiết: {}", copy_errors.join("; "))
        };
        return Err(format!("Không tách được file trên thẻ. {detail}"));
    }

    let album_manifest =
        make_album_workflow(&album_name, options.customer_name.trim(), &album_root);
    write_album_manifest(&album_manifest)?;

    Ok(SplitResult {
        album_name,
        album_path: album_root.to_string_lossy().to_string(),
        jpg_count,
        raw_count,
        skipped,
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn detects_supported_extensions() {
        assert!(is_jpg("jpg"));
        assert!(is_jpg("jpeg"));
        assert!(is_raw("cr2"));
        assert!(is_raw("nef"));
        assert!(!is_raw("txt"));
    }

    #[test]
    fn sanitizes_album_folder_names_for_windows() {
        assert_eq!(
            sanitize_path_component("Khach/A:Album*01?", "Album"),
            "Khach_A_Album_01_"
        );
        assert_eq!(sanitize_path_component(" ... ", "Album"), "Album");
    }

    #[test]
    fn rejects_destination_inside_card_source() {
        let temp_dir =
            std::env::temp_dir().join(format!("tlora-card-dest-check-{}", std::process::id()));
        let source_dir = temp_dir.join("card");
        let dest_dir = source_dir.join("album-output");
        fs::create_dir_all(&dest_dir).unwrap();

        let result = validate_split_destination(&source_dir, &dest_dir);

        assert!(result.is_err());
        fs::remove_dir_all(temp_dir).unwrap();
    }

    #[test]
    fn builds_album_folder_name_from_customer_and_date() {
        let (album_name, year) = album_folder_name("Nguyen Van A", "2026-06-16").unwrap();

        assert_eq!(album_name, "Nguyen Van A_16.06");
        assert_eq!(year, "2026");
    }

    #[test]
    fn scans_dcim_folder_and_counts_files() {
        let temp_dir =
            std::env::temp_dir().join(format!("tlora-card-import-{}", std::process::id()));
        let dcim_dir = temp_dir.join("DCIM").join("100CANON");
        fs::create_dir_all(&dcim_dir).unwrap();
        fs::write(dcim_dir.join("sample.jpg"), b"jpg").unwrap();
        fs::write(dcim_dir.join("sample.CR2"), b"raw").unwrap();
        fs::write(dcim_dir.join("readme.txt"), b"text").unwrap();

        let result = scan_card(temp_dir.to_string_lossy().to_string()).unwrap();
        assert_eq!(result.jpg_count, 1);
        assert_eq!(result.raw_count, 1);
        assert_eq!(result.folders, vec!["100CANON"]);

        fs::remove_dir_all(temp_dir).unwrap();
    }

    #[test]
    fn deserializes_split_options_from_camel_case_payload() {
        let payload = r#"{
            "source": "D:\\",
            "destRoot": "C:\\Albums",
            "customerName": "Nguyen Van A",
            "shootDate": "2026-06-15"
        }"#;

        let options: SplitOptions = serde_json::from_str(payload).unwrap();

        assert_eq!(options.source, "D:\\");
        assert_eq!(options.dest_root, "C:\\Albums");
        assert_eq!(options.customer_name, "Nguyen Van A");
        assert_eq!(options.shoot_date, "2026-06-15");
    }
}
