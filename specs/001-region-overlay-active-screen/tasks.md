# Tasks: 001-region-overlay-active-screen

**Spec:** ./spec.md · **Plan:** ./plan.md

## Phase 1 — Foundation (blocks all)
- [ ] T001 Confirm Tauri 2.11 monitor APIs available: `AppHandle::monitor_from_point`,
  `cursor_position`, `primary_monitor`; `WebviewWindowBuilder::{position,inner_size,
  visible_on_all_workspaces}`. (verified during planning)

## Phase 2 — Rust implementation (US-1, US-2, US-3 min)
- [ ] T002 Add `pick_target_monitor(app)` helper in `src-tauri/src/commands/window.rs`:
  cursor position → `monitor_from_point`, fallback `primary_monitor`. (US-3 min, FR-1)
- [ ] T003 Rewrite `open_overlay()`: remove `.fullscreen(true)`; size+position to target
  monitor bounds; add `#[cfg(target_os="macos")] .visible_on_all_workspaces(true)`;
  keep transparent/decorations(false)/always_on_top/skip_taskbar; resizable(false).
  (FR-1, FR-2, FR-3, FR-7)
- [ ] T004 Harden reuse path: existing `overlay` window is repositioned to the target
  monitor + shown + focused, not rebuilt. (FR-5)

## Phase 3 — Verification
- [ ] T005 `cargo check` locally (Linux) — compile gate. Install `libpipewire-0.3-dev`
  if xcap 0.9 demands it.
- [ ] T006 Commit on branch `001-region-overlay-active-screen`, push, trigger macOS CI
  (`build-macos.yml`); both arch green. (SC build gate)
- [ ] T007 Manual macOS QA on `.dmg`: overlay on active Space, no swipe, Retina pixel
  match, Esc/empty-click clean, 20× no leak. (SC-1..SC-4)
- [ ] T008 Linux non-regression spot check. (SC-5)
- [ ] T009 Tag `v0.1.1`, CI auto-release.

## Traceability
| FR | Tasks |
|----|-------|
| FR-1 active-Space overlay | T002, T003 |
| FR-2 transient borderless | T003 |
| FR-3 ≤200ms | T003 |
| FR-4 clean dismiss | (existing OverlayWindow + close_overlay) T007 |
| FR-5 reuse not rebuild | T004 |
| FR-6 HiDPI pixels | T007 (existing DPR math) |
| FR-7 no Linux regression | T003, T008 |
| FR-8 other features unchanged | T003 (scope-limited) |
