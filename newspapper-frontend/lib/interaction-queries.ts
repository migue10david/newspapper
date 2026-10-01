'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { interactionsApi } from './interactions-api';

export const interactionQueryKeys = {
  public: (slug: string) => ['public', 'interactions', slug] as const,
};

export function usePublicInteractions(slug: string) {
  return useQuery({
    queryKey: interactionQueryKeys.public(slug),
    queryFn: () => interactionsApi.getPublic(slug),
    enabled: Boolean(slug),
    staleTime: 15_000,
    retry: 1,
  });
}

export function useCreateComment(slug: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ newsId, body }: { newsId: string; body: string }) =>
      interactionsApi.createComment(newsId, body),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: interactionQueryKeys.public(slug) }),
  });
}

export function useUpdateComment(slug: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body, version }: { id: string; body: string; version: number }) =>
      interactionsApi.updateComment(id, { body, version }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: interactionQueryKeys.public(slug) }),
  });
}

export function useRemoveComment(slug: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => interactionsApi.removeComment(id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: interactionQueryKeys.public(slug) }),
  });
}

export function useSetReaction(slug: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ newsId, type }: { newsId: string; type: 'like' | 'useful' }) =>
      interactionsApi.setReaction(newsId, type),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: interactionQueryKeys.public(slug) }),
  });
}

export function useRemoveReaction(slug: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (newsId: string) => interactionsApi.removeReaction(newsId),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: interactionQueryKeys.public(slug) }),
  });
}
