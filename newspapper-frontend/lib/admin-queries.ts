'use client';

import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { useAuthStore } from './auth-store';
import { authorsApi } from './authors-api';
import { newsApi, type NewsSearchParams, type NewsStatus } from './news-api';
import { settingsApi } from './settings-api';
import {
  interactionsApi,
  type CommentStatus,
  type ManageCommentsParams,
} from './interactions-api';
import {
  taxonomyApi,
  type TaxonomyInput,
  type TaxonomyKind,
} from './taxonomy-api';
import {
  usersApi,
  type CreateUserInput,
  type UserRole,
} from './users-api';

const adminQueryKeys = {
  news: (status?: NewsStatus) => ['admin', 'news', { status }] as const,
  newsSearch: (params: NewsSearchParams) => ['admin', 'news-search', params] as const,
  newsDetail: (id: string) => ['admin', 'news', id] as const,
  categories: ['admin', 'categories'] as const,
  authors: ['admin', 'authors'] as const,
  users: ['admin', 'users'] as const,
  taxonomy: (kind: TaxonomyKind, page: number, size: number, search: string) =>
    ['admin', 'taxonomy', kind, { page, size, search }] as const,
  settings: ['admin', 'settings'] as const,
  comments: (params: ManageCommentsParams) => ['admin', 'comments', params] as const,
};

function useAuthenticatedQueryOptions() {
  const isInitialized = useAuthStore((state) => state.isInitialized);
  const accessToken = useAuthStore((state) => state.accessToken);
  return { enabled: isInitialized && Boolean(accessToken) };
}

export function useManagedNews(status?: NewsStatus) {
  return useQuery({
    queryKey: adminQueryKeys.news(status),
    queryFn: () => newsApi.listNews(status),
    ...useAuthenticatedQueryOptions(),
  });
}

export function useManagedNewsSearch(params: NewsSearchParams) {
  return useQuery({
    queryKey: adminQueryKeys.newsSearch(params),
    queryFn: () => newsApi.manageNews(params),
    ...useAuthenticatedQueryOptions(),
  });
}

export function useManagedNewsDetail(id: string) {
  const authOptions = useAuthenticatedQueryOptions();
  return useQuery({
    queryKey: adminQueryKeys.newsDetail(id),
    queryFn: () => newsApi.getNews(id),
    enabled: Boolean(id) && authOptions.enabled,
  });
}

export function useAdminCategories() {
  return useQuery({
    queryKey: adminQueryKeys.categories,
    queryFn: () => taxonomyApi.listCategories(),
    ...useAuthenticatedQueryOptions(),
  });
}

export function useAdminTags() {
  return useQuery({
    queryKey: ['admin', 'tags'] as const,
    queryFn: () => taxonomyApi.listTags(),
    ...useAuthenticatedQueryOptions(),
  });
}

export function useAdminUsers() {
  return useQuery({
    queryKey: adminQueryKeys.users,
    queryFn: () => usersApi.listUsers(),
    ...useAuthenticatedQueryOptions(),
  });
}

export function useAdminAuthors() {
  return useQuery({
    queryKey: adminQueryKeys.authors,
    queryFn: () => authorsApi.listAuthors(),
    ...useAuthenticatedQueryOptions(),
  });
}

export function useAdminTaxonomy(
  kind: TaxonomyKind,
  params: { page: number; size: number; search: string },
) {
  return useQuery({
    queryKey: adminQueryKeys.taxonomy(kind, params.page, params.size, params.search),
    queryFn: () => taxonomyApi.manage(kind, {
      page: params.page,
      size: params.size,
      ...(params.search ? { search: params.search } : {}),
    }),
    ...useAuthenticatedQueryOptions(),
  });
}

export function useAdminSettings() {
  return useQuery({
    queryKey: adminQueryKeys.settings,
    queryFn: () => settingsApi.get(),
    ...useAuthenticatedQueryOptions(),
  });
}

export function useAdminComments(params: ManageCommentsParams) {
  return useQuery({
    queryKey: adminQueryKeys.comments(params),
    queryFn: () => interactionsApi.listManageComments(params),
    ...useAuthenticatedQueryOptions(),
  });
}

export function useModerateCommentMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status, version }: { id: string; status: CommentStatus; version: number }) =>
      interactionsApi.moderateComment(id, { status, version }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'comments'] }),
  });
}

export function useCreateNewsMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: newsApi.createNews,
    onSuccess: (news) => {
      queryClient.setQueryData(adminQueryKeys.newsDetail(news.id), news);
      void queryClient.invalidateQueries({ queryKey: ['admin', 'news'] });
      void queryClient.invalidateQueries({ queryKey: ['admin', 'news-search'] });
    },
  });
}

export function useUpdateNewsMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Parameters<typeof newsApi.updateNews>[1] }) =>
      newsApi.updateNews(id, input),
    onSuccess: (news) => {
      queryClient.setQueryData(adminQueryKeys.newsDetail(news.id), news);
      void queryClient.invalidateQueries({ queryKey: ['admin', 'news'] });
      void queryClient.invalidateQueries({ queryKey: ['admin', 'news-search'] });
    },
  });
}

export function useTransitionNewsMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, target, version }: { id: string; target: NewsStatus; version: number }) =>
      newsApi.transitionNews(id, target, version),
    onSuccess: (news) => {
      queryClient.setQueryData(adminQueryKeys.newsDetail(news.id), news);
      void queryClient.invalidateQueries({ queryKey: ['admin', 'news'] });
      void queryClient.invalidateQueries({ queryKey: ['admin', 'news-search'] });
    },
  });
}

export function useCreateUserMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateUserInput) => usersApi.createUser(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: adminQueryKeys.users }),
  });
}

export function useUpdateUserRoleMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, role }: { id: string; role: UserRole }) => usersApi.updateUserRole(id, role),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: adminQueryKeys.users }),
  });
}

export function useUpdateUserAuthorMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, authorId }: { id: string; authorId: string | null }) =>
      usersApi.updateUserAuthor(id, authorId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: adminQueryKeys.users }),
  });
}

export function useTaxonomyMutation() {
  const queryClient = useQueryClient();
  return {
    create: useMutation({
      mutationFn: ({ kind, input }: { kind: TaxonomyKind; input: TaxonomyInput }) =>
        taxonomyApi.create(kind, input),
      onSuccess: (_, variables) => queryClient.invalidateQueries({ queryKey: ['admin', 'taxonomy', variables.kind] }),
    }),
    update: useMutation({
      mutationFn: ({ kind, id, input }: { kind: TaxonomyKind; id: string; input: TaxonomyInput }) =>
        taxonomyApi.update(kind, id, input),
      onSuccess: (_, variables) => queryClient.invalidateQueries({ queryKey: ['admin', 'taxonomy', variables.kind] }),
    }),
    remove: useMutation({
      mutationFn: ({ kind, id }: { kind: TaxonomyKind; id: string }) => taxonomyApi.remove(kind, id),
      onSuccess: (_, variables) => queryClient.invalidateQueries({ queryKey: ['admin', 'taxonomy', variables.kind] }),
    }),
  };
}

export function useUpdateSettingsMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: settingsApi.update,
    onSuccess: (settings) => {
      queryClient.setQueryData(adminQueryKeys.settings, settings);
    },
  });
}

export { adminQueryKeys };
