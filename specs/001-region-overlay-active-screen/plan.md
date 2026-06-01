# Implementation Plan: 001-region-overlay-active-screen

**Spec:** ./spec.md
**Stack:** Tauri 2.0 (Rust) + React 18 + TypeScript + Vite + Tailwind + Zustand

## Root Cause Analysis

The region overlay window is created in `src-tauri/src/commands/window.rs` →
`open_overlay()` with:

```rust
WebviewWindowBuilder::new(&app, "overlay", WebviewUrl::App("index.html".into()))
    .transparent(true)
    .decorations(false)
    .always_on_top(true)
    .skip_taskbar(true)
    .fullscreen(true)   // <-- the bug on macOS
    .build()?;
```

On **macOS**, `.fullscreen(true)` maps to the native AppKit fullscreen presentation
(`toggleFullScreen:`), which moves the window into its **own dedicated Space** with the
standard swipe animation. That is what the user perceives as "Capture Region opens a new
window" — the overlay leaves the active desktop instead of layering over it.

On Linux/Windows, `.fullscreen(true)` simply maximizes to cover the active screen, so the
bug is macOS-specific.

## Fix Strategy

Replace native fullscreen with a **borderless window sized to the active monitor**, and on
macOS make it ride along with the current Space instead of creating its own:

1. Do **not** use `.fullscreen(true)`. Instead size/position the window to the target
   monitor's full bounds via `.inner_size(w, h)` + `.position(x, y)`.
2. On macOS, set `.visible_on_all_workspaces(true)` so the overlay shows on whatever Space
   is currently active (no Space switch). This is the key macOS-specific fix.
3. Keep `.transparent(true)`, `.decorations(false)`, `.always_on_top(true)`,
   `.skip_taskbar(true)`.
4. Resolve the **target monitor** from the cursor position
   (`app.cursor_position()` → matching `Monitor`), falling back to the primary monitor.
   This covers US-3's minimum-acceptable behavior without a large change.
5. Ensure idempotency: if an `overlay` window already exists, reposition + show + focus it
   rather than building a second one (FR-5). Already partially handled; harden it.

## Affected Files

| File | Change |
|------|--------|
| `src-tauri/src/commands/window.rs` | Rewrite `open_overlay()` to size-to-monitor + `visible_on_all_workspaces` on macOS; harden reuse path. |
| `src-tauri/Cargo.toml` | No new deps expected (monitor APIs are in `tauri`). Confirm `macos-private-api` stays. |
| `src/windows/OverlayWindow.tsx` | No logic change required; verify DPR math still maps to native pixels given the new non-fullscreen sizing. |

No frontend store/service changes anticipated. The React overlay already drags + calls
`captureRegion`; we only change *how the host window is presented*.

## Technical Detail — `open_overlay()` rewrite

Pseudostructure:

```rust
#[tauri::command]
pub fn open_overlay(app: tauri::AppHandle) -> AppResult<()> {
    // 1. Pick target monitor (cursor monitor, else primary).
    let monitor = pick_target_monitor(&app)?;     // returns tauri::Monitor
    let pos  = monitor.position();                // PhysicalPosition<i32>
    let size = monitor.size();                    // PhysicalSize<u32>

    // 2. Reuse existing overlay if present.
    if let Some(win) = app.get_webview_window("overlay") {
        let _ = win.set_position(PhysicalPosition::new(pos.x, pos.y));
        let _ = win.set_size(PhysicalSize::new(size.width, size.height));
        let _ = win.show();
        let _ = win.set_focus();
        return Ok(());
    }

    // 3. Build borderless, monitor-sized, transient overlay.
    let mut builder = WebviewWindowBuilder::new(&app, "overlay", WebviewUrl::App("index.html".into()))
        .title("JShot Overlay")
        .transparent(true)
        .decorations(false)
        .always_on_top(true)
        .skip_taskbar(true)
        .resizable(false)
        .position(pos.x as f64, pos.y as f64)
        .inner_size(size.width as f64, size.height as f64);

    #[cfg(target_os = "macos")]
    {
        builder = builder.visible_on_all_workspaces(true);
    }

    builder.build().map_err(|e| AppError::Window(e.to_string()))?;
    Ok(())
}
```

`pick_target_monitor` uses `app.cursor_position()` and `app.available_monitors()`,
matching the monitor whose bounds contain the cursor; falls back to
`app.primary_monitor()`.

## DPR / Retina note (FR-6)

`OverlayWindow.tsx` already multiplies the CSS-pixel selection by
`window.devicePixelRatio`. Because the window now exactly covers one monitor starting at
that monitor's physical origin, the region origin passed to `capture_region` must be
**monitor-relative native pixels**. Since `xcap 0.9`'s `capture_region` is monitor-local,
and the overlay covers exactly that monitor, the existing `clientX * dpr` math remains
correct for the single-monitor case. Verify on Retina during QA (SC-3).

## Test / Verification Strategy

This is a Rust + native-window behavior fix; the meaningful verification is on a macOS
build (cannot be exercised from the Linux dev host).

1. **Compile gate (local Linux):** `cargo check` must pass (with the new monitor APIs).
   Note Linux needs `libpipewire-0.3-dev` for xcap 0.9.
2. **macOS build gate (CI):** push a branch / tag to trigger
   `.github/workflows/build-macos.yml`; both arm64 + x64 must build green.
3. **Manual macOS QA (SC-1..SC-4):**
   - Trigger Capture Region from an arbitrary app/desktop → overlay layers over the
     current Space, no swipe animation, no new window in Mission Control. (SC-1)
   - Drag-select → captured pixels match selection on Retina. (SC-3)
   - Esc / empty click → returns to prior context, no orphan window. (SC-4)
   - 20× trigger/dismiss cycles → no window accumulation. (SC-4)
4. **Linux non-regression (SC-5):** existing region capture still covers active screen.

## Rollout

1. Branch `001-region-overlay-active-screen`.
2. Implement Rust change, `cargo check` locally.
3. Commit + push, trigger macOS CI build.
4. Manual QA on the produced `.dmg`.
5. Tag a patch release (e.g. `v0.1.1`) once verified.
