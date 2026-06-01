use crate::error::{AppError, AppResult};
use tauri::{Manager, Monitor, PhysicalPosition, PhysicalSize, WebviewUrl, WebviewWindowBuilder};

/// Resolve the monitor the user is currently looking at: the one under the
/// cursor, falling back to the primary monitor. Used to lay the overlay over
/// the active screen instead of a native macOS fullscreen Space.
fn pick_target_monitor(app: &tauri::AppHandle) -> AppResult<Monitor> {
    if let Ok(pos) = app.cursor_position() {
        if let Ok(Some(monitor)) = app.monitor_from_point(pos.x, pos.y) {
            return Ok(monitor);
        }
    }
    match app.primary_monitor() {
        Ok(Some(monitor)) => Ok(monitor),
        Ok(None) => Err(AppError::Window("no monitor available".into())),
        Err(e) => Err(AppError::Window(e.to_string())),
    }
}

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

/// Transparent, borderless, always-on-top overlay for region selection.
///
/// IMPORTANT: we deliberately do NOT use `.fullscreen(true)`. On macOS that
/// triggers a native fullscreen Space (with a swipe animation), which makes the
/// overlay appear as a separate "new window" on its own desktop instead of
/// layering over the screen the user is actually looking at. Instead we size and
/// position a borderless window to exactly cover the active monitor, and on macOS
/// mark it visible on all workspaces so it rides along with the current Space.
#[tauri::command]
pub fn open_overlay(app: tauri::AppHandle) -> AppResult<()> {
    let monitor = pick_target_monitor(&app)?;
    let pos: PhysicalPosition<i32> = *monitor.position();
    let size: PhysicalSize<u32> = *monitor.size();

    // Reuse an existing overlay: reposition to the active monitor, show, focus.
    if let Some(win) = app.get_webview_window("overlay") {
        win.set_position(PhysicalPosition::new(pos.x, pos.y)).ok();
        win.set_size(PhysicalSize::new(size.width, size.height)).ok();
        win.show().ok();
        win.set_focus().ok();
        log::info!("overlay window reused on monitor at ({},{})", pos.x, pos.y);
        return Ok(());
    }

    #[allow(unused_mut)]
    let mut builder =
        WebviewWindowBuilder::new(&app, "overlay", WebviewUrl::App("index.html".into()))
            .title("JShot Overlay")
            .transparent(true)
            .decorations(false)
            .always_on_top(true)
            .skip_taskbar(true)
            .resizable(false)
            .position(pos.x as f64, pos.y as f64)
            .inner_size(size.width as f64, size.height as f64);

    // macOS-only: keep the overlay on the currently active Space instead of
    // spawning a dedicated fullscreen Space.
    #[cfg(target_os = "macos")]
    {
        builder = builder.visible_on_all_workspaces(true);
    }

    builder
        .build()
        .map_err(|e| AppError::Window(e.to_string()))?;
    log::info!(
        "overlay window opened on monitor {}x{} at ({},{})",
        size.width,
        size.height,
        pos.x,
        pos.y
    );
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
