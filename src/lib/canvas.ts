import type Konva from 'konva';

/**
 * Export a Konva Stage to a PNG data URL at native pixel ratio.
 * pixelRatio is forced to map 1:1 with the underlying screenshot resolution.
 */
export function stageToDataUrl(
  stage: Konva.Stage,
  pixelRatio = 1,
): string {
  return stage.toDataURL({ mimeType: 'image/png', pixelRatio });
}

/** Strip the `data:image/png;base64,` prefix, returning raw base64. */
export function dataUrlToBase64(dataUrl: string): string {
  const idx = dataUrl.indexOf(',');
  return idx >= 0 ? dataUrl.slice(idx + 1) : dataUrl;
}

/** Load an HTMLImageElement from a data URL (for Konva Image). */
export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}
