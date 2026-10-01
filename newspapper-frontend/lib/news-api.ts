import axios, { type AxiosInstance } from 'axios';
import { authenticatedApi } from './authenticated-api';

export const NEWS_STATUSES = ['draft', 'inReview', 'scheduled', 'published', 'archived'] as const;
export type NewsStatus = (typeof NEWS_STATUSES)[number];

export interface ManagedNews {
  id: string;
  title: string;
  slug: string;
  summary: string;
  body: Array<{ type: string; text?: string; items?: string[]; url?: string; alt?: string }>;
  imageId: string | null;
  imageUrl: string | null;
  imageAlt: string | null;
  categoryId: string;
  categoryName: string;
  authorId: string;
  authorName: string;
  status: NewsStatus;
  publishedAt: string | null;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface ParagraphBlock { type: 'paragraph'; text: string }
export interface HeadingBlock { type: 'heading'; text: string }
export interface ListBlock { type: 'list'; items: string[] }
export interface ImageBlock { type: 'image'; url: string; alt: string }
export type NewsBodyBlock = ParagraphBlock | HeadingBlock | ListBlock | ImageBlock;

export interface NewsInput {
  title: string;
  summary: string;
  body: NewsBodyBlock[];
  categoryId: string;
  tagIds: string[];
  authorId?: string;
  imageId?: string | null;
  version?: number;
}

export interface NewsSearchParams {
  page?: number;
  size?: number;
  q?: string;
  status?: NewsStatus;
  category?: string;
  tag?: string;
  author?: string;
  from?: string;
  to?: string;
}

export interface PaginatedManagedNews {
  items: ManagedNews[];
  page: number;
  size: number;
  total: number;
}

export class NewsApiError extends Error {
  constructor(message: string, public readonly status?: number) {
    super(message);
    this.name = 'NewsApiError';
  }
}

function toError(error: unknown): NewsApiError {
  if (axios.isAxiosError(error)) {
    const message =
      typeof error.response?.data === 'object' &&
      error.response?.data !== null &&
      'message' in error.response.data &&
      typeof error.response.data.message === 'string'
        ? error.response.data.message
        : error.message;
    return new NewsApiError(message, error.response?.status);
  }
  return new NewsApiError(error instanceof Error ? error.message : 'Unexpected news API error');
}

export function createNewsApi(client: AxiosInstance = authenticatedApi) {
  return {
    async listNews(status?: NewsStatus): Promise<ManagedNews[]> {
      try {
        const response = await client.get<ManagedNews[]>('/news', {
          params: status ? { status } : undefined,
        });
        return response.data;
      } catch (error: unknown) {
        throw toError(error);
      }
    },
    async manageNews(params: NewsSearchParams = {}): Promise<PaginatedManagedNews> {
      try {
        const response = await client.get<PaginatedManagedNews>('/news/manage', {
          params,
        });
        return response.data;
      } catch (error: unknown) {
        throw toError(error);
      }
    },
    async getNews(id: string): Promise<ManagedNews> {
      try {
        const response = await client.get<ManagedNews>(`/news/${id}`);
        return response.data;
      } catch (error: unknown) {
        throw toError(error);
      }
    },
    async createNews(input: NewsInput): Promise<ManagedNews> {
      try {
        const response = await client.post<ManagedNews>('/news', input);
        return response.data;
      } catch (error: unknown) {
        throw toError(error);
      }
    },
    async updateNews(id: string, input: NewsInput): Promise<ManagedNews> {
      try {
        const response = await client.patch<ManagedNews>(`/news/${id}`, input);
        return response.data;
      } catch (error: unknown) {
        throw toError(error);
      }
    },
    async transitionNews(id: string, target: NewsStatus, version: number): Promise<ManagedNews> {
      try {
        const response = await client.post<ManagedNews>(`/news/${id}/transition`, {
          target,
          version,
        });
        return response.data;
      } catch (error: unknown) {
        throw toError(error);
      }
    },
  };
}

export const newsApi = createNewsApi();
