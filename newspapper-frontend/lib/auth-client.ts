import axios, { type AxiosError, type AxiosInstance } from 'axios';

export type UserRole = 'author' | 'editor' | 'admin';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
}

export interface RegisterCredentials {
  email: string;
  password: string;
}

export interface RegisterResponse {
  id: string;
  email: string;
  role: 'author';
}

const baseUrl =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3001';

const authHttpClient = axios.create({
  baseURL: baseUrl,
  timeout: 10_000,
  withCredentials: true,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
});

export interface AuthClient {
  login(credentials: LoginCredentials): Promise<AuthResponse>;
  register(credentials: RegisterCredentials): Promise<RegisterResponse>;
  refreshAccessToken(): Promise<AuthResponse>;
  logout(): Promise<void>;
}

export class AuthApiError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = 'AuthApiError';
  }
}

function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const responseMessage = getResponseMessage(error);
    return responseMessage ?? error.message;
  }

  return error instanceof Error ? error.message : 'Unexpected authentication error';
}

function getResponseMessage(error: AxiosError<unknown>): string | undefined {
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

  return undefined;
}

function createAuthError(error: unknown): AuthApiError {
  const status = axios.isAxiosError(error) ? error.response?.status : undefined;
  const statusText = status === undefined ? '' : ` ${status}`;

  return new AuthApiError(
    `Authentication error${statusText} (${baseUrl}): ${getErrorMessage(error)}`,
    status,
    { cause: error },
  );
}

export function createAuthClient(client: AxiosInstance = authHttpClient): AuthClient {
  return {
    async login(credentials) {
      try {
        const response = await client.post<AuthResponse>('/auth/login', credentials);
        return response.data;
      } catch (error: unknown) {
        throw createAuthError(error);
      }
    },

    async register(credentials) {
      try {
        const response = await client.post<RegisterResponse>(
          '/auth/register',
          credentials,
        );
        return response.data;
      } catch (error: unknown) {
        throw createAuthError(error);
      }
    },

    async refreshAccessToken() {
      try {
        const response = await client.post<AuthResponse>('/auth/refresh');
        return response.data;
      } catch (error: unknown) {
        throw createAuthError(error);
      }
    },

    async logout() {
      try {
        await client.post('/auth/logout');
      } catch (error: unknown) {
        throw createAuthError(error);
      }
    },
  };
}

export const authClient = createAuthClient();
