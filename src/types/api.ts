export interface UploadResponse {
  success: boolean;
  url: string; // shareable link
  deleteUrl?: string;
  id: string;
  expiresAt?: number;
}
