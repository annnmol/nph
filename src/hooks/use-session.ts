import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { sessionService } from '../services/session.ts'
import { queryKeys } from '../store/query-keys.ts'
import type { SessionStatus } from '../types/api.ts'

export function useSession() {
  const client = useQueryClient()
  const session = useQuery({
    queryKey: queryKeys.session,
    queryFn: ({ signal }) => {
      const previous = client.getQueryData<SessionStatus>(queryKeys.session)
      return previous?.phase === 'waiting' ? sessionService.check(signal) : sessionService.status()
    },
    staleTime: 0,
    retry: false,
    refetchOnMount: false,
    refetchInterval: (query) => {
      const status = query.state.data
      if (query.state.error || status?.phase !== 'waiting') return false
      return Math.max(1000, (status.nextCheckAt ?? Date.now() + 2000) - Date.now())
    },
  })
  const start = useMutation({
    mutationFn: () => sessionService.start(),
    onSuccess: (status) => client.setQueryData(queryKeys.session, status),
  })
  const reset = useMutation({
    mutationFn: async () => {
      await client.cancelQueries()
      await sessionService.reset()
      return sessionService.status()
    },
    onSuccess: (status) => {
      client.removeQueries({ predicate: (query) => query.queryKey[0] !== 'session' })
      client.setQueryData(queryKeys.session, status)
      start.reset()
    },
  })
  const beginVerification = () => client.setQueryData(queryKeys.session, sessionService.beginWait())
  return { session, start, reset, beginVerification }
}
