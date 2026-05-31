use crate::error::{AppError, AppResult};
use crate::models::types::CaptureResult;
use crate::state::AppState;
use base64::{engine::general_purpose, Engine as _};
use std::fs;
use std::path::PathBuf;
use tauri::Manager;
use tauri_plugin_dialog::DialogExt;

/// Save a PNG (base64, no prefix) to disk via a Save dialog. Returns the path.
#[tauri::command]
pub async fn save_file(
    app: tauri::AppHandle,
    png_base64: String,
    suggested_name: String,
) -> AppResult<String> {
    let bytes = general_purpose::STANDARD
        .decode(png_base64.as_bytes())
        .map_err(|e| AppError::Decode(e.to_string()))?;

    // Blocking dialog on a worker thread; pick a destination path.
    let (tx, rx) = std::sync::mpsc::channel();
    app.dialog()
        .file()
        .set_file_name(&suggested_name)
        .add_filter("PNG Image", &["png"])
        .save_file(move |path| {
            let _ = tx.send(path);
        });

    let chosen = rx
        .recv()
        .map_err(|e| AppError::State(e.to_string()))?;

    let path = match chosen {
        Some(p) => p.into_path().map_err(|e| AppError::State(e.to_string()))?,
        None => return Err(AppError::State("Save cancelled".into())),
    };

    fs::write(&path, &bytes)?;
    log::info!("saved screenshot to {:?}", path);
    Ok(path.to_string_lossy().to_string())
}

/// Stash a capture so another window (editor) can fetch it by id.
#[tauri::command]
pub fn set_capture(state: tauri::State<'_, AppState>, capture: CaptureResult) -> AppResult<()> {
    let mut map = state
        .captures
        .lock()
        .map_err(|e| AppError::State(e.to_string()))?;
    map.insert(capture.id.clone(), capture);
    Ok(())
}

/// Fetch (and remove) a previously stashed capture by id.
#[tauri::command]
pub fn get_capture(
    state: tauri::State<'_, AppState>,
    id: String,
) -> AppResult<Option<CaptureResult>> {
    let mut map = state
        .captures
        .lock()
        .map_err(|e| AppError::State(e.to_string()))?;
    Ok(map.remove(&id))
}

/// Returns the app data directory (used by the frontend storage service).
#[tauri::command]
pub fn app_data_path(app: tauri::AppHandle) -> AppResult<String> {
    let dir: PathBuf = app
        .path()
        .app_data_dir()
        .map_err(|e| AppError::State(e.to_string()))?;
    fs::create_dir_all(&dir)?;
    Ok(dir.to_string_lossy().to_string())
}
