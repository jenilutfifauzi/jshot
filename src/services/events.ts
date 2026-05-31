import { listen, type UnlistenFn } from '@tauri-apps/api/event';
import type { Region } from '@/types';

/** Event names emitted by the Rust core. */
export const Events = {
  TriggerCaptureRegion: 'trigger-capture-region',
  TriggerCaptureFullscreen: 'trigger-capture-fullscreen',
  RegionSelected: 'region-selected',
  OverlayCancelled: 'overlay-cancelled',
} as const;

export function onTriggerCaptureRegion(cb: () => void): Promise<UnlistenFn> {
  return listen(Events.TriggerCaptureRegion, () => cb());
}

export function onTriggerCaptureFullscreen(cb: () => void): Promise<UnlistenFn> {
  return listen(Events.TriggerCaptureFullscreen, () => cb());
}

export function onRegionSelected(
  cb: (region: Region) => void,
): Promise<UnlistenFn> {
  return listen<Region>(Events.RegionSelected, (e) => cb(e.payload));
}
