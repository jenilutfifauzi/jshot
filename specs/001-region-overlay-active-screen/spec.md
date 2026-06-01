# Feature Specification: Region Capture Overlay Stays on the Active Screen

**Feature ID:** 001-region-overlay-active-screen
**Status:** Draft
**Created:** 2026-06-01
**Owner:** JShot

## Summary

When a user triggers **Capture Region** on macOS, the selection overlay must appear
instantly on top of whatever they are currently looking at, on the screen and desktop
(Space) they are already using. Today, on macOS, triggering Capture Region instead
pushes a separate full-screen window onto its own macOS Space, animating the user away
from their current context. This breaks the core "point and shoot" expectation of a
Lightshot-style tool and makes region capture feel like opening a new app window.

This feature ensures the region-selection experience is a true transient overlay over
the live screen, on every supported OS, with macOS behaving the same as Linux and
Windows.

## Background & Motivation

JShot's promise is speed: shortcut → select area → annotate. The region overlay is the
first interaction the user sees after the shortcut. If that overlay does not sit over
the content they want to capture, the product feels broken even if capture technically
works.

On macOS specifically, users report that "Capture Region opens a new window" — the
overlay leaves the active desktop and appears as a distinct full-screen surface,
accompanied by the standard macOS Space-switch animation. The user then has to capture
content that is no longer in front of them, or the act of switching Spaces changes what
is on screen entirely.

## User Stories

### US-1 (Priority: P1) — Region overlay over the active screen on macOS
As a macOS user, when I press the Capture Region shortcut or click the Capture Region
menu item, I want the selection overlay to appear immediately on top of my current
screen and current desktop, so that I can drag to select exactly what I was already
looking at without being moved to a different Space.

**Acceptance scenarios**
1. **Given** the user is on macOS viewing any application on their active desktop,
   **when** they trigger Capture Region, **then** a dimmed selection overlay appears
   over that same desktop within ~200 ms, with no Space-switch animation and no
   separate window appearing in the window switcher / Mission Control as a normal app
   window.
2. **Given** the overlay is showing, **when** the user drags a rectangle and releases,
   **then** the captured pixels correspond to the area they selected on the screen they
   were already viewing.
3. **Given** the overlay is showing, **when** the user presses Esc or clicks without
   dragging, **then** the overlay disappears and the user is returned to exactly the
   same screen/desktop state they were in before, with no leftover window.

### US-2 (Priority: P1) — Consistent behavior across platforms
As a user on any supported OS (macOS, Linux, Windows), I want Capture Region to behave
the same way — an instant transient overlay over my current screen — so that the
product feels predictable regardless of platform.

**Acceptance scenarios**
1. **Given** the existing Linux behavior is correct (overlay covers the active screen),
   **when** the macOS fix is applied, **then** Linux behavior is unchanged and still
   covers the active screen.
2. **Given** any supported OS, **when** the overlay is dismissed, **then** no orphan
   overlay window remains and repeated triggers do not accumulate windows.

### US-3 (Priority: P2) — Overlay covers the screen the cursor is on (multi-monitor)
As a user with more than one monitor, when I trigger Capture Region, I want the overlay
to cover the screen where my cursor currently is, so the selection happens where my
attention is.

**Acceptance scenarios**
1. **Given** two monitors and the cursor on the secondary monitor, **when** the user
   triggers Capture Region, **then** the overlay covers the monitor the cursor is on and
   the captured pixels map to that monitor.

> Note: US-3 is a quality refinement. If full multi-monitor targeting is deferred, the
> minimum acceptable behavior is that the overlay reliably covers the primary monitor as
> a transient overlay (US-1), never a separate Space.

## Edge Cases

- Triggering Capture Region twice rapidly must not stack two overlays or leak a window.
- If the overlay is already open and the trigger fires again, it should reuse/refocus the
  existing overlay rather than create a second one.
- Dismissing with Esc while a drag is in progress must cancel cleanly with no capture and
  no residual window.
- A zero-size or tiny selection (a click) is treated as a cancel, not a capture.
- High-DPI / Retina screens: the selected on-screen rectangle must map to the correct
  native pixel region (no half-size or doubled captures).
- The overlay must never trap the user: Esc always restores the prior state.

## Functional Requirements

- **FR-1** Triggering Capture Region MUST present the selection overlay on the user's
  currently active screen and active desktop/Space, on macOS, without switching Spaces.
- **FR-2** The overlay MUST be a transient, borderless, always-on-top surface that does
  not present itself to the user as a standard application window (no title bar, not a
  separate Mission Control full-screen Space, not shown in the taskbar/dock as a normal
  window).
- **FR-3** The overlay MUST appear within ~200 ms of the trigger.
- **FR-4** Dismissing the overlay (Esc, empty click, or after a successful capture) MUST
  fully remove the overlay surface and return the user to their prior context with no
  leftover window.
- **FR-5** Re-triggering Capture Region while an overlay exists MUST NOT create a second
  overlay; it MUST reuse or refocus the existing one.
- **FR-6** The selected region MUST map to the correct native pixels on high-DPI
  displays.
- **FR-7** Existing Linux (and Windows, if supported) region-capture behavior MUST be
  preserved — the change MUST NOT regress platforms that already work.
- **FR-8** The fullscreen-capture path and all other existing capture/annotate/save/
  upload behavior MUST remain unchanged.

## Key Entities

- **Region overlay surface** — the transient on-screen selection layer; conceptually a
  single reusable surface, not a per-trigger new window.
- **Selection region** — the rectangle the user drags (origin x/y, width, height) in
  screen coordinates, resolved to native pixels for capture.
- **Active screen** — the display (and on macOS, the desktop/Space) the user is currently
  looking at when they trigger capture.

## Success Criteria

- **SC-1** On macOS, 100% of Capture Region triggers present the overlay on the active
  desktop with zero Space-switch animations (verified by manual QA on a macOS build).
- **SC-2** Time from trigger to visible overlay is ≤ 200 ms on a baseline Apple Silicon
  machine.
- **SC-3** Captured region pixels match the on-screen selection within ±1 px on both
  standard and Retina displays.
- **SC-4** No orphan overlay window remains after any dismissal path across 20
  consecutive trigger/dismiss cycles.
- **SC-5** Linux region capture continues to pass its existing manual QA unchanged.

## Assumptions

- The macOS build is distributed directly via `.dmg` (already outside the Mac App Store
  because the app uses private-API transparency), so platform-specific window behavior
  needed for a true overlay is acceptable.
- "Active screen" for the MVP of this fix may resolve to the primary monitor if full
  cursor-screen targeting (US-3) is deferred; this is acceptable as long as US-1 holds.
- No change to the global shortcut, editor, history, settings, clipboard, save, or upload
  features is required by this spec.

## Out of Scope

- Redesigning the annotation editor or its tools.
- Changing the upload/share pipeline.
- Adding a magnifier/loupe or color picker to the overlay (future enhancement).
- Windows-specific behavior beyond "do not regress" (no Windows build is shipped yet).
