import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { catalogService } from '../services/catalog.ts'
import { queryKeys } from '../store/query-keys.ts'
import { mobileSession } from '../store/mobile-session.ts'

export function useCatalog() {
  return useQuery({
    queryKey: queryKeys.catalog,
    queryFn: ({ signal }) => catalogService.home(signal),
    initialData: mobileSession.catalog ?? undefined,
    initialDataUpdatedAt: mobileSession.catalogLoadedAt,
    staleTime: 5 * 60_000,
  })
}

export function useCatalogSearch(query: string, all: boolean) {
  return useQuery({ queryKey: queryKeys.search(query, all), queryFn: ({ signal }) => catalogService.search(query, all, signal), enabled: !!query })
}

export function useTitle(id: string) {
  return useQuery({ queryKey: queryKeys.details(id), queryFn: ({ signal }) => catalogService.details(id, signal) })
}

export function useEpisodes(id: string, season: string) {
  return useInfiniteQuery({
    queryKey: queryKeys.episodes(id, season),
    queryFn: ({ signal, pageParam }) => catalogService.episodes(id, season, pageParam, signal),
    initialPageParam: 1,
    getNextPageParam: (last) => last.nextPage,
    enabled: !!season,
  })
}
