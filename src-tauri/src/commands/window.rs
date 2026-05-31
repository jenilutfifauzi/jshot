use crate::error::{AppError, AppResult};
use tauri::{Manager, WebviewUrl, WebviewWindowBuilder};

fn focus_or_build<F>(
    app: &tauri::AppHandle,
    label: &str,
    builder: F,
) -> AppResult<()>
where
    F: FnOnce(&tauri::AppHandle) -> WebviewWindowBuilder<'_, tauri::Wry, tauri::AppHandle>,
{
    if let Some(win) = app.get_webview_window(label) {
        win.show().ok();
        win.set_focus().ok();
        return Ok(());
    }
    builder(app)
        .build()
        .map_err(|e| AppError::Window(e.to_string()))?;
    Ok(())
}

/// Transparent, fullscreen, always-on-top overlay for region selection.
#[tauri::command]
pub fn open_overlay(app: tauri::AppHandle) -> AppResult<()> {
    if let Some(win) = app.get_webview_window("overlay") {
        win.show().ok();
        win.set_focus().ok();
        return Ok(());
    }
    WebviewWindowBuilder::new(&app, "overlay", WebviewUrl::App("index.html".into()))
        .title("JShot Overlay")
        .transparent(true)
        .decorations(false)
        .always_on_top(true)
        .skip_taskbar(true)
        .fullscreen(true)
        .build()
        .map_err(|e| AppError::Window(e.to_string()))?;
    log::info!("overlay window opened");
    Ok(())
}

#[tauri::command]
pub fn close_overlay(app: tauri::AppHandle) -> AppResult<()> {
    if let Some(win) = app.get_webview_window("overlay") {
        win.close().map_err(|e| AppError::Window(e.to_string()))?;
    }
    Ok(())
}

#[tauri::command]
pub fn open_editor(app: tauri::AppHandle, capture_id: String) -> AppResult<()> {
    let url = format!("index.html?captureId={}", capture_id);
    if let Some(win) = app.get_webview_window("editor") {
        // Re-navigate existing editor to the new capture.
        win.eval(&format!(
            "window.location.search = '?captureId={}';",
            capture_id
        ))
        .ok();
        win.show().ok();
        win.set_focus().ok();
        return Ok(());
    }
    WebviewWindowBuilder::new(&app, "editor", WebviewUrl::App(url.into()))
        .title("JShot Editor")
        .inner_size(1000.0, 720.0)
        .resizable(true)
        .build()
        .map_err(|e| AppError::Window(e.to_string()))?;
    log::info!("editor window opened for capture {}", capture_id);
    Ok(())
}

#[tauri::command]
pub fn open_history(app: tauri::AppHandle) -> AppResult<()> {
    focus_or_build(&app, "history", |app| {
        WebviewWindowBuilder::new(app, "history", WebviewUrl::App("index.html".into()))
            .title("JShot History")
            .inner_size(760.0, 560.0)
    })
}

#[tauri::command]
pub fn open_settings(app: tauri::AppHandle) -> AppResult<()> {
    focus_or_build(&app, "settings", |app| {
        WebviewWindowBuilder::new(app, "settings", WebviewUrl::App("index.html".into()))
            .title("JShot Settings")
            .inner_size(620.0, 640.0)
    })
}
