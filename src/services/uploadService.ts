import api from './api';
import type { UploadResponse } from '../types/api.types';
import type { ApiResponse } from '../types/api.types';

export async function uploadFiles(files: File[]): Promise<UploadResponse[]> {
  const results: UploadResponse[] = [];
  for (const file of files) {
    const fd = new FormData();
    fd.append('file', file);
    const res = await api.post<ApiResponse<UploadResponse>>('/upload', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    results.push(res.data.data);
  }
  return results;
}

/** Convert a File to base64 string (for Groq Vision) */
export async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/** Create a local object URL preview */
export function createPreviewUrl(file: File): string {
  return URL.createObjectURL(file);
}

export function revokePreviewUrl(url: string): void {
  URL.revokeObjectURL(url);
}
