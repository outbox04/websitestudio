use std::collections::HashMap;
use std::io::{Read, Write};
use std::net::TcpListener;
use std::thread;

use serde::Serialize;
use tauri::{AppHandle, Emitter};

const AUTH_LOOPBACK_PATH: &str = "/callback";
const GOOGLE_DRIVE_OAUTH_PATH: &str = "/oauth/google/callback";
const AUTH_LOOPBACK_EVENT: &str = "auth-loopback-callback";
const GOOGLE_DRIVE_OAUTH_EVENT: &str = "google-drive-oauth-callback";

#[derive(Clone)]
pub struct AuthLoopbackState {
    callback_url: String,
    google_drive_callback_url: String,
}

impl AuthLoopbackState {
    pub fn callback_url(&self) -> String {
        self.callback_url.clone()
    }

    pub fn google_drive_callback_url(&self) -> String {
        self.google_drive_callback_url.clone()
    }
}

#[derive(Debug, Serialize, Clone)]
pub struct AuthLoopbackCallbackPayload {
    pub code: Option<String>,
    pub error: Option<String>,
    pub error_description: Option<String>,
    pub state: Option<String>,
}

pub fn start_auth_loopback_server(app: &AppHandle) -> Result<AuthLoopbackState, String> {
    let listener = TcpListener::bind(("127.0.0.1", 0))
        .map_err(|e| format!("Khong mo duoc cong loopback auth: {e}"))?;
    let port = listener
        .local_addr()
        .map_err(|e| format!("Khong lay duoc port loopback auth: {e}"))?
        .port();
    let callback_url = format!("http://127.0.0.1:{port}{AUTH_LOOPBACK_PATH}");
    let google_drive_callback_url = format!("http://127.0.0.1:{port}{GOOGLE_DRIVE_OAUTH_PATH}");
    let app_handle = app.clone();

    thread::spawn(move || serve_auth_loopback(listener, app_handle));

    Ok(AuthLoopbackState {
        callback_url,
        google_drive_callback_url,
    })
}

fn serve_auth_loopback(listener: TcpListener, app: AppHandle) {
    let _ = listener.set_nonblocking(true);

    loop {
        match listener.accept() {
            Ok((mut stream, _addr)) => {
                let mut buffer = [0_u8; 8192];
                let read_count = stream.read(&mut buffer).unwrap_or(0);
                let request = String::from_utf8_lossy(&buffer[..read_count]);
                let request_line = request.lines().next().unwrap_or("");
                let target = request_line.split_whitespace().nth(1).unwrap_or("");
                let (path, query) = split_request_target(target);

                if path == AUTH_LOOPBACK_PATH || path == GOOGLE_DRIVE_OAUTH_PATH {
                    let payload = parse_payload(query);
                    let response_body = if payload.error.is_some() {
                        build_response_html("Dang nhap khong thanh cong. Ban co the dong cua so nay.")
                    } else {
                        build_response_html("Dang nhap thanh cong. Ban co the dong cua so nay va quay lai ung dung.")
                    };
                    let response = build_http_response(200, "OK", &response_body);
                    let _ = stream.write_all(response.as_bytes());
                    let _ = stream.flush();

                    let event_name = if path == GOOGLE_DRIVE_OAUTH_PATH {
                        GOOGLE_DRIVE_OAUTH_EVENT
                    } else {
                        AUTH_LOOPBACK_EVENT
                    };
                    let _ = app.emit(event_name, payload);
                } else {
                    let response_body = build_response_html("TLORA auth loopback server is running.");
                    let response = build_http_response(404, "Not Found", &response_body);
                    let _ = stream.write_all(response.as_bytes());
                    let _ = stream.flush();
                }
            }
            Err(error) if error.kind() == std::io::ErrorKind::WouldBlock => {
                thread::sleep(std::time::Duration::from_millis(100));
            }
            Err(_) => break,
        }
    }
}

fn split_request_target(target: &str) -> (&str, &str) {
    if let Some((path, query)) = target.split_once('?') {
        (path, query)
    } else {
        (target, "")
    }
}

fn parse_payload(query: &str) -> AuthLoopbackCallbackPayload {
    let params: HashMap<String, String> = url::form_urlencoded::parse(query.as_bytes())
        .into_owned()
        .collect();

    AuthLoopbackCallbackPayload {
        code: params.get("code").cloned(),
        error: params.get("error").cloned(),
        error_description: params.get("error_description").cloned(),
        state: params.get("state").cloned(),
    }
}

fn build_response_html(message: &str) -> String {
    format!(
        "<!doctype html><html lang=\"en\"><head><meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=device-width, initial-scale=1\"><title>TLORA Auth</title><style>body{{font-family:system-ui,sans-serif;background:#0f172a;color:#e2e8f0;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;padding:24px;text-align:center}}.card{{max-width:560px;border:1px solid rgba(148,163,184,.25);border-radius:20px;background:rgba(15,23,42,.92);padding:28px;box-shadow:0 20px 80px rgba(15,23,42,.45)}}h1{{margin:0 0 12px;font-size:20px}}p{{margin:0;line-height:1.6;color:#cbd5e1}}</style></head><body><div class=\"card\"><h1>TLORA</h1><p>{message}</p></div></body></html>"
    )
}

fn build_http_response(status_code: u16, status_text: &str, body: &str) -> String {
    format!(
        "HTTP/1.1 {status_code} {status_text}\r\nContent-Type: text/html; charset=utf-8\r\nContent-Length: {}\r\nConnection: close\r\n\r\n{body}",
        body.len()
    )
}
