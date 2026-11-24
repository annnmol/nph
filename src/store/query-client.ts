import { QueryCache, QueryClient } from '@tanstack/react-query'
import { ApiError } from '../services/http/api-error.ts'
import { queryKeys } from './query-keys.ts'

export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError(error, query) {
      if (error instanceof ApiError && error.status === 401 && query.queryKey[0] !== 'session') {
        queryClient.removeQueries({ predicate: (entry) => entry.queryKey[0] !== 'session' })
        void queryClient.invalidateQueries({ queryKey: queryKeys.session })
      }
    },
  }),
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      gcTime: 5 * 60_000,
      refetchOnWindowFocus: false,
      retry: (count, error) => count < 1 && error instanceof ApiError && (error.status === 0 || error.status >= 502),
    },
    mutations: { retry: false },
  },
})
