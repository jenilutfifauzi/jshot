mod commands;
mod error;
mod models;
mod state;

use state::AppState;
use tauri::Emitter;
use tauri_plugin_global_shortcut::{Code, Modifiers, Shortcut, ShortcutState};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // Default global shortcuts (match DEFAULT_SETTINGS in the frontend):
    //   region     = Ctrl/Cmd + Shift + S
    //   fullscreen = Ctrl/Cmd + Shift + F
    let region_sc = Shortcut::new(Some(Modifiers::SHIFT | Modifiers::CONTROL), Code::KeyS);
    let fullscreen_sc = Shortcut::new(Some(Modifiers::SHIFT | Modifiers::CONTROL), Code::KeyF);

    tauri::Builder::default()
        .plugin(tauri_plugin_log::Builder::new().build())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(
            tauri_plugin_global_shortcut::Builder::new()
                .with_handler(move |app, shortcut, event| {
                    if event.state() != ShortcutState::Pressed {
                        return;
                    }
                    if shortcut == &region_sc {
                        log::info!("global shortcut: capture region");
                        let _ = app.emit("trigger-capture-region", ());
                    } else if shortcut == &fullscreen_sc {
                        log::info!("global shortcut: capture fullscreen");
                        let _ = app.emit("trigger-capture-fullscreen", ());
                    }
                })
                .build(),
        )
        .manage(AppState::new())
        .setup(move |app| {
            use tauri_plugin_global_shortcut::GlobalShortcutExt;
            let gs = app.global_shortcut();
            if let Err(e) = gs.register(region_sc) {
                log::error!("failed to register region shortcut: {e}");
            }
            if let Err(e) = gs.register(fullscreen_sc) {
                log::error!("failed to register fullscreen shortcut: {e}");
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::capture::capture_fullscreen,
            commands::capture::capture_region,
            commands::clipboard::copy_image,
            commands::storage::save_file,
            commands::storage::set_capture,
            commands::storage::get_capture,
            commands::storage::app_data_path,
            commands::upload::upload_image,
            commands::window::open_overlay,
            commands::window::close_overlay,
            commands::window::open_editor,
            commands::window::open_history,
            commands::window::open_settings,
        ])
        .run(tauri::generate_context!())
        .expect("error while running JShot");
}
