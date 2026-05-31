import type { UploadResponse } from '@/types';
import { logger } from '@/lib/logger';

/** Convert a data URL (data:image/png;base64,xxx) to a Blob for multipart upload. */
export function dataUrlToBlob(dataUrl: string): Blob {
  const [meta, b64] = dataUrl.split(',');
  const mime = meta.match(/:(.*?);/)?.[1] ?? 'image/png';
  const bin = atob(b64);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return new Blob([arr], { type: mime });
}

export interface UploadParams {
  dataUrl: string;
  endpoint: string;
  apiKey?: string | null;
  fieldName?: string;
}

/**
 * Generic multipart image upload. For providers needing signed credentials
 * (S3 presign), do the signing in a Rust command instead — never embed secrets here.
 */
export async function uploadImage({
  dataUrl,
  endpoint,
  apiKey,
  fieldName = 'image',
}: UploadParams): Promise<UploadResponse> {
  if (!endpoint) throw new Error('Upload endpoint not configured');

  const blob = dataUrlToBlob(dataUrl);
  const form = new FormData();
  form.append(fieldName, blob, `jshot-${Date.now()}.png`);

  logger.info('Uploading image', { endpoint, size: blob.size });

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: apiKey ? { Authorization: `Bearer ${apiKey}` } : undefined,
    body: form,
  });

  if (!res.ok) {
    throw new Error(`Upload failed: ${res.status} ${res.statusText}`);
  }

  const json = (await res.json()) as Partial<UploadResponse> & {
    data?: { url?: string };
  };

  // Be tolerant of common response shapes (imgbb-style nests under data.url).
  const url = json.url ?? json.data?.url;
  if (!url) throw new Error('Upload response missing URL');

  return {
    success: true,
    url,
    id: json.id ?? crypto.randomUUID(),
    deleteUrl: json.deleteUrl,
    expiresAt: json.expiresAt,
  };
}
