use crate::error::{AppError, AppResult};
use base64::{engine::general_purpose, Engine as _};
use tauri_plugin_clipboard_manager::ClipboardExt;

/// Copy a PNG image (base64, no data: prefix) to the system clipboard.
#[tauri::command]
pub async fn copy_image(app: tauri::AppHandle, png_base64: String) -> AppResult<()> {
    let bytes = general_purpose::STANDARD
        .decode(png_base64.as_bytes())
        .map_err(|e| AppError::Decode(e.to_string()))?;

    let img = image::load_from_memory(&bytes)
        .map_err(|e| AppError::Decode(e.to_string()))?
        .to_rgba8();

    let (w, h) = (img.width(), img.height());
    let tauri_img = tauri::image::Image::new_owned(img.into_raw(), w, h);

    app.clipboard()
        .write_image(&tauri_img)
        .map_err(|e| AppError::Clipboard(e.to_string()))?;

    log::info!("copied image {}x{} to clipboard", w, h);
    Ok(())
}
