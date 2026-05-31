use crate::error::{AppError, AppResult};
use base64::{engine::general_purpose, Engine as _};
use serde::{Deserialize, Serialize};

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UploadArgs {
    pub png_base64: String,
    pub endpoint: String,
    pub api_key: Option<String>,
    /// multipart field name (imgbb uses "image", many custom hosts too)
    #[serde(default = "default_field")]
    pub field_name: String,
    pub file_name: Option<String>,
}

fn default_field() -> String {
    "image".to_string()
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct UploadResponse {
    pub success: bool,
    pub url: String,
    pub raw: serde_json::Value,
}

/// Upload a PNG to a custom/imgbb-style multipart endpoint from Rust so any
/// secret (api key) never has to live in the frontend bundle.
#[tauri::command]
pub async fn upload_image(args: UploadArgs) -> AppResult<UploadResponse> {
    let bytes = general_purpose::STANDARD
        .decode(args.png_base64.as_bytes())
        .map_err(|e| AppError::Decode(e.to_string()))?;

    let file_name = args
        .file_name
        .unwrap_or_else(|| format!("jshot-{}.png", chrono_like_ts()));

    let part = reqwest::multipart::Part::bytes(bytes)
        .file_name(file_name)
        .mime_str("image/png")
        .map_err(|e| AppError::Upload(e.to_string()))?;

    let form = reqwest::multipart::Form::new().part(args.field_name, part);

    let client = reqwest::Client::new();
    let mut req = client.post(&args.endpoint).multipart(form);
    if let Some(key) = args.api_key.as_ref().filter(|k| !k.is_empty()) {
        req = req.bearer_auth(key);
    }

    let resp = req
        .send()
        .await
        .map_err(|e| AppError::Upload(e.to_string()))?;

    let status = resp.status();
    let body: serde_json::Value = resp
        .json()
        .await
        .unwrap_or_else(|_| serde_json::json!({}));

    if !status.is_success() {
        return Err(AppError::Upload(format!(
            "HTTP {}: {}",
            status,
            body
        )));
    }

    // Try common response shapes: { url }, { data: { url } }, { link }.
    let url = body
        .get("url")
        .or_else(|| body.pointer("/data/url"))
        .or_else(|| body.get("link"))
        .and_then(|v| v.as_str())
        .map(String::from)
        .ok_or_else(|| AppError::Upload("No URL field in response".into()))?;

    log::info!("uploaded image -> {}", url);
    Ok(UploadResponse {
        success: true,
        url,
        raw: body,
    })
}

/// Cheap timestamp without pulling chrono.
fn chrono_like_ts() -> u128 {
    use std::time::{SystemTime, UNIX_EPOCH};
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_millis())
        .unwrap_or(0)
}
