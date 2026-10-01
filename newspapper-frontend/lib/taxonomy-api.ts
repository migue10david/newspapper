import axios, { type AxiosInstance } from 'axios';
import { authenticatedApi } from './authenticated-api';

export interface TaxonomyItem {
  id: string;
  name: string;
  slug: string;
}

export interface PaginatedTaxonomy {
  items: TaxonomyItem[];
  page: number;
  size: number;
  total: number;
}

export type TaxonomyKind = 'categories' | 'tags';

export interface TaxonomyInput {
  name: string;
  slug: string;
}

export class TaxonomyApiError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = 'TaxonomyApiError';
  }
}

function toError(error: unknown): TaxonomyApiError {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data;
    const message =
      typeof data === 'object' && data !== null && 'message' in data
        ? Array.isArray(data.message)
          ? data.message.join(', ')
          : String(data.message)
        : error.message;
    return new TaxonomyApiError(
      `Catálogo API${error.response?.status ? ` ${error.response.status}` : ''}: ${message}`,
      error.response?.status,
      { cause: error },
    );
  }
  return new TaxonomyApiError(
    error instanceof Error ? error.message : 'Error inesperado del catálogo',
    undefined,
    { cause: error },
  );
}

function resource(kind: TaxonomyKind): string {
  return kind === 'categories' ? 'categories' : 'tags';
}

export function createTaxonomyApi(client: AxiosInstance = authenticatedApi) {
  return {
    async listCategories(): Promise<TaxonomyItem[]> {
      try {
        return (await client.get<TaxonomyItem[]>('/categories')).data;
      } catch (error: unknown) {
        throw toError(error);
      }
    },
    async listTags(): Promise<TaxonomyItem[]> {
      try {
        return (await client.get<TaxonomyItem[]>('/tags')).data;
      } catch (error: unknown) {
        throw toError(error);
      }
    },
    async manage(
      kind: TaxonomyKind,
      params: { page: number; size: number; search?: string },
    ): Promise<PaginatedTaxonomy> {
      try {
        return (
          await client.get<PaginatedTaxonomy>(`/${resource(kind)}/manage`, {
            params,
          })
        ).data;
      } catch (error: unknown) {
        throw toError(error);
      }
    },
    async create(kind: TaxonomyKind, input: TaxonomyInput): Promise<TaxonomyItem> {
      try {
        return (await client.post<TaxonomyItem>(`/${resource(kind)}`, input)).data;
      } catch (error: unknown) {
        throw toError(error);
      }
    },
    async update(
      kind: TaxonomyKind,
      id: string,
      input: TaxonomyInput,
    ): Promise<TaxonomyItem> {
      try {
        return (await client.patch<TaxonomyItem>(`/${resource(kind)}/${id}`, input)).data;
      } catch (error: unknown) {
        throw toError(error);
      }
    },
    async remove(kind: TaxonomyKind, id: string): Promise<void> {
      try {
        await client.delete(`/${resource(kind)}/${id}`);
      } catch (error: unknown) {
        throw toError(error);
      }
    },
  };
}

export const taxonomyApi = createTaxonomyApi();
