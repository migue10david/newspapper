import axios, { type AxiosInstance } from 'axios';
import { authenticatedApi } from './authenticated-api';
import type { SiteSettings } from './api';

export class SettingsApiError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = 'SettingsApiError';
  }
}

function toError(error: unknown): SettingsApiError {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data;
    const message =
      typeof data === 'object' && data !== null && 'message' in data
        ? Array.isArray(data.message)
          ? data.message.join(', ')
          : String(data.message)
        : error.message;
    return new SettingsApiError(
      `Configuración API${error.response?.status ? ` ${error.response.status}` : ''}: ${message}`,
      error.response?.status,
      { cause: error },
    );
  }
  return new SettingsApiError(
    error instanceof Error ? error.message : 'Error inesperado de configuración',
    undefined,
    { cause: error },
  );
}

export function createSettingsApi(client: AxiosInstance = authenticatedApi) {
  return {
    async get(): Promise<SiteSettings> {
      try {
        return (await client.get<SiteSettings>('/public/settings')).data;
      } catch (error: unknown) {
        throw toError(error);
      }
    },
    async update(input: SiteSettings): Promise<SiteSettings> {
      try {
        return (await client.patch<SiteSettings>('/settings', input)).data;
      } catch (error: unknown) {
        throw toError(error);
      }
    },
  };
}

export const settingsApi = createSettingsApi();
