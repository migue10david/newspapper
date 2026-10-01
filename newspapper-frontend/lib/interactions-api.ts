import axios, { type AxiosInstance } from 'axios';
import { authenticatedApi } from './authenticated-api';

export type ReactionType = 'like' | 'useful';
export type CommentStatus = 'pending' | 'published' | 'hidden';

export interface PublicComment {
  id: string;
  body: string;
  version: number;
  author: { id: string; displayName: string };
  createdAt: string;
}

export interface PublicInteractions {
  comments: PublicComment[];
  reactions: Record<ReactionType, number>;
  totalComments: number;
}

export interface OwnerComment {
  id: string;
  newsId: string;
  userId: string;
  body: string;
  status: CommentStatus;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface ManageComment {
  id: string;
  body: string;
  status: CommentStatus;
  version: number;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  newsId: string;
  newsTitle: string;
  authorId: string;
  authorName: string;
}

export interface PaginatedComments {
  items: ManageComment[];
  page: number;
  size: number;
  total: number;
}

export interface ManageCommentsParams {
  page?: number;
  size?: number;
  status?: CommentStatus;
  newsId?: string;
}

export class InteractionsApiError extends Error {
  constructor(message: string, public readonly status?: number) {
    super(message);
    this.name = 'InteractionsApiError';
  }
}

const publicHttpClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3001',
  timeout: 10_000,
  withCredentials: true,
  headers: { Accept: 'application/json' },
});

function toError(error: unknown): InteractionsApiError {
  if (axios.isAxiosError(error)) {
    const response = error.response?.data;
    const message =
      typeof response === 'object' && response !== null && 'message' in response
        ? Array.isArray(response.message)
          ? response.message.join(', ')
          : String(response.message)
        : error.message;
    const status = error.response?.status;
    return new InteractionsApiError(
      `API error${status ? ` ${status}` : ''}: ${message}`,
      status,
    );
  }
  return new InteractionsApiError(
    error instanceof Error ? error.message : 'Unexpected interactions API error',
  );
}

export function createInteractionsApi(
  publicClient: AxiosInstance = publicHttpClient,
  privateClient: AxiosInstance = authenticatedApi,
) {
  return {
    async getPublic(slug: string): Promise<PublicInteractions> {
      try {
        const response = await publicClient.get<PublicInteractions>(
          `/public/news/${encodeURIComponent(slug)}/interactions`,
        );
        return response.data;
      } catch (error: unknown) {
        throw toError(error);
      }
    },
    async createComment(newsId: string, body: string): Promise<OwnerComment> {
      try {
        const response = await privateClient.post<OwnerComment>(
          `/news/${newsId}/comments`,
          { body },
        );
        return response.data;
      } catch (error: unknown) {
        throw toError(error);
      }
    },
    async updateComment(
      id: string,
      input: { body: string; version: number },
    ): Promise<OwnerComment> {
      try {
        const response = await privateClient.patch<OwnerComment>(
          `/comments/${id}`,
          input,
        );
        return response.data;
      } catch (error: unknown) {
        throw toError(error);
      }
    },
    async removeComment(id: string): Promise<void> {
      try {
        await privateClient.delete(`/comments/${id}`);
      } catch (error: unknown) {
        throw toError(error);
      }
    },
    async setReaction(newsId: string, type: ReactionType) {
      try {
        const response = await privateClient.put(
          `/news/${newsId}/reaction`,
          { type },
        );
        return response.data as { newsId: string; userId: string; type: ReactionType };
      } catch (error: unknown) {
        throw toError(error);
      }
    },
    async removeReaction(newsId: string): Promise<void> {
      try {
        await privateClient.delete(`/news/${newsId}/reaction`);
      } catch (error: unknown) {
        throw toError(error);
      }
    },
    async listManageComments(params: ManageCommentsParams = {}): Promise<PaginatedComments> {
      try {
        const response = await privateClient.get<PaginatedComments>('/comments/manage', { params });
        return response.data;
      } catch (error: unknown) {
        throw toError(error);
      }
    },
    async moderateComment(
      id: string,
      input: { status: CommentStatus; version: number },
    ): Promise<ManageComment> {
      try {
        const response = await privateClient.patch<ManageComment>(
          `/comments/${id}/moderation`,
          input,
        );
        return response.data;
      } catch (error: unknown) {
        throw toError(error);
      }
    },
  };
}

export const interactionsApi = createInteractionsApi();
