import axios, {
  type AxiosInstance,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from 'axios';
import { useAuthStore, type AuthState } from './auth-store';

type RetriableRequestConfig = InternalAxiosRequestConfig & {
  _authRetry?: boolean;
};

const baseUrl =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3001';

let refreshPromise: Promise<boolean> | null = null;

type AuthStore = {
  getState: () => Pick<AuthState, 'accessToken' | 'refresh'>;
};

function refreshSession(store: AuthStore): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = store
      .getState()
      .refresh()
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
}

function isAuthenticationEndpoint(url?: string): boolean {
  return url?.startsWith('/auth/') ?? false;
}

export function createAuthenticatedApiClient(
  client: AxiosInstance = axios.create({
    baseURL: baseUrl,
    timeout: 10_000,
    withCredentials: true,
    headers: { Accept: 'application/json' },
  }),
  store: AuthStore = useAuthStore,
) {
  client.interceptors.request.use((config) => {
    const accessToken = store.getState().accessToken;

    if (accessToken) {
      config.headers.set('Authorization', `Bearer ${accessToken}`);
    }

    return config;
  });

  client.interceptors.response.use(
    (response) => response,
    async (error: unknown) => {
      if (!axios.isAxiosError(error)) {
        throw error;
      }

      const requestConfig = error.config as RetriableRequestConfig | undefined;

      if (
        error.response?.status !== 401 ||
        !requestConfig ||
        requestConfig._authRetry ||
        isAuthenticationEndpoint(requestConfig.url)
      ) {
        throw error;
      }

      requestConfig._authRetry = true;

      if (!(await refreshSession(store))) {
        if (typeof window !== 'undefined') {
          window.location.replace('/admin/login');
        }
        throw error;
      }

      return client.request(requestConfig as AxiosRequestConfig);
    },
  );

  return client;
}

export const authenticatedApi = createAuthenticatedApiClient();
