export const queryKeys = {
  session: ['session'] as const,
  catalog: ['catalog'] as const,
  search: (query: string, all: boolean) => ['search', query, all] as const,
  details: (id: string) => ['title', id] as const,
  episodes: (id: string, season: string) => ['episodes', id, season] as const,
}
