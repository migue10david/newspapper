'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from './auth-store';
import { engagementApi, type EngagementParams } from './engagement-api';

export const engagementQueryKeys = {
  saved: (params: EngagementParams) => ['engagement', 'saved', params] as const,
  history: (params: EngagementParams) => ['engagement', 'history', params] as const,
};

function useReaderQueryEnabled(): boolean {
  const isInitialized = useAuthStore((state) => state.isInitialized);
  const accessToken = useAuthStore((state) => state.accessToken);
  return isInitialized && Boolean(accessToken);
}

export function useSavedNews(params: EngagementParams = {}) {
  const enabled = useReaderQueryEnabled();
  return useQuery({
    queryKey: engagementQueryKeys.saved(params),
    queryFn: () => engagementApi.listSavedNews(params),
    enabled,
  });
}

export function useReadingHistory(params: EngagementParams = {}) {
  const enabled = useReaderQueryEnabled();
  return useQuery({
    queryKey: engagementQueryKeys.history(params),
    queryFn: () => engagementApi.listReadingHistory(params),
    enabled,
  });
}

export function useSaveNewsMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (newsId: string) => engagementApi.saveNews(newsId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['engagement', 'saved'] }),
  });
}

export function useRemoveSavedNewsMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (newsId: string) => engagementApi.removeSavedNews(newsId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['engagement', 'saved'] }),
  });
}

export function useRecordReadingMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (newsId: string) => engagementApi.recordReading(newsId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['engagement', 'history'] }),
  });
}

export function useRemoveReadingHistoryMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (newsId: string) => engagementApi.removeReadingHistory(newsId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['engagement', 'history'] }),
  });
}

export function useClearReadingHistoryMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => engagementApi.clearReadingHistory(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['engagement', 'history'] }),
  });
}
