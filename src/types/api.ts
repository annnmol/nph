export type SessionPhase = 'idle' | 'verification' | 'waiting' | 'verified' | 'expired'

export interface SessionStatus {
  phase: SessionPhase
  message: string
  nextCheckAt: number | null
  expiresAt: number
  verificationUrl: string | null
}

export type Provider = 'netflix' | 'primevideo' | 'jiohotstar'

export interface CatalogTitle {
  id: string
  title: string
  provider: Provider
}

export interface CatalogRow {
  title: string
  items: CatalogTitle[]
}

export interface Catalog {
  rows: CatalogRow[]
}

export interface SearchResult {
  groups: { provider: Provider; items: CatalogTitle[] }[]
}

export interface Episode {
  id: string
  title: string
  season: string
  number: string
  duration: string
}

export interface TitleDetails {
  id: string
  title: string
  year: string
  description: string
  type: 'movie' | 'series'
  seasons: { id: string; number: string; episodes: number }[]
  episodes: Episode[]
}

export interface EpisodePage {
  items: Episode[]
  nextPage: number | null
}

