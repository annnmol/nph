import { z } from 'zod'
import { mobileSession } from '../store/mobile-session.ts'
import type { Catalog, Episode, EpisodePage, Provider, SearchResult, TitleDetails } from '../types/api.ts'
import { ApiError } from './http/api-error.ts'
import { http } from './http/request.ts'
import { acceptCatalog, expireSession, readMobileHome } from './mobile-home.ts'
import { episodeSchema, episodesSchema, searchSchema, statusSchema, titleSchema } from './schemas.ts'

function parse<T>(schema: z.ZodType<T>, value: unknown): T {
  const parsed = schema.safeParse(value)
  if (!parsed.success) throw new ApiError('the service returned an unexpected response.', 502, 'RESPONSE_FORMAT')
  return parsed.data
}

async function catalog(signal?: AbortSignal, refresh = false): Promise<Catalog> {
  if (mobileSession.status.phase !== 'verified') throw new ApiError('Please connect first.', 401, 'VERIFICATION_REQUIRED')
  if (Date.now() > mobileSession.status.expiresAt) expireSession()
  if (refresh || !mobileSession.catalog || Date.now() - mobileSession.catalogLoadedAt > 5 * 60_000) {
    acceptCatalog(await readMobileHome(signal))
  }
  return mobileSession.catalog!
}

async function ajax(path: string, params: Record<string, string | number | boolean>, signal?: AbortSignal) {
  await catalog(signal)
  const response = await http.get<unknown>(path, {
    params: { ...params, t: mobileSession.pageTime },
    headers: { 'X-Requested-With': 'XMLHttpRequest' }, signal,
  })
  const status = statusSchema.safeParse(response)
  if (status.success && (status.data.status === 'n' || status.data.error === 'Invalid User')) expireSession()
  return response
}

function episode(item: z.output<typeof episodeSchema>): Episode {
  return { id: item.id, title: item.t, season: item.s, number: item.ep, duration: item.time }
}

export const catalogService = {
  home: (signal?: AbortSignal) => catalog(signal, true),
  async search(query: string, all: boolean, signal?: AbortSignal): Promise<SearchResult> {
    // Match the app's encodeURIComponent followed by normal query serialization.
    const data = parse(searchSchema, await ajax('/mobile/search.php', { s: encodeURIComponent(query), ADSearch: all }, signal))
    if (Array.isArray(data.searchResult)) {
      return { groups: [{ provider: 'netflix', items: data.searchResult.map((item) => ({ id: item.id, title: item.t, provider: 'netflix' })) }] }
    }
    const providers: Record<string, Provider> = { nf: 'netflix', pv: 'primevideo', hs: 'jiohotstar' }
    return { groups: Object.entries(data.searchResult).flatMap(([key, group]) => {
      const provider = providers[key]
      return provider ? [{ provider, items: group.r.map((item) => ({ id: item.id, title: item.t, provider })) }] : []
    }) }
  },
  async details(id: string, signal?: AbortSignal): Promise<TitleDetails> {
    const data = parse(titleSchema, await ajax('/mobile/post.php', { id }, signal))
    return {
      id, title: data.title, year: data.year, description: data.desc, type: data.type === 't' ? 'series' : 'movie',
      seasons: (data.season ?? []).map((season) => ({ id: season.id, number: season.s, episodes: season.ep })),
      episodes: (data.episodes ?? []).map(episode),
    }
  },
  async episodes(id: string, season: string, page: number, signal?: AbortSignal): Promise<EpisodePage> {
    const data = parse(episodesSchema, await ajax('/mobile/episodes.php', { series: id, s: season, page }, signal))
    return { items: data.episodes.map(episode), nextPage: data.nextPageShow ? data.nextPage ?? null : null }
  },
}
