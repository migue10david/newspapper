import axios, { type AxiosError, type AxiosInstance } from 'axios';
import { authenticatedApi } from './authenticated-api';
import type { UserRole } from './auth-client';

export type { UserRole } from './auth-client';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  authorId: string | null;
}

export interface CreateUserInput {
  email: string;
  password: string;
  role: UserRole;
}

export class UsersApiError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = 'UsersApiError';
  }
}

function getErrorMessage(error: AxiosError<unknown>): string {
  const data = error.response?.data;

  if (typeof data === 'object' && data !== null && 'message' in data) {
    const message = data.message;
    if (typeof message === 'string') {
      return message;
    }
    if (Array.isArray(message) && message.every((item) => typeof item === 'string')) {
      return message.join(', ');
    }
  }

  return error.message;
}

function createUsersError(error: unknown): UsersApiError {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    return new UsersApiError(
      `Users API error${status ? ` ${status}` : ''}: ${getErrorMessage(error)}`,
      status,
      { cause: error },
    );
  }

  return new UsersApiError(
    error instanceof Error ? error.message : 'Unexpected users API error',
    undefined,
    { cause: error },
  );
}

export interface UsersApi {
  listUsers(): Promise<User[]>;
  createUser(input: CreateUserInput): Promise<User>;
  updateUserRole(id: string, role: UserRole): Promise<User>;
  updateUserAuthor(id: string, authorId: string | null): Promise<User>;
}

export function createUsersApi(
  client: AxiosInstance = authenticatedApi,
): UsersApi {
  return {
    async listUsers() {
      try {
        const response = await client.get<User[]>('/users');
        return response.data;
      } catch (error: unknown) {
        throw createUsersError(error);
      }
    },

    async createUser(input) {
      try {
        const response = await client.post<User>('/users', input);
        return response.data;
      } catch (error: unknown) {
        throw createUsersError(error);
      }
    },

    async updateUserRole(id, role) {
      try {
        const response = await client.patch<User>(`/users/${id}/role`, { role });
        return response.data;
      } catch (error: unknown) {
        throw createUsersError(error);
      }
    },

    async updateUserAuthor(id, authorId) {
      try {
        const response = await client.patch<User>(`/users/${id}/author`, { authorId });
        return response.data;
      } catch (error: unknown) {
        throw createUsersError(error);
      }
    },
  };
}

export const usersApi = createUsersApi();
