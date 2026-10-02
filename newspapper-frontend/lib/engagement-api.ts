import axios, { type AxiosInstance } from 'axios';
import { authenticatedApi } from './authenticated-api';

export interface EngagementNewsItem {
  id: string;
  title: string;
  slug: string;
  summary: string;
  publishedAt: string;
  categoryId: string;
  authorId: string;
  imageId: string | null;
  imageUrl: string | null;
  imageAlt: string | null;
  savedAt?: string;
  lastReadAt?: string;
}

export interface PaginatedEngagementNews {
  items: EngagementNewsItem[];
  page: number;
  size: number;
  total: number;
}

export interface EngagementParams {
  page?: number;
  size?: number;
}

export interface SaveNewsResponse {
  newsId: string;
  saved: boolean;
}

export interface ReadNewsResponse {
  newsId: string;
  read: boolean;
  lastReadAt: string;
}

export class EngagementApiError extends Error {
  constructor(message: string, public readonly status?: number) {
    super(message);
    this.name = 'EngagementApiError';
  }
}

function toError(error: unknown): EngagementApiError {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data;
    const message =
      typeof data === 'object' && data !== null && 'message' in data
        ? Array.isArray(data.message)
          ? data.message.join(', ')
          : String(data.message)
        : error.message;
    return new EngagementApiError(
      `API error${error.response?.status ? ` ${error.response.status}` : ''}: ${message}`,
      error.response?.status,
    );
  }

  return new EngagementApiError(
    error instanceof Error ? error.message : 'Unexpected engagement API error',
  );
}

export function createEngagementApi(client: AxiosInstance = authenticatedApi) {
  return {
    async saveNews(newsId: string): Promise<SaveNewsResponse> {
      try {
        const response = await client.put<SaveNewsResponse>(`/news/${newsId}/save`);
        return response.data;
      } catch (error: unknown) {
        throw toError(error);
      }
    },
    async removeSavedNews(newsId: string): Promise<void> {
      try {
        await client.delete(`/news/${newsId}/save`);
      } catch (error: unknown) {
        throw toError(error);
      }
    },
    async listSavedNews(params: EngagementParams = {}): Promise<PaginatedEngagementNews> {
      try {
        const response = await client.get<PaginatedEngagementNews>('/me/saved-news', { params });
        return response.data;
      } catch (error: unknown) {
        throw toError(error);
      }
    },
    async recordReading(newsId: string): Promise<ReadNewsResponse> {
      try {
        const response = await client.post<ReadNewsResponse>(`/news/${newsId}/read`);
        return response.data;
      } catch (error: unknown) {
        throw toError(error);
      }
    },
    async listReadingHistory(params: EngagementParams = {}): Promise<PaginatedEngagementNews> {
      try {
        const response = await client.get<PaginatedEngagementNews>('/me/reading-history', { params });
        return response.data;
      } catch (error: unknown) {
        throw toError(error);
      }
    },
    async removeReadingHistory(newsId: string): Promise<void> {
      try {
        await client.delete(`/me/reading-history/${newsId}`);
      } catch (error: unknown) {
        throw toError(error);
      }
    },
    async clearReadingHistory(): Promise<void> {
      try {
        await client.delete('/me/reading-history');
      } catch (error: unknown) {
        throw toError(error);
      }
    },
  };
}

export const engagementApi = createEngagementApi();
