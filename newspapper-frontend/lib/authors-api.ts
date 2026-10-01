import axios, { type AxiosInstance } from 'axios';
import { authenticatedApi } from './authenticated-api';

export interface AuthorProfile {
  id: string;
  name: string;
  bio: string | null;
  photoUrl: string | null;
}

export class AuthorsApiError extends Error {
  constructor(message: string, public readonly status?: number) {
    super(message);
    this.name = 'AuthorsApiError';
  }
}

export function createAuthorsApi(client: AxiosInstance = authenticatedApi) {
  return {
    async listAuthors(): Promise<AuthorProfile[]> {
      try {
        const response = await client.get<AuthorProfile[]>('/authors');
        return response.data;
      } catch (error: unknown) {
        if (axios.isAxiosError(error)) {
          throw new AuthorsApiError(error.message, error.response?.status);
        }
        throw new AuthorsApiError(
          error instanceof Error ? error.message : 'Unexpected authors API error',
        );
      }
    },
  };
}

export const authorsApi = createAuthorsApi();
