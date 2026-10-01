import axios, { type AxiosError } from 'axios';

export interface NewsListItem {
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
}

export interface RichTextBlock {
  type: 'paragraph' | 'heading' | 'list' | 'image';
  text?: string;
  items?: string[];
  url?: string;
  alt?: string;
}

export interface NewsDetail extends NewsListItem {
  body: RichTextBlock[];
  category: { id: string; name: string; slug: string };
  author: { id: string; name: string; bio: string | null; photoUrl: string | null };
  tags: Array<{ id: string; name: string; slug: string }>;
}

export interface Paginated<T> {
  items: T[];
  page: number;
  size: number;
  total: number;
}

export interface ListNewsParams {
  page?: number;
  size?: number;
  category?: string;
  q?: string;
  tag?: string;
  author?: string;
  from?: string;
  to?: string;
}

export interface PublicTaxonomyItem {
  id: string;
  name: string;
  slug: string;
}

export interface SiteSettings {
  siteName: string;
  description: string;
  logoUrl: string | null;
}

interface ApiHttpClient {
  get(
    url: string,
    config?: { params?: Record<string, string | number> },
  ): Promise<{ data: unknown }>;
  post(url: string): Promise<{ data: unknown }>;
}

function createAxiosHttpClient(baseUrl: string): ApiHttpClient {
  const client = axios.create({
    baseURL: baseUrl,
    timeout: 10_000,
    withCredentials: true,
    headers: {
      Accept: 'application/json',
    },
  });

  return {
    get(url: string, config?: { params?: Record<string, string | number> }) {
      return client.get(url, config);
    },
    post(url: string) {
      return client.post(url);
    },
  };
}

function createApiError(error: unknown, baseUrl: string): Error {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    const responseMessage = getResponseMessage(error);
    const message = responseMessage ?? error.message;
    const statusText = status === undefined ? '' : ` ${status}`;

    return new Error(`API error${statusText} (${baseUrl}): ${message}`, {
      cause: error,
    });
  }

  if (error instanceof Error) {
    return new Error(`API error (${baseUrl}): ${error.message}`, {
      cause: error,
    });
  }

  return new Error(`API error (${baseUrl}): Unknown API error`);
}

function getResponseMessage(error: AxiosError<unknown>): string | undefined {
  const data = error.response?.data;

  if (typeof data === 'string' && data.length > 0) {
    return data;
  }

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

export function createApiClient(
  baseUrl: string,
  httpClient: ApiHttpClient = createAxiosHttpClient(baseUrl),
) {
  return {
    async listNews(params: ListNewsParams): Promise<Paginated<NewsListItem>> {
      const query = {
        page: String(params.page ?? 1),
        size: String(params.size ?? 20),
      };

      if (params.category) {
        Object.assign(query, { category: params.category });
      }
      for (const key of ["q", "tag", "author", "from", "to"] as const) {
        if (params[key]) {
          Object.assign(query, { [key]: params[key] });
        }
      }

      try {
        const response = await httpClient.get('/public/news', {
          params: query,
        });
        return response.data as Paginated<NewsListItem>;
      } catch (error: unknown) {
        throw createApiError(error, baseUrl);
      }
    },

    async getNewsBySlug(slug: string): Promise<NewsDetail | null> {
      try {
        const response = await httpClient.get(
          `/public/news/${encodeURIComponent(slug)}`,
        );
        return response.data as NewsDetail;
      } catch (error: unknown) {
        if (axios.isAxiosError(error) && error.response?.status === 404) {
          return null;
        }

        throw createApiError(error, baseUrl);
      }
    },

    async refreshAccessToken(): Promise<{ accessToken: string }> {
      try {
        const response = await httpClient.post('/auth/refresh');
        return response.data as { accessToken: string };
      } catch (error: unknown) {
        throw createApiError(error, baseUrl);
      }
    },

    async getSettings(): Promise<SiteSettings> {
      try {
        const response = await httpClient.get('/public/settings');
        return response.data as SiteSettings;
      } catch (error: unknown) {
        throw createApiError(error, baseUrl);
      }
    },

    async listCategories(): Promise<PublicTaxonomyItem[]> {
      try {
        const response = await httpClient.get('/categories');
        return response.data as PublicTaxonomyItem[];
      } catch (error: unknown) {
        throw createApiError(error, baseUrl);
      }
    },

    async listTags(): Promise<PublicTaxonomyItem[]> {
      try {
        const response = await httpClient.get('/tags');
        return response.data as PublicTaxonomyItem[];
      } catch (error: unknown) {
        throw createApiError(error, baseUrl);
      }
    },
  };
}

export const api = createApiClient(
  process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3001',
);
