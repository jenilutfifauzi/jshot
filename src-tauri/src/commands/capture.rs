use crate::error::{AppError, AppResult};
use crate::models::types::{CaptureResult, Region};
use base64::{engine::general_purpose, Engine as _};
use image::ImageFormat;
use std::io::Cursor;
use uuid::Uuid;
use xcap::Monitor;

fn primary_monitor() -> AppResult<Monitor> {
    let monitors = Monitor::all().map_err(|e| AppError::Capture(e.to_string()))?;
    // Prefer the OS-designated primary monitor; fall back to the first one.
    let mut first: Option<Monitor> = None;
    for m in monitors {
        if first.is_none() {
            first = Some(m.clone());
        }
        if m.is_primary().unwrap_or(false) {
            return Ok(m);
        }
    }
    first.ok_or_else(|| AppError::Capture("No monitor found".into()))
}

fn encode_png_data_url(img: &image::RgbaImage) -> AppResult<String> {
    let mut buf = Cursor::new(Vec::new());
    img.write_to(&mut buf, ImageFormat::Png)
        .map_err(|e| AppError::Encode(e.to_string()))?;
    let b64 = general_purpose::STANDARD.encode(buf.get_ref());
    Ok(format!("data:image/png;base64,{}", b64))
}

/// Capture the whole primary monitor.
#[tauri::command]
pub async fn capture_fullscreen() -> AppResult<CaptureResult> {
    let monitor = primary_monitor()?;
    let image = monitor
        .capture_image()
        .map_err(|e| AppError::Capture(e.to_string()))?;

    let (width, height) = (image.width(), image.height());
    let data_url = encode_png_data_url(&image)?;

    log::info!("captured fullscreen {}x{}", width, height);
    Ok(CaptureResult {
        id: Uuid::new_v4().to_string(),
        width,
        height,
        data_url,
    })
}

/// Capture a sub-region (native pixel coords) of the primary monitor.
#[tauri::command]
pub async fn capture_region(region: Region) -> AppResult<CaptureResult> {
    if region.width == 0 || region.height == 0 {
        return Err(AppError::Capture("Empty region".into()));
    }

    let monitor = primary_monitor()?;
    let max_w = monitor
        .width()
        .map_err(|e| AppError::Capture(e.to_string()))?;
    let max_h = monitor
        .height()
        .map_err(|e| AppError::Capture(e.to_string()))?;

    let x = region.x.max(0) as u32;
    let y = region.y.max(0) as u32;
    if x >= max_w || y >= max_h {
        return Err(AppError::Capture("Region outside monitor bounds".into()));
    }

    // Clamp so the crop never exceeds the monitor frame.
    let w = region.width.min(max_w - x);
    let h = region.height.min(max_h - y);

    let cropped = monitor
        .capture_region(x, y, w, h)
        .map_err(|e| AppError::Capture(e.to_string()))?;
    let data_url = encode_png_data_url(&cropped)?;

    log::info!("captured region {}x{} at ({},{})", w, h, x, y);
    Ok(CaptureResult {
        id: Uuid::new_v4().to_string(),
        width: w,
        height: h,
        data_url,
    })
}
