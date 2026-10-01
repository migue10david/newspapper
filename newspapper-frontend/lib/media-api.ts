import axios, { type AxiosInstance } from 'axios';
import { authenticatedApi } from './authenticated-api';

export interface MediaAsset {
  id: string;
  url: string;
  mime: string;
  size: number;
  alt: string | null;
}

export function createMediaApi(client: AxiosInstance = authenticatedApi) {
  return {
    async upload(file: File, alt: string): Promise<MediaAsset> {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('alt', alt);
      try {
        const response = await client.post<MediaAsset>('/media', formData);
        return response.data;
      } catch (error: unknown) {
        if (axios.isAxiosError(error)) {
          const message = typeof error.response?.data === 'object' && error.response.data !== null && 'message' in error.response.data && typeof error.response.data.message === 'string'
            ? error.response.data.message
            : error.message;
          throw new Error(message);
        }
        throw error instanceof Error ? error : new Error('No se pudo subir la imagen.');
      }
    },
  };
}

export const mediaApi = createMediaApi();

export function resolveMediaUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (/^https?:\/\//i.test(url)) return url;
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3001';
  return `${baseUrl.replace(/\/$/u, '')}/${url.replace(/^\//u, '')}`;
}
